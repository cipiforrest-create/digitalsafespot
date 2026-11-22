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

test('homepage and service schemas carry complete entity, geo, hours, founder Digital X and return policy without unverified superlatives', () => {
  const home = read('/index.html');
  assert.doesNotMatch(home, /Prva AEO agencija u BiH/);
  assert.doesNotMatch(home, /Vedad|Čičak|Cicak/i);
  const org = schemas(home).find(n => [n['@type']].flat().includes('Organization'));
  assert.equal(org.legalName, 'Digital X Marketing');
  assert.equal(org.founder?.name, 'Digital X');
  assert.equal(org.hasMerchantReturnPolicy?.['@type'], 'MerchantReturnPolicy');
  assert.equal(org.address.streetAddress, 'Stupska bb');
  assert.equal(org.address.postalCode, '71000');
  assert.ok(org.geo && org.openingHoursSpecification);
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
  assert.match(llmsFull, /Osnivač i tim: Digital X/);
  assert.doesNotMatch(llmsFull, /Vedad|Čičak|Cicak/i);

  const glossary = read('/pojmovnik/index.html');
  const termSet = schemas(glossary).find(n => n['@type'] === 'DefinedTermSet');
  assert.ok(termSet && termSet.hasDefinedTerm.length >= 12);
});

test('new city pages, industry pages and gap-closing guides are built, indexed and carry Digital X author without personal founder names', async () => {
  const sitemap = read('/sitemap.xml');
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
  const { legacyServiceTarget } = await import('../lib/routing-policy.mjs');
  const newPaths = [
    '/pojmovnik/',
    '/uredjivacka-politika/',
    '/tim/',
    '/usluge/seo-aeo-geo-cijena/',
    '/usluge/izrada-web-stranica/sarajevo/',
    '/industrije/privatne-klinike/',
    '/industrije/racunovodstvo-i-konsalting/',
    '/znanje/koliko-kosta-seo-optimizacija-bih/',
    '/znanje/agencija-ili-freelancer-web-stranica/',
    '/znanje/meta-capi-server-side-tracking/',
    '/znanje/ai-spremnost-web-stranica-bih-2026/',
  ];
  for (const p of newPaths) {
    assert.ok(existsSync(`public${p}index.html`), `missing ${p}`);
    assert.ok(sitemap.includes(`https://www.digital-x-marketing.com${p}<`), `sitemap missing ${p}`);
    assert.doesNotMatch(read(`${p}index.html`), /Vedad|Čičak|Cicak/i, `${p} should not contain personal founder name`);
    assert.match(read(`${p}index.html`), /max-snippet:-1/, `${p} max-snippet:-1`);
  }
  for (const city of ['banja-luka', 'mostar', 'tuzla', 'zenica']) {
    const cityPath = `/usluge/izrada-web-stranica/${city}/`;
    assert.ok(!existsSync(`public${cityPath}index.html`), `doorway page should not be published: ${cityPath}`);
    assert.ok(!sitemap.includes(`https://www.digital-x-marketing.com${cityPath}<`), `sitemap should exclude ${cityPath}`);
    assert.ok(vercel.redirects.some(r => r.source === cityPath && r.destination === '/usluge/izrada-web-stranica/' && r.permanent === true), `vercel redirect ${cityPath}`);
    assert.equal(legacyServiceTarget(`https://www.digital-x-marketing.com${cityPath}`), 'https://www.digital-x-marketing.com/usluge/izrada-web-stranica/');
  }
  for (const g of ['/znanje/koliko-kosta-seo-optimizacija-bih/', '/znanje/agencija-ili-freelancer-web-stranica/', '/znanje/meta-capi-server-side-tracking/', '/znanje/ai-spremnost-web-stranica-bih-2026/']) {
    const nodes = schemas(read(`${g}index.html`));
    assert.ok(nodes.some(n => n['@type'] === 'Organization' && n.founder?.name === 'Digital X'), `${g} founder Digital X`);
    assert.ok(nodes.some(n => n['@type'] === 'Article' && n.author?.['@id'] === 'https://www.digital-x-marketing.com/#organization'), `${g} Article author`);
    assert.ok(nodes.some(n => n['@type'] === 'Article' && n.publishingPrinciples === 'https://www.digital-x-marketing.com/uredjivacka-politika/'), `${g} publishingPrinciples`);
  }
});

test('2026 GEO/AEO upgrades: sameAs GitHub, ProfilePage, inline citations, EN/DE high-intent pages and zero deprecated schema', () => {
  const sitemap = read('/sitemap.xml');
  const homeOrg = schemas(read('/index.html')).find(n => [n['@type']].flat().includes('Organization'));
  assert.ok(homeOrg.sameAs.includes('https://github.com/cipiforrest-create'), 'Organization sameAs includes GitHub');
  assert.ok(homeOrg.sameAs.includes('https://www.youtube.com/@DigitalXMarketingSarajevo'), 'Organization sameAs includes YouTube');
  assert.ok(homeOrg.sameAs.some(u => u.startsWith('https://www.google.com/maps/place/Digital+X/')), 'Organization sameAs includes GBP');
  assert.ok(homeOrg.hasMap?.startsWith('https://www.google.com/maps/place/Digital+X/'), 'Organization hasMap includes GBP');
  assert.equal(homeOrg.publishingPrinciples, 'https://www.digital-x-marketing.com/uredjivacka-politika/');

  const teamNodes = schemas(read('/tim/index.html'));
  assert.ok(teamNodes.some(n => n['@type'] === 'ProfilePage'), '/tim/ ProfilePage schema');

  const benchmark = read('/znanje/ai-spremnost-web-stranica-bih-2026/index.html');
  assert.match(benchmark, /developers\.google\.com\/search\/docs\/appearance\/ai-features/);
  assert.match(benchmark, /arxiv\.org\/pdf\/2311\.09735/);

  const seoService = read('/usluge/seo-aeo-geo/index.html');
  assert.match(seoService, /Klasični SEO vs\. integrisani SEO, GEO i AEO/);
  assert.match(seoService, /max-snippet:-1/);

  for (const p of ['/usluge/seo-aeo-geo-cijena/', '/znanje/seo-aeo-geo-razlika/', '/znanje/ai-spremnost-web-stranica-bih-2026/', '/uredjivacka-politika/', '/tim/', '/cinjenice/', '/industrije/']) {
    for (const lang of ['en', 'de']) {
      const locPath = `/${lang}${p}`;
      assert.ok(existsSync(`public${locPath}index.html`), `missing ${locPath}`);
      assert.ok(sitemap.includes(`https://www.digital-x-marketing.com${locPath}<`), `sitemap missing ${locPath}`);
      const html = read(`${locPath}index.html`);
      assert.match(html, new RegExp(`<html lang="${lang}">`));
      assert.match(html, /hreflang="bs"/);
      assert.match(html, /hreflang="en"/);
      assert.match(html, /hreflang="de"/);
    }
  }
  assert.match(read('/en/usluge/seo-aeo-geo-cijena/index.html'), /KM \(≈ €\d/);
  assert.match(read('/de/usluge/seo-aeo-geo-cijena/index.html'), /KM \(≈ \d/);

  const deprecated = /"(?:BookActions|CourseInfo|ClaimReview|EstimatedSalary|LearningVideo|SpecialAnnouncement|VehicleListing)"/;
  assert.doesNotMatch(read('/usluge/seo-aeo-geo/index.html'), deprecated);
  assert.doesNotMatch(benchmark, deprecated);
});

test('shop product offers include shippingDetails and hasMerchantReturnPolicy across BS, EN and DE', () => {
  for (const prefix of ['', '/en', '/de']) {
    const nodes = schemas(read(`${prefix}/shop/product/seo-aeo/index.html`));
    const service = nodes.find(n => n['@type'] === 'Service' && n.offers);
    assert.ok(service, `${prefix} service offer`);
    assert.equal(service.offers.shippingDetails?.['@type'], 'OfferShippingDetails', `${prefix} shippingDetails`);
    assert.equal(service.offers.hasMerchantReturnPolicy?.['@type'], 'MerchantReturnPolicy', `${prefix} returnPolicy`);
  }
});

test('cookie pages are consistently noindex and excluded from sitemap across all locales', () => {
  const sitemap = read('/sitemap.xml');
  for (const p of ['/kolacici.html', '/en/kolacici.html', '/de/kolacici.html']) {
    assert.ok(!sitemap.includes(`https://www.digital-x-marketing.com${p}<`), `sitemap should exclude ${p}`);
  }
});
