import { z } from 'zod';
import { contextSchema, sectionSchema } from './contracts';
import type { SolutionCard } from './solution-map';
import type { ActionCard } from './chat-action';
import type { ExecutionStatusCard } from './execution-run';
// T13 chat v2: a deterministic single-turn contract. Unlike the legacy multi-round tool/continuation flow,
// a v2 turn is one request → one bounded FAST call (when rules don't fully answer) → a closed set of SSE events.
// `v: 2` distinguishes a v2 body from the legacy `{ context, continuation?, results? }` shape (shim kept for T23).
export const chatV2RequestSchema = z.object({
  v: z.literal(2),
  context: contextSchema,
  clientTurnId: z.string().min(1).max(64).optional(),
  // P3d: an optional action-control command the client raises from the confirmation card buttons. It is a HINT only
  // — the server re-derives the pending action from durable state and validates every transition. `confirm` carries
  // no payload: the server replays the exact frozen approved run request it froze when the card was shown.
  actionCommand: z.enum(['confirm', 'edit', 'cancel']).optional(),
}).strict();
export type ChatV2Request = z.infer<typeof chatV2RequestSchema>;

// The model's structured reply. Kept tiny: prose plus an optional section recommendation. Navigation, tours,
// audits and goal selection are handled by deterministic rules, never invented by the model.
export const respondSchema = z.object({
  reply: z.string().min(1).max(2000),
  recommend: sectionSchema.optional(),
}).strict();
export type RespondOutput = z.infer<typeof respondSchema>;

// Closed set of v2 UI actions. `delta` carries reply text; `action` carries one deterministic UI effect.
export type ChatV2Action =
  | { type: 'open_audit' }
  | { type: 'navigate_section'; section: string }
  | { type: 'recommend'; section: string; reason: string }
  | { type: 'start_tour' };
export type ChatV2Event =
  | { event: 'delta'; data: { text: string } }
  | { event: 'action'; data: ChatV2Action }
  // T20: a bounded, evidence-linked SolutionCard projection of a SolutionMap (never the raw reasoning chain).
  | { event: 'build_solution'; data: SolutionCard }
  // P3d: the visitor-safe action (confirmation) card, and the authoritative execution status projection. Both are
  // server-owned projections — the client only renders them and never decides state.
  | { event: 'action_card'; data: ActionCard }
  | { event: 'execution_status'; data: ExecutionStatusCard }
  | { event: 'done'; data: Record<string, never> };