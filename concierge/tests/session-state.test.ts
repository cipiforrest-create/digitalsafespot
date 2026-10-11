import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { sign, getSession, createSession, renewSession, clearSession, type Request, type Response } from '../server/http';
import { loadOrCreate, commit, endSession, appendTurn, mergeMemory } from '../server/state/session-state';
import { withLock } from '../server/state/lock';

const SECRET = 'unit-test-session-secret-'.repeat(3);
function res(): Response & { headers: Record<string, string> } {
  const headers: Record<string, string> = {};
  return Object.assign(new EventEmitter(), { headersSent: false, statusCode: 200, headers, setHeader: (k: string, v: string) => { headers[k.toLowerCase()] = v; }, end: () => undefined }) as unknown as Response & { headers: Record<string, string> };
}
function clearMemory() { (globalThis as unknown as Record<symbol, Map<string, unknown> | undefined>)[Symbol.for('dx.concierge.store')]?.clear(); }

test('the sid comes only from the cookie; a body-supplied sid is ignored', () => {
  process.env.CONCIERGE_SESSION_SECRET = SECRET;
  const token = sign({ sid: 'cookie-sid', issuedAt: Date.now(), exp: Date.now() + 60000, audience: 'qa.example' });
  const req = { headers: { host: 'qa.example', cookie: `dx_concierge=${token}` }, body: { sid: 'attacker-sid' } } as unknown as Request;
  assert.equal(getSession(req).sid, 'cookie-sid');
});

test('sliding renewal re-issues a fresh idle TTL bounded by the absolute cap', () => {
  process.env.CONCIERGE_SESSION_SECRET = SECRET;
  const now = Date.now();
  const r1 = res();
  renewSession({ sid: 's', issuedAt: now, exp: now + 1000, audience: 'qa.example' }, r1);
  assert.match(r1.headers['set-cookie'], /dx_concierge=/);
  // A session issued nearly 2h ago cannot be renewed beyond the absolute cap.
  const old = now - (2 * 3600_000 - 5_000);
  const r2 = res();
  renewSession({ sid: 's', issuedAt: old, exp: now + 1000, audience: 'qa.example' }, r2);
  const maxAge = Number(/Max-Age=(\d+)/.exec(r2.headers['set-cookie'])![1]);
  assert.ok(maxAge <= 6, `expected a small remaining window, got ${maxAge}`);
});

test('the absolute 2h cap rejects an otherwise-valid renewed cookie', () => {
  process.env.CONCIERGE_SESSION_SECRET = SECRET;
  const issuedAt = Date.now() - (2 * 3600_000 + 1000);
  const token = sign({ sid: 's', issuedAt, exp: Date.now() + 60000, audience: 'qa.example' });
  const req = { headers: { host: 'qa.example', cookie: `dx_concierge=${token}` } } as unknown as Request;
  assert.throws(() => getSession(req), /expired/);
});

test('two sessions keep isolated durable state', async () => {
  clearMemory();
  const a = randomUUID(), b = randomUUID();
  await commit(mergeMemory(await loadOrCreate(a), 'A remembers apples'));
  await commit(mergeMemory(await loadOrCreate(b), 'B remembers bananas'));
  assert.match((await loadOrCreate(a)).memory, /apples/);
  assert.doesNotMatch((await loadOrCreate(a)).memory, /bananas/);
  await endSession(a);
  assert.equal((await loadOrCreate(a)).memory, '');
  assert.match((await loadOrCreate(b)).memory, /bananas/);
});

test('turn lock rejects a concurrent writer with 409 and releases afterwards', async () => {
  clearMemory();
  const sid = randomUUID();
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  const first = withLock(sid, async () => { await held; return 'first'; });
  await new Promise((r) => setTimeout(r, 10));
  await assert.rejects(withLock(sid, async () => 'second'), (e) => (e as { status?: number }).status === 409);
  release();
  assert.equal(await first, 'first');
  // After release the lock is free again.
  assert.equal(await withLock(sid, async () => 'third'), 'third');
});

test('a failed turn leaves committed state unchanged', async () => {
  clearMemory();
  const sid = randomUUID();
  await commit(appendTurn(await loadOrCreate(sid), { role: 'user', content: 'hello', at: Date.now() }));
  const before = await loadOrCreate(sid);
  await assert.rejects(withLock(sid, async () => { throw new Error('turn failed before commit'); }));
  const after = await loadOrCreate(sid);
  assert.deepEqual(after.turns, before.turns);
  void createSession; void clearSession;
});