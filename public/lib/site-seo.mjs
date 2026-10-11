const SITE_ORIGIN = "https://www.digital-x-marketing.com";
const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;
const LOCAL_BUSINESS_ID = `${SITE_ORIGIN}/#local-business`;
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
const UPDATED_DATE = "2026-08-26";

const BLOG_ITEMS = [
  ["Koliko košta web stranica u BiH u 2026?", "/blog/koliko-kosta-web-stranica-bih.html"],
  ["Landing stranica: od oglasa do upita", "/blog/landing-stranica-vodic.html"],
  ["Aplikacija po mjeri", "/blog/aplikacije-po-mjeri.html"],
  ["Rebranding i UI/UX dizajn", "/blog/uiux-rebranding-vodic.html"],
  ["Zašto spor sajt tiho ubija prodaju", "/blog/brzina-sajta.html"],
  ["Održavanje i sigurnost web stranice", "/blog/odrzavanje-sigurnost-vodic.html"],
  ["Kako da vas ChatGPT preporuči", "/blog/aeo-vodic.html"],
  ["Kako biti prvi na Google mapi", "/blog/lokalni-seo-google-mapa.html"],
  ["Google i Meta oglasi", "/blog/google-meta-oglasi-vodic.html"],
  ["Vođenje društvenih mreža", "/blog/vodjenje-drustvenih-mreza.html"],
  ["Content marketing", "/blog/content-marketing-vodic.html"],
  ["Foto i video produkcija", "/blog/foto-video-produkcija.html"],
  ["AI chatbot za male biznise", "/blog/ai-chatbot-vodic.html"],
  ["AI automatizacija poslovanja", "/blog/ai-automatizacija-vodic.html"],
  ["Automatizacija Google recenzija", "/blog/automatizacija-recenzija.html"],
];

const SHOP_ITEMS = [
  ["Premium web prisustvo", "/shop/product/web-presence/"],
  ["E-commerce Launch", "/shop/product/ecommerce-launch/"],
  ["Aplikacija po mjeri", "/shop/product/application-mvp/"],
  ["AI Second Brain OS", "/shop/product/second-brain-os/"],
  ["AI prodajni asistent", "/shop/product/ai-concierge/"],
  ["Automation Starter", "/shop/product/workflow-starter/"],
  ["Sistem recenzija", "/shop/product/review-engine/"],
  ["SEO · GEO · AEO", "/shop/product/seo-aeo/"],
  ["Kampanje za rast", "/shop/product/growth-campaigns/"],
  ["Speed optimizacija", "/shop/product/speed-optimization/"],
  ["Sistem sadržaja", "/shop/product/content-system/"],
  ["Digitalni partner", "/shop/product/digital-partner/"],
];

const FAQS = {
  "/growthos.html": [
    ["Šta je GrowthOS?", "GrowthOS je modularna poslovna aplikacija po mjeri koja na jednom mjestu povezuje CRM, klijente, projekte, zadatke, termine, kampanje, automatizacije, izvještaje i poslovno znanje."],
    ["Kome je GrowthOS namijenjen?", "Namijenjen je timovima kojima su Excel tabele, odvojeni alati i ručno prepisivanje podataka postali usko grlo. Sistem se gradi prema stvarnom procesu firme, a ne obrnuto."],
    ["Mora li se uvesti svih 11 modula odjednom?", "Ne. Počinje se modulima koji rješavaju najveći trenutni problem, a ostali se dodaju u fazama kada donose jasnu operativnu vrijednost."],
    ["Da li je javni demo siguran za stvarne poslovne podatke?", "Ne. Javni demo koristi izmišljene podatke i služi za pregled koncepta. Stvarni podaci se uvode tek u zasebno dogovorenom i kontrolisanom produkcijskom okruženju."],
  ],
  "/second-brain-os.html": [
    ["Šta je AI Second Brain OS?", "AI Second Brain OS je privatni sloj poslovnog znanja koji povezuje dozvoljene dokumente, razgovore, projekte, odluke i procese tako da ih Co-Pilot može pronaći, objasniti i pretvoriti u odobrenu akciju."],
    ["Po čemu se razlikuje od običnog AI chatbota?", "Obični chatbot uglavnom odgovara iz općeg modelskog znanja. Second Brain radi nad odobrenim poslovnim izvorima, prikazuje porijeklo konteksta i može izvršavati samo unaprijed dozvoljene radnje."],
    ["Da li AI automatski izvršava osjetljive radnje?", "Ne. Osjetljive komande mogu biti postavljene tako da čekaju potvrdu korisnika, uz evidenciju izvora, odluke i izvršenja."],
    ["Koje izvore može povezati?", "Opseg zavisi od projekta, ali tipično uključuje dokumente, bilješke, sastanke, CRM zapise, projekte i druge izvore za koje organizacija odobri pristup."],
  ],
  "/primjeri-web-stranica/": [
    ["Kako odabrati pravi tip web stranice?", "Pođite od poslovnog cilja: landing stranica je najbolja kada imate jednu ponudu i jedan izvor prometa, prezentacijska stranica kada morate objasniti više usluga, a e-commerce kada korisnik treba završiti kupovinu online."],
    ["Da li cinematic web ima smisla za svaki biznis?", "Ne. Cinematic pristup ima najveću vrijednost kada diferencijacija, premium pozicioniranje i storytelling direktno utiču na odluku kupca. Za lokalne usluge često je važnija brza, jasna i konverzijski fokusirana struktura."],
    ["Šta je važnije: izgled ili SEO?", "Nije potrebno birati jedno. Dobar projekat gradi vizuelni sloj iznad semantičnog HTML-a, kvalitetnog sadržaja, brzine, pristupačnosti i jasnih signala za Google i AI sisteme."],
  ],
  "/o-nama.html": [
    ["Šta je Digital X?", "Digital X je digitalna agencija iz Sarajeva koja povezuje web razvoj, SEO/GEO/AEO, aplikacije, oglašavanje, sadržaj i AI automatizaciju u jedan sistem rasta."],
    ["Gdje Digital X radi?", "Tim je baziran u Sarajevu i radi online sa klijentima u Bosni i Hercegovini, regionu i dijaspori, zavisno od vrste projekta."],
    ["Kako počinje saradnja?", "Saradnja počinje kratkom dijagnozom cilja i postojećeg stanja. Nakon toga se definišu prioriteti, opseg, faze i mjerljiv rezultat prije početka izvedbe."],
  ],
};

function absolute(pathname = "/") {
  return new URL(pathname, `${SITE_ORIGIN}/`).href;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function json(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function insertBeforeHeadClose(html, markup) {
  return /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `${markup}\n</head>`)
    : `${markup}\n${html}`;
}

function insertBeforeMainClose(html, markup) {
  if (/<\/main>/i.test(html)) return html.replace(/<\/main>/i, `${markup}\n</main>`);
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${markup}\n</body>`);
  return `${html}\n${markup}`;
}

function removeBlockById(html, tag, id) {
  const re = new RegExp(`<${tag}\\b[^>]*\\bid=["']${id}["'][^>]*>[\\s\\S]*?<\\/${tag}>`, "i");
  return html.replace(re, "");
}

function stripTags(value) {
  return String(value)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .trim();
}

export function removeEmptyHeadings(html) {
  return String(html).replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (match, _level, body) =>
    stripTags(body) ? match : ""
  );
}

export function normalizeHeadingHierarchy(html) {
  let previous = null;
  return String(html).replace(/<h([1-6])(\b[^>]*)>([\s\S]*?)<\/h\1>/gi, (match, levelText, attrs, body) => {
    const original = Number(levelText);
    const level = previous != null && original > previous + 1 ? previous + 1 : original;
    previous = level;
    if (level === original) return match;
    return `<h${level}${attrs}>${body}</h${level}>`;
  });
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match?.[1] || null;
}

export function addResponsiveImageCandidates(html) {
  return String(html).replace(/<img\b[^>]*>/gi, (tag) => {
    if (/\bsrcset\s*=/i.test(tag)) return tag;
    const src = attr(tag, "src");
    const width = attr(tag, "width");
    if (!src || !width || !/^\d+$/.test(width)) return tag;
    if (/\.(?:svg|gif)(?:[?#]|$)/i.test(src)) return tag;
    const sizes = `(max-width: ${width}px) 100vw, ${width}px`;
    const extra = ` srcset="${escapeHtml(src)} ${width}w" sizes="${sizes}"${/\bdecoding\s*=/i.test(tag) ? "" : ' decoding="async"'}`;
    return tag.replace(/\s*\/?>$/, (ending) => `${extra}${ending}`);
  });
}

function fixKnownBrokenAssets(html, pathname) {
  if (pathname !== "/second-brain-os.html") return html;
  return html
    .replace(/src=["']\/assets\/images\/second-brain-map\.svg["']/gi, 'src="/assets/images/growthos-second-brain.webp" width="1440" height="900"')
    .replace(/src=["']\/assets\/jarvis\/jarvis-hero-avatar\.png["']/gi, 'src="/assets/images/jarvis-avatar.webp" width="1448" height="1086"');
}

function baseEntities() {
  return [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: "Digital X",
      alternateName: "Digital X Sarajevo",
      url: `${SITE_ORIGIN}/`,
      email: "digital.x.agency.ba@gmail.com",
      telephone: "+387644383566",
      areaServed: ["BA", "HR", "RS", "ME", "DE", "AT", "CH"],
      knowsLanguage: ["bs", "hr", "sr", "en", "de"],
    },
    {
      "@type": "LocalBusiness",
      "@id": LOCAL_BUSINESS_ID,
      name: "Digital X Sarajevo",
      url: `${SITE_ORIGIN}/`,
      email: "digital.x.agency.ba@gmail.com",
      telephone: "+387644383566",
      parentOrganization: { "@id": ORGANIZATION_ID },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Sarajevo",
        addressCountry: "BA",
      },
      areaServed: {
        "@type": "Country",
        name: "Bosna i Hercegovina",
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
  ];
}

function faqEntity(pathname) {
  const entries = FAQS[pathname];
  if (!entries) return null;
  return {
    "@type": "FAQPage",
    "@id": `${absolute(pathname)}#faq`,
    mainEntity: entries.map(([name, text]) => ({
      "@type": "Question",
      name,
      acceptedAnswer: { "@type": "Answer", text },
    })),
  };
}

function listEntity(id, name, entries) {
  return {
    "@type": "ItemList",
    "@id": id,
    name,
    itemListElement: entries.map(([title, pathname], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: title,
      url: absolute(pathname),
    })),
  };
}

function routeEntities(pathname) {
  const canonical = absolute(pathname);
  const graph = baseEntities();

  if (pathname === "/") {
    graph.push({
      "@type": "WebPage",
      "@id": `${SITE_ORIGIN}/#webpage`,
      url: `${SITE_ORIGIN}/`,
      name: "Digital X Sarajevo | Web stranice, SEO i AI automatizacija",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": LOCAL_BUSINESS_ID },
      publisher: { "@id": ORGANIZATION_ID },
      inLanguage: "bs",
      dateModified: UPDATED_DATE,
    });
  } else if (pathname === "/blog/") {
    graph.push({
      "@type": "Blog",
      "@id": `${canonical}#blog`,
      url: canonical,
      name: "Digital X blog — praktični vodiči za digitalni rast",
      publisher: { "@id": ORGANIZATION_ID },
      isPartOf: { "@id": WEBSITE_ID },
      inLanguage: "bs",
    });
    graph.push(listEntity(`${canonical}#posts`, "Digital X vodiči", BLOG_ITEMS));
  } else if (pathname === "/shop/") {
    graph.push({
      "@type": "CollectionPage",
      "@id": `${canonical}#collection`,
      url: canonical,
      name: "Digital X Shop — digitalne usluge i sistemi",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORGANIZATION_ID },
      inLanguage: "bs",
    });
    graph.push(listEntity(`${canonical}#products`, "Digital X digitalne usluge", SHOP_ITEMS));
  } else if (pathname.startsWith("/shop/")) {
    graph.push({
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORGANIZATION_ID },
      inLanguage: "bs",
    });
  } else if (pathname === "/kontakt.html") {
    graph.push({
      "@type": "ContactPage",
      "@id": `${canonical}#contact`,
      url: canonical,
      name: "Kontakt — Digital X",
      isPartOf: { "@id": WEBSITE_ID },
      mainEntity: { "@id": LOCAL_BUSINESS_ID },
      inLanguage: "bs",
    });
  } else if (pathname === "/growthos.html") {
    graph.push({
      "@type": "SoftwareApplication",
      "@id": `${canonical}#software`,
      name: "GrowthOS",
      url: canonical,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      creator: { "@id": ORGANIZATION_ID },
      provider: { "@id": ORGANIZATION_ID },
      description: "Modularna poslovna aplikacija po mjeri za CRM, projekte, operacije, automatizacije, izvještaje i povezano poslovno znanje.",
    });
  } else if (pathname === "/second-brain-os.html") {
    graph.push({
      "@type": "SoftwareApplication",
      "@id": `${canonical}#software`,
      name: "AI Second Brain OS",
      url: canonical,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      creator: { "@id": ORGANIZATION_ID },
      provider: { "@id": ORGANIZATION_ID },
      description: "Privatni poslovni sloj znanja koji povezuje odobrene izvore, kontekst i kontrolisane AI akcije.",
    });
  } else if (pathname === "/primjeri-web-stranica/") {
    graph.push({
      "@type": "CollectionPage",
      "@id": `${canonical}#collection`,
      url: canonical,
      name: "Primjeri web stranica — Digital X",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORGANIZATION_ID },
      inLanguage: "bs",
    });
  } else if (pathname === "/o-nama.html") {
    graph.push({
      "@type": "AboutPage",
      "@id": `${canonical}#about`,
      url: canonical,
      name: "O nama — Digital X",
      isPartOf: { "@id": WEBSITE_ID },
      mainEntity: { "@id": ORGANIZATION_ID },
      inLanguage: "bs",
    });
  }

  const faq = faqEntity(pathname);
  if (faq) graph.push(faq);
  return { "@context": "https://schema.org", "@graph": graph };
}

function answerMarkup(pathname) {
  const entries = FAQS[pathname];
  if (!entries) return "";
  const intro = pathname === "/growthos.html"
    ? "Kratki odgovori na pitanja koja najčešće odlučuju da li je custom poslovni sistem pravi sljedeći korak."
    : pathname === "/second-brain-os.html"
      ? "Najvažnije razlike između privatnog poslovnog AI sistema i generičkog chatbota, sa jasnim pravilima pristupa i izvršenja."
      : pathname === "/primjeri-web-stranica/"
        ? "Odaberite format prema cilju, sadržaju i načinu na koji kupac donosi odluku — ne samo prema vizuelnom stilu."
        : "Sažeto o tome ko smo, gdje radimo i kako izgleda prvi korak saradnje.";

  const answers = entries.map(([question, answer]) =>
    `<article class="dx-answer"><h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p></article>`
  ).join("\n");

  const extra = pathname === "/growthos.html"
    ? `<div class="dx-answer-table-wrap"><table class="dx-answer-table"><caption>Brza procjena: kada GrowthOS ima smisla</caption><thead><tr><th>Situacija</th><th>Tipičan sljedeći korak</th></tr></thead><tbody><tr><td>Podaci su u više tabela i alata</td><td>Centralizovati CRM i operativni pregled</td></tr><tr><td>Tim ručno prepisuje statuse</td><td>Povezati projekte, zadatke i automatizacije</td></tr><tr><td>Znanje ostaje u porukama i glavama ljudi</td><td>Dodati Second Brain sloj i izvore</td></tr></tbody></table></div>`
    : pathname === "/second-brain-os.html"
      ? `<div class="dx-answer-table-wrap"><table class="dx-answer-table"><caption>Second Brain OS naspram generičkog chatbota</caption><thead><tr><th>Signal</th><th>Second Brain OS</th><th>Generički chatbot</th></tr></thead><tbody><tr><td>Poslovni izvori</td><td>Odobreni i povezani</td><td>Nisu podrazumijevano povezani</td></tr><tr><td>Trag izvora</td><td>Predviđen u odgovoru</td><td>Zavisi od alata</td></tr><tr><td>Osjetljive akcije</td><td>Mogu čekati potvrdu</td><td>Nema poslovnog workflowa po defaultu</td></tr></tbody></table></div>`
      : pathname === "/primjeri-web-stranica/"
        ? `<ul class="dx-answer-list"><li><strong>Landing:</strong> jedna ponuda, jedan cilj i brz put do upita.</li><li><strong>Prezentacijska stranica:</strong> više usluga, povjerenje i organska vidljivost.</li><li><strong>E-commerce:</strong> katalog, kupovina, plaćanje i postprodajni tok.</li><li><strong>Cinematic:</strong> premium storytelling kada je doživljaj dio pozicioniranja.</li></ul>`
        : "";

  return `<section id="dx-answer-section" class="dx-seo-section" aria-labelledby="dx-answer-title"><p class="dx-seo-kicker">Brzi odgovori</p><h2 id="dx-answer-title">Pitanja koja vrijedi riješiti prije odluke</h2><p class="dx-seo-intro">${escapeHtml(intro)}</p><div class="dx-answer-grid">${answers}</div>${extra}</section>`;
}

function trustMarkup(pathname) {
  if (pathname !== "/kontakt.html") return "";
  return `<section id="dx-trust-context" class="dx-seo-section" aria-labelledby="dx-trust-title"><p class="dx-seo-kicker">Prije nego pošaljete upit</p><h2 id="dx-trust-title">Jasan kontakt, opseg i sljedeći korak</h2><p class="dx-seo-intro">Digital X je baziran u Sarajevu i radi online sa klijentima u Bosni i Hercegovini, regionu i dijaspori. Upit možete poslati emailom, telefonom, WhatsAppom ili kontakt formom.</p><ul class="dx-answer-list"><li><strong>Odgovor:</strong> upite primamo 24/7, a odgovor je obično u roku od 24 sata.</li><li><strong>Radno vrijeme:</strong> ponedjeljak–petak, 09–17h.</li><li><strong>Prvi korak:</strong> kratko definišemo cilj, trenutno stanje i prioritet prije ponude.</li><li><strong>Transparentnost:</strong> opseg, faze i početna cijena potvrđuju se prije početka rada.</li></ul><p>Za dodatni kontekst pogledajte <a href="/o-nama.html">O nama</a>, <a href="/projekti/">projekte</a>, <a href="/privatnost.html">politiku privatnosti</a> i <a href="/uslovi.html">uslove korištenja</a>.</p></section>`;
}

function styleMarkup() {
  return `<style id="dx-site-seo-style">
.dx-seo-section{position:relative;box-sizing:border-box;max-width:1180px;margin:0 auto;padding:72px 24px;color:inherit}.dx-seo-section *{box-sizing:border-box}.dx-seo-kicker{margin:0 0 10px;font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;opacity:.72}.dx-seo-section h2{margin:0 0 14px;font-size:clamp(1.8rem,4vw,3rem);line-height:1.08}.dx-seo-intro{max-width:78ch;margin:0 0 30px;line-height:1.7;opacity:.82}.dx-answer-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.dx-answer{padding:22px;border:1px solid color-mix(in srgb,currentColor 15%,transparent);border-radius:16px;background:color-mix(in srgb,currentColor 4%,transparent)}.dx-answer h3{margin:0 0 8px;font-size:1.08rem}.dx-answer p{margin:0;line-height:1.65;opacity:.82}.dx-answer-list{max-width:850px;margin:28px 0 0;padding-left:1.25rem}.dx-answer-list li{margin:.55rem 0;line-height:1.6}.dx-answer-table-wrap{overflow-x:auto;margin-top:28px}.dx-answer-table{width:100%;border-collapse:collapse;min-width:620px}.dx-answer-table caption{text-align:left;font-weight:700;margin-bottom:10px}.dx-answer-table th,.dx-answer-table td{text-align:left;padding:12px 14px;border:1px solid color-mix(in srgb,currentColor 16%,transparent);vertical-align:top}.dx-seo-section a{color:inherit;text-decoration:underline;text-underline-offset:3px}@media(max-width:720px){.dx-seo-section{padding:54px 20px}.dx-answer-grid{grid-template-columns:1fr}}
</style>`;
}

export function enhanceSiteHtml(source, pathname) {
  if (typeof source !== "string" || !pathname) return source;
  let html = source;

  html = fixKnownBrokenAssets(html, pathname);
  html = removeEmptyHeadings(html);
  html = normalizeHeadingHierarchy(html);
  html = addResponsiveImageCandidates(html);

  html = removeBlockById(html, "script", "dx-site-schema");
  html = removeBlockById(html, "style", "dx-site-seo-style");
  html = html.replace(/<section\b[^>]*\bid=["']dx-answer-section["'][^>]*>[\s\S]*?<\/section>/i, "");
  html = html.replace(/<section\b[^>]*\bid=["']dx-trust-context["'][^>]*>[\s\S]*?<\/section>/i, "");

  html = insertBeforeHeadClose(html, styleMarkup());
  html = insertBeforeHeadClose(html, `<script id="dx-site-schema" type="application/ld+json">${json(routeEntities(pathname))}</script>`);

  const visible = `${answerMarkup(pathname)}${trustMarkup(pathname)}`;
  if (visible) html = insertBeforeMainClose(html, visible);
  return html;
}

export const SITE_SEO_PATHS = Object.freeze([
  "/",
  "/blog/",
  "/kontakt.html",
  "/growthos.html",
  "/second-brain-os.html",
  "/primjeri-web-stranica/",
  "/o-nama.html",
]);

export function shouldEnhanceSitePath(pathname) {
  return SITE_SEO_PATHS.includes(pathname) || pathname.startsWith("/shop/");
}
