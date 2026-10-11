import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(resolve(site, relative), "utf8");
const cinematicRoutes = [
  "/cinematic-hotel/",
  "/cinematic-watch/",
  "/cinematic-penthouse/",
  "/cinematic-clothes/",
  "/cinematic-dentist/",
  "/cinematic-deepsea/",
  "/cinematic-vanta/",
];
const cinematicImages = [
  "cinematic-hotel.jpg",
  "cinematic-watch.webp",
  "cinematic-penthouse.jpg",
  "cinematic-clothes.jpg",
  "cinematic-dentist.jpg",
  "cinematic-deepsea-submarine.jpg",
  "cinematic-vanta.jpg",
];

test("web-service landing page presents every cinematic on the relevant page", () => {
  const html = read("landing-web.html");

  assert.match(html, /<section class="landing-cinematics" aria-labelledby="landing-cinematics-title">/);
  assert.match(html, /<h2[^>]+id="landing-cinematics-title"/);
  assert.equal((html.match(/class="landing-cinematics__item/g) || []).length, cinematicRoutes.length);

  for (const route of cinematicRoutes) {
    assert.equal((html.match(new RegExp(`href="${route}"`, "g")) || []).length, 1, route);
  }

  for (const image of cinematicImages) {
    assert.match(html, new RegExp(`src="/media/live/${image.replace(".", "\\.")}"[^>]+width="1920"[^>]+height="1080"[^>]+loading="lazy"`), image);
  }
});

test("localized cinematic indexes use the homepage featured image for every destination", () => {
  for (const file of [
    "primjeri-web-stranica/index.html",
    "en/primjeri-web-stranica/index.html",
    "de/primjeri-web-stranica/index.html",
  ]) {
    const html = read(file);

    assert.match(html, /<link\b(?=[^>]*href="\/css\/cinematic-index\.css")(?=[^>]*rel="stylesheet")[^>]*>/i, file);
    assert.equal((html.match(/class="cx-card"/g) || []).length, cinematicImages.length, file);
    assert.equal((html.match(/class="cx-card__media"/g) || []).length, cinematicImages.length, file);
    assert.equal((html.match(/class="cx-card__image"/g) || []).length, cinematicImages.length, file);

    for (const image of cinematicImages) {
      assert.match(
        html,
        new RegExp(`class="cx-card__image"[^>]+src="/media/live/${image.replace(".", "\\.")}"[^>]+alt="[^"]+"[^>]+width="1920"[^>]+height="1080"[^>]+loading="lazy"`),
        `${file}: ${image}`,
      );
    }
  }
});

test("cinematic index image cards are responsive, accessible and motion-safe", () => {
  const styles = read("css/cinematic-index.css");

  assert.match(styles, /\.cx-card__media\{[^}]*aspect-ratio:16\/10/s);
  assert.match(styles, /\.cx-card__image\{[^}]*object-fit:cover/s);
  assert.match(styles, /\.cx-card:focus-visible\{[^}]*outline:2px solid #5fc9ff/s);
  assert.match(styles, /\.cx-card b\{[^}]*min-height:44px/s);
  assert.match(styles, /@media\(max-width:720px\)/);
  assert.match(styles, /grid-template-columns:minmax\(0,1fr\)/);
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)/);
});

test("cinematic gallery stylesheet is page-scoped, responsive, accessible and motion-safe", () => {
  const html = read("landing-web.html");
  const styles = read("css/landing-cinematics.css");

  assert.match(html, /<link rel="stylesheet" href="\/css\/landing-cinematics\.css">/);
  assert.match(styles, /grid-template-columns:minmax\(0,1fr\)/);
  assert.match(styles, /@media \(min-width:680px\)/);
  assert.match(styles, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styles, /@media \(min-width:1080px\)/);
  assert.match(styles, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(styles, /\.landing-cinematics__link:focus-visible\{[^}]*outline:2px solid var\(--a1\)/s);
  assert.match(styles, /\.landing-cinematics__open\{[^}]*min-height:44px/s);
  assert.match(styles, /@media \(prefers-reduced-motion:reduce\)/);
});

test("cinematic index no longer marks restored Hotel and VANTA routes as unavailable", () => {
  const html = read("primjeri-web-stranica/index.html");

  for (const route of cinematicRoutes) {
    assert.match(html, new RegExp(`href="${route}"`), route);
  }
  assert.doesNotMatch(html, /U pripremi|cx-card cx-soon/);
});

test("service forms and cinematic destinations remain independent", () => {
  const html = read("landing-web.html");
  const gallery = html.match(/<section class="landing-cinematics"[\s\S]*?<\/section>/)?.[0];

  assert.equal((html.match(/<form\b/g) || []).length, 1);
  assert.match(html, /<form class="lead-form card" id="upit" data-source="landing-web">/);
  for (const name of ["ime", "kontakt", "djelatnost", "poruka"]) {
    assert.match(html, new RegExp(`name="${name}"`));
  }
  assert.ok(gallery, "missing cinematic gallery");
  assert.doesNotMatch(gallery, /<iframe\b|<video\b|<canvas\b|<form\b/);
});