import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'cheerio';
import { canonicalHostTarget, legacyServiceTarget, trailingSlashTarget } from '../lib/routing-policy.mjs';

function walkHtml(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

test('vercel.json has no apex-to-www loop, no www destinations, and no duplicate redirect sources', () => {
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
  const apexHostRedirects = vercel.redirects.filter(r => r.has?.some(h => h.type === 'host' && h.value === 'digital-x-marketing.com'));
  assert.deepEqual(apexHostRedirects, []);

  const wwwDestinations = vercel.redirects.filter(r => String(r.destination || '').includes('www.digital-x-marketing.com'));
  assert.deepEqual(wwwDestinations, []);

  for (const [src, dst] of [['/index.html', '/'], ['/en/index.html', '/en/'], ['/de/index.html', '/de/']]) {
    assert.ok(vercel.redirects.some(r => r.source === src && r.destination === dst && r.permanent === true), `${src} -> ${dst}`);
  }

  const seen = new Set();
  for (const r of vercel.redirects) {
    const key = `${r.source}::${JSON.stringify(r.has || [])}`;
    assert.equal(seen.has(key), false, `duplicate redirect rule: ${key}`);
    seen.add(key);
  }
});

test('routing policy and middleware enforce non-www canonical host without loops or multi-hop chains', () => {
  assert.equal(canonicalHostTarget('https://digital-x-marketing.com/'), null);
  assert.equal(canonicalHostTarget('https://digital-x-marketing.com/usluge/seo-aeo-geo/?utm_source=audit'), null);
  assert.equal(
    canonicalHostTarget('https://www.digital-x-marketing.com/usluge/seo-aeo-geo/?utm_source=audit'),
    'https://digital-x-marketing.com/usluge/seo-aeo-geo/?utm_source=audit',
  );
  assert.equal(
    canonicalHostTarget('https://digital-x-agency.vercel.app/usluge/seo-aeo-geo/?utm_source=audit'),
    'https://digital-x-marketing.com/usluge/seo-aeo-geo/?utm_source=audit',
  );
  assert.equal(
    trailingSlashTarget('https://digital-x-marketing.com/usluge/seo-aeo-geo?utm_source=audit'),
    'https://digital-x-marketing.com/usluge/seo-aeo-geo/?utm_source=audit',
  );
  assert.equal(
    legacyServiceTarget('https://www.digital-x-marketing.com/smart-website-launch?utm_source=audit'),
    'https://digital-x-marketing.com/shop/product/smart-website-launch/?utm_source=audit',
  );

  const mw = readFileSync('middleware.js', 'utf8');
  assert.ok(mw.indexOf('legacyServiceTarget(requestUrl)') < mw.indexOf('trailingSlashTarget(requestUrl)'), 'legacyServiceTarget runs before trailingSlashTarget');
});

test('public HTML, sitemap.xml, robots.txt and llms files use https://digital-x-marketing.com exclusively', () => {
  const robots = readFileSync('public/robots.txt', 'utf8');
  assert.match(robots, /^Sitemap:\s*https:\/\/digital-x-marketing\.com\/sitemap\.xml$/m);
  assert.doesNotMatch(robots, /www\.digital-x-marketing\.com/);

  for (const txt of ['public/llms.txt', 'public/llms-full.txt']) {
    const body = readFileSync(txt, 'utf8');
    assert.doesNotMatch(body, /www\.digital-x-marketing\.com/, txt);
    assert.match(body, /https:\/\/digital-x-marketing\.com\//, txt);
  }

  const sitemap = readFileSync('public/sitemap.xml', 'utf8');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.ok(locs.length >= 280);
  for (const loc of locs) {
    assert.ok(loc.startsWith('https://digital-x-marketing.com/'), `non-canonical sitemap loc: ${loc}`);
  }

  for (const file of walkHtml('public')) {
    const html = readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /www\.digital-x-marketing\.com/, `${file} still references www`);
    const $ = load(html, { scriptingEnabled: false });
    const canonical = $('link[rel="canonical"]').attr('href');
    if (canonical) assert.ok(canonical.startsWith('https://digital-x-marketing.com/'), `${file} canonical: ${canonical}`);
    const ogUrl = $('meta[property="og:url"]').attr('content');
    if (ogUrl) assert.ok(ogUrl.startsWith('https://digital-x-marketing.com/'), `${file} og:url: ${ogUrl}`);
    $('link[rel="alternate"][hreflang]').each((_, el) => {
      const href = $(el).attr('href') || '';
      assert.ok(href.startsWith('https://digital-x-marketing.com/'), `${file} hreflang: ${href}`);
    });
  }
});

test('core BS, EN and DE routes exist and are indexable', () => {
  for (const route of [
    'public/index.html',
    'public/en/index.html',
    'public/de/index.html',
    'public/usluge/seo-aeo-geo/index.html',
    'public/en/usluge/seo-aeo-geo/index.html',
    'public/de/usluge/seo-aeo-geo/index.html',
    'public/blog/aeo-vodic.html',
    'public/shop/product/seo-aeo/index.html',
  ]) {
    assert.ok(existsSync(route), `missing ${route}`);
    const html = readFileSync(route, 'utf8');
    assert.doesNotMatch(html, /<meta[^>]+name=["']robots["'][^>]+noindex/i, `${route} should be indexable`);
  }
});
