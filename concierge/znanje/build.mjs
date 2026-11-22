// Generates the Blog hub (/znanje/) and its guides as static HTML.
// Runs from the repo root, before the site is copied into public/.
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { visualSrc } from '../visual-pages.mjs';
import { EDITORIAL_POLICY_URL, ROBOTS_INDEX_CONTENT, SAME_AS } from '../../lib/entity-profile.mjs';
const { posts } = createRequire(import.meta.url)('../../.concierge/catalogue.cjs');
import { origin, published, stages, clusters, paths, guides, hubFaq } from './content.mjs';
import { cities } from './cities.mjs';
import { landings, industryHub } from './landings.mjs';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const slugify = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'dj').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const url = g => `/znanje/${g.slug}/`;
const cluster = id => clusters.find(c => c.id === id);
const stageIndex = id => stages.findIndex(s => s[0] === id);
const guide = slug => { const g = guides.find(x => x.slug === slug); if (!g) throw new Error('Unknown guide ' + slug); return g; };

const nav = [['/usluge/', 'Usluge'], ['/cjenovnik/', 'Cjenovnik'], ['/projekti/', 'Radovi'], ['/primjeri-web-stranica/', 'Primjeri'], ['/shop/', 'Shop'], ['/blog/', 'Blog'], ['/usluge/x-signal/', 'Analiza'], ['/kontakt.html', 'Kontakt']];
const logo = `<a class="brand" href="/" aria-label="Digital X početna"><img class="brand-logo" src="/assets/brand/digital-x-header.webp" width="371" height="96" alt="" role="presentation" decoding="async"></a>`;
// Same header as the homepage: the floating bar, the same menu, the BS/EN/DE switch and the consultation button.
const header = path => {
  const inBlog = path === '/blog/' || path.startsWith('/znanje/');
  const lang = code => path === '/blog/' ? `/${code}/blog/` : `/${code}/`;
  const links = nav.map(([h, n]) => `<a class="nav-item" href="${h}"${h === '/blog/' && inBlog ? ' aria-current="page"' : ''}>${n}</a>`).join('');
  return `<a class="skip" href="#main">Preskoči na sadržaj</a><header class="zn-header">${logo}<nav class="zn-nav" aria-label="Glavna navigacija">${links}</nav><nav class="zn-lang" aria-label="Jezik"><a href="${path}" lang="bs" hreflang="bs" aria-current="true">BS</a><a href="${lang('en')}" lang="en" hreflang="en" aria-label="English">EN</a><a href="${lang('de')}" lang="de" hreflang="de" aria-label="Deutsch">DE</a></nav><a class="zn-consult" href="/kontakt.html">Besplatne konzultacije ↗</a><button class="zn-menu" aria-label="Otvori navigaciju" aria-expanded="false" aria-controls="zn-mobile"><span></span><span></span></button></header><nav id="zn-mobile" class="zn-mobile" aria-label="Mobilna navigacija" hidden>${nav.map(([h, n]) => `<a href="${h}">${n}</a>`).join('')}<a href="/kontakt.html">Besplatne konzultacije</a></nav>`;
};
const footer = `<footer class="zn-footer"><div>${logo}<p>Web. Marketing. Inteligencija.</p></div><div><h2>Blog</h2>${clusters.map(c => `<a href="/blog/#${c.id}">${esc(c.name)}</a>`).join('')}<a href="/pojmovnik/">Pojmovnik (SEO, AEO, GEO, AI)</a></div><div><h2>Istražite</h2>${nav.map(([h, n]) => `<a href="${h}">${n}</a>`).join('')}</div><div><h2>Razgovarajmo</h2><a href="mailto:marketing@digital-x-marketing.com">marketing@digital-x-marketing.com</a><a href="tel:+387644383566">+387 64 438 3566</a><a href="https://wa.me/387644383566" rel="noopener">WhatsApp</a><a href="/o-nama.html">O nama</a><a href="/tim/">Tim i prakse</a><a href="/uredjivacka-politika/">Urednička politika</a><a href="/cinjenice/">Činjenice o Digital X</a></div><div class="zn-footer-base"><span>© 2026 Digital X Sarajevo</span><a href="/privatnost.html">Privatnost</a><a href="/uslovi.html">Uslovi korištenja</a><a href="/kolacici.html">Kolačići</a></div></footer>`;

const returnPolicy = { '@type': 'MerchantReturnPolicy', applicableCountry: ['BA', 'HR', 'RS', 'ME', 'DE', 'AT', 'CH'], returnPolicyCountry: 'BA', returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: 15, returnMethod: 'https://schema.org/ReturnByMail', returnFees: 'https://schema.org/FreeReturn', refundType: 'https://schema.org/FullRefund', merchantReturnLink: origin + '/otkazivanje-povrat.html' };
const organization = { '@type': 'Organization', '@id': origin + '/#organization', name: 'Digital X', legalName: 'Digital X Marketing', url: origin + '/', logo: origin + '/assets/icon-512.png', founder: { '@type': 'Organization', name: 'Digital X' }, publishingPrinciples: EDITORIAL_POLICY_URL, hasMerchantReturnPolicy: returnPolicy, sameAs: [...SAME_AS], address: { '@type': 'PostalAddress', streetAddress: 'Stupska bb', addressLocality: 'Sarajevo', postalCode: '71000', addressCountry: 'BA' }, geo: { '@type': 'GeoCoordinates', latitude: 43.8419, longitude: 18.3245 }, openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '17:00' }], priceRange: '199 KM - 3490 KM' };
const faqSchema = faq => ({ '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const crumbs = items => ({ '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: origin + path })) });

function page({ path, title, desc, keywords, image, preload = '', type, schema, body, scripts = '', bodyClass = '' }) {
  const canonical = origin + path;
  return `<!DOCTYPE html><html lang="bs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="${ROBOTS_INDEX_CONTENT}"><meta name="theme-color" content="#050608">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">${keywords ? `<meta name="keywords" content="${esc(keywords.join(', '))}">` : ''}
<link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="bs" href="${canonical}"><link rel="alternate" hreflang="x-default" href="${canonical}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/inter-400-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/inter-400-latin-ext.woff2" as="font" type="font/woff2" crossorigin>${preload}
<link rel="stylesheet" href="/css/fonts.css"><link rel="stylesheet" href="/znanje/assets/znanje.css">
<meta property="og:type" content="${type}"><meta property="og:site_name" content="Digital X Sarajevo"><meta property="og:locale" content="bs_BA"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${origin + image}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${origin + image}">
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': [organization, ...schema] }).replace(/</g, '\\u003c')}</script>
</head><body class="${bodyClass}">${header(path)}<main id="main">${body}</main>${footer}<script src="/znanje/assets/site.js" defer></script>${scripts}</body></html>`;
}

const faqHtml = faq => `<div class="faq">${faq.map(([q, a]) => `<details><summary><h3>${esc(q)}</h3></summary><p>${esc(a)}</p></details>`).join('')}</div>`;
const cta = `<section class="zn-cta"><div><p class="eyebrow">SLJEDEĆI KORAK</p><h2>Želite ovo primijeniti na svoju firmu?</h2><p>Besplatna analiza provjerava vašu postojeću stranicu. U besplatnim konsultacijama dobijate prijedlog prvog koraka — bez obaveze.</p></div><div class="zn-cta-actions"><a class="btn btn-primary" href="/kontakt.html">Besplatne konzultacije</a><a class="btn" href="/usluge/x-signal/">Besplatna analiza sajta</a></div></section>`;

const smallVariant = src => { const s = String(src).replace(/\.webp$/, '-768.webp'); return s !== src && existsSync('.' + s) ? s : null; };
const formatDateBs = iso => { const [y, m, d] = String(iso).split('-'); return `${Number(d)}. ${Number(m)}. ${y}.`; };

function guidePage(g, i) {
  const c = cluster(g.cluster), si = stageIndex(g.stage), prev = guides[i - 1], next = guides[i + 1];
  const path = url(g);
  const toc = g.sections.map(([h]) => [h, slugify(h)]);
  const siblings = guides.filter(x => x.cluster === g.cluster && x !== g);
  const words = strip(g.answer + g.sections.map(s => s[1]).join(' ') + g.faq.flat().join(' ')).split(' ').length;
  const pubDate = g.published || published;
  const coverSrc = g.cover ? guideImage(g) : null;
  const coverSmall = coverSrc ? smallVariant(coverSrc) : null;
  const coverHtml = g.cover ? `<figure class="guide-cover"><img src="${coverSrc}"${coverSmall ? ` srcset="${coverSmall} 768w, ${coverSrc} 1536w" sizes="(max-width:760px) 92vw, 1100px"` : ''} width="1536" height="1024" fetchpriority="high" decoding="async" alt="${esc(g.cover.alt)}">${g.cover.caption ? `<figcaption>${esc(g.cover.caption)}</figcaption>` : ''}</figure>` : '';
  const preload = coverSrc ? `<link rel="preload" as="image" href="${coverSrc}"${coverSmall ? ` imagesrcset="${coverSmall} 768w, ${coverSrc} 1536w" imagesizes="(max-width:760px) 92vw, 1100px"` : ''} fetchpriority="high">` : '';
  const ogImg = coverSrc || '/media/znanje/znanje-og.jpg';
  const schemaImages = coverSrc
    ? [{ '@type': 'ImageObject', url: origin + coverSrc, width: 1536, height: 1024 }, ...(g.diagram ? [{ '@type': 'ImageObject', url: origin + g.diagram, width: 1200, height: 675 }] : [])]
    : origin + '/media/znanje/znanje-og.jpg';
  const body = `<article class="guide" style="--accent:${c.color}">
<header class="guide-hero"><nav class="crumbs" aria-label="Putanja"><a href="/">Početna</a><span>/</span><a href="/blog/">Blog</a><span>/</span><a href="/blog/#${c.id}">${esc(c.name)}</a></nav>
<p class="eyebrow">KORAK ${si + 1} OD ${stages.length} · ${esc(stages[si][1]).toUpperCase()}</p><h1>${esc(g.h1)}</h1>
<p class="guide-meta">Pripremio i provjerio: <a href="/tim/">Digital X SEO &amp; Web tim</a> · <a href="/uredjivacka-politika/">Urednička metodologija</a> · ažurirano <time datetime="${pubDate}">${formatDateBs(pubDate)}</time> · ${g.minutes} min čitanja</p>
<ol class="journey" aria-label="Koraci puta">${stages.map(([id, name], n) => { const first = guides.find(x => x.stage === id); return `<li${n === si ? ' class="is-current" aria-current="step"' : n < si ? ' class="is-done"' : ''}><a href="${first ? url(first) : '/blog/'}"><span>${n + 1}</span>${esc(name)}</a></li>`; }).join('')}</ol>${coverHtml}</header>
<div class="guide-layout"><aside class="guide-toc" aria-label="Sadržaj"><h2>U ovom vodiču</h2><ol>${toc.map(([h, id]) => `<li><a href="#${id}">${esc(h)}</a></li>`).join('')}<li><a href="#pitanja">Česta pitanja</a></li></ol></aside>
<div class="guide-body"><div class="answer"><p class="eyebrow">KRATAK ODGOVOR</p><p>${esc(g.answer)}</p></div>
${g.sections.map(([h, html]) => `<section id="${slugify(h)}"><h2>${esc(h)}</h2>${html}</section>`).join('')}
<section id="pitanja"><h2>Česta pitanja</h2>${faqHtml(g.faq)}</section>
<section class="related"><h2>Povezane usluge i cijene</h2><div class="related-grid">${g.related.map(([h, n]) => `<a href="${h}">${esc(n)}<span aria-hidden="true">→</span></a>`).join('')}<a href="${c.service[0]}">${esc(c.service[1])}<span aria-hidden="true">→</span></a></div>
${siblings.length || c.blog.length ? `<h3>Još iz teme „${esc(c.name)}“</h3><ul class="more">${siblings.map(x => `<li><a href="${url(x)}">${esc(x.title)}</a></li>`).join('')}${c.blog.map(([h, n]) => `<li><a href="${h}">${esc(n)}</a></li>`).join('')}</ul>` : ''}</section>
<nav class="step-nav" aria-label="Prethodni i sljedeći korak">${prev ? `<a rel="prev" href="${url(prev)}"><small>← Prethodni korak</small>${esc(prev.title)}</a>` : `<a href="/blog/"><small>← Početak</small>Blog</a>`}${next ? `<a rel="next" href="${url(next)}"><small>Sljedeći korak →</small>${esc(next.title)}</a>` : `<a href="/kontakt.html"><small>Kraj puta →</small>Razgovarajte s Digital X</a>`}</nav>
</div></div></article>${cta}`;
  const schema = [
    { '@type': 'Article', '@id': origin + path + '#article', headline: g.h1, description: g.desc, inLanguage: 'bs', datePublished: pubDate, dateModified: pubDate, wordCount: words, articleSection: c.name, keywords: g.keywords.join(', '), mainEntityOfPage: origin + path, image: schemaImages, author: { '@id': origin + '/#organization' }, publisher: { '@id': origin + '/#organization' }, publishingPrinciples: EDITORIAL_POLICY_URL, isPartOf: { '@id': origin + '/blog/#hub' } },
    crumbs([['Digital X', '/'], ['Blog', '/blog/'], [g.title, path]]),
    faqSchema(g.faq),
  ];
  return page({ path, title: `${g.title} | Digital X`, desc: g.desc, keywords: g.keywords, image: ogImg, preload, type: 'article', schema, body, bodyClass: 'is-guide' });
}

// Each guide has its own cover so no image repeats among the Blog cards (the 15 articles keep theirs).
const V = '/ai-concierge-preview/media/visuals/', R = '/media/review-2026/', A = '/assets/images/', Z = '/media/znanje/';
const guideImages = {
  'digitalni-marketing-za-male-firme': R + 'category-growth.webp', 'kako-odabrati-digitalnu-agenciju': R + 'page-contact.webp',
  'izrada-web-stranica-vodic': V + 'launch.webp', 'wordpress-shopify-ili-custom': V + 'signal.webp',
  'kako-otvoriti-web-shop-bih': R + 'category-web.webp', 'sta-je-seo-optimizacija': V + 'visibility.webp',
  'seo-aeo-geo-razlika': R + 'category-ai.webp', 'google-oglasi-cijena': V + 'growth.webp',
  'instagram-facebook-reklama-cijena': R + 'category-content.webp', 'plan-sadrzaja-drustvene-mreze': V + 'content.webp',
  'ai-za-male-firme': V + 'assistant.webp', 'kako-mjeriti-rezultate-marketinga': V + 'brain.webp',
  'koliko-kosta-seo-optimizacija-bih': A + 'service-seo.webp',
  'agencija-ili-freelancer-web-stranica': A + 'custom-project-planning.webp',
  'meta-capi-server-side-tracking': A + 'service-growth.webp',
  'ai-spremnost-web-stranica-bih-2026': A + 'growthos-dashboard.webp',
  'google-ai-overviews-kako-radi': Z + 'cluster1-ai-overviews-cover.webp',
  'schema-markup-za-ai-pretragu': Z + 'cluster1-schema-2026-cover.webp',
  'llms-txt-sta-je-i-treba-li-vam': Z + 'cluster1-llms-txt-cover.webp',
  'kako-mjeriti-ai-vidljivost': Z + 'cluster1-ai-tracking-cover.webp',
};
const guideImage = g => { const src = guideImages[g.slug]; if (!src) throw new Error('No Blog card image for guide ' + g.slug); return src; };
function hubPage() {
  const byCluster = c => guides.filter(g => g.cluster === c.id);
  const galaxy = { clusters: clusters.map(c => ({ id: c.id, name: c.name, color: c.color, pos: c.pos, nodes: [...byCluster(c).map(g => ({ t: g.title.split(':')[0], h: url(g) })), ...c.blog.map(([h, t]) => ({ t, h }))] })) };
  const panel = (c, n) => `<article class="g-panel" id="${c.id}" data-stop="${n + 1}" style="--accent:${c.color}"><p class="eyebrow">KLASTER ${String(n + 1).padStart(2, '0')} / ${String(clusters.length).padStart(2, '0')}</p><h3>${esc(c.name)}</h3><p>${esc(c.blurb)}</p><ul>${byCluster(c).map(g => `<li><a href="${url(g)}">${esc(g.title)}</a></li>`).join('')}${c.blog.map(([h, t]) => `<li><a href="${h}">${esc(t)}</a></li>`).join('')}</ul><a class="g-service" href="${c.service[0]}">Usluga: ${esc(c.service[1])} →</a></article>`;
  const body = `<section class="g-scroll" id="galaksija" data-galaxy aria-label="Interaktivna mapa znanja"><div class="g-sticky"><div class="g-bg g-bg-far" aria-hidden="true"></div><div class="g-bg g-bg-near" aria-hidden="true"></div><canvas class="g-canvas" aria-hidden="true"></canvas><div class="g-labels" aria-hidden="true"></div>
<div class="g-intro g-panel is-active" data-stop="0"><p class="eyebrow">GALAKSIJA ZNANJA</p><h2>Osam tema. Jedan povezan sistem.</h2><p class="g-hint">Kliknite veliku zvijezdu teme da priđete bliže i vidite njene članke. Skrolajte da proletite kroz sve teme ili povucite da okrenete mapu.</p><img class="g-poster" src="/media/znanje/znanje-poster.webp" width="1774" height="887" loading="lazy" decoding="async" alt="Mozak sastavljen od zvijezda s osam obojenih klastera tema povezanih nitima svjetlosti"></div>
${clusters.map(panel).join('')}
<nav class="g-rail" aria-label="Teme">${clusters.map((c, n) => `<a href="#${c.id}" data-go="${n + 1}" style="--accent:${c.color}"><span></span>${esc(c.name)}</a>`).join('')}</nav>
<a class="g-skip" href="#clanci">Preskočite animaciju ↓</a></div></section>
<section class="hub-section hub-intro" id="clanci"><p class="eyebrow">DIGITAL X BLOG · SARAJEVO</p><h1>Blog o izradi web stranica, SEO-u, AI pretrazi i digitalnom marketingu za firme u BiH</h1><p class="lead">${guides.length} vodiča i ${posts.length} članaka Digital X agencije iz Sarajeva, složenih u ${clusters.length} tema i sedam koraka: od prvog pitanja do rezultata koji se mjeri. Javne cijene, bez žargona i bez obećanja koja niko ne može dati.</p>
<h2>Svi vodiči i članci</h2><div class="post-grid">${guides.map(g => { const src = guideImage(g), sm = smallVariant(src); return `<a class="post-card" href="${url(g)}"><img src="${src}"${sm ? ` srcset="${sm} 768w, ${src} 1536w" sizes="(max-width:760px) 92vw, 360px"` : ''} width="1536" height="1024" loading="lazy" decoding="async" alt=""><div><p class="eyebrow">VODIČ · ${g.minutes} MIN</p><h3>${esc(g.title)}</h3><p>${esc(g.desc)}</p><span>Pročitajte vodič →</span></div></a>`; }).join('')}${posts.map(p => `<a class="post-card" href="${p.url}"><img src="${visualSrc('article-' + p.id)}" width="1536" height="1024" loading="lazy" decoding="async" alt=""><div><p class="eyebrow">${esc(p.meta)}</p><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><span>Pročitajte članak →</span></div></a>`).join('')}</div></section>
<section class="hub-section" id="put"><p class="eyebrow">ČETIRI PUTA</p><h2>Odaberite situaciju koja vam je najbliža.</h2><div class="paths">${paths.map(p => `<article><h3>${esc(p.name)}</h3><p>${esc(p.text)}</p><ol>${p.steps.map(s => { const g = guide(s); return `<li><a href="${url(g)}">${esc(g.title.split(':')[0])}</a></li>`; }).join('')}</ol><a class="btn btn-small" href="${url(guide(p.steps[0]))}">Počnite ovdje →</a></article>`).join('')}</div></section>
<section class="hub-section" id="koraci"><p class="eyebrow">SEDAM KORAKA</p><h2>Put od pitanja do rezultata.</h2><ol class="stage-list">${stages.map(([id, name, text], n) => `<li><span>${n + 1}</span><div><h3>${esc(name)}</h3><p>${esc(text)}</p><ul>${guides.filter(g => g.stage === id).map(g => `<li><a href="${url(g)}">${esc(g.title)}</a></li>`).join('')}</ul></div></li>`).join('')}</ol></section>
<section class="hub-section" id="pitanja"><p class="eyebrow">ČESTA PITANJA</p><h2>O blogu.</h2>${faqHtml(hubFaq)}</section>${cta}
<script type="application/json" id="galaxy-data">${JSON.stringify(galaxy).replace(/</g, '\\u003c')}</script>`;
  const schema = [
    { '@type': 'CollectionPage', '@id': origin + '/blog/#hub', url: origin + '/blog/', name: 'Digital X Blog', description: 'Vodiči o izradi web stranica, SEO, AEO i GEO optimizaciji, oglašavanju, društvenim mrežama i AI automatizaciji za firme u BiH.', inLanguage: 'bs', publisher: { '@id': origin + '/#organization' }, about: clusters.map(c => c.name) },
    { '@type': 'ItemList', name: 'Vodiči i članci', itemListElement: [...guides.map(g => [g.title, url(g)]), ...posts.map(p => [p.title, p.url])].map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, url: origin + path })) },
    crumbs([['Digital X', '/'], ['Blog', '/blog/']]),
    faqSchema(hubFaq),
  ];
  return page({ path: '/blog/', title: 'Blog: vodiči za web, SEO, AI i marketing | Digital X', desc: 'Besplatni vodiči Digital X: izrada web stranica, web shop, SEO, AEO i GEO, Google i Meta oglasi, društvene mreže i AI automatizacija — u sedam povezanih koraka.', keywords: ['digitalni marketing vodič', 'izrada web stranica', 'seo optimizacija', 'aeo geo', 'ai automatizacija'], image: '/media/znanje/znanje-og.jpg', type: 'website', schema, body, scripts: '<script src="/znanje/assets/galaxy.js" defer></script>', bodyClass: 'is-hub' });
}

// City landing pages (/usluge/izrada-web-stranica/<grad>/) reuse the guide layout with local content.
const cityUrl = c => `/usluge/izrada-web-stranica/${c.slug}/`;
function cityPage(c) {
  const path = cityUrl(c);
  const toc = c.sections.map(([h]) => [h, slugify(h)]);
  const body = `<article class="guide" style="--accent:#9fc4ff">
<header class="guide-hero"><nav class="crumbs" aria-label="Putanja"><a href="/">Početna</a><span>/</span><a href="/usluge/">Usluge</a><span>/</span><a href="/usluge/izrada-web-stranica/">Izrada web stranica</a><span>/</span><span>${esc(c.city)}</span></nav>
<p class="eyebrow">IZRADA WEB STRANICA · ${esc(c.city).toUpperCase()}</p><h1>${esc(c.h1)}</h1>
<p class="guide-meta">Digital X, Sarajevo · ažurirano <time datetime="${published}">13. 11. 2026.</time></p>
<div class="hub-actions"><a class="btn btn-primary" href="/kontakt.html">Besplatne konzultacije</a><a class="btn" href="/usluge/x-signal/">Besplatna analiza sajta</a></div></header>
<div class="guide-layout"><aside class="guide-toc" aria-label="Sadržaj"><h2>Na ovoj stranici</h2><ol>${toc.map(([h, id]) => `<li><a href="#${id}">${esc(h)}</a></li>`).join('')}<li><a href="#pitanja">Česta pitanja</a></li></ol></aside>
<div class="guide-body"><div class="answer"><p class="eyebrow">KRATAK ODGOVOR</p><p>${esc(c.answer)}</p></div>
${c.sections.map(([h, html]) => `<section id="${slugify(h)}"><h2>${esc(h)}</h2>${html}</section>`).join('')}
<section id="pitanja"><h2>Česta pitanja</h2>${faqHtml(c.faq)}</section>
<section class="related"><h2>Povezano</h2><div class="related-grid">${c.related.map(([h, n]) => `<a href="${h}">${esc(n)}<span aria-hidden="true">→</span></a>`).join('')}</div></section>
</div></div></article>${cta}`;
  const schema = [
    { '@type': 'Service', '@id': origin + path + '#service', name: `Izrada web stranica ${c.city}`, serviceType: 'Web design and web development', description: c.desc, provider: { '@id': origin + '/#organization' }, areaServed: { '@type': 'City', name: c.city },
      offers: [['Landing stranica', 199], ['Premium web prisustvo', 449], ['Smart Website Launch', 499], ['E-commerce Launch', 2490]].map(([name, price]) => ({ '@type': 'Offer', name, price, priceCurrency: 'BAM', availability: 'https://schema.org/InStock', shippingDetails: digitalShipping, hasMerchantReturnPolicy: returnPolicy })) },
    crumbs([['Digital X', '/'], ['Usluge', '/usluge/'], ['Izrada web stranica', '/usluge/izrada-web-stranica/'], [c.city, path]]),
    faqSchema(c.faq),
  ];
  return page({ path, title: c.title, desc: c.desc, keywords: c.keywords, image: '/media/znanje/znanje-og.jpg', type: 'website', schema, body, bodyClass: 'is-guide' });
}

const digitalShipping = { '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', value: '0.00', currency: 'BAM' }, shippingDestination: ['BA', 'HR', 'RS', 'ME', 'DE', 'AT', 'CH'].map(addressCountry => ({ '@type': 'DefinedRegion', addressCountry })), deliveryTime: { '@type': 'ShippingDeliveryTime', handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 3, unitCode: 'DAY' }, transitTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 14, unitCode: 'DAY' } } };
const offer = ([name, price, period]) => ({ '@type': 'Offer', name, price, priceCurrency: 'BAM', availability: 'https://schema.org/InStock', shippingDetails: digitalShipping, hasMerchantReturnPolicy: returnPolicy, ...(period ? { description: `Početna cijena, ${period}.` } : {}) });
function landingPage(l) {
  const toc = l.sections.map(([h]) => [h, slugify(h)]);
  const trail = [['Početna', '/'], ...l.crumbs];
  const body = `<article class="guide" style="--accent:#9fc4ff">
<header class="guide-hero"><nav class="crumbs" aria-label="Putanja">${trail.map(([n, h], i) => i === trail.length - 1 ? `<span>${esc(n)}</span>` : `<a href="${h}">${esc(n)}</a><span>/</span>`).join('')}</nav>
<p class="eyebrow">${esc(l.eyebrow)}</p><h1>${esc(l.h1)}</h1>
<p class="guide-meta">Pripremio i provjerio: <a href="/tim/">Digital X tim</a> · <a href="/uredjivacka-politika/">Urednička metodologija</a> · ažurirano <time datetime="${published}">21. 11. 2026.</time></p>
<div class="hub-actions"><a class="btn btn-primary" href="/kontakt.html">Besplatne konzultacije</a><a class="btn" href="/usluge/x-signal/">Besplatna analiza sajta</a></div></header>
<div class="guide-layout"><aside class="guide-toc" aria-label="Sadržaj"><h2>Na ovoj stranici</h2><ol>${toc.map(([h, id]) => `<li><a href="#${id}">${esc(h)}</a></li>`).join('')}<li><a href="#pitanja">Česta pitanja</a></li></ol></aside>
<div class="guide-body"><div class="answer"><p class="eyebrow">KRATAK ODGOVOR</p><p>${esc(l.answer)}</p></div>
${l.sections.map(([h, html]) => `<section id="${slugify(h)}"><h2>${esc(h)}</h2>${html}</section>`).join('')}
<section id="pitanja"><h2>Česta pitanja</h2>${faqHtml(l.faq)}</section>
<section class="related"><h2>Povezano</h2><div class="related-grid">${l.related.map(([h, n]) => `<a href="${h}">${esc(n)}<span aria-hidden="true">→</span></a>`).join('')}</div></section>
</div></div></article>${cta}`;
  const schema = [
    l.article
      ? { '@type': 'Article', '@id': origin + l.path + '#article', headline: l.h1, description: l.desc, inLanguage: 'bs', datePublished: published, dateModified: published, keywords: l.keywords.join(', '), mainEntityOfPage: origin + l.path, image: origin + '/media/znanje/znanje-og.jpg', author: { '@id': origin + '/#organization' }, publisher: { '@id': origin + '/#organization' }, publishingPrinciples: EDITORIAL_POLICY_URL }
      : l.profilePage
      ? { '@type': 'ProfilePage', '@id': origin + l.path + '#profile', url: origin + l.path, name: l.h1, description: l.desc, inLanguage: 'bs', dateModified: published, mainEntity: { '@id': origin + '/#organization' } }
      : l.about
      ? { '@type': 'AboutPage', '@id': origin + l.path + '#about', url: origin + l.path, name: l.h1, description: l.desc, inLanguage: 'bs', about: { '@id': origin + '/#organization' }, mainEntity: { '@id': origin + '/#organization' } }
      : { '@type': 'Service', '@id': origin + l.path + '#service', name: l.service.name, serviceType: l.service.serviceType, description: l.desc, provider: { '@id': origin + '/#organization' }, areaServed: l.service.areaServed, offers: l.service.offers.map(offer) },
    crumbs([['Digital X', '/'], ...l.crumbs]),
    faqSchema(l.faq),
  ];
  return page({ path: l.path, title: l.title, desc: l.desc, keywords: l.keywords, image: '/media/znanje/znanje-og.jpg', type: 'website', schema, body, bodyClass: 'is-guide' });
}
function industryHubPage() {
  const items = landings.filter(l => l.path.startsWith('/industrije/'));
  const body = `<section class="hub-hero"><div class="hub-hero-copy"><nav class="crumbs" aria-label="Putanja"><a href="/">Početna</a><span>/</span><span>Industrije</span></nav><p class="eyebrow">DIGITAL X / INDUSTRIJE</p><h1>${esc(industryHub.h1)}</h1><p class="lead">${esc(industryHub.answer)}</p></div></section>
<section class="hub-section"><div class="paths">${items.map(l => `<article><h2>${esc(l.crumbs.at(-1)[0])}</h2><p>${esc(l.desc)}</p><a class="btn btn-small" href="${l.path}">Pogledajte →</a></article>`).join('')}</div></section>${cta}`;
  const schema = [
    { '@type': 'CollectionPage', '@id': origin + industryHub.path + '#hub', url: origin + industryHub.path, name: industryHub.h1, description: industryHub.desc, inLanguage: 'bs', publisher: { '@id': origin + '/#organization' } },
    { '@type': 'ItemList', itemListElement: items.map((l, i) => ({ '@type': 'ListItem', position: i + 1, name: l.title.replace(' | Digital X', ''), url: origin + l.path })) },
    crumbs([['Digital X', '/'], ['Industrije', industryHub.path]]),
  ];
  return page({ path: industryHub.path, title: industryHub.title, desc: industryHub.desc, image: '/media/znanje/znanje-og.jpg', type: 'website', schema, body, bodyClass: 'is-hub' });
}
const glossaryTerms = [
  ['SEO (Search Engine Optimization)', 'Uređivanje web stranice, tehničke osnove, sadržaja i autoriteta kako bi je Google razumio i prikazao ljudima koji traže vašu uslugu.', '/znanje/sta-je-seo-optimizacija/'],
  ['AEO (Answer Engine Optimization)', 'Oblikovanje sadržaja kroz kratke odgovore od 40–60 riječi, tabele i FAQ sekcije kako bi ga pretraživači i asistenti prikazali kao direktan odgovor.', '/znanje/seo-aeo-geo-razlika/'],
  ['GEO (Generative Engine Optimization)', 'Izgradnja provjerljivih činjenica o firmi, strukturiranih podataka i vanjskih spominjanja kako bi AI sistemi poput ChatGPT-a, Geminija i Perplexityja tačno opisali i naveli vaš brend.', '/usluge/seo-aeo-geo/'],
  ['llms.txt i llms-full.txt', 'Tekstualne datoteke u korijenu web stranice sa sažetkom ko ste, šta nudite, po kojim cijenama i gdje su ključne stranice, prilagođene AI alatima.', '/llms.txt'],
  ['Schema Markup (JSON-LD)', 'Strukturirani podaci u kodu stranice (Organization, LocalBusiness, Service, Person, FAQPage, Article) koji mašinama nedvosmisleno opisuju entitete i cijene.', '/usluge/seo-aeo-geo/'],
  ['RAG (Retrieval-Augmented Generation)', 'Arhitektura u kojoj AI asistent prije odgovora pretražuje vaše odobrene dokumente i cjenovnike kako bi odgovarao tačno i bez izmišljanja.', '/usluge/ai-chatbot-za-web-stranicu/'],
  ['AI Agent / AI Recepcionar', 'Automatizovani asistent koji ne samo da odgovara na pitanja, već kvalifikuje upit, prikuplja podatke i predaje sažetak timu ili CRM-u.', '/usluge/ai-receptionist/'],
  ['Core Web Vitals (LCP, INP, CLS)', 'Googleove metrike korisničkog iskustva koje mjere brzinu učitavanja glavnog sadržaja (LCP), odziv na klik (INP) i stabilnost prikaza (CLS).', '/usluge/optimizacija-brzine-sajta/'],
  ['Google Business Profile', 'Besplatni poslovni profil na Google Mapama i Pretrazi koji uz tačne kategorije, radno vrijeme i recenzije donosi lokalne pozive i rute.', '/usluge/google-business-profile/'],
  ['NAP konzistentnost', 'Dosljedno navođenje istog naziva firme, adrese i telefona (Name, Address, Phone) na web stranici, Google profilu, mrežama i direktorijima.', '/usluge/lokalni-seo-sarajevo/'],
  ['Meta Conversions API (CAPI)', 'Server-side slanje konverzijskih događaja prema Meti uz deduplikaciju s Pixelom, čime se nadoknađuju događaji izgubljeni zbog blokatora.', '/znanje/meta-capi-server-side-tracking/'],
  ['Fiskalizacija i plaćanje u web shopu', 'Povezivanje online trgovine u BiH s kartičnim procesorima, pouzećem, kurirskim službama i zakonskim uslovima kupovine i povrata.', '/znanje/kako-otvoriti-web-shop-bih/'],
];
function glossaryPage() {
  const path = '/pojmovnik/';
  const title = 'Pojmovnik: SEO, AEO, GEO, AI i web pojmovi | Digital X';
  const desc = 'Jasna objašnjenja ključnih pojmova za digitalni rast u BiH: SEO, AEO, GEO, llms.txt, Schema markup, RAG, AI agenti, Core Web Vitals i Meta Conversions API.';
  const body = `<article class="guide" style="--accent:#b9a7ff">
<header class="guide-hero"><nav class="crumbs" aria-label="Putanja"><a href="/">Početna</a><span>/</span><a href="/blog/">Blog</a><span>/</span><span>Pojmovnik</span></nav>
<p class="eyebrow">DIGITAL X / POJMOVNIK</p><h1>Pojmovnik za SEO, AEO, GEO, AI automatizaciju i web razvoj</h1>
<p class="guide-meta">Digital X, Sarajevo · ažurirano <time datetime="${published}">21. 11. 2026.</time></p></header>
<div class="guide-layout"><aside class="guide-toc" aria-label="Pojmovi"><h2>Pojmovi</h2><ol>${glossaryTerms.map(([term]) => `<li><a href="#${slugify(term)}">${esc(term)}</a></li>`).join('')}</ol></aside>
<div class="guide-body"><div class="answer"><p class="eyebrow">KRATAK ODGOVOR</p><p>Digital X pojmovnik objašnjava ključne pojmove modernog digitalnog marketinga, pretrage i AI automatizacije na bosanskom jeziku — bez žargona i s direktnim vezama na praktične vodiče i usluge.</p></div>
${glossaryTerms.map(([term, def, href]) => `<section id="${slugify(term)}"><h2>${esc(term)}</h2><p>${esc(def)}</p><p><a href="${href}">Detaljnije →</a></p></section>`).join('')}
</div></div></article>${cta}`;
  const schema = [
    { '@type': 'DefinedTermSet', '@id': origin + path + '#termset', name: 'Digital X Pojmovnik: SEO, AEO, GEO i AI automatizacija', url: origin + path, inLanguage: 'bs', publisher: { '@id': origin + '/#organization' }, hasDefinedTerm: glossaryTerms.map(([name, description]) => ({ '@type': 'DefinedTerm', name, description })) },
    crumbs([['Digital X', '/'], ['Blog', '/blog/'], ['Pojmovnik', path]]),
  ];
  return page({ path, title, desc, keywords: ['seo pojmovnik', 'šta je aeo', 'šta je geo', 'llms.txt', 'rag ai', 'core web vitals'], image: '/media/znanje/znanje-og.jpg', type: 'website', schema, body, bodyClass: 'is-guide' });
}

mkdirSync('znanje', { recursive: true });
for (const retired of ['banja-luka', 'mostar', 'tuzla', 'zenica']) rmSync(`usluge/izrada-web-stranica/${retired}`, { recursive: true, force: true });
for (const c of cities) { mkdirSync(`.${cityUrl(c)}`, { recursive: true }); writeFileSync(`.${cityUrl(c)}index.html`, cityPage(c)); }
for (const l of landings) { mkdirSync(`.${l.path}`, { recursive: true }); writeFileSync(`.${l.path}index.html`, landingPage(l)); }
mkdirSync(`.${industryHub.path}`, { recursive: true }); writeFileSync(`.${industryHub.path}index.html`, industryHubPage());
mkdirSync('pojmovnik', { recursive: true }); writeFileSync('pojmovnik/index.html', glossaryPage());
mkdirSync('blog', { recursive: true }); writeFileSync('blog/index.html', hubPage());
rmSync('znanje/index.html', { force: true });
guides.forEach((g, i) => { mkdirSync(`znanje/${g.slug}`, { recursive: true }); writeFileSync(`znanje/${g.slug}/index.html`, guidePage(g, i)); });
// Shared with publish.mjs so the sitemap and llms.txt list the same pages.
export const znanjePages = [{ path: '/blog/', title: 'Blog', desc: 'Mapa svih vodiča po temama i koracima.', lastmod: published }, { path: '/pojmovnik/', title: 'Pojmovnik: SEO, AEO, GEO i AI', desc: 'Jasna objašnjenja ključnih pojmova za digitalni rast u BiH.', lastmod: published }, ...guides.map(g => ({ path: url(g), title: g.title, desc: g.desc, lastmod: published })), ...cities.map(c => ({ path: cityUrl(c), title: c.title.replace(' | Digital X', ''), desc: c.desc, lastmod: published })), ...[...landings, industryHub].map(l => ({ path: l.path, title: l.title.replace(' | Digital X', ''), desc: l.desc, lastmod: published }))];
console.log(`Blog: hub + ${guides.length} guides.`);
