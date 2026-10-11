import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(resolve(site, relative), "utf8");
const auditUrl = "https://audit.digital-x-marketing.com/";

test("homepage audit entry points use the exact external audit URL", () => {
  const html = read("index.html");
  const auditLinks = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)]
    .map((match) => match[1])
    .filter((href) => href.includes("audit.digital-x-marketing.com"));

  assert.equal(auditLinks.length, 7);
  assert.ok(auditLinks.every((href) => href === auditUrl));
  assert.doesNotMatch(html, /href="#analiza"/);
});

test("homepage replaces only the audit form and preserves the contact form", () => {
  const html = read("index.html");
  const auditSection = html.match(/<section class="section section--audit"[\s\S]*?<\/section>/)?.[0];

  assert.ok(auditSection, "missing audit section");
  assert.doesNotMatch(auditSection, /<form\b|data-audit|<input\b|<button\b/);
  assert.match(auditSection, /class="audit__cta"/);
  assert.match(auditSection, new RegExp(`href="${auditUrl.replaceAll(".", "\\.")}"`));

  assert.equal((html.match(/<form\b/g) || []).length, 1);
  assert.match(html, /<form class="contact__form" data-contact novalidate>/);
  for (const name of ["name", "email", "need", "message"]) {
    assert.match(html, new RegExp(`name="${name}"`));
  }
});

test("homepage keeps every local cinematic showcase destination", () => {
  const html = read("index.html");
  for (const route of [
    "/cinematic-hotel/",
    "/cinematic-watch/",
    "/cinematic-penthouse/",
    "/cinematic-clothes/",
    "/cinematic-dentist/",
    "/cinematic-deepsea/",
    "/cinematic-vanta/",
  ]) {
    assert.match(html, new RegExp(`href="${route}"`), route);
  }
});

test("responsive overrides load after the compiled homepage styles", () => {
  const html = read("index.html");
  const styles = read("css/homepage-responsive.css");

  assert.ok(
    html.indexOf('/assets/index-Ct2Gk1WG.css') < html.indexOf('/css/homepage-responsive.css'),
    "responsive overrides must load after compiled styles",
  );
  assert.match(styles, /\.disc,\s*\.showcase,\s*\.shop,\s*\.pricing__grid\s*\{/);
  assert.match(styles, /grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(styles, /@media \(min-width: 680px\)/);
  assert.match(styles, /@media \(min-width: 1080px\)/);
  assert.match(styles, /@media \(min-width: 1200px\)/);
  assert.match(styles, /--homepage-section-space:\s*4rem/);
});

test("audit calls to action have visible focus and a 44px target", () => {
  const styles = read("css/homepage-responsive.css");

  assert.match(
    styles,
    /a\[href="https:\/\/audit\.digital-x-marketing\.com\/"\]\s*\{\s*min-height:\s*44px/,
  );
  assert.match(
    styles,
    /a\[href="https:\/\/audit\.digital-x-marketing\.com\/"\]:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--cyan\)/s,
  );
});

test("showcase names wrap only between words at responsive sizes", () => {
  const styles = read("css/homepage-responsive.css");

  assert.match(styles, /\.showcase__name\s*\{[^}]*overflow-wrap:\s*normal/s);
  assert.match(styles, /\.showcase__name\s*\{[^}]*word-break:\s*keep-all/s);
  assert.match(styles, /\.showcase__name\s*\{[^}]*hyphens:\s*none/s);
  assert.match(
    styles,
    /\.showcase__item:first-child \.showcase__name\s*\{[^}]*font-size:\s*clamp\(1\.9rem,\s*3\.6vw,\s*4rem\)/s,
  );
  assert.match(
    styles,
    /@media \(max-width: 680px\)\s*\{[^}]*font-size:\s*clamp\(1\.75rem,\s*8vw,\s*2\.4rem\)/s,
  );
});
