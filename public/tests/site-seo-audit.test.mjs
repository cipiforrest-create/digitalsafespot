import assert from "node:assert/strict";
import test from "node:test";
import {
  addResponsiveImageCandidates,
  enhanceSiteHtml,
  normalizeHeadingHierarchy,
  removeEmptyHeadings,
  shouldEnhanceSitePath,
} from "../lib/site-seo.mjs";

const doc = (body, head = "") => `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;

test("homepage exposes stable Organization, LocalBusiness and WebSite entities", () => {
  const html = enhanceSiteHtml(doc("<main><h1>Digital X</h1></main>"), "/");
  assert.match(html, /"@type":"Organization"/);
  assert.match(html, /"@type":"LocalBusiness"/);
  assert.match(html, /"@type":"WebSite"/);
  assert.match(html, /https:\/\/www\.digital-x-marketing\.com\/#organization/);
  assert.match(html, /https:\/\/www\.digital-x-marketing\.com\/#local-business/);
});

test("blog gets machine-readable Blog and ItemList schema and heading jumps are normalized", () => {
  const html = enhanceSiteHtml(doc("<main><h1>Blog</h1><h3>Web</h3><article><h3>Vodič</h3></article></main>"), "/blog/");
  assert.match(html, /<h2>Web<\/h2>/);
  assert.match(html, /"@type":"Blog"/);
  assert.match(html, /"@type":"ItemList"/);
});

test("GrowthOS receives visible direct-answer content that matches FAQPage schema", () => {
  const html = enhanceSiteHtml(doc("<main><h1>GrowthOS</h1></main>"), "/growthos.html");
  assert.match(html, /id="dx-answer-section"/);
  assert.match(html, /Šta je GrowthOS\?/);
  assert.match(html, /"@type":"FAQPage"/);
  assert.match(html, /Kome je GrowthOS namijenjen\?/);
});

test("Second Brain fixes broken image paths, exposes FAQ and responsive image metadata", () => {
  const html = enhanceSiteHtml(
    doc('<main><h1>Second Brain</h1><img src="/assets/images/second-brain-map.svg" alt="Mapa"><img src="/assets/jarvis/jarvis-hero-avatar.png" alt="Asistent"><img src="/assets/images/second-brain-galaxy.webp" width="1600" height="1000" alt="Galaksija"></main>'),
    "/second-brain-os.html",
  );
  assert.doesNotMatch(html, /second-brain-map\.svg/);
  assert.doesNotMatch(html, /jarvis-hero-avatar\.png/);
  assert.match(html, /growthos-second-brain\.webp/);
  assert.match(html, /jarvis-avatar\.webp/);
  assert.match(html, /srcset="\/assets\/images\/second-brain-galaxy\.webp 1600w"/);
  assert.match(html, /"@type":"FAQPage"/);
});

test("contact exposes visible trust context and consistent ContactPage/LocalBusiness entities", () => {
  const html = enhanceSiteHtml(doc("<main><h1>Kontakt</h1></main>"), "/kontakt.html");
  assert.match(html, /id="dx-trust-context"/);
  assert.match(html, /Sarajevo/);
  assert.match(html, /"@type":"ContactPage"/);
  assert.match(html, /#local-business/);
});

test("shop receives CollectionPage and ItemList entity layer", () => {
  const html = enhanceSiteHtml(doc('<main><h1>Shop</h1><article class="shop-card"><h3>Web</h3></article></main>'), "/shop/");
  assert.match(html, /"@type":"CollectionPage"/);
  assert.match(html, /"@type":"ItemList"/);
  assert.match(html, /"@type":"Organization"/);
});

test("primjeri and about pages receive answer-oriented visible content", () => {
  const examples = enhanceSiteHtml(doc("<main><h1>Primjeri</h1></main>"), "/primjeri-web-stranica/");
  const about = enhanceSiteHtml(doc("<main><h1>O nama</h1></main>"), "/o-nama.html");
  assert.match(examples, /id="dx-answer-section"/);
  assert.match(examples, /Kako odabrati pravi tip web stranice\?/);
  assert.match(examples, /"@type":"FAQPage"/);
  assert.match(about, /id="dx-answer-section"/);
  assert.match(about, /Šta je Digital X\?/);
  assert.match(about, /"@type":"AboutPage"/);
});

test("empty headings are removed and only skipped heading levels are reduced", () => {
  const cleaned = removeEmptyHeadings("<h1>Naslov</h1><h2> </h2><h3><span></span></h3><h2>Detalji</h2>");
  assert.equal(cleaned, "<h1>Naslov</h1><h2>Detalji</h2>");

  const normalized = normalizeHeadingHierarchy("<h1>A</h1><h3>B</h3><h4>C</h4><h2>D</h2>");
  assert.equal(normalized, "<h1>A</h1><h2>B</h2><h3>C</h3><h2>D</h2>");
});

test("raster images with intrinsic dimensions gain honest responsive candidate metadata", () => {
  const html = addResponsiveImageCandidates('<img src="/assets/images/test.webp" width="1600" height="1000" alt="Test">');
  assert.match(html, /srcset="\/assets\/images\/test\.webp 1600w"/);
  assert.match(html, /sizes="\(max-width: 1600px\) 100vw, 1600px"/);
});

test("route matcher covers all shop documents but never asset paths", () => {
  assert.equal(shouldEnhanceSitePath("/shop/product/seo-aeo/"), true);
  assert.equal(shouldEnhanceSitePath("/shop/category/web/"), true);
  assert.equal(shouldEnhanceSitePath("/assets/images/service-web.webp"), false);
});
