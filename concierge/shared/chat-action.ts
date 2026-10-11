import { z } from 'zod';
import { executionRunRequestSchema } from './execution-run';
// P3d chat → action integration contracts. This is the SERVER-OWNED bridge between natural-language chat and the
// existing controlled-execution engine. The chat brain may only ever PROPOSE a capability + arguments + a
// conversational reason; everything that makes an action real — actor, approval state, execution flags, feature
// flags, idempotency, provider identity, verification outcome — stays server-side and is NEVER taken from the model
// or the browser. A visitor message turns into a PendingAction that accumulates validated fields across turns, is
// frozen into an approval-bound ExecutionRunRequest at confirmation time, and is driven through one explicit state
// machine. There is exactly ONE lead.create execution path: confirm hands the frozen request to
// runControlledExecution — no "chat lead creation" shortcut exists.

export const CHAT_ACTION_VERSION = 1;
/** The only capability this phase wires from conversation. Adding another is a deliberate, gated future step. */
export const chatCapabilitySchema = z.literal('lead.create');
export type ChatCapability = z.infer<typeof chatCapabilitySchema>;

// ---------------- Action state machine ----------------
// Explicit, server-validated states. The browser can never declare a transition; it only reflects what the server
// reports. `executing`/`verifying` mirror the controlled-execution lifecycle so the UI can show truthful progress;
// they are entered server-side around the single runControlledExecution call.
export const chatActionStateSchema = z.enum([
  'idle', 'collecting', 'ready_for_confirmation', 'awaiting_confirmation',
  'approved', 'executing', 'verifying', 'succeeded', 'failed', 'cancelled',
]);
export type ChatActionState = z.infer<typeof chatActionStateSchema>;

/** States from which no transition is allowed. A record here is final; a new action must be started. */
export const CHAT_ACTION_TERMINAL: readonly ChatActionState[] = ['succeeded', 'cancelled'];

// The closed transition table. Every edge is deliberate; impossible edges (idle→succeeded, collecting→executing,
// cancelled→executing, failed→succeeded without a fresh confirm) simply are not present and are rejected fail-closed.
const TRANSITIONS: Record<ChatActionState, readonly ChatActionState[]> = {
  idle: ['collecting', 'ready_for_confirmation', 'cancelled'],
  collecting: ['collecting', 'ready_for_confirmation', 'cancelled'],
  ready_for_confirmation: ['awaiting_confirmation', 'collecting', 'cancelled'],
  // Edit returns a shown card to collecting; confirm moves to approved; cancel invalidates.
  awaiting_confirmation: ['approved', 'collecting', 'cancelled', 'awaiting_confirmation'],
  approved: ['executing', 'failed', 'cancelled'],
  executing: ['verifying', 'succeeded', 'failed'],
  verifying: ['succeeded', 'failed'],
  // A failed attempt may be retried only by re-collecting/confirming (a NEW execution), never flipped to succeeded.
  failed: ['collecting', 'awaiting_confirmation', 'cancelled'],
  succeeded: [],
  cancelled: [],
};

/** True when `to` is a permitted next state from `from`. The single authority for a legal action transition. */
export function canTransition(from: ChatActionState, to: ChatActionState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

// ---------------- Collected lead arguments (partial, multi-turn) ----------------
// Fields are accumulated from the visitor's own words across turns. Each is optional here because collection is
// incremental; the STRICT leadCreateInputSchema (shared with execution) is the authority that decides when the set
// is complete and valid. We never fabricate a value and never ask again for a field already present.
export const collectedLeadArgsSchema = z.object({
  contactName: z.string().max(120).optional(),
  contactEmail: z.string().max(200).optional(),
  message: z.string().max(2000).optional(),
  company: z.string().max(160).optional(),
  phone: z.string().max(40).optional(),
  website: z.string().max(200).optional(),
  source: z.string().max(80).optional(),
}).strict();
export type CollectedLeadArgs = z.infer<typeof collectedLeadArgsSchema>;

// ---------------- ACTION_INTENT (internal) ----------------
// The brain's classification of a turn. INTERNAL — never surfaced as raw JSON to the visitor. The reason is a short
// human sentence used only for an audit note / optional UI hint; it is not trusted for any control decision.
export const actionIntentSchema = z.object({
  kind: z.literal('action_intent'),
  capability: chatCapabilitySchema,
  arguments: collectedLeadArgsSchema,
  missing: z.array(z.string().max(40)).max(12),
  reason: z.string().max(200),
}).strict();
export type ActionIntent = z.infer<typeof actionIntentSchema>;

// ---------------- Pending action (durable) ----------------
// Persisted per session. Holds the collected args, the state, and — once the card is presented — the FROZEN
// actor-less ExecutionRunRequest so that confirm replays the exact approved artifacts (double-confirm is idempotent)
// and any edit rebuilds a fresh request (invalidating the previous approval/fingerprint). No secrets are stored.
export const storedRunRequestSchema = executionRunRequestSchema.omit({ actor: true }).strict();
export type StoredRunRequest = z.infer<typeof storedRunRequestSchema>;

export const pendingActionSchema = z.object({
  v: z.literal(1),
  sid: z.string().min(1).max(200),
  capability: chatCapabilitySchema,
  state: chatActionStateSchema,
  args: collectedLeadArgsSchema,
  reason: z.string().max(200),
  // The frozen approved run request (without the server-injected actor). Null until the confirmation card is shown.
  run: storedRunRequestSchema.nullable(),
  // The execution id of the attempt (set when confirm runs). Links the pending action to its durable receipt.
  executionId: z.string().uuid().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
}).strict();
export type PendingAction = z.infer<typeof pendingActionSchema>;

// ---------------- Visitor-safe action card ----------------
// The bounded projection the client renders. It echoes only what the visitor already provided (so no new PII is
// exposed), the current state, the genuinely-missing required fields, and whether confirmation is available. It
// never carries hashes, ids beyond the execution id, actor data, approval internals or raw payloads.
export type ActionCardField = { key: string; label: string; value: string };
export type ActionCard = {
  capability: ChatCapability;
  state: ChatActionState;
  title: string;
  fields: ActionCardField[];
  missing: string[];
  canConfirm: boolean;        // true only in awaiting_confirmation
  executionId: string | null;
  note: string;               // what confirming authorizes (the consent statement)
};

