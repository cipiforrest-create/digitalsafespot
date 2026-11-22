import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { load } from 'cheerio';
import { withEuro } from '../localize-pages.mjs';
import { EDITORIAL_POLICY_URL, ROBOTS_INDEX_CONTENT, SAME_AS } from '../../lib/entity-profile.mjs';
import { localizedServices } from './localized-services.mjs';
import { localizedGuides } from './localized-guides.mjs';

const origin = 'https://digital-x-marketing.com';
const published = '2026-11-21';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'dj').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const returnPolicy = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: ['BA', 'HR', 'RS', 'ME', 'DE', 'AT', 'CH'],
  returnPolicyCountry: 'BA',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 15,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/FreeReturn',
  refundType: 'https://schema.org/FullRefund',
  merchantReturnLink: origin + '/otkazivanje-povrat.html',
};
const digitalShipping = {
  '@type': 'OfferShippingDetails',
  shippingRate: { '@type': 'MonetaryAmount', value: '0.00', currency: 'BAM' },
  shippingDestination: ['BA', 'HR', 'RS', 'ME', 'DE', 'AT', 'CH'].map(addressCountry => ({ '@type': 'DefinedRegion', addressCountry })),
  deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 3, unitCode: 'DAY' },
    transitTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 14, unitCode: 'DAY' },
  },
};
const organization = {
  '@type': 'Organization',
  '@id': origin + '/#organization',
  name: 'Digital X',
  legalName: 'Digital X Marketing',
  url: origin + '/',
  logo: origin + '/assets/icon-512.png',
  founder: { '@type': 'Organization', name: 'Digital X' },
  publishingPrinciples: EDITORIAL_POLICY_URL,
  hasMerchantReturnPolicy: returnPolicy,
  sameAs: [...SAME_AS],
  address: { '@type': 'PostalAddress', streetAddress: 'Stupska bb', addressLocality: 'Sarajevo', postalCode: '71000', addressCountry: 'BA' },
  geo: { '@type': 'GeoCoordinates', latitude: 43.8419, longitude: 18.3245 },
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '17:00' }],
  priceRange: '199 KM - 3490 KM',
};

const UI = {
  en: {
    skip: 'Skip to content',
    nav: [['/en/usluge/', 'Services'], ['/en/cjenovnik/', 'Price list'], ['/en/projekti/', 'Work'], ['/en/primjeri-web-stranica/', 'Examples'], ['/en/shop/', 'Shop'], ['/en/blog/', 'Blog'], ['/en/usluge/x-signal/', 'Audit'], ['/en/kontakt.html', 'Contact']],
    consult: 'Free consultation',
    audit: 'Free website audit',
    toc: 'On this page',
    faq: 'Frequently asked questions',
    related: 'Related',
    answerLabel: 'SHORT ANSWER',
    byline: 'Prepared and reviewed by',
    teamName: 'Digital X SEO & Web Team',
    methodology: 'Editorial methodology',
    updated: 'updated 21 Nov 2026',
    ctaEyebrow: 'NEXT STEP',
    ctaTitle: 'Want to apply this to your business?',
    ctaBody: 'The free audit checks your existing website. In a free consultation you get a clear first-step proposal — with no obligation.',
    tagline: 'Web. Marketing. Intelligence.',
    blogHeading: 'Guides',
    exploreHeading: 'Explore',
    talkHeading: 'Let’s talk',
    about: 'About us',
    team: 'Team & practices',
    editorial: 'Editorial policy',
    facts: 'Facts about Digital X',
    glossary: 'Glossary (SEO, AEO, GEO, AI)',
    privacy: 'Privacy',
    terms: 'Terms of use',
    cookies: 'Cookies',
    home: 'Home',
    ogLocale: 'en_US',
    offerNote: period => `Starting price, ${period}.`,
  },
  de: {
    skip: 'Zum Inhalt springen',
    nav: [['/de/usluge/', 'Leistungen'], ['/de/cjenovnik/', 'Preisliste'], ['/de/projekti/', 'Projekte'], ['/de/primjeri-web-stranica/', 'Beispiele'], ['/de/shop/', 'Shop'], ['/de/blog/', 'Blog'], ['/de/usluge/x-signal/', 'Analyse'], ['/de/kontakt.html', 'Kontakt']],
    consult: 'Kostenlose Beratung',
    audit: 'Kostenlose Website-Analyse',
    toc: 'Auf dieser Seite',
    faq: 'Häufige Fragen',
    related: 'Verwandte Themen',
    answerLabel: 'KURZE ANTWORT',
    byline: 'Erstellt und geprüft von',
    teamName: 'Digital X SEO- & Web-Team',
    methodology: 'Redaktionsmethodik',
    updated: 'aktualisiert am 21.11.2026',
    ctaEyebrow: 'NÄCHSTER SCHRITT',
    ctaTitle: 'Möchten Sie das für Ihr Unternehmen umsetzen?',
    ctaBody: 'Die kostenlose Analyse prüft Ihre bestehende Website. In der kostenlosen Beratung erhalten Sie einen klaren ersten Schritt — unverbindlich.',
    tagline: 'Web. Marketing. Intelligenz.',
    blogHeading: 'Ratgeber',
    exploreHeading: 'Entdecken',
    talkHeading: 'Kontakt',
    about: 'Über uns',
    team: 'Team & Fachbereiche',
    editorial: 'Redaktionsrichtlinie',
    facts: 'Fakten über Digital X',
    glossary: 'Glossar (SEO, AEO, GEO, KI)',
    privacy: 'Datenschutz',
    terms: 'Nutzungsbedingungen',
    cookies: 'Cookies',
    home: 'Startseite',
    ogLocale: 'de_DE',
    offerNote: period => `Einstiegspreis, ${period}.`,
  },
};

const allEntries = [...localizedServices, ...localizedGuides];
export const localizedZnanjePaths = new Set(allEntries.map(e => e.path));

function renderLocalizedPage(entry, lang, localizedRoutes) {
  const u = UI[lang];
  const d = entry[lang];
  const path = entry.path;
  const canonical = `${origin}/${lang}${path}`;
  const bsUrl = `${origin}${path}`;
  const enUrl = `${origin}/en${path}`;
  const deUrl = `${origin}/de${path}`;
  const logo = `<a class="brand" href="/${lang}/" aria-label="Digital X ${u.home}"><img class="brand-logo" src="/assets/brand/digital-x-header.webp" width="371" height="96" alt="" role="presentation" decoding="async"></a>`;
  const navLinks = u.nav.map(([h, n]) => `<a class="nav-item" href="${h}">${esc(n)}</a>`).join('');
  const header = `<a class="skip" href="#main">${esc(u.skip)}</a><header class="zn-header">${logo}<nav class="zn-nav" aria-label="Main navigation">${navLinks}</nav><nav class="zn-lang" aria-label="Language"><a href="${path}" lang="bs" hreflang="bs">BS</a><a href="/en${path}" lang="en" hreflang="en"${lang === 'en' ? ' aria-current="true"' : ''}>EN</a><a href="/de${path}" lang="de" hreflang="de"${lang === 'de' ? ' aria-current="true"' : ''}>DE</a></nav><a class="zn-consult" href="/${lang}/kontakt.html">${esc(u.consult)} ↗</a><button class="zn-menu" aria-label="Menu" aria-expanded="false" aria-controls="zn-mobile"><span></span><span></span></button></header><nav id="zn-mobile" class="zn-mobile" aria-label="Mobile navigation" hidden>${u.nav.map(([h, n]) => `<a href="${h}">${esc(n)}</a>`).join('')}<a href="/${lang}/kontakt.html">${esc(u.consult)}</a></nav>`;
  const footer = `<footer class="zn-footer"><div>${logo}<p>${esc(u.tagline)}</p></div><div><h2>${esc(u.blogHeading)}</h2><a href="/${lang}/blog/">${esc(u.blogHeading)}</a><a href="/pojmovnik/">${esc(u.glossary)}</a></div><div><h2>${esc(u.exploreHeading)}</h2>${u.nav.map(([h, n]) => `<a href="${h}">${esc(n)}</a>`).join('')}</div><div><h2>${esc(u.talkHeading)}</h2><a href="mailto:marketing@digital-x-marketing.com">marketing@digital-x-marketing.com</a><a href="tel:+387644383566">+387 64 438 3566</a><a href="https://wa.me/387644383566" rel="noopener">WhatsApp</a><a href="/${lang}/o-nama.html">${esc(u.about)}</a><a href="/${lang}/tim/">${esc(u.team)}</a><a href="/${lang}/uredjivacka-politika/">${esc(u.editorial)}</a><a href="/${lang}/cinjenice/">${esc(u.facts)}</a></div><div class="zn-footer-base"><span>© 2026 Digital X Sarajevo</span><a href="/${lang}/privatnost.html">${esc(u.privacy)}</a><a href="/${lang}/uslovi.html">${esc(u.terms)}</a><a href="/${lang}/kolacici.html">${esc(u.cookies)}</a></div></footer>`;
  const cta = `<section class="zn-cta"><div><p class="eyebrow">${esc(u.ctaEyebrow)}</p><h2>${esc(u.ctaTitle)}</h2><p>${esc(u.ctaBody)}</p></div><div class="zn-cta-actions"><a class="btn btn-primary" href="/${lang}/kontakt.html">${esc(u.consult)}</a><a class="btn" href="/${lang}/usluge/x-signal/">${esc(u.audit)}</a></div></section>`;

  let body = '';
  if (entry.hub) {
    const items = localizedGuides.filter(g => g.path.startsWith('/industrije/') && g.path !== '/industrije/');
    body = `<section class="hub-hero"><div class="hub-hero-copy"><nav class="crumbs" aria-label="Breadcrumb"><a href="/${lang}/">${esc(u.home)}</a><span>/</span><span>${esc(d.crumbs[0][0])}</span></nav><p class="eyebrow">${esc(d.eyebrow)}</p><h1>${esc(d.h1)}</h1><p class="lead">${esc(d.answer)}</p></div></section><section class="hub-section"><div class="paths">${items.map(item => `<article><h2>${esc(item[lang].crumbs.at(-1)[0])}</h2><p>${esc(item[lang].desc)}</p><a class="btn btn-small" href="/${lang}${item.path}">${lang === 'de' ? 'Ansehen →' : 'Explore →'}</a></article>`).join('')}</div></section>${cta}`;
  } else {
    const toc = d.sections.map(([h]) => [h, slugify(h)]);
    const trail = [[u.home, `/${lang}/`], ...d.crumbs];
    body = `<article class="guide" style="--accent:#9fc4ff"><header class="guide-hero"><nav class="crumbs" aria-label="Breadcrumb">${trail.map(([n, h], i) => i === trail.length - 1 ? `<span>${esc(n)}</span>` : `<a href="${h}">${esc(n)}</a><span>/</span>`).join('')}</nav><p class="eyebrow">${esc(d.eyebrow)}</p><h1>${esc(d.h1)}</h1><p class="guide-meta">${esc(u.byline)}: <a href="/${lang}/tim/">${esc(u.teamName)}</a> · <a href="/${lang}/uredjivacka-politika/">${esc(u.methodology)}</a> · <time datetime="${published}">${esc(u.updated)}</time></p><div class="hub-actions"><a class="btn btn-primary" href="/${lang}/kontakt.html">${esc(u.consult)}</a><a class="btn" href="/${lang}/usluge/x-signal/">${esc(u.audit)}</a></div></header><div class="guide-layout"><aside class="guide-toc" aria-label="${esc(u.toc)}"><h2>${esc(u.toc)}</h2><ol>${toc.map(([h, id]) => `<li><a href="#${id}">${esc(h)}</a></li>`).join('')}<li><a href="#pitanja">${esc(u.faq)}</a></li></ol></aside><div class="guide-body"><div class="answer"><p class="eyebrow">${esc(u.answerLabel)}</p><p>${esc(d.answer)}</p></div>${d.sections.map(([h, html]) => `<section id="${slugify(h)}"><h2>${esc(h)}</h2>${html}</section>`).join('')}<section id="pitanja"><h2>${esc(u.faq)}</h2><div class="faq">${d.faq.map(([q, a]) => `<details><summary><h3>${esc(q)}</h3></summary><p>${esc(a)}</p></details>`).join('')}</div></section><section class="related"><h2>${esc(u.related)}</h2><div class="related-grid">${d.related.map(([h, n]) => `<a href="${h}">${esc(n)}<span aria-hidden="true">→</span></a>`).join('')}</div></section></div></div></article>${cta}`;
  }

  const crumbs = { '@type': 'BreadcrumbList', itemListElement: [[u.home, `/${lang}/`], ...d.crumbs].map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: origin + (p.startsWith(`/${lang}/`) ? p : `/${lang}${p}`) })) };
  const faqNode = d.faq?.length ? [{ '@type': 'FAQPage', mainEntity: d.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : [];
  const mainNode = entry.hub
    ? { '@type': 'CollectionPage', '@id': canonical + '#hub', url: canonical, name: d.h1, description: d.desc, inLanguage: lang, publisher: { '@id': origin + '/#organization' } }
    : entry.article
    ? { '@type': 'Article', '@id': canonical + '#article', headline: d.h1, description: d.desc, inLanguage: lang, datePublished: published, dateModified: published, keywords: d.keywords.join(', '), mainEntityOfPage: canonical, image: origin + '/media/znanje/znanje-og.jpg', author: { '@id': origin + '/#organization' }, publisher: { '@id': origin + '/#organization' }, publishingPrinciples: EDITORIAL_POLICY_URL }
    : entry.profilePage
    ? { '@type': 'ProfilePage', '@id': canonical + '#profile', url: canonical, name: d.h1, description: d.desc, inLanguage: lang, dateModified: published, mainEntity: { '@id': origin + '/#organization' } }
    : entry.about
    ? { '@type': 'AboutPage', '@id': canonical + '#about', url: canonical, name: d.h1, description: d.desc, inLanguage: lang, about: { '@id': origin + '/#organization' }, mainEntity: { '@id': origin + '/#organization' } }
    : { '@type': 'Service', '@id': canonical + '#service', name: d.serviceName, serviceType: entry.serviceType, description: d.desc, provider: { '@id': origin + '/#organization' }, areaServed: entry.areaServed, offers: entry.offers.map(([name, price, period]) => ({ '@type': 'Offer', name, price, priceCurrency: 'BAM', availability: 'https://schema.org/InStock', shippingDetails: digitalShipping, hasMerchantReturnPolicy: returnPolicy, ...(period ? { description: u.offerNote(period) } : {}) })) };

  const rawHtml = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="${ROBOTS_INDEX_CONTENT}"><meta name="theme-color" content="#050608"><title>${esc(d.title)}</title><meta name="description" content="${esc(d.desc)}"><meta name="keywords" content="${esc(d.keywords.join(', '))}"><link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="bs" href="${bsUrl}"><link rel="alternate" hreflang="en" href="${enUrl}"><link rel="alternate" hreflang="de" href="${deUrl}"><link rel="alternate" hreflang="x-default" href="${bsUrl}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="preload" href="/assets/fonts/inter-400-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/inter-400-latin-ext.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/css/fonts.css"><link rel="stylesheet" href="/znanje/assets/znanje.css"><meta property="og:type" content="${entry.article ? 'article' : 'website'}"><meta property="og:site_name" content="Digital X Sarajevo"><meta property="og:locale" content="${u.ogLocale}"><meta property="og:title" content="${esc(d.title)}"><meta property="og:description" content="${esc(d.desc)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${origin}/media/znanje/znanje-og.jpg"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': [organization, mainNode, crumbs, ...faqNode] }).replace(/</g, '\\u003c')}</script></head><body class="${entry.hub ? 'is-hub' : 'is-guide'}">${header}<main id="main">${body}</main>${footer}<script src="/znanje/assets/site.js" defer></script></body></html>`;
  return finalizeLocalizedHtml(rawHtml, lang, localizedRoutes);
}
function finalizeLocalizedHtml(rawHtml, lang, localizedRoutes) {
  const $ = load(rawHtml, { scriptingEnabled: false });
  $('body').find('*').contents().filter((_, node) => node.type === 'text' && !$(node).parents('script,style,svg,code,pre').length).each((_, node) => {
    node.data = withEuro(node.data, lang);
  });
  $('a[href^="/"]').each((_, node) => {
    const href = $(node).attr('href');
    if (!href || $(node).closest('.zn-lang').length) return;
    const [clean, hash] = href.split('#');
    const suffix = hash ? `#${hash}` : '';
    if (clean === '/usluge/izrada-web-stranica/') { $(node).attr('href', `/${lang}/landing-web.html${suffix}`); return; }
    if (clean.startsWith(`/${lang}/`)) return;
    if (localizedRoutes.has(clean) || localizedZnanjePaths.has(clean) || ['/privatnost.html', '/uslovi.html', '/kolacici.html', '/pravne-informacije.html'].includes(clean)) {
      $(node).attr('href', `/${lang}${clean}${suffix}`);
    }
  });
  return $.html();
}

export function publishLocalizedZnanje(localizedRoutes) {
  const publishedUrls = [];
  for (const entry of allEntries) {
    for (const lang of ['en', 'de']) {
      const outFile = `public/${lang}${entry.path}index.html`;
      mkdirSync(dirname(outFile), { recursive: true });
      writeFileSync(outFile, renderLocalizedPage(entry, lang, localizedRoutes));
      publishedUrls.push(`${origin}/${lang}${entry.path}`);
    }
    const bsFile = `public${entry.path}index.html`;
    if (existsSync(bsFile)) {
      const $ = load(readFileSync(bsFile, 'utf8'), { scriptingEnabled: false });
      $('link[rel="alternate"][hreflang]').remove();
      for (const [code, href] of [['bs', `${origin}${entry.path}`], ['en', `${origin}/en${entry.path}`], ['de', `${origin}/de${entry.path}`], ['x-default', `${origin}${entry.path}`]]) {
        $('head').append(`<link rel="alternate" hreflang="${code}" href="${href}">`);
      }
      $('.zn-lang a[lang="en"]').attr('href', `/en${entry.path}`);
      $('.zn-lang a[lang="de"]').attr('href', `/de${entry.path}`);
      writeFileSync(bsFile, $.html());
    }
  }
  console.log(`Localized ${allEntries.length} high-intent knowledge/service pages into EN and DE (${publishedUrls.length} URLs).`);
  return publishedUrls;
}

