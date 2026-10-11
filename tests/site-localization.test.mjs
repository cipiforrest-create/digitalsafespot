import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://www.digital-x-marketing.com";
const excludedDirectories = new Set(["en", "de", "_preview", "tests", "node_modules", "cinematic-clothes", "cinematic-deepsea", "cinematic-dentist", "cinematic-hotel", "cinematic-penthouse", "cinematic-vanta", "cinematic-watch"]);
const excludedFiles = new Set(["404.html", "audit.html", "hvala.html", "shop/product.html", "shop/category.html"]);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) return [];
    const absolute = join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

const sources = walk(site)
  .filter((path) => path.endsWith(".html"))
  .map((path) => relative(site, path).replaceAll("\\", "/"))
  .filter((path) => !excludedFiles.has(path));

function routeFor(file) {
  if (file === "index.html") return "/";
  return file.endsWith("/index.html") ? `/${file.slice(0, -"index.html".length)}` : `/${file}`;
}

test("every public Bosnian document has English and German variants", () => {
  assert.equal(sources.length, 49);
  for (const source of sources) {
    for (const lang of ["en", "de"]) {
      assert.ok(existsSync(join(site, lang, source)), `${lang}/${source}`);
    }
  }
});

test("localized pages have language, self-canonical, reciprocal hreflang and switcher", () => {
  for (const source of sources) {
    const route = routeFor(source);
    for (const lang of ["en", "de"]) {
      const file = `${lang}/${source}`;
      const html = readFileSync(join(site, file), "utf8");
      const localized = route === "/" ? `/${lang}/` : `/${lang}${route}`;
      assert.match(html, new RegExp(`<html[^>]+lang=["']${lang}["']`), file);
      assert.ok(html.includes(`rel="canonical" href="${origin}${localized}"`) || html.includes(`href="${origin}${localized}" rel="canonical"`), `${file}: canonical`);
      for (const [code, target] of [["bs", route], ["en", route === "/" ? "/en/" : `/en${route}`], ["de", route === "/" ? "/de/" : `/de${route}`]]) {
        assert.ok(html.includes(`hreflang="${code}"`) && html.includes(`${origin}${target}`), `${file}: ${code}`);
      }
      assert.match(html, /class="language-switcher"/, `${file}: switcher`);
    }
  }
});

test("localized page links stay in the current locale", () => {
  const pageRoute = /^(?:\/|https:\/\/www\.digital-x-marketing\.com\/)(?!assets\/|css\/|js\/|api\/|_vercel\/)(?!en\/|de\/)(?:[^"'#?]+\.html|(?:blog|shop|primjeri-web-stranica)\/)/;
  for (const source of sources.filter((file) => file !== "index.html")) {
    for (const lang of ["en", "de"]) {
      const file = `${lang}/${source}`;
      const html = readFileSync(join(site, file), "utf8");
      const links = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>/g)]
        .filter((match) => !/\bhreflang="(?:bs|x-default)"/.test(match[0]))
        .map((match) => match[1]);
      for (const href of links) assert.doesNotMatch(href, pageRoute, `${file}: ${href}`);
    }
  }
});

test("localized documents use root-absolute shared resource URLs", () => {
  for (const source of sources) {
    for (const lang of ["en", "de"]) {
      const file = `${lang}/${source}`;
      const html = readFileSync(join(site, file), "utf8");
      for (const match of html.matchAll(/<(?:script|link|img|source|video)\b[^>]*\b(?:src|href|poster)="([^"]+)"/g)) {
        if (/^(?:https?:|data:|#|\/)/.test(match[1])) continue;
        assert.fail(`${file}: relative resource ${match[1]}`);
      }
    }
  }
});