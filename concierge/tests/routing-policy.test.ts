import test from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error Plain ESM module shared with the edge middleware; no type declarations.
import { canonicalHostTarget, htmlTwinTarget, trailingSlashTarget } from '../../lib/routing-policy.mjs';
import htmlRouteList from '../../lib/html-routes.json' with { type: 'json' };

test('slashless directory paths redirect to the trailing-slash URL', () => {
  assert.equal(trailingSlashTarget('https://digital-x-marketing.com/usluge'), 'https://digital-x-marketing.com/usluge/');
  assert.equal(trailingSlashTarget('https://digital-x-marketing.com/en/usluge/seo-aeo-geo?x=1'), 'https://digital-x-marketing.com/en/usluge/seo-aeo-geo/?x=1');
});

test('files, the root, slash URLs and technical paths are left alone', () => {
  for (const path of ['/', '/usluge/', '/o-nama.html', '/sitemap.xml', '/api/lead', '/_vercel/insights']) {
    assert.equal(trailingSlashTarget(`https://digital-x-marketing.com${path}`), null, path);
  }
});

test('www and missing slash resolve in one hop to the canonical apex domain', () => {
  const slash = trailingSlashTarget('http://www.digital-x-marketing.com/usluge?utm_source=test');
  assert.equal(canonicalHostTarget(new URL(slash!)), 'https://digital-x-marketing.com/usluge/?utm_source=test');
  assert.equal(canonicalHostTarget(new URL('https://digital-x-marketing.com/usluge/')), null);
});

test('the production vercel.app alias and www redirect to apex, preview hosts do not', () => {
  assert.equal(canonicalHostTarget(new URL('https://www.digital-x-marketing.com/usluge/?x=1')), 'https://digital-x-marketing.com/usluge/?x=1');
  assert.equal(canonicalHostTarget(new URL('https://digital-x-agency.vercel.app/usluge/')), 'https://digital-x-marketing.com/usluge/');
  assert.equal(canonicalHostTarget(new URL('https://digital-x-agency-git-seo-audit-followup-nov-2026-eynna-hair.vercel.app/')), null);
  assert.equal(canonicalHostTarget(new URL('https://digital-x-agency-iyujhclk9-eynna-hair.vercel.app/')), null);
});

test('slashless and slash twins of .html pages go to the .html URL in one hop (no /kontakt/ 404)', () => {
  const routes = new Set<string>(htmlRouteList);
  const base = 'https://digital-x-marketing.com';
  for (const [from, to] of [['/kontakt', '/kontakt.html'], ['/o-nama/', '/o-nama.html'], ['/privatnost', '/privatnost.html'], ['/blog/aeo-vodic', '/blog/aeo-vodic.html'], ['/en/o-nama', '/en/o-nama.html'], ['/de/kontakt/', '/de/kontakt.html']]) {
    assert.equal(htmlTwinTarget(`${base}${from}?x=1`, routes), `${base}${to}?x=1`, from);
  }
  for (const path of ['/', '/usluge', '/usluge/', '/o-nama.html', '/cjenovnik', '/sitemap.xml', '/nepostojeca-stranica']) {
    assert.equal(htmlTwinTarget(`${base}${path}`, routes), null, path);
  }
});

test('every .html route the build publishes is a real file and has no directory twin', () => {
  assert.ok(htmlRouteList.length > 40);
  for (const path of htmlRouteList) assert.match(path, /^\/[^?#]+\.html$/, path);
});
