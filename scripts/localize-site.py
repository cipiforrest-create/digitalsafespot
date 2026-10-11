"""Generate complete English and German static-site variants.

The script translates server-rendered user-facing text while preserving markup,
assets, route names and executable code. Translation responses are cached so a
reviewed build is deterministic and can be regenerated without model access.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import shutil
from pathlib import Path
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup, Comment, NavigableString


SITE = Path(__file__).resolve().parent.parent
ORIGIN = "https://www.digital-x-marketing.com"
LANGS = ("en", "de")
SKIP_DIRS = {"en", "de", "_preview", "tests", "node_modules", "cinematic-clothes", "cinematic-deepsea", "cinematic-dentist", "cinematic-hotel", "cinematic-penthouse", "cinematic-vanta", "cinematic-watch"}
SKIP_ROUTES = {"404.html", "audit.html", "hvala.html", "shop/product.html", "shop/category.html"}
SKIP_PARENTS = {"script", "style", "code", "pre", "svg"}
IGNORED_TEXT = {"html"}
ATTRS = ("title", "aria-label", "placeholder", "alt")
TRANSLATABLE_META = {"description", "og:title", "og:description", "twitter:title", "twitter:description"}
TEXT_RE = re.compile(r"[A-Za-zČĆŽŠĐčćžšđ]")
SPACE_RE = re.compile(r"^(\s*)(.*?)(\s*)$", re.S)


def route_for(path: Path) -> str:
    rel = path.relative_to(SITE).as_posix()
    if rel == "index.html":
        return "/"
    if rel.endswith("/index.html"):
        return "/" + rel[: -len("index.html")]
    return "/" + rel


def localized_route(route: str, lang: str) -> str:
    return f"/{lang}/" if route == "/" else f"/{lang}{route}"


def output_path(path: Path, lang: str) -> Path:
    return SITE / lang / path.relative_to(SITE)


def public_pages() -> list[Path]:
    pages = []
    for path in SITE.rglob("*.html"):
        rel = path.relative_to(SITE)
        if any(part in SKIP_DIRS for part in rel.parts) or rel.as_posix() in SKIP_ROUTES:
            continue
        pages.append(path)
    return sorted(pages)


def is_internal_url(value: str) -> bool:
    if value.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
        return False
    parsed = urlparse(value)
    return not parsed.netloc or parsed.netloc in {"digital-x-marketing.com", "www.digital-x-marketing.com"}


def is_page_path(path: str) -> bool:
    """Return true for known static document routes, not arbitrary resources."""
    clean = path.lstrip("/")
    if not clean:
        return True
    candidate = SITE / clean
    if path.endswith("/"):
        return (candidate / "index.html").exists()
    return candidate.suffix.lower() == ".html" and candidate.exists()


def localize_url(value: str, lang: str, current_route: str) -> str:
    if not is_internal_url(value):
        return value
    parsed = urlparse(value)
    if not parsed.netloc and not value.startswith("/"):
        absolute = urljoin(ORIGIN + current_route, value)
        parsed = urlparse(absolute)
    path = parsed.path or "/"
    # Asset/API/platform paths stay shared and language-neutral.
    if path.startswith(("/assets/", "/css/", "/js/", "/api/", "/_vercel/")):
        return value
    # File extensions used by shared resources should never receive a locale.
    if re.search(r"\.(?:css|js|mjs|json|xml|txt|webmanifest|svg|png|jpe?g|webp|avif|gif|woff2?|mp4|webm)$", path, re.I):
        return value
    if not is_page_path(path):
        return value
    if path == f"/{lang}" or path.startswith(f"/{lang}/"):
        return value
    localized = f"/{lang}/" if path == "/" else f"/{lang}{path}"
    suffix = (f"?{parsed.query}" if parsed.query else "") + (f"#{parsed.fragment}" if parsed.fragment else "")
    if parsed.netloc:
        return f"{ORIGIN}{localized}{suffix}"
    return localized + suffix


def extract_segments(soup: BeautifulSoup) -> list[str]:
    values: list[str] = []
    for node in soup.find_all(string=True):
        if isinstance(node, Comment) or (node.parent and node.parent.name in SKIP_PARENTS):
            continue
        text = str(node).strip()
        if text and text not in IGNORED_TEXT and TEXT_RE.search(text):
            values.append(html.unescape(text))
    for tag in soup.find_all(True):
        for attr in ATTRS:
            value = tag.get(attr)
            if isinstance(value, str) and TEXT_RE.search(value):
                values.append(html.unescape(value.strip()))
        if tag.name == "meta":
            key = (tag.get("name") or tag.get("property") or "").lower()
            value = tag.get("content")
            if key in TRANSLATABLE_META and isinstance(value, str) and TEXT_RE.search(value):
                values.append(html.unescape(value.strip()))
    return list(dict.fromkeys(values))


def translate_value(value: str, translations: dict[str, str]) -> str:
    match = SPACE_RE.match(value)
    assert match
    lead, core, trail = match.groups()
    return lead + translations.get(html.unescape(core), core) + trail


def translation_overrides(lang: str) -> dict[str, str]:
    common = {"DIGITAL": "DIGITAL", "Digital X": "Digital X", "Shop": "Shop", "DIGITAL X": "DIGITAL X"}
    if lang == "en":
        return {**common, "Zatvori korpu": "Close cart", "Procjena od": "Estimated from", "Pošalji zahtjev": "Send request", "+ Zahtjev": "+ Request"}
    return {**common, "Digitales X": "Digital X", "Shop-Shop": "Shop", "Zatvori korpu": "Warenkorb schließen", "Procjena od": "Geschätzt ab", "Pošalji zahtjev": "Anfrage senden", "+ Zahtjev": "+ Anfrage", "Kontakt": "Kontakt", "Početna": "Startseite"}


def add_seo_cluster(soup: BeautifulSoup, route: str, lang: str) -> None:
    head = soup.head
    if not head:
        return
    for old in head.select('link[rel="canonical"], link[rel="alternate"][hreflang]'):
        old.decompose()
    canonical_route = localized_route(route, lang)
    canonical = soup.new_tag("link", rel="canonical", href=ORIGIN + canonical_route)
    head.append(canonical)
    variants = {"bs": route, "en": localized_route(route, "en"), "de": localized_route(route, "de"), "x-default": route}
    for code, variant in variants.items():
        head.append(soup.new_tag("link", rel="alternate", hreflang=code, href=ORIGIN + variant))
    for meta in head.select('meta[property="og:url"]'):
        meta["content"] = ORIGIN + canonical_route
    locale = "en_US" if lang == "en" else "de_DE"
    og_locale = head.select_one('meta[property="og:locale"]')
    if og_locale:
        og_locale["content"] = locale
    else:
        head.append(soup.new_tag("meta", property="og:locale", content=locale))


def add_switcher(soup: BeautifulSoup, route: str, lang: str) -> None:
    nav = soup.select_one("nav .nav-in") or soup.select_one("nav")
    if not nav or nav.select_one(".language-switcher"):
        return
    switcher = soup.new_tag("div", attrs={"class": "language-switcher", "aria-label": "Language" if lang == "en" else "Sprache"})
    for code, label, target in (("bs", "BS", route), ("en", "EN", localized_route(route, "en")), ("de", "DE", localized_route(route, "de"))):
        link = soup.new_tag("a", href=target, hreflang=code, lang=code)
        if code == lang:
            link["aria-current"] = "page"
        link.string = label
        switcher.append(link)
    burger = nav.select_one(".burger")
    if burger:
        burger.insert_before(switcher)
    else:
        nav.append(switcher)


def add_floating_switcher(soup: BeautifulSoup, route: str, lang: str) -> None:
    if not soup.body or soup.select_one(".language-switcher"):
        return
    switcher = soup.new_tag("div", attrs={"class": "language-switcher language-switcher--floating", "aria-label": "Language" if lang == "en" else "Sprache"})
    for code, label, target in (("bs", "BS", route), ("en", "EN", localized_route(route, "en")), ("de", "DE", localized_route(route, "de"))):
        link = soup.new_tag("a", href=target, hreflang=code, lang=code)
        if code == lang:
            link["aria-current"] = "page"
        link.string = label
        switcher.append(link)
    soup.body.insert(0, switcher)


def add_localization_styles(soup: BeautifulSoup) -> None:
    if soup.head and not soup.head.select_one('link[href="/css/localization.css"]'):
        soup.head.append(soup.new_tag("link", rel="stylesheet", href="/css/localization.css"))


def localize_schema(soup: BeautifulSoup, lang: str, translations: dict[str, str]) -> None:
    def walk(value):
        if isinstance(value, dict):
            return {key: (lang if key == "inLanguage" else walk(item)) for key, item in value.items()}
        if isinstance(value, list):
            return [walk(item) for item in value]
        if isinstance(value, str):
            if value.startswith(ORIGIN):
                parsed = urlparse(value)
                if is_page_path(parsed.path):
                    localized = f"/{lang}/" if parsed.path == "/" else f"/{lang}{parsed.path}"
                    return ORIGIN + localized + (("?" + parsed.query) if parsed.query else "") + (("#" + parsed.fragment) if parsed.fragment else "")
                return value
            return translations.get(html.unescape(value), value)
        return value

    for script in soup.select('script[type="application/ld+json"]'):
        try:
            data = json.loads(script.string or "")
        except json.JSONDecodeError:
            continue
        script.string = json.dumps(walk(data), ensure_ascii=False, separators=(",", ":"))


def localize_document(source: Path, lang: str, translations: dict[str, str]) -> str:
    raw = source.read_text(encoding="utf-8")
    soup = BeautifulSoup(raw, "html.parser")
    route = route_for(source)
    if soup.html:
        soup.html["lang"] = lang

    for node in soup.find_all(string=True):
        if isinstance(node, Comment) or (node.parent and node.parent.name in SKIP_PARENTS):
            continue
        text = str(node)
        if text.strip() and text.strip() not in IGNORED_TEXT and TEXT_RE.search(text):
            node.replace_with(translate_value(text, translations))
    for tag in soup.find_all(True):
        for attr in ATTRS:
            value = tag.get(attr)
            if isinstance(value, str) and TEXT_RE.search(value):
                tag[attr] = translate_value(value, translations)
        if tag.name == "meta":
            key = (tag.get("name") or tag.get("property") or "").lower()
            value = tag.get("content")
            if key in TRANSLATABLE_META and isinstance(value, str) and TEXT_RE.search(value):
                tag["content"] = translate_value(value, translations)

    for tag in soup.select("a[href], form[action]"):
        attr = "href" if tag.has_attr("href") else "action"
        value = tag[attr]
        if isinstance(value, str):
            tag[attr] = localize_url(value, lang, route)
    add_seo_cluster(soup, route, lang)
    add_switcher(soup, route, lang)
    add_floating_switcher(soup, route, lang)
    add_localization_styles(soup)
    localize_schema(soup, lang, translations)
    for tag, attr in (("script", "src"), ("link", "href"), ("img", "src"), ("source", "src"), ("video", "poster")):
        for node in soup.find_all(tag):
            value = node.get(attr)
            if not isinstance(value, str) or value.startswith(("/", "http://", "https://", "data:", "#")):
                continue
            if re.search(r"\.(?:css|js|mjs|svg|png|jpe?g|webp|avif|gif|woff2?|mp4|webm|webmanifest)$", urlparse(value).path, re.I):
                node[attr] = urlparse(urljoin(ORIGIN + route, value)).path
    rendered = str(soup)
    rendered = re.sub(r"^<!doctype html>\s*", "", rendered, flags=re.I)
    return "<!DOCTYPE html>\n" + rendered


def generate(lang: str, cache: dict[str, str]) -> None:
    target = SITE / lang
    homepage = target / "index.html"
    saved_homepage = homepage.read_text(encoding="utf-8") if homepage.exists() else None
    target.mkdir(parents=True, exist_ok=True)
    for source in public_pages():
        if source == SITE / "index.html":
            continue
        destination = output_path(source, lang)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(localize_document(source, lang, cache), encoding="utf-8")
    # Keep the manually curated homepages from the first localization release.
    if saved_homepage is not None:
        homepage.write_text(saved_homepage, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--extract", action="store_true", help="write unique source segments and stop")
    parser.add_argument("--lang", choices=LANGS)
    args = parser.parse_args()
    pages = public_pages()
    segments = list(dict.fromkeys(text for page in pages for text in extract_segments(BeautifulSoup(page.read_text(encoding="utf-8"), "html.parser"))))
    if args.extract:
        (SITE / "scripts" / "localization-segments.json").write_text(json.dumps(segments, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Extracted {len(segments)} unique segments from {len(pages)} pages")
        return
    for lang in ((args.lang,) if args.lang else LANGS):
        cache_path = SITE / "scripts" / f"translations-{lang}.json"
        cache = json.loads(cache_path.read_text(encoding="utf-8"))
        cache.update(translation_overrides(lang))
        missing = [text for text in segments if text not in cache]
        if missing:
            raise SystemExit(f"{len(missing)} untranslated {lang} segments; regenerate {cache_path.name}")
        generate(lang, cache)
        print(f"Generated {len(pages)} {lang.upper()} pages")


if __name__ == "__main__":
    main()