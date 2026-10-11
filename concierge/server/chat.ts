import { chat, chatInputSchema } from './gemini';
import { chatV2RequestSchema } from '../shared/chat-v2';
import { guard, getSession, stream, send, fail, renewSession, HttpError, type Request, type Response } from './http';
import { startTrace } from './core/trace';
import { enforce } from './state/ratelimit';
import { withLock } from './state/lock';
import { orchestrate } from './orchestrator/orchestrate';
import { resolveSessionActor } from './execution/session-actor';
import { getProvider } from './ai';
import { mode } from './state/budget';
import { loadOrCreate, commit, appendTurn, mergeMemory } from './state/session-state';
export default async function handler(req: Request, res: Response) {
  const trace = startTrace('chat');
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 40000);
  res.on('close', () => controller.abort());
  try {
    guard(req); const session = getSession(req); trace.setSession(session.sid); await enforce(req, 'chat', session.sid);
    // v2 turn: deterministic orchestrator. Distinguished by `v: 2`; the legacy body is still accepted (T23 migrates the UI).
    if ((req.body as { v?: unknown })?.v === 2) {
      const input = chatV2RequestSchema.parse(req.body);
      await withLock(session.sid, async () => {
        const effectiveMode = await mode();
        if (effectiveMode === 'off') throw new HttpError(503, 'The assistant is not available right now. Please try again later.');
        renewSession(session, res); stream(res);
        // P3d: resolve the TRUSTED execution actor server-side from the session (never the body). null when the
        // session is not a provisioned owner → the action flow fails closed at the engine boundary. The action
        // command (confirm/edit/cancel) is a card-button hint; the server re-derives and re-validates every step.
        const actor = resolveSessionActor(session);
        const result = await orchestrate({ context: input.context, sid: session.sid, provider: getProvider(), signal: controller.signal, degraded: effectiveMode === 'degraded', actor, actionCommand: input.actionCommand }, (event, data) => { if (event === 'action' || event === 'action_card' || event === 'execution_status') trace.span('tool'); send(res, event, data); });
        // Durable memory: append the turn and merge a short note so later turns avoid re-asking.
        let state = await loadOrCreate(session.sid);
        const now = Date.now();
        const lastUser = input.context.messages.filter(m => m.role === 'user').at(-1)?.content;
        if (lastUser) state = appendTurn(state, { role: 'user', content: lastUser.slice(0, 4000), at: now, clientTurnId: input.clientTurnId });
        state = appendTurn(mergeMemory(state, result.memoryNote), { role: 'assistant', content: result.reply.slice(0, 4000), at: now });
        await commit(state);
      });
      res.end(); trace.end('ok'); return;
    }
    const input = chatInputSchema.parse(req.body);
    // Turn lock: one in-flight state-writing turn per session; a concurrent turn gets 409.
    await withLock(session.sid, async () => {
      renewSession(session, res); // Sliding renewal before streaming headers are flushed.
      stream(res);
      await chat(input, session.sid, controller.signal, (event, data) => { if (event === 'tool') trace.span('tool'); send(res, event, data); });
    });
    res.end(); trace.end('ok');
  }
  catch (error) { fail(res, error, trace.requestId); trace.end('error', { code: error instanceof Error ? error.name : 'unknown' }); }
  finally { clearTimeout(timer); }
}
