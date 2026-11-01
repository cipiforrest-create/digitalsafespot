const SITE_ORIGIN = 'https://www.digital-x-marketing.com';
const LOGO_URL = `${SITE_ORIGIN}/assets/icon-512.png`;
const UPDATED_DATE = '2026-09-09';

const config = (value) => Object.freeze(value);

export const SERVICE_ROUTES = new Map([
  ['/usluge/ai-automatizacija/', config({
    sourcePath: '/landing-ai.html',
    title: 'AI automatizacija za firme | Digital X Sarajevo',
    description: 'AI automatizacija za firme: chatbot 24/7, booking, podsjetnici, leadovi, recenzije i povezivanje CRM-a. Demo prije kupovine. Digital X Sarajevo.',
    h1Html: 'AI automatizacija za firme koja <span class="grad-text">odgovara, zakazuje i prati leadove.</span>',
    serviceType: 'AI automation and chatbot',
    image: '/media/live/service-automation.webp',
    defaultAlt: 'AI automatizacija za firme — Digital X',
    faqs: [
      ['Šta Digital X može automatizovati?', 'Upite, odgovore kupcima, booking, podsjetnike, CRM unos, recenzije, email sekvence i izvještavanje. Opseg se bira prema procesu koji trenutno troši najviše vremena.'],
      ['Da li AI asistent radi 24/7?', 'Da. Asistent može odgovarati na odobrena pitanja u bilo koje vrijeme, prikupljati kontakt i predati razgovor čovjeku kada korisnik to traži ili odgovor nije siguran.'],
      ['Može li se povezati sa postojećim alatima?', 'Da, kada alat ima odgovarajući API ili integraciju. Prije izvedbe se definišu izvori podataka, dozvoljene radnje i gdje se čuva evidencija.'],
      ['Kako počinje projekat automatizacije?', 'Počinje mapiranjem jednog konkretnog procesa i mjerljivog cilja. Nakon toga se pravi demo ili prva faza prije širenja na dodatne tokove.'],
    ],
  })],
  ['/usluge/seo-aeo-geo/', config({
    sourcePath: '/landing-seo.html',
    title: 'SEO, GEO i AEO optimizacija | Digital X Sarajevo',
    description: 'SEO, Google Maps/GEO i AEO optimizacija za firme: tehnički SEO, sadržaj, strukturirani podaci, lokalna vidljivost i mjerenje rezultata.',
    h1Html: 'SEO, GEO i AEO: budite vidljivi na <span class="grad-text">Googleu, mapama i AI pretrazi.</span>',
    serviceType: 'SEO, local SEO, GEO and AEO optimization',
    image: '/media/live/service-seo.webp',
    defaultAlt: 'SEO, GEO i AEO optimizacija — Digital X',
    faqs: [
      ['Šta uključuje SEO, GEO i AEO optimizacija?', 'Tehnički SEO, sadržaj i interno linkanje, strukturirane podatke, lokalne Google signale i sadržaj oblikovan tako da ga klasični i AI sistemi mogu lakše razumjeti.'],
      ['Da li AEO zamjenjuje klasični SEO?', 'Ne. AEO se gradi na kvalitetnom SEO temelju. Jasna struktura, autoritet, odgovori i schema pomažu i klasičnoj pretrazi i AI sistemima.'],
      ['Da li radite Google Maps i lokalnu vidljivost?', 'Da. Lokalna optimizacija uključuje Google Business Profile kada je firma podobna, konzistentne poslovne podatke, kategorije, usluge, recenzije i lokalne landing signale.'],
      ['Kako mjerite rezultat?', 'Search Console, GA4 i poslovne konverzije koristimo zajedno: pratimo upite, landing stranice, pozicije, organski promet i stvarne lead događaje.'],
    ],
  })],
  ['/usluge/izrada-web-stranica/', config({
    sourcePath: '/landing-web.html',
    // EN/DE translations of this service still live at their legacy URLs.
    alternates: { en: '/en/landing-web.html', de: '/de/landing-web.html' },
    title: 'Izrada web stranica Sarajevo | Digital X',
    description: 'Izrada brzih, modernih web stranica u Sarajevu i za klijente u regionu: mobilni dizajn, SEO osnova, konverzije, analitika i podrška.',
    h1Html: 'Izrada web stranica koje <span class="grad-text">pretvaraju posjete u upite.</span>',
    serviceType: 'Web design and web development',
    image: '/media/live/service-web.webp',
    defaultAlt: 'Izrada web stranica Sarajevo — Digital X',
    faqs: [
      ['Koliko traje izrada web stranice?', 'Tipična prezentacijska stranica može biti spremna za 7–14 radnih dana nakon što su sadržaj i materijali dostupni. Složeniji projekti se dijele u faze.'],
      ['Da li je SEO uključen u izradu?', 'Tehnička SEO osnova, semantična struktura, metadata, sitemap, schema i mjerenje su dio ispravne izrade. Kontinuirani SEO sadržaj i rast ugovaraju se prema cilju.'],
      ['Da li stranica radi dobro na mobitelu?', 'Da. Dizajn i interakcije se provjeravaju za mobilne uređaje, uz kontrolu slike, fontova, animacija i učitavanja kako bi iskustvo ostalo brzo.'],
      ['Možete li povezati forme, CRM i analitiku?', 'Da. Forme se mogu povezati sa emailom, CRM-om i automatizacijama, a GA4/GTM se postavljaju da mjere stvarne lead događaje umjesto samo posjeta.'],
    ],
  })],
  ['/usluge/google-business-profile/', config({
    sourcePath: '/google-business-profile.html',
    title: 'Google Business Profile optimizacija | Digital X',
    description: 'Google Business Profile optimizacija za firme koje žele više vidljivosti na Google Mapsu: kategorije, usluge, recenzije, sadržaj i mjerenje poziva i upita.',
    h1Html: 'Google Business Profile optimizacija za <span class="grad-text">više poziva, ruta i upita.</span>',
    serviceType: 'Google Business Profile optimization and local SEO',
    image: '/media/live/service-seo.webp',
    defaultAlt: 'Google Business Profile optimizacija — Digital X',
    faqs: [
      ['Kome je Google Business Profile namijenjen?', 'Firmama koje ispunjavaju Googleova pravila za lokaciju ili service-area poslovanje. Čisto online biznis bez kontakta s klijentima uživo obično nije podoban.'],
      ['Šta optimizujete na profilu?', 'Primarnu i dodatne kategorije, usluge, opis, radno vrijeme, fotografije, linkove, objave, pitanja i odgovore te konzistentnost podataka sa web stranicom.'],
      ['Da li možete garantovati prvo mjesto na Google Mapsu?', 'Ne. Lokalni rezultati zavise od relevantnosti, udaljenosti i autoriteta. Cilj je ukloniti tehničke i sadržajne slabosti i povećati kvalitet signala koje možemo kontrolisati.'],
      ['Kako pratite rezultate Google Business profila?', 'Pratimo klikove prema webu, pozive i druge dostupne interakcije, lokalne upite u Search Consoleu i lead događaje u GA4/GTM-u.'],
    ],
  })],
]);

const LEGACY_TO_CLEAN = new Map(
  [...SERVICE_ROUTES.entries()].map(([cleanPath, route]) => [route.sourcePath, cleanPath]),
);

const cleanPath = (pathname = '/') => {
  const base = String(pathname || '/').split('?')[0].split('#')[0];
  if (base === '/') return '/';
  return base.endsWith('/') ? base : `${base}/`;
};

export function sourcePathForService(pathname) {
  return SERVICE_ROUTES.get(cleanPath(pathname))?.sourcePath || null;
}

export function cleanPathForLegacy(pathname) {
  return LEGACY_TO_CLEAN.get(String(pathname || '').split('?')[0].split('#')[0]) || null;
}

export function isServicePath(pathname) {
  return SERVICE_ROUTES.has(cleanPath(pathname));
}

export function allServicePaths() {
  return [...SERVICE_ROUTES.keys()];
}

function absolute(value) {
  return new URL(value, `${SITE_ORIGIN}/`).href;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function json(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function insertBeforeHeadClose(html, markup) {
  return /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${markup}\n</head>`) : `${markup}\n${html}`;
}

function insertBeforeMainClose(html, markup) {
  if (/<\/main>/i.test(html)) return html.replace(/<\/main>/i, `${markup}\n</main>`);
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${markup}\n</body>`);
  return `${html}\n${markup}`;
}

function stripSeoHead(html) {
  return String(html)
    .replace(/\s*<title>[\s\S]*?<\/title>/i, '')
    .replace(/\s*<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/gi, '')
    .replace(/\s*<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi, '')
    .replace(/\s*<meta\b(?=[^>]*\bproperty=["']og:(?:type|url|title|description|image)["'])[^>]*>/gi, '')
    .replace(/\s*<meta\b(?=[^>]*\bname=["']twitter:(?:card|title|description|image)["'])[^>]*>/gi, '')
    .replace(/\s*<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/gi, '');
}

function alternateMarkup(pathname, route) {
  if (!route.alternates) return [];
  const bs = absolute(pathname);
  return [
    `<link rel="alternate" hreflang="bs" href="${bs}">`,
    ...Object.entries(route.alternates).map(([lang, href]) => `<link rel="alternate" hreflang="${lang}" href="${absolute(href)}">`),
    `<link rel="alternate" hreflang="x-default" href="${bs}">`,
  ];
}

function metadataMarkup(pathname, route) {
  const canonical = absolute(pathname);
  const image = absolute(route.image);
  return [
    `<title>${escapeHtml(route.title)}</title>`,
    `<meta name="description" content="${escapeHtml(route.description)}">`,
    `<link rel="canonical" href="${canonical}">`,
    ...alternateMarkup(pathname, route),
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${escapeHtml(route.title)}">`,
    `<meta property="og:description" content="${escapeHtml(route.description)}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(route.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(route.description)}">`,
    `<meta name="twitter:image" content="${image}">`,
  ].join('\n');
}

function decodeHtmlText(value) {
  return String(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractVisibleFaqs(html) {
  const section = String(html).match(/<section\b(?=[^>]*\bid=["']faq["'])[^>]*>([\s\S]*?)<\/section>/i)?.[1];
  if (!section) return [];
  const entries = [];
  const pair = /<h3\b[^>]*>([\s\S]*?)<\/h3>\s*<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = pair.exec(section))) {
    const name = decodeHtmlText(match[1]);
    const text = decodeHtmlText(match[2]);
    if (name && text) entries.push([name, text]);
  }
  return entries;
}

function normalizeRelativeAssetUrls(html) {
  return String(html)
    .replace(/\bsrc=(["'])(?!\/|https?:|data:|blob:)((?:js|css|assets|media|fonts)\/[^"']+)\1/gi, (_m, quote, path) => `src=${quote}/${path}${quote}`)
    .replace(/\bhref=(["'])(?!\/|https?:|mailto:|tel:|#)((?:css|assets|media|fonts)\/[^"']+)\1/gi, (_m, quote, path) => `href=${quote}/${path}${quote}`);
}

function schemaMarkup(pathname, route, faqs = route.faqs) {
  const canonical = absolute(pathname);
  const image = absolute(route.image);
  const organizationId = `${SITE_ORIGIN}/#organization`;
  const localBusinessId = `${SITE_ORIGIN}/#local-business`;
  const websiteId = `${SITE_ORIGIN}/#website`;
  const serviceId = `${canonical}#service`;
  const graph = [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: 'Digital X',
      alternateName: 'Digital X Sarajevo',
      url: `${SITE_ORIGIN}/`,
      email: 'digital.x.agency.ba@gmail.com',
      telephone: '+387644383566',
      logo: { '@type': 'ImageObject', url: LOGO_URL },
      image: LOGO_URL,
      sameAs: ['https://www.instagram.com/digitalxmarketing.ba'],
    },
    {
      '@type': 'LocalBusiness',
      '@id': localBusinessId,
      name: 'Digital X Sarajevo',
      url: `${SITE_ORIGIN}/`,
      parentOrganization: { '@id': organizationId },
      logo: { '@type': 'ImageObject', '@id': `${organizationId}-logo`, url: LOGO_URL },
      address: { '@type': 'PostalAddress', addressLocality: 'Sarajevo', addressCountry: 'BA' },
      areaServed: ['BA', 'HR', 'RS', 'ME', 'DE', 'AT', 'CH'],
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      name: 'Digital X',
      url: `${SITE_ORIGIN}/`,
      publisher: { '@id': organizationId },
      inLanguage: 'bs',
    },
    {
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: route.title,
      description: route.description,
      isPartOf: { '@id': websiteId },
      about: { '@id': serviceId },
      primaryImageOfPage: { '@type': 'ImageObject', url: image },
      dateModified: UPDATED_DATE,
      inLanguage: 'bs',
    },
    {
      '@type': 'Service',
      '@id': serviceId,
      name: route.title.replace(/\s*\|.*$/, ''),
      serviceType: route.serviceType,
      description: route.description,
      url: canonical,
      image,
      provider: { '@id': organizationId },
      areaServed: ['BA', 'HR', 'RS', 'ME', 'DE', 'AT', 'CH'],
      mainEntityOfPage: { '@id': `${canonical}#webpage` },
    },
    {
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      url: canonical,
      inLanguage: 'bs',
      mainEntity: faqs.map(([name, text]) => ({
        '@type': 'Question',
        name,
        acceptedAnswer: { '@type': 'Answer', text },
      })),
    },
  ];
  return `<script id="dx-service-schema" type="application/ld+json">${json({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
}

function replaceFirstH1(html, route) {
  const replacement = `<h1>${route.h1Html}</h1>`;
  if (/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html)) {
    return html.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/i, replacement);
  }
  return html.replace(/<main\b[^>]*>/i, (tag) => `${tag}\n${replacement}`);
}

function addMissingImageAlts(html, route) {
  return String(html).replace(/<img\b[^>]*>/gi, (tag) => {
    if (/\balt\s*=/i.test(tag)) return tag;
    return tag.replace(/\s*\/?>$/, (ending) => ` alt="${escapeHtml(route.defaultAlt)}"${ending}`);
  });
}

function setDataAttribute(tag, name, value) {
  if (new RegExp(`\\b${name}\\s*=`, 'i').test(tag)) return tag;
  return tag.replace(/>$/, ` ${name}="${value}">`);
}

function decorateTracking(html) {
  let result = String(html);
  result = result.replace(/<a\b[^>]*\bhref=["']https:\/\/audit\.digital-x-marketing\.com\/?[^"']*["'][^>]*>/gi, (tag) => setDataAttribute(tag, 'data-track-cta', 'audit'));
  result = result.replace(/<a\b[^>]*\bhref=["']mailto:[^"']+["'][^>]*>/gi, (tag) => setDataAttribute(tag, 'data-track-contact', 'email'));
  result = result.replace(/<a\b[^>]*\bhref=["']tel:[^"']+["'][^>]*>/gi, (tag) => setDataAttribute(tag, 'data-track-contact', 'phone'));
  result = result.replace(/<a\b[^>]*\bhref=["']https?:\/\/(?:wa\.me|api\.whatsapp\.com)[^"']*["'][^>]*>/gi, (tag) => setDataAttribute(tag, 'data-track-contact', 'whatsapp'));
  result = result.replace(/<form\b(?=[^>]*\bclass=["'][^"']*\blead-form\b[^"']*["'])[^>]*>/gi, (tag) => setDataAttribute(tag, 'data-track-form', 'lead'));
  result = result.replace(/<button\b(?=[^>]*\btype=["']submit["'])[^>]*>/gi, (tag) => setDataAttribute(tag, 'data-track-cta', 'lead-submit'));
  return result;
}

export function replaceLegacyServiceLinks(source) {
  let html = String(source);
  for (const [legacy, clean] of LEGACY_TO_CLEAN.entries()) {
    const legacyEscaped = legacy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html
      .replace(new RegExp(`(["'])${legacyEscaped}(["'#?])`, 'g'), `$1${clean}$2`)
      .replaceAll(`${SITE_ORIGIN}${legacy}`, `${SITE_ORIGIN}${clean}`);
  }
  return html;
}

function relatedServicesMarkup(pathname) {
  const items = [...SERVICE_ROUTES.entries()]
    .filter(([path]) => path !== pathname)
    .map(([path, route]) => `<a class="card" href="${path}"><h3>${escapeHtml(route.title.replace(/\s*\|.*$/, ''))}</h3><p>${escapeHtml(route.description)}</p></a>`)
    .join('\n');
  return `<section class="dx-related-services" aria-labelledby="dx-related-services-title"><div class="container center"><h2 class="sec-title" id="dx-related-services-title">Povezane usluge Digital X</h2><div class="grid g2" style="text-align:left;margin-top:30px">${items}</div><p style="margin-top:28px"><a href="/blog/">Praktični vodiči i odgovori →</a></p></div></section>`;
}

export function injectTrackingFallback(source) {
  const html = String(source);
  if (/\/js\/tracking-fallback\.js/i.test(html)) return html;
  const script = '<script type="module" src="/js/tracking-fallback.js"></script>';
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${script}\n</body>`);
  return `${html}\n${script}`;
}

export function enhanceServiceHtml(source, pathname) {
  const normalized = cleanPath(pathname);
  const route = SERVICE_ROUTES.get(normalized);
  if (!route || typeof source !== 'string') return source;
  let html = stripSeoHead(source);
  html = normalizeRelativeAssetUrls(html);
  const visibleFaqs = extractVisibleFaqs(html);
  html = insertBeforeHeadClose(html, `${metadataMarkup(normalized, route)}\n${schemaMarkup(normalized, route, visibleFaqs.length ? visibleFaqs : route.faqs)}`);
  html = replaceFirstH1(html, route);
  html = addMissingImageAlts(html, route);
  html = replaceLegacyServiceLinks(html);
  html = decorateTracking(html);
  if (!/\bdx-related-services\b/i.test(html)) html = insertBeforeMainClose(html, relatedServicesMarkup(normalized));
  html = injectTrackingFallback(html);
  return html;
}
