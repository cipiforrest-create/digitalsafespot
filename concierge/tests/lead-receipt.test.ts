import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import lead from '../server/lead';
import { sign, type Request, type Response } from '../server/http';
import { emptyBrief, captureField, advance } from '../server/orchestrator/project-brief';
import { saveBrief } from '../server/state/brief-state';
import { toReceiptCard } from '../server/orchestrator/lead-receipt';
import type { Receipt } from '../shared/lead-receipt';

// T22 LeadDestination / receipts / lead v2. Core rule under test: NO RECEIPT = NO CLAIM. The visitor result claims
// success (delivered:true) ONLY when a destination actually accepted; every failure/unconfigured path is not_delivered.

const SECRET = 'unit-test-session-secret-'.repeat(3);
// A unique per-session forwarded IP so the shared per-IP daily lead cap does not bleed across independent tests.
const ipFor = (sid: string) => `10.${(parseInt(sid.slice(0, 2), 16))}.${parseInt(sid.slice(2, 4), 16)}.${parseInt(sid.slice(4, 6), 16)}`;
function request(body: unknown, sid: string): Request {
  return { method: 'POST', headers: { host: 'qa.example', origin: 'https://qa.example', 'content-type': 'application/json', 'accept-language': 'en', 'x-forwarded-for': ipFor(sid), cookie: `dx_concierge=${sign({ sid, exp: Date.now() + 60000, audience: 'qa.example' })}` }, body, socket: { remoteAddress: '127.0.0.1' } } as unknown as Request;
}
async function invoke(body: unknown, sid: string) {
  let output = '';
  const res = Object.assign(new EventEmitter(), { statusCode: 200, setHeader: () => undefined, end: (v: string) => { output = v; } }) as unknown as Response;
  await lead(request(body, sid), res);
  return { status: res.statusCode, body: output ? JSON.parse(output) : {} };
}
/** Seed a ready-for-review brief for a session directly in the (memory) KV store. */
async function seedReadyBrief(sid: string) {
  const b = emptyBrief(sid, null);
  captureField(b, 'problem', 'gubimo upite', 'gubimo upite svaki dan', 'visitor');
  captureField(b, 'contactName', 'QA only', 'ja sam QA only', 'visitor');
  captureField(b, 'contactEmail', 'qa@example.com', 'mail qa@example.com', 'visitor');
  advance(b, 'en');
  assert.equal(b.status, 'ready_for_review');
  await saveBrief(b);
}
const v2 = () => ({ v: 2 as const, submissionId: randomUUID(), consent: true as const, website: '' });

function reset() {
  process.env.CONCIERGE_SESSION_SECRET = SECRET;
  delete process.env.N8N_WEBHOOK_URL; delete process.env.RESEND_API_KEY; delete process.env.DX_LEAD_V1;
}

// ---------- NO RECEIPT = NO CLAIM: no destination configured ----------
test('v2 with no destination configured never claims delivery', async () => {
  reset();
  const sid = randomUUID(); await seedReadyBrief(sid);
  const res = await invoke(v2(), sid);
  assert.equal(res.status, 200);
  assert.equal(res.body.delivered, false);
  assert.equal(res.body.status, 'not_delivered');
  assert.deepEqual(res.body.channels, []);
});

// ---------- Webhook success yields an accepted receipt and a saved claim ----------
test('v2 webhook success returns delivered with the webhook channel only', async (t) => {
  reset(); process.env.N8N_WEBHOOK_URL = 'https://automation.example/webhook';
  const sid = randomUUID(); await seedReadyBrief(sid);
  let sends = 0;
  t.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    sends++; assert.equal(new Headers(init.headers).get('Idempotency-Key')?.length, 36);
    return new globalThis.Response('{}', { status: 200 });
  });
  const res = await invoke(v2(), sid);
  assert.equal(sends, 1);
  assert.equal(res.body.delivered, true);
  assert.deepEqual(res.body.channels, ['webhook']);
});

// ---------- Webhook failure never claims delivery (fail-open, retryable) ----------
test('v2 webhook 5xx is not reported as delivered', async (t) => {
  reset(); process.env.N8N_WEBHOOK_URL = 'https://automation.example/webhook';
  const sid = randomUUID(); await seedReadyBrief(sid);
  t.mock.method(globalThis, 'fetch', async () => new globalThis.Response('', { status: 503 }));
  const res = await invoke(v2(), sid);
  assert.equal(res.status, 200);            // fail-open: the request itself succeeds
  assert.equal(res.body.delivered, false);  // but NO CLAIM without a receipt
  assert.deepEqual(res.body.channels, []);
});

// ---------- Email (Resend) success is an accepted receipt and a human-reply claim ----------
test('v2 email success returns delivered with the email channel', async (t) => {
  reset(); process.env.RESEND_API_KEY = 're_unit_test';
  const sid = randomUUID(); await seedReadyBrief(sid);
  let sends = 0;
  t.mock.method(globalThis, 'fetch', async () => { sends++; return new globalThis.Response('{}', { status: 200 }); });
  const res = await invoke(v2(), sid);
  assert.equal(sends, 1);
  assert.equal(res.body.delivered, true);
  assert.deepEqual(res.body.channels, ['email']);
  assert.match(res.body.message, /reply to the email/i);
});

// ---------- One concurrent delivery: two identical submissions dispatch once ----------
test('two concurrent identical v2 submissions dispatch exactly once', async (t) => {
  reset(); process.env.N8N_WEBHOOK_URL = 'https://automation.example/webhook';
  const sid = randomUUID(); await seedReadyBrief(sid);
  let sends = 0;
  t.mock.method(globalThis, 'fetch', async () => { sends++; return new globalThis.Response('{}', { status: 200 }); });
  const payload = v2();
  const [a, b] = await Promise.all([invoke(payload, sid), invoke(payload, sid)]);
  assert.equal(sends, 1);
  assert.equal(a.body.delivered, true);
  assert.equal(b.body.delivered, true);
});

// ---------- Replay: a later identical submission returns the same receipts without re-dispatching ----------
test('v2 replay returns the stored receipts and does not re-dispatch', async (t) => {
  reset(); process.env.N8N_WEBHOOK_URL = 'https://automation.example/webhook';
  const sid = randomUUID(); await seedReadyBrief(sid);
  let sends = 0;
  t.mock.method(globalThis, 'fetch', async () => { sends++; return new globalThis.Response('{}', { status: 200 }); });
  const payload = v2();
  await invoke(payload, sid);
  const replay = await invoke(payload, sid);
  assert.equal(sends, 1);
  assert.equal(replay.body.delivered, true);
  assert.deepEqual(replay.body.channels, ['webhook']);
});

// ---------- Stale brief: brief content changed after a recorded dispatch → 409 ----------
test('v2 stale brief (content changed after dispatch) is a 409 conflict', async (t) => {
  reset(); process.env.N8N_WEBHOOK_URL = 'https://automation.example/webhook';
  const sid = randomUUID(); await seedReadyBrief(sid);
  t.mock.method(globalThis, 'fetch', async () => new globalThis.Response('{}', { status: 200 }));
  const payload = v2();
  await invoke(payload, sid);
  // Change the brief content, then replay the same submissionId.
  const changed = emptyBrief(sid, null);
  captureField(changed, 'problem', 'nešto drugo', 'nešto drugo sad', 'visitor');
  captureField(changed, 'contactName', 'QA only', 'ja sam QA only', 'visitor');
  captureField(changed, 'contactEmail', 'qa@example.com', 'mail qa@example.com', 'visitor');
  advance(changed, 'en');
  await saveBrief(changed);
  const res = await invoke(payload, sid);
  assert.equal(res.status, 409);
});

// ---------- Brief not ready → 409, nothing dispatched ----------
test('v2 with a brief that is not ready is rejected without dispatch', async (t) => {
  reset(); process.env.N8N_WEBHOOK_URL = 'https://automation.example/webhook';
  const sid = randomUUID();
  const b = emptyBrief(sid, null); // collecting, not ready
  captureField(b, 'problem', 'gubimo upite', 'gubimo upite svaki dan', 'visitor');
  advance(b, 'en'); await saveBrief(b);
  let sends = 0; t.mock.method(globalThis, 'fetch', async () => { sends++; return new globalThis.Response('{}', { status: 200 }); });
  const res = await invoke(v2(), sid);
  assert.equal(res.status, 409);
  assert.equal(sends, 0);
});

// ---------- Honeypot: accepted silently, nothing dispatched, no claim ----------
test('v2 honeypot is accepted silently with no dispatch and no claim', async (t) => {
  reset(); process.env.N8N_WEBHOOK_URL = 'https://automation.example/webhook';
  const sid = randomUUID(); await seedReadyBrief(sid);
  let sends = 0; t.mock.method(globalThis, 'fetch', async () => { sends++; return new globalThis.Response('{}', { status: 200 }); });
  const res = await invoke({ ...v2(), website: 'spam' }, sid);
  assert.equal(res.status, 200);
  assert.equal(res.body.delivered, false);
  assert.equal(sends, 0);
});

// ---------- v1 rollback flag forces the legacy path (v2 body treated as legacy → invalid) ----------
test('DX_LEAD_V1=on routes a v2 body through the legacy validator', async () => {
  reset(); process.env.DX_LEAD_V1 = 'on';
  const sid = randomUUID(); await seedReadyBrief(sid);
  const res = await invoke(v2(), sid); // v2 body is not a valid legacy lead
  assert.equal(res.status, 400);
});

// ---------- Success-claim stripping: card message reflects ONLY accepted receipts ----------
test('toReceiptCard derives the claim only from accepted receipts', () => {
  const failedOnly: Receipt[] = [{ kind: 'webhook', status: 'failed', reference: null, at: Date.now() }];
  const card = toReceiptCard(failedOnly, 'en');
  assert.equal(card.delivered, false);
  assert.deepEqual(card.channels, []);
  assert.doesNotMatch(card.message, /sent to the Digital X team/i);

  const emailAccepted: Receipt[] = [
    { kind: 'email', status: 'accepted', reference: 'x-team', at: Date.now() },
    { kind: 'webhook', status: 'failed', reference: null, at: Date.now() },
  ];
  const ok = toReceiptCard(emailAccepted, 'en');
  assert.equal(ok.delivered, true);
  assert.deepEqual(ok.channels, ['email']); // the failed webhook is never claimed
});
