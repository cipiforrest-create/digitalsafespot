import test from 'node:test';
import assert from 'node:assert/strict';
import { retrieve, groundingText, resetIndex, TOP_K, UNGROUNDED_THRESHOLD } from '../server/knowledge/retriever';
import { tokenize, fold, stem } from '../server/knowledge/normalize';
import golden from './fixtures/retrieval-golden.json' with { type: 'json' };

resetIndex();
const cases = golden as { q: string; expect: string[] }[];

// Acceptance: the golden set reaches 100% top-3 (>= 30 bs/hr/sr/en/de queries plus off-topic).
test('golden retrieval set reaches 100% top-3', () => {
  assert.ok(cases.length >= 30, 'golden set must have at least 30 queries');
  const misses: string[] = [];
  for (const c of cases) {
    const top = retrieve(c.q).results.slice(0, TOP_K).map(r => r.id);
    const pass = c.expect.length === 0 ? top.length === 0 : c.expect.every(id => top.includes(id));
    if (!pass) misses.push(`${c.q} => [${top.join(',')}] expected [${c.expect.join(',')}]`);
  }
  assert.deepEqual(misses, [], `retrieval misses:\n${misses.join('\n')}`);
});

// Off-topic queries stay ungrounded (no fabricated grounding).
test('off-topic queries are ungrounded', () => {
  for (const c of cases.filter(x => x.expect.length === 0)) {
    const r = retrieve(c.q);
    assert.equal(r.grounded, false);
    assert.equal(r.results.length, 0);
    assert.equal(groundingText(c.q), '');
  }
});

// Cyrillic (sr) is transliterated and matches the Latin corpus.
test('serbian cyrillic normalizes to latin', () => {
  assert.equal(fold('Колико кошта'), 'koliko kosta');
  assert.deepEqual(tokenize('СЕО видљивост'), tokenize('SEO vidljivost'));
});

// Diacritic folding + light stemming unify variants.
test('folding and stemming unify variants', () => {
  assert.equal(fold('konverzija čćšžđ'), 'konverzija ccszdj');
  assert.equal(stem('stranice'), stem('stranica'));
});

// Page-aware boost lifts the on-page source without breaking other queries.
test('page boost lifts relevant on-page source', () => {
  const off = retrieve('cijena', { pageId: undefined });
  const on = retrieve('cijena', { pageId: 'visibility' });
  const seoOff = off.results.find(r => r.id === 'price.seo-aeo')?.score ?? 0;
  const seoOn = on.results.find(r => r.id === 'price.seo-aeo')?.score ?? 0;
  assert.ok(seoOn >= seoOff, 'page boost should not lower the on-page source score');
});

// Every retrieved result carries a stable source id and attribution.
test('results are source-attributed and bounded to top-k', () => {
  const r = retrieve('SEO vidljivost cijena');
  assert.ok(r.results.length <= TOP_K);
  for (const hit of r.results) {
    assert.ok(hit.id === hit.source.id);
    assert.ok(hit.source.origin.length > 0);
    assert.ok(hit.score >= UNGROUNDED_THRESHOLD);
  }
});

// Deterministic: identical queries yield identical ordered results.
test('retrieval is deterministic', () => {
  for (const c of cases) {
    assert.deepEqual(retrieve(c.q).results.map(r => r.id), retrieve(c.q).results.map(r => r.id));
  }
});

// Performance: median retrieval well under 2 ms.
test('median retrieval latency under 2 ms', () => {
  const times: number[] = [];
  for (let i = 0; i < 200; i++) {
    const c = cases[i % cases.length];
    const start = performance.now();
    retrieve(c.q, { pageId: 'visibility' });
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  assert.ok(median < 2, `median ${median.toFixed(3)}ms exceeded 2ms`);
});