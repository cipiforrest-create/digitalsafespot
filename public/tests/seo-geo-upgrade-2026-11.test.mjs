import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = path => readFileSync(`public${path}`, 'utf8');
const schemas = html => [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  .flatMap(([, json]) => { const d = JSON.parse(json); return d['@graph'] || [d]; });

test('vercel.json redirects /radovi/ to /projekti/ in all locales', () => {
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
  for (const [src, dst] of [['/radovi/', '/projekti/'], ['/en/radovi/', '/en/projekti/'], ['/de/radovi/', '/de/projekti/']]) {
    assert.ok(vercel.redirects.some(r => r.source === src && r.destination === dst && r.permanent === true), src);
  }
});

test('homepage and service schemas carry complete entity, geo, hours and founder data without unverified superlatives', () => {
  const home = read('/index.html');
  assert.doesNotMatch(home, /Prva AEO agencija u BiH/);
  const org = schemas(home).find(n => [n['@type']].flat().includes('Organization'));
  assert.equal(org.legalName, 'Digital X Marketing');
  assert.equal(org.address.streetAddress, 'Stupska bb');
  assert.equal(org.address.postalCode, '71000');
  assert.ok(org.geo && org.openingHoursSpecification && org.founder);
});

test('localized landing pages have valid JSON-LD without HTML leakage', () => {
  for (const p of ['/en/landing-web.html', '/de/landing-web.html', '/en/landing-ai.html', '/de/landing-ai.html', '/en/landing-seo.html', '/de/landing-seo.html']) {
    const html = read(p);
    assert.doesNotMatch(html, /width=device-width.*application\/ld\+json|application\/ld\+json.*width=device-width/);
    for (const node of schemas(html)) {
      if (node.description) assert.doesNotMatch(node.description, /<title>|viewport/);
    }
  }
});

test('llms-full.txt and /pojmovnik/ DefinedTermSet exist and are linked', () => {
  assert.ok(existsSync('public/llms-full.txt'));
  const llms = read('/llms.txt');
  const llmsFull = read('/llms-full.txt');
  assert.match(llms, /llms-full\.txt/);
  assert.match(llmsFull, /Stupska bb, 71000 Sarajevo/);
  assert.match(llmsFull, /Vedad Čičak/);

  const glossary = read('/pojmovnik/index.html');
  const termSet = schemas(glossary).find(n => n['@type'] === 'DefinedTermSet');
  assert.ok(termSet && termSet.hasDefinedTerm.length >= 12);
});

test('new city pages, industry pages and gap-closing guides are built, indexed and carry Person author', () => {
  const sitemap = read('/sitemap.xml');
  const newPaths = [
    '/pojmovnik/',
    '/usluge/izrada-web-stranica/banja-luka/',
    '/usluge/izrada-web-stranica/mostar/',
    '/usluge/izrada-web-stranica/tuzla/',
    '/usluge/izrada-web-stranica/zenica/',
    '/industrije/privatne-klinike/',
    '/industrije/racunovodstvo-i-konsalting/',
    '/znanje/koliko-kosta-seo-optimizacija-bih/',
    '/znanje/agencija-ili-freelancer-web-stranica/',
    '/znanje/meta-capi-server-side-tracking/',
  ];
  for (const p of newPaths) {
    assert.ok(existsSync(`public${p}index.html`), `missing ${p}`);
    assert.ok(sitemap.includes(`https://www.digital-x-marketing.com${p}<`), `sitemap missing ${p}`);
  }
  for (const g of ['/znanje/koliko-kosta-seo-optimizacija-bih/', '/znanje/agencija-ili-freelancer-web-stranica/', '/znanje/meta-capi-server-side-tracking/']) {
    const nodes = schemas(read(`${g}index.html`));
    assert.ok(nodes.some(n => n['@type'] === 'Person' && n.name === 'Vedad Čičak'), `${g} Person`);
    assert.ok(nodes.some(n => n['@type'] === 'Article' && n.author?.['@id']?.includes('#author-vedad-cicak')), `${g} Article author`);
  }
});

test('cookie pages are consistently noindex and excluded from sitemap across all locales', () => {
  const sitemap = read('/sitemap.xml');
  for (const p of ['/kolacici.html', '/en/kolacici.html', '/de/kolacici.html']) {
    assert.ok(!sitemap.includes(`https://www.digital-x-marketing.com${p}<`), `sitemap should exclude ${p}`);
  }
});
