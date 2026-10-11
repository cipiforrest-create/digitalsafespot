import { z } from 'zod';
import { getKv } from './kv';
// Durable per-session conversation state (§12). Keyed by the cookie sid only; the body never carries a sid.
export const IDLE_TTL_SECONDS = 30 * 60;
const turnSchema = z.object({
  clientTurnId: z.string().max(64).optional(),
  role: z.enum(['user', 'assistant']),
  content: z.string().max(4000),
  at: z.number(),
}).strict();
export const sessionStateSchema = z.object({
  v: z.literal(1),
  sid: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  memory: z.string().max(1200),
  auditStatus: z.enum(['not_started', 'in_progress', 'completed']),
  turns: z.array(turnSchema).max(20),
  lastTurn: z.object({ clientTurnId: z.string().max(64), events: z.array(z.unknown()).max(32) }).nullable(),
}).strict();
export type SessionState = z.infer<typeof sessionStateSchema>;
export type Turn = z.infer<typeof turnSchema>;
const key = (sid: string) => `dx:c:s:${sid}`;
function fresh(sid: string): SessionState {
  const now = Date.now();
  return { v: 1, sid, createdAt: now, updatedAt: now, memory: '', auditStatus: 'not_started', turns: [], lastTurn: null };
}
export async function loadOrCreate(sid: string): Promise<SessionState> {
  const raw = await getKv().get(key(sid));
  if (!raw) return fresh(sid);
  try { return sessionStateSchema.parse(JSON.parse(raw)); } catch { return fresh(sid); }
}
export async function commit(state: SessionState): Promise<void> {
  const next: SessionState = { ...state, updatedAt: Date.now(), turns: state.turns.slice(-20) };
  await getKv().set(key(next.sid), JSON.stringify(next), IDLE_TTL_SECONDS);
}
export async function endSession(sid: string): Promise<void> { await getKv().del(key(sid)); }
/** Append a turn and keep at most 20; used by state-writing handlers. */
export function appendTurn(state: SessionState, turn: Turn): SessionState {
  return { ...state, turns: [...state.turns, turn].slice(-20) };
}
/** Merge a memory note, capped at 1200 characters with the oldest dropped. */
export function mergeMemory(state: SessionState, note: string): SessionState {
  if (!note) return state;
  const combined = (state.memory ? state.memory + '\n' : '') + note;
  return { ...state, memory: combined.length > 1200 ? combined.slice(combined.length - 1200) : combined };
}