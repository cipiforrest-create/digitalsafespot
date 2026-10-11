import { allServicePaths, cleanPathForLegacy } from "./service-seo.mjs";
const SITE_ORIGIN = "https://www.digital-x-marketing.com";

export const NOINDEX_PATHS = new Set([
  "/de/otkazivanje-povrat.html",
  "/de/pravne-informacije.html",
  "/de/shop/category/ai/",
  "/de/shop/category/automation/",
  "/de/shop/category/content/",
  "/de/shop/category/growth/",
  "/de/shop/category/web/",
  "/en/kolacici.html",
  "/en/otkazivanje-povrat.html",
  "/en/pravne-informacije.html",
  "/en/shop/category/automation/",
  "/en/shop/category/content/",
  "/en/shop/category/growth/",
  "/en/shop/category/web/",
  "/otkazivanje-povrat.html",
  "/pravne-informacije.html",
  "/shop/category/ai/",
  "/shop/category/automation/",
  "/shop/category/content/",
  "/shop/category/growth/",
  "/uslovi.html",
]);

function insertBeforeHeadClose(html, markup) {
  return /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `${markup}\n</head>`)
    : `${markup}\n${html}`;
}

function shopBasePath(pathname) {
  if (pathname.startsWith("/en/shop/")) return pathname.slice(3);
  if (pathname.startsWith("/de/shop/")) return pathname.slice(3);
  if (pathname === "/en/shop/" || pathname === "/de/shop/") return "/shop/";
  if (pathname.startsWith("/shop/")) return pathname;
  return null;
}

function localeForPath(pathname) {
  if (pathname.startsWith("/en/")) return "en";
  if (pathname.startsWith("/de/")) return "de";
  return "bs";
}

function removeExistingRobots(html) {
  return html.replace(/\s*<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/gi, "");
}

function applyNoindex(html, pathname) {
  if (!NOINDEX_PATHS.has(pathname)) return html;
  const cleaned = removeExistingRobots(html);
  return insertBeforeHeadClose(cleaned, '<meta name="robots" content="noindex,follow">');
}

function removeHreflangLinks(html) {
  return html.replace(
    /\s*<link\b(?=[^>]*\brel=["']alternate["'])(?=[^>]*\bhreflang=["'][^"']+["'])[^>]*\/?\s*>/gi,
    "",
  );
}

function applyShopHreflang(html, pathname) {
  const basePath = shopBasePath(pathname);
  if (!basePath) return html;
  const cleaned = removeHreflangLinks(html);
  if (basePath.startsWith("/shop/category/")) return cleaned;
  const bs = `${SITE_ORIGIN}${basePath}`;
  const en = `${SITE_ORIGIN}/en${basePath}`;
  const de = `${SITE_ORIGIN}/de${basePath}`;
  const cluster = [
    `<link rel="alternate" hreflang="bs" href="${bs}">`,
    `<link rel="alternate" hreflang="en" href="${en}">`,
    `<link rel="alternate" hreflang="de" href="${de}">`,
    `<link rel="alternate" hreflang="x-default" href="${bs}">`,
  ].join("\n");
  return insertBeforeHeadClose(cleaned, cluster);
}

function cleanupEnglishShop(html) {
  return html
    .replaceAll("kmM", "KM")
    .replaceAll("Home price of", "Starting price of")
    .replace(/>Corp\b/g, ">Cart")
    .replaceAll("_Add to Request", "Add to request")
    .replace(/>of\s+(?=\d[\d.,\s]*KM)/g, ">from ")
    .replace(/>Of\s+(?=\d[\d.,\s]*KM)/g, ">From ")
    .replaceAll("The final volume", "The final scope")
    .replaceAll("after the volume agreement", "after the scope is agreed");
}

function cleanupGermanShop(html) {
  return html
    .replaceAll("kmM", "KM")
    .replaceAll("Home Preis von", "Startpreis")
    .replace(/>Korps\b/g, ">Warenkorb")
    .replaceAll("_Auf Anfrage hinzufügen", "Zur Anfrage hinzufügen")
    .replaceAll("Das endgültige Volumen", "Der endgültige Umfang")
    .replaceAll("nach der Mengenvereinbarung", "nach Abstimmung des Leistungsumfangs");
}

function cleanupLocalizedShop(html, pathname) {
  if (!shopBasePath(pathname)) return html;
  const locale = localeForPath(pathname);
  if (locale === "en") return cleanupEnglishShop(html);
  if (locale === "de") return cleanupGermanShop(html);
  return html;
}

export function isGscIndexingPath(pathname) {
  if (NOINDEX_PATHS.has(pathname)) return true;
  return shopBasePath(pathname) !== null;
}

export function enhanceGscIndexingHtml(source, pathname) {
  if (typeof source !== "string" || !pathname) return source;
  let html = cleanupLocalizedShop(source, pathname);
  html = applyNoindex(html, pathname);
  html = applyShopHreflang(html, pathname);
  return html;
}

function canonicalizeSitemapUrl(value) {
  const decoded = String(value || "").replaceAll("&amp;", "&");
  try {
    const url = new URL(decoded);
    const clean = cleanPathForLegacy(url.pathname);
    if (clean) url.pathname = clean;
    url.hostname = "www.digital-x-marketing.com";
    url.protocol = "https:";
    return url.href;
  } catch {
    return decoded;
  }
}

function rewriteSitemapBlock(block) {
  const locMatch = block.match(/<loc>([^<]+)<\/loc>/i);
  const loc = locMatch?.[1]?.trim();
  if (!loc) return { block, loc: null };
  let canonicalLoc;
  try {
    const parsed = new URL(loc.replaceAll("&amp;", "&"));
    if (NOINDEX_PATHS.has(parsed.pathname)) return { block: "", loc: null };
    canonicalLoc = canonicalizeSitemapUrl(loc);
  } catch {
    return { block, loc };
  }

  let rewritten = block.replace(/<loc>[^<]+<\/loc>/i, `<loc>${canonicalLoc}</loc>`);
  rewritten = rewritten.replace(/<(?:xhtml:)?link\b[^>]*\bhref=["']([^"']+)["'][^>]*\/?\s*>/gi, (tag, href) => {
    try {
      const parsed = new URL(href.replaceAll("&amp;", "&"));
      if (NOINDEX_PATHS.has(parsed.pathname)) return "";
      const canonicalHref = canonicalizeSitemapUrl(href);
      return tag.replace(href, canonicalHref);
    } catch {
      return tag;
    }
  });
  return { block: rewritten, loc: canonicalLoc };
}

export function filterGscSitemap(xml) {
  if (typeof xml !== "string") return xml;
  const seen = new Set();
  let filtered = xml.replace(/\s*<url\b[\s\S]*?<\/url>/gi, (block) => {
    const rewritten = rewriteSitemapBlock(block);
    if (!rewritten.block || !rewritten.loc) return "";
    if (seen.has(rewritten.loc)) return "";
    seen.add(rewritten.loc);
    return rewritten.block;
  });

  if (/<\/urlset>/i.test(filtered)) {
    const missing = allServicePaths()
      .map((pathname) => `${SITE_ORIGIN}${pathname}`)
      .filter((loc) => !seen.has(loc))
      .map((loc) => `\n<url><loc>${loc}</loc><lastmod>2026-09-09</lastmod></url>`)
      .join("");
    if (missing) filtered = filtered.replace(/<\/urlset>/i, `${missing}\n</urlset>`);
  }
  return filtered;
}
