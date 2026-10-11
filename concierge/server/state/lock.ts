import { randomUUID } from 'node:crypto';
import { getKv, StoreError } from './kv';
import { HttpError } from '../http';
// Turn lock for session state writers. SET dx:c:lock:{sid} NX PX 45000; a concurrent writer gets 409.
const LOCK_MS = 45_000;
export async function withLock<T>(sid: string, fn: () => Promise<T>): Promise<T> {
  const kv = getKv();
  const key = `dx:c:lock:${sid}`;
  const token = randomUUID();
  let acquired = false;
  try { acquired = await kv.setNX(key, token, LOCK_MS); }
  catch (error) { if (error instanceof StoreError) throw new HttpError(503, 'The concierge is not available yet. Please try again later.'); throw error; }
  if (!acquired) throw new HttpError(409, 'Another message is still being processed. Please wait a moment.');
  try { return await fn(); }
  finally { try { await kv.eval('lock_release', [key], [token]); } catch { /* Best-effort release; the PX expiry is the backstop. */ } }
}