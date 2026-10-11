"""Expand sitemap entries with all BS/EN/DE route alternates."""

from pathlib import Path
from xml.etree import ElementTree as ET


SITE = Path(__file__).resolve().parent.parent
ORIGIN = "https://www.digital-x-marketing.com"
NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
XHTML = "http://www.w3.org/1999/xhtml"
ET.register_namespace("", NS)
ET.register_namespace("xhtml", XHTML)


def localized(url: str, lang: str) -> str:
    route = url.removeprefix(ORIGIN)
    return f"{ORIGIN}/{lang}/" if route == "/" else f"{ORIGIN}/{lang}{route}"


path = SITE / "sitemap.xml"
tree = ET.parse(path)
root = tree.getroot()
lastmods = {}
for entry in list(root):
    loc = entry.find(f"{{{NS}}}loc")
    modified = entry.find(f"{{{NS}}}lastmod")
    if loc is not None and loc.text:
        route = loc.text.removeprefix(ORIGIN)
        if route.startswith("/en/"):
            route = route.removeprefix("/en")
        elif route.startswith("/de/"):
            route = route.removeprefix("/de")
        lastmods[ORIGIN + route] = modified.text if modified is not None else "2026-08-29"

skip_directories = {"en", "de", "_preview", "tests", "node_modules", "cinematic-clothes", "cinematic-deepsea", "cinematic-dentist", "cinematic-hotel", "cinematic-penthouse", "cinematic-vanta", "cinematic-watch"}
skip_files = {"404.html", "audit.html", "hvala.html", "shop/product.html", "shop/category.html"}
source_entries = []
for source in sorted(SITE.rglob("*.html")):
    rel = source.relative_to(SITE).as_posix()
    if any(part in skip_directories for part in source.relative_to(SITE).parts) or rel in skip_files:
        continue
    route = "/" if rel == "index.html" else "/" + (rel[: -len("index.html")] if rel.endswith("/index.html") else rel)
    url = ORIGIN + route
    source_entries.append((url, lastmods.get(url, "2026-08-29")))

root.clear()
for source, lastmod in source_entries:
    cluster = {"bs": source, "en": localized(source, "en"), "de": localized(source, "de"), "x-default": source}
    for locale in ("bs", "en", "de"):
        entry = ET.SubElement(root, f"{{{NS}}}url")
        ET.SubElement(entry, f"{{{NS}}}loc").text = cluster[locale]
        ET.SubElement(entry, f"{{{NS}}}lastmod").text = "2026-08-29" if locale != "bs" else lastmod
        for code, href in cluster.items():
            ET.SubElement(entry, f"{{{XHTML}}}link", {"rel": "alternate", "hreflang": code, "href": href})

ET.indent(tree, space="  ")
tree.write(path, encoding="utf-8", xml_declaration=True)
print(f"Wrote {len(source_entries) * 3} localized sitemap URLs")