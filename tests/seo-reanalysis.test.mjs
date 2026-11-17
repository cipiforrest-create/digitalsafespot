// Fixes from the November 2026 SEO reanalysis: search-aligned H1s, new commercial landing pages,
// EUR equivalents on EN/DE pages and no internal docs in the published site. Run after `npm run build`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { withEuro } from '../concierge/localize-pages.mjs';

const read = path => readFileSync(`public${path}`, 'utf8');
const h1 = html => (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]?.replace(/<[^>]+>/g, '').trim() || '';
const schemaTypes = html => [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
  .flatMap(([, json]) => { const d = JSON.parse(json); return (d['@graph'] || [d]).flatMap(n => [n['@type']].flat()); });

test('money pages put their target term in the H1', () => {
  assert.match(h1(read('/index.html')), /^Digitalna agencija Sarajevo/);
  assert.match(h1(read('/usluge/seo-aeo-geo/index.html')), /^SEO optimizacija Sarajevo/);
  assert.match(h1(read('/o-nama.html')), /^Digitalna agencija iz Sarajeva/);
});

const landings = ['/usluge/izrada-web-shopa/', '/usluge/lokalni-seo-sarajevo/', '/industrije/stomatologija/', '/industrije/advokati/', '/industrije/hoteli-i-turizam/', '/industrije/nekretnine/'];

test('new landing pages are indexable, canonical and carry Service + FAQPage schema', () => {
  for (const path of landings) {
    const html = read(path + 'index.html');
    assert.match(html, /<meta name="robots" content="index,follow/, path);
    assert.ok(html.includes(`<link rel="canonical" href="https://www.digital-x-marketing.com${path}">`), path);
    const types = schemaTypes(html);
    for (const type of ['Service', 'FAQPage', 'BreadcrumbList']) assert.ok(types.includes(type), `${path} ${type}`);
  }
  assert.ok(existsSync('public/industrije/index.html'));
});

test('new pages are in the sitemap and llms.txt', () => {
  const sitemap = read('/sitemap.xml'), llms = read('/llms.txt');
  for (const path of [...landings, '/industrije/']) {
    assert.ok(sitemap.includes(`https://www.digital-x-marketing.com${path}<`), `sitemap ${path}`);
    assert.ok(llms.includes(`https://www.digital-x-marketing.com${path})`), `llms ${path}`);
  }
});

test('demo concepts on industry pages are labelled as concepts', () => {
  for (const path of ['/industrije/stomatologija/', '/industrije/hoteli-i-turizam/', '/industrije/nekretnine/'])
    assert.match(read(path + 'index.html'), /nije stranica stvarnog klijenta/, path);
});

test('EN and DE pages show the fixed-rate euro equivalent of KM prices', () => {
  assert.equal(withEuro('from 499 KM', 'en'), 'from 499 KM (≈ €255)');
  assert.equal(withEuro('ab 2.490 KM', 'de'), 'ab 2.490 KM (≈ 1.273 €)');
  assert.equal(withEuro('49/149/249 KM', 'en'), '49/149/249 KM (≈ €25/76/127)');
  assert.equal(withEuro('499 KM (≈ €255)', 'en'), '499 KM (≈ €255)');
  assert.match(read('/en/index.html'), /KM \(≈ €\d/);
  assert.doesNotMatch(read('/index.html'), /KM \(≈/);
});

test('internal docs are not published', () => {
  assert.ok(!existsSync('public/docs'));
});
