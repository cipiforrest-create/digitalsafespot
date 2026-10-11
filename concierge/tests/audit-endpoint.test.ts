import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { randomUUID } from 'node:crypto';
import audit from '../server/audit';
import { sign, type Request, type Response } from '../server/http';
import { getAuditRecord } from '../server/state/audit-record';

const SECRET = 'unit-test-session-secret-'.repeat(3);
process.env.CONCIERGE_SESSION_SECRET = SECRET;
function clearMemory() { (globalThis as unknown as Record<symbol, Map<string, unknown> | undefined>)[Symbol.for('dx.concierge.store')]?.clear(); }

// A mock http.request that returns 200 text/html and counts how many page fetches happen. Side fetches
// (robots/sitemap) reuse the same handler; we count only fetches to the audited path via a URL predicate.
function mockHttp(t: { mock: { method: typeof import('node:test').mock.method } }, plan: (url: URL) => { status: number; headers: http.IncomingHttpHeaders; body?: Buffer }) {
  const pageFetches: string[] = [];
  const impl = ((url: URL, options: http.RequestOptions, callback: (value: http.IncomingMessage) => void) => {
    (options.lookup as (h: string, o: object, cb: (e: Error | null, a: string, f: number) => void) => void)?.('x', {}, () => undefined);
    const request = new EventEmitter() as EventEmitter & { end: () => void };
    request.end = () => queueMicrotask(() => {
      const target = new URL(url.href);
      if (!/robots\.txt|sitemap/.test(target.pathname)) pageFetches.push(target.href);
      const p = plan(target);
      const incoming = new PassThrough() as unknown as http.IncomingMessage;
      incoming.statusCode = p.status; incoming.headers = p.headers;
      callback(incoming);
      if (p.body) incoming.emit('data', p.body);
      if (p.status < 300 || p.status >= 400) incoming.emit('end');
    });
    return request;
  }) as typeof http.request;
  t.mock.method(http, 'request', impl);
  t.mock.method(https, 'request', impl);
  return () => pageFetches.length;
}

const PAGE = Buffer.from('<html lang="bs"><head><title>Digital X — web i AI agencija</title><meta name="description" content="Cinematic web stranice i AI asistenti za firme u BiH."><meta name="viewport" content="width=device-width"></head><body><main><h1>Usluge</h1><p>Nudimo usluge web izrade.</p><a href="mailto:a@b.c">Kontakt</a></main></body></html>');

function invoke(body: unknown, sid: string) {
  const events: { event: string; data: unknown }[] = [];
  const req = { method: 'POST', headers: { host: 'qa.example', origin: 'https://qa.example', 'content-type': 'application/json', cookie: `dx_concierge=${sign({ sid, issuedAt: Date.now(), exp: Date.now() + 60000, audience: 'qa.example' })}` }, body, socket: { remoteAddress: '127.0.0.9' } } as unknown as Request;
  const res = Object.assign(new EventEmitter(), {
    statusCode: 200, headersSent: false, writableEnded: false, destroyed: false,
    setHeader: () => undefined, flushHeaders() { (this as { headersSent: boolean }).headersSent = true; },
    write(chunk: string) { const m = /^event: (.+)\ndata: (.+)\n\n$/.exec(chunk); if (m) events.push({ event: m[1], data: JSON.parse(m[2]) }); return true; },
    end(v?: string) { if (v) { try { events.push({ event: 'json', data: JSON.parse(v) }); } catch { /* non-JSON */ } } (this as { writableEnded: boolean }).writableEnded = true; },
  }) as unknown as Response;
  return { done: audit(req, res), events, status: () => (res as { statusCode: number }).statusCode };
}

test('an audit persists a record and emits both facts (auditId) and a signed result', async (t) => {
  clearMemory();
  mockHttp(t, () => ({ status: 200, headers: { 'content-type': 'text/html' }, body: PAGE }));
  const sid = randomUUID();
  const call = invoke({ url: 'https://8.8.8.8/' }, sid);
  await call.done;
  const facts = call.events.find(e => e.event === 'facts')?.data as { auditId: string; status: string; facts: { title: string } } | undefined;
  const result = call.events.find(e => e.event === 'result')?.data as { signature: string; checks: unknown[] } | undefined;
  assert.ok(facts, 'facts event emitted');
  assert.equal(facts!.status, 'completed');
  assert.ok(facts!.facts.title.includes('Digital X'));
  assert.ok(result?.signature, 'signed result still emitted for the legacy client');
  const record = await getAuditRecord(facts!.auditId, sid);
  assert.ok(record, 'record persisted and readable by the owning session');
});

test('five identical same-session requests cause exactly one page fetch', async (t) => {
  clearMemory();
  const pageFetches = mockHttp(t, () => ({ status: 200, headers: { 'content-type': 'text/html' }, body: PAGE }));
  const sid = randomUUID();
  let firstId = '';
  for (let i = 0; i < 5; i++) {
    const call = invoke({ url: 'https://8.8.8.8/' }, sid);
    await call.done;
    const facts = call.events.find(e => e.event === 'facts')?.data as { auditId: string } | undefined;
    assert.ok(facts?.auditId);
    if (i === 0) firstId = facts!.auditId; else assert.equal(facts!.auditId, firstId, 'reuse returns the same record');
  }
  assert.equal(pageFetches(), 1, 'only the first request fetched the page');
});

test('a record cannot be read across sessions (auditId lookup returns 404)', async (t) => {
  clearMemory();
  mockHttp(t, () => ({ status: 200, headers: { 'content-type': 'text/html' }, body: PAGE }));
  const owner = randomUUID();
  const created = invoke({ url: 'https://8.8.8.8/' }, owner);
  await created.done;
  const auditId = (created.events.find(e => e.event === 'facts')?.data as { auditId: string }).auditId;
  // Same owner can look it up by id.
  const reload = invoke({ auditId }, owner);
  await reload.done;
  assert.ok(reload.events.some(e => e.event === 'facts'), 'owner reload succeeds');
  // A different session gets a 404.
  const intruder = invoke({ auditId }, randomUUID());
  await intruder.done;
  assert.equal(intruder.status(), 404);
  assert.equal(await getAuditRecord(auditId, randomUUID()), null);
});

test('the v2 request needs only a url; legacy industry/market/objective are still accepted', async (t) => {
  clearMemory();
  mockHttp(t, () => ({ status: 200, headers: { 'content-type': 'text/html' }, body: PAGE }));
  const bare = invoke({ url: 'https://8.8.8.8/' }, randomUUID());
  await bare.done;
  assert.ok(bare.events.some(e => e.event === 'facts'), 'url-only request works');
  clearMemory();
  const legacy = invoke({ url: 'https://8.8.8.8/', industry: 'Retail', market: 'BiH', objective: 'AI visibility' }, randomUUID());
  await legacy.done;
  assert.ok(legacy.events.some(e => e.event === 'facts'), 'legacy body still accepted for one release');
});

test('a partial (truncated) page is recorded with partial status', async (t) => {
  clearMemory();
  mockHttp(t, () => ({ status: 200, headers: { 'content-type': 'text/html' }, body: Buffer.concat([PAGE, Buffer.alloc(2_000_000, 0x20)]) }));
  const call = invoke({ url: 'https://8.8.8.8/' }, randomUUID());
  await call.done;
  const facts = call.events.find(e => e.event === 'facts')?.data as { status: string } | undefined;
  assert.equal(facts?.status, 'partial');
});

test('a request with neither url nor auditId is rejected', async (t) => {
  clearMemory();
  mockHttp(t, () => ({ status: 200, headers: { 'content-type': 'text/html' }, body: PAGE }));
  const call = invoke({}, randomUUID());
  await call.done;
  assert.equal(call.status(), 400);
});