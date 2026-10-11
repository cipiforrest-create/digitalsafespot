import { getKv } from './kv';
import { pendingActionSchema, type PendingAction } from '../../shared/chat-action';
// P3d durable pending-action store. Keyed by the cookie sid ONLY (never a client body value), exactly like
// session-state.ts, and backed by the same shared KV (memory in dev/test, Upstash in prod). It holds the per-session
// pending lead.create action SEPARATELY from ordinary conversation turns, so the action state machine is never
// reconstructed from chat prose. Records are schema-validated on every read (a corrupt/injected record is dropped,
// never returned), TTL-bounded so dev/preview data self-expires, and carry no secrets — only the validated,
// visitor-safe collected args and the frozen approval-bound run request (actor-less). A test can swap the store.

const PENDING_TTL_SECONDS = 30 * 60; // Matches the session idle window; a stale pending action self-expires.
const key = (sid: string) => `dx:c:pending:${sid}`;

export interface PendingActionStore {
  /** Load the pending action for a session, or null when none exists / the record is invalid. */
  load(sid: string): Promise<PendingAction | null>;
  /** Persist (overwrite) the pending action for its session, refreshing the TTL. */
  save(action: PendingAction): Promise<void>;
  /** Delete the pending action for a session (used on cancel / explicit end). */
  clear(sid: string): Promise<void>;
}

class KvPendingActionStore implements PendingActionStore {
  async load(sid: string): Promise<PendingAction | null> {
    const raw = await getKv().get(key(sid));
    if (!raw) return null;
    try {
      const parsed = pendingActionSchema.safeParse(JSON.parse(raw));
      if (parsed.success && parsed.data.sid === sid) return parsed.data;
    } catch { /* fall through */ }
    return null;
  }
  async save(action: PendingAction): Promise<void> {
    const validated = pendingActionSchema.parse({ ...action, updatedAt: Date.now() });
    await getKv().set(key(validated.sid), JSON.stringify(validated), PENDING_TTL_SECONDS);
  }
  async clear(sid: string): Promise<void> {
    await getKv().del(key(sid));
  }
}

let store: PendingActionStore = new KvPendingActionStore();

export function getPendingActionStore(): PendingActionStore { return store; }
/** Test hook: install a deterministic pending-action store. Returns a restore callback. */
export function setPendingActionStore(next: PendingActionStore): () => void {
  const previous = store;
  store = next;
  return () => { store = previous; };
}
