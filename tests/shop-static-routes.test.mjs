import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = require("../js/shop-catalog.js");
const read = (relative) => readFileSync(resolve(site, relative), "utf8");
const categoryRoutes = Object.keys(catalog.categories).map((id) => `shop/category/${id}/index.html`);
const productRoutes = catalog.products.map((product) => `shop/product/${product.id}/index.html`);
const generatedRoutes = ["shop/index.html", ...categoryRoutes, ...productRoutes];

const schemas = (html) => [...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)]
  .map((match) => JSON.parse(match[1]));

test("committed shop routes are synchronized with the shared catalog", () => {
  const result = spawnSync(process.execPath, ["scripts/generate-shop.mjs", "--check"], {
    cwd: site,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(catalog.products.length, 12);
  assert.equal(Object.keys(catalog.categories).length, 5);
});

test("every generated route has crawlable content, unique metadata, GTM, and breadcrumbs", () => {
  const canonicals = new Set();
  const titles = new Set();
  const descriptions = new Set();
  for (const relative of generatedRoutes) {
    const html = read(relative);
    assert.match(html, /<h1\b[^>]*>[\s\S]*?<\/h1>/, relative);
    assert.match(html, /class="breadcrumbs"/, relative);
    assert.match(html, /"@type":"BreadcrumbList"/, relative);
    assert.equal((html.match(/GTM-5JT2X695/g) || []).length, 2, relative);
    assert.match(html, /js\/main\.js"><\/script>/, relative);
    assert.match(html, /js\/shop\.js"><\/script>/, relative);
    assert.match(html, /<meta property="og:title"/, relative);
    assert.match(html, /<meta name="twitter:title"/, relative);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert.ok(canonical && !canonicals.has(canonical), `duplicate canonical ${canonical}`);
    assert.ok(title && !titles.has(title), `duplicate title ${title}`);
    assert.ok(description && !descriptions.has(description), `duplicate description ${description}`);
    canonicals.add(canonical);
    titles.add(title);
    descriptions.add(description);
  }
});

test("product schema agrees with visible starting prices and estimate-only services", () => {
  for (const product of catalog.products) {
    const relative = `shop/product/${product.id}/index.html`;
    const html = read(relative);
    const structured = schemas(html);
    const entity = structured.find((value) => ["Product", "Service"].includes(value["@type"]));
    assert.ok(entity, relative);
    assert.equal(entity.name, product.name, relative);
    assert.ok(html.includes(product.summary), relative);
    for (const feature of product.features) assert.ok(html.includes(feature), `${relative}: ${feature}`);
    if (product.priceMinor == null) {
      assert.equal(entity["@type"], "Service", relative);
      assert.equal(entity.offers, undefined, relative);
      assert.match(html, /Procjena po zahtjevu · procjena/, relative);
      assert.match(html, /data-price-minor=""/, relative);
    } else {
      assert.equal(entity["@type"], "Product", relative);
      assert.equal(entity.offers.price, (product.priceMinor / 100).toFixed(2), relative);
      assert.equal(entity.offers.priceCurrency, "BAM", relative);
      assert.ok(html.includes(catalog.money(product.priceMinor)), relative);
      assert.ok(html.includes(`data-price-minor="${product.priceMinor}"`), relative);
    }
  }
});

test("generated file and root references resolve and the entire shop graph is reachable", () => {
  const reached = new Set();
  const queue = ["shop/index.html"];
  while (queue.length) {
    const relative = queue.shift();
    if (reached.has(relative)) continue;
    reached.add(relative);
    const pageUrl = new URL(relative, `${catalog.origin}/`);
    for (const match of read(relative).matchAll(/href="([^"#?]+)"/g)) {
      const href = match[1];
      if (/^(?:mailto:|tel:)/.test(href)) continue;
      const url = new URL(href, pageUrl);
      if (url.origin !== catalog.origin) continue;
      let target = url.pathname.replace(/^\//, "");
      if (!target || target.endsWith("/")) target += "index.html";
      const destination = resolve(site, target);
      assert.ok(existsSync(destination), `${relative} references missing ${href}`);
      if (generatedRoutes.includes(target) && !reached.has(target)) queue.push(target);
    }
    for (const match of read(relative).matchAll(/(?:src|href)="([^"#?]+)"/g)) {
      const ref = match[1];
      if (/^(?:https?:|mailto:|tel:)/.test(ref) || !/\.(?:png|jpg|jpeg|webp|css|js)$/.test(ref)) continue;
      const target = new URL(ref, pageUrl).pathname.replace(/^\//, "");
      assert.ok(existsSync(resolve(site, target)), `${relative} references missing ${ref}`);
    }
  }
  for (const route of generatedRoutes) assert.ok(reached.has(route), `unreachable ${route}`);
});

test("sitemap and internal destinations use only static shop routes", () => {
  const sitemap = read("sitemap.xml");
  assert.doesNotMatch(sitemap, /shop\/(?:product|category)\.html\?/);
  for (const product of catalog.products) assert.ok(sitemap.includes(`${catalog.origin}/${catalog.productPath(product.id)}`));
  for (const id of Object.keys(catalog.categories)) assert.ok(sitemap.includes(`${catalog.origin}/${catalog.categoryPath(id)}`));

  const textFiles = readdirSync(site, { recursive: true }).filter((file) => /\.(?:html|js|xml)$/.test(file));
  for (const relative of textFiles) {
    assert.doesNotMatch(read(relative), /(?:href|canonical|loc|href:)[^>\n]*shop\/(?:product|category)\.html\?/, relative);
  }
});

test("legacy query identities map to their exact static routes before safe fallbacks", () => {
  const cases = [
    {
      relative: "shop/product.html",
      key: "id",
      values: catalog.products.map((product) => product.id),
      route: (value) => `product/${value}/index.html`,
    },
    {
      relative: "shop/category.html",
      key: "category",
      values: Object.keys(catalog.categories),
      route: (value) => `category/${value}/index.html`,
    },
  ];
  for (const { relative, key, values, route } of cases) {
    const html = read(relative);
    assert.match(html, /name="robots" content="noindex,follow"/, relative);
    assert.doesNotMatch(html, /data-shop-view=/, relative);
    const script = html.match(/<script>([\s\S]+)<\/script>/)?.[1];
    assert.ok(script, `${relative} needs a file fallback resolver`);
    for (const value of values) {
      let destination = "";
      vm.runInNewContext(script, {
        URLSearchParams,
        location: { search: `?${key}=${value}`, replace: (target) => { destination = target; } },
      });
      assert.equal(destination, route(value), `${relative}?${key}=${value}`);
    }
    let unknownDestination = "";
    vm.runInNewContext(script, {
      URLSearchParams,
      location: { search: `?${key}=unknown`, replace: (target) => { unknownDestination = target; } },
    });
    assert.equal(unknownDestination, "index.html", `${relative} unknown fallback`);
  }

  const vercel = JSON.parse(read("vercel.json"));
  for (const { source, key, values, destination } of [
    {
      source: "/shop/product.html",
      key: "id",
      values: catalog.products.map((product) => product.id),
      destination: (value) => `/${catalog.productPath(value)}`,
    },
    {
      source: "/shop/category.html",
      key: "category",
      values: Object.keys(catalog.categories),
      destination: (value) => `/${catalog.categoryPath(value)}`,
    },
  ]) {
    const fallbackIndex = vercel.redirects.findIndex((redirect) =>
      redirect.source === source && !redirect.has);
    assert.ok(fallbackIndex >= 0, `${source} needs an unknown/no-query fallback`);
    assert.equal(vercel.redirects[fallbackIndex].destination, "/shop/");
    for (const value of values) {
      const exactIndex = vercel.redirects.findIndex((redirect) =>
        redirect.source === source &&
        redirect.has?.some((condition) =>
          condition.type === "query" && condition.key === key && condition.value === value));
      assert.ok(exactIndex >= 0, `missing exact redirect for ${source}?${key}=${value}`);
      assert.ok(exactIndex < fallbackIndex, `fallback misroutes ${source}?${key}=${value}`);
      assert.equal(vercel.redirects[exactIndex].destination, destination(value));
      assert.equal(vercel.redirects[exactIndex].permanent, true);
    }
  }
});

// NOTE: Three codex-branch tests were intentionally not carried over with this
// static-shop migration because they lock features that are NOT part of it and
// do not exist on this branch: a file:// preview link resolver
// (window.digitalXSiteLink / digitalXResolveFileHref in main.js), the homepage
// before/after mobile toggle + sticky CTA, and codex's exact nav/breadcrumb CSS
// refactor. The shop works without them: js/shop.js falls back gracefully when
// window.digitalXSiteLink is absent, and the deployed site serves directory
// index.html for folder URLs. Re-add these tests only if those features land.
