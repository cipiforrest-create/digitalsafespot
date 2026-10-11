import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIntent, buildPlan, buildChangeSet, decideApproval,
  buildExecutionPreview, executeApprovedChangeSet,
  ExecutionBoundaryError, hashPlan, hashChangeSet,
} from '../server/orchestrator/execution-preview';
import {
  executionIntentSchema, executionPlanSchema, changeSetSchema, approvalRequestSchema,
  previewReceiptSchema, executionRequestSchema, EXECUTION_PREVIEW_VERSION, MAX_CHANGES,
  type ExecutionRequest,
} from '../shared/execution';

// P3a Interactive Execution Preview. Core rules under test: (1) PREVIEW ONLY — execution is always refused;
// (2) risk/reversibility/approval are DERIVED server-side, never trusted from the client; (3) approval binds to
// the exact frozen plan+change set by hash, so a mutated proposal can never be approved; (4) every card field is
// plain text with markup stripped (safe rendering); (5) untrusted payloads are rejected by the strict schema.

const NOW = 1_700_000_000_000;
const req = (over: Partial<ExecutionRequest> = {}): ExecutionRequest => ({
  objective: 'Refresh the hero headline copy', target: 'home:hero', operation: 'copy_change', goal: null, ...over,
});
const changes = [{ target: 'home:hero', summary: 'Replace the headline', before: 'Old', after: 'New' }];

// ---------------- Preview-only boundary ----------------
test('executeApprovedChangeSet is disabled in P3a and always throws ExecutionBoundaryError', async () => {
  const p = buildExecutionPreview({ request: req(), now: NOW }, changes, NOW);
  const approved = decideApproval(p.approval, p.plan, p.changeSet, true);
  assert.equal(approved.state, 'approved');
  await assert.rejects(() => executeApprovedChangeSet(approved, p.plan, p.changeSet), ExecutionBoundaryError);
});

// ---------------- Derived, not trusted ----------------
test('a low-risk preview operation derives none-approval and reversibility (client cannot set them)', () => {
  const intent = buildIntent({ request: req({ operation: 'copy_change' }), now: NOW });
  assert.equal(intent.risk, 'low');
  assert.equal(intent.reversible, true);
  assert.equal(intent.approvalLevel, 'none');
  assert.equal(executionIntentSchema.safeParse(intent).success, true);
});
test('an external-write operation derives medium risk and owner approval', () => {
  const intent = buildIntent({ request: req({ operation: 'seo_metadata' }), now: NOW });
  assert.equal(intent.risk, 'medium');
  assert.equal(intent.approvalLevel, 'owner');
});
test('a destructive deployment preview derives high risk, irreversible and privileged approval', () => {
  const intent = buildIntent({ request: req({ operation: 'deployment_preview' }), now: NOW });
  assert.equal(intent.risk, 'high');
  assert.equal(intent.reversible, false);
  assert.equal(intent.approvalLevel, 'privileged');
  const plan = buildPlan(intent, NOW);
  // The producing step reflects the destructive side-effect; surrounding steps stay preview-safe.
  assert.equal(plan.steps.find(s => s.id === 'S2')!.sideEffect, 'destructive');
  assert.equal(plan.steps.find(s => s.id === 'S1')!.sideEffect, 'none');
});
test('an unknown capability id is dropped to null rather than trusted', () => {
  const intent = buildIntent({ request: req(), capability: 'CAP-99' as never, now: NOW });
  assert.equal(intent.capability, null);
});

// ---------------- Idempotent source hash ----------------
test('equivalent requests produce an equal intent sourceHash (idempotency)', () => {
  const a = buildIntent({ request: req(), now: NOW });
  const b = buildIntent({ request: req(), now: NOW + 5000 });
  assert.equal(a.sourceHash, b.sourceHash);
  const c = buildIntent({ request: req({ target: 'home:footer' }), now: NOW });
  assert.notEqual(a.sourceHash, c.sourceHash);
});

// ---------------- Approval binds to the exact frozen artifacts ----------------
test('approval succeeds only for the exact frozen plan and change set', () => {
  const p = buildExecutionPreview({ request: req(), now: NOW }, changes, NOW);
  assert.equal(p.approval.state, 'pending');
  assert.equal(p.approval.planHash, hashPlan(p.plan));
  assert.equal(p.approval.changeSetHash, hashChangeSet(p.changeSet));
  const ok = decideApproval(p.approval, p.plan, p.changeSet, true);
  assert.equal(ok.state, 'approved');
});
test('a tampered change set can never be approved (hash mismatch -> rejected)', () => {
  const p = buildExecutionPreview({ request: req(), now: NOW }, changes, NOW);
  const tampered = { ...p.changeSet, changes: [{ ...p.changeSet.changes[0], after: 'Injected different value' }] };
  const decision = decideApproval(p.approval, p.plan, tampered, true);
  assert.equal(decision.state, 'rejected');
});
test('a tampered plan can never be approved (hash mismatch -> rejected)', () => {
  const p = buildExecutionPreview({ request: req(), now: NOW }, changes, NOW);
  const tampered = { ...p.plan, steps: p.plan.steps.map(s => (s.id === 'S2' ? { ...s, description: 'Silently do more' } : s)) };
  const decision = decideApproval(p.approval, tampered, p.changeSet, true);
  assert.equal(decision.state, 'rejected');
});
test('an explicit non-approval is recorded as rejected even when artifacts are intact', () => {
  const p = buildExecutionPreview({ request: req(), now: NOW }, changes, NOW);
  assert.equal(decideApproval(p.approval, p.plan, p.changeSet, false).state, 'rejected');
});

// ---------------- Receipt is auditable ----------------
test('the preview receipt records the exact hashes and counts of what was shown', () => {
  const p = buildExecutionPreview({ request: req(), now: NOW }, changes, NOW);
  assert.equal(previewReceiptSchema.safeParse(p.receipt).success, true);
  assert.equal(p.receipt.planHash, hashPlan(p.plan));
  assert.equal(p.receipt.changeSetHash, hashChangeSet(p.changeSet));
  assert.equal(p.receipt.shown.stepCount, p.plan.steps.length);
  assert.equal(p.receipt.shown.changeCount, p.changeSet.changes.length);
  assert.equal(p.receipt.approvalState, 'pending');
  assert.equal(p.receipt.version, EXECUTION_PREVIEW_VERSION);
});

// ---------------- Safe projection ----------------
test('the preview card strips markup from every text field (no injected HTML/JS)', () => {
  const p = buildExecutionPreview(
    { request: req({ objective: 'Update <script>alert(1)</script> copy', target: 'home:hero' }), now: NOW },
    [{ target: 'home:hero', summary: 'Set <b>headline</b>', before: '<i>old</i>', after: 'javascript:alert(2)' }],
    NOW,
  );
  const card = p.card;
  assert.doesNotMatch(card.objective, /<script>|<\/script>/);
  assert.doesNotMatch(card.changes[0].summary, /<b>|<\/b>/);
  assert.doesNotMatch(card.changes[0].before ?? '', /<i>/);
  assert.doesNotMatch(card.changes[0].after ?? '', /javascript:/);
  // The card never leaks internal hashes.
  assert.equal(Object.prototype.hasOwnProperty.call(card, 'sourceHash'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(card, 'planHash'), false);
});

// ---------------- Untrusted payload rejection ----------------
test('the untrusted request schema rejects extra keys, bad operations and empty fields', () => {
  assert.equal(executionRequestSchema.safeParse(req()).success, true);
  assert.equal(executionRequestSchema.safeParse({ ...req(), approvalLevel: 'privileged' }).success, false); // cannot inject approval
  assert.equal(executionRequestSchema.safeParse({ ...req(), operation: 'delete_everything' }).success, false);
  assert.equal(executionRequestSchema.safeParse({ ...req(), objective: '' }).success, false);
  assert.equal(executionRequestSchema.safeParse({ objective: 'x', target: 'y' }).success, false); // missing operation
});

// ---------------- Bounds ----------------
test('the change set is bounded to MAX_CHANGES', () => {
  const intent = buildIntent({ request: req(), now: NOW });
  const plan = buildPlan(intent, NOW);
  const many = Array.from({ length: MAX_CHANGES + 5 }, (_, i) => ({ target: `t${i}`, summary: `s${i}` }));
  const set = buildChangeSet(intent, plan, many, NOW);
  assert.equal(set.changes.length, MAX_CHANGES);
  assert.equal(changeSetSchema.safeParse(set).success, true);
});

// ---------------- Schemas hold for the full pipeline ----------------
test('every artifact in the pipeline validates against its strict schema', () => {
  const p = buildExecutionPreview({ request: req(), now: NOW }, changes, NOW);
  assert.equal(executionIntentSchema.safeParse(p.intent).success, true);
  assert.equal(executionPlanSchema.safeParse(p.plan).success, true);
  assert.equal(changeSetSchema.safeParse(p.changeSet).success, true);
  assert.equal(approvalRequestSchema.safeParse(p.approval).success, true);
  assert.equal(p.plan.intentId, p.intent.id);
  assert.equal(p.changeSet.planId, p.plan.id);
});



