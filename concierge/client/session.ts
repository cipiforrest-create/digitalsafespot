import { post } from './dom';
import { readSse } from '../shared/sse';
import type { Context } from '../shared/contracts';
import type { ChatV2Action } from '../shared/chat-v2';
import type { SolutionCard } from '../shared/solution-map';
import type { ActionCard } from '../shared/chat-action';
import type { ExecutionStatusCard } from '../shared/execution-run';
// T23 client-side v2 turn. One request → the closed v2 SSE event set the orchestrator owns:
//   delta          → reply text chunk        (onDelta)
//   action         → one deterministic UI act (onAction — the ChatV2Action union)
//   build_solution → a bounded SolutionCard   (onSolution)
//   done           → the turn is complete     (stream ends, this resolves)
//   error          → the server aborted        (thrown, so the caller shows a recoverable error)
// There is no continuation loop and no tool results are echoed back: the whole turn is a single stream.
export type ChatTurnHandlers = {
  signal: AbortSignal;
  onOpen?: () => void;
  onDelta: (chunk: string) => void;
  onAction: (action: ChatV2Action) => void | Promise<void>;
  onSolution: (card: SolutionCard) => void;
  // P3d: the server-owned confirmation/action card and the authoritative execution status projection. The client
  // only renders them; it never decides state. Optional so legacy callers keep compiling.
  onActionCard?: (card: ActionCard) => void;
  onExecutionStatus?: (card: ExecutionStatusCard) => void;
};
// P3d: a turn may carry an explicit action-card command (Confirm/Edit/Cancel). It is a hint only — the server
// re-derives the pending action from durable state and re-validates every transition before acting.
export type ActionCommand = 'confirm' | 'edit' | 'cancel';
export async function runChatTurn(input: Context, handlers: ChatTurnHandlers, actionCommand?: ActionCommand): Promise<void> {
  const { signal, onOpen, onDelta, onAction, onSolution, onActionCard, onExecutionStatus } = handlers;
  // The v2 body is `{ v: 2, context }`; `v: 2` is what the server uses to route to the orchestrator (legacy shim aside).
  const response = await post('/api/concierge/chat', { v: 2, context: input, ...(actionCommand ? { actionCommand } : {}) }, signal);
  if (!response.body) throw new Error('Veza je prekinuta. Pokušajte ponovo.');
  onOpen?.(); // The request was accepted and streaming has started — the caller can clear the submitted draft.
  await readSse(response.body, async (event, data) => {
    if (signal.aborted) return;
    switch (event) {
      case 'delta': { const text = (data as { text?: unknown }).text; if (typeof text !== 'string') throw new Error('Odgovor nije ispravan. Pokušajte ponovo.'); onDelta(text); break; }
      case 'action': await onAction(data as ChatV2Action); break;
      case 'build_solution': onSolution(data as SolutionCard); break;
      case 'action_card': onActionCard?.(data as ActionCard); break;
      case 'execution_status': onExecutionStatus?.(data as ExecutionStatusCard); break;
      case 'error': throw new Error((data as { message?: string }).message || 'Veza je prekinuta. Pokušajte ponovo.');
      // 'done' carries no payload; the SSE stream simply ends and this promise resolves.
    }
  });
}
