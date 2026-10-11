import { z } from 'zod';
import {
  executionOperationSchema, approvalLevelSchema,
  executionIntentSchema, executionPlanSchema, changeSetSchema, approvalRequestSchema,
} from './execution';
import { capabilityIdSchema } from './solution-map';
// P3b Controlled Execution contracts. This is the GUARDED counterpart to the P3a preview: it turns an APPROVED,
// frozen P3a proposal into a single, tightly bounded, freshly-revalidated execution attempt. The defining rule is
// "approved does not mean blindly execute" — every artifact is re-hashed and rebound to the approval immediately
// before any mutation, execution is allowlisted to a tiny set of internal/reversible operations, and it runs the
// lifecycle: revalidate -> preflight -> dry-run -> conflict check -> execute -> verify -> receipt, with idempotency
// and rollback metadata. Nothing here trusts a client-supplied risk/approval tier, actor privilege, capability
// authority, provider name or hash — those are all derived or re-verified server-side.

export const EXECUTION_RUN_VERSION = 1;
/** How long after approval an execution attempt may still be made. A stale approval must be re-previewed. */
export const APPROVAL_TTL_MS = 30 * 60 * 1000;

/** dry_run computes what WOULD happen against the current target; execute performs the guarded mutation. */
export const executionModeSchema = z.enum(['dry_run', 'execute']);
export type ExecutionMode = z.infer<typeof executionModeSchema>;

// Trusted, server-derived actor roles. P3e: `visitor` is now a real least-privilege executing role — it may run ONLY
// the intentionally-public allowlist (lead.create), enforced by the server policy matrix (server/execution/policy.ts).
// `owner`/`admin`/`system` are the privileged roles. The role is always assembled server-side from the session/auth
// seam and is NEVER accepted from a client body.
export const actorRoleSchema = z.enum(['visitor', 'owner', 'admin', 'system']);
export type ActorRole = z.infer<typeof actorRoleSchema>;

// The trusted execution actor. This is assembled server-side from the session/auth seam and is NEVER parsed from
// a client body — the client cannot claim a role, capability set or session. Present here only as a typed contract.
export const executionActorSchema = z.object({
  actorId: z.string().min(1).max(100),
  role: actorRoleSchema,
  sessionId: z.string().min(1).max(200),
  capabilities: z.array(capabilityIdSchema).max(32),
}).strict();
export type ExecutionActor = z.infer<typeof executionActorSchema>;

// Terminal + transitional execution states. Persisted so the same idempotency key never mutates twice and so a
// process restart can classify an interrupted run deterministically (P3c §7). The lifecycle order is:
// pending → claimed → preflight → dry_run → executing → verifying → succeeded, with explicit failure/rollback
// branches (failed, conflict, rollback_pending → rolled_back|rollback_failed). `dry_run` is also a terminal state
// when the request ran in dry_run mode. Non-terminal states left behind by a crash are the recovery surface.
export const executionStateSchema = z.enum([
  'pending', 'claimed', 'preflight', 'dry_run', 'executing', 'verifying',
  'succeeded', 'failed', 'rolled_back', 'rollback_pending', 'rollback_failed', 'conflict',
]);
export type ExecutionState = z.infer<typeof executionStateSchema>;
/** The states from which no further transition is allowed. A record in any other state is recoverable. */
export const TERMINAL_STATES: readonly ExecutionState[] = ['succeeded', 'failed', 'rolled_back', 'rollback_failed', 'conflict', 'dry_run'];
export function isTerminalState(state: ExecutionState): boolean { return TERMINAL_STATES.includes(state); }

// Structured, domain-separated execution error codes. Gate failures (invalid/approval/unauthorized/disabled/
// unsupported/duplicate) THROW an ExecutionError and never reach a provider; operational outcomes (conflict/
// provider/verification/rollback) are recorded on the receipt so the attempt stays auditable.
export const executionErrorCodes = [
  'invalid_request', 'approval_mismatch', 'approval_expired', 'unauthorized',
  'execution_disabled', 'unsupported_operation', 'duplicate_request',
  'preflight_failed', 'stale_target', 'provider_failed', 'verification_failed', 'rollback_failed',
  // P3c additions: a concurrent instance holds the execution lock; a reused key arrived with a DIFFERENT payload;
  // and a run whose provider result is uncertain after a crash must be reconciled, never blindly retried.
  'locked', 'fingerprint_mismatch', 'reconciliation_required',
] as const;
export const executionErrorCodeSchema = z.enum(executionErrorCodes);
export type ExecutionErrorCode = (typeof executionErrorCodes)[number];

/** A structured execution error. `code` is safe to map to a sanitized visitor message; details stay server-side. */
export class ExecutionError extends Error {
  constructor(public readonly code: ExecutionErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'ExecutionError';
  }
}

// ---------------- ExecutionRunRequest ----------------
// The full, server-assembled execution request. It binds the attempt to the EXACT frozen P3a artifacts plus their
// expected hashes, the approval reference, a trusted actor, the requested mode and an idempotency key. Note what is
// absent: no client-supplied risk, approval level, provider name or privileged capability claim — those are derived
// or re-verified. Strict: unknown keys are rejected so a caller cannot smuggle an override field.
export const executionRunRequestSchema = z.object({
  v: z.literal(1),
  executionId: z.string().uuid(),
  version: z.number().int(),
  approvalId: z.string().uuid(),
  intent: executionIntentSchema,
  plan: executionPlanSchema,
  changeSet: changeSetSchema,
  expected: z.object({
    intentHash: z.string().min(1).max(64),
    planHash: z.string().min(1).max(64),
    changeSetHash: z.string().min(1).max(64),
  }).strict(),
  approval: approvalRequestSchema,
  actor: executionActorSchema,
  mode: executionModeSchema,
  idempotencyKey: z.string().min(8).max(200),
  requestedAt: z.number(),
}).strict();
export type ExecutionRunRequest = z.infer<typeof executionRunRequestSchema>;

// ---------------- Preflight ----------------
// The named safety gates evaluated BEFORE any dry-run or mutation. Each is a hard boolean; `ok` is their AND.
export const preflightCheckSchema = z.object({
  name: z.string().min(1).max(60),
  ok: z.boolean(),
  detail: z.string().max(300),
}).strict();
export type PreflightCheck = z.infer<typeof preflightCheckSchema>;

export const preflightResultSchema = z.object({
  ok: z.boolean(),
  checks: z.array(preflightCheckSchema).max(24),
  operation: executionOperationSchema,
  approvalLevel: approvalLevelSchema,
}).strict();
export type PreflightResult = z.infer<typeof preflightResultSchema>;

// ---------------- Dry-run ----------------
// Answers "given the CURRENT target state right now, can this exact approved change still be applied safely?".
// It reads the live target and computes proposed after-state + conflicts/warnings without mutating anything.
export const dryRunChangeSchema = z.object({
  changeId: z.string().min(1).max(8),
  target: z.string().min(1).max(200),
  currentHash: z.string().max(64).nullable(),   // hash of the live target now (null = target absent)
  expectedHash: z.string().max(64).nullable(),  // hash the change was previewed against (null = expected creation)
  proposedAfterHash: z.string().max(64).nullable(),
  conflict: z.boolean(),
}).strict();
export type DryRunChange = z.infer<typeof dryRunChangeSchema>;

export const dryRunResultSchema = z.object({
  safe: z.boolean(),
  changes: z.array(dryRunChangeSchema).max(64),
  conflicts: z.array(z.string().min(1).max(300)).max(24),
  warnings: z.array(z.string().min(1).max(300)).max(24),
  rollbackAvailable: z.boolean(),
}).strict();
export type DryRunResult = z.infer<typeof dryRunResultSchema>;

// ---------------- Verification ----------------
// After mutation we re-read the target and confirm the intended state actually landed — provider "success" alone is
// never trusted. Each expected vs actual hash must match for `ok`.
export const verificationResultSchema = z.object({
  ok: z.boolean(),
  checks: z.array(z.object({
    changeId: z.string().min(1).max(8),
    expectedHash: z.string().max(64).nullable(),
    actualHash: z.string().max(64).nullable(),
    ok: z.boolean(),
  }).strict()).max(64),
}).strict();
export type VerificationResult = z.infer<typeof verificationResultSchema>;

// ---------------- Rollback metadata ----------------
export const rollbackInfoSchema = z.object({
  supported: z.boolean(),
  captured: z.boolean(),        // was a before-snapshot taken prior to mutation
  attempted: z.boolean(),
  succeeded: z.boolean(),
  ref: z.string().max(200).nullable(),  // opaque server-side reference to the snapshot (never a secret/path)
}).strict();
export type RollbackInfo = z.infer<typeof rollbackInfoSchema>;

// ---------------- ExecutionReceipt ----------------
// The full, auditable server-side record of one execution attempt. It preserves the approved proposal reference and
// its hashes, the actor, the operation/target, every lifecycle result, timestamps and rollback metadata. This is the
// AUTHORITATIVE record: the client never decides success — it reads `state` from here. Persisted for idempotency.
export const executionReceiptSchema = z.object({
  v: z.literal(1),
  executionId: z.string().uuid(),
  idempotencyKey: z.string().min(8).max(200),
  approvalId: z.string().uuid(),
  hashes: z.object({
    intentHash: z.string().min(1).max(64),
    planHash: z.string().min(1).max(64),
    changeSetHash: z.string().min(1).max(64),
  }).strict(),
  actorId: z.string().min(1).max(100),
  actorRole: actorRoleSchema,
  operation: executionOperationSchema,
  target: z.string().min(1).max(200),
  mode: executionModeSchema,
  // Request fingerprint: a hash of the exact approved artifacts + mode. Bound to the idempotency key so that a
  // REUSED key arriving with a DIFFERENT payload is rejected (fingerprint_mismatch) rather than silently returning
  // the old receipt or mutating with new content (P3c §15).
  fingerprint: z.string().min(1).max(64),
  state: executionStateSchema,
  preflight: preflightResultSchema.nullable(),
  dryRun: dryRunResultSchema.nullable(),
  verification: verificationResultSchema.nullable(),
  rollback: rollbackInfoSchema,
  errorCode: executionErrorCodeSchema.nullable(),
  startedAt: z.number(),
  completedAt: z.number().nullable(),
}).strict();
export type ExecutionReceipt = z.infer<typeof executionReceiptSchema>;

// ---------------- Visitor-safe projection ----------------
// The bounded, safe projection of a receipt for the client. It exposes ONLY a coarse status, the operation/target,
// counts and a sanitized error code — never actor ids, internal hashes, before/after content, rollback refs or any
// authorization data. Mirrors the P3a card discipline: the client renders each string with textContent.
export const executionStatusCardSchema = z.object({
  status: executionStateSchema,
  operation: executionOperationSchema,
  target: z.string().min(1).max(200),
  mode: executionModeSchema,
  changeCount: z.number().int().min(0),
  conflicts: z.array(z.string().min(1).max(300)).max(24),
  rollbackAvailable: z.boolean(),
  rollbackPerformed: z.boolean(),
  verified: z.boolean(),
  errorCode: executionErrorCodeSchema.nullable(),
}).strict();
export type ExecutionStatusCard = z.infer<typeof executionStatusCardSchema>;

/** Project a full receipt to the safe visitor card. Strips every id/hash/content/authorization field. */
export function toStatusCard(receipt: ExecutionReceipt): ExecutionStatusCard {
  return executionStatusCardSchema.parse({
    status: receipt.state,
    operation: receipt.operation,
    target: receipt.target,
    mode: receipt.mode,
    changeCount: receipt.dryRun ? receipt.dryRun.changes.length : 0,
    conflicts: receipt.dryRun ? receipt.dryRun.conflicts : [],
    rollbackAvailable: receipt.rollback.supported,
    rollbackPerformed: receipt.rollback.succeeded,
    verified: receipt.verification ? receipt.verification.ok : false,
    errorCode: receipt.errorCode,
  });
}

// ---------------- Audit trail (P3c §8) ----------------
// Append-only, server-authoritative execution events. Each entry captures WHAT happened and WHEN, keyed to the
// execution id, with only SAFE metadata: no credentials, session secrets, authorization tokens or provider payloads.
// The actor is referenced by a short hash (never the raw id), mirroring the trace.ts sessionHash discipline.
export const executionAuditEventTypes = [
  'request_received', 'actor_resolved', 'approval_revalidated', 'lock_acquired', 'lock_denied',
  'preflight_passed', 'preflight_failed', 'dry_run_passed', 'dry_run_conflict',
  'execution_started', 'mutation_result', 'verification_result',
  'rollback_attempted', 'rollback_result', 'execution_finalized',
  'recovery_classified', 'lock_released',
] as const;
export const executionAuditEventTypeSchema = z.enum(executionAuditEventTypes);
export type ExecutionAuditEventType = (typeof executionAuditEventTypes)[number];

export const executionAuditEventSchema = z.object({
  executionId: z.string().uuid(),
  seq: z.number().int().min(0),
  type: executionAuditEventTypeSchema,
  at: z.number(),
  actorHash: z.string().max(24).nullable(),   // short hash of the actor id — never the raw id
  operation: executionOperationSchema.nullable(),
  target: z.string().max(200).nullable(),
  status: z.string().max(60).nullable(),       // safe coarse status ('ok' | error code | state name)
}).strict();
export type ExecutionAuditEvent = z.infer<typeof executionAuditEventSchema>;

// ---------------- Recovery classification (P3c §10) ----------------
// A crashed/interrupted run left in a non-terminal state is classified — never blindly retried. A side effect is
// only ever repeated when the executor proves idempotency; anything with an uncertain provider result is marked for
// reconciliation. `resumable` means the run had not yet mutated (safe to fail/retry); `reconcile` means the mutation
// may or may not have landed and needs human/provider reconciliation; `finalize_failure` means it never mutated.
export const recoveryDispositionSchema = z.enum(['resumable', 'reconcile', 'finalize_failure', 'already_terminal']);
export type RecoveryDisposition = z.infer<typeof recoveryDispositionSchema>;

export const recoveryClassificationSchema = z.object({
  executionId: z.string().uuid(),
  fromState: executionStateSchema,
  disposition: recoveryDispositionSchema,
  reason: z.string().min(1).max(200),
}).strict();
export type RecoveryClassification = z.infer<typeof recoveryClassificationSchema>;

