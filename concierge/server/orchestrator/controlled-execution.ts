import { createHash, randomUUID } from 'node:crypto';
import {
  executionRunRequestSchema, executionReceiptSchema, toStatusCard, ExecutionError,
  APPROVAL_TTL_MS,
  type ExecutionRunRequest, type ExecutionReceipt, type ExecutionActor, type ExecutionState,
  type PreflightResult, type PreflightCheck, type DryRunResult, type DryRunChange,
  type VerificationResult, type ExecutionStatusCard, type RecoveryClassification,
} from '../../shared/execution-run';
import type { ExecutionOperation, ProposedChange, RiskLevel } from '../../shared/execution';
import { hashIntent, hashPlan, hashChangeSet, deriveOperationProfile } from './execution-preview';
import { executionEnabled, capabilityExecutionEnabled } from '../core/config';
import { resolveActor, canExecute, hasCapability } from '../execution/actor';
import { isOperationAllowedForRole } from '../execution/policy';
import { getExecutionStore } from '../execution/run-store';
import { readDraft, writeDraft, hashContent, isSafeTarget, captureSnapshot, restoreSnapshot } from '../execution/workspace';
import { assertTransition, classifyRecovery } from '../execution/state-machine';
import { withExecutionLock } from '../execution/execution-lock';
import { appendAuditEvent, type AuditContext } from '../execution/audit-log';
import { leadCreateExecutor } from '../execution/lead-provider';

// P3b Controlled Execution engine. This is the guarded replacement for the disabled boundary: given an APPROVED,
// frozen P3a proposal it runs revalidate → preflight → dry-run → conflict check → mutate → verify → receipt, with
// idempotency and rollback. The defining rule: approved means permission to ATTEMPT a freshly revalidated, bounded,
// conflict-safe execution — never blind application. Every gate here fails closed and nothing trusts the client for
// risk/approval tier, actor privilege, capability authority, provider name or hashes.

// ---------------- Allowlisted executor registry ----------------
// A narrow map from operation → server-side executor. There is NO arbitrary tool/shell/URL/dynamic-import path: only
// the operations with a registered executor can ever run. The first vertical slice registers exactly one —
// `cms_draft` — the safest existing change type (preview side-effect, reversible, internal draft workspace).
// Provider Contract V2 (P3c §11). Every executor DECLARES its identity and safety envelope (operation id, required
// capability, risk tier, reversibility, and which lifecycle stages it supports) alongside the lifecycle methods. The
// engine reads these declarations to gate behaviour — e.g. an executor that does not support rollback never has a
// snapshot captured, and an executor whose declared `capability` is set is checked against the actor. The registry
// stays server-side and allowlisted: there is NO dynamic/arbitrary provider loading from client data. Adding a real
// provider means implementing this whole contract and proving the lifecycle in tests before it is registered.
export interface Executor {
  readonly operation: ExecutionOperation;
  /** Capability the actor must hold to run this operation (null = none required beyond role). */
  readonly requiredCapability: string | null;
  /** Deterministic risk tier for this operation (derived from the operation profile, never client input). */
  readonly riskTier: RiskLevel;
  /** Whether the mutation is reversible at all. */
  readonly reversible: boolean;
  readonly supportsDryRun: boolean;
  readonly supportsVerification: boolean;
  readonly supportsRollback: boolean;
  /** Back-compat alias for supportsRollback (P3b callers). */
  readonly rollbackSupported: boolean;
  /** Server-side containment check for a change target (no path/URL/traversal). */
  validateTarget(target: string): boolean;
  /** Read the current state hash of a target (null = absent), used for reconciliation/diagnostics. */
  readCurrentState(target: string): Promise<string | null>;
  /** Preflight this executor's own provider-specific readiness (KV/credentials/etc.). Default: ready. */
  preflight?(change: ProposedChange): Promise<{ ok: boolean; detail: string }>;
  /** Compute what WOULD happen against the CURRENT target state, without mutating. */
  dryRunChange(change: ProposedChange): Promise<DryRunChange>;
  /** Capture a rollback snapshot for a target before mutation. */
  captureRollback(ref: string, change: ProposedChange): Promise<void>;
  /** Apply one change, binding to the expected current version. Returns false on a stale/version conflict. */
  applyChange(change: ProposedChange): Promise<boolean>;
  /** Re-read the target and confirm the intended state landed. */
  verifyChange(change: ProposedChange): Promise<{ changeId: string; expectedHash: string | null; actualHash: string | null; ok: boolean }>;
  /** Restore a target to a captured snapshot. */
  restoreRollback(ref: string, change: ProposedChange): Promise<boolean>;
}

// The single allowlisted executor for the first slice: writes to the contained, versioned internal draft workspace.
const cmsDraftExecutor: Executor = {
  operation: 'cms_draft',
  requiredCapability: null,
  riskTier: 'low',
  reversible: true,
  supportsDryRun: true,
  supportsVerification: true,
  supportsRollback: true,
  rollbackSupported: true,
  validateTarget: (target) => isSafeTarget(target),
  async readCurrentState(target) { const c = await readDraft(target); return c ? hashContent(c.content) : null; },
  async dryRunChange(change) {
    const current = await readDraft(change.target);
    const currentHash = current ? hashContent(current.content) : null;
    const expectedHash = change.before == null ? null : hashContent(change.before);
    const proposedAfterHash = change.after == null ? null : hashContent(change.after);
    return { changeId: change.id, target: change.target, currentHash, expectedHash, proposedAfterHash, conflict: expectedHash !== currentHash };
  },
  async captureRollback(ref, change) { await captureSnapshot(ref, change.target); },
  async applyChange(change) {
    const current = await readDraft(change.target);
    const expectedVersion = current ? current.version : 0;
    const written = await writeDraft(change.target, change.after ?? '', expectedVersion);
    return written != null;
  },
  async verifyChange(change) {
    const current = await readDraft(change.target);
    const actualHash = current ? hashContent(current.content) : null;
    const expectedHash = change.after == null ? null : hashContent(change.after);
    return { changeId: change.id, expectedHash, actualHash, ok: expectedHash === actualHash };
  },
  async restoreRollback(ref, change) { return restoreSnapshot(ref, change.target); },
};

// P3d: the lead.create provider is the first REAL live-action executor, registered alongside the cms_draft slice.
// It is still independently gated at runtime by the kill switch (DX_EXECUTION), the per-capability switch
// (DX_EXECUTION_LEAD_CREATE), the owner allowlist and owner approval — registration alone never enables it.
const REGISTRY = new Map<ExecutionOperation, Executor>([
  [cmsDraftExecutor.operation, cmsDraftExecutor],
  [leadCreateExecutor.operation, leadCreateExecutor],
]);

/** Look up the allowlisted executor for an operation, or null when the operation is not executable. */
export function getExecutor(operation: ExecutionOperation): Executor | null {
  return REGISTRY.get(operation) ?? null;
}

/** Test hook: register/override an executor for one operation. Returns a restore callback. */
export function setExecutor(operation: ExecutionOperation, executor: Executor | null): () => void {
  const previous = REGISTRY.get(operation) ?? null;
  if (executor) REGISTRY.set(operation, executor); else REGISTRY.delete(operation);
  return () => { if (previous) REGISTRY.set(operation, previous); else REGISTRY.delete(operation); };
}

// ---------------- Re-verify the approval (fail closed) ----------------
// Immediately before any provider work, recompute the intent/plan/change-set hashes from the artifacts actually
// supplied and compare against BOTH the frozen approval and the request's expected hashes. Also confirm the approval
// is APPROVED, applies to the exact proposal ids, has not expired, and that the derived approval tier is satisfied.
// Any mismatch throws — never a silent "repair" of a mutated proposal.
function revalidateApproval(req: ExecutionRunRequest, now: number): void {
  const intentHash = hashIntent(req.intent);
  const planHash = hashPlan(req.plan);
  const changeSetHash = hashChangeSet(req.changeSet);
  const { approval, expected } = req;
  const hashesMatch =
    intentHash === expected.intentHash &&
    planHash === expected.planHash && planHash === approval.planHash &&
    changeSetHash === expected.changeSetHash && changeSetHash === approval.changeSetHash;
  const idsMatch =
    approval.id === req.approvalId &&
    approval.intentId === req.intent.id &&
    approval.planId === req.plan.id && req.plan.intentId === req.intent.id &&
    approval.changeSetId === req.changeSet.id && req.changeSet.planId === req.plan.id;
  if (!hashesMatch || !idsMatch) throw new ExecutionError('approval_mismatch');
  if (approval.state !== 'approved') throw new ExecutionError('approval_mismatch');
  if (now - approval.createdAt > APPROVAL_TTL_MS) throw new ExecutionError('approval_expired');
  // Re-derive the required approval tier from the operation ONLY; never trust the stored intent/approval tier.
  const derived = deriveOperationProfile(req.intent.operation);
  if (approval.approvalLevel !== derived.approvalLevel) throw new ExecutionError('approval_mismatch');
}

// ---------------- Preflight ----------------
// Server-side safety gates run BEFORE dry-run/mutation. Every check is a hard boolean; the aggregate `ok` is their
// AND. A failing preflight means no provider is ever called. These checks rely only on server-derived state — never
// on conversational text.
export async function preflightExecution(req: ExecutionRunRequest, actor: ExecutionActor, _now: number): Promise<PreflightResult> {
  const derived = deriveOperationProfile(req.intent.operation);
  const executor = getExecutor(req.intent.operation);
  const checks: PreflightCheck[] = [];
  const add = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });

  add('execution_enabled', executionEnabled(), 'Kill switch permits execution.');
  add('authorized', canExecute(actor), 'Actor role may execute.');
  add('capability', hasCapability(actor, req.intent.capability), 'Actor holds the required capability.');
  add('allowlisted_operation', executor != null, 'Operation has a registered executor.');
  add('approval_tier', req.approval.approvalLevel === derived.approvalLevel, 'Required approval tier is satisfied.');

  // Per-change containment + reversibility gates (only meaningful when an executor exists).
  let targetsSafe = true;
  for (const change of req.changeSet.changes) {
    if (!executor || !executor.validateTarget(change.target)) targetsSafe = false;
  }
  add('targets_contained', targetsSafe, 'All change targets are contained (no path/URL/traversal).');
  add('reversible', derived.reversible && (executor?.rollbackSupported ?? false), 'Operation is reversible with rollback support.');

  // Provider-specific readiness (P3c §8): if the executor declares a `preflight` hook, it must pass for EVERY change
  // before any mutation is attempted. This is where a provider validates its own prerequisites — e.g. the lead
  // provider strict-parses the payload here, so a malformed/injected enquiry fails closed and no record is created.
  if (executor?.preflight) {
    let providerReady = true;
    let providerDetail = 'Provider is ready.';
    for (const change of req.changeSet.changes) {
      const result = await executor.preflight(change);
      if (!result.ok) { providerReady = false; providerDetail = result.detail; break; }
    }
    add('provider_ready', providerReady, providerDetail);
  }

  const ok = checks.every(c => c.ok);
  return { ok, checks, operation: req.intent.operation, approvalLevel: derived.approvalLevel };
}


// ---------------- Dry-run ----------------
// Given the CURRENT target state, compute whether this exact approved change can still be applied. A change conflicts
// when the live target no longer hashes to the before-state the change was previewed against (optimistic concurrency).
export async function dryRunExecution(req: ExecutionRunRequest, executor: Executor): Promise<DryRunResult> {
  const changes: DryRunChange[] = [];
  const conflicts: string[] = [];
  for (const change of req.changeSet.changes) {
    const dr = await executor.dryRunChange(change);
    changes.push(dr);
    if (dr.conflict) conflicts.push(`Target ${change.target} changed since preview; a fresh approval is required.`);
  }
  return { safe: conflicts.length === 0, changes, conflicts, warnings: [], rollbackAvailable: executor.rollbackSupported };
}

// ---------------- Request fingerprint (P3c §15) ----------------
// A stable hash of the EXACT approved artifacts + mode + approval, bound to the idempotency key. Two requests with
// the same key MUST carry the same fingerprint; a reused key with a different payload is rejected (fingerprint_
// mismatch) rather than silently returning the old receipt or mutating with new content.
export function computeFingerprint(req: ExecutionRunRequest): string {
  const material = [hashIntent(req.intent), hashPlan(req.plan), hashChangeSet(req.changeSet), req.approvalId, req.mode].join('|');
  return createHash('sha256').update('dx:exec:fp:' + material).digest('base64url').slice(0, 32);
}

// ---------------- Receipt helpers ----------------
function baseReceipt(req: ExecutionRunRequest, actor: ExecutionActor, now: number): ExecutionReceipt {
  return executionReceiptSchema.parse({
    v: 1,
    executionId: req.executionId,
    idempotencyKey: req.idempotencyKey,
    approvalId: req.approvalId,
    hashes: { intentHash: hashIntent(req.intent), planHash: hashPlan(req.plan), changeSetHash: hashChangeSet(req.changeSet) },
    actorId: actor.actorId,
    actorRole: actor.role,
    operation: req.intent.operation,
    target: req.intent.target,
    mode: req.mode,
    fingerprint: computeFingerprint(req),
    state: 'pending',
    preflight: null,
    dryRun: null,
    verification: null,
    rollback: { supported: false, captured: false, attempted: false, succeeded: false, ref: null },
    errorCode: null,
    startedAt: now,
    completedAt: null,
  });
}

// Transition the receipt to a new state through the explicit state machine and persist the checkpoint so a crash
// leaves a recoverable record. `assertTransition` throws on an illegal edge so a bug can never skip a stage or
// resurrect a terminal run. Audit events are emitted separately at each step so the audit sequence stays explicit.
async function checkpoint(receipt: ExecutionReceipt, to: ExecutionState): Promise<void> {
  assertTransition(receipt.state, to);
  receipt.state = to;
  await getExecutionStore().save(receipt);
}

// Perform rollback of a mutation. First moves the run to the explicit `rollback_pending` state (so a crash mid-
// rollback is recoverable), attempts every per-change restore, then records the outcome on the receipt.
async function attemptRollback(receipt: ExecutionReceipt, req: ExecutionRunRequest, executor: Executor, ref: string, audit: AuditContext, now: number): Promise<void> {
  if (!executor.supportsRollback || !receipt.rollback.captured) return;
  await checkpoint(receipt, 'rollback_pending');
  await appendAuditEvent(audit, 'rollback_attempted', 'ref', now);
  let allRestored = true;
  for (const change of req.changeSet.changes) {
    const restored = await executor.restoreRollback(`${ref}:${change.id}`, change);
    if (!restored) allRestored = false;
  }
  receipt.rollback = { ...receipt.rollback, attempted: true, succeeded: allRestored };
  await appendAuditEvent(audit, 'rollback_result', allRestored ? 'ok' : 'rollback_failed', now);
}

async function finalize(receipt: ExecutionReceipt, state: ExecutionReceipt['state'], errorCode: ExecutionReceipt['errorCode'], deps: ExecuteDeps, audit: AuditContext): Promise<ExecutionReceipt> {
  const now = deps.now ?? Date.now;
  assertTransition(receipt.state, state);
  receipt.state = state;
  receipt.errorCode = errorCode;
  receipt.completedAt = now();
  await getExecutionStore().save(receipt);
  await appendAuditEvent(audit, 'execution_finalized', errorCode ?? state, now());
  return receipt;
}

/** Project the authoritative receipt to the bounded, secret-free visitor status card. */
export function projectStatus(receipt: ExecutionReceipt): ExecutionStatusCard {
  return toStatusCard(receipt);
}

export type ExecuteDeps = { actorContext?: unknown; now?: () => number };


/**
 * The single guarded execution entry point. Consumes a validated ExecutionRunRequest and runs the full lifecycle:
 * revalidate approval → resolve trusted actor → preflight → dry-run/conflict → (execute mode) capture rollback →
 * mutate → verify → persist receipt. Idempotent by key. Gate failures throw a structured ExecutionError before any
 * provider is touched; operational outcomes (conflict/provider/verification/rollback) are recorded on the receipt.
 */
export async function runControlledExecution(rawRequest: unknown, deps: ExecuteDeps = {}): Promise<ExecutionReceipt> {
  const now = (deps.now ?? Date.now)();
  // 1. Strict schema — reject unknown/extra fields and any malformed artifact up front.
  const clock = deps.now ?? Date.now;
  const parsed = executionRunRequestSchema.safeParse(rawRequest);
  if (!parsed.success) throw new ExecutionError('invalid_request');
  const req = parsed.data;
  const fingerprint = computeFingerprint(req);
  const audit: AuditContext = { executionId: req.executionId, actorId: req.actor.actorId, operation: req.intent.operation, target: req.intent.target };
  await appendAuditEvent(audit, 'request_received', req.mode, now);

  // 2. Idempotency: a COMPLETED attempt under this key returns its receipt (no second mutation). A prior receipt with
  // a DIFFERENT fingerprint means the key was reused with a different payload; reject it (P3c 15).
  const store = getExecutionStore();
  const prior = await store.load(req.idempotencyKey);
  if (prior) {
    if (prior.fingerprint !== fingerprint) throw new ExecutionError('fingerprint_mismatch');
    if (['succeeded', 'failed', 'rolled_back', 'rollback_failed', 'conflict', 'dry_run'].includes(prior.state)) return prior;
  }

  // 3. Re-verify the exact frozen approval (fail closed on any tamper/expiry/tier mismatch).
  revalidateApproval(req, now);

  // 4. Resolve the TRUSTED actor server-side; the client never supplies role/capabilities.
  const actor = resolveActor(deps.actorContext ?? req.actor);
  if (!canExecute(actor)) throw new ExecutionError('unauthorized');
  await appendAuditEvent(audit, 'actor_resolved', actor.role, now);
  await appendAuditEvent(audit, 'approval_revalidated', 'ok', now);

  // 5. Kill switch — refuse before any executor lookup/provider work.
  if (!executionEnabled()) throw new ExecutionError('execution_disabled');

  // 6. Allowlisted operation only.
  const executor = getExecutor(req.intent.operation);
  if (!executor) throw new ExecutionError('unsupported_operation');
  // 6a. Canonical POLICY MATRIX (P3e §6): the one server-owned source of "may this role run this operation". A
  // visitor is restricted to the public allowlist (lead_create); an owner keeps the privileged set. Unknown role,
  // unknown/unlisted operation ⇒ DENY. This is consulted BEFORE the capability/kill-switch checks so a role that may
  // not run the operation at all is rejected even if other gates would pass.
  if (!isOperationAllowedForRole(actor.role, req.intent.operation)) throw new ExecutionError('unauthorized');
  if (!capabilityExecutionEnabled(req.intent.operation)) throw new ExecutionError('execution_disabled');
  if (!hasCapability(actor, req.intent.capability)) throw new ExecutionError('unauthorized');
  if (executor.requiredCapability && !hasCapability(actor, executor.requiredCapability)) throw new ExecutionError('unauthorized');

  // 7. Fingerprint-bound idempotency claim: first claim wins; a reused key with a DIFFERENT payload is rejected; a
  // duplicate in-flight attempt is refused.
  const claim = await store.claim(req.idempotencyKey, fingerprint);
  if (!claim.ok) {
    if (claim.fingerprintMismatch) throw new ExecutionError('fingerprint_mismatch');
    if (!prior) throw new ExecutionError('duplicate_request');
  }

  // 8. Distributed execution lock spanning claim -> preflight -> mutate -> verify -> finalize, so two instances
  // racing the same key cannot both mutate. Contention fails closed with 'locked'; the lease frees a crashed holder.
  const outcome = await withExecutionLock(req.idempotencyKey, () => runLifecycle(req, actor, executor, deps, audit, now, clock));
  if (!outcome.held) { await appendAuditEvent(audit, 'lock_denied', 'locked', now); throw new ExecutionError('locked'); }
  await appendAuditEvent(audit, 'lock_released', 'ok', now);
  return outcome.value;
}

// The mutating critical section, run only while the distributed execution lock is held. Every state change goes
// through the explicit state machine (checkpoint/finalize) so a crash anywhere leaves a recoverable persisted record.
async function runLifecycle(req: ExecutionRunRequest, actor: ExecutionActor, executor: Executor, deps: ExecuteDeps, audit: AuditContext, now: number, clock: () => number): Promise<ExecutionReceipt> {
  const store = getExecutionStore();
  const receipt = baseReceipt(req, actor, now);
  await store.save(receipt);                          // persist 'pending' checkpoint
  await appendAuditEvent(audit, 'lock_acquired', 'ok', now);
  await checkpoint(receipt, 'claimed');

  // 8. Preflight — provider is NEVER called on failure.
  // 9. Preflight: provider is NEVER called on failure.
  await checkpoint(receipt, 'preflight');
  const preflight = await preflightExecution(req, actor, now);
  receipt.preflight = preflight;
  if (!preflight.ok) { await appendAuditEvent(audit, 'preflight_failed', 'preflight_failed', now); return finalize(receipt, 'failed', 'preflight_failed', deps, audit); }
  await appendAuditEvent(audit, 'preflight_passed', 'ok', now);

  // 10. Dry-run against the live target (no mutation) + conflict detection.
  await checkpoint(receipt, 'dry_run');
  const dryRun = await dryRunExecution(req, executor);
  receipt.dryRun = dryRun;
  receipt.rollback = { ...receipt.rollback, supported: executor.supportsRollback };
  if (!dryRun.safe) { await appendAuditEvent(audit, 'dry_run_conflict', 'stale_target', now); return finalize(receipt, 'conflict', 'stale_target', deps, audit); }
  await appendAuditEvent(audit, 'dry_run_passed', 'ok', now);

  // dry_run mode is terminal: it proved the change can still be applied, but performs no mutation.
  if (req.mode === 'dry_run') { receipt.completedAt = clock(); await store.save(receipt); await appendAuditEvent(audit, 'execution_finalized', 'dry_run', now); return receipt; }

  // 11. Capture rollback snapshots BEFORE mutation (reversible operations only).
  const rollbackRef = randomUUID();
  if (executor.supportsRollback) {
    for (const change of req.changeSet.changes) await executor.captureRollback(`${rollbackRef}:${change.id}`, change);
    receipt.rollback = { ...receipt.rollback, captured: true, ref: rollbackRef };
  }

  // 11. Mutate. A per-change version conflict here (stale target between dry-run and apply) triggers rollback —
  // we never overwrite a target that moved.
  await checkpoint(receipt, 'executing');
  await appendAuditEvent(audit, 'execution_started', 'ok', now);
  let applied = true;
  for (const change of req.changeSet.changes) {
    const ok = await executor.applyChange(change);
    if (!ok) { applied = false; break; }
  }
  if (!applied) {
    await appendAuditEvent(audit, 'mutation_result', 'provider_failed', now);
    await attemptRollback(receipt, req, executor, rollbackRef, audit, now);
    return finalize(receipt, receipt.rollback.succeeded ? 'rolled_back' : 'failed', 'provider_failed', deps, audit);
  }
  await appendAuditEvent(audit, 'mutation_result', 'ok', now);

  // 13. Verify the mutation actually landed (provider "success" alone is not trusted).
  await checkpoint(receipt, 'verifying');
  const verifyChecks = [];
  for (const change of req.changeSet.changes) verifyChecks.push(await executor.verifyChange(change));
  const verification: VerificationResult = { ok: verifyChecks.every(c => c.ok), checks: verifyChecks };
  receipt.verification = verification;
  if (!verification.ok) {
    await appendAuditEvent(audit, 'verification_result', 'verification_failed', now);
    await attemptRollback(receipt, req, executor, rollbackRef, audit, now);
    return finalize(receipt, receipt.rollback.succeeded ? 'rolled_back' : 'failed', 'verification_failed', deps, audit);
  }
  await appendAuditEvent(audit, 'verification_result', 'ok', now);

  return finalize(receipt, 'succeeded', null, deps, audit);
}

// ---------------- Recovery (P3c 10) ----------------
/**
 * Classify every persisted run left in a non-terminal state after a crash/restart. This never repeats a side effect:
 * a run that had not mutated is finalized as failed; a run whose provider result is uncertain (executing/verifying/
 * rollback_pending) is marked for reconciliation. Recovery is read-only against providers, so it is safe to run while
 * execution is disabled. Returns the classifications made.
 */
export async function recoverInterruptedExecutions(deps: { now?: () => number } = {}): Promise<RecoveryClassification[]> {
  const now = deps.now ?? Date.now;
  const store = getExecutionStore();
  const pending = await store.loadNonTerminal();
  const classifications: RecoveryClassification[] = [];
  for (const receipt of pending) {
    const classification = classifyRecovery(receipt.executionId, receipt.state);
    classifications.push(classification);
    const audit: AuditContext = { executionId: receipt.executionId, actorId: receipt.actorId, operation: receipt.operation, target: receipt.target };
    await appendAuditEvent(audit, 'recovery_classified', classification.disposition, now());
    // Only a clean 'finalize_failure' is persisted here (no side effect). 'reconcile' is left AS-IS for a human/
    // provider reconciliation step; we never guess whether the mutation landed and never re-run it.
    if (classification.disposition === 'finalize_failure') {
      assertTransition(receipt.state, 'failed');
      receipt.state = 'failed';
      receipt.errorCode = 'provider_failed';
      receipt.completedAt = now();
      await store.save(receipt);
    } else if (classification.disposition === 'reconcile' && receipt.errorCode == null) {
      receipt.errorCode = 'reconciliation_required';
      await store.save(receipt);
    }
  }
  return classifications;
}

/** Load an execution receipt by its id (status API), or null. */
export async function loadReceiptByExecutionId(executionId: string): Promise<ExecutionReceipt | null> {
  return getExecutionStore().loadByExecutionId(executionId);
}

