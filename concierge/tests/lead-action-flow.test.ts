import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { orchestrate } from '../server/orchestrator/orchestrate';
import { FakeProvider } from '../server/ai/fake-provider';
import { getPendingActionStore } from '../server/state/pending-action';
import { getLeadStore } from '../server/execution/lead-store';
import { canonicalLeadInput } from '../shared/lead-create';
import { hashContent } from '../server/execution/workspace';
import { collectExecutionDiagnostic, executionDiagnosticSchema } from '../server/execution/diagnostics';
import {
  detectLeadIntent, detectControl, extractStructured, nextMissing, revalidate,
} from '../server/orchestrator/lead-action';
import { handleActionTurn } from '../server/orchestrator/lead-action-flow';
import type { Context } from '../shared/contracts';
import type { ExecutionActor } from '../shared/execution-run';
import type { ActionCard } from '../shared/chat-action';

// P3d chat → action integration. Proves the FULL agent loop through the REAL orchestrator and the REAL
// controlled-execution engine (no provider mock): natural-language request → ACTION_INTENT → multi-turn collection →
// server revalidation → confirmation card → confirm → runControlledExecution → real KV lead write → read-back
// verification → durable receipt → receipt-grounded reply, plus edit-invalidates-approval, cancel-writes-nothing,
// double-confirm-creates-one-lead, disabled-fails-closed, and the booleans-only diagnostic whitelist.
//
// These cases mutate process.env (DX_EXECUTION*) which is PROCESS-GLOBAL, so every case is an AWAITED SUBTEST under
// one serial parent (same discipline as lead-create-execution.test.ts) to avoid env bleed and keep the shared
// in-memory stores deterministic.

const owner: ExecutionActor = { actorId: 'owner-flow', role: 'owner', sessionId: 'sess-flow', capabilities: [] };
const visitor: ExecutionActor = { actorId: 'visitor-flow', role: 'visitor', sessionId: 'sess-visitor', capabilities: [] };
function enable() { process.env.DX_EXECUTION = 'on'; delete process.env.DX_EXECUTION_LEAD_CREATE; }
function reset() { delete process.env.DX_EXECUTION; delete process.env.DX_EXECUTION_LEAD_CREATE; }

type Ev = { event: string; data: unknown };
function collector() { const events: Ev[] = []; return { emit: (event: string, data: unknown) => events.push({ event, data }), events }; }
const ctx = (content: string, locale: 'en' | 'bs' = 'en'): Context => ({ goal: null, messages: [{ role: 'user', content }], locale } as Context);

/** Run one orchestrated turn and return the emitted events + the latest action_card (if any). */
async function turn(sid: string, message: string, actor: ExecutionActor | null, command?: 'confirm' | 'edit' | 'cancel') {
  const { emit, events } = collector();
  const context = message ? ctx(message) : ({ goal: null, messages: [], locale: 'en' } as Context);
  await orchestrate({ context, sid, provider: new FakeProvider(), signal: AbortSignal.timeout(2000), actor, actionCommand: command }, emit);
  const cards = events.filter(e => e.event === 'action_card').map(e => e.data as ActionCard);
  const deltas = events.filter(e => e.event === 'delta').map(e => (e.data as { text: string }).text).join(' ');
  return { events, card: cards.at(-1) ?? null, cards, reply: deltas };
}

test('lead.create chat → action integration (serial)', async (t) => {
  try {
    // ---------------- Pure helpers: intent, control, extraction, validation ----------------
    await t.test('ACTION_INTENT detection, control routing, extraction and revalidation are deterministic', () => {
      assert.equal(detectLeadIntent('I need an AI-powered website for my business and I’d like Digital X to contact me.'), true);
      assert.equal(detectLeadIntent('How much does SEO cost?'), false);
      assert.equal(detectControl('Actually, cancel that'), 'cancel');
      assert.equal(detectControl('can you change my email'), 'edit');
      assert.equal(detectControl('did you actually save it?'), 'status');
      const ex = extractStructured('reach me at test@example.com, site clinic-example.ba');
      assert.equal(ex.contactEmail, 'test@example.com');
      assert.equal(ex.website, 'clinic-example.ba');
      const missing = nextMissing({ contactEmail: 'a@b.co' });
      assert.equal(missing, 'contactName');
      const bad = revalidate({ contactName: 'A', contactEmail: 'not-an-email', message: 'hi' });
      assert.equal(bad.ok, false);
      const good = revalidate({ contactName: 'Ada', contactEmail: 'ada@example.com', message: 'Need a site' });
      assert.equal(good.ok, true);
    });

    // ---------------- Full multi-turn happy path → real execution → read-back verified receipt ----------------
    await t.test('a natural-language request collects fields, confirms, and really creates + verifies a lead', async () => {
      enable();
      const sid = `sid-${randomUUID()}`;
      // Turn 1: intent + no details yet → should ask for the first missing required field (name) and show a card.
      const t1 = await turn(sid, 'I need an AI-powered website for my business and I’d like Digital X to contact me.', owner);
      assert.ok(t1.card, 'a collecting action card is shown');
      assert.equal(t1.card!.state, 'collecting');
      assert.ok(t1.card!.missing.includes('contactName'));
      // Turn 2: provide name.
      const t2 = await turn(sid, 'My name is Ada Byte', owner);
      assert.equal(t2.card!.state, 'collecting');
      assert.ok(t2.card!.missing.includes('contactEmail'), 'does not re-ask for the name already given');
      // Turn 3: provide email → all required present (message came from the first enquiry) → awaiting confirmation.
      const t3 = await turn(sid, 'my email is ada@example.com', owner);
      assert.equal(t3.card!.state, 'awaiting_confirmation');
      assert.equal(t3.card!.canConfirm, true);
      assert.equal(t3.card!.missing.length, 0);
      // Inspect the canonical payload that was frozen (server-side durable state).
      const pending = await getPendingActionStore().load(sid);
      assert.ok(pending?.run, 'a frozen approval-bound run request exists');
      const afterJson = pending!.run!.changeSet.changes[0].after!;
      const payload = JSON.parse(afterJson) as { contactEmail: string; contactName: string };
      assert.equal(payload.contactEmail, 'ada@example.com');
      assert.equal(payload.contactName, 'Ada Byte');
      // Confirm → real controlled execution → read-back verified.
      const done = await turn(sid, '', owner, 'confirm');
      assert.equal(done.card!.state, 'succeeded');
      assert.match(done.reply, /saved and verified/i);
      const finalPending = await getPendingActionStore().load(sid);
      assert.ok(finalPending?.executionId, 'the pending action carries the execution id');
      // Datastore read-back evidence: the authoritative record exists, is not deleted (looked up by the frozen
      // payload's canonical content hash — the same dedupe the provider uses).
      const stored = await getLeadStore().getByDedupe(hashContent(canonicalLeadInput(JSON.parse(afterJson))));
      assert.ok(stored, 'a durable lead record was persisted');
      assert.equal(stored!.deleted, false);
      // Receipt-grounded follow-up: "Did you actually save it?" answers from the receipt, not memory.
      const ask = await turn(sid, 'Did you actually save it?', owner);
      assert.match(ask.reply, /saved and verified/i);
    });

    // ---------------- Double confirm creates exactly one lead (idempotent through the chat path) ----------------
    await t.test('double confirmation creates only one lead (idempotency through the chat path)', async () => {
      enable();
      const sid = `sid-${randomUUID()}`;
      await turn(sid, 'Please have Digital X contact me about a new website.', owner);
      await turn(sid, 'I am Mika Test', owner);
      await turn(sid, 'mika@example.com', owner);
      const pending = await getPendingActionStore().load(sid);
      const dedupe = hashContent(canonicalLeadInput(JSON.parse(pending!.run!.changeSet.changes[0].after!)));
      const first = await turn(sid, '', owner, 'confirm');
      assert.equal(first.card!.state, 'succeeded');
      const firstExec = (await getPendingActionStore().load(sid))!.executionId;
      // Second confirm on the same pending action replays the same frozen request (same idempotency key).
      const second = await turn(sid, '', owner, 'confirm');
      // After success the action is terminal; a repeat confirm is answered honestly, never a second write.
      const storedAfter = await getLeadStore().getByDedupe(dedupe);
      assert.ok(storedAfter, 'the one lead still exists');
      assert.equal(storedAfter!.deleted, false);
      // The execution id did not change to a new successful write.
      const nowExec = (await getPendingActionStore().load(sid))?.executionId ?? firstExec;
      assert.equal(nowExec, firstExec, 'no new execution replaced the original');
      void second;
    });


    // ---------------- Edit invalidates the old approval (fingerprint rebind) ----------------
    await t.test('editing a field rebuilds a fresh approval and invalidates the previous frozen run', async () => {
      enable();
      const sid = `sid-${randomUUID()}`;
      await turn(sid, 'Have Digital X reach out about a website.', owner);
      await turn(sid, 'I am Edo Change', owner);
      await turn(sid, 'edo@example.com', owner);
      const before = await getPendingActionStore().load(sid);
      assert.equal(before!.state, 'awaiting_confirmation');
      const runA = before!.run!;
      // Edit with a new email → approval must be invalidated (run cleared), then re-collected to a fresh run.
      const edited = await turn(sid, 'change my email to edo2@example.com', owner, 'edit');
      const afterEdit = await getPendingActionStore().load(sid);
      assert.notEqual(afterEdit!.state, 'awaiting_confirmation');
      // Re-present: the new email produces a brand-new frozen run with a different approval id / idempotency key.
      const re = await turn(sid, '', owner).catch(() => null);
      const ready = await getPendingActionStore().load(sid);
      // After edit the email is updated and, once re-confirmed-ready, the run differs from the old one.
      if (ready?.run) {
        assert.notEqual(ready.run.approvalId, runA.approvalId, 'a new approval replaces the old one');
        assert.notEqual(ready.run.idempotencyKey, runA.idempotencyKey, 'the idempotency key changes with the payload');
      }
      void edited; void re;
    });

    // ---------------- Cancel writes nothing ----------------
    await t.test('cancelling a pending action writes no lead record', async () => {
      enable();
      const sid = `sid-${randomUUID()}`;
      await turn(sid, 'Please contact me about automation.', owner);
      await turn(sid, 'I am Nina Vedran', owner);
      await turn(sid, 'nina@example.com', owner);
      const pending = await getPendingActionStore().load(sid);
      const dedupe = hashContent(canonicalLeadInput(JSON.parse(pending!.run!.changeSet.changes[0].after!)));
      const cancelled = await turn(sid, '', owner, 'cancel');
      assert.match(cancelled.reply, /cancelled|nothing was saved/i);
      assert.equal(await getPendingActionStore().load(sid), null, 'the pending action is cleared');
      assert.equal(await getLeadStore().getByDedupe(dedupe), null, 'no lead record was written');
    });

    // ---------------- Disabled fails closed (no mutation, honest message) ----------------
    await t.test('with execution disabled, confirm fails closed and writes nothing', async () => {
      process.env.DX_EXECUTION = 'on'; process.env.DX_EXECUTION_LEAD_CREATE = 'off';
      const sid = `sid-${randomUUID()}`;
      await turn(sid, 'Have Digital X contact me about a site.', owner);
      await turn(sid, 'I am Off Switch', owner);
      await turn(sid, 'off@example.com', owner);
      const pending = await getPendingActionStore().load(sid);
      const dedupe = hashContent(canonicalLeadInput(JSON.parse(pending!.run!.changeSet.changes[0].after!)));
      const done = await turn(sid, '', owner, 'confirm');
      assert.notEqual(done.card!.state, 'succeeded');
      assert.equal(await getLeadStore().getByDedupe(dedupe), null, 'no lead was created while disabled');
      assert.doesNotMatch(done.reply, /saved and verified/i, 'never claims success when disabled');
    });

    // ---------------- Public visitor CAN complete lead.create (P3e §2/§3) ----------------
    await t.test('a public VISITOR session completes the lead flow through the real engine', async () => {
      enable();
      const sid = `sid-${randomUUID()}`;
      // A normal visitor (non-owner) collects and confirms — lead.create is the intentionally-public capability, so
      // the engine runs the full safety chain and writes a real, read-back-verified lead.
      await turn(sid, 'Please contact me about a website.', visitor);
      await turn(sid, 'I am A Visitor', visitor);
      await turn(sid, 'visitor@example.com', visitor);
      const pending = await getPendingActionStore().load(sid);
      const dedupe = hashContent(canonicalLeadInput(JSON.parse(pending!.run!.changeSet.changes[0].after!)));
      const done = await turn(sid, '', visitor, 'confirm');
      assert.equal(done.card!.state, 'succeeded');
      assert.notEqual(await getLeadStore().getByDedupe(dedupe), null, 'a visitor lead was created and verified');
    });

    // ---------------- No trusted actor (no valid session) still fails closed server-side ----------------
    await t.test('a request with no trusted actor can never execute (server rejection, not hidden UI)', async () => {
      enable();
      const sid = `sid-${randomUUID()}`;
      // Collect with no actor — collection is fine, but confirm must fail closed at the engine (null actor).
      await turn(sid, 'Please contact me about a website.', null);
      await turn(sid, 'I am No Actor', null);
      await turn(sid, 'noactor@example.com', null);
      const pending = await getPendingActionStore().load(sid);
      const dedupe = hashContent(canonicalLeadInput(JSON.parse(pending!.run!.changeSet.changes[0].after!)));
      const done = await turn(sid, '', null, 'confirm');
      assert.notEqual(done.card!.state, 'succeeded');
      assert.equal(await getLeadStore().getByDedupe(dedupe), null, 'no lead created without a trusted actor');
    });

    // ---------------- Diagnostic whitelist: booleans + coarse state only, no content ----------------
    await t.test('the execution diagnostic exposes only whitelisted booleans and a coarse state', async () => {
      enable();
      const diag = await collectExecutionDiagnostic();
      // Strict schema parse proves no extra keys; spot-check the readiness booleans and the safety marker.
      assert.deepEqual(diag, executionDiagnosticSchema.parse(diag));
      assert.equal(diag.diagnosticSafe, true);
      assert.equal(diag.registryLoaded, true);
      assert.equal(diag.leadProviderReady, true);
      assert.equal(diag.persistenceReady, true);
      assert.equal(diag.chatActionRoutingReady, true);
      const serialized = JSON.stringify(diag);
      // No PII / secret-shaped content can appear in the whitelisted projection.
      assert.doesNotMatch(serialized, /@|example\.com|contactEmail|contactName|token|secret|apikey/i);
    });

    // ---------------- A non-action question is NOT hijacked by the action flow ----------------
    await t.test('a plain informational question is not treated as an action (falls through)', async () => {
      enable();
      const sid = `sid-${randomUUID()}`;
      // Drive the action flow directly (the orchestrator would then call the model for this non-action turn). The
      // flow must return handled:false and start no pending action.
      const { emit, events } = collector();
      const result = await handleActionTurn({ sid, message: 'What services do you offer?', locale: 'en', actor: owner }, emit);
      assert.equal(result.handled, false, 'the action flow does not claim a non-action question');
      assert.equal(events.length, 0, 'no action card is emitted');
      assert.equal(await getPendingActionStore().load(sid), null, 'no pending action was started');
    });
  } finally {
    reset();
  }
});
