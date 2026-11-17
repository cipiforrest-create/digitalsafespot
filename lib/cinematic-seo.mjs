const SITE_ORIGIN = "https://www.digital-x-marketing.com";
const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
const SOCIAL_IMAGE = `${SITE_ORIGIN}/assets/film/og-final.jpg`;
const UPDATED_DATE = "2026-08-26";

export const CINEMATIC_PAGES = Object.freeze({
  "cinematic-hotel": {
    h1: "HALCYON — cinematic luxury hotel web concept",
    description: "HALCYON je Digital X cinematic web koncept za luksuzni hotel i hospitality brend: scroll storytelling, premium art direction i jasna konverzijska struktura.",
    focus: "luksuzni hospitality, arhitekturu i iskustvo boravka",
    image: SOCIAL_IMAGE,
  },
  "cinematic-watch": {
    h1: "AURUM & NOIR Eclipse — cinematic luxury watch web concept",
    description: "AURUM & NOIR Eclipse je Digital X cinematic web koncept za luksuzni sat: premium product storytelling, fokus na detalje i scroll-driven prezentacija.",
    focus: "luksuzni proizvod, detalje izrade i osjećaj ekskluzivnosti",
    image: SOCIAL_IMAGE,
  },
  "cinematic-penthouse": {
    h1: "THE MERIDIAN — cinematic penthouse web concept",
    description: "THE MERIDIAN je Digital X cinematic web koncept za premium nekretninu: arhitektonski storytelling, luksuzna prezentacija i iskustvo vođeno skrolom.",
    focus: "premium nekretnine, arhitektonski prostor i high-end prodajnu prezentaciju",
    image: SOCIAL_IMAGE,
  },
  "cinematic-clothes": {
    h1: "ONYX SUPPLY MIDNIGHT DROP — cinematic fashion web concept",
    description: "ONYX SUPPLY MIDNIGHT DROP je Digital X cinematic fashion web koncept koji spaja kampanju, kolekciju i e-commerce storytelling u jedno scroll iskustvo.",
    focus: "fashion kampanju, kolekciju i product-led e-commerce iskustvo",
    image: SOCIAL_IMAGE,
  },
  "cinematic-dentist": {
    h1: "Edin Topic — cinematic dental website concept",
    description: "Digital X cinematic dental web koncept za modernu ordinaciju: premium vizuelni identitet, povjerenje, jasne usluge i put do rezervacije termina.",
    focus: "dentalnu ordinaciju, povjerenje pacijenata i put do rezervacije termina",
    image: SOCIAL_IMAGE,
  },
  "cinematic-deepsea": {
    h1: "ABYSSAL — Descend Aboard the EREBUS cinematic web concept",
    description: "ABYSSAL / EREBUS je Digital X cinematic web koncept za ekspedicijsku priču: atmosferičan scroll, narativna progresija i immersive digitalno iskustvo.",
    focus: "ekspedicijsku priču, atmosferu i immersive narativnu progresiju",
    image: SOCIAL_IMAGE,
  },
  "cinematic-vanta": {
    h1: "VANTA — cinematic electric hypercar web concept",
    description: "VANTA je Digital X cinematic web koncept za električni hypercar: brzina, tehnološki storytelling, premium motion direction i scroll-driven prezentacija.",
    focus: "automotive proizvod, performanse i tehnološki storytelling",
    image: SOCIAL_IMAGE,
  },
});

const escapeAttr = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const escapeText = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

function insertBeforeHeadClose(html, markup) {
  return /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `${markup}\n</head>`)
    : `${markup}\n${html}`;
}

function upsertMeta(html, attribute, key, content) {
  const safeKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${safeKey}["'])[^>]*>`, "i");
  const tag = `<meta ${attribute}="${escapeAttr(key)}" content="${escapeAttr(content)}">`;
  return re.test(html) ? html.replace(re, tag) : insertBeforeHeadClose(html, tag);
}

function upsertCanonical(html, canonical) {
  const re = /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i;
  const tag = `<link rel="canonical" href="${escapeAttr(canonical)}">`;
  return re.test(html) ? html.replace(re, tag) : insertBeforeHeadClose(html, tag);
}

function removeInjectedBlock(html, tag, id) {
  const re = new RegExp(`<${tag}\\b[^>]*\\bid=["']${id}["'][^>]*>[\\s\\S]*?<\\/${tag}>`, "i");
  return html.replace(re, "");
}

function projectContext(config) {
  return `<section id="dx-project-context" aria-labelledby="dx-project-context-title">
  <p class="dx-project-meta">Digital X · Sarajevo, Bosna i Hercegovina · Ažurirano 26. augusta 2026.</p>
  <h2 id="dx-project-context-title">Šta prikazuje ovaj cinematic web koncept?</h2>
  <p>Ova stranica je demonstracijski Digital X koncept koji pokazuje kako se može predstaviti ${escapeText(config.focus)} kroz pažljivo režiran web doživljaj. Koncept je napravljen kao portfolio demonstracija dizajna, sadržajne arhitekture i interakcije; ne predstavlja tvrdnju da je prikazani izmišljeni brend stvarni klijent niti stvarnu komercijalnu ponudu tog brenda. Cilj je pokazati kako vizuelni ritam, tipografija, pokret i jasna informacijska struktura mogu raditi zajedno bez gubitka tehničke čitljivosti za pretraživače i AI sisteme.</p>
  <p>U produkcijskoj verziji isti princip se prilagođava stvarnim podacima klijenta: uslugama ili proizvodima, lokaciji, dokazima povjerenja, fotografijama, upitima korisnika i poslovnim ciljevima. Cinematic sloj zato nije zamjena za SEO, pristupačnost ili konverziju, nego prezentacijski sloj iznad semantički ispravne i indeksabilne osnove.</p>
  <h2>Šta Digital X radi u ovakvom projektu?</h2>
  <ul>
    <li>definiše informacijsku arhitekturu, poruku i korisnički put prije animacije;</li>
    <li>gradi semantičan HTML, metadata, canonical URL, structured data i interne veze;</li>
    <li>optimizuje vizuale i motion elemente tako da iskustvo ostane upotrebljivo na mobilnim uređajima;</li>
    <li>povezuje dizajn sa SEO, AEO/GEO signalima, analitikom i jasnim sljedećim korakom za korisnika.</li>
  </ul>
  <p>Za stvaran projekat sadržaj, schema i tvrdnje se uvijek prilagođavaju provjerljivim informacijama konkretnog poslovanja. Pogledajte <a href="/primjeri-web-stranica/">još primjera web stranica</a>, saznajte više o Digital X pristupu ili <a href="/kontakt.html">pošaljite upit</a>. Dostupni su i <a href="/privatnost.html">politika privatnosti</a> i <a href="/uslovi.html">uslovi korištenja</a>.</p>
</section>`;
}

function schemaFor(slug, config, canonical) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "Digital X",
        url: `${SITE_ORIGIN}/`,
        email: "marketing@digital-x-marketing.com",
        telephone: "+387644383566",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Sarajevo",
          addressCountry: "BA",
        },
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: "Digital X",
        url: `${SITE_ORIGIN}/`,
        publisher: { "@id": ORGANIZATION_ID },
        inLanguage: "bs",
      },
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: config.h1,
        description: config.description,
        isPartOf: { "@id": WEBSITE_ID },
        creator: { "@id": ORGANIZATION_ID },
        publisher: { "@id": ORGANIZATION_ID },
        dateModified: UPDATED_DATE,
        inLanguage: "bs",
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: config.image,
        },
        about: {
          "@type": "CreativeWork",
          name: config.h1,
          description: `Digital X demonstracijski cinematic web koncept za ${config.focus}.`,
        },
      },
    ],
  };
}

export function enhanceCinematicHtml(source, slug) {
  const config = CINEMATIC_PAGES[slug];
  if (!config || typeof source !== "string") return source;

  const canonical = `${SITE_ORIGIN}/${slug}/`;
  let html = source;

  html = upsertCanonical(html, canonical);
  html = upsertMeta(html, "name", "description", config.description);
  html = upsertMeta(html, "property", "og:type", "website");
  html = upsertMeta(html, "property", "og:site_name", "Digital X");
  html = upsertMeta(html, "property", "og:title", config.h1);
  html = upsertMeta(html, "property", "og:description", config.description);
  html = upsertMeta(html, "property", "og:url", canonical);
  html = upsertMeta(html, "property", "og:image", config.image);
  html = upsertMeta(html, "name", "twitter:card", "summary_large_image");
  html = upsertMeta(html, "name", "twitter:title", config.h1);
  html = upsertMeta(html, "name", "twitter:description", config.description);
  html = upsertMeta(html, "name", "twitter:image", config.image);

  html = removeInjectedBlock(html, "style", "dx-cinematic-seo-style");
  html = removeInjectedBlock(html, "script", "dx-cinematic-schema");
  html = html.replace(/<section\b[^>]*\bid=["']dx-project-context["'][^>]*>[\s\S]*?<\/section>/i, "");

  const style = `<style id="dx-cinematic-seo-style">
.dx-visually-hidden{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
#dx-project-context{position:relative;z-index:5;box-sizing:border-box;max-width:980px;margin:0 auto;padding:72px 28px 84px;color:#ececec;background:#08090b;font:400 16px/1.75 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
#dx-project-context h2{margin:34px 0 14px;font-size:clamp(25px,3vw,38px);line-height:1.15;color:#fff}
#dx-project-context p,#dx-project-context li{max-width:78ch;color:#c7c9cd}
#dx-project-context ul{padding-left:1.25rem}
#dx-project-context a{color:#fff;text-decoration:underline;text-underline-offset:3px}
#dx-project-context .dx-project-meta{font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:#8f949b}
@media (prefers-reduced-motion:reduce){#dx-project-context{scroll-behavior:auto}}
</style>`;
  html = insertBeforeHeadClose(html, style);

  const schema = JSON.stringify(schemaFor(slug, config, canonical)).replaceAll("<", "\\u003c");
  html = insertBeforeHeadClose(html, `<script id="dx-cinematic-schema" type="application/ld+json">${schema}</script>`);

  if (!/<main\b/i.test(html)) {
    html = html.replace(/<body\b([^>]*)>/i, `<body$1><main id="dx-cinematic-main">`);
    html = html.replace(/<\/body>/i, `</main></body>`);
  }

  if (!/<h1\b/i.test(html)) {
    html = html.replace(/<main\b([^>]*)>/i, `<main$1><h1 id="dx-cinematic-seo-heading" class="dx-visually-hidden">${escapeText(config.h1)}</h1>`);
    const headingCleanup = `<script id="dx-cinematic-heading-cleanup">(()=>{const removeDuplicate=()=>{const injected=document.getElementById("dx-cinematic-seo-heading");if(!injected)return true;if(document.querySelectorAll("h1").length>1){injected.remove();return true}return false};if(!removeDuplicate()){const observer=new MutationObserver(()=>{if(removeDuplicate())observer.disconnect()});observer.observe(document.body,{childList:true,subtree:true});addEventListener("load",()=>setTimeout(()=>observer.disconnect(),5000),{once:true})}})();</script>`;
    html = html.replace(/<\/body>/i, `${headingCleanup}</body>`);
  }

  const context = projectContext(config);
  html = /<\/main>/i.test(html)
    ? html.replace(/<\/main>/i, `${context}</main>`)
    : html.replace(/<\/body>/i, `${context}</body>`);

  return html;
}
