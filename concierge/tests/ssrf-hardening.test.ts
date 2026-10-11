import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { safeFetch, decodeBody, sameSiteHost, createAuditBudget, normalizeTarget } from '../server/safe-fetch';
import { urlKey, isNegativelyCached, cacheNegative, assertAuditUnlocked, recordBlockedUrl } from '../server/state/audit-guard';
import { HttpError } from '../server/http';

function clearMemory() { (globalThis as unknown as Record<symbol, Map<string, unknown> | undefined>)[Symbol.for('dx.concierge.store')]?.clear(); }
// A mock http.request that serves a scripted queue of responses and counts every connection attempt.
function mockHttp(t: { mock: { method: typeof import('node:test').mock.method } }, scripted: () => { status: number; headers: http.IncomingHttpHeaders; body?: Buffer }) {
  let connections = 0;
  t.mock.method(http, 'request', ((_url: URL, options: http.RequestOptions, callback: (value: http.IncomingMessage) => void) => {
    connections++;
    (options.lookup as (h: string, o: object, cb: (e: Error | null, a: string, f: number) => void) => void)?.('x', {}, () => undefined);
    const request = new EventEmitter() as EventEmitter & { end: () => void };
    request.end = () => queueMicrotask(() => {
      const plan = scripted();
      const incoming = new PassThrough() as unknown as http.IncomingMessage;
      incoming.statusCode = plan.status; incoming.headers = plan.headers;
      callback(incoming);
      if (plan.body) incoming.emit('data', plan.body);
      if (plan.status < 300 || plan.status >= 400) incoming.emit('end');
    });
    return request;
  }) as typeof http.request);
  return () => connections;
}

test('a redirect chain longer than five hops is refused', async (t) => {
  mockHttp(t, () => ({ status: 302, headers: { location: 'http://8.8.4.4/next' } }));
  await assert.rejects(safeFetch('http://8.8.8.8/', AbortSignal.timeout(1000)), /Too many redirects/);
});

test('a redirect to an explicit port is refused on revalidation', async (t) => {
  mockHttp(t, () => ({ status: 302, headers: { location: 'http://8.8.4.4:8080/admin' } }));
  await assert.rejects(safeFetch('http://8.8.8.8/', AbortSignal.timeout(1000)), /public website/);
});

test('a compressed body is rejected (no decompression bomb)', async (t) => {
  mockHttp(t, () => ({ status: 200, headers: { 'content-type': 'text/html', 'content-encoding': 'gzip' }, body: Buffer.from('x') }));
  await assert.rejects(safeFetch('http://8.8.8.8/', AbortSignal.timeout(1000)), /readable text/);
});

test('a body over 1.5 MB is truncated to a partial result', async (t) => {
  mockHttp(t, () => ({ status: 200, headers: { 'content-type': 'text/html' }, body: Buffer.alloc(3_000_000, 0x61) }));
  const fetched = await safeFetch('http://8.8.8.8/', AbortSignal.timeout(1000));
  assert.equal(fetched.truncated, true);
  assert.equal(fetched.text.length, 1_500_000);
});

test('windows-1250 headers decode Central-European letters', () => {
  const bytes = Buffer.from([0xE8, 0xE6, 0x9E, 0x9A, 0xF0]);
  assert.equal(decodeBody(bytes, { 'content-type': 'text/html; charset=windows-1250' }), 'čćžšđ');
  // A meta-tag charset is used when the header omits it.
  const withMeta = Buffer.concat([Buffer.from('<meta charset="windows-1250">'), bytes]);
  assert.match(decodeBody(withMeta, { 'content-type': 'text/html' }), /čćžšđ$/);
  // An unknown charset falls back to UTF-8 rather than executing another format.
  assert.equal(decodeBody(Buffer.from('hi'), { 'content-type': 'text/html; charset=made-up' }), 'hi');
});

test('the per-audit budget caps requests, connections and total bytes', async (t) => {
  const connections = mockHttp(t, () => ({ status: 200, headers: { 'content-type': 'text/html' }, body: Buffer.alloc(1_000_000, 0x62) }));
  const budget = createAuditBudget();
  // 2.5 MB total budget: the first two 1 MB fetches pass, the third exceeds the byte cap.
  await safeFetch('http://8.8.8.8/a', AbortSignal.timeout(1000), 1_500_000, budget);
  await safeFetch('http://8.8.8.8/b', AbortSignal.timeout(1000), 1_500_000, budget);
  const third = await safeFetch('http://8.8.8.8/c', AbortSignal.timeout(1000), 1_500_000, budget);
  assert.equal(third.truncated, true); // Clamped by the remaining byte budget.
  assert.ok(budget.bytes <= budget.maxBytes);
  // A fourth request is still within maxRequests (4); a fifth exceeds it.
  await safeFetch('http://8.8.8.8/d', AbortSignal.timeout(1000), 1_500_000, budget);
  await assert.rejects(safeFetch('http://8.8.8.8/e', AbortSignal.timeout(1000), 1_500_000, budget), /request_budget/);
  assert.ok(connections() >= 4);
});

test('a side fetch is scoped to the entered host, allowing only a www toggle', () => {
  assert.equal(sameSiteHost('example.com', 'www.example.com'), true);
  assert.equal(sameSiteHost('www.example.com', 'example.com'), true);
  assert.equal(sameSiteHost('example.com', 'cdn.example.com'), false);
  assert.equal(sameSiteHost('example.com', 'evil.test'), false);
});

test('a URL with a zone identifier is refused before any connection', () => {
  assert.throws(() => normalizeTarget('http://[fe80::1%25eth0]'));
});

test('three blocked URLs in the window lock the session out of audits', async () => {
  clearMemory();
  const sid = 'ssrf-lock-sid';
  await assert.doesNotReject(assertAuditUnlocked(sid));
  await recordBlockedUrl(sid); await recordBlockedUrl(sid);
  await assert.doesNotReject(assertAuditUnlocked(sid)); // Still under the threshold.
  await recordBlockedUrl(sid);
  await assert.rejects(assertAuditUnlocked(sid), (e) => e instanceof HttpError && e.status === 429);
});

test('the negative cache remembers a failing target briefly', async () => {
  clearMemory();
  const key = urlKey('https://down.example/');
  assert.equal(await isNegativelyCached(key), false);
  await cacheNegative(key);
  assert.equal(await isNegativelyCached(key), true);
});