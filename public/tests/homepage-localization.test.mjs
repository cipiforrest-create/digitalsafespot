import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(resolve(site, relative), "utf8");
const variants = [
  { file: "index.html", lang: "bs", url: "https://www.digital-x-marketing.com/", current: "BS" },
  { file: "en/index.html", lang: "en", url: "https://www.digital-x-marketing.com/en/", current: "EN" },
  { file: "de/index.html", lang: "de", url: "https://www.digital-x-marketing.com/de/", current: "DE" },
];
const cinematicSlugs = [
  "cinematic-hotel",
  "cinematic-watch",
  "cinematic-penthouse",
  "cinematic-clothes",
  "cinematic-dentist",
  "cinematic-deepsea",
  "cinematic-vanta",
];

test("localized homepages use distinct self canonicals and complete reciprocal hreflang clusters", () => {
  for (const variant of variants) {
    const html = read(variant.file);
    assert.match(html, new RegExp(`<html lang=["']${variant.lang}["']`), variant.file);
    assert.ok(html.includes(`<link rel="canonical" href="${variant.url}">`), variant.file);
    for (const [lang, url] of [
      ["bs", "https://www.digital-x-marketing.com/"],
      ["en", "https://www.digital-x-marketing.com/en/"],
      ["de", "https://www.digital-x-marketing.com/de/"],
      ["x-default", "https://www.digital-x-marketing.com/"],
    ]) {
      assert.ok(html.includes(`hreflang="${lang}" href="${url}"`), `${variant.file}: ${lang}`);
    }
    assert.match(html, new RegExp(`aria-current=["']page["'][^>]*>${variant.current}</a>`), variant.file);
  }
});

test("English and German pages contain server-rendered localized content and metadata", () => {
  const english = read("en/index.html");
  const german = read("de/index.html");
  assert.match(english, /A presence<br>that stays with you\.|A presence[\s\S]*that stays with you\./);
  assert.match(english, /Free consultation/);
  assert.match(english, /<meta property="og:locale" content="en_US">/);
  assert.match(german, /Eine Präsenz[\s\S]*die in Erinnerung bleibt\./);
  assert.match(german, /Kostenlose Beratung/);
  assert.match(german, /<meta property="og:locale" content="de_DE">/);
  assert.doesNotMatch(english, /<h1[^>]*>[\s\S]*Prisustvo/);
  assert.doesNotMatch(german, /<h1[^>]*>[\s\S]*Prisustvo/);
});

test("language switcher is compact, accessible, and present in desktop and mobile navigation", () => {
  const css = read("css/homepage-responsive.css");
  assert.match(css, /\.language-switcher\s*\{/);
  assert.match(css, /\.language-switcher--sheet/);
  for (const { file } of variants) {
    const html = read(file);
    assert.equal((html.match(/class="language-switcher/g) || []).length, 2, file);
    assert.equal((html.match(/hreflang="bs"/g) || []).length, 3, file);
    assert.equal((html.match(/hreflang="en"/g) || []).length, 3, file);
    assert.equal((html.match(/hreflang="de"/g) || []).length, 3, file);
  }
});

test("XML sitemap lists every localized homepage with the same hreflang cluster", () => {
  const sitemap = read("sitemap.xml");
  assert.match(sitemap, /xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
  for (const { url } of variants) {
    assert.ok(sitemap.includes(`<loc>${url}</loc>`), url);
  }
  assert.ok((sitemap.match(/xhtml:link rel="alternate" hreflang="x-default"/g) || []).length >= 3);
});

test("localized homepage cinematics use locale URLs backed by explicit redirects", () => {
  const redirects = JSON.parse(read("vercel.json")).redirects;

  for (const lang of ["en", "de"]) {
    const html = read(`${lang}/index.html`);
    for (const slug of cinematicSlugs) {
      const localized = `/${lang}/${slug}/`;
      assert.ok(html.includes(`class="showcase__link" href="${localized}"`), localized);
      assert.ok(
        redirects.some((redirect) => (
          redirect.source === `/${lang}/${slug}`
          && redirect.destination === `/${slug}/`
          && redirect.permanent === false
        )),
        `missing redirect for ${localized}`,
      );
    }
  }
});

test("Smart Website Launch is translated consistently and uses working localized contact links", () => {
  const expectations = [
    {
      file: "index.html",
      contact: "#kontakt",
      copy: ["dostupan je za samo pet projekata", "profesionalna 3D cinematic web stranica", "3D Cinematic web stranica", "AI Lead Assistant koji predstavlja vaše usluge", "AI Lead Assistant · 3 mjeseca", "Isporuka 7–14 radnih dana"],
    },
    {
      file: "en/index.html",
      contact: "/en/#kontakt",
      copy: ["available for only five projects", "professional 3D cinematic website", "3D Cinematic website", "AI Lead Assistant that presents your services", "AI Lead Assistant · 3 months", "Delivery in 7–14 business days"],
    },
    {
      file: "de/index.html",
      contact: "/de/#kontakt",
      copy: ["nur für fünf Projekte verfügbar", "professionelle 3D Cinematic Website", "3D Cinematic Website", "AI Lead Assistant, der Ihre Leistungen präsentiert", "AI Lead Assistant · 3 Monate", "Lieferung in 7–14 Werktagen"],
    },
  ];

  for (const expectation of expectations) {
    const html = read(expectation.file);
    const offer = html.match(/<section class="section section--offer"[\s\S]*?<\/section>/)?.[0];
    assert.ok(offer, `${expectation.file}: missing offer`);
    assert.match(offer, /<s>995 KM<\/s>[\s\S]*?<strong>499 KM<\/strong>/);
    assert.ok(offer.includes(`href="${expectation.contact}"`), `${expectation.file}: contact CTA`);
    assert.doesNotMatch(offer, /promocije\/smart-website-launch/);
    for (const copy of expectation.copy) assert.ok(offer.includes(copy), `${expectation.file}: ${copy}`);
  }
});

test("Smart Website Launch uses generated cinematic artwork without cropping", () => {
  const assetPath = "/media/live/smart-website-launch-cinematic.webp";
  const image = readFileSync(resolve(site, assetPath.slice(1)));
  const css = read("css/homepage-responsive.css");

  assert.equal(image.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(image.subarray(8, 12).toString("ascii"), "WEBP");
  assert.match(css, /\.offer__image\s*\{[^}]*object-fit:\s*contain/s);
  for (const { file } of variants) {
    const html = read(file);
    const offer = html.match(/<section class="section section--offer"[\s\S]*?<\/section>/)?.[0];
    assert.ok(offer, `${file}: missing offer`);
    assert.ok(offer.includes(`src="${assetPath}"`), `${file}: cinematic launch artwork`);
    assert.match(offer, /class="offer__image"[^>]*(?:height="700"[^>]*width="1600"|width="1600"[^>]*height="700")/);
    assert.doesNotMatch(offer, /website-launch\.webp|Resend/);
  }
});

test("Smart Website Launch promotes the 3D cinematic website in image, headline copy, and offer list", () => {
  const css = read("css/homepage-responsive.css");
  assert.match(css, /\.offer__feature\s*\{/);

  for (const { file } of variants) {
    const html = read(file);
    const offer = html.match(/<section class="section section--offer"[\s\S]*?<\/section>/)?.[0];
    assert.ok(offer, `${file}: missing offer`);
    assert.match(offer, /class="offer__feature"/);
    assert.match(offer, /<ul class="offer__list">[\s\S]*?<li>3D Cinematic (?:web stranica|website|Website)<\/li>/);
    assert.match(offer, /alt="[^"]*3D [Cc]inematic[^"]*"/);
  }
});