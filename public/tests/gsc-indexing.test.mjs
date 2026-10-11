import test from "node:test";
import assert from "node:assert/strict";
import {
  NOINDEX_PATHS,
  enhanceGscIndexingHtml,
  filterGscSitemap,
  isGscIndexingPath,
} from "../lib/gsc-indexing.mjs";

const doc = (body, head = "") => `<!doctype html><html><head>${head}</head><body><main>${body}</main></body></html>`;

test("indexing policy targets only the audited noindex URLs", () => {
  assert.equal(NOINDEX_PATHS.size, 21);
  assert.ok(NOINDEX_PATHS.has("/shop/category/ai/"));
  assert.ok(NOINDEX_PATHS.has("/en/shop/category/web/"));
  assert.ok(NOINDEX_PATHS.has("/de/shop/category/ai/"));
  assert.ok(NOINDEX_PATHS.has("/uslovi.html"));
  assert.ok(NOINDEX_PATHS.has("/en/kolacici.html"));
  assert.equal(NOINDEX_PATHS.has("/shop/category/web/"), false);
  assert.equal(NOINDEX_PATHS.has("/en/shop/category/ai/"), false);
  assert.equal(NOINDEX_PATHS.has("/shop/product/seo-aeo/"), false);
});

test("GSC enhancer covers localized shop and audited policy pages", () => {
  assert.equal(isGscIndexingPath("/shop/product/seo-aeo/"), true);
  assert.equal(isGscIndexingPath("/en/shop/product/seo-aeo/"), true);
  assert.equal(isGscIndexingPath("/de/shop/category/ai/"), true);
  assert.equal(isGscIndexingPath("/en/kolacici.html"), true);
  assert.equal(isGscIndexingPath("/assets/app.js"), false);
});

test("audited noindex pages receive noindex,follow without losing canonical", () => {
  const html = enhanceGscIndexingHtml(
    doc("<h1>AI sistemi</h1>", '<link rel="canonical" href="https://www.digital-x-marketing.com/shop/category/ai/">'),
    "/shop/category/ai/",
  );
  assert.match(html, /<meta name="robots" content="noindex,follow">/);
  assert.match(html, /rel="canonical" href="https:\/\/www\.digital-x-marketing\.com\/shop\/category\/ai\/"/);
});

test("shop routes receive one complete self-consistent hreflang cluster", () => {
  const html = enhanceGscIndexingHtml(doc("<h1>SEO · GEO · AEO</h1>"), "/en/shop/product/seo-aeo/");
  assert.match(html, /hreflang="bs" href="https:\/\/www\.digital-x-marketing\.com\/shop\/product\/seo-aeo\/"/);
  assert.match(html, /hreflang="en" href="https:\/\/www\.digital-x-marketing\.com\/en\/shop\/product\/seo-aeo\/"/);
  assert.match(html, /hreflang="de" href="https:\/\/www\.digital-x-marketing\.com\/de\/shop\/product\/seo-aeo\/"/);
  assert.match(html, /hreflang="x-default" href="https:\/\/www\.digital-x-marketing\.com\/shop\/product\/seo-aeo\/"/);
  assert.equal((html.match(/hreflang="en"/g) || []).length, 1);
});

test("localized shop cleanup fixes known machine-translation artifacts conservatively", () => {
  const en = enhanceGscIndexingHtml(
    doc('<button>Corp <span>0</span></button><div>of 249 KM · monthly</div><button>_Add to Request</button>', '<title>SEO — from 249 kmM Digital X Shop</title><meta name="description" content="Home price of 249 KM.">'),
    "/en/shop/product/seo-aeo/",
  );
  assert.doesNotMatch(en, /kmM|>Corp\b|_Add to Request|Home price of|>of 249 KM/);
  assert.match(en, /Cart/);
  assert.match(en, /Starting price of 249 KM/);
  assert.match(en, /from 249 KM/);

  const de = enhanceGscIndexingHtml(
    doc('<button>Korps <span>0</span></button><button>_Auf Anfrage hinzufügen</button>', '<title>SEO — ab 249 kmM Digital X Shop</title><meta name="description" content="Home Preis von 249 KM.">'),
    "/de/shop/product/seo-aeo/",
  );
  assert.doesNotMatch(de, /kmM|>Korps\b|_Auf Anfrage hinzufügen|Home Preis von/);
  assert.match(de, /Warenkorb/);
  assert.match(de, /Startpreis 249 KM/);
});

test("sitemap filter removes exactly audited noindex URLs and keeps indexable routes", () => {
  const xml = `<?xml version="1.0"?><urlset>
    <url><loc>https://www.digital-x-marketing.com/shop/category/ai/</loc></url>
    <url><loc>https://www.digital-x-marketing.com/shop/category/web/</loc></url>
    <url><loc>https://www.digital-x-marketing.com/en/shop/category/web/</loc></url>
    <url><loc>https://www.digital-x-marketing.com/en/shop/category/ai/</loc></url>
    <url><loc>https://www.digital-x-marketing.com/shop/product/seo-aeo/</loc></url>
    <url><loc>https://www.digital-x-marketing.com/uslovi.html</loc></url>
  </urlset>`;
  const filtered = filterGscSitemap(xml);
  assert.doesNotMatch(filtered, /https:\/\/www\.digital-x-marketing\.com\/shop\/category\/ai\/<\/loc>/);
  assert.doesNotMatch(filtered, /\/en\/shop\/category\/web\/<\/loc>/);
  assert.doesNotMatch(filtered, /\/uslovi\.html<\/loc>/);
  assert.match(filtered, /\/shop\/category\/web\/<\/loc>/);
  assert.match(filtered, /\/en\/shop\/category\/ai\/<\/loc>/);
  assert.match(filtered, /\/shop\/product\/seo-aeo\/<\/loc>/);
});

test("category pages do not advertise alternates that are intentionally noindexed", () => {
  const html = enhanceGscIndexingHtml(
    doc("<h1>Web</h1>", '<link rel="alternate" hreflang="en" href="https://www.digital-x-marketing.com/en/shop/category/web/"><link rel="alternate" hreflang="de" href="https://www.digital-x-marketing.com/de/shop/category/web/">'),
    "/shop/category/web/",
  );
  assert.doesNotMatch(html, /hreflang=/);
});

test("sitemap filter removes hreflang references to audited noindex URLs", () => {
  const xml = `<?xml version="1.0"?><urlset xmlns:xhtml="http://www.w3.org/1999/xhtml">
    <url><loc>https://www.digital-x-marketing.com/shop/category/web/</loc>
      <xhtml:link rel="alternate" hreflang="bs" href="https://www.digital-x-marketing.com/shop/category/web/" />
      <xhtml:link rel="alternate" hreflang="en" href="https://www.digital-x-marketing.com/en/shop/category/web/" />
      <xhtml:link rel="alternate" hreflang="de" href="https://www.digital-x-marketing.com/de/shop/category/web/" />
    </url>
  </urlset>`;
  const filtered = filterGscSitemap(xml);
  assert.match(filtered, /<loc>https:\/\/www\.digital-x-marketing\.com\/shop\/category\/web\/<\/loc>/);
  assert.match(filtered, /href="https:\/\/www\.digital-x-marketing\.com\/shop\/category\/web\/"/);
  assert.doesNotMatch(filtered, /href="https:\/\/www\.digital-x-marketing\.com\/en\/shop\/category\/web\/"/);
  assert.doesNotMatch(filtered, /href="https:\/\/www\.digital-x-marketing\.com\/de\/shop\/category\/web\/"/);
});
