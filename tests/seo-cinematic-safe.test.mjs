import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { SERVICE_ROUTES, enhanceServiceHtml } from '../lib/service-seo.mjs';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = (path) => readFileSync(resolve(SITE, path), 'utf8');

test('cinematic homepage remains a separate, intact entry point', () => {
  const home = file('index.html');
  assert.match(home, /film__headline/);
  assert.match(home, /cinematic/i);
  assert.match(file('ai-concierge-preview/index.html'), /cinema/i);
});

test('commercial service pages have explicit local intent and verifiable starting prices', () => {
  const cases = [
    ['/usluge/izrada-web-stranica/', 449],
    ['/usluge/seo-aeo-geo/', 249],
    ['/usluge/ai-automatizacija/', 349],
  ];
  for (const [route, price] of cases) {
    const config = SERVICE_ROUTES.get(route);
    assert.ok(config, route);
    assert.match(config.title, /Sarajevo/i);
    assert.match(config.h1Html, /Sarajevu|Google i AI pretragu/);
    const html = enhanceServiceHtml('<html><head><title>Original</title></head><body><main><h1>Old</h1></main></body></html>', route);
    assert.match(html, new RegExp('"priceCurrency":"BAM"'));
    assert.match(html, new RegExp('"price":' + price + '(?!\\d)'));
    assert.match(html, new RegExp('rel="canonical" href="https://www\\.digital-x-marketing\\.com' + route.replaceAll('/', '\\/') + '"'));
  }
});

test('guides contain answer-oriented tables and visible FAQs, with old canonical URLs preserved', () => {
  for (const slug of ['aeo-vodic', 'koliko-kosta-web-stranica-bih']) {
    const html = file('blog/' + slug + '.html');
    assert.match(html, /<table class="dx-guide-table">/);
    assert.match(html, /<h3>/);
    assert.match(html, /Česta pitanja/);
    assert.ok(html.includes('href="https://www.digital-x-marketing.com/blog/' + slug + '.html"'));
    assert.ok(html.includes('href="/kontakt.html"'));
  }
});

test('AI-oriented catalogue points to canonical service pages without false AI ranking promises', () => {
  const txt = file('llms.txt');
  assert.match(txt, /\/usluge\/seo-aeo-geo\//);
  assert.match(txt, /\/usluge\/izrada-web-stranica\//);
  assert.match(txt, /nije garantovana/);
});
