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
    assert.ok(sitemap.includes(`https://digital-x-marketing.com${p}<`), `sitemap missing ${p}`);
    assert.doesNotMatch(read(`${p}index.html`), /Vedad|Čičak|Cicak/i, `${p} should not contain personal founder name`);
    assert.match(read(`${p}index.html`), /max-snippet:-1/, `${p} max-snippet:-1`);
  }
  for (const city of ['banja-luka', 'mostar', 'tuzla', 'zenica']) {
    const cityPath = `/usluge/izrada-web-stranica/${city}/`;
    assert.ok(!existsSync(`public${cityPath}index.html`), `doorway page should not be published: ${cityPath}`);
    assert.ok(!sitemap.includes(`https://digital-x-marketing.com${cityPath}<`), `sitemap should exclude ${cityPath}`);
    assert.ok(vercel.redirects.some(r => r.source === cityPath && r.destination === '/usluge/izrada-web-stranica/' && r.permanent === true), `vercel redirect ${cityPath}`);
    assert.equal(legacyServiceTarget(`https://digital-x-marketing.com${cityPath}`), 'https://digital-x-marketing.com/usluge/izrada-web-stranica/');
  }
  for (const g of ['/znanje/koliko-kosta-seo-optimizacija-bih/', '/znanje/agencija-ili-freelancer-web-stranica/', '/znanje/meta-capi-server-side-tracking/', '/znanje/ai-spremnost-web-stranica-bih-2026/']) {
    const nodes = schemas(read(`${g}index.html`));
    assert.ok(nodes.some(n => n['@type'] === 'Organization' && n.founder?.name === 'Digital X'), `${g} founder Digital X`);
    assert.ok(nodes.some(n => n['@type'] === 'Article' && n.author?.['@id'] === 'https://digital-x-marketing.com/#organization'), `${g} Article author`);
    assert.ok(nodes.some(n => n['@type'] === 'Article' && n.publishingPrinciples === 'https://digital-x-marketing.com/uredjivacka-politika/'), `${g} publishingPrinciples`);
  }
});

test('2026 GEO/AEO upgrades: sameAs GitHub, ProfilePage, inline citations, EN/DE high-intent pages and zero deprecated schema', () => {
  const sitemap = read('/sitemap.xml');
  const homeOrg = schemas(read('/index.html')).find(n => [n['@type']].flat().includes('Organization'));
  assert.ok(homeOrg.sameAs.includes('https://github.com/cipiforrest-create'), 'Organization sameAs includes GitHub');
  assert.ok(homeOrg.sameAs.includes('https://www.threads.com/@digitalxmarketing.ba'), 'Organization sameAs includes Threads');
  assert.ok(homeOrg.sameAs.includes('https://www.youtube.com/@DigitalXMarketingSarajevo'), 'Organization sameAs includes YouTube');
  assert.ok(homeOrg.sameAs.some(u => u.startsWith('https://www.google.com/maps/place/Digital+X/')), 'Organization sameAs includes GBP');
  assert.ok(homeOrg.hasMap?.startsWith('https://www.google.com/maps/place/Digital+X/'), 'Organization hasMap includes GBP');
  assert.equal(homeOrg.publishingPrinciples, 'https://digital-x-marketing.com/uredjivacka-politika/');

  const teamNodes = schemas(read('/tim/index.html'));
  assert.ok(teamNodes.some(n => n['@type'] === 'ProfilePage'), '/tim/ ProfilePage schema');

  const benchmark = read('/znanje/ai-spremnost-web-stranica-bih-2026/index.html');
  assert.match(benchmark, /developers\.google\.com\/search\/docs\/appearance\/ai-features/);
  assert.match(benchmark, /arxiv\.org\/pdf\/2311\.09735/);
  assert.match(benchmark, /78 javnih BiH poslovnih sajtova/);
  assert.match(benchmark, /30,8%/);
  for (const f of ['/growthos.html', '/en/growthos.html', '/de/growthos.html', '/second-brain-os.html', '/en/second-brain-os.html', '/de/second-brain-os.html', '/en/landing-web.html', '/de/landing-web.html']) {
    assert.match(read(f), /max-snippet:-1/, `${f} max-snippet:-1`);
  }

  const seoService = read('/usluge/seo-aeo-geo/index.html');
  assert.match(seoService, /Klasični SEO vs\. integrisani SEO, GEO i AEO/);
  assert.match(seoService, /max-snippet:-1/);

  for (const p of ['/usluge/seo-aeo-geo-cijena/', '/znanje/seo-aeo-geo-razlika/', '/znanje/ai-spremnost-web-stranica-bih-2026/', '/uredjivacka-politika/', '/tim/', '/cinjenice/', '/industrije/']) {
    for (const lang of ['en', 'de']) {
      const locPath = `/${lang}${p}`;
      assert.ok(existsSync(`public${locPath}index.html`), `missing ${locPath}`);
      assert.ok(sitemap.includes(`https://digital-x-marketing.com${locPath}<`), `sitemap missing ${locPath}`);
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
    assert.ok(!sitemap.includes(`https://digital-x-marketing.com${p}<`), `sitemap should exclude ${p}`);
  }
});

test('Cluster 1 AI Search guides publish in BS, EN and DE with featured + in-content WebP images, preload and full schema', () => {
  const sitemap = read('/sitemap.xml');
  const cluster1 = [
    ['/znanje/google-ai-overviews-kako-radi/', 'cluster1-ai-overviews-cover.webp', 'cluster1-query-fanout-diagram.webp'],
    ['/znanje/schema-markup-za-ai-pretragu/', 'cluster1-schema-2026-cover.webp', 'cluster1-schema-graph-diagram.webp'],
    ['/znanje/llms-txt-sta-je-i-treba-li-vam/', 'cluster1-llms-txt-cover.webp', 'cluster1-ai-crawlers-diagram.webp'],
    ['/znanje/kako-mjeriti-ai-vidljivost/', 'cluster1-ai-tracking-cover.webp', 'cluster1-ai-measurement-diagram.webp'],
  ];
  for (const [route, cover, diagram] of cluster1) {
    for (const prefix of ['', '/en', '/de']) {
      const full = `${prefix}${route}`;
      assert.ok(existsSync(`public${full}index.html`), `missing ${full}`);
      assert.ok(sitemap.includes(`https://digital-x-marketing.com${full}<`), `sitemap missing ${full}`);
      const html = read(`${full}index.html`);
      assert.match(html, /max-snippet:-1/, `${full} max-snippet:-1`);
      assert.match(html, new RegExp(`<link rel="preload" as="image" href="/media/znanje/${cover}"`), `${full} preload`);
      assert.match(html, new RegExp(`class="guide-cover"[\\s\\S]*?/media/znanje/${cover}`), `${full} cover`);
      assert.match(html, new RegExp(`class="guide-figure"[\\s\\S]*?/media/znanje/${diagram}`), `${full} diagram`);
      assert.match(html, /hreflang="bs"/, `${full} hreflang bs`);
      assert.match(html, /hreflang="en"/, `${full} hreflang en`);
      assert.match(html, /hreflang="de"/, `${full} hreflang de`);
      const nodes = schemas(html);
      const article = nodes.find(n => n['@type'] === 'Article');
      assert.ok(article && Array.isArray(article.image) && article.image.length === 2, `${full} Article ImageObject array`);
      assert.ok(nodes.some(n => n['@type'] === 'FAQPage' && n.mainEntity.length >= 2), `${full} FAQPage`);
    }
  }
});

test('Cluster 2 Local & Technical SEO guides publish in BS, EN and DE with featured + in-content WebP images, preload and full schema', () => {
  const sitemap = read('/sitemap.xml');
  const cluster2 = [
    ['/znanje/google-business-profile-verifikacija-bih/', 'cluster2-gbp-verification-cover.webp', 'cluster2-gbp-verification-diagram.webp'],
    ['/znanje/lokalni-seo-vise-gradova-bih/', 'cluster2-multi-city-seo-cover.webp', 'cluster2-multi-city-diagram.webp'],
    ['/znanje/google-recenzije-i-ai-preporuke/', 'cluster2-reviews-ai-cover.webp', 'cluster2-reviews-signals-diagram.webp'],
    ['/znanje/tehnicki-seo-audit-checklist/', 'cluster2-tech-audit-cover.webp', 'cluster2-tech-audit-diagram.webp'],
  ];
  for (const [route, cover, diagram] of cluster2) {
    for (const prefix of ['', '/en', '/de']) {
      const full = `${prefix}${route}`;
      assert.ok(existsSync(`public${full}index.html`), `missing ${full}`);
      assert.ok(sitemap.includes(`https://digital-x-marketing.com${full}<`), `sitemap missing ${full}`);
      const html = read(`${full}index.html`);
      assert.match(html, /max-snippet:-1/, `${full} max-snippet:-1`);
      assert.match(html, new RegExp(`<link rel="preload" as="image" href="/media/znanje/${cover}"`), `${full} preload`);
      assert.match(html, new RegExp(`class="guide-cover"[\\s\\S]*?/media/znanje/${cover}`), `${full} cover`);
      assert.match(html, new RegExp(`class="guide-figure"[\\s\\S]*?/media/znanje/${diagram}`), `${full} diagram`);
      assert.match(html, /hreflang="bs"/, `${full} hreflang bs`);
      assert.match(html, /hreflang="en"/, `${full} hreflang en`);
      assert.match(html, /hreflang="de"/, `${full} hreflang de`);
      const nodes = schemas(html);
      const article = nodes.find(n => n['@type'] === 'Article');
      assert.ok(article && Array.isArray(article.image) && article.image.length === 2, `${full} Article ImageObject array`);
      assert.ok(nodes.some(n => n['@type'] === 'FAQPage' && n.mainEntity.length >= 2), `${full} FAQPage`);
    }
  }
});

test('Cluster 3 Web Performance, Redesign, E-commerce & CRO guides publish in BS, EN and DE with featured + in-content WebP images, preload and full schema', () => {
  const sitemap = read('/sitemap.xml');
  const cluster3 = [
    ['/znanje/core-web-vitals-optimizacija-brzine/', 'cluster3-cwv-speed-cover.webp', 'cluster3-cwv-thresholds-diagram.webp'],
    ['/znanje/redizajn-web-stranice-bez-gubitka-seo/', 'cluster3-redesign-seo-cover.webp', 'cluster3-redesign-migration-diagram.webp'],
    ['/znanje/web-shop-placanje-dostava-bih/', 'cluster3-ecommerce-bih-cover.webp', 'cluster3-checkout-flow-diagram.webp'],
    ['/znanje/konverzija-web-stranice-cro-vodic/', 'cluster3-cro-conversion-cover.webp', 'cluster3-cro-funnel-diagram.webp'],
  ];
  for (const [route, cover, diagram] of cluster3) {
    for (const prefix of ['', '/en', '/de']) {
      const full = `${prefix}${route}`;
      assert.ok(existsSync(`public${full}index.html`), `missing ${full}`);
      assert.ok(sitemap.includes(`https://digital-x-marketing.com${full}<`), `sitemap missing ${full}`);
      const html = read(`${full}index.html`);
      assert.match(html, /max-snippet:-1/, `${full} max-snippet:-1`);
      assert.match(html, new RegExp(`<link rel="preload" as="image" href="/media/znanje/${cover}"`), `${full} preload`);
      assert.match(html, new RegExp(`class="guide-cover"[\\s\\S]*?/media/znanje/${cover}`), `${full} cover`);
      assert.match(html, new RegExp(`class="guide-figure"[\\s\\S]*?/media/znanje/${diagram}`), `${full} diagram`);
      assert.match(html, /hreflang="bs"/, `${full} hreflang bs`);
      assert.match(html, /hreflang="en"/, `${full} hreflang en`);
      assert.match(html, /hreflang="de"/, `${full} hreflang de`);
      const nodes = schemas(html);
      const article = nodes.find(n => n['@type'] === 'Article');
      assert.ok(article && Array.isArray(article.image) && article.image.length === 2, `${full} Article ImageObject array`);
      assert.ok(nodes.some(n => n['@type'] === 'FAQPage' && n.mainEntity.length >= 2), `${full} FAQPage`);
    }
  }
});

test('Cluster 4 Paid Ads & Content Production guides publish in BS, EN and DE with featured + in-content WebP images, preload and full schema', () => {
  const sitemap = read('/sitemap.xml');
  const cluster4 = [
    ['/znanje/google-ads-search-vs-performance-max-bih/', 'cluster4-google-ads-pmax-cover.webp', 'cluster4-search-vs-pmax-diagram.webp'],
    ['/znanje/meta-oglasi-kreativa-i-testiranje/', 'cluster4-meta-creative-cover.webp', 'cluster4-creative-testing-diagram.webp'],
    ['/znanje/kratki-video-reels-tiktok-produkcija/', 'cluster4-short-video-cover.webp', 'cluster4-content-day-diagram.webp'],
    ['/znanje/fotografija-proizvoda-i-katalog-prodaja/', 'cluster4-product-photo-cover.webp', 'cluster4-visual-standards-diagram.webp'],
  ];
  for (const [route, cover, diagram] of cluster4) {
    for (const prefix of ['', '/en', '/de']) {
      const full = `${prefix}${route}`;
      assert.ok(existsSync(`public${full}index.html`), `missing ${full}`);
      assert.ok(sitemap.includes(`https://digital-x-marketing.com${full}<`), `sitemap missing ${full}`);
      const html = read(`${full}index.html`);
      assert.match(html, /max-snippet:-1/, `${full} max-snippet:-1`);
      assert.match(html, new RegExp(`<link rel="preload" as="image" href="/media/znanje/${cover}"`), `${full} preload`);
      assert.match(html, new RegExp(`class="guide-cover"[\\s\\S]*?/media/znanje/${cover}`), `${full} cover`);
      assert.match(html, new RegExp(`class="guide-figure"[\\s\\S]*?/media/znanje/${diagram}`), `${full} diagram`);
      assert.match(html, /hreflang="bs"/, `${full} hreflang bs`);
      assert.match(html, /hreflang="en"/, `${full} hreflang en`);
      assert.match(html, /hreflang="de"/, `${full} hreflang de`);
      const nodes = schemas(html);
      const article = nodes.find(n => n['@type'] === 'Article');
      assert.ok(article && Array.isArray(article.image) && article.image.length === 2, `${full} Article ImageObject array`);
      assert.ok(nodes.some(n => n['@type'] === 'FAQPage' && n.mainEntity.length >= 2), `${full} FAQPage`);
    }
  }
});

test('Cluster 5 AI Automation, Second Brain & GA4 Consent Mode guides publish in BS, EN and DE with featured + in-content WebP images, preload and full schema', () => {
  const sitemap = read('/sitemap.xml');
  const cluster5 = [
    ['/znanje/ai-chatbot-rag-za-web-stranicu/', 'cluster5-ai-rag-chatbot-cover.webp', 'cluster5-rag-architecture-diagram.webp'],
    ['/znanje/ai-recepcionar-i-automatizacija-upita/', 'cluster5-ai-receptionist-cover.webp', 'cluster5-lead-automation-diagram.webp'],
    ['/znanje/ai-second-brain-baza-znanja-firme/', 'cluster5-second-brain-cover.webp', 'cluster5-second-brain-diagram.webp'],
    ['/znanje/ga4-consent-mode-v2-mjerenje-konverzija/', 'cluster5-ga4-consent-cover.webp', 'cluster5-ga4-consent-diagram.webp'],
  ];
  for (const [route, cover, diagram] of cluster5) {
    for (const prefix of ['', '/en', '/de']) {
      const full = `${prefix}${route}`;
      assert.ok(existsSync(`public${full}index.html`), `missing ${full}`);
      assert.ok(sitemap.includes(`https://digital-x-marketing.com${full}<`), `sitemap missing ${full}`);
      const html = read(`${full}index.html`);
      assert.match(html, /max-snippet:-1/, `${full} max-snippet:-1`);
      assert.match(html, new RegExp(`<link rel="preload" as="image" href="/media/znanje/${cover}"`), `${full} preload`);
      assert.match(html, new RegExp(`class="guide-cover"[\\s\\S]*?/media/znanje/${cover}`), `${full} cover`);
      assert.match(html, new RegExp(`class="guide-figure"[\\s\\S]*?/media/znanje/${diagram}`), `${full} diagram`);
      assert.match(html, /hreflang="bs"/, `${full} hreflang bs`);
      assert.match(html, /hreflang="en"/, `${full} hreflang en`);
      assert.match(html, /hreflang="de"/, `${full} hreflang de`);
      const nodes = schemas(html);
      const article = nodes.find(n => n['@type'] === 'Article');
      assert.ok(article && Array.isArray(article.image) && article.image.length === 2, `${full} Article ImageObject array`);
      assert.ok(nodes.some(n => n['@type'] === 'FAQPage' && n.mainEntity.length >= 2), `${full} FAQPage`);
    }
  }
});

