import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSolutionMap, validateReasoning, buildEvidence, extractProblem,
  solutionSourceHash, toSolutionCard, type SolutionInput,
} from '../server/orchestrator/solution-architect';
import { selectCapabilities } from '../server/orchestrator/signals';
import { solutionMapSchema, MAX_SOLUTION_CAPABILITIES } from '../shared/solution-map';
import { capabilityIds, CAP03_SPEED_EVIDENCE_NOTE, SPEED_AUDIT_CHECK_ID } from '../shared/capabilities';
import { FakeProvider } from '../server/ai/fake-provider';
import { ModelError } from '../server/ai/provider';
import type { AuditFacts } from '../shared/audit-facts';
import type { AuditCheck } from '../shared/contracts';

const SECRET = 'unit-test-session-secret-'.repeat(3);
process.env.CONCIERGE_SESSION_SECRET = SECRET;
function clearMemory() { (globalThis as unknown as Record<symbol, Map<string, unknown> | undefined>)[Symbol.for('dx.concierge.store')]?.clear(); }

const goodFacts: AuditFacts = {
  url: 'https://example.test/', status: 200, ok: true, https: true, title: 'Digital X', description: 'Web i AI.',
  canonical: 'https://example.test/', headings: ['Usluge'], h2Count: 3, wordCount: 400, mentionsServices: true,
  images: { total: 2, withAlt: 2 }, schema: { types: ['Organization'], invalid: 0 }, ogTitle: 'x', ogImage: 'y.png',
  noindex: false, viewport: 'width=device-width', lang: 'bs', hasContact: true,
};
const speedCheck = (severity: AuditCheck['severity']): AuditCheck => ({
  id: SPEED_AUDIT_CHECK_ID, title: 'Odgovor servera', status: severity === 'good' ? 'found' : 'attention',
  severity, weight: 6, category: 'Tehnička osnova', evidence: 'jedno mjerenje', recommendation: '', url: goodFacts.url,
});

const sig = (input: SolutionInput) => selectCapabilities({ message: input.message, facts: input.facts, checks: input.checks });
const primaryId = (m: { capabilities: { id: string; role: string }[] }) => m.capabilities.find(c => c.role === 'primary')!.id;
async function build(input: SolutionInput, provider = new FakeProvider()) {
  clearMemory();
  return buildSolutionMap({ input, provider, signal: AbortSignal.timeout(2000), locale: 'bs' });
}

// ---------- Distinct problem coverage ----------
test('distinct problems produce materially different primary capabilities (fallback path)', async () => {
  const cases: [string, SolutionInput][] = [
    ['traffic but few enquiries', { message: 'Imamo posjete ali malo upita, propuštamo klijente i sporo odgovaramo' }],
    ['poor Google/AI visibility', { message: 'Slabo smo vidljivi na Googleu i AI nas ne preporučuje' }],
    ['old/unclear website', { message: 'Sajt nam je zastario i treba redizajn' }],
    ['paid campaign need', { message: 'Želimo pokrenuti Meta i Google oglase, imamo budžet' }],
    ['repetitive manual work', { message: 'Puno ručnog rada se ponavlja, trebamo automatizaciju' }],
  ];
  const primaries = new Set<string>();
  for (const [, input] of cases) { const m = await build(input); primaries.add(primaryId(m)); }
  assert.ok(primaries.size >= 4, `expected materially different primaries, got ${[...primaries].join(',')}`);
});

// ---------- Approved closed set + recommendation cap ----------
test('every capability id is in the approved closed set and the cap is respected', async () => {
  const m = await build({ message: 'seo, oglasi, automatizacija, redizajn, upiti, održavanje' });
  assert.ok(m.capabilities.length <= MAX_SOLUTION_CAPABILITIES, 'no hard-sell stacking');
  for (const c of m.capabilities) assert.ok((capabilityIds as readonly string[]).includes(c.id), `${c.id} is approved`);
  assert.equal(m.capabilities.filter(c => c.role === 'primary').length, 1);
});

// ---------- Contract validity ----------
test('a built map always satisfies the strict SolutionMap schema', async () => {
  const m = await build({ message: 'slaba vidljivost na Googleu' });
  assert.equal(solutionMapSchema.safeParse(m).success, true);
});


// ---------- REASONING path: valid model output accepted ----------
test('a valid grounded reasoning output is accepted as a REASONING map', async () => {
  const input: SolutionInput = { message: 'slabo smo vidljivi na Googleu i AI nas ne preporučuje' };
  const signals = sig(input);
  const evidence = buildEvidence(input, signals);
  const provider = new FakeProvider().enqueue('buildSolutionMap', JSON.stringify({
    diagnosis: 'Vidljivost u pretrazi i AI je glavni fokus.',
    capabilities: [{ id: signals[0].id, rationale: 'Rješava opisani problem vidljivosti.', evidenceRefs: [evidence[0].id] }],
    phases: [{ title: 'Razumijevanje', detail: 'Analiziramo trenutnu vidljivost.' }],
    unknowns: ['Budžet nije naveden.'],
    nextAction: 'Predlažemo kratak razgovor.',
  }));
  const m = await build(input, provider);
  assert.equal(m.mode, 'REASONING');
  assert.equal(m.capabilities[0].id, signals[0].id);
});

// ---------- Unsupported capability rejected (SEO-only for a lead-response problem) ----------
test('a capability outside the candidate set is rejected → deterministic fallback', () => {
  const input: SolutionInput = { message: 'Ne stižemo odgovarati na upite, propuštamo klijente' };
  const signals = sig(input);
  const evidence = buildEvidence(input, signals);
  // CAP-01 (SEO) is NOT a candidate for a pure lead-response problem: reasoning that recommends it is untrusted.
  assert.ok(!signals.some(s => s.id === 'CAP-01'), 'SEO is not a candidate here');
  const bad = validateReasoning({
    diagnosis: 'x', capabilities: [{ id: 'CAP-01', rationale: 'Trebate SEO.', evidenceRefs: [evidence[0].id] }],
    phases: [{ title: 'a', detail: 'b' }], unknowns: [], nextAction: 'y',
  }, input, signals, evidence, 'bs');
  assert.equal(bad, null);
});

test('an unknown capability id (CAP-99) is rejected', () => {
  const input: SolutionInput = { message: 'seo vidljivost' };
  const signals = sig(input); const evidence = buildEvidence(input, signals);
  const bad = validateReasoning({
    diagnosis: 'x', capabilities: [{ id: 'CAP-99', rationale: 'ok', evidenceRefs: [evidence[0].id] }],
    phases: [{ title: 'a', detail: 'b' }], unknowns: [], nextAction: 'y',
  }, input, signals, evidence, 'bs');
  assert.equal(bad, null);
});

// ---------- Evidence ref validation ----------
test('an unsupported evidence reference is rejected', () => {
  const input: SolutionInput = { message: 'seo vidljivost' };
  const signals = sig(input); const evidence = buildEvidence(input, signals);
  const bad = validateReasoning({
    diagnosis: 'x', capabilities: [{ id: signals[0].id, rationale: 'ok', evidenceRefs: ['E999'] }],
    phases: [{ title: 'a', detail: 'b' }], unknowns: [], nextAction: 'y',
  }, input, signals, evidence, 'bs');
  assert.equal(bad, null);
});

test('the visitor quote is captured as evidence verbatim', () => {
  const message = 'Ne stižemo odgovarati na upite';
  const input: SolutionInput = { message };
  const evidence = buildEvidence(input, sig(input));
  const quote = evidence.find(e => e.kind === 'quote');
  assert.ok(quote && quote.detail.includes(extractProblem(message)));
});

// ---------- Unsupported numeric / guarantee rejection via T14 guards ----------
test('an unsupported numeric / ranking guarantee in a rationale is rejected', () => {
  const input: SolutionInput = { message: 'seo vidljivost' };
  const signals = sig(input); const evidence = buildEvidence(input, signals);
  const bad = validateReasoning({
    diagnosis: 'Garantujemo top 3 poziciju za 30 dana.',
    capabilities: [{ id: signals[0].id, rationale: 'Podići ćemo promet za 200%.', evidenceRefs: [evidence[0].id] }],
    phases: [{ title: 'a', detail: 'b' }], unknowns: [], nextAction: 'y',
  }, input, signals, evidence, 'bs');
  assert.equal(bad, null);

// ---------- Unstated budget/timeline remain unknown, never invented ----------
test('an unstated budget and timeline surface only as explicit unknowns', async () => {
  const m = await build({ message: 'slaba vidljivost na Googleu' });
  const json = JSON.stringify(m);
  assert.equal(/\bKM\b|€|\$|\d+\s*mjesec|\d+\s*dana|budget:\s*\d/i.test(json), false, 'no invented budget/timeline value');
  assert.ok(m.unknowns.some(u => /budžet/i.test(u)), 'budget listed as unknown');
});

// ---------- No fake audit claim when no audit ran ----------
test('a map with no audit input carries no audit-kind evidence (no fake audit claim)', async () => {
  const m = await build({ message: 'slaba vidljivost na Googleu' });
  assert.equal(m.evidenceRefs.some(e => e.kind === 'audit'), false, 'no audit evidence without an audit');
});

// ---------- Reasoning timeout / provider error fallback ----------
test('a reasoning timeout falls back to a deterministic FALLBACK map', async () => {
  const provider = new FakeProvider().enqueue('buildSolutionMap', new ModelError('model_timeout'));
  const m = await build({ message: 'slaba vidljivost na Googleu' }, provider);
  assert.equal(m.mode, 'FALLBACK');
  assert.equal(solutionMapSchema.safeParse(m).success, true);
});

// ---------- Malformed response fallback ----------
test('a malformed reasoning response falls back deterministically', async () => {
  const provider = new FakeProvider().enqueue('buildSolutionMap', '{"not":"a valid map"}', '{"still":"invalid"}');
  const m = await build({ message: 'slaba vidljivost na Googleu' }, provider);
  assert.equal(m.mode, 'FALLBACK');
});

// ---------- CAP-03 limitation preserved through the map ----------
test('CAP-03 carries the not-Core-Web-Vitals speed evidence note, not a speed-gain promise', async () => {
  const input: SolutionInput = { message: 'stranica nam se sporo učitava', checks: [speedCheck('warning')] };
  const m = await build(input);
  const cap03 = m.capabilities.find(c => c.id === 'CAP-03');
  assert.ok(cap03, 'CAP-03 surfaced from the speed AuditCheck');
  assert.equal(cap03!.speedEvidenceNote, CAP03_SPEED_EVIDENCE_NOTE);
  assert.match(cap03!.speedEvidenceNote!, /nije Core Web Vitals/i);
  assert.equal(/brž[ei]|faster|\d+\s*%/i.test(cap03!.rationale), false, 'no speed-gain promise');
});

// ---------- CAP-11 not audit-inferred ----------
test('CAP-11 is never surfaced from an unhealthy audit alone', async () => {
  const badFacts: AuditFacts = { ...goodFacts, noindex: true, hasContact: false, viewport: null, wordCount: 5, mentionsServices: false };
  const m = await build({ message: 'analizirajte moju stranicu', facts: badFacts, checks: [speedCheck('critical')] });
  assert.equal(m.capabilities.some(c => c.id === 'CAP-11'), false);
});

// ---------- Hash / idempotency ----------
test('equivalent inputs produce a stable source hash and reuse the cached map', async () => {
  const input: SolutionInput = { message: 'slaba vidljivost na Googleu' };
  assert.equal(solutionSourceHash(input, sig(input)), solutionSourceHash(input, sig(input)));
  clearMemory();
  const provider = new FakeProvider(); // empty queue: a second reasoning call would throw provider_unavailable
  const first = await buildSolutionMap({ input, provider, signal: AbortSignal.timeout(2000), locale: 'bs' });
  const second = await buildSolutionMap({ input, provider, signal: AbortSignal.timeout(2000), locale: 'bs' });
  assert.equal(first.id, second.id, 'cache hit reused the same map (no repeat reasoning)');
});

// ---------- SEO-only recommendation rejected for an unrelated problem (covered above via candidate set) ----------
test('an SEO-only fallback never surfaces for a pure automation problem', async () => {
  const m = await build({ message: 'Puno ručnog rada se ponavlja, trebamo automatizaciju' });
  assert.equal(primaryId(m), 'CAP-06');
  assert.equal(m.capabilities.some(c => c.id === 'CAP-01'), false);
});

// ---------- No-candidate honesty ----------
test('a problem with no candidate returns a valid, honest "tell me more" map (no invented capability)', async () => {
  const m = await build({ message: 'xyzzy qwerty' });
  assert.equal(solutionMapSchema.safeParse(m).success, true);
  assert.equal(m.mode, 'FALLBACK');
  assert.ok(m.capabilities.length >= 1 && m.capabilities.length <= MAX_SOLUTION_CAPABILITIES);
});

// ---------- Card projection hides the reasoning chain ----------
test('the visitor card exposes problem, capability, evidence and next action only', async () => {
  const m = await build({ message: 'slaba vidljivost na Googleu' });
  const card = toSolutionCard(m);
  assert.ok(card.problem && card.diagnosis && card.nextAction);
  assert.ok(card.capabilities.length >= 1);
  assert.equal('sourceHash' in card, false);
  assert.equal('id' in card, false);
});

// ---------- Flow C end-to-end (deterministic) ----------
test('Flow C: problem → candidates → evidence-linked bounded map with a valid next action', async () => {
  const m = await build({ message: 'Slabo smo vidljivi na Googleu i AI nas ne preporučuje' });
  assert.equal(primaryId(m), 'CAP-01');
  assert.ok(m.capabilities[0].evidenceRefs.length >= 1, 'primary capability links evidence');
  assert.ok(m.evidenceRefs.some(e => e.id === m.capabilities[0].evidenceRefs[0]), 'evidence ref resolves');
  assert.ok(m.nextAction.length > 0);
});

});
