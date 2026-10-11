import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, it } from "node:test";
import assert from "node:assert/strict";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(resolve(site, relative), "utf8");

describe("GrowthOS website integration", () => {
  it("preserves the existing cinematic runtime and adds a homepage showcase", () => {
    const home = read("index.html");
    const cinema = readFileSync(resolve(site, "js/cinema.js"));

    assert.equal(
      createHash("sha256").update(cinema).digest("hex").toUpperCase(),
      "BE1D0BAF193142465E6D7AB5824FFD334EC0DC2A6574B40B4794DBAA2AD9A69A",
    );
    assert.match(home, /id="growthos-showcase"/);
    assert.match(home, /href="\/growthos\.html"/);
    assert.match(home, /growthos-dashboard\.webp/);
    assert.match(home, /Ne obećavamo sistem\./);
    assert.match(home, /Pokazujemo ga\./);
    assert.match(home, /src="js\/cinema\.js"/);
  });

  it("ships a semantic SEO landing page with truthful structured data", () => {
    const landing = read("growthos.html");

    assert.match(landing, /<title>GrowthOS[^<]+Digital X<\/title>/);
    assert.match(landing, /rel="canonical" href="https:\/\/www\.digital-x-marketing\.com\/growthos\.html"/);
    assert.match(landing, /property="og:title"/);
    assert.match(landing, /name="twitter:card" content="summary_large_image"/);
    assert.match(landing, /"@type":\s*"SoftwareApplication"/);
    assert.match(landing, /"@type":\s*"Service"/);
    assert.match(landing, /<main[^>]*id="content"/);
    assert.equal((landing.match(/<h1\b/g) || []).length, 1);
    // The SEO landing page must not embed the demo in an iframe; the standard
    // GTM <noscript> iframe is allowed and excluded from this check.
    const contentHtml = landing.replace(/<noscript>[\s\S]*?<\/noscript>/gi, "");
    assert.doesNotMatch(contentHtml, /<iframe\b/i);
  });

  it("explains the configurable modules and exposes environment-aware demo CTAs", () => {
    const landing = read("growthos.html");
    for (const term of [
      "Dashboard",
      "CRM",
      "Projekti",
      "Sadržaj",
      "Automatizacije",
      "Izvještaji",
      "Klijentski portal",
      "Second Brain",
      "GrowthOS Assistant",
      "Uloge i dozvole",
      "Integracije po mjeri",
    ]) {
      assert.ok(landing.includes(term), `missing capability copy: ${term}`);
    }
    assert.match(landing, /data-growthos-demo/);
    assert.match(read("js/growthos.js"), /127\.0\.0\.1:43173/);
    assert.match(read("js/growthos.js"), /digital-x-growthos\.vercel\.app/);
    assert.doesNotMatch(read("js/growthos.js"), /location\.protocol\s*===\s*["']file:/);
  });

  it("includes real responsive preview assets and valid local references", () => {
    const assets = [
      "growthos-dashboard.webp",
      "growthos-crm.webp",
      "growthos-second-brain.webp",
      "growthos-mobile.webp",
    ];
    for (const asset of assets) {
      const path = resolve(site, "assets/images", asset);
      assert.equal(existsSync(path), true, `missing ${asset}`);
      assert.ok(statSync(path).size > 10_000, `${asset} is unexpectedly small`);
    }

    const landing = read("growthos.html");
    assert.match(landing, /<picture[^>]*>[\s\S]*growthos-mobile\.webp[\s\S]*growthos-dashboard\.webp[\s\S]*<\/picture>/);
    assert.match(landing, /loading="lazy"/);
    for (const [, reference] of landing.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (/^(?:https?:|#|mailto:|tel:)/.test(reference)) continue;
      const pathOnly = reference.split("#")[0].split("?")[0];
      if (!pathOnly) continue;
      const target = pathOnly.startsWith("/") ? resolve(site, `.${pathOnly}`) : resolve(site, pathOnly);
      assert.equal(existsSync(target), true, `broken local reference: ${reference}`);
    }
  });

  it("adds GrowthOS to discovery files", () => {
    assert.match(read("sitemap.xml"), /https:\/\/www\.digital-x-marketing\.com\/growthos\.html/);
    assert.match(read("llms.txt"), /GrowthOS/);
  });

  it("keeps the 3D visual treatment responsive on mobile", () => {
    const sharedCss = read("css/style.css");
    const landingCss = read("css/growthos.css");
    assert.match(sharedCss, /\.cine-sec\{min-height:190vh\}/);
    assert.match(sharedCss, /rotateY\(-1\.4deg\)/);
    assert.match(landingCss, /rotateY\(-1\.4deg\)/);
    assert.match(sharedCss, /\.pin-inner \.display\{font-size:clamp\(2rem,10\.5vw,3rem\)/);
    assert.match(sharedCss, /\.growthos-home-grid>\*\{min-width:0\}/);
    assert.match(sharedCss, /\.growthos-home-preview img\{[^}]*height:auto/);
    assert.match(read("js/cinema.js"), /isMobile \? 72 : 84/);
  });
});
