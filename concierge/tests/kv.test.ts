import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { getMemoryKv } from '../server/state/memory-kv';
import { createUpstashKv } from '../server/state/upstash-kv';
import { StoreError, type Kv } from '../server/state/kv';

async function parity(kv: Kv) {
  assert.equal(await kv.get('missing'), null);
  await kv.set('k', 'v');
  assert.equal(await kv.get('k'), 'v');
  assert.equal(await kv.setNX('k', 'other', 1000), false);
  assert.equal(await kv.setNX('fresh', 'x', 1000), true);
  assert.equal(await kv.getdel('fresh'), 'x');
  assert.equal(await kv.get('fresh'), null);
  await kv.del('k');
  assert.equal(await kv.get('k'), null);
  assert.equal(await kv.eval('rate_limit', ['rl'], ['60000']), 1);
  assert.equal(await kv.eval('rate_limit', ['rl'], ['60000']), 2);
  await kv.set('lock', 'token-1', 5);
  assert.equal(await kv.eval('lock_release', ['lock'], ['wrong']), 0);
  assert.equal(await kv.eval('lock_release', ['lock'], ['token-1']), 1);
}

test('memory KV satisfies the interface contract', async () => { await parity(getMemoryKv()); });

test('upstash KV over REST matches the contract with a fake fetch', async () => {
  const bodies: unknown[] = [];
  const original = globalThis.fetch;
  const state = new Map<string, string>();
  globalThis.fetch = (async (_url: string, init: { body: string }) => {
    const command = JSON.parse(init.body) as [string, ...string[]];
    bodies.push(command);
    const [op, key, value] = command;
    let result: unknown = null;
    switch (op) {
      case 'GET': result = state.get(key) ?? null; break;
      case 'GETDEL': result = state.get(key) ?? null; state.delete(key); break;
      case 'DEL': state.delete(key); result = 1; break;
      case 'SET': {
        const nx = command.includes('NX');
        if (nx && state.has(key)) { result = null; break; }
        state.set(key, value); result = 'OK'; break;
      }
      case 'EVAL': {
        // Mimic the two Lua scripts deterministically for parity.
        if (command[0] === 'EVAL' && /INCR/.test(command[1])) { const k = command[3]; const n = Number(state.get(k) ?? '0') + 1; state.set(k, String(n)); result = n; }
        else { const k = command[3]; const token = command[4]; if (state.get(k) === token) { state.delete(k); result = 1; } else result = 0; }
        break;
      }
    }
    return { ok: true, json: async () => ({ result }) } as Response;
  }) as typeof fetch;
  try { await parity(createUpstashKv('https://kv.example', 'token')); }
  finally { globalThis.fetch = original; }
  assert.ok(bodies.some((b) => Array.isArray(b) && b[0] === 'SET'));
  assert.ok(bodies.some((b) => Array.isArray(b) && b[0] === 'EVAL'));
});

test('upstash KV maps a timeout/network failure to StoreError', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => { throw new DOMException('timed out', 'TimeoutError'); }) as typeof fetch;
  try { await assert.rejects(createUpstashKv('https://kv.example', 'token').get('k'), (error) => error instanceof StoreError); }
  finally { globalThis.fetch = original; }
});

test('two separately bundled memory-kv modules share one process store', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dx-kv-'));
  const entry = join(dir, 'entry.ts');
  writeFileSync(entry, "export { getMemoryKv } from '" + join(process.cwd(), 'concierge/server/state/memory-kv').replace(/\\/g, '/') + "';\n");
  const a = join(dir, 'a.cjs'); const b = join(dir, 'b.cjs');
  await build({ entryPoints: [entry], outfile: a, bundle: true, platform: 'node', format: 'cjs', target: 'node24' });
  await build({ entryPoints: [entry], outfile: b, bundle: true, platform: 'node', format: 'cjs', target: 'node24' });
  const require = createRequire(import.meta.url);
  const kvA = (require(a) as { getMemoryKv: () => Kv }).getMemoryKv();
  const kvB = (require(b) as { getMemoryKv: () => Kv }).getMemoryKv();
  await kvA.set('cross:bundle', 'shared');
  assert.equal(await kvB.get('cross:bundle'), 'shared');
});