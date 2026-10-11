import { z } from 'zod';
import { goalSchema } from './contracts';
import { capabilityIdSchema } from './solution-map';
// P3a Interactive Execution Preview. This is the PREVIEW-ONLY contract that lets the concierge move from
// "I found this problem" → "here is a concrete execution plan" → "here is exactly what would change" →
// "review / approve", WITHOUT performing any irreversible production action. Every type here is a proposal:
// nothing in P3a writes to production, deploys, mutates external state or executes privileged operations —
// that belongs to P3b/P3c, behind the disabled boundary in server/orchestrator/execution-preview.ts.
// The pipeline is ExecutionIntent → ExecutionPlan → ChangeSet → ApprovalRequest → PreviewReceipt. Approval and
// the receipt bind to the EXACT frozen plan/change-set content by hash, so a mutated proposal cannot be approved.

/** Bump when any P3a shape or preview policy changes; it is part of every hash/version so old artifacts miss. */
export const EXECUTION_PREVIEW_VERSION = 1;
/** Bounds mirror the SolutionMap philosophy: a preview is small and reviewable, never an unbounded batch. */
export const MAX_PLAN_STEPS = 8;
export const MAX_CHANGES = 12;
export const MAX_RISKS = 8;

// How destructive a step/change is. P3a may only ever propose up to `external_write`; it never EXECUTES any of
// these. `destructive` exists so a plan can classify a step honestly, and so the boundary can refuse to run it.
export const sideEffectLevelSchema = z.enum(['none', 'preview', 'external_write', 'destructive']);
export type SideEffectLevel = z.infer<typeof sideEffectLevelSchema>;

// The reviewer authority a step/intent requires before any later (P3b) execution stage. `none` = no approval,
// `owner` = the site owner must approve, `privileged` = a stronger gate (deploys, destructive ops) — reserved.
export const approvalLevelSchema = z.enum(['none', 'owner', 'privileged']);
export type ApprovalLevel = z.infer<typeof approvalLevelSchema>;

// A bounded risk classification for the whole intent. Deterministic; never model-invented.
export const riskLevelSchema = z.enum(['low', 'medium', 'high']);
export type RiskLevel = z.infer<typeof riskLevelSchema>;

// The closed set of operations P3a can PROPOSE. Adding an operation is the only way to widen what can be previewed.
export const executionOperationSchema = z.enum([
  'copy_change',       // proposed marketing/UI copy replacement
  'ui_change',         // a component or property change
  'file_patch',        // a source file patch
  'config_change',     // a configuration value change
  'cms_draft',         // a draft CMS change (never published)
  'seo_metadata',      // SEO/meta tag change
  'asset_generation',  // a generated asset (image/text) proposal
  'provider_request',  // a structured request to an external provider (prepared, not sent)
  'deployment_preview',// a deployment plan/preview (never deployed)
  'lead_create',       // P3d: create a durable lead record from a collected enquiry (reversible, owner-approved)
]);
export type ExecutionOperation = z.infer<typeof executionOperationSchema>;

// ---------------- ExecutionIntent ----------------
// What the user wants executed, captured as structured data. Free text is length-capped and sanitized by the
// server before it reaches here (mirrors extractProblem in the SolutionArchitect). Never invents a capability.
export const executionIntentSchema = z.object({
  v: z.literal(1),
  id: z.string().uuid(),
  version: z.number().int(),
  objective: z.string().min(1).max(600),                 // the user's own objective, sanitized
  target: z.string().min(1).max(200),                    // what the operation acts on (page/section/config key)
  operation: executionOperationSchema,
  goal: goalSchema.nullable(),
  contextRefs: z.array(z.string().min(1).max(8)).max(12), // evidence ids (reuses the SolutionMap E1,E2 refs)
  constraints: z.array(z.string().min(1).max(200)).max(8),
  expectedResult: z.string().min(1).max(400),
  risk: riskLevelSchema,
  reversible: z.boolean(),
  capability: capabilityIdSchema.nullable(),             // the proposed T19 capability, or null
  approvalLevel: approvalLevelSchema,
  sourceHash: z.string().min(1).max(64),                 // stable hash of the deterministic inputs (idempotency)
  createdAt: z.number(),
}).strict();
export type ExecutionIntent = z.infer<typeof executionIntentSchema>;

// ---------------- ExecutionPlan ----------------
// An ordered, inspectable set of steps derived from the intent. Deterministic enough that the user understands
// exactly what would happen. `dependsOn` references earlier step ids so ordering is explicit and checkable.
export const executionStepSchema = z.object({
  id: z.string().min(1).max(8),                          // S1, S2, …
  description: z.string().min(1).max(300),
  target: z.string().min(1).max(200),
  actionType: executionOperationSchema,
  inputs: z.array(z.string().min(1).max(200)).max(8),
  expectedOutput: z.string().min(1).max(300),
  sideEffect: sideEffectLevelSchema,
  reversible: z.boolean(),
  approval: approvalLevelSchema,
  dependsOn: z.array(z.string().min(1).max(8)).max(8),
}).strict();
export type ExecutionStep = z.infer<typeof executionStepSchema>;

export const executionPlanSchema = z.object({
  v: z.literal(1),
  id: z.string().uuid(),
  version: z.number().int(),
  intentId: z.string().uuid(),
  steps: z.array(executionStepSchema).min(1).max(MAX_PLAN_STEPS),
  createdAt: z.number(),
}).strict();
export type ExecutionPlan = z.infer<typeof executionPlanSchema>;

// ---------------- ChangeSet ----------------
// The concrete proposed mutations, kept SEPARATE from conversational prose. before/after are optional because a
// creation has no "before" and a deletion has no "after". Nothing here is applied in P3a.
export const changeKindSchema = z.enum([
  'text_replace', 'component_change', 'file_patch', 'config_change',
  'cms_draft', 'seo_metadata', 'asset', 'provider_operation',
  'lead_record',   // P3d: a durable lead record creation (the `after` field carries canonical lead JSON)
]);
export type ChangeKind = z.infer<typeof changeKindSchema>;

export const proposedChangeSchema = z.object({
  id: z.string().min(1).max(8),                          // C1, C2, …
  kind: changeKindSchema,
  target: z.string().min(1).max(200),
  summary: z.string().min(1).max(300),
  before: z.string().max(2000).nullable(),
  after: z.string().max(2000).nullable(),
  reversible: z.boolean(),
  stepId: z.string().min(1).max(8),                      // the plan step this change realizes
}).strict();
export type ProposedChange = z.infer<typeof proposedChangeSchema>;

export const changeSetSchema = z.object({
  v: z.literal(1),
  id: z.string().uuid(),
  version: z.number().int(),
  planId: z.string().uuid(),
  changes: z.array(proposedChangeSchema).min(1).max(MAX_CHANGES),
  createdAt: z.number(),
}).strict();
export type ChangeSet = z.infer<typeof changeSetSchema>;

// ---------------- ApprovalRequest ----------------
// Approval binds to the EXACT frozen plan + change set by hash. If either is mutated, the hashes no longer match
// and the request is invalid — approval can never silently apply to a changed proposal. P3b will later consume an
// `approved` request, re-verify the hashes, and only then (behind the disabled boundary) execute.
export const approvalStateSchema = z.enum(['pending', 'approved', 'rejected']);
export type ApprovalState = z.infer<typeof approvalStateSchema>;

export const approvalRequestSchema = z.object({
  v: z.literal(1),
  id: z.string().uuid(),
  version: z.number().int(),
  intentId: z.string().uuid(),
  planId: z.string().uuid(),
  changeSetId: z.string().uuid(),
  planHash: z.string().min(1).max(64),                   // hash of the exact plan being approved
  changeSetHash: z.string().min(1).max(64),              // hash of the exact change set being approved
  approvalLevel: approvalLevelSchema,
  state: approvalStateSchema,
  createdAt: z.number(),
}).strict();
export type ApprovalRequest = z.infer<typeof approvalRequestSchema>;

// ---------------- PreviewReceipt ----------------
// An auditable record of exactly what was previewed and its approval state. Hashes/ids/version make later
// execution auditable: P3b can prove the artifact it runs is the one the user reviewed.
export const previewReceiptSchema = z.object({
  v: z.literal(1),
  id: z.string().uuid(),
  version: z.number().int(),
  intentId: z.string().uuid(),
  planId: z.string().uuid(),
  changeSetId: z.string().uuid(),
  approvalId: z.string().uuid(),
  intentHash: z.string().min(1).max(64),
  planHash: z.string().min(1).max(64),
  changeSetHash: z.string().min(1).max(64),
  shown: z.object({
    stepCount: z.number().int().min(0),
    changeCount: z.number().int().min(0),
  }).strict(),
  risks: z.array(z.string().min(1).max(300)).max(MAX_RISKS),
  approvalState: approvalStateSchema,
  createdAt: z.number(),
}).strict();
export type PreviewReceipt = z.infer<typeof previewReceiptSchema>;

// ---------------- Visitor-safe card projection ----------------
// A bounded, safe projection of the whole preview for the UI. Mirrors SolutionCard: it never exposes internal
// hashes or reasoning, and every string is rendered with textContent on the client so nothing can inject markup.
export type ExecutionPreviewCard = {
  objective: string;
  target: string;
  operation: ExecutionOperation;
  risk: RiskLevel;
  reversible: boolean;
  approvalLevel: ApprovalLevel;
  approvalState: ApprovalState;
  steps: { id: string; description: string; sideEffect: SideEffectLevel; reversible: boolean }[];
  changes: { id: string; kind: ChangeKind; target: string; summary: string; before: string | null; after: string | null }[];
  risks: string[];
  expectedResult: string;
};

// The untrusted, client-supplied execution request. Only the objective/target/operation are accepted from the
// client; everything else (risk, reversibility, capability, plan, changes) is DERIVED server-side, so the client
// can never inject an approval level, a capability id or a pre-built change. Strict + length-capped like the T13 tool input.
export const executionRequestSchema = z.object({
  objective: z.string().min(1).max(600),
  target: z.string().min(1).max(200),
  operation: executionOperationSchema,
  goal: goalSchema.nullable().optional(),
}).strict();
export type ExecutionRequest = z.infer<typeof executionRequestSchema>;



