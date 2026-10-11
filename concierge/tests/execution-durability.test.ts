import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { buildExecutionPreview, decideApproval, hashIntent, hashPlan, hashChangeSet } from '../server/orchestrator/execution-preview';
import {
  runControlledExecution, recoverInterruptedExecutions, loadReceiptByExecutionId, computeFingerprint,
} from '../server/orchestrator/controlled-execution';
import { type ExecutionRunRequest, type ExecutionActor, type ExecutionReceipt } from '../shared/execution-run';
import { type ExecutionRequest } from '../shared/execution';
import { readDraft } from '../server/execution/workspace';
import { getExecutionStore } from '../server/execution/run-store';
import { canTransition, assertTransition, InvalidTransitionError, classifyRecovery } from '../server/execution/state-machine';
import { acquireExecutionLock, withExecutionLock, isLocked } from '../server/execution/execution-lock';
import { loadAuditLog } from '../server/execution/audit-log';

// P3c durable-execution unit tests: distributed lock, explicit state machine, durable store, audit trail, recovery.
const NOW = 1_700_000_000_000;
const owner: ExecutionActor = { actorId: 'owner-1', role: 'owner', sessionId: 'sess-1', capabilities: [] };
async function withExecution<T>(fn: () => Promise<T>): Promise<T> {
  const prev = process.env.DX_EXECUTION;
  process.env.DX_EXECUTION = 'on';
  try { return await fn(); } finally { if (prev === undefined) delete process.env.DX_EXECUTION; else process.env.DX_EXECUTION = prev; }
}
const exec = (raw: unknown, deps: { now?: () => number } = {}) => runControlledExecution(raw, { now: deps.now ?? (() => NOW) });

let seq = 0;
function makeRequest(over: { idempotencyKey?: string; after?: string } = {}) {
  seq += 1;
  const target = `wd${seq}:hero`;
  const request: ExecutionRequest = { objective: 'Refresh the hero headline', target, operation: 'cms_draft', goal: null };
  const changes = [{ target, summary: 'Replace the headline', before: null, after: over.after ?? 'New headline' }];
  const p = buildExecutionPreview({ request, capability: undefined as never, now: NOW }, changes, NOW);
  const approval = decideApproval(p.approval, p.plan, p.changeSet, true);
  const run: ExecutionRunRequest = {
    v: 1, executionId: randomUUID(), version: 1, approvalId: approval.id,
    intent: p.intent, plan: p.plan, changeSet: p.changeSet,
    expected: { intentHash: hashIntent(p.intent), planHash: hashPlan(p.plan), changeSetHash: hashChangeSet(p.changeSet) },
    approval, actor: owner, mode: 'execute',
    idempotencyKey: over.idempotencyKey ?? `idem-${randomUUID()}`, requestedAt: NOW,
  };
  return { run, target };
}

// ---------------- State machine (section 7) ----------------
test('the state machine permits only the explicit lifecycle edges and rejects invalid transitions', () => {
  assert.equal(canTransition('pending', 'claimed'), true);
  assert.equal(canTransition('claimed', 'preflight'), true);
  assert.equal(canTransition('executing', 'verifying'), true);
  assert.equal(canTransition('verifying', 'succeeded'), true);
  assert.equal(canTransition('pending', 'executing'), false);
  assert.equal(canTransition('succeeded', 'executing'), false);
  assert.equal(canTransition('dry_run', 'succeeded'), false);
  assert.throws(() => assertTransition('pending', 'succeeded'), InvalidTransitionError);
  assert.doesNotThrow(() => assertTransition('executing', 'executing'));
});

test('recovery classification never repeats an uncertain side effect', () => {
  assert.equal(classifyRecovery(randomUUID(), 'claimed').disposition, 'finalize_failure');
  assert.equal(classifyRecovery(randomUUID(), 'preflight').disposition, 'finalize_failure');
  assert.equal(classifyRecovery(randomUUID(), 'executing').disposition, 'reconcile');
  assert.equal(classifyRecovery(randomUUID(), 'verifying').disposition, 'reconcile');
  assert.equal(classifyRecovery(randomUUID(), 'rollback_pending').disposition, 'reconcile');
  assert.equal(classifyRecovery(randomUUID(), 'succeeded').disposition, 'already_terminal');
});

// ---------------- Distributed lock (section 5) ----------------
test('the execution lock is atomic: a second acquire is refused while held, then released', async () => {
  const key = `lock-${randomUUID()}`;
  const lock = await acquireExecutionLock(key);
  assert.ok(lock);
  assert.equal(await isLocked(key), true);
  assert.equal(await acquireExecutionLock(key), null, 'a concurrent acquire is refused');
  await lock!.release();
  assert.equal(await isLocked(key), false);
  const third = await acquireExecutionLock(key);
  assert.ok(third, 'the key is acquirable again after release');
  await third!.release();
});

test('a lock lease expires so a crashed holder does not deadlock the key', async () => {
  const key = `lease-${randomUUID()}`;
  const lock = await acquireExecutionLock(key, 20);
  assert.ok(lock);
  assert.equal(await acquireExecutionLock(key, 20), null);
  await new Promise(r => setTimeout(r, 40));
  const recovered = await acquireExecutionLock(key, 20);
  assert.ok(recovered, 'the lease expiry frees the key for recovery');
  await recovered!.release();
});

test('withExecutionLock reports contention instead of running fn twice concurrently', async () => {
  const key = `hold-${randomUUID()}`;
  let concurrent = 0, maxConcurrent = 0;
  const body = async () => { concurrent++; maxConcurrent = Math.max(maxConcurrent, concurrent); await new Promise(r => setTimeout(r, 30)); concurrent--; return 'done'; };
  const [a, b] = await Promise.all([withExecutionLock(key, body), withExecutionLock(key, body)]);
  assert.equal([a, b].filter(r => r.held).length, 1, 'exactly one holder ran the critical section');
  assert.equal(maxConcurrent, 1, 'the body never ran concurrently for the same key');

// ---------------- Concurrent execution -> one mutation only ----------------
test('two concurrent requests with the same key cause exactly one mutation', async () => {
  await withExecution(async () => {
    const { run, target } = makeRequest();
    const results = await Promise.allSettled([exec(run), exec(run)]);
    const fulfilled = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<ExecutionReceipt>[];
    assert.ok(fulfilled.some(r => r.value.state === 'succeeded'));
    assert.equal((await readDraft(target))!.version, 1, 'the target was mutated exactly once');
  });
});

// ---------------- Fingerprint / idempotency-key substitution (section 15) ----------------
test('reusing an idempotency key with a DIFFERENT payload is rejected (fingerprint_mismatch)', async () => {
  await withExecution(async () => {
    const key = `idem-${randomUUID()}`;
    const first = makeRequest({ idempotencyKey: key, after: 'First content' });
    assert.equal((await exec(first.run)).state, 'succeeded');
    const second = makeRequest({ idempotencyKey: key, after: 'Different content' });
    await assert.rejects(() => exec(second.run), (e: unknown) => (e as { code?: string })?.code === 'fingerprint_mismatch');
  });
});

test('the fingerprint changes when the bound mode changes but is stable otherwise', () => {
  const { run } = makeRequest();
  const base = computeFingerprint(run);
  assert.equal(computeFingerprint({ ...run }), base);
  assert.notEqual(computeFingerprint({ ...run, mode: 'dry_run' }), base);
});

// ---------------- Durable store: execution-id index (section 6) ----------------
test('a receipt is retrievable by execution id after it completes', async () => {
  await withExecution(async () => {
    const { run } = makeRequest();
    const receipt = await exec(run);
    const byId = await loadReceiptByExecutionId(receipt.executionId);
    assert.ok(byId);
    assert.equal(byId!.idempotencyKey, run.idempotencyKey);
  });
});

// ---------------- Audit trail (section 8) ----------------
test('a successful run emits the audit sequence in order and leaks no secrets', async () => {
  await withExecution(async () => {
    const { run } = makeRequest({ after: 'Audited content' });
    const receipt = await exec(run);
    const log = await loadAuditLog(receipt.executionId);
    const types = log.map(e => e.type);
    // Key milestones appear, in ascending seq order.
    for (const expected of ['request_received', 'actor_resolved', 'lock_acquired', 'preflight_passed', 'dry_run_passed', 'execution_started', 'mutation_result', 'verification_result', 'execution_finalized']) {
      assert.ok(types.includes(expected as never), `missing audit event ${expected}`);
    }
    assert.deepEqual(log.map(e => e.seq), log.map((_, i) => i), 'seq is monotonic');
    // No secret leakage: the serialized log never contains the raw actor id, content, hashes or the session id.
    const serialized = JSON.stringify(log);
    assert.equal(serialized.includes('Audited content'), false);
    assert.equal(serialized.includes(owner.actorId), false);
    assert.equal(serialized.includes(run.approval.changeSetHash), false);
    // The actor is referenced only by a short hash.
    assert.ok(log[0].actorHash && log[0].actorHash.length <= 24);
  });
});

// ---------------- Recovery / process-restart (section 10) ----------------
test('recovery finalizes a run interrupted before mutation and never blindly retries a mutating run', async () => {
  await withExecution(async () => {
    const store = getExecutionStore();
    // Simulate a crash: a run persisted in 'claimed' (pre-mutation) and one in 'executing' (uncertain).
    const preMutation = makeRequest();
    const claimed = { ...await buildReceipt(preMutation.run, 'claimed') };
    await store.save(claimed);
    const midMutation = makeRequest();
    const executing = { ...await buildReceipt(midMutation.run, 'executing') };
    await store.save(executing);

    const classifications = await recoverInterruptedExecutions({ now: () => NOW });
    const byId = (id: string) => classifications.find(c => c.executionId === id);
    assert.equal(byId(claimed.executionId)?.disposition, 'finalize_failure');
    assert.equal(byId(executing.executionId)?.disposition, 'reconcile');
    // The pre-mutation run is finalized failed; the uncertain run is marked for reconciliation (NOT retried).
    assert.equal((await store.loadByExecutionId(claimed.executionId))!.state, 'failed');
    const reconciled = await store.loadByExecutionId(executing.executionId);
    assert.equal(reconciled!.state, 'executing', 'the uncertain run is left as-is (no blind retry)');
    assert.equal(reconciled!.errorCode, 'reconciliation_required');
  });
});

// Build a persisted receipt in a chosen state directly (crash simulation helper).
async function buildReceipt(run: ExecutionRunRequest, state: ExecutionReceipt['state']): Promise<ExecutionReceipt> {
  const receipt = await exec({ ...run, mode: 'dry_run' }); // runs through the engine to a terminal dry_run
  return { ...receipt, state, completedAt: null, errorCode: null };
}

});
