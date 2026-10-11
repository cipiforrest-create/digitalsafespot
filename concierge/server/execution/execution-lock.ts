import { randomUUID } from 'node:crypto';
import { getKv, StoreError } from '../state/kv';
// P3c §5 distributed execution lock. Idempotency (run-store.claim) protects against a duplicate COMPLETION, but a
// multi-instance production deployment also needs a lock that spans the whole mutating window: claim → preflight →
// mutate → verify → finalize. This is that lock, built on the SAME KV atomic primitives the turn lock uses
// (SET key value NX PX ttl via setNX; compare-and-delete release via eval('lock_release')). Properties:
//   • keyed by the execution/idempotency key so two instances racing the same run cannot both mutate;
//   • acquisition is atomic (setNX);
//   • a lease/TTL guarantees a crashed holder's lock eventually expires so the run becomes recoverable;
//   • release is compare-and-delete (only the token owner releases) and best-effort — the TTL is the backstop.
// It is NOT in-process memory: with Upstash configured it is cross-instance; the memory KV backs dev/test.

// Lease long enough to cover a bounded single-operation execution, short enough that a crash frees it promptly.
const LOCK_LEASE_MS = 60_000;
const lockKey = (executionKey: string) => `dx:c:execlock:${executionKey}`;

export interface ExecutionLock {
  readonly key: string;
  readonly token: string;
}

/** A handle whose lifetime is the critical section; `release` is compare-and-delete and safe to call twice. */
export interface AcquiredLock extends ExecutionLock {
  release(): Promise<void>;
}

/**
 * Try to acquire the execution lock for a key. Returns an AcquiredLock on success, or null when another instance
 * already holds it (the caller maps null → ExecutionError 'locked'). Never blocks/waits: a concurrent attempt fails
 * fast so the second instance does not queue behind a mutation.
 */
export async function acquireExecutionLock(executionKey: string, leaseMs = LOCK_LEASE_MS): Promise<AcquiredLock | null> {
  const kv = getKv();
  const key = lockKey(executionKey);
  const token = randomUUID();
  let acquired = false;
  try { acquired = await kv.setNX(key, token, leaseMs); }
  catch (error) { if (error instanceof StoreError) throw error; throw error; }
  if (!acquired) return null;
  let released = false;
  return {
    key, token,
    async release() {
      if (released) return;
      released = true;
      // Compare-and-delete: only remove the lock if THIS token still owns it (never free a lease another instance
      // re-acquired after ours expired). Best-effort — the PX lease is the backstop if the release call fails.
      try { await kv.eval('lock_release', [key], [token]); } catch { /* lease expiry is the backstop */ }
    },
  };
}

/**
 * Run `fn` while holding the execution lock. Returns { held:false } without calling fn when the lock is contended,
 * so the caller can fail closed with a structured 'locked' outcome. Always releases on completion or throw.
 */
export async function withExecutionLock<T>(executionKey: string, fn: (lock: ExecutionLock) => Promise<T>): Promise<{ held: true; value: T } | { held: false }> {
  const lock = await acquireExecutionLock(executionKey);
  if (!lock) return { held: false };
  try { return { held: true, value: await fn(lock) }; }
  finally { await lock.release(); }
}

/** Inspect whether a lock key is currently held (for status/recovery diagnostics; never used to bypass acquisition). */
export async function isLocked(executionKey: string): Promise<boolean> {
  return (await getKv().get(lockKey(executionKey))) != null;
}
