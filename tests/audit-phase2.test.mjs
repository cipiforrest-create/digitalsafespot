import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { landings } from '../concierge/znanje/landings.mjs';

const prices = { 'Landing stranica': 199, 'Premium web prisustvo': 449, 'Smart Website Launch': 499, 'E-commerce Launch': 2490 };

test('web design pillar and redesign pages exist with one price source', () => {
  for (const path of ['/usluge/web-dizajn/', '/usluge/redizajn-web-stranice/']) {
    const l = landings.find(x => x.path === path);
    assert.ok(l, path);
    assert.ok(l.faq.length >= 3, `${path} FAQ`);
    for (const [name, price] of l.service.offers) assert.equal(price, prices[name], `${path} ${name}`);
    const words = l.answer.split(/\s+/).length;
    assert.ok(words >= 35 && words <= 70, `${path} short answer is ${words} words`);
    const html = readFileSync(`.${path}index.html`, 'utf8');
    assert.match(html, /"@type":"FAQPage"/);
    assert.match(html, /"@type":"Service"/);
  }
});

test('one page per search term: pillar links to redesign and web shop links to pillar', () => {
  const pillar = readFileSync('usluge/web-dizajn/index.html', 'utf8');
  assert.match(pillar, /href="\/usluge\/redizajn-web-stranice\/"/);
  assert.match(readFileSync('usluge/izrada-web-shopa/index.html', 'utf8'), /href="\/usluge\/web-dizajn\/"/);
});

test('EN and DE never show the Bosnian KM/mj unit', () => {
  for (const lang of ['en', 'de']) {
    const values = Object.values(JSON.parse(readFileSync(`concierge/locales/${lang}.json`, 'utf8')));
    assert.equal(values.filter(v => /KM\/mj\b/i.test(v)).length, 0, lang);
  }
});
