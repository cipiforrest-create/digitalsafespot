import { getKv } from '../state/kv';
import { executionReceiptSchema, isTerminalState, type ExecutionReceipt } from '../../shared/execution-run';
// P3c durable execution store. Hardened from the P3b idempotency store into a production persistence layer that
// records the AUTHORITATIVE receipt AND every state transition (checkpoint) so a run can be: recovered after a
// process restart (loadNonTerminal), inspected by execution id for the status API (loadByExecutionId), and protected
// against idempotency-key substitution (claim binds the request FINGERPRINT to the key; a reused key with a
// DIFFERENT payload is rejected). Default backing is the shared KV (memory in dev/test, Upstash in prod). A test can
// swap in a deterministic store via setExecutionStore. No secrets are persisted — only the schema-validated receipt.

/** Result of an atomic claim. `ok` false with `fingerprintMismatch` means the key was reused with a different body. */
export type ClaimResult = { ok: true } | { ok: false; fingerprintMismatch: boolean };

export interface ExecutionStore {
  /** Return a prior receipt for this idempotency key, or null. */
  load(idempotencyKey: string): Promise<ExecutionReceipt | null>;
  /** Return a prior receipt by its execution id (for the status API), or null. */
  loadByExecutionId(executionId: string): Promise<ExecutionReceipt | null>;
  /** Persist (or overwrite) the receipt for its idempotency key, and index it by execution id. */
  save(receipt: ExecutionReceipt): Promise<void>;
  /**
   * Atomically claim the key for a first attempt, binding it to the request fingerprint. Returns:
   *   { ok:true } — first claim (or re-claim with the SAME fingerprint);
   *   { ok:false, fingerprintMismatch:true } — key reused with a DIFFERENT payload (reject);
   *   { ok:false, fingerprintMismatch:false } — key already claimed and in-flight (duplicate).
   */
  claim(idempotencyKey: string, fingerprint: string): Promise<ClaimResult>;
  /** List all persisted receipts currently in a NON-terminal state (recovery surface after a restart). */
  loadNonTerminal(): Promise<ExecutionReceipt[]>;
}

const EXECUTION_TTL_SECONDS = 24 * 60 * 60;
const key = (k: string) => `dx:c:exec:${k}`;
const idIndexKey = (executionId: string) => `dx:c:exec:byid:${executionId}`;
const claimKey = (k: string) => `dx:c:exec:claim:${k}`;
const INDEX_KEY = 'dx:c:exec:index'; // set of idempotency keys, for recovery scanning

class KvExecutionStore implements ExecutionStore {
  async load(idempotencyKey: string): Promise<ExecutionReceipt | null> {
    return this.read(key(idempotencyKey), (r) => r.idempotencyKey === idempotencyKey);
  }
  async loadByExecutionId(executionId: string): Promise<ExecutionReceipt | null> {
    const idem = await getKv().get(idIndexKey(executionId));
    if (!idem) return null;
    return this.load(idem);
  }
  private async read(k: string, ok: (r: ExecutionReceipt) => boolean): Promise<ExecutionReceipt | null> {
    const raw = await getKv().get(k);
    if (!raw) return null;
    try {
      const parsed = executionReceiptSchema.safeParse(JSON.parse(raw));
      if (parsed.success && ok(parsed.data)) return parsed.data;
    } catch { /* fall through */ }
    return null;
  }
  async save(receipt: ExecutionReceipt): Promise<void> {
    const validated = executionReceiptSchema.parse(receipt);
    const kv = getKv();
    await kv.set(key(validated.idempotencyKey), JSON.stringify(validated), EXECUTION_TTL_SECONDS);
    await kv.set(idIndexKey(validated.executionId), validated.idempotencyKey, EXECUTION_TTL_SECONDS);
    await this.index(validated.idempotencyKey);
  }
  private async index(idempotencyKey: string): Promise<void> {
    const kv = getKv();
    const raw = await kv.get(INDEX_KEY);
    let keys: string[] = [];
    try { if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) keys = p.filter((x): x is string => typeof x === 'string'); } } catch { /* reset */ }
    if (!keys.includes(idempotencyKey)) { keys.push(idempotencyKey); await kv.set(INDEX_KEY, JSON.stringify(keys.slice(-500)), EXECUTION_TTL_SECONDS); }
  }
  async claim(idempotencyKey: string, fingerprint: string): Promise<ClaimResult> {
    const kv = getKv();
    const claimed = await kv.setNX(claimKey(idempotencyKey), fingerprint, EXECUTION_TTL_SECONDS * 1000);
    if (claimed) return { ok: true };
    // Already claimed: compare the stored fingerprint. A different payload under the same key is a substitution.
    const stored = await kv.get(claimKey(idempotencyKey));
    if (stored != null && stored !== fingerprint) return { ok: false, fingerprintMismatch: true };
    return { ok: false, fingerprintMismatch: false };
  }
  async loadNonTerminal(): Promise<ExecutionReceipt[]> {
    const raw = await getKv().get(INDEX_KEY);
    if (!raw) return [];
    let keys: string[] = [];
    try { const p = JSON.parse(raw); if (Array.isArray(p)) keys = p.filter((x): x is string => typeof x === 'string'); } catch { return []; }
    const out: ExecutionReceipt[] = [];
    for (const k of keys) {
      const r = await this.load(k);
      if (r && !isTerminalState(r.state)) out.push(r);
    }
    return out;
  }
}

let store: ExecutionStore = new KvExecutionStore();

export function getExecutionStore(): ExecutionStore { return store; }
/** Test hook: install a deterministic store. Returns a restore callback. */
export function setExecutionStore(next: ExecutionStore): () => void {
  const previous = store;
  store = next;
  return () => { store = previous; };
}

