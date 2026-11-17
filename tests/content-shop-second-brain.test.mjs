import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(site, path), "utf8");

test("homepage preserves cinematic animation and integrates new destinations", () => {
  const html = read("index.html");
  assert.ok(html.includes('<canvas id="cine"></canvas>'));
  assert.ok(html.includes('<script src="js/cinema.js"></script>'));
  assert.ok(html.includes('href="/second-brain-os.html"'));
  assert.ok(html.includes('href="/shop/"'));
  assert.ok(html.includes('id="visual-services"'));
  assert.ok(html.includes('id="second-brain"'));
  assert.ok(html.includes('id="custom-requirements"'));
  assert.match(html, /brain-band-media"><img src="assets\/images\/second-brain-galaxy\.webp"/);
  assert.doesNotMatch(html, /brain-band-media"><img data-depth/);
});

test("three real before visuals are paired with existing premium after concepts", () => {
  const html = read("index.html");
  for (const pair of ["legal", "dental", "commerce"]) {
    assert.ok(existsSync(resolve(site, "assets", "images", `before-${pair}.webp`)));
    assert.ok(existsSync(resolve(site, "assets", "images", `portfolio-${pair}.webp`)));
    assert.ok(html.includes(`assets/images/before-${pair}.webp`));
    assert.ok(html.includes(`assets/images/portfolio-${pair}.webp`));
  }
});

test("AI Second Brain OS page contains the smooth galaxy journey and Co-Pilot contract", () => {
  const html = read("second-brain-os.html");
  assert.ok(html.includes('class="brain-experience"'));
  assert.ok(html.includes("data-brain-hero"));
  assert.ok(html.includes('id="brain-journey"'));
  assert.ok(html.includes("data-brain-sector"));
  assert.ok(html.includes("assets/images/second-brain-galaxy.webp"));
  assert.ok(html.includes("assets/images/jarvis-avatar.webp"));
  assert.ok(html.includes("Co-Pilot"));
  assert.ok(html.includes("Vaš privatni asistent"));
  assert.ok(html.includes('src="js/brain-cinema.js"'));
  assert.ok(html.includes('class="warp-field"'));
});

test("Brain Galaxy camera uses damped zoom, rotation, and hero fade", () => {
  const js = read("js/brain-cinema.js");
  assert.ok(js.includes("cameraTarget"));
  assert.ok(js.includes("cameraCurrent"));
  assert.ok(js.includes("rotation"));
  assert.ok(js.includes("heroOpacity"));
  assert.ok(js.includes("requestAnimationFrame"));
});

test("site-wide Digital X assistant has a local company knowledge base", () => {
  const js = read("js/main.js");
  for (const term of ["digitalx-assistant", "Digital X Co-Pilot", "GrowthOS", "Second Brain", "SEO / GEO / AEO", "2.490 KM", "marketing@digital-x-marketing.com"]) {
    assert.ok(js.includes(term), `missing assistant knowledge: ${term}`);
  }
  assert.ok(js.includes('role="dialog"'));
  assert.ok(js.includes('aria-live="polite"'));
  assert.ok(js.includes("addEventListener(\"submit\""));
});

test("Vercel Analytics and Speed Insights load through every static page", () => {
  const js = read("js/main.js");
  assert.ok(js.includes("/_vercel/insights/script.js"));
  assert.ok(js.includes("/_vercel/speed-insights/script.js"));
  assert.ok(js.includes("window.va = window.va ||"));
  assert.ok(js.includes("window.si = window.si ||"));
  assert.ok(js.includes('location.protocol === "file:"'));

  const htmlFiles = readdirSync(site, { recursive: true })
    .filter((file) => file.endsWith(".html"));
  for (const relative of htmlFiles) {
    const html = read(relative);
    // Shop legacy redirect stubs are instant noindex client-side redirects and
    // load no scripts by design; every real page must load main.js.
    if (/content="noindex,follow"/.test(html) && /location\.replace/.test(html)) continue;
    assert.match(html, /<script src="(?:(?:\.\.\/)+|\/)?js\/main\.js"><\/script>/, relative);
  }
});

test("every static page uses only the current Google Tag Manager container", () => {
  const htmlFiles = readdirSync(site, { recursive: true })
    .filter((file) => file.endsWith(".html"));
  for (const relative of htmlFiles) {
    const html = read(relative);
    const containerIds = [...html.matchAll(/GTM-[A-Z0-9]+/g)].map((match) => match[0]);
    // Full pages carry the container twice (head loader + <noscript>); the shop
    // legacy redirect stubs (shop/product.html, shop/category.html) are instant
    // noindex client-side redirects and intentionally carry no analytics.
    const isRedirectStub = /content="noindex,follow"/.test(html) && /location\.replace/.test(html);
    if (isRedirectStub) {
      assert.deepEqual(containerIds, [], relative);
    } else {
      assert.deepEqual(containerIds, ["GTM-5JT2X695", "GTM-5JT2X695"], relative);
    }
    assert.doesNotMatch(html, /GTM-M6CM4Q5L/, relative);
  }
});

test("public copy no longer uses Jarvis", () => {
  const textFiles = [
    "index.html",
    "second-brain-os.html",
    "shop/index.html",
    "shop/category.html",
    "shop/product.html",
    "js/shop.js",
  ];
  for (const file of textFiles) {
    const visibleCopy = read(file).replace(/jarvis-avatar\.(?:png|webp)/g, "");
    assert.doesNotMatch(visibleCopy, /jarvis/i, file);
  }
});

test("AI Second Brain page intent-loads the secure GrowthOS premium embed", () => {
  const html = read("second-brain-os.html");
  const js = read("js/growthos-embed.js");
  assert.ok(html.includes('id="growthos-live-demo"'));
  assert.ok(html.includes('data-growthos-embed-load'));
  assert.ok(html.includes('data-src="https://digital-x-growthos.vercel.app/embed/beauty-salon?lang=bs&amp;view=second-brain"'));
  assert.ok(html.includes('sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups"'));
  assert.ok(html.includes('src="js/growthos-embed.js"'));
  assert.ok(js.includes('event.origin !== expectedOrigin'));
  assert.ok(js.includes('event.source !== frame.contentWindow'));
  assert.ok(js.includes('Math.max(520, Math.min(1400'));
  assert.doesNotMatch(html, /<iframe[^>]+src="https:\/\/web\.digitalx\.ba/i);
});

test("public URLs use the canonical production domain", () => {
  for (const file of ["index.html", "growthos.html", "second-brain-os.html", "sitemap.xml", "robots.txt", "llms.txt"]) {
    const content = read(file);
    assert.doesNotMatch(content, /https:\/\/(?:web\.)?digitalx\.ba/);
    assert.doesNotMatch(content, /https:\/\/digital-x-agency\.vercel\.app/);
    assert.match(content, /https:\/\/www\.digital-x-marketing\.com/);
  }
  assert.match(read("second-brain-os.html"), /https:\/\/digital-x-growthos\.vercel\.app/);
});

test("file previews use the public GrowthOS embed instead of an absent localhost server", () => {
  const js = read("js/growthos-embed.js");
  assert.doesNotMatch(js, /location\.protocol\s*===\s*["']file:/);
  assert.match(js, /\["127\.0\.0\.1",\s*"localhost"\]\.includes\(location\.hostname\)/);
});

test("shop includes static catalog, category and product routes plus local cart", () => {
  for (const file of ["shop/index.html", "shop/category/ai/index.html", "shop/product/second-brain-os/index.html", "js/shop.js", "js/shop-catalog.js"]) {
    assert.ok(existsSync(resolve(site, file)), `missing ${file}`);
  }
  assert.ok(read("shop/index.html").includes('data-shop-view="catalog"'));
  assert.ok(read("shop/category/ai/index.html").includes('data-shop-view="category"'));
  assert.ok(read("shop/product/second-brain-os/index.html").includes('data-shop-view="product"'));
  const js = read("js/shop.js");
  assert.ok(js.includes("localStorage"));
  assert.ok(js.includes("window.DigitalXShopCatalog"));
  const catalog = require("../js/shop-catalog.js");
  assert.ok(catalog.products.some((product) => product.id === "second-brain-os"));
  const primaryImages = catalog.products.map((product) => product.image);
  assert.equal(new Set(primaryImages).size, primaryImages.length, "shop products must use unique primary images");
});

test("all local image, script, and stylesheet references resolve", () => {
  const htmlFiles = readdirSync(site, { recursive: true })
    .filter((file) => file.endsWith(".html"));
  for (const relative of htmlFiles) {
    const html = read(relative);
    const base = dirname(resolve(site, relative));
    const refs = [
      ...html.matchAll(/(?:src|href)="([^"#?]+)"/g),
    ].map((match) => match[1]).filter((ref) =>
      !/^(?:https?:|mailto:|tel:)/.test(ref) && /\.(?:png|jpg|jpeg|webp|css|js|html)$/.test(ref)
    );
    for (const ref of refs) {
      const target = ref.startsWith("/") ? resolve(site, `.${ref}`) : resolve(base, ref);
      assert.ok(existsSync(target), `${relative} references missing ${ref}`);
    }
  }
});
