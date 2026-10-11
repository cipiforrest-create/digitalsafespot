import { createHash, randomUUID } from 'node:crypto';
import {
  EXECUTION_PREVIEW_VERSION, MAX_PLAN_STEPS, MAX_CHANGES,
  executionIntentSchema, executionPlanSchema, changeSetSchema, approvalRequestSchema, previewReceiptSchema,
  type ExecutionRequest, type ExecutionIntent, type ExecutionPlan, type ChangeSet, type ProposedChange,
  type ApprovalRequest, type PreviewReceipt, type ExecutionPreviewCard,
  type ExecutionOperation, type SideEffectLevel, type ApprovalLevel, type RiskLevel, type ChangeKind,
} from '../../shared/execution';
import { stripUnsafe } from './guards';
import { isCapabilityId, type CapabilityId } from '../../shared/capabilities';

// P3a Interactive Execution Preview backbone. PREVIEW ONLY. This module turns a sanitized ExecutionRequest into a
// deterministic ExecutionIntent → ExecutionPlan → ChangeSet, freezes them into an ApprovalRequest bound by hash,
// and emits a PreviewReceipt. It NEVER performs the proposed operation: `executeApprovedChangeSet` is the single
// privileged entry point and it is disabled (throws ExecutionBoundaryError) until P3b implements guarded execution.

/** Thrown whenever anything tries to actually execute a change from within the P3a preview stage. */
export class ExecutionBoundaryError extends Error {
  constructor(message = 'Execution is not permitted in the preview stage (P3a).') {
    super(message);
    this.name = 'ExecutionBoundaryError';
  }
}

// Canonical, key-sorted hash so equivalent artifacts hash equally (idempotency) and any change invalidates the
// binding. Identical technique to solution-architect.ts `canonical`, kept local so the modules stay decoupled.
function canonical(v: unknown): unknown {
  return Array.isArray(v) ? v.map(canonical)
    : v && typeof v === 'object'
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, x]) => [k, canonical(x)]))
      : v;
}
function hashOf(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('base64url').slice(0, 32);
}

// Deterministic side-effect classification per operation. This is the single source of truth for "how risky" an
// operation is; risk, reversibility and approval level all derive from it, never from client input or the model.
const OPERATION_PROFILE: Record<ExecutionOperation, { side: SideEffectLevel; reversible: boolean; kind: ChangeKind }> = {
  copy_change:        { side: 'preview',        reversible: true,  kind: 'text_replace' },
  ui_change:          { side: 'preview',        reversible: true,  kind: 'component_change' },
  file_patch:         { side: 'external_write', reversible: true,  kind: 'file_patch' },
  config_change:      { side: 'external_write', reversible: true,  kind: 'config_change' },
  cms_draft:          { side: 'preview',        reversible: true,  kind: 'cms_draft' },
  seo_metadata:       { side: 'external_write', reversible: true,  kind: 'seo_metadata' },
  asset_generation:   { side: 'preview',        reversible: true,  kind: 'asset' },
  provider_request:   { side: 'external_write', reversible: true,  kind: 'provider_operation' },
  deployment_preview: { side: 'destructive',    reversible: false, kind: 'config_change' },
  // P3d lead.create: a real external write (it durably persists a new lead record), so it is medium risk and needs
  // OWNER approval — never 'none'. It is reversible via soft-delete rollback, so it is not classified high/destructive.
  lead_create:        { side: 'external_write', reversible: true,  kind: 'lead_record' },
};

function riskFor(side: SideEffectLevel, reversible: boolean): RiskLevel {
  if (side === 'destructive' || !reversible) return 'high';
  if (side === 'external_write') return 'medium';
  return 'low';
}
function approvalFor(risk: RiskLevel): ApprovalLevel {
  return risk === 'high' ? 'privileged' : risk === 'medium' ? 'owner' : 'none';
}

/**
 * Server-side derivation of the operation's side-effect/reversibility/risk/approval profile. P3b re-derives these
 * from the operation alone (never trusting the intent's stored fields) so a tampered approval tier can never widen
 * what may execute. This is the single source of truth shared by preview (P3a) and controlled execution (P3b).
 */
export function deriveOperationProfile(operation: ExecutionOperation): { side: SideEffectLevel; reversible: boolean; risk: RiskLevel; approvalLevel: ApprovalLevel } {
  const profile = OPERATION_PROFILE[operation];
  const risk = riskFor(profile.side, profile.reversible);
  return { side: profile.side, reversible: profile.reversible, risk, approvalLevel: approvalFor(risk) };
}

export type IntentBuildInput = { request: ExecutionRequest; capability?: CapabilityId | null; contextRefs?: string[]; constraints?: string[]; now?: number };

/**
 * Build a deterministic ExecutionIntent from a sanitized request. All free text is stripped of markup and capped.
 * risk/reversibility/approvalLevel are DERIVED from the operation profile — the client cannot set them. An unknown
 * capability id is dropped (null) rather than trusted, mirroring the SolutionMap "never invent a capability" rule.
 */
export function buildIntent(input: IntentBuildInput): ExecutionIntent {
  const { request } = input;
  const profile = OPERATION_PROFILE[request.operation];
  const risk = riskFor(profile.side, profile.reversible);
  const objective = stripUnsafe(request.objective).slice(0, 600).trim();
  const target = stripUnsafe(request.target).slice(0, 200).trim();
  const capability = input.capability && isCapabilityId(input.capability) ? input.capability : null;
  const sourceHash = hashOf({ v: EXECUTION_PREVIEW_VERSION, objective, target, operation: request.operation, goal: request.goal ?? null });
  const intent = {
    v: 1 as const,
    id: randomUUID(),
    version: EXECUTION_PREVIEW_VERSION,
    objective: objective || target,
    target: target || objective,
    operation: request.operation,
    goal: request.goal ?? null,
    contextRefs: (input.contextRefs ?? []).map(r => r.slice(0, 8)).filter(Boolean).slice(0, 12),
    constraints: (input.constraints ?? []).map(c => stripUnsafe(c).slice(0, 200)).filter(Boolean).slice(0, 8),
    expectedResult: `Preview of ${request.operation} on ${target || objective}.`.slice(0, 400),
    risk,
    reversible: profile.reversible,
    capability,
    approvalLevel: approvalFor(risk),
    sourceHash,
    createdAt: input.now ?? Date.now(),
  };
  return executionIntentSchema.parse(intent);
}

/**
 * Turn an intent into a deterministic 3-step plan: prepare → produce the proposed change → present for review.
 * Only the middle step carries the operation's real side-effect level; the surrounding steps are preview-safe.
 * The step count is bounded and every step is reversible unless the operation profile says otherwise.
 */
export function buildPlan(intent: ExecutionIntent, now = Date.now()): ExecutionPlan {
  const profile = OPERATION_PROFILE[intent.operation];
  const clip = (s: string) => s.slice(0, 200);
  const objectiveInput = clip(intent.objective);
  const produceInputs = [objectiveInput, ...intent.constraints.map(clip)].slice(0, 8);
  const steps = [
    {
      id: 'S1', description: `Inspect ${intent.target} and gather the context for ${intent.operation}.`.slice(0, 300),
      target: intent.target, actionType: intent.operation, inputs: [objectiveInput],
      expectedOutput: 'A verified snapshot of the current state.', sideEffect: 'none' as SideEffectLevel,
      reversible: true, approval: 'none' as ApprovalLevel, dependsOn: [] as string[],
    },
    {
      id: 'S2', description: `Produce the proposed ${intent.operation} as a reviewable change.`.slice(0, 300),
      target: intent.target, actionType: intent.operation, inputs: produceInputs,
      expectedOutput: 'A concrete proposed change with before/after.', sideEffect: profile.side,
      reversible: profile.reversible, approval: intent.approvalLevel, dependsOn: ['S1'],
    },
    {
      id: 'S3', description: 'Present the change for explicit review and approval.',
      target: intent.target, actionType: intent.operation, inputs: ['S2 output'],
      expectedOutput: 'An approval decision bound to the exact change.', sideEffect: 'preview' as SideEffectLevel,
      reversible: true, approval: intent.approvalLevel, dependsOn: ['S2'],
    },
  ].slice(0, MAX_PLAN_STEPS);
  return executionPlanSchema.parse({ v: 1, id: randomUUID(), version: EXECUTION_PREVIEW_VERSION, intentId: intent.id, steps, createdAt: now });
}


export type ChangeInput = { target: string; summary: string; before?: string | null; after?: string | null };

/**
 * Build a deterministic ChangeSet from the plan's producing step (S2) and one or more proposed changes. Change
 * text is sanitized and capped. Every change is tied to a plan step id so the UI can trace a change to its step.
 * Nothing here is applied — a ChangeSet is a proposal.
 */
export function buildChangeSet(intent: ExecutionIntent, plan: ExecutionPlan, changes: ChangeInput[], now = Date.now()): ChangeSet {
  const profile = OPERATION_PROFILE[intent.operation];
  const clip = (v: string | null | undefined) => (v == null ? null : stripUnsafe(v).slice(0, 2000));
  const built: ProposedChange[] = changes.slice(0, MAX_CHANGES).map((c, i) => ({
    id: `C${i + 1}`,
    kind: profile.kind,
    target: stripUnsafe(c.target).slice(0, 200) || intent.target,
    summary: stripUnsafe(c.summary).slice(0, 300),
    before: clip(c.before),
    after: clip(c.after),
    reversible: profile.reversible,
    stepId: 'S2',
  }));
  return changeSetSchema.parse({ v: 1, id: randomUUID(), version: EXECUTION_PREVIEW_VERSION, planId: plan.id, changes: built, createdAt: now });
}

/** Hash the exact plan content (excluding volatile ids/timestamps) so approval binds to what was reviewed. */
export function hashPlan(plan: ExecutionPlan): string {
  return hashOf({ v: plan.version, intentId: plan.intentId, steps: plan.steps });
}
/** Hash the exact change-set content (excluding volatile ids/timestamps). */
export function hashChangeSet(set: ChangeSet): string {
  return hashOf({ v: set.version, planId: set.planId, changes: set.changes });
}
/** Hash the exact intent content (excluding volatile id/timestamp). */
export function hashIntent(intent: ExecutionIntent): string {
  const { id: _id, createdAt: _createdAt, ...rest } = intent;
  return hashOf(rest);
}

/**
 * Freeze a plan + change set into a pending ApprovalRequest, binding to both by content hash. A later approval
 * decision is only valid if the plan/change set still hash to these values (see `decideApproval`).
 */
export function buildApprovalRequest(intent: ExecutionIntent, plan: ExecutionPlan, set: ChangeSet, now = Date.now()): ApprovalRequest {
  return approvalRequestSchema.parse({
    v: 1, id: randomUUID(), version: EXECUTION_PREVIEW_VERSION,
    intentId: intent.id, planId: plan.id, changeSetId: set.id,
    planHash: hashPlan(plan), changeSetHash: hashChangeSet(set),
    approvalLevel: intent.approvalLevel, state: 'pending', createdAt: now,
  });
}

/**
 * Record an approval decision. The decision is REJECTED unless the supplied plan/change set still hash to the
 * frozen values the request was built from — a mutated proposal can never be silently approved. Returns a new
 * request object (immutably) with the resolved state.
 */
export function decideApproval(request: ApprovalRequest, plan: ExecutionPlan, set: ChangeSet, approve: boolean): ApprovalRequest {
  const intact = hashPlan(plan) === request.planHash && hashChangeSet(set) === request.changeSetHash
    && plan.id === request.planId && set.id === request.changeSetId;
  const state = !intact ? 'rejected' : approve ? 'approved' : 'rejected';
  return approvalRequestSchema.parse({ ...request, state });
}

/** Deterministic risk lines for the receipt/card. Derived from the operation profile, never model-invented. */
function riskLines(intent: ExecutionIntent): string[] {
  const profile = OPERATION_PROFILE[intent.operation];
  const lines = [`Operation ${intent.operation} is classified ${intent.risk} risk.`];
  if (profile.side === 'destructive') lines.push('This operation is destructive and not reversible; it requires a privileged approval before any execution.');
  else if (profile.side === 'external_write') lines.push('This operation would write outside the preview; it requires owner approval before any execution.');
  else lines.push('This operation is preview-safe and does not write outside the preview in P3a.');
  if (!intent.reversible) lines.push('No automatic rollback is available for this operation.');
  return lines.slice(0, 8);
}

/**
 * Build the auditable PreviewReceipt. It records the exact hashes of the intent/plan/change set that were shown,
 * the counts, the derived risks and the approval state — enough for P3b to prove it executes only what was reviewed.
 */
export function buildPreviewReceipt(intent: ExecutionIntent, plan: ExecutionPlan, set: ChangeSet, approval: ApprovalRequest, now = Date.now()): PreviewReceipt {
  return previewReceiptSchema.parse({
    v: 1, id: randomUUID(), version: EXECUTION_PREVIEW_VERSION,
    intentId: intent.id, planId: plan.id, changeSetId: set.id, approvalId: approval.id,
    intentHash: hashIntent(intent), planHash: hashPlan(plan), changeSetHash: hashChangeSet(set),
    shown: { stepCount: plan.steps.length, changeCount: set.changes.length },
    risks: riskLines(intent), approvalState: approval.state, createdAt: now,
  });
}

/**
 * Project the whole preview into a bounded, visitor-safe card. Never exposes hashes or internal ids beyond the
 * short step/change ids. Every field is plain text; the client renders each with textContent so nothing injects markup.
 */
export function toPreviewCard(intent: ExecutionIntent, plan: ExecutionPlan, set: ChangeSet, approval: ApprovalRequest): ExecutionPreviewCard {
  return {
    objective: intent.objective,
    target: intent.target,
    operation: intent.operation,
    risk: intent.risk,
    reversible: intent.reversible,
    approvalLevel: intent.approvalLevel,
    approvalState: approval.state,
    steps: plan.steps.map(s => ({ id: s.id, description: s.description, sideEffect: s.sideEffect, reversible: s.reversible })),
    changes: set.changes.map(c => ({ id: c.id, kind: c.kind, target: c.target, summary: c.summary, before: c.before, after: c.after })),
    risks: riskLines(intent),
    expectedResult: intent.expectedResult,
  };
}

/**
 * The single privileged entry point for actually applying an approved change set. It is DISABLED in P3a and always
 * throws ExecutionBoundaryError. P3b will replace this body with guarded execution that first re-verifies the
 * approval hashes, enforces auth/RBAC, dry-run, idempotency, conflict detection, audit trail and rollback. Keeping
 * the interface here (rather than nowhere) gives P3b a single, testable seam and guarantees P3a cannot execute.
 */
export async function executeApprovedChangeSet(_approval: ApprovalRequest, _plan: ExecutionPlan, _set: ChangeSet): Promise<never> {
  throw new ExecutionBoundaryError();
}

export type ExecutionPreview = {
  intent: ExecutionIntent;
  plan: ExecutionPlan;
  changeSet: ChangeSet;
  approval: ApprovalRequest;
  receipt: PreviewReceipt;
  card: ExecutionPreviewCard;
};

/**
 * Run the whole P3a pipeline for a sanitized request and its proposed changes: intent → plan → change set →
 * pending approval → receipt → card. The result is entirely a proposal; no operation is executed. This is the
 * single function the chat/preview endpoint calls; it keeps the ordering and hash-binding in one deterministic place.
 */
export function buildExecutionPreview(input: IntentBuildInput, changes: ChangeInput[], now = Date.now()): ExecutionPreview {
  const intent = buildIntent({ ...input, now });
  const plan = buildPlan(intent, now);
  const changeSet = buildChangeSet(intent, plan, changes, now);
  const approval = buildApprovalRequest(intent, plan, changeSet, now);
  const receipt = buildPreviewReceipt(intent, plan, changeSet, approval, now);
  const card = toPreviewCard(intent, plan, changeSet, approval);
  return { intent, plan, changeSet, approval, receipt, card };
}




