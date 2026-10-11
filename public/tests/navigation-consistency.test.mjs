import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const expectedNavigation = {
  bs: {
    labels: ["Usluge", "Cjenovnik", "Radovi", "Primjeri", "Shop", "Blog"],
    hrefs: ["/#usluge", "/#cjenovnik", "/#radovi", "/primjeri-web-stranica/", "/shop/", "/blog/"],
  },
  en: {
    labels: ["Services", "Price list", "Work", "Examples", "Shop", "Blog"],
    hrefs: ["/en/#usluge", "/en/#cjenovnik", "/en/#radovi", "/en/primjeri-web-stranica/", "/en/shop/", "/en/blog/"],
  },
  de: {
    labels: ["Dienstleistungen", "Preisliste", "Arbeit", "Beispiele", "Shop", "Blog"],
    hrefs: ["/de/#usluge", "/de/#cjenovnik", "/de/#radovi", "/de/primjeri-web-stranica/", "/de/shop/", "/de/blog/"],
  },
};

function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith(".html") ? [path] : [];
  });
}

function anchors(markup) {
  return [...markup.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(
    ([, href, label]) => ({ href, label: label.replace(/<[^>]+>/g, "").trim() }),
  );
}

test("every standard page navigation uses the canonical tabs", () => {
  let navigationCount = 0;

  for (const file of htmlFiles(site)) {
    const html = readFileSync(file, "utf8");
    const locale = html.match(/<html\b[^>]*\blang="(bs|en|de)"/i)?.[1]?.toLowerCase() || "bs";
    const expected = expectedNavigation[locale];
    for (const match of html.matchAll(/<div class="nav-links"[^>]*>([\s\S]*?)<\/div>/g)) {
      navigationCount += 1;
      const links = anchors(match[1]).slice(0, expected.labels.length);
      assert.deepEqual(
        links.map((link) => link.label),
        expected.labels,
        `${relative(site, file)} has inconsistent navigation labels`,
      );
      assert.deepEqual(
        links.map((link) => link.href),
        expected.hrefs,
        `${relative(site, file)} has inconsistent navigation destinations`,
      );
    }
  }

  assert.ok(navigationCount >= 50, "expected standard navigation across secondary pages");
});

test("homepage desktop and sheet navigation include the examples tab", () => {
  const html = readFileSync(resolve(site, "index.html"), "utf8");

  for (const className of ["nav__links", "nav__sheet"]) {
    const start = html.indexOf(`class="${className}"`);
    assert.notEqual(start, -1, `missing ${className}`);
    const end = html.indexOf(className === "nav__links" ? "</div>" : "</aside>", start);
    const links = anchors(html.slice(start, end));
    assert.ok(
      links.some((link) => link.href === "/primjeri-web-stranica/" && link.label === "Primjeri"),
      `${className} is missing Primjeri`,
    );
  }
});
