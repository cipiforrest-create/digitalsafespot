// Upstash / Vercel KV over the REST API. No SDK: commands are POSTed as JSON arrays.
import type { Kv, KvCommand, KvValue, EvalScript } from './kv';
import { StoreError } from './kv';
const SCRIPTS: Record<EvalScript, string> = {
  // Atomic fixed-window counter: INCR then set the expiry only on the first hit.
  rate_limit: "local c = redis.call('INCR', KEYS[1]); if c == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end; return c",
  // Compare-and-delete so only the lock owner can release it.
  lock_release: "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end",
};
export function createUpstashKv(baseUrl: string, token: string): Kv {
  const url = baseUrl.replace(/\/+$/, '');
  async function call<T>(command: KvCommand, path = ''): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url + path, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(1500),
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });
    } catch (cause) { throw new StoreError('KV request failed', cause); }
    if (!response.ok) throw new StoreError(`KV responded ${response.status}`);
    const body = await response.json().catch((cause) => { throw new StoreError('KV returned invalid JSON', cause); }) as { result?: T; error?: string };
    if (body.error) throw new StoreError(body.error);
    return body.result as T;
  }
  async function pipe(commands: KvCommand[]): Promise<unknown[]> {
    let response: Response;
    try {
      response = await fetch(url + '/pipeline', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(1500),
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(commands),
      });
    } catch (cause) { throw new StoreError('KV pipeline failed', cause); }
    if (!response.ok) throw new StoreError(`KV pipeline responded ${response.status}`);
    const body = await response.json().catch((cause) => { throw new StoreError('KV returned invalid JSON', cause); }) as { result?: unknown; error?: string }[];
    return body.map((item) => { if (item.error) throw new StoreError(item.error); return item.result; });
  }
  return {
    async get(key) { return (await call<KvValue>(['GET', key])) ?? null; },
    async set(key, value, ttlSeconds) { await call(ttlSeconds ? ['SET', key, value, 'EX', String(ttlSeconds)] : ['SET', key, value]); },
    async setNX(key, value, ttlMs) { const result = await call<KvValue>(['SET', key, value, 'NX', 'PX', String(ttlMs)]); return result === 'OK'; },
    async del(key) { await call(['DEL', key]); },
    async getdel(key) { return (await call<KvValue>(['GETDEL', key])) ?? null; },
    async eval(script, keys, args) {
      return await call<number | KvValue>(['EVAL', SCRIPTS[script], String(keys.length), ...keys, ...args]);
    },
    pipeline: pipe,
  };
}