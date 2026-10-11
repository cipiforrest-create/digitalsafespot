import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(resolve(site, relative), "utf8");
const referenceOrigin = "https://digital-x-pi.vercel.app";
const mirroredRoutes = [
  {
    slug: "cinematic-hotel",
    title: "HALCYON — A Glass and Travertine Estate",
    entryAsset: "/cinematic-hotel/assets/index-BjBVhkrr-perf.js",
    runtime: "cinematic-hotel/assets/index-BjBVhkrr-perf.js",
    mediaPath: `${referenceOrigin}/cinematic-hotel/assets/film/arrival.mp4`,
  },
  {
    slug: "cinematic-watch",
    title: "AURUM & NOIR — Eclipse",
    entryAsset: "./assets/index-DKmP0uHv-perf.js",
    runtime: "cinematic-watch/assets/index-DKmP0uHv-perf.js",
    mediaPath: `${referenceOrigin}/cinematic-watch/media/`,
  },
  {
    slug: "cinematic-penthouse",
    title: "THE MERIDIAN — Sixty floors above everything",
    entryAsset: "./assets/index-CGSoINYS-perf.js",
    runtime: "cinematic-penthouse/assets/index-CGSoINYS-perf.js",
    mediaPath: `${referenceOrigin}/cinematic-penthouse/assets/tour/manifest.json`,
    runtimeChecks: [
      `${referenceOrigin}/cinematic-penthouse/`,
      "DX_PENTHOUSE_ORIGIN",
    ],
  },
  {
    slug: "cinematic-clothes",
    title: "ONYX SUPPLY — MIDNIGHT DROP",
    entryAsset: "script.js",
    runtime: "cinematic-clothes/script.js",
    mediaPath: `${referenceOrigin}/cinematic-clothes/assets/videos/cloth-4.mp4`,
  },
  {
    slug: "cinematic-deepsea",
    title: "ABYSSAL — Descend Aboard the EREBUS",
    entryAsset: "app.js",
    runtime: "cinematic-deepsea/app.js",
    mediaPath: `${referenceOrigin}/cinematic-deepsea/frames/frame_{frame}.jpg`,
  },
];

test("all five reference cinematics have local route entries and local runtimes", () => {
  for (const route of mirroredRoutes) {
    const html = read(`${route.slug}/index.html`);
    const runtime = read(route.runtime);

    assert.match(html, new RegExp(`<title>${route.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</title>`));
    assert.match(html, new RegExp(`(?:src|href)="${route.entryAsset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
    assert.match(runtime, new RegExp(route.mediaPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    for (const expected of route.runtimeChecks || []) assert.ok(runtime.includes(expected), expected);
  }

  for (const file of [
    "cinematic-shared/lenis.css",
    "cinematic-shared/lenis.min.js",
    "cinematic-shared/scroll-cinematic.css",
    "cinematic-shared/scroll-cinematic.js",
  ]) {
    assert.ok(read(file).length > 0, file);
  }
});

test("VANTA ships its local cinematic page and contiguous frame set", () => {
  const html = read("cinematic-vanta/index.html");
  const runtime = read("cinematic-vanta/app.js");

  assert.match(html, /<canvas id="drive"/);
  assert.match(html, /href="https:\/\/www\.digital-x-marketing\.com\/cinematic-vanta\/"/);
  assert.match(html, /rel="preload" as="image" href="\/assets\/primjeri\/vanta\/frames\/frame_001\.jpg"/);
  assert.match(html, /rel="preload" as="image" href="\/assets\/primjeri\/vanta\/hero\.jpg"/);
  assert.match(html, /src="\/cinematic-vanta\/app\.js"/);

  // Scroll-driven frames resolve to the local, self-hosted asset directory.
  assert.match(runtime, /const FRAME_COUNT = 361;/);
  assert.match(runtime, /\/assets\/primjeri\/vanta\/frames\/frame_/);
  assert.match(runtime, /HERO_SRC\s+=\s+"\/assets\/primjeri\/vanta\/hero\.jpg"/);
  // The scrub eases the frame film toward the scroll target (smooth) and does so
  // slowly (a low lerp factor) rather than snapping frame-to-frame.
  assert.match(runtime, /smoothProg \+= \(targetProg - smoothProg\) \* \(reduce \? 1 : 0\.06\)/);

  const expected = Array.from({ length: 361 }, (_, index) => `frame_${String(index + 1).padStart(3, "0")}.jpg`);
  const frames = readdirSync(resolve(site, "assets/primjeri/vanta/frames"))
    .filter((name) => name.endsWith(".jpg"))
    .sort();
  assert.deepEqual(frames, expected);
});

test("Dentist ships its local semantic landing page and cinematic runtime", () => {
  const html = read("cinematic-dentist/index.html");
  const runtime = read("js/cinematic-dentist.js");

  assert.match(html, /<main id="top">/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<canvas id="heroCanvas">/);
  assert.match(html, /rel="preload" as="image" href="\/media\/frames\/dentist\/hero_001\.jpg"/);
  assert.match(html, /href="\/css\/cinematic-dentist\.css"/);
  for (const film of ["builder", "closer"]) {
    assert.match(html, new RegExp(`<video[^>]+src="/assets/primjeri/dentist/${film}\\.mp4"[^>]+poster="/assets/primjeri/dentist/${film}_poster\\.jpg"`));
  }
  assert.match(html, /src="\/js\/cinematic-dentist\.js"/);
  assert.doesNotMatch(html, /src="\/js\/(?:cinema|cine-hero|cinematic-scroll)\.js"/);

  // Runtime scrubs a preloaded frame sequence from the local media directory.
  assert.match(runtime, /const FRAME_COUNT = 192;/);
  assert.match(runtime, /\/media\/frames\/dentist\/hero_/);
  assert.match(runtime, /gsap\.registerPlugin\(ScrollTrigger\)/);

  const expected = Array.from({ length: 192 }, (_, index) => `hero_${String(index + 1).padStart(3, "0")}.jpg`);
  const frames = readdirSync(resolve(site, "media/frames/dentist"))
    .filter((name) => name.endsWith(".jpg"))
    .sort();
  assert.deepEqual(frames, expected);
});

test("Vercel leaves every cinematic on its local route source", () => {
  const config = JSON.parse(read("vercel.json"));
  // /cinematic-digiritalx/ was a typo in the route name; it 301s to the correct
  // local route and is the one cinematic redirect this guard allows.
  const typoRedirect = /^\/(?:en\/|de\/)?cinematic-digiritalx(?:\/(?::path\+)?)?$/;
  const cinematicRedirects = config.redirects
    .filter(({ source }) => source.startsWith("/cinematic-"))
    .filter(({ source }) => !typoRedirect.test(source));
  const dentistAssetRedirects = config.redirects.filter(({ source }) => source.startsWith("/assets/primjeri/dentist"));
  const cinematicRewrites = config.rewrites.filter(({ source }) => source.startsWith("/cinematic-"));
  const middleware = read("middleware.js");

  assert.deepEqual(cinematicRedirects, []);
  const typoRedirects = config.redirects.filter(({ source }) => typoRedirect.test(source));
  // Bare, trailing-slash and deep paths, in all three locales.
  assert.equal(typoRedirects.length, 9);
  for (const redirect of typoRedirects) {
    assert.ok(redirect.destination.includes("/cinematic-digitalx/"), redirect.source);
    assert.equal(redirect.statusCode, 301);
  }
  assert.deepEqual(dentistAssetRedirects, []);
  assert.deepEqual(cinematicRewrites, []);
  assert.doesNotMatch(middleware, /const UPSTREAM_ORIGIN/);
  assert.match(middleware, /rawUrl\.searchParams\.set\(RAW_QUERY, "1"\)/);
  assert.match(middleware, /const upstreamUrl = new URL\(request\.url\)/);
});

test("reference media origin is narrowly allowlisted for cinematic assets", () => {
  const config = JSON.parse(read("vercel.json"));
  const globalHeaders = config.headers.find(({ source }) => source === "/(.*)");
  const csp = globalHeaders?.headers.find(({ key }) => key === "Content-Security-Policy")?.value;

  assert.ok(csp, "missing global CSP");
  assert.match(csp, /media-src 'self' https:\/\/digital-x-pi\.vercel\.app blob: data:/);
  assert.match(csp, /connect-src 'self' https:\/\/digital-x-pi\.vercel\.app /);
});

test("Dentist and VANTA cinematic media receive route-scoped cache headers", () => {
  const config = JSON.parse(read("vercel.json"));
  const headerSources = config.headers.map(({ source }) => source);

  assert.ok(headerSources.includes("/media/frames/dentist/(.*)"));
  assert.ok(headerSources.includes("/assets/primjeri/dentist/(.*)"));
  assert.ok(headerSources.includes("/assets/primjeri/vanta/(.*)"));
  assert.ok(headerSources.includes("/cinematic-shared/(.*)"));
  for (const source of [
    "/media/frames/dentist/(.*)",
    "/assets/primjeri/dentist/(.*)",
    "/assets/primjeri/vanta/(.*)",
  ]) {
    const value = config.headers
      .find((entry) => entry.source === source)
      ?.headers.find(({ key }) => key === "Cache-Control")?.value;
    assert.equal(value, "public, max-age=31536000, immutable", source);
  }

  const sharedValue = config.headers
    .find((entry) => entry.source === "/cinematic-shared/(.*)")
    ?.headers.find(({ key }) => key === "Cache-Control")?.value;
  assert.equal(
    sharedValue,
    "public, max-age=86400, stale-while-revalidate=604800",
    "shared assets use stable filenames and must remain revalidatable",
  );
});

test("cinematics share lifecycle performance controls and art-directed hero copy", () => {
  const sharedScript = read("cinematic-shared/performance.js");
  const sharedStyles = read("cinematic-shared/performance.css");

  assert.match(sharedScript, /IntersectionObserver/);
  assert.match(sharedScript, /visibilitychange/);
  assert.match(sharedScript, /video\[data-src\]/);
  assert.match(sharedStyles, /data-cinematic="clothes"[^}]+hero__content/s);
  assert.match(sharedStyles, /data-cinematic="dentist"[^}]+hero__type/s);
  assert.match(sharedStyles, /data-cinematic="watch"[^}]+cine__loader/s);

  for (const route of ["hotel", "watch", "penthouse", "clothes", "deepsea", "dentist", "vanta"]) {
    const html = read(`cinematic-${route}/index.html`);
    assert.match(html, new RegExp(`<body data-cinematic="${route}">`), route);
    assert.match(html, /href="\/cinematic-shared\/performance\.css"/, route);
  }

  for (const route of ["clothes", "deepsea", "dentist", "vanta"]) {
    assert.match(read(`cinematic-${route}/index.html`), /src="\/cinematic-shared\/performance\.js"/, route);
  }
});

test("frame sequence engines use bounded preload and visibility-aware animation", () => {
  const shared = read("cinematic-shared/scroll-cinematic.js");
  const dentist = read("js/cinematic-dentist.js");
  const vanta = read("cinematic-vanta/app.js");
  const watch = read("cinematic-watch/assets/index-DKmP0uHv-perf.js");

  // Smoothing is per-section now; the shared default it falls back to is unchanged.
  assert.match(shared, /Number\.isFinite\(section\.lerp\) \? section\.lerp : 0\.085/);
  assert.match(shared, /section\.progress \+ delta \* lerp/);
  assert.match(shared, /document\.hidden\) stopLoop\(\)/);
  assert.match(dentist, /const concurrency = Math\.min\(8/);
  assert.match(dentist, /index === lastDrawnFrame/);
  assert.match(vanta, /function stopRaf\(\)/);
  assert.match(vanta, /lastHud/);
  assert.match(watch, /const n=Op\(this\.count\),r=8/);
  assert.match(watch, /PREPARING THE ECLIPSE/);
});
