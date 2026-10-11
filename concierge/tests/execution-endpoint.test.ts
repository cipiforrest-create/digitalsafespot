import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import execution, { sessionActorHash } from '../server/execution';
import { sign, type Request, type Response } from '../server/http';
import { buildExecutionPreview, decideApproval, hashIntent, hashPlan, hashChangeSet } from '../server/orchestrator/execution-preview';
import { type ExecutionRunRequest } from '../shared/execution-run';
import { type ExecutionRequest } from '../shared/execution';
import { readDraft } from '../server/execution/workspace';
import { serializeLeadPayload, type LeadCreateInput } from '../shared/lead-create';

// P3c HTTP execution API security tests. The route must: authenticate the session, resolve the TRUSTED actor
// server-side (never from the body), reject spoofing / malformed / cross-origin / kill-switched / tampered requests,
// enforce ownership on status reads, and return ONLY the sanitized projection. It reuses the existing guard() origin
// protection and cookie session — these tests prove the wiring fails closed.

const SECRET = 'exec-endpoint-test-secret-'.repeat(2);
process.env.CONCIERGE_SESSION_SECRET = SECRET;
const HOST = 'exec.example';
function clearMemory() { (globalThis as unknown as Record<symbol, Map<string, unknown> | undefined>)[Symbol.for('dx.concierge.store')]?.clear(); }

// Provision an owner: the trusted session whose id hashes into the server allowlist.
const OWNER_SID = 'owner-session-1';
function asOwner() { process.env.DX_EXECUTION_OWNERS = sessionActorHash(OWNER_SID); }

function cookie(sid: string) { return `dx_concierge=${sign({ sid, issuedAt: Date.now(), exp: Date.now() + 60000, audience: HOST })}`; }

function invoke(body: unknown, opts: { sid?: string; origin?: string; contentType?: string; noCookie?: boolean } = {}) {
  const headers: Record<string, string> = {
    host: HOST,
    origin: opts.origin ?? `https://${HOST}`,
    'content-type': opts.contentType ?? 'application/json',
  };
  if (!opts.noCookie) headers.cookie = cookie(opts.sid ?? OWNER_SID);
  const req = { method: 'POST', headers, body, socket: { remoteAddress: '127.0.0.7' } } as unknown as Request;
  let payload: unknown; let status = 200;
  const res = Object.assign(new EventEmitter(), {
    statusCode: 200, headersSent: false, writableEnded: false, destroyed: false,
    setHeader: () => undefined,
    end(v?: string) { status = (this as { statusCode: number }).statusCode; if (v) { try { payload = JSON.parse(v); } catch { /* non-JSON */ } } (this as { writableEnded: boolean }).writableEnded = true; },
  }) as unknown as Response;
  return { done: execution(req, res), payload: () => payload, status: () => status };
}

let seq = 0;
function makeRunBody(over: { mutate?: boolean } = {}) {
  seq += 1;
  const target = `ep${seq}:hero`;
  const request: ExecutionRequest = { objective: 'Refresh the hero headline', target, operation: 'cms_draft', goal: null };
  const changes = [{ target, summary: 'Replace the headline', before: null, after: 'Endpoint headline' }];
  const p = buildExecutionPreview({ request, capability: undefined as never }, changes);
  const approval = decideApproval(p.approval, p.plan, p.changeSet, true);
  // The client body OMITS the actor — the server injects it. We include everything else the run request needs.
  const run: Omit<ExecutionRunRequest, 'actor'> = {
    v: 1, executionId: randomUUID(), version: 1, approvalId: approval.id,
    intent: p.intent, plan: p.plan, changeSet: p.changeSet,
    expected: { intentHash: hashIntent(p.intent), planHash: hashPlan(p.plan), changeSetHash: hashChangeSet(p.changeSet) },
    approval, mode: over.mutate ? 'execute' : 'dry_run',
    idempotencyKey: `idem-${randomUUID()}`, requestedAt: Date.now(),
  };
  return { body: { action: 'execute' as const, request: run }, target };
}

// Build a lead.create execute body — the ONE intentionally-public operation a visitor may run end-to-end.
function makeLeadBody() {
  seq += 1;
  const target = 'lead:concierge';
  const input: LeadCreateInput = {
    contactName: `Visitor ${seq}`, contactEmail: `visitor${seq}@example.com`,
    message: 'I would like a website for my bakery.', company: 'Bakery doo', phone: '', source: 'concierge', consent: true,
  };
  const request: ExecutionRequest = { objective: 'Create a lead from the enquiry', target, operation: 'lead_create', goal: null };
  const changes = [{ target, summary: 'Create the lead record', before: null, after: serializeLeadPayload(input) }];
  const p = buildExecutionPreview({ request, capability: undefined as never }, changes);
  const approval = decideApproval(p.approval, p.plan, p.changeSet, true);
  const run: Omit<ExecutionRunRequest, 'actor'> = {
    v: 1, executionId: randomUUID(), version: 1, approvalId: approval.id,
    intent: p.intent, plan: p.plan, changeSet: p.changeSet,
    expected: { intentHash: hashIntent(p.intent), planHash: hashPlan(p.plan), changeSetHash: hashChangeSet(p.changeSet) },
    approval, mode: 'execute', idempotencyKey: `idem-${randomUUID()}`, requestedAt: Date.now(),
  };
  return { body: { action: 'execute' as const, request: run }, target };
}


// ---------------- Authentication / authorization ----------------
test('an unauthenticated request (no session cookie) is rejected', async () => {
  clearMemory(); asOwner();
  const { body } = makeRunBody();
  const call = invoke(body, { noCookie: true });
  await call.done;
  assert.equal(call.status(), 401);
});

test('an authenticated NON-owner (visitor) is rejected for a PRIVILEGED operation (fail closed, no fallback admin)', async () => {
  clearMemory(); asOwner();
  process.env.DX_EXECUTION = 'on';
  try {
    // P3e: a non-owner session now resolves to a VISITOR actor, but the privileged cms_draft operation is outside the
    // visitor allowlist, so the policy matrix denies it → 403. No session can self-promote to owner/admin.
    const { body } = makeRunBody();
    const call = invoke(body, { sid: 'not-an-owner' });
    await call.done;
    assert.equal(call.status(), 403);
  } finally { delete process.env.DX_EXECUTION; }
});

test('with no owners provisioned, a PRIVILEGED operation is still unavailable to a valid session', async () => {
  clearMemory(); delete process.env.DX_EXECUTION_OWNERS;
  process.env.DX_EXECUTION = 'on';
  try {
    // With no owner hashes, every session resolves to a VISITOR — which cannot run the privileged cms_draft → 403.
    const { body } = makeRunBody();
    const call = invoke(body, { sid: OWNER_SID });
    await call.done;
    assert.equal(call.status(), 403);
  } finally { delete process.env.DX_EXECUTION; }
});

test('the actor cannot be spoofed via the request body (extra actor field rejected)', async () => {
  clearMemory(); asOwner();
  const { body } = makeRunBody();
  const spoofed = { ...body, request: { ...body.request, actor: { actorId: 'evil', role: 'admin', sessionId: 'x', capabilities: [] } } };
  const call = invoke(spoofed);
  await call.done;
  assert.equal(call.status(), 400, 'the strict schema omits actor; an actor field is an unknown key');
});

// ---------------- Request hardening ----------------
test('malformed JSON body is rejected safely', async () => {
  clearMemory(); asOwner();
  const call = invoke('this is not an object');
  await call.done;
  assert.equal(call.status(), 400);
});

test('an unknown top-level field is rejected', async () => {
  clearMemory(); asOwner();
  const { body } = makeRunBody();
  const call = invoke({ ...body, hacked: true });
  await call.done;
  assert.equal(call.status(), 400);
});

test('a cross-origin request is rejected by the origin guard', async () => {
  clearMemory(); asOwner();
  const { body } = makeRunBody();
  const call = invoke(body, { origin: 'https://attacker.example' });
  await call.done;
  assert.equal(call.status(), 403);
});

test('a non-JSON content-type is rejected', async () => {
  clearMemory(); asOwner();
  const { body } = makeRunBody();
  const call = invoke(body, { contentType: 'text/plain' });
  await call.done;
  assert.equal(call.status(), 415);
});

// ---------------- Kill switch ----------------
test('the kill switch blocks API execution (503) even for an owner', async () => {
  clearMemory(); asOwner();
  const prev = process.env.DX_EXECUTION; delete process.env.DX_EXECUTION;
  try {
    const { body } = makeRunBody({ mutate: true });
    const call = invoke(body);
    await call.done;
    assert.equal(call.status(), 503);
    assert.equal((call.payload() as { errorCode?: string })?.errorCode, 'execution_disabled');
  } finally { if (prev !== undefined) process.env.DX_EXECUTION = prev; }
});

// ---------------- Approval tamper / expiry ----------------
test('a tampered approval hash is rejected (approval_mismatch)', async () => {
  clearMemory(); asOwner();
  process.env.DX_EXECUTION = 'on';
  try {
    const { body } = makeRunBody({ mutate: true });
    const tampered = { ...body, request: { ...body.request, approval: { ...body.request.approval, changeSetHash: 'deadbeef'.repeat(4) } } };
    const call = invoke(tampered);
    await call.done;
    assert.equal(call.status(), 409);
    assert.equal((call.payload() as { errorCode?: string })?.errorCode, 'approval_mismatch');
  } finally { delete process.env.DX_EXECUTION; }
});

// ---------------- Execute success + sanitized projection ----------------
test('an owner execute returns only the sanitized status projection (no secrets)', async () => {
  clearMemory(); asOwner();
  process.env.DX_EXECUTION = 'on';
  try {
    const { body, target } = makeRunBody({ mutate: true });
    const call = invoke(body);
    await call.done;
    assert.equal(call.status(), 200);
    const payload = call.payload() as { status: Record<string, unknown> };
    assert.equal(payload.status.status, 'succeeded');
    // The projection exposes coarse fields only — never actor ids, hashes, rollback refs or before/after content.
    const serialized = JSON.stringify(payload);
    assert.equal(serialized.includes('actorId'), false);
    assert.equal(serialized.includes('changeSetHash'), false);
    assert.equal(serialized.includes('rollback') && serialized.includes('ref":"'), false);
    assert.equal(serialized.includes('Endpoint headline'), false);
    // The mutation actually happened.
    assert.equal((await readDraft(target))!.content, 'Endpoint headline');
  } finally { delete process.env.DX_EXECUTION; }
});

// ---------------- Status endpoint ownership ----------------
test('the status endpoint returns an owner-created receipt but 404s for a non-owner of that receipt', async () => {
  clearMemory(); asOwner();
  process.env.DX_EXECUTION = 'on';
  try {
    const { body } = makeRunBody({ mutate: true });
    const run = invoke(body);
    await run.done;
    const executionId = body.request.executionId;
    // Owner can read the status.
    const ok = invoke({ action: 'status', executionId });
    await ok.done;
    assert.equal(ok.status(), 200);
    assert.equal((ok.payload() as { status: { status: string } }).status.status, 'succeeded');
    // A different owner (different session hash) cannot read another actor's receipt just by knowing the id.
    const otherSid = 'owner-session-2';
    process.env.DX_EXECUTION_OWNERS = `${sessionActorHash(OWNER_SID)},${sessionActorHash(otherSid)}`;
    const denied = invoke({ action: 'status', executionId }, { sid: otherSid });
    await denied.done;
    assert.equal(denied.status(), 404, 'ownership is enforced on status reads');
  } finally { delete process.env.DX_EXECUTION; }
});

// ---------------- Unsupported provider stays blocked ----------------
test('an unsupported operation is blocked through the API (422)', async () => {
  clearMemory(); asOwner();
  process.env.DX_EXECUTION = 'on';
  try {
    // Build a preview for a different, non-registered operation and try to run it.
    const target = 'unsupp:hero';
    const request: ExecutionRequest = { objective: 'x', target, operation: 'copy_change', goal: null };
    const changes = [{ target, summary: 's', before: null, after: 'y' }];
    const p = buildExecutionPreview({ request, capability: undefined as never }, changes);
    const approval = decideApproval(p.approval, p.plan, p.changeSet, true);
    const run = {
      v: 1 as const, executionId: randomUUID(), version: 1, approvalId: approval.id,
      intent: p.intent, plan: p.plan, changeSet: p.changeSet,
      expected: { intentHash: hashIntent(p.intent), planHash: hashPlan(p.plan), changeSetHash: hashChangeSet(p.changeSet) },
      approval, mode: 'execute' as const, idempotencyKey: `idem-${randomUUID()}`, requestedAt: Date.now(),
    };
    const call = invoke({ action: 'execute', request: run });
    await call.done;
    assert.equal(call.status(), 422);
    assert.equal((call.payload() as { errorCode?: string })?.errorCode, 'unsupported_operation');
  } finally { delete process.env.DX_EXECUTION; }
});

// ---------------- P3e: the public lead.create flow works for a VISITOR session ----------------
test('a non-owner (visitor) session CAN execute the public lead.create operation', async () => {
  clearMemory(); asOwner();
  process.env.DX_EXECUTION = 'on';
  try {
    // A plain signed session (NOT in the owner allowlist) resolves to a VISITOR actor. lead.create is the single
    // intentionally-public capability, so the policy matrix allows it and the engine runs the full safety chain.
    const { body } = makeLeadBody();
    const call = invoke(body, { sid: 'public-visitor-session' });
    await call.done;
    assert.equal(call.status(), 200);
    const payload = call.payload() as { status: { status: string } };
    assert.equal(payload.status.status, 'succeeded');
    // The sanitized projection still leaks nothing sensitive (no actor id, email or raw payload content).
    const serialized = JSON.stringify(payload);
    assert.equal(serialized.includes('actorId'), false);
    assert.doesNotMatch(serialized, /@|example\.com|contactEmail/i);
  } finally { delete process.env.DX_EXECUTION; }
});

// ---------------- P3e: the readiness diagnostic is OWNER-ONLY ----------------
test('the diagnostic action is owner-only (a visitor is denied, an owner gets booleans)', async () => {
  clearMemory(); asOwner();
  process.env.DX_EXECUTION = 'on';
  try {
    // A visitor session is a valid actor but NOT privileged — the diagnostic is re-checked for role === 'owner'.
    const denied = invoke({ action: 'diagnostic' }, { sid: 'public-visitor-session' });
    await denied.done;
    assert.equal(denied.status(), 403, 'a visitor cannot read the readiness diagnostic');
    // The provisioned owner session can read it; the payload is the whitelisted booleans projection only.
    const ok = invoke({ action: 'diagnostic' }, { sid: OWNER_SID });
    await ok.done;
    assert.equal(ok.status(), 200);
    const payload = ok.payload() as { diagnostic: Record<string, unknown> };
    assert.equal(payload.diagnostic.diagnosticSafe, true);
    assert.doesNotMatch(JSON.stringify(payload), /@|example\.com|token|secret|apikey/i);
  } finally { delete process.env.DX_EXECUTION; }
});

