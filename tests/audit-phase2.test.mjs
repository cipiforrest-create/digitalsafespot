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

test('company identity: legal name and street address in schema and legal pages', () => {
  for (const f of ['lib/site-seo.mjs', 'lib/service-seo.mjs', 'lib/cinematic-seo.mjs', 'concierge/znanje/build.mjs']) {
    const src = readFileSync(f, 'utf8');
    assert.match(src, /legalName['"]?\s*:\s*['"]Digital X Marketing['"]/, `${f} legalName`);
    assert.match(src, /Stupska bb/, `${f} streetAddress`);
  }
  for (const f of ['pravne-informacije.html', 'en/pravne-informacije.html', 'de/pravne-informacije.html']) {
    assert.match(readFileSync(f, 'utf8'), /Stupska bb/, `${f} address`);
  }
  assert.match(readFileSync('usluge/web-dizajn/index.html', 'utf8'), /"legalName":"Digital X Marketing"/);
});

test('facts page: verified company data, catalogue prices, AboutPage schema', () => {
  const f = landings.find(l => l.path === '/cinjenice/');
  assert.ok(f && f.about, 'facts entry');
  const words = f.answer.split(/\s+/).length;
  assert.ok(words >= 35 && words <= 70, `answer ${words} words`);
  const html = readFileSync('cinjenice/index.html', 'utf8');
  for (const s of ['Stupska bb', 'Digital X Marketing', 'marketing@digital-x-marketing.com', '+387 64 438 3566', '"@type":"AboutPage"', '"@type":"FAQPage"']) assert.ok(html.includes(s), s);
  assert.ok(!html.includes('"@type":"Service"'), 'no Service schema on facts page');
  for (const p of ['199 KM', '449 KM', '499 KM', '2.490 KM', '249 KM', '490 KM', '349 KM', '99 KM', '49 KM', '899 KM']) assert.ok(html.includes(`<td>${p}</td>`), p);
});

test('phase 3 step 2: speed, AI chatbot and compliance pages', () => {
  const byPath = p => landings.find(l => l.path === p);
  const speed = byPath('/usluge/optimizacija-brzine-sajta/');
  const bot = byPath('/usluge/ai-chatbot-za-web-stranicu/');
  const guide = byPath('/znanje/gdpr-pristupacnost-web-stranice/');
  assert.deepEqual(speed.service.offers.map(o => o.slice(0, 2)), [['Speed optimizacija', 99]]);
  assert.deepEqual(bot.service.offers.map(o => o.slice(0, 2)), [['AI prodajni asistent', 490]]);
  assert.ok(guide.article && !guide.service, 'guide is an article without offers');
  for (const l of [speed, bot, guide]) {
    const n = l.answer.split(/\s+/).length;
    assert.ok(n >= 35 && n <= 70, `${l.path} answer ${n} words`);
    const html = readFileSync(`.${l.path}index.html`, 'utf8');
    assert.ok(html.includes('"@type":"FAQPage"'), `${l.path} FAQPage`);
    assert.ok(html.includes(l.article ? '"@type":"Article"' : '"@type":"Service"'), `${l.path} main schema`);
  }
  assert.match(readFileSync('znanje/gdpr-pristupacnost-web-stranice/index.html', 'utf8'), /nije pravni savjet|a ne pravni savjet/);
  assert.match(readFileSync('usluge/web-dizajn/index.html', 'utf8'), /gdpr-pristupacnost-web-stranice/);
  assert.match(readFileSync('usluge/redizajn-web-stranice/index.html', 'utf8'), /optimizacija-brzine-sajta/);
});
