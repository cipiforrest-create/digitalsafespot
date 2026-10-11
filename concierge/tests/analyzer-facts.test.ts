import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeHtml, extractFacts, gradeChecks } from '../server/analyze';
import { auditFactsSchema, factKeys, FACT_STRING_MAX } from '../shared/audit-facts';
import { auditFixtures } from './fixtures/audit-fixtures';
import factsGolden from './fixtures/facts-golden.json' with { type: 'json' };
// The frozen baseline was captured from the ORIGINAL analyzeHtml before the extract/grade split.
// It is never regenerated, so equality here proves the refactor changed no user-visible output.
import analyzeGolden from './fixtures/analyze-golden.json' with { type: 'json' };

const golden = analyzeGolden as Record<string, unknown>;
const factsMap = factsGolden as Record<string, unknown>;

// T16 requirement 11: byte-for-byte parity of the current AuditCheck output.
for (const f of auditFixtures) {
  test(`byte-parity: analyzeHtml(${f.name}) matches frozen baseline`, () => {
    assert.equal(JSON.stringify(analyzeHtml(f.html, f.url, f.status)), JSON.stringify(golden[f.name]));
  });
}

// T16 requirement 6: analyzeHtml is exactly gradeChecks(extractFacts(...)).
for (const f of auditFixtures) {
  test(`wrapper identity: analyzeHtml === gradeChecks(extractFacts) for ${f.name}`, () => {
    const viaWrapper = JSON.stringify(analyzeHtml(f.html, f.url, f.status));
    const viaSplit = JSON.stringify(gradeChecks(extractFacts(f.html, f.url, f.status)));
    assert.equal(viaWrapper, viaSplit);
  });
}

// T16 requirement 10: golden AuditFacts.
for (const f of auditFixtures) {
  test(`golden facts: extractFacts(${f.name})`, () => {
    const got = extractFacts(f.html, f.url, f.status);
    assert.deepEqual(got, factsMap[f.name]);
    // The fact model is closed and validates against its schema.
    assert.doesNotThrow(() => auditFactsSchema.parse(got));
  });
}

// T16 requirement 3/7: closed FactKey set, explicit unknowns as null.
test('fact model is closed and represents unknown states explicitly', () => {
  const facts = extractFacts(auditFixtures[1].html, auditFixtures[1].url, 200); // missing-meta
  assert.deepEqual(Object.keys(facts).sort(), [...factKeys].sort());
  assert.equal(facts.canonical, null);
  assert.equal(facts.ogTitle, null);
  assert.equal(facts.ogImage, null);
  assert.equal(facts.viewport, null);
  assert.equal(facts.lang, null);
  assert.equal(facts.title, '');
});

// T16 requirement 8: page-controlled snippets are bounded.
test('page-controlled fact strings are length-bounded', () => {
  const big = 'x'.repeat(FACT_STRING_MAX * 3);
  const html = `<!doctype html><html lang="${big}"><head><title>${big}</title>` +
    `<meta name="description" content="${big}"><link rel="canonical" href="${big}">` +
    `<meta property="og:title" content="${big}"><meta property="og:image" content="${big}">` +
    `<meta name="viewport" content="${big}"></head><body><h1>${big}</h1></body></html>`;
  const facts = extractFacts(html, 'https://example.com/', 200);
  for (const v of [facts.title, facts.description, facts.canonical, facts.ogTitle, facts.ogImage, facts.viewport, facts.lang]) {
    assert.ok((v ?? '').length <= FACT_STRING_MAX, 'string exceeded FACT_STRING_MAX');
  }
  for (const h of facts.headings) assert.ok(h.length <= FACT_STRING_MAX);
});

// Deterministic: repeated extraction yields identical facts.
test('extractFacts is deterministic', () => {
  for (const f of auditFixtures) {
    assert.deepEqual(extractFacts(f.html, f.url, f.status), extractFacts(f.html, f.url, f.status));
  }
});

// Non-2xx short-circuit is preserved (grading returns only the access check).
test('non-2xx status grades only the access check', () => {
  const checks = analyzeHtml('<html><title>x</title></html>', 'https://example.com/', 503);
  assert.equal(checks.length, 1);
  assert.equal(checks[0].id, 'access');
  assert.equal(checks[0].severity, 'critical');
});