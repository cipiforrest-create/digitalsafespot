import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { legacyServiceTarget, isLegacyRedirectPath, movedPageTarget } from '../lib/routing-policy.mjs';
import { enhanceCinematicHtml, CINEMATIC_PAGES } from '../lib/cinematic-seo.mjs';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = (path) => readFileSync(resolve(SITE, path), 'utf8');

test('Smart Website Launch has one canonical page in every language', () => {
  for (const prefix of ['', '/en', '/de']) {
    const target = `${prefix}/shop/product/smart-website-launch/`;
    for (const tail of ['', '/', '/index.html']) {
      const path = `${prefix}/smart-website-launch${tail}`;
      assert.equal(movedPageTarget(path), target);
      assert.ok(isLegacyRedirectPath(path), `${path} must stay out of the sitemap`);
      assert.equal(legacyServiceTarget(`https://digital-x-marketing.com${path}`), `https://digital-x-marketing.com${target}`);
    }
  }
  assert.equal(movedPageTarget('/shop/product/smart-website-launch/'), null);
});

test('cinematic demo frames are noindex, follow', () => {
  for (const slug of Object.keys(CINEMATIC_PAGES)) {
    const html = enhanceCinematicHtml('<html><head><title>x</title></head><body><h1>x</h1></body></html>', slug);
    assert.match(html, /<meta name="robots" content="noindex, follow">/, slug);
  }
  for (const slug of ['cinematic-perfume', 'cinematic-sneakers', 'cinematic-kodent']) {
    assert.match(file(`${slug}/index.html`), /<meta name="robots" content="noindex/, slug);
  }
});

test('EN/DE locales keep brand names and contain no known mistranslations', () => {
  const banned = ['Bleitisch', 'Leittisch', 'Shopken', 'Parfimeria', 'Parfumeria', 'Skrulling', 'Product staffing', 'AI Recipe', 'KI Rezept', 'TIGITAL', 'ZIGITAL', 'Digitales X', 'IHRE ORGANE'];
  for (const lang of ['en', 'de']) {
    const text = file(`concierge/locales/${lang}.json`);
    for (const word of banned) assert.ok(!text.includes(word), `${lang}.json still contains "${word}"`);
    const dict = JSON.parse(text);
    for (const brand of ['X Lead Desk', 'X Convert', 'Smart Website Launch']) {
      for (const [key, value] of Object.entries(dict)) {
        if (key.includes(brand)) assert.ok(value.includes(brand), `${lang}: "${key}" lost "${brand}"`);
      }
    }
  }
});

test('Smart Storefront no longer competes with the web shop page for "izrada web shopa"', () => {
  const copy = file('concierge/seo-copy.mjs');
  assert.ok(!copy.includes("'Izrada web shopa u BiH: Smart Storefront"));
  assert.match(file('concierge/znanje/landings.mjs'), /title: 'Izrada web shopa u BiH/);
});
