import test from 'node:test';
import assert from 'node:assert/strict';
import {
  enhanceSecondLayerHtml,
  shouldEnhanceSecondLayerPath,
} from '../lib/second-layer.mjs';

const doc = (body, head = '') => `<!doctype html><html><head><title>Old</title><meta name="description" content="Old desc">${head}</head><body><main>${body}</main></body></html>`;

test('second layer targets audited product and quality routes only', () => {
  assert.equal(shouldEnhanceSecondLayerPath('/shop/product/seo-aeo/'), true);
  assert.equal(shouldEnhanceSecondLayerPath('/en/shop/product/web-presence/'), true);
  assert.equal(shouldEnhanceSecondLayerPath('/de/landing-seo.html'), true);
  assert.equal(shouldEnhanceSecondLayerPath('/en/blog/lokalni-seo-google-mapa.html'), true);
  assert.equal(shouldEnhanceSecondLayerPath('/en/growthos.html'), true);
  assert.equal(shouldEnhanceSecondLayerPath('/de/cinematic-digitalx/'), true);
  assert.equal(shouldEnhanceSecondLayerPath('/assets/app.js'), false);
});

test('product pages get one locale-aware product-specific depth section', () => {
  const seo = enhanceSecondLayerHtml(doc('<h1>SEO · GEO · AEO</h1>'), '/en/shop/product/seo-aeo/');
  const speed = enhanceSecondLayerHtml(doc('<h1>Speed Optimization</h1>'), '/en/shop/product/speed-optimization/');
  assert.equal((seo.match(/id="dx-product-depth"/g) || []).length, 1);
  assert.match(seo, /What this service actually delivers/);
  assert.match(seo, /technical SEO, local visibility and AI-answer readiness/i);
  assert.match(seo, /\/en\/blog\/aeo-vodic\.html/);
  assert.match(speed, /loading speed, layout stability and technical cleanup/i);
  assert.notEqual(seo, speed);
});

test('re-running product enhancement is idempotent', () => {
  const once = enhanceSecondLayerHtml(doc('<h1>AI Sales Assistant</h1>'), '/en/shop/product/ai-concierge/');
  const twice = enhanceSecondLayerHtml(once, '/en/shop/product/ai-concierge/');
  assert.equal((twice.match(/id="dx-product-depth"/g) || []).length, 1);
  assert.equal((twice.match(/id="dx-second-layer-style"/g) || []).length, 1);
});

test('English shop copy removes literal machine-translation artifacts', () => {
  const html = enhanceSecondLayerHtml(doc(`
    <h1>Services as clear<br/><i>Digital products.</i></h1>
    <p>Select a web, AI, automation, growth or content as a clear digital product. For more complex requirements, please ask for a measure of evaluation.</p>
    <strong>Of 449 KM</strong><button>Corp <span>0</span></button>
    <p>The final price shall be confirmed after the volume agreement.</p>
  `), '/en/shop/');
  assert.doesNotMatch(html, /Services as clear|measure of evaluation|>Of 449 KM|>Corp\b|volume agreement/);
  assert.match(html, /Digital services with/);
  assert.match(html, /tailored estimate/);
  assert.match(html, />From 449 KM/);
  assert.match(html, />Cart\b/);
  assert.match(html, /scope is agreed/);
});

test('German SEO landing replaces malformed service schema and broken visible copy', () => {
  const brokenSchema = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Service","description":"width=device-width, initial-scale=1.0\\\" name=\\\"viewport\\\"/>"}</script>';
  const html = enhanceSecondLayerHtml(doc(`
    <h1>Kunden suchen Sie auf <span>Drei Plätze.</span> Wie lange finden sie dich?</h1>
    <p>Google Search Google Maps. Und zunehmend - ChatGPT, Komplexität und Zwillinge.</p>
    <li><b>- Ich weiß nicht.</b> Google Business Profile</li>
    <li><b>- Ich bin nicht mehr da.</b> Scarpee Scheme, lmms.txt</li>
    <button>Senden — Analyse bei 24 Stunden</button>
  `, brokenSchema), '/de/landing-seo.html');
  assert.doesNotMatch(html, /width=device-width|Drei Plätze|Komplexität und Zwillinge|- Ich weiß nicht\.|- Ich bin nicht mehr da\.|Analyse bei 24 Stunden|Scarpee Scheme|lmms\.txt/);
  assert.match(html, /SEO, GEO &amp; AEO Agentur/);
  assert.match(html, /Google Search\. Google Maps\. Und zunehmend ChatGPT, Perplexity und Gemini/);
  assert.match(html, /<b>GEO:<\/b>/);
  assert.match(html, /<b>AEO:<\/b>/);
  assert.match(html, /Schema Markup, llms\.txt/);
  assert.match(html, /"serviceType":"SEO, GEO und AEO"/);
});

test('English local SEO article gets natural, defensible copy', () => {
  const html = enhanceSecondLayerHtml(doc(`
    <p>When someone in your town type in a "tooth near" or "car service + city", Google above all results shows <b>three business on a map</b>These three get a huge majority of calls, all the others are crumbs. Local SEO (GEO) is the discipline of entry at these three.</p>
    <li><b>Google Business Profile:</b> Full-full — exact primary category</li>
    <p>The person who's looking for "near" is ready to buy <i>today</i> — it is the most valuable visitor possible, and click from the map is free.</p>
    <p>By yourself: download your profile on business.google.com, fill in everything</p>
    <blockquote>A bonus that competition does not know: AI browsers (ChatGPT, Gemini) use Google Business information for local recommendations.</blockquote>
  `), '/en/blog/lokalni-seo-google-mapa.html');
  assert.doesNotMatch(html, /tooth near|three business on a map|all the others are crumbs|Full-full|ready to buy|download your profile|AI browsers .* use Google Business information/);
  assert.match(html, /dentist near me/);
  assert.match(html, /map pack/);
  assert.match(html, /claim or verify your Google Business Profile/);
  assert.match(html, /may draw on public business information/);
});

test('GrowthOS and cinematic pages receive focused titles and descriptions', () => {
  const growth = enhanceSecondLayerHtml(doc('<h1>GrowthOS</h1>'), '/de/growthos.html');
  assert.match(growth, /<title>GrowthOS Business-App nach Maß \| CRM, Automatisierung &amp; KI \| Digital X<\/title>/);
  assert.match(growth, /maßgeschneiderten Business-App/);

  const cinematic = enhanceSecondLayerHtml(doc('<h1>Cinematic</h1>'), '/en/cinematic-digitalx/');
  assert.match(cinematic, /<title>Digital X Cinematic Websites \| 3D Scroll &amp; Premium Web Experiences<\/title>/);
  assert.match(cinematic, /scroll-driven storytelling/);
});
