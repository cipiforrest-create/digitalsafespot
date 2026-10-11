// Shared KV interface used by rate limits, budgets, locks and session state.
// Two implementations exist: an in-memory store (default) and Upstash/Vercel KV over REST.
import { kvConfig, productionLike } from '../core/config';
import { getMemoryKv } from './memory-kv';
import { createUpstashKv } from './upstash-kv';
export class StoreError extends Error { constructor(message: string, public readonly cause?: unknown) { super(message); this.name = 'StoreError'; } }
export type KvValue = string | null;
export type EvalScript = 'rate_limit' | 'lock_release';
export interface Kv {
  get(key: string): Promise<KvValue>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  setNX(key: string, value: string, ttlMs: number): Promise<boolean>;
  del(key: string): Promise<void>;
  getdel(key: string): Promise<KvValue>;
  eval(script: EvalScript, keys: string[], args: string[]): Promise<number | KvValue>;
  pipeline(commands: KvCommand[]): Promise<unknown[]>;
}
export type KvCommand = [command: string, ...args: string[]];
let cached: Kv | null = null;
/**
 * Resolve the configured KV implementation. Upstash/Vercel KV REST when configured, otherwise the shared memory
 * store. P3e §9: in a production-like Vercel environment (production/preview) a persistent cross-instance store is
 * REQUIRED — if KV is not configured we FAIL LOUD (StoreError) rather than silently downgrade to the in-memory
 * fallback, which would not survive serverless instances and could fabricate false lead success. Dev/test keep the
 * memory fallback.
 */
export function getKv(): Kv {
  if (cached) return cached;
  const config = kvConfig();
  if (config.url && config.token) { cached = createUpstashKv(config.url, config.token); return cached; }
  if (productionLike()) throw new StoreError('Persistent KV is required in production but is not configured.');
  cached = getMemoryKv();
  return cached;
}
/** Test hook: reset the cached implementation so config changes take effect. */
export function resetKvCache() { cached = null; }