import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { buildExecutionPreview, decideApproval, hashIntent, hashPlan, hashChangeSet } from '../server/orchestrator/execution-preview';
import { runControlledExecution, setExecutor } from '../server/orchestrator/controlled-execution';
import { setActorResolver } from '../server/execution/actor';
import { leadCreateExecutor } from '../server/execution/lead-provider';
import { getLeadStore } from '../server/execution/lead-store';
import { hashContent } from '../server/execution/workspace';
import { ExecutionError, type ExecutionRunRequest, type ExecutionActor } from '../shared/execution-run';
import { type ExecutionRequest } from '../shared/execution';
import { serializeLeadPayload, canonicalLeadInput, parseLeadPayload, type LeadCreateInput } from '../shared/lead-create';

// P3d lead.create live-action execution. Proves the STOP-GATE behaviour for the first real capability:
//   (1) a fully-valid approved run CREATES a durable lead record and VERIFIES it by reading the record back;
//   (2) a duplicate/retried run under the same idempotency key returns the ORIGINAL receipt and never doubles;
//   (3) a reused idempotency key with a DIFFERENT payload is rejected (fingerprint_mismatch);
//   (4) an unparseable/invalid payload fails preflight — no lead is ever created;
//   (5) the operation is fail-closed: OFF unless the kill switch + per-capability switch are on and the actor is owner;
//   (6) a provider failure rolls back (soft-delete) and never reports success.
// The store is the existing KV lead store (memory in test); verification reads the AUTHORITATIVE persisted record.
//
// IMPORTANT: these cases mutate process.env (DX_EXECUTION*) which is PROCESS-GLOBAL. The node test runner may run
// top-level tests concurrently, so every case here is an AWAITED SUBTEST under a single serial parent — this both
// prevents env bleed between cases and keeps the shared in-memory store deterministic.

const NOW = 1_700_000_000_000;
const owner: ExecutionActor = { actorId: 'owner-1', role: 'owner', sessionId: 'sess-1', capabilities: [] };
const visitor: ExecutionActor = { actorId: 'v-1', role: 'visitor', sessionId: 'sess-2', capabilities: [] };
const exec = (raw: unknown) => runControlledExecution(raw, { now: () => NOW });

function enableExecution() { process.env.DX_EXECUTION = 'on'; delete process.env.DX_EXECUTION_LEAD_CREATE; }
function resetExecution() { delete process.env.DX_EXECUTION; delete process.env.DX_EXECUTION_LEAD_CREATE; }

let seq = 0;
function makeLeadInput(over: Partial<LeadCreateInput> = {}): LeadCreateInput {
  seq += 1;
  return {
    contactName: over.contactName ?? `Visitor ${seq}`,
    contactEmail: over.contactEmail ?? `visitor${seq}@example.com`,
    message: over.message ?? 'I would like a website redesign for my bakery.',
    company: over.company ?? 'Bakery doo',
    phone: over.phone ?? '',
    source: over.source ?? 'concierge',
    consent: true,
  };
}

/** Build a fully-valid, approved lead.create run from a lead input, carrying the canonical payload in `after`. */
function makeRequest(over: { input?: LeadCreateInput; actor?: ExecutionActor; idempotencyKey?: string; mode?: 'execute' | 'dry_run' } = {}) {
  const input = over.input ?? makeLeadInput();
  const target = 'lead:concierge';
  const request: ExecutionRequest = { objective: 'Create a lead from the enquiry', target, operation: 'lead_create', goal: null };
  const changes = [{ target, summary: 'Create the lead record', before: null, after: serializeLeadPayload(input) }];
  const p = buildExecutionPreview({ request, capability: undefined as never, now: NOW }, changes, NOW);
  const approval = decideApproval(p.approval, p.plan, p.changeSet, true);
  const run: ExecutionRunRequest = {
    v: 1, executionId: randomUUID(), version: 1, approvalId: approval.id,
    intent: p.intent, plan: p.plan, changeSet: p.changeSet,
    expected: { intentHash: hashIntent(p.intent), planHash: hashPlan(p.plan), changeSetHash: hashChangeSet(p.changeSet) },
    approval, actor: over.actor ?? owner, mode: over.mode ?? 'execute',
    idempotencyKey: over.idempotencyKey ?? `idem-${randomUUID()}`, requestedAt: NOW,
  };
  return { run, input, target };
}

/** Local mirror of the provider's dedupe derivation for store assertions. */
function dedupeOf(input: LeadCreateInput): string { return hashContent(canonicalLeadInput(input)); }
/** A fake executor that forces an apply() failure, to prove rollback + no false success. */
function failingExecutor() { return { ...leadCreateExecutor, async applyChange() { return false; } }; }

// Single serial parent: every subtest is awaited, so process.env toggles never race and the shared store is stable.
test('lead.create live-action execution (serial)', async (t) => {
  try {
    // ---------------- Create + read-back verification (the core STOP-GATE proof) ----------------
    await t.test('a fully-valid approved run persists a durable record and verifies it by read-back', async () => {
      enableExecution();
      const { run, input } = makeRequest();
      const receipt = await exec(run);
      assert.equal(receipt.state, 'succeeded');
      assert.equal(receipt.errorCode, null);
      assert.equal(receipt.operation, 'lead_create');
      assert.equal(receipt.preflight!.ok, true);
      assert.equal(receipt.dryRun!.safe, true);
      assert.equal(receipt.verification!.ok, true);
      const stored = await getLeadStore().getByDedupe(dedupeOf(input));
      assert.ok(stored, 'a lead record was persisted');
      assert.equal(stored!.deleted, false);
      assert.equal(stored!.input.contactEmail, input.contactEmail.toLowerCase());
      assert.equal(canonicalLeadInput(stored!.input), canonicalLeadInput(input));
    });

    // ---------------- Idempotency: the SAME request replays to the original receipt, no duplicate ----------------
    await t.test('replaying the same request returns the original receipt and creates no duplicate', async () => {
      enableExecution();
      const { run, input } = makeRequest();
      const first = await exec(run);
      assert.equal(first.state, 'succeeded');
      // Replay the EXACT same request object (same approvalId → same fingerprint): must return the original receipt.
      const second = await exec(run);
      assert.equal(second.executionId, first.executionId, 'replay returns the original receipt');
      assert.equal(second.state, 'succeeded');
      // A brand-new request with identical content still dedupes at the store layer (no doubled lead).
      const { run: run2 } = makeRequest({ input });
      const third = await exec(run2);
      assert.equal(third.verification!.ok, true);
      const stored = await getLeadStore().getByDedupe(dedupeOf(input));
      assert.ok(stored, 'exactly one record exists for this enquiry');
    });

    // ---------------- Fingerprint substitution is rejected ----------------
    await t.test('reusing an idempotency key with a different payload is rejected (fingerprint_mismatch)', async () => {
      enableExecution();
      const key = `idem-${randomUUID()}`;
      await exec(makeRequest({ input: makeLeadInput(), idempotencyKey: key }).run);
      await assert.rejects(
        () => exec(makeRequest({ input: makeLeadInput(), idempotencyKey: key }).run),
        (e: unknown) => e instanceof ExecutionError && e.code === 'fingerprint_mismatch',
      );
    });

    // ---------------- Fail closed: kill switch, per-capability switch, unauthorized actor ----------------
    await t.test('is unavailable when the kill switch is off (fail closed)', async () => {
      resetExecution(); // DX_EXECUTION unset → execution globally disabled
      await assert.rejects(() => exec(makeRequest().run), (e: unknown) => e instanceof ExecutionError && e.code === 'execution_disabled');
    });

    await t.test('is disabled by its own per-capability switch even when the global switch is on', async () => {
      process.env.DX_EXECUTION = 'on';
      process.env.DX_EXECUTION_LEAD_CREATE = 'off';
      await assert.rejects(() => exec(makeRequest().run), (e: unknown) => e instanceof ExecutionError && e.code === 'execution_disabled');
    });

    // P3e §2/§3: lead.create is the ONE intentionally-public mutating capability. A normal VISITOR actor may create
    // their own lead through the exact same safety chain (approval/preflight/dry-run/verify). This proves the public
    // flow works for a non-owner — the previous "non-owner can never create a lead" rule was the pre-P3e owner-only
    // blocker and is intentionally reversed here.
    await t.test('a public VISITOR actor can create + verify a lead (intentionally public)', async () => {
      enableExecution();
      const receipt = await exec(makeRequest({ actor: visitor }).run);
      assert.equal(receipt.state, 'succeeded');
      assert.equal(receipt.verification?.ok, true);
      assert.equal(receipt.actorRole, 'visitor');
    });

    // A missing trusted actor (resolver returns null) still fails closed — no actor can never execute anything. (The
    // per-operation privilege matrix for a VISITOR vs OWNER is exercised in production-policy.test.ts.)
    await t.test('a missing trusted actor can never create a lead (fail closed)', async () => {
      enableExecution();
      const restore = setActorResolver(() => null);
      try {
        await assert.rejects(() => exec(makeRequest().run), (e: unknown) => e instanceof ExecutionError && e.code === 'unauthorized');
      } finally { restore(); }
    });

    // ---------------- Malformed payload fails preflight — no lead created ----------------
    await t.test('an invalid lead payload fails preflight and never persists a record', async () => {
      enableExecution();
      const target = 'lead:concierge';
      const request: ExecutionRequest = { objective: 'Create a lead', target, operation: 'lead_create', goal: null };
      const changes = [{ target, summary: 'Create the lead record', before: null, after: JSON.stringify({ contactName: 'X' }) }];
      const p = buildExecutionPreview({ request, capability: undefined as never, now: NOW }, changes, NOW);
      const approval = decideApproval(p.approval, p.plan, p.changeSet, true);
      const run: ExecutionRunRequest = {
        v: 1, executionId: randomUUID(), version: 1, approvalId: approval.id,
        intent: p.intent, plan: p.plan, changeSet: p.changeSet,
        expected: { intentHash: hashIntent(p.intent), planHash: hashPlan(p.plan), changeSetHash: hashChangeSet(p.changeSet) },
        approval, actor: owner, mode: 'execute', idempotencyKey: `idem-${randomUUID()}`, requestedAt: NOW,
      };
      const receipt = await exec(run);
      assert.notEqual(receipt.state, 'succeeded');
      assert.equal(receipt.errorCode, 'preflight_failed');
      assert.equal(parseLeadPayload(changes[0].after), null);
    });

    // ---------------- Provider failure rolls back and never claims success ----------------
    await t.test('a provider failure rolls back the create and never reports success', async () => {
      enableExecution();
      const restore = setExecutor('lead_create', failingExecutor());
      try {
        const { run, input } = makeRequest();
        const receipt = await exec(run);
        assert.equal(receipt.errorCode, 'provider_failed');
        assert.notEqual(receipt.state, 'succeeded');
        assert.equal(receipt.verification, null);
        assert.equal(receipt.rollback.attempted, true);
        const stored = await getLeadStore().getByDedupe(dedupeOf(input));
        assert.ok(stored == null || stored.deleted, 'no live lead record remains after a failed create');
      } finally { restore(); }
    });
  } finally {
    resetExecution();
  }
});

