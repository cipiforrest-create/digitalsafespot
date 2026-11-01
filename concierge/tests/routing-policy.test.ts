import test from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error Plain ESM module shared with the edge middleware; no type declarations.
import { canonicalHostTarget, trailingSlashTarget } from '../../lib/routing-policy.mjs';

test('slashless directory paths redirect to the trailing-slash URL', () => {
  assert.equal(trailingSlashTarget('https://www.digital-x-marketing.com/usluge'), 'https://www.digital-x-marketing.com/usluge/');
  assert.equal(trailingSlashTarget('https://www.digital-x-marketing.com/en/usluge/seo-aeo-geo?x=1'), 'https://www.digital-x-marketing.com/en/usluge/seo-aeo-geo/?x=1');
});

test('files, the root, slash URLs and technical paths are left alone', () => {
  for (const path of ['/', '/usluge/', '/o-nama.html', '/sitemap.xml', '/api/lead', '/_vercel/insights']) {
    assert.equal(trailingSlashTarget(`https://www.digital-x-marketing.com${path}`), null, path);
  }
});

test('non-www and missing slash resolve in one hop', () => {
  const slash = trailingSlashTarget('http://digital-x-marketing.com/usluge');
  assert.equal(canonicalHostTarget(new URL(slash!)), 'https://www.digital-x-marketing.com/usluge/');
});

test('the production vercel.app alias redirects to www, preview hosts do not', () => {
  assert.equal(canonicalHostTarget(new URL('https://digital-x-agency.vercel.app/usluge/')), 'https://www.digital-x-marketing.com/usluge/');
  assert.equal(canonicalHostTarget(new URL('https://digital-x-agency-git-seo-audit-followup-nov-2026-eynna-hair.vercel.app/')), null);
  assert.equal(canonicalHostTarget(new URL('https://digital-x-agency-iyujhclk9-eynna-hair.vercel.app/')), null);
});
