import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  buildExecutionPreview, decideApproval, hashIntent, hashPlan, hashChangeSet,
  executeApprovedChangeSet, ExecutionBoundaryError,
} from '../server/orchestrator/execution-preview';
import {
  runControlledExecution, projectStatus, setExecutor, getExecutor,
  type Executor,
} from '../server/orchestrator/controlled-execution';
import { ExecutionError, type ExecutionRunRequest, type ExecutionActor } from '../shared/execution-run';
import { readDraft, writeDraft, hashContent } from '../server/execution/workspace';
import { setActorResolver } from '../server/execution/actor';
import { type ExecutionRequest } from '../shared/execution';

// P3b Controlled Execution. Core rules under test: (1) NO exact approval → NO execution — the frozen intent/plan/
// change-set are re-hashed and rebound to the approval immediately before any mutation; (2) execution is allowlisted
// to a tiny reversible/internal operation set; (3) every privileged decision (risk/approval/actor/capability/kill
// switch) is derived or verified SERVER-SIDE and fails closed; (4) the lifecycle is revalidate → preflight → dry-run
// → conflict → mutate → verify → receipt, idempotent, with rollback metadata; (5) the visitor projection leaks no
// secrets. The mutation target is the contained, versioned internal draft workspace — never fs/shell/URL/CMS/email.

const NOW = 1_700_000_000_000;
const owner: ExecutionActor = { actorId: 'owner-1', role: 'owner', sessionId: 'sess-1', capabilities: [] };

/** Enable the kill switch for the duration of fn, then restore. */
async function withExecution<T>(fn: () => Promise<T>): Promise<T> {
  const prev = process.env.DX_EXECUTION;
  process.env.DX_EXECUTION = 'on';
  try { return await fn(); } finally { if (prev === undefined) delete process.env.DX_EXECUTION; else process.env.DX_EXECUTION = prev; }
}

// Run with the clock pinned to NOW by default so a freshly-built (NOW) approval is not seen as expired. Individual
// tests override `now` to exercise the expiry gate.
const exec = (raw: unknown, deps: { now?: () => number } = {}) => runControlledExecution(raw, { now: deps.now ?? (() => NOW) });

let seq = 0;
/** Build a fully-valid, approved ExecutionRunRequest for a cms_draft change against a unique workspace target. */
function makeRequest(over: { operation?: ExecutionRequest['operation']; before?: string | null; after?: string; actor?: ExecutionActor; capability?: string } = {}) {
  seq += 1;
  const target = `ws${seq}:hero`;
  const operation = over.operation ?? 'cms_draft';
  const request: ExecutionRequest = { objective: 'Refresh the hero headline', target, operation, goal: null };
  const changes = [{ target, summary: 'Replace the headline', before: over.before === undefined ? null : over.before, after: over.after ?? 'New headline' }];
  const p = buildExecutionPreview({ request, capability: over.capability as never, now: NOW }, changes, NOW);
  const approval = decideApproval(p.approval, p.plan, p.changeSet, true);
  const run: ExecutionRunRequest = {
    v: 1, executionId: randomUUID(), version: 1, approvalId: approval.id,
    intent: p.intent, plan: p.plan, changeSet: p.changeSet,
    expected: { intentHash: hashIntent(p.intent), planHash: hashPlan(p.plan), changeSetHash: hashChangeSet(p.changeSet) },
    approval, actor: over.actor ?? owner, mode: 'execute',
    idempotencyKey: `idem-${randomUUID()}`, requestedAt: NOW,
  };
  return { run, target, preview: p };
}

// A fake allowlisted executor used to force provider/verification failures deterministically.
function fakeExecutor(over: Partial<Executor>): Executor {
  const base = getExecutor('cms_draft')!;
  return { ...base, ...over };
}

// ---------------- No approval → no execution ----------------
test('execution without an approved decision is rejected (approval_mismatch)', async () => {
  await withExecution(async () => {
    const { run } = makeRequest();
    const pending = { ...run, approval: { ...run.approval, state: 'pending' as const } };
    await assert.rejects(() => exec(pending), (e: unknown) => e instanceof ExecutionError && e.code === 'approval_mismatch');
  });
});
test('an explicitly rejected approval cannot execute', async () => {
  await withExecution(async () => {
    const { run } = makeRequest();
    const rejected = { ...run, approval: { ...run.approval, state: 'rejected' as const } };
    await assert.rejects(() => exec(rejected), (e: unknown) => e instanceof ExecutionError && e.code === 'approval_mismatch');
  });
});
test('a mutated intent is rejected before any provider work', async () => {
  await withExecution(async () => {
    const { run } = makeRequest();
    const tampered = { ...run, intent: { ...run.intent, objective: 'Silently do something else' } };
    await assert.rejects(() => exec(tampered), (e: unknown) => e instanceof ExecutionError && e.code === 'approval_mismatch');
  });
});
test('a mutated plan is rejected (hash no longer matches the frozen approval)', async () => {
  await withExecution(async () => {
    const { run } = makeRequest();
    const tampered = { ...run, plan: { ...run.plan, steps: run.plan.steps.map(s => (s.id === 'S2' ? { ...s, description: 'Do more' } : s)) } };
    await assert.rejects(() => exec(tampered), (e: unknown) => e instanceof ExecutionError && e.code === 'approval_mismatch');
  });
});
test('a mutated change set is rejected (hash no longer matches the frozen approval)', async () => {
  await withExecution(async () => {
    const { run } = makeRequest();
    const tampered = { ...run, changeSet: { ...run.changeSet, changes: [{ ...run.changeSet.changes[0], after: 'Injected value' }] } };
    await assert.rejects(() => exec(tampered), (e: unknown) => e instanceof ExecutionError && e.code === 'approval_mismatch');
  });
});
test('an expired approval is rejected (approval_expired)', async () => {
  await withExecution(async () => {
    const { run } = makeRequest();
    const later = NOW + 31 * 60 * 1000;
    await assert.rejects(() => exec(run, { now: () => later }), (e: unknown) => e instanceof ExecutionError && e.code === 'approval_expired');
  });
});

// ---------------- Allowlist ----------------
test('an operation with no registered executor is unsupported', async () => {
  await withExecution(async () => {
    const { run } = makeRequest({ operation: 'deployment_preview', after: 'x' });
    await assert.rejects(() => exec(run), (e: unknown) => e instanceof ExecutionError && e.code === 'unsupported_operation');
  });
});
test('an actor missing the required capability is unauthorized', async () => {
  await withExecution(async () => {
    const { run } = makeRequest({ capability: 'CAP-01' });
    // owner holds no capabilities; the intent requires CAP-01 → hard unauthorized.
    await assert.rejects(() => exec(run), (e: unknown) => e instanceof ExecutionError && e.code === 'unauthorized');
  });
});

// ---------------- Auth / RBAC ----------------
test('a missing trusted actor fails closed (unauthorized)', async () => {
  await withExecution(async () => {
    const restore = setActorResolver(() => null);
    try {
      const { run } = makeRequest();
      await assert.rejects(() => exec(run), (e: unknown) => e instanceof ExecutionError && e.code === 'unauthorized');
    } finally { restore(); }
  });
});
test('a visitor actor cannot run a PRIVILEGED operation (policy matrix denies cms_draft)', async () => {
  await withExecution(async () => {
    // P3e: `visitor` is now an executing role, but the policy matrix restricts it to the public allowlist. The default
    // makeRequest operation here is the privileged internal cms_draft, which a visitor may NOT run → unauthorized.
    const visitor: ExecutionActor = { actorId: 'v', role: 'visitor', sessionId: 's', capabilities: [] };
    const { run } = makeRequest({ actor: visitor });
    await assert.rejects(() => exec(run), (e: unknown) => e instanceof ExecutionError && e.code === 'unauthorized');
  });
});

// ---------------- Kill switch ----------------
test('the kill switch blocks execution before any provider call (execution_disabled)', async () => {
  const prev = process.env.DX_EXECUTION;
  delete process.env.DX_EXECUTION;
  try {
    const { run } = makeRequest();
    await assert.rejects(() => exec(run), (e: unknown) => e instanceof ExecutionError && e.code === 'execution_disabled');
  } finally { if (prev !== undefined) process.env.DX_EXECUTION = prev; }
});

// ---------------- Schema hardening ----------------
test('an unknown/extra field in the run request is rejected (invalid_request)', async () => {
  await withExecution(async () => {
    const { run } = makeRequest();
    await assert.rejects(() => exec({ ...run, hacked: true }), (e: unknown) => e instanceof ExecutionError && e.code === 'invalid_request');
  });
});

// ---------------- Dry-run performs no mutation ----------------
test('dry_run mode proves applicability without mutating the target', async () => {
  await withExecution(async () => {
    const { run, target } = makeRequest();
    const before = await readDraft(target);
    assert.equal(before, null);
    const receipt = await exec({ ...run, mode: 'dry_run' });
    assert.equal(receipt.state, 'dry_run');
    assert.equal(receipt.dryRun!.safe, true);
    assert.equal(await readDraft(target), null); // still no mutation
  });
});

// ---------------- Stale target / conflict ----------------
test('a target that changed since preview yields a conflict, not an overwrite', async () => {
  await withExecution(async () => {
    const { run, target } = makeRequest();               // change.before === null (expected: creation)
    await writeDraft(target, 'someone else wrote this', null); // target now exists → expected != current
    const receipt = await exec(run);
    assert.equal(receipt.state, 'conflict');
    assert.equal(receipt.errorCode, 'stale_target');
    // The mutation was refused: the existing content is untouched.
    assert.equal((await readDraft(target))!.content, 'someone else wrote this');
  });
});

// ---------------- Provider never called on failed preflight ----------------
test('a failed preflight prevents any provider call and records preflight_failed', async () => {
  await withExecution(async () => {
    let applyCalled = false;
    const restore = setExecutor('cms_draft', fakeExecutor({
      validateTarget: () => false, // forces the targets_contained preflight check to fail
      applyChange: async () => { applyCalled = true; return true; },
    }));
    try {
      const { run } = makeRequest();
      const receipt = await exec(run);
      assert.equal(receipt.state, 'failed');
      assert.equal(receipt.errorCode, 'preflight_failed');
      assert.equal(applyCalled, false);
    } finally { restore(); }
  });
});

// ---------------- Idempotency ----------------
test('the same idempotency key cannot execute twice (returns the first receipt)', async () => {
  await withExecution(async () => {
    const { run, target } = makeRequest();
    const first = await exec(run);
    assert.equal(first.state, 'succeeded');
    const versionAfterFirst = (await readDraft(target))!.version;
    const second = await exec(run);
    assert.equal(second.executionId, first.executionId);
    assert.equal(second.state, 'succeeded');
    // No second mutation happened.
    assert.equal((await readDraft(target))!.version, versionAfterFirst);
  });
});

// ---------------- Successful execution + receipt ----------------
test('a fully-valid approved run mutates, verifies and creates a success receipt', async () => {
  await withExecution(async () => {
    const { run, target } = makeRequest({ after: 'Brand new headline' });
    const receipt = await exec(run);
    assert.equal(receipt.state, 'succeeded');
    assert.equal(receipt.errorCode, null);
    assert.equal(receipt.preflight!.ok, true);
    assert.equal(receipt.dryRun!.safe, true);
    assert.equal(receipt.verification!.ok, true);
    assert.equal((await readDraft(target))!.content, 'Brand new headline');
    assert.equal(hashContent('Brand new headline'), receipt.verification!.checks[0].actualHash);
  });
});

// ---------------- Rollback metadata captured ----------------
test('a successful execution captures rollback metadata', async () => {
  await withExecution(async () => {
    const { run } = makeRequest();
    const receipt = await exec(run);
    assert.equal(receipt.rollback.supported, true);
    assert.equal(receipt.rollback.captured, true);
    assert.notEqual(receipt.rollback.ref, null);
  });
});

// ---------------- Provider failure ----------------
test('a provider failure creates a failure receipt and never reports success', async () => {
  await withExecution(async () => {
    const restore = setExecutor('cms_draft', fakeExecutor({ applyChange: async () => false }));
    try {
      const { run } = makeRequest();
      const receipt = await exec(run);
      assert.equal(receipt.errorCode, 'provider_failed');
      assert.notEqual(receipt.state, 'succeeded');
      assert.equal(receipt.verification, null);
      assert.equal(receipt.rollback.attempted, true); // rollback was tried on failure
    } finally { restore(); }
  });
});

// ---------------- Verification failure ----------------
test('a mutation that does not verify is not reported as success', async () => {
  await withExecution(async () => {
    const restore = setExecutor('cms_draft', fakeExecutor({
      verifyChange: async (c) => ({ changeId: c.id, expectedHash: 'expected', actualHash: 'actual', ok: false }),
    }));
    try {
      const { run } = makeRequest();
      const receipt = await exec(run);
      assert.equal(receipt.errorCode, 'verification_failed');
      assert.notEqual(receipt.state, 'succeeded');
      assert.equal(receipt.verification!.ok, false);
    } finally { restore(); }
  });
});

// ---------------- Safe projection ----------------
test('the visitor status card exposes no actor id, hashes or rollback ref', async () => {
  await withExecution(async () => {
    const { run } = makeRequest();
    const receipt = await exec(run);
    const card = projectStatus(receipt);
    const serialized = JSON.stringify(card);
    assert.doesNotMatch(serialized, /owner-1/);           // no actor id
    assert.doesNotMatch(serialized, new RegExp(receipt.hashes.planHash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    if (receipt.rollback.ref) assert.doesNotMatch(serialized, new RegExp(receipt.rollback.ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.equal(card.status, 'succeeded');
    assert.equal(card.verified, true);
  });
});

// ---------------- P3a boundary still fails closed ----------------
test('the bare executeApprovedChangeSet boundary still rejects unsupported privileged execution', async () => {
  const { run } = makeRequest();
  await assert.rejects(() => executeApprovedChangeSet(run.approval, run.plan, run.changeSet), ExecutionBoundaryError);
});

