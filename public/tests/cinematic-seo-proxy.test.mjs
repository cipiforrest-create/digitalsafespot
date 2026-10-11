import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  CINEMATIC_PAGES,
  enhanceCinematicHtml,
} from "../lib/cinematic-seo.mjs";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("cinematic SEO/AEO proxy", () => {
  it("covers every cinematic route surfaced by the audit", () => {
    assert.deepEqual(
      Object.keys(CINEMATIC_PAGES).sort(),
      [
        "cinematic-clothes",
        "cinematic-deepsea",
        "cinematic-dentist",
        "cinematic-hotel",
        "cinematic-penthouse",
        "cinematic-vanta",
        "cinematic-watch",
      ],
    );
  });

  it("adds canonical, metadata, one H1, semantic main, entity schema and useful project context", () => {
    const source = `<!doctype html><html><head><title>HALCYON</title></head><body><div id="experience">Film</div></body></html>`;
    const html = enhanceCinematicHtml(source, "cinematic-hotel");

    assert.match(html, /rel="canonical" href="https:\/\/www\.digital-x-marketing\.com\/cinematic-hotel\/"/);
    assert.match(html, /name="description"/);
    assert.match(html, /property="og:title"/);
    assert.match(html, /property="og:description"/);
    assert.match(html, /property="og:url"/);
    assert.match(html, /name="twitter:card" content="summary_large_image"/);
    assert.match(html, /<main\b[^>]*id="dx-cinematic-main"/);
    assert.equal((html.match(/<h1\b/gi) || []).length, 1);
    assert.match(html, /id="dx-cinematic-seo-heading"/);
    assert.match(html, /id="dx-cinematic-heading-cleanup"/);
    assert.match(html, /document\.querySelectorAll\("h1"\)\.length>1/);
    assert.match(html, /id="dx-project-context"/);
    assert.match(html, /Šta prikazuje ovaj cinematic web koncept\?/);
    assert.match(html, /Digital X · Sarajevo/);
    assert.match(html, /href="\/kontakt\.html"/);
    assert.match(html, /href="\/privatnost\.html"/);
    assert.match(html, /href="\/uslovi\.html"/);
    assert.match(html, /href="\/primjeri-web-stranica\/"/);

    const schemaMatch = html.match(/<script id="dx-cinematic-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(schemaMatch, "JSON-LD schema should be present");
    const schema = JSON.parse(schemaMatch[1]);
    assert.equal(schema["@context"], "https://schema.org");
    const types = schema["@graph"].map((node) => node["@type"]);
    assert.ok(types.includes("Organization"));
    assert.ok(types.includes("WebSite"));
    assert.ok(types.includes("WebPage"));
    assert.equal(
      schema["@graph"].find((node) => node["@type"] === "WebPage").url,
      "https://www.digital-x-marketing.com/cinematic-hotel/",
    );
  });

  it("does not duplicate an upstream H1 or main landmark", () => {
    const source = `<!doctype html><html><head><meta name="description" content="old"><link rel="canonical" href="https://wrong.example/"></head><body><main><h1>Existing title</h1><p>Existing content</p></main></body></html>`;
    const html = enhanceCinematicHtml(source, "cinematic-clothes");

    assert.equal((html.match(/<h1\b/gi) || []).length, 1);
    assert.equal((html.match(/<main\b/gi) || []).length, 1);
    assert.doesNotMatch(html, /dx-cinematic-heading-cleanup/);
    assert.doesNotMatch(html, /https:\/\/wrong\.example\//);
    assert.doesNotMatch(html, /content="old"/);
  });

  it("keeps cinematic routes explicit while allowing only the intended shop subtree wildcard", () => {
    const middleware = readFileSync(resolve(site, "middleware.js"), "utf8");
    assert.doesNotMatch(middleware, /from ["']@vercel\/functions["']/);
    assert.match(middleware, /"x-middleware-next": "1"/);
    for (const slug of Object.keys(CINEMATIC_PAGES)) {
      assert.match(middleware, new RegExp(`/${slug.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}`));
    }
    assert.match(middleware, /\/shop\/:path\*/);
    assert.doesNotMatch(middleware, /["']\/:path\*["']/);
    assert.doesNotMatch(middleware, /\/assets\/:path\*/);
  });
});
