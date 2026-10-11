// In-memory KV kept on a global symbol so separately esbuild-bundled server modules share one store per process.
import type { Kv, KvCommand, KvValue, EvalScript } from './kv';
import { StoreError } from './kv';
type Entry = { value: string; expiresAt: number | null };
type Store = Map<string, Entry>;
const SYMBOL = Symbol.for('dx.concierge.store');
function store(): Store {
  const holder = globalThis as unknown as Record<symbol, Store | undefined>;
  return (holder[SYMBOL] ??= new Map<string, Entry>());
}
function live(map: Store, key: string): Entry | undefined {
  const entry = map.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) { map.delete(key); return undefined; }
  return entry;
}
class MemoryKv implements Kv {
  async get(key: string): Promise<KvValue> { return live(store(), key)?.value ?? null; }
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    store().set(key, { value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null });
  }
  async setNX(key: string, value: string, ttlMs: number): Promise<boolean> {
    const map = store();
    if (live(map, key)) return false;
    map.set(key, { value, expiresAt: Date.now() + ttlMs });
    return true;
  }
  async del(key: string): Promise<void> { store().delete(key); }
  async getdel(key: string): Promise<KvValue> { const map = store(); const entry = live(map, key); map.delete(key); return entry?.value ?? null; }
  async eval(script: EvalScript, keys: string[], args: string[]): Promise<number | KvValue> {
    const map = store();
    if (script === 'rate_limit') {
      // INCR the counter and set the window expiry on first hit. Returns the new count.
      const key = keys[0]; const ttlMs = Number(args[0]);
      const existing = live(map, key);
      const count = (existing ? Number(existing.value) : 0) + 1;
      map.set(key, { value: String(count), expiresAt: existing?.expiresAt ?? Date.now() + ttlMs });
      return count;
    }
    if (script === 'lock_release') {
      // Release the lock only if the stored token matches (compare-and-delete). Returns 1 if released.
      const key = keys[0]; const token = args[0];
      const entry = live(map, key);
      if (entry && entry.value === token) { map.delete(key); return 1; }
      return 0;
    }
    throw new StoreError(`Unknown script: ${script}`);
  }
  async pipeline(commands: KvCommand[]): Promise<unknown[]> {
    const results: unknown[] = [];
    for (const [command, ...rest] of commands) {
      switch (command.toUpperCase()) {
        case 'GET': results.push(await this.get(rest[0])); break;
        case 'SET': results.push(await this.set(rest[0], rest[1]).then(() => 'OK')); break;
        case 'DEL': results.push(await this.del(rest[0]).then(() => 1)); break;
        default: throw new StoreError(`Unsupported pipeline command: ${command}`);
      }
    }
    return results;
  }
}
let instance: MemoryKv | null = null;
export function getMemoryKv(): Kv { return (instance ??= new MemoryKv()); }