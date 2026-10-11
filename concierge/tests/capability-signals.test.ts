import test from 'node:test';
import assert from 'node:assert/strict';
import { selectCapabilities, factConditionMet, MAX_CAPABILITIES, type CapabilitySignal } from '../server/orchestrator/signals';
import { CAPABILITIES, capabilityIds, isCapabilityId, CAP03_SPEED_EVIDENCE_NOTE, SPEED_AUDIT_CHECK_ID } from '../shared/capabilities';
import { pageIds } from '../shared/catalogue';
import type { AuditFacts } from '../shared/audit-facts';
import type { AuditCheck } from '../shared/contracts';

// A healthy baseline: every deterministic fact is in its "good" state so no fact signal fires unless we flip one.
const goodFacts: AuditFacts = {
  url: 'https://example.test/', status: 200, ok: true, https: true, title: 'Digital X', description: 'Web i AI.',
  canonical: 'https://example.test/', headings: ['Usluge'], h2Count: 3, wordCount: 400, mentionsServices: true,
  images: { total: 2, withAlt: 2 }, schema: { types: ['Organization'], invalid: 0 }, ogTitle: 'x', ogImage: 'y.png',
  noindex: false, viewport: 'width=device-width', lang: 'bs', hasContact: true,
};
const ids = (s: CapabilitySignal[]) => s.map(x => x.id);
const speedCheck = (severity: AuditCheck['severity']): AuditCheck => ({
  id: SPEED_AUDIT_CHECK_ID, title: 'Odgovor servera', status: severity === 'good' ? 'found' : 'attention',
  severity, weight: 6, category: 'Tehnička osnova', evidence: 'jedno mjerenje', recommendation: '', url: goodFacts.url,
});

// ---------- Table integrity ----------
test('capability table is closed, stable and references only real page ids', () => {
  assert.equal(CAPABILITIES.length, 13);
  assert.deepEqual(capabilityIds, [
    'CAP-01', 'CAP-02', 'CAP-03', 'CAP-04', 'CAP-05', 'CAP-06', 'CAP-07',
    'CAP-08', 'CAP-09', 'CAP-10', 'CAP-11', 'CAP-12', 'CAP-13',
  ]);
  const valid = new Set<string>(pageIds);
  for (const cap of CAPABILITIES) {
    assert.ok(cap.serviceIds.length > 0, `${cap.id} has services`);
    for (const sid of cap.serviceIds) assert.ok(valid.has(sid), `${cap.id} service ${sid} is a real pageId`);
  }
  assert.ok(isCapabilityId('CAP-01'));
  assert.equal(isCapabilityId('CAP-99'), false);
});

// ---------- COVERAGE: six materially different problems → different mappings ----------
test('coverage 1: weak SEO / AI visibility → CAP-01', () => {
  const s = selectCapabilities({ message: 'AI nas ne preporučuje i slabo smo vidljivi na Googleu' });
  assert.ok(ids(s).includes('CAP-01'));
});
test('coverage 2: outdated / unclear website → CAP-02', () => {
  const s = selectCapabilities({ message: 'Sajt nam je zastario i treba redizajn' });
  assert.ok(ids(s).includes('CAP-02'));
});
test('coverage 3: slow lead response → CAP-04', () => {
  const s = selectCapabilities({ message: 'Ne stižemo odgovarati na upite, propuštamo klijente' });
  assert.ok(ids(s).includes('CAP-04'));
});
test('coverage 4: paid advertising need → CAP-07', () => {
  const s = selectCapabilities({ message: 'Želimo pokrenuti oglase i kampanje, imamo budžet' });
  assert.ok(ids(s).includes('CAP-07'));
});
test('coverage 5: content production need → CAP-09', () => {
  const s = selectCapabilities({ message: 'Trebamo profesionalnu fotografiju i video produkciju' });
  assert.ok(ids(s).includes('CAP-09'));
});
test('coverage 6: workflow automation need → CAP-06', () => {
  const s = selectCapabilities({ message: 'Puno ručnog rada se ponavlja, želimo automatizaciju' });
  assert.ok(ids(s).includes('CAP-06'));
});
test('coverage mappings are materially different across the six problems', () => {
  const seo = ids(selectCapabilities({ message: 'seo vidljivost' }));
  const web = ids(selectCapabilities({ message: 'redizajn sajta' }));
  const lead = ids(selectCapabilities({ message: 'sporo odgovaramo na upite' }));
  const ads = ids(selectCapabilities({ message: 'oglasi kampanje' }));
  const content = ids(selectCapabilities({ message: 'fotografija video' }));
  const auto = ids(selectCapabilities({ message: 'automatizacija ponavlja' }));
  const first = [seo[0], web[0], lead[0], ads[0], content[0], auto[0]];
  assert.equal(new Set(first).size, 6, 'each problem maps to a distinct top capability');
});


// ---------- Deterministic fact selection ----------
test('audit facts alone select a materially different set than a slow-response chat', () => {
  const seoFacts: AuditFacts = { ...goodFacts, noindex: true, title: '', mentionsServices: false };
  const s = selectCapabilities({ facts: seoFacts });
  assert.ok(ids(s).includes('CAP-01'), 'noindex/empty-title/no-services → visibility');
});
test('fact predicates are bounded and deterministic', () => {
  assert.equal(factConditionMet('noindex', { ...goodFacts, noindex: true }), true);
  assert.equal(factConditionMet('noContact', { ...goodFacts, hasContact: false }), true);
  assert.equal(factConditionMet('lowWordCount', { ...goodFacts, wordCount: 10 }), true);
  assert.equal(factConditionMet('lowWordCount', goodFacts), false);
  assert.equal(factConditionMet('missingAlt', { ...goodFacts, images: { total: 3, withAlt: 1 } }), true);
  assert.equal(factConditionMet('missingAlt', { ...goodFacts, images: { total: 0, withAlt: 0 } }), false);
});

// ---------- NEGATIVE: no capability outside the closed set ----------
test('negative: selection never returns an id outside CAP-01…CAP-13', () => {
  const s = selectCapabilities({ message: 'seo redizajn oglasi automatizacija fotografija upiti webshop' });
  for (const sig of s) assert.ok(isCapabilityId(sig.id));
});

// ---------- NEGATIVE: no hard-sell stacking ----------
test('negative: many problems at once are capped, never 3+ services stacked', () => {
  const s = selectCapabilities({
    message: 'seo redizajn oglasi automatizacija fotografija upiti webshop aplikacija recenzije održavanje',
    facts: { ...goodFacts, noindex: true, hasContact: false, viewport: null, mentionsServices: false, wordCount: 5 },
    checks: [speedCheck('critical')],
  });
  assert.ok(s.length <= MAX_CAPABILITIES, `capped at ${MAX_CAPABILITIES}`);
  assert.ok(s.length < 3, 'never 3+ services at once');
});

// ---------- NEGATIVE: an unrelated / supporting-only audit fact does not recommend ----------
test('negative: a supporting-only fact does NOT recommend a service on its own', () => {
  // hasContact=false is only a SUPPORTING signal for CAP-04/CAP-07; with no primary source nothing may surface.
  const s = selectCapabilities({ facts: { ...goodFacts, hasContact: false } });
  assert.ok(!ids(s).includes('CAP-04'), 'no lead-response recommendation from a supporting fact alone');
  assert.ok(!ids(s).includes('CAP-07'), 'no paid-campaign recommendation from a supporting fact alone');
});
test('negative: an unrelated audit fact never maps to an unrelated capability', () => {
  // ogImage=null only supports CAP-09; it must not, alone, recommend content production.
  const s = selectCapabilities({ facts: { ...goodFacts, ogImage: null } });
  assert.ok(!ids(s).includes('CAP-09'));
});

// ---------- NEGATIVE: no ranking / result / price guarantees leak from the layer ----------
test('negative: signals carry no ranking, result, or price claims', () => {
  const s = selectCapabilities({ message: 'seo oglasi', facts: goodFacts });
  const json = JSON.stringify(s);
  assert.equal(/garant|guarantee|top\s*\d|\d+\s*%|\d+\s*\+|KM|€|\$/i.test(json.replace(CAP03_SPEED_EVIDENCE_NOTE, '')), false);
});

// ---------- CAP-03: speed is a deterministic AuditCheck, NOT Core Web Vitals, NOT a FactKey ----------
test('CAP-03: a warning/critical speed AuditCheck triggers CAP-03 with the not-CWV evidence note', () => {
  const warn = selectCapabilities({ checks: [speedCheck('warning')] });
  const cap03 = warn.find(x => x.id === 'CAP-03');
  assert.ok(cap03, 'speed warning triggers CAP-03');
  assert.equal(cap03!.matchedChecks.includes(SPEED_AUDIT_CHECK_ID), true);
  assert.equal(cap03!.speedEvidenceNote, CAP03_SPEED_EVIDENCE_NOTE);
  assert.match(cap03!.speedEvidenceNote!, /nije Core Web Vitals/i);
});
test('CAP-03: a good speed check does not trigger, and speed is never a FactKey', () => {
  assert.ok(!ids(selectCapabilities({ checks: [speedCheck('good')] })).includes('CAP-03'));
  // The `speed` id must not be an AuditFacts condition — CAP-03 uses auditCheckTriggers, not factSignals, for it.
  const cap03 = CAPABILITIES.find(c => c.id === 'CAP-03')!;
  assert.equal(cap03.auditCheckTriggers.some(t => t.checkId === SPEED_AUDIT_CHECK_ID), true);
  assert.equal(cap03.factSignals.some(f => (f.condition as string) === 'speed'), false);
});

// ---------- CAP-11: conversation-driven only; never model/audit-inferred for P0 ----------
test('CAP-11: only conversation stems can surface it — no audit/fact trigger exists', () => {
  const cap11 = CAPABILITIES.find(c => c.id === 'CAP-11')!;
  assert.equal(cap11.factSignals.length, 0, 'no fact signals');
  assert.equal(cap11.auditCheckTriggers.length, 0, 'no audit-check triggers');
  // Even a broadly "unhealthy" audit must not infer an ongoing-partnership recommendation.
  const badFacts: AuditFacts = { ...goodFacts, noindex: true, hasContact: false, viewport: null, wordCount: 5, mentionsServices: false };
  assert.ok(!ids(selectCapabilities({ facts: badFacts, checks: [speedCheck('critical')] })).includes('CAP-11'));
  // A conversation ask does surface it.
  assert.ok(ids(selectCapabilities({ message: 'tražimo mjesečno održavanje i partnera za podršku' })).includes('CAP-11'));
});

// ---------- Determinism ----------
test('selection is deterministic for identical input', () => {
  const input = { message: 'seo i oglasi', facts: { ...goodFacts, noindex: true } };
  assert.deepEqual(selectCapabilities(input), selectCapabilities(input));
});
