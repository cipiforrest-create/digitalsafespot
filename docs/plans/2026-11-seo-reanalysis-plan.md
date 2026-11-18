# Plan: fixes from the "Reanalysis of digital-x-marketing.com" report

Source: the shared Google Doc (rankings, search gaps, AI visibility, site architecture).
Checked against the live site and this repo on 2026-11-17.

## 0. Blocker: this repo is behind the live site

The live site was built from newer source than this repo has:

| Live site has | This repo |
|---|---|
| `marketing@digital-x-marketing.com` everywhere (pages, schema, llms.txt) | `digital.x.agency.ba@gmail.com` in ~40 source files (`concierge/visual-pages.mjs`, `concierge/publish.mjs`, `index.html`, `kontakt.html`, `o-nama.html`, locales, audit e-mail, lead inbox) |
| `/znanje/` knowledge hub (27 guides) | missing |
| `/usluge/izrada-web-stranica/` | missing |
| `ProfessionalService` schema with `areaServed` BiH/DE/AT/CH | `Organization` only (in generated pages) |

If this repo is built and deployed as it is, those pages disappear and the old Gmail address comes back.
The latest source has to be in this repo before anything here is deployed.

## 1. Report findings checked against the live site

| Finding | Status on live | Action |
|---|---|---|
| Gmail address in `/usluge/` and `/en/blog/` footers | **Already fixed live.** Only domain email found | Bring the repo in line (the repo still has Gmail) |
| `/usluge/seo-aeo-geo/` H1 does not match the title | **Valid.** H1: "SEO, AEO i GEO za jasniju vidljivost…" | Fix |
| No "digitalna agencija Sarajevo" in the H1 or title of home and About | **Valid** for the H1. The About title already has it | Fix |
| Branded slugs (`smart-storefront`, `x-convert`) instead of search terms | **Valid.** `/usluge/izrada-web-shopa/` returns 404 | New page plus a 301 redirect |
| Cinematic demos indexed as thin pages | **Valid.** `/cinematic-dentist/` is indexable with the H1 "Edin Topcic" (a person's name on a demo). `/cinematic-kodent/` is already noindex | `noindex,follow` on demo frames. Proof moves to vertical pages |
| No legal entity, registration ID or street address | **Valid.** `/pravne-informacije.html` says these are given only in the offer or contract | **Needs owner data** |
| No team, authors or social links beyond Instagram | **Valid** | **Needs owner data** |
| No reviews or case studies. A Trustburn 3.45 rating shows up | Trustburn link is for "Digital Wave Agency", **probably a different company** (citation 21) | Check before acting. Collect Google reviews |
| hreflang on `/en/blog/content-marketing-vodic.html` | **Correct** (bs/en/de/x-default). Only the slug is Bosnian | Low priority. Translated slugs = large migration |
| `/en/` shows KM prices | **Valid** (49–3490 KM) | Add the EUR equivalent (fixed rate 1 EUR = 1.95583 KM) |
| `/znanje/` vs `/blog/` cannibalization | Cannot verify without GSC data | GSC audit first |
| City pages (Banja Luka, Mostar, Tuzla, Zenica) | — | **Not recommended** unless each has real local content. Near-duplicate city pages are doorway pages under Google's spam policy |
| n8n / Make / WhatsApp / voice AI terms | — | Only if Digital X actually delivers these. **Needs confirmation** |

## 2. Work plan

### Phase A — code fixes (no owner input needed)
1. **Contact unification:** replace the Gmail address with `marketing@digital-x-marketing.com` in all public output (pages, llms.txt, audit e-mail footer, locales). Keep the lead-notification inbox configurable through `LEAD_NOTIFY_EMAIL`. Change only the public default.
2. **H1 alignment:**
   - `/usluge/seo-aeo-geo/` → "SEO optimizacija Sarajevo — SEO, AEO i GEO za vidljivost vašeg poslovanja"
   - Home → add the entity line "Digitalna agencija Sarajevo" (keep the current H1 keywords)
   - `/o-nama.html` → "Digitalna agencija iz Sarajeva: …"
3. **Demo indexation:** `noindex,follow` on raw `/cinematic-*/` demo frames (in `lib/cinematic-seo.mjs` / middleware). Remove them from `sitemap.xml`. Label each one as a "koncept / demo" visually.
4. **Schema:**
   - Sitewide `ProfessionalService` matching the live site (email, telephone, areaServed).
   - `Service` + `Offer` (BAM) + `FAQPage` on every `/usluge/` page from the existing catalogue FAQ data. Today only product pages have `Service` and `Offer`.
5. **EN/DE pricing:** show "≈ € X" next to KM on `/en/` and `/de/`.
6. **Tests:** extend `tests/site-seo-audit.test.mjs`:
   - no Gmail address in `public/`
   - H1 contains its target term on the money pages
   - demo frames are noindex
   - every `/usluge/` page has `FAQPage` schema

### Phase B — new commercial pages (from existing catalogue content)
7. `/usluge/izrada-web-shopa/` (Smart Storefront content, plain Bosnian H1 "Izrada web shopa u BiH"). 301 from `/usluge/smart-storefront/`. Update internal links, hreflang (EN/DE) and the sitemap.
8. `/usluge/lokalni-seo-sarajevo/`, linking to `google-business-profile.html` and `/usluge/seo-aeo-geo/`.
9. Guide `koliko-kosta-seo-optimizacija-bih`: explains the 249 KM/mo scope against typical BiH retainer ranges, without naming competitors.
10. Vertical pages under `/industrije/`: `stomatologija`, `advokati`, `hoteli-i-turizam`, `nekretnine`. Each embeds the matching demo as clearly labelled concept proof.
11. `/usluge/` hub: plain-language Bosnian service names first. X-branded products appear as packages inside them.

### Phase C — owner input required (I will prepare placeholders and the schema fields, but will not invent data)
- Registered legal name, form (d.o.o./obrt), registration ID (ID/JIB), street address matching Google Business Profile → `/o-nama`, `/pravne-informacije`, footer and schema `legalName`/`address`
- Team or founder names, photos, LinkedIn → `Person` author schema on guides
- Official social profiles and the GBP URL → `sameAs`
- At least 3 real client case studies and testimonials (separate from concept work)
- Which automation stack is actually delivered (n8n, Make, Zapier, WhatsApp API, voice AI) and which web shop platforms (WooCommerce, Shopify, custom)

### Phase D — GSC diagnostics (needs property access; not possible from this session)
The report's five audits:
- Indexing > Pages for duplicate and canonical exclusions (www, `.html` vs extensionless)
- hreflang leakage
- `/znanje/` vs `/blog/` query overlap
- `/cinematic-*/` impressions on third-party brand names
- regex filter `cijena|koliko košta|sarajevo|bih|agencija|izrada|optimizacija` at positions 5–20 with CTR < 2%

The results decide whether `/znanje/` and `/blog/` get merged and whether `.html` URLs move to extensionless ones.

## 3. Deliberately not doing now
- Mass migration of `.html` → extensionless URLs: high risk, unclear gain without GSC evidence. Canonicals are already consistent.
- Translated EN/DE slugs: large redirect surface. Revisit after GSC shows EN/DE demand.
- Regional city doorway pages.
