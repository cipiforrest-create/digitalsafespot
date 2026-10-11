import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
// Regression A (§ legacy /api/lead contract). The production homepage forms (js/main.js) POST a plain
// {izvor, vrijeme, kontakt|email, ...} body to /api/lead and rely on: honeypot => 200, missing contact => 400,
// no N8N_WEBHOOK_URL => 503 {fallback:true} (client mailto fallback), n8n OK => 200 {ok:true}, n8n failure =>
// 503 {fallback:true}. The upgraded Concierge MUST NOT change this legacy path; only `source:'AI Concierge'`
// bodies are delegated to the concierge lead engine. This test pins that contract so the port cannot regress it.
const require = createRequire(import.meta.url);
// api/lead.js is a CommonJS Vercel function at the site root; load it exactly as the platform would.
const legacyLead = require(resolve('api/lead.js')) as (req: unknown, res: unknown) => Promise<void>;

type Captured = { statusCode: number; body: unknown };
function responder(): { res: unknown; captured: Captured } {
  const captured: Captured = { statusCode: 0, body: undefined };
  const res = {
    status(code: number) { captured.statusCode = code; return this; },
    json(value: unknown) { captured.body = value; return this; },
  };
  return { res, captured };
}
function legacyRequest(body: unknown, method = 'POST'): unknown {
  return { method, headers: { 'user-agent': 'qa-agent', 'x-forwarded-for': '203.0.113.7' }, body };
}
async function invokeLegacy(body: unknown, method = 'POST') {
  const { res, captured } = responder();
  await legacyLead(legacyRequest(body, method), res);
  return captured;
}
const formBody = () => ({ ime: 'QA only', kontakt: 'qa@example.com', poruka: 'Synthetic test; do not contact.', izvor: '/kontakt.html', vrijeme: new Date().toISOString() });

test('legacy /api/lead: method guard, honeypot and missing contact', async () => {
  delete process.env.N8N_WEBHOOK_URL;
  assert.equal((await invokeLegacy({}, 'GET')).statusCode, 405);
  // Honeypot tripped: pretend success so bots do not retry, and never forward.
  assert.deepEqual(await invokeLegacy({ ...formBody(), website: 'bot-filled' }), { statusCode: 200, body: { ok: true } });
  // A legacy body with neither kontakt nor email is rejected with 400.
  assert.equal((await invokeLegacy({ ime: 'No contact', izvor: '/x' })).statusCode, 400);
});

test('legacy /api/lead: unconfigured transport returns the mailto fallback contract', async () => {
  delete process.env.N8N_WEBHOOK_URL;
  assert.deepEqual(await invokeLegacy(formBody()), { statusCode: 503, body: { fallback: true } });
});

test('legacy /api/lead: forwards to n8n and reports delivery, preserving the legacy shape', async (t) => {
  process.env.N8N_WEBHOOK_URL = 'https://automation.example/legacy-webhook';
  let forwardedTo = ''; let forwarded: Record<string, unknown> = {};
  t.mock.method(globalThis, 'fetch', async (url: unknown, init: RequestInit) => {
    forwardedTo = String(url); forwarded = JSON.parse(init.body as string);
    return new globalThis.Response('{}', { status: 200 });
  });
  const result = await invokeLegacy(formBody());
  assert.deepEqual(result, { statusCode: 200, body: { ok: true } });
  assert.equal(forwardedTo, 'https://automation.example/legacy-webhook');
  // The legacy payload is forwarded verbatim plus server-added audit metadata.
  assert.equal(forwarded.kontakt, 'qa@example.com');
  assert.equal(forwarded.izvor, '/kontakt.html');
  assert.equal(typeof forwarded.primljeno, 'string');
  assert.equal(forwarded.ua, 'qa-agent');
  assert.equal(forwarded.ip, '203.0.113.7');
  delete process.env.N8N_WEBHOOK_URL;
});

test('legacy /api/lead: an n8n failure is never reported as delivered (mailto fallback)', async (t) => {
  process.env.N8N_WEBHOOK_URL = 'https://automation.example/legacy-webhook';
  t.mock.method(globalThis, 'fetch', async () => new globalThis.Response('', { status: 500 }));
  assert.deepEqual(await invokeLegacy(formBody()), { statusCode: 503, body: { fallback: true } });
  delete process.env.N8N_WEBHOOK_URL;
});

test('coexistence: a legacy body is NOT routed to the Concierge lead engine', async (t) => {
  // A body without source:'AI Concierge' must stay on the legacy path. With no webhook configured it returns the
  // legacy fallback contract and never touches the concierge engine (which would require a session + 400/401).
  delete process.env.N8N_WEBHOOK_URL;
  let fetched = false;
  t.mock.method(globalThis, 'fetch', async () => { fetched = true; return new globalThis.Response('{}', { status: 200 }); });
  assert.deepEqual(await invokeLegacy(formBody()), { statusCode: 503, body: { fallback: true } });
  assert.equal(fetched, false);
});
