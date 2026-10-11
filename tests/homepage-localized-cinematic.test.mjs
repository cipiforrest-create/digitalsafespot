import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(resolve(site, relative), "utf8");

const homepages = [
  { file: "index.html", lang: "bs", route: "/" },
  { file: "en/index.html", lang: "en", route: "/en/" },
  { file: "de/index.html", lang: "de", route: "/de/" },
];

const sectionOrder = [
  "hero",
  "film",
  "ponuda",
  "cinematic",
  "pristup",
  "usluge",
  "rast",
  "radovi",
  "koncepti",
  "proces",
  "cjenovnik",
  "shop",
  "analiza",
  "vodici",
  "kontakt",
];

const idsInOrder = (html) =>
  [...html.matchAll(/<section[^>]*\sid="([a-z-]+)"/g)].map((match) => match[1]);

test("every localized homepage carries the same cinematic structure", () => {
  for (const { file } of homepages) {
    assert.deepEqual(idsInOrder(read(file)), sectionOrder, file);
  }
});

test("every localized homepage drives the same frame ladder", () => {
  for (const { file } of homepages) {
    const html = read(file);
    assert.match(html, /frameCount: small \? 180 : 360/, file);
    assert.match(html, /lerp: 0\.06/, file);
    assert.match(html, /concurrency: 8/, file);
    assert.match(html, /fitScale: 1\.4/, file);
    assert.ok(html.includes("/media/frames/journey/r2/lg/frame_{frame}.webp"), file);
    assert.ok(html.includes("/media/frames/journey/r2/sm/frame_{frame}.webp"), file);
    // A rebuilt ladder must get a new revision folder, never a stale immutable URL.
    assert.doesNotMatch(html, /media\/frames\/journey\/(?:lg|sm)\//, file);
  }
});

test("the localized hero and closing plate are written in their own language", () => {
  const expectations = [
    { file: "index.html", headline: "Prisustvo koje se pamti.", closing: "Cinematic web stranice." },
    { file: "en/index.html", headline: "A presence that stays with you.", closing: "Cinematic websites." },
    { file: "de/index.html", headline: "Eine Präsenz, die in Erinnerung bleibt.", closing: "Cinematic Websites." },
  ];

  for (const { file, headline, closing } of expectations) {
    const html = read(file);
    assert.ok(html.includes(headline), `${file}: hero headline`);
    const plate = html.match(/<div class="film__chapter film__chapter--end"[\s\S]*?<\/div>\s*<\/div>/)?.[0];
    assert.ok(plate, `${file}: closing plate`);
    assert.ok(plate.includes(closing), `${file}: closing plate copy`);
  }
});

test("the English and German homepages carry no untranslated Bosnian copy", () => {
  // Brand names, product names, industry labels the Bosnian source already sets in
  // English, contact details and currency amounts read the same in every language.
  const shared = new Set([
    "Digital X",
    "Digital X Sarajevo",
    "Eynna Hair",
    "GrowthOS",
    "Sarajevo",
    "Bosna i Hercegovina",
  ]);
  const bosnian = /[čćžšđČĆŽŠĐ]/;

  for (const { file } of homepages.filter((page) => page.lang !== "bs")) {
    const html = read(file)
      .replace(/<script[\s\S]*?<\/script>/g, "")
      .replace(/<style[\s\S]*?<\/style>/g, "");
    const leaks = [...html.matchAll(/>([^<>]+)</g)]
      .map((match) => match[1].trim())
      .filter((text) => text && bosnian.test(text) && !shared.has(text));
    assert.deepEqual(leaks, [], `${file}: untranslated copy`);
  }
});

test("both translation caches cover every segment the homepage renders", () => {
  const segments = JSON.parse(read("scripts/homepage-segments.json"));
  assert.ok(segments.length > 300, "segment list looks truncated");

  for (const lang of ["en", "de"]) {
    const cache = JSON.parse(read(`scripts/homepage-translations-${lang}.json`));
    const missing = segments.filter((segment) => !(segment in cache));
    assert.deepEqual(missing, [], `homepage-translations-${lang}.json`);
  }
});

test("localized homepages keep their own route on in-page anchors and the language switcher", () => {
  for (const { file, lang, route } of homepages.filter((page) => page.lang !== "bs")) {
    const html = read(file);
    assert.ok(html.includes(`href="${route}#kontakt"`), `${file}: contact anchor`);
    assert.doesNotMatch(html, /href="#[a-z-]/, `${file}: bare fragment`);
    assert.match(
      html,
      new RegExp(`aria-current="page"[^>]*hreflang="${lang}"`),
      `${file}: switcher current`,
    );
  }
});
