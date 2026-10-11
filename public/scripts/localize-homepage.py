"""Generate the English and German homepages from the Bosnian source.

`localize-site.py` deliberately skips `index.html` and preserves whatever is in
`en/index.html` and `de/index.html`, because the homepages were hand-curated for
the first localization release. This script regenerates exactly those two files
from the current `site/index.html` so the cinematic homepage exists in all three
languages, reusing the document rewriting the site-wide script already performs
(URL localization, hreflang cluster, canonical, `og:locale`, JSON-LD).

Copy comes from the reviewed caches `homepage-translations-{en,de}.json`. Every
translatable segment on the homepage must be present in both, so a copy change
in the Bosnian source fails loudly here instead of shipping a half-translated
page. Refresh the segment list with `--extract` and translate the additions.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import re
from pathlib import Path

from bs4 import BeautifulSoup


SITE = Path(__file__).resolve().parent.parent
SCRIPTS = SITE / "scripts"
LANGS = ("en", "de")


def load_site_module():
    """Import the hyphenated site-wide localizer as a module."""
    spec = importlib.util.spec_from_file_location("localize_site", SCRIPTS / "localize-site.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def homepage_segments(module) -> list[str]:
    source = (SITE / "index.html").read_text(encoding="utf-8")
    soup = BeautifulSoup(source, "html.parser")
    segments = module.extract_segments(soup)
    for meta in soup.select("meta[property], meta[name]"):
        key = (meta.get("property") or meta.get("name") or "").lower()
        value = meta.get("content")
        if key in EXTRA_META and isinstance(value, str) and value not in segments:
            segments.append(value)
    return segments


def cache_path(lang: str) -> Path:
    return SCRIPTS / f"homepage-translations-{lang}.json"


def set_switcher_current(soup: BeautifulSoup, lang: str, route: str = "/") -> None:
    """Point the existing switchers at the localized routes and mark the current one."""
    targets = {"bs": route, "en": f"/en{route}", "de": f"/de{route}"}
    for switcher in soup.select(".language-switcher"):
        for link in switcher.select("a[hreflang]"):
            code = link.get("hreflang")
            if code in targets:
                link["href"] = targets[code]
            if code == lang:
                link["aria-current"] = "page"
            elif link.has_attr("aria-current"):
                del link["aria-current"]


def localize_fragments(soup: BeautifulSoup, lang: str, route: str = "/") -> None:
    """Prefix in-page anchors with the localized route, as the first release did.

    `localize-site.py` leaves bare fragments alone because on any other page they
    already resolve against the localized URL. The homepage is the one document
    whose own route changes per language, so its anchors are written out in full.
    """
    for anchor in soup.select('a[href^="#"]'):
        anchor["href"] = f"/{lang}{route}{anchor['href']}"


def normalize_seo_links(html: str) -> str:
    """Re-emit the SEO head tags the way the Bosnian source writes them.

    BeautifulSoup sorts attributes and self-closes void elements, which would give
    the localized homepages a different head from the source they are generated
    from. The rest of the document keeps whatever the parser produces.
    """
    html = re.sub(
        r'<link href="([^"]+)" rel="canonical"\s*/?>',
        r'<link rel="canonical" href="\1">',
        html,
    )
    html = re.sub(
        r'<link href="([^"]+)" hreflang="([^"]+)" rel="alternate"\s*/?>',
        r'<link rel="alternate" hreflang="\2" href="\1">',
        html,
    )
    return re.sub(
        r'<meta content="([^"]+)" property="og:locale"\s*/?>',
        r'<meta property="og:locale" content="\1">',
        html,
    )


# Alt text carries real copy but is not in the site-wide translatable set.
EXTRA_META = ("og:image:alt", "twitter:image:alt")

# Schema descriptions join page segments with a middot; translate them piecewise
# so the structured data never ships in a different language from the page.
JOINER = " · "


def translate_joined(value: str, cache: dict[str, str]) -> str | None:
    if value in cache:
        return cache[value]
    if JOINER not in value:
        return None
    parts = [part.strip() for part in value.split(JOINER)]
    if any(part not in cache for part in parts):
        return None
    return JOINER.join(cache[part] for part in parts)


def translate_extras(soup: BeautifulSoup, cache: dict[str, str], lang: str) -> list[str]:
    """Translate alt-text metadata and schema strings the site-wide pass leaves alone."""
    untranslated: list[str] = []

    for meta in soup.select("meta[property], meta[name]"):
        key = (meta.get("property") or meta.get("name") or "").lower()
        if key not in EXTRA_META:
            continue
        value = meta.get("content")
        if not isinstance(value, str):
            continue
        translated = translate_joined(value, cache)
        if translated is None:
            untranslated.append(value)
        else:
            meta["content"] = translated

    for script in soup.select('script[type="application/ld+json"]'):
        try:
            data = json.loads(script.string or "")
        except json.JSONDecodeError:
            continue

        def walk(value):
            if isinstance(value, dict):
                return {key: walk(item) for key, item in value.items()}
            if isinstance(value, list):
                return [walk(item) for item in value]
            if isinstance(value, str) and JOINER in value:
                translated = translate_joined(value, cache)
                if translated is None:
                    untranslated.append(value)
                    return value
                return translated
            return value

        script.string = json.dumps(walk(data), ensure_ascii=False, separators=(",", ":"))

    return untranslated


def generate(lang: str, module, segments: list[str]) -> Path:
    cache = json.loads(cache_path(lang).read_text(encoding="utf-8"))
    cache.update(module.translation_overrides(lang))
    missing = [text for text in segments if text not in cache]
    if missing:
        raise SystemExit(
            f"{len(missing)} untranslated {lang} homepage segments, first: {missing[0]!r}"
        )

    # The homepage already carries both language switchers as their own <nav>
    # elements, so the site-wide injectors would only add a third one.
    module.add_switcher = lambda *args, **kwargs: None
    module.add_floating_switcher = lambda *args, **kwargs: None

    rendered = module.localize_document(SITE / "index.html", lang, cache)
    soup = BeautifulSoup(rendered, "html.parser")
    localize_fragments(soup, lang)
    set_switcher_current(soup, lang)
    leaks = translate_extras(soup, cache, lang)
    if leaks:
        raise SystemExit(
            f"{len(leaks)} untranslated {lang} metadata/schema strings, first: {leaks[0]!r}"
        )
    body = normalize_seo_links(str(soup).split("\n", 1)[1])
    destination = SITE / lang / "index.html"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text("<!DOCTYPE html>\n" + body, encoding="utf-8")
    return destination


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--extract", action="store_true", help="write the homepage segment list and stop")
    parser.add_argument("--lang", choices=LANGS)
    args = parser.parse_args()

    module = load_site_module()
    segments = homepage_segments(module)

    if args.extract:
        target = SCRIPTS / "homepage-segments.json"
        target.write_text(json.dumps(segments, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Extracted {len(segments)} homepage segments")
        return

    for lang in ((args.lang,) if args.lang else LANGS):
        destination = generate(lang, module, segments)
        print(f"Generated {destination.relative_to(SITE)} from {len(segments)} segments")


if __name__ == "__main__":
    main()
