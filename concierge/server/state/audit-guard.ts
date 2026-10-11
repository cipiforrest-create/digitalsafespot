import { createHash } from 'node:crypto';
import { getKv, StoreError } from './kv';
import { HttpError } from '../http';
// §9 T15 audit guards backed by KV. All guards fail open on a store error: they are abuse throttles,
// never the primary SSRF defence (that is safe-fetch), so an unreachable store must not block a valid audit.
/** Stable key for a normalized target, used by the per-session reuse cache and the negative cache. */
export function urlKey(href: string): string { return createHash('sha256').update(href).digest('base64url').slice(0, 24); }
const NEGATIVE_TTL_SECONDS = 5 * 60; // A DNS failure or timeout is cached briefly so a bad host is not retried in a hot loop.
const negKey = (key: string) => `dx:c:audit:neg:${key}`;
export async function isNegativelyCached(key: string): Promise<boolean> {
  try { return (await getKv().get(negKey(key))) !== null; } catch (error) { if (error instanceof StoreError) return false; throw error; }
}
export async function cacheNegative(key: string): Promise<void> {
  try { await getKv().set(negKey(key), '1', NEGATIVE_TTL_SECONDS); } catch (error) { if (!(error instanceof StoreError)) throw error; }
}
// Blocked-URL lock: 3 rejected URLs in 10 min lock audits for that session for 10 min.
const BLOCK_WINDOW_SECONDS = 10 * 60;
const BLOCK_THRESHOLD = 3;
const blockCountKey = (sid: string) => `dx:c:audit:blocked:${sid}`;
const lockKey = (sid: string) => `dx:c:audit:lock:${sid}`;
/** Reject early when a session is locked out after repeated blocked URLs. Fails open when the store is down. */
export async function assertAuditUnlocked(sid: string): Promise<void> {
  try { if ((await getKv().get(lockKey(sid))) !== null) throw new HttpError(429, 'Too many blocked links. Please try a different website in a few minutes.'); }
  catch (error) { if (error instanceof HttpError) throw error; if (error instanceof StoreError) return; throw error; }
}
/** Record a rejected URL for a session; after the threshold, lock the session out of audits. */
export async function recordBlockedUrl(sid: string): Promise<void> {
  try {
    const count = Number(await getKv().eval('rate_limit', [blockCountKey(sid)], [String(BLOCK_WINDOW_SECONDS * 1000)]));
    if (count >= BLOCK_THRESHOLD) await getKv().set(lockKey(sid), '1', BLOCK_WINDOW_SECONDS);
  } catch (error) { if (!(error instanceof StoreError)) throw error; }
}