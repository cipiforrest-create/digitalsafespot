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

test('Blog and the knowledge hub are one page at /blog/', async () => {
  const blog = read('/blog/index.html');
  assert.match(blog, /data-galaxy/);
  assert.equal((blog.match(/class="post-card"/g) || []).length, 31);
  assert.ok(!existsSync('public/znanje/index.html'));
  const { legacyServiceTarget } = await import('../lib/routing-policy.mjs');
  for (const path of ['/znanje', '/znanje/', '/znanje/index.html'])
    assert.equal(legacyServiceTarget(`https://www.digital-x-marketing.com${path}`), 'https://www.digital-x-marketing.com/blog/');
  assert.equal(legacyServiceTarget('https://www.digital-x-marketing.com/znanje/sta-je-seo-optimizacija/'), null);
});

test('Blog and guide pages use the homepage header: same menu, language switch, no Znanje item', () => {
  for (const path of ['/blog/index.html', '/znanje/sta-je-seo-optimizacija/index.html', '/industrije/index.html']) {
    const html = read(path), header = html.match(/<header class="zn-header">[\s\S]*?<\/header>/)[0];
    assert.deepEqual([...header.matchAll(/class="nav-item" href="([^"]+)"/g)].map(m => m[1]),
      ['/usluge/', '/cjenovnik/', '/projekti/', '/primjeri-web-stranica/', '/shop/', '/blog/', '/usluge/x-signal/', '/kontakt.html'], path);
    assert.match(header, /class="zn-lang"[\s\S]*>BS<[\s\S]*>EN<[\s\S]*>DE</, path);
    assert.doesNotMatch(header, />Znanje</, path);
  }
});

test('client navigation loads the homepage as a full page', () => {
  assert.match(readFileSync('concierge/client/navigation.ts', 'utf8'), /id==='home'&&document\.body\.dataset\.page!=='home'\)\{if\(push\)location\.assign/);
});

test('work section shows the five real client case studies, none labelled as a concept', () => {
  for (const path of ['/index.html', '/projekti/index.html']) {
    const html = read(path), cards = [...html.matchAll(/<article class="image-card case-study">([\s\S]*?)<\/article>/g)].map(m => m[1]);
    assert.equal(cards.length, 5, path);
    for (const [name, href] of [['EYNNA Hair', 'https://eynna-hair.ba/'], ['Dizajner perika', '/projekti/eynna-hair-dizajner-perika/'], ['STAR', '/cinematic-perfume/'], ['DIP Studio', 'https://dipstudio.ba/'], ['Ajla Weddings', 'https://ajlaweddings.com/']])
      assert.ok(cards.some(c => c.includes(name) && c.includes(`href="${href}"`)), `${path} ${name}`);
    assert.ok(cards.every(c => !/koncept/i.test(c)), path);
  }
});

test('blog page opens with the galaxy and carries its H1 below it', () => {
  const blog = read('/blog/index.html'), main = blog.slice(blog.indexOf('<main'));
  assert.ok(main.indexOf('id="galaksija"') < main.indexOf('<h1'), 'galaxy before H1');
  assert.equal((main.match(/<h1/g) || []).length, 1);
});

test('the homepage-style header is fixed on every page', () => {
  assert.match(readFileSync('ai-concierge-preview/visual-experience.css', 'utf8'), /\.dx-navigation\.navigation\{position:fixed!important/);
  assert.match(readFileSync('znanje/assets/znanje.css', 'utf8'), /\.zn-header\{position:sticky;top:18px/);
});

test('no image repeats among the Blog cards', () => {
  const srcs = [...read('/blog/index.html').matchAll(/<a class="post-card" href="[^"]+"><img src="([^"]+)"/g)].map(m => m[1]);
  assert.equal(srcs.length, 31);
  assert.equal(new Set(srcs).size, srcs.length);
});
