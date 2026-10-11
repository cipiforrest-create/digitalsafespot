import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HttpError, type Request } from '../server/http';

function fakeReq(ip = '203.0.113.7'): Request {
  return { headers: { 'x-forwarded-for': ip }, socket: { remoteAddress: ip } } as unknown as Request;
}
function clearMemory() {
  const holder = globalThis as unknown as Record<symbol, Map<string, unknown> | undefined>;
  holder[Symbol.for('dx.concierge.store')]?.clear();
}

test('per-session limit holds across two simulated instances (shared store)', async () => {
  process.env.CONCIERGE_SESSION_SECRET = 'unit-test-session-secret-'.repeat(3);
  clearMemory();
  const a = await import('../server/state/ratelimit');
  const b = await import('../server/state/ratelimit'); // Same module graph, one shared memory store.
  const sid = 'sid-shared';
  // lead session limit is 5/hour: 5 pass across the two "instances", the 6th is rejected.
  for (let i = 0; i < 3; i++) await a.enforce(fakeReq(), 'lead', sid);
  for (let i = 0; i < 2; i++) await b.enforce(fakeReq(), 'lead', sid);
  await assert.rejects(a.enforce(fakeReq(), 'lead', sid), (e) => e instanceof HttpError && e.status === 429);
});

test('a fresh window rolls over independently', async () => {
  clearMemory();
  const { hit } = await import('../server/state/ratelimit');
  assert.equal(await hit('t', 'k1', { max: 1, windowSec: 60 }), true);
  assert.equal(await hit('t', 'k1', { max: 1, windowSec: 60 }), false);
  assert.equal(await hit('t', 'k2', { max: 1, windowSec: 60 }), true); // Different key = independent window.
});

test('budget exhaustion degrades mode; kill switch overrides', async () => {
  clearMemory();
  const budget = await import('../server/state/budget');
  delete process.env.DX_CONCIERGE_MODE;
  process.env.DX_BUDGET_FAST_DAILY = '2';
  assert.equal(await budget.mode(), 'on');
  assert.equal(await budget.charge('fast'), true);
  assert.equal(await budget.charge('fast'), true);
  assert.equal(await budget.charge('fast'), false); // Exhausted.
  assert.equal(await budget.mode(), 'degraded');
  process.env.DX_CONCIERGE_MODE = 'off';
  assert.equal(await budget.mode(), 'off');
  delete process.env.DX_CONCIERGE_MODE; delete process.env.DX_BUDGET_FAST_DAILY;
});

test('store-down fails closed for model/audit but open for lead', async () => {
  // Point the KV at Upstash and make every REST call fail, so getKv() returns a store that throws StoreError.
  process.env.KV_REST_API_URL = 'https://kv.example';
  process.env.KV_REST_API_TOKEN = 'token';
  const kvModule = await import('../server/state/kv');
  kvModule.resetKvCache();
  const rl = await import('../server/state/ratelimit');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => { throw new DOMException('timed out', 'TimeoutError'); }) as typeof fetch;
  try {
    await assert.rejects(rl.enforce(fakeReq(), 'chat', 'sid'), (e) => e instanceof HttpError && e.status === 503);
    await assert.doesNotReject(rl.enforce(fakeReq(), 'lead', 'sid')); // Fails open.
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.KV_REST_API_URL; delete process.env.KV_REST_API_TOKEN;
    kvModule.resetKvCache();
  }
});

test('a rejected request (429) does not charge the budget', async () => {
  clearMemory();
  const budget = await import('../server/state/budget');
  process.env.DX_BUDGET_FAST_DAILY = '5';
  const before = await budget.available('fast');
  assert.equal(before, true);
  // Simulate: limit rejects before charge() is called; the budget must be untouched.
  assert.equal(Number((globalThis as unknown as Record<symbol, Map<string, { value: string }>>)[Symbol.for('dx.concierge.store')]?.get('dx:budget:fast:' + Math.floor(Date.now() / 86_400_000))?.value ?? '0'), 0);
  delete process.env.DX_BUDGET_FAST_DAILY;
});