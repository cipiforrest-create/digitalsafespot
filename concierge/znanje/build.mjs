// Generates the Centar znanja hub (/znanje/) and its guides as static HTML.
// Runs from the repo root, before the site is copied into public/.
import { mkdirSync, writeFileSync } from 'node:fs';
import { origin, published, stages, clusters, paths, guides, hubFaq } from './content.mjs';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const slugify = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'dj').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const url = g => `/znanje/${g.slug}/`;
const cluster = id => clusters.find(c => c.id === id);
const stageIndex = id => stages.findIndex(s => s[0] === id);
const guide = slug => { const g = guides.find(x => x.slug === slug); if (!g) throw new Error('Unknown guide ' + slug); return g; };

const nav = [['/usluge/', 'Usluge'], ['/cjenovnik/', 'Cjenovnik'], ['/projekti/', 'Radovi'], ['/primjeri-web-stranica/', 'Primjeri'], ['/shop/', 'Shop'], ['/blog/', 'Blog'], ['/znanje/', 'Znanje'], ['/usluge/x-signal/', 'Analiza'], ['/kontakt.html', 'Kontakt']];
const logo = `<a class="brand" href="/" aria-label="Digital X početna"><span class="brand-symbol" aria-hidden="true"><i></i><i></i></span><span class="brand-word">DIGITAL <b>X</b><small>WEB. MARKETING. INTELIGENCIJA.</small></span></a>`;
const header = `<a class="skip" href="#main">Preskoči na sadržaj</a><header class="zn-header">${logo}<nav class="zn-nav" aria-label="Glavna navigacija">${nav.map(([h, n]) => `<a href="${h}"${h === '/znanje/' ? ' aria-current="true"' : ''}>${n}</a>`).join('')}</nav><a class="btn btn-small" href="/kontakt.html">Besplatne konzultacije</a><button class="zn-menu" aria-label="Otvori navigaciju" aria-expanded="false" aria-controls="zn-mobile"><span></span><span></span></button></header><nav id="zn-mobile" class="zn-mobile" aria-label="Mobilna navigacija" hidden>${nav.map(([h, n]) => `<a href="${h}">${n}</a>`).join('')}</nav>`;
const footer = `<footer class="zn-footer"><div>${logo}<p>Web. Marketing. Inteligencija.</p></div><div><h2>Centar znanja</h2>${clusters.map(c => `<a href="/znanje/#${c.id}">${esc(c.name)}</a>`).join('')}</div><div><h2>Istražite</h2>${nav.map(([h, n]) => `<a href="${h}">${n}</a>`).join('')}</div><div><h2>Razgovarajmo</h2><a href="mailto:digital.x.agency.ba@gmail.com">digital.x.agency.ba@gmail.com</a><a href="tel:+387644383566">+387 64 438 3566</a><a href="https://wa.me/387644383566" rel="noopener">WhatsApp</a><a href="/o-nama.html">O nama</a></div><div class="zn-footer-base"><span>© 2026 Digital X Sarajevo</span><a href="/privatnost.html">Privatnost</a><a href="/uslovi.html">Uslovi korištenja</a><a href="/kolacici.html">Kolačići</a></div></footer>`;

const organization = { '@type': 'Organization', '@id': origin + '/#organization', name: 'Digital X', url: origin + '/', logo: origin + '/assets/icon-512.png', sameAs: ['https://www.instagram.com/digitalxmarketing.ba'], address: { '@type': 'PostalAddress', addressLocality: 'Sarajevo', addressCountry: 'BA' } };
const faqSchema = faq => ({ '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const crumbs = items => ({ '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: origin + path })) });

function page({ path, title, desc, keywords, image, type, schema, body, scripts = '', bodyClass = '' }) {
  const canonical = origin + path;
  return `<!DOCTYPE html><html lang="bs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#050608">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">${keywords ? `<meta name="keywords" content="${esc(keywords.join(', '))}">` : ''}
<link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="bs" href="${canonical}"><link rel="alternate" hreflang="x-default" href="${canonical}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/inter-400-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/inter-400-latin-ext.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/fonts.css"><link rel="stylesheet" href="/znanje/assets/znanje.css">
<meta property="og:type" content="${type}"><meta property="og:site_name" content="Digital X Sarajevo"><meta property="og:locale" content="bs_BA"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${origin + image}"><meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': [organization, ...schema] }).replace(/</g, '\\u003c')}</script>
</head><body class="${bodyClass}">${header}<main id="main">${body}</main>${footer}<script src="/znanje/assets/site.js" defer></script>${scripts}</body></html>`;
}

const faqHtml = faq => `<div class="faq">${faq.map(([q, a]) => `<details><summary><h3>${esc(q)}</h3></summary><p>${esc(a)}</p></details>`).join('')}</div>`;
const cta = `<section class="zn-cta"><div><p class="eyebrow">SLJEDEĆI KORAK</p><h2>Želite ovo primijeniti na svoju firmu?</h2><p>Besplatna analiza provjerava vašu postojeću stranicu. U besplatnim konsultacijama dobijate prijedlog prvog koraka — bez obaveze.</p></div><div class="zn-cta-actions"><a class="btn btn-primary" href="/kontakt.html">Besplatne konzultacije</a><a class="btn" href="/usluge/x-signal/">Besplatna analiza sajta</a></div></section>`;

function guidePage(g, i) {
  const c = cluster(g.cluster), si = stageIndex(g.stage), prev = guides[i - 1], next = guides[i + 1];
  const path = url(g);
  const toc = g.sections.map(([h]) => [h, slugify(h)]);
  const siblings = guides.filter(x => x.cluster === g.cluster && x !== g);
  const words = strip(g.answer + g.sections.map(s => s[1]).join(' ') + g.faq.flat().join(' ')).split(' ').length;
  const body = `<article class="guide" style="--accent:${c.color}">
<header class="guide-hero"><nav class="crumbs" aria-label="Putanja"><a href="/">Početna</a><span>/</span><a href="/znanje/">Centar znanja</a><span>/</span><a href="/znanje/#${c.id}">${esc(c.name)}</a></nav>
<p class="eyebrow">KORAK ${si + 1} OD ${stages.length} · ${esc(stages[si][1]).toUpperCase()}</p><h1>${esc(g.h1)}</h1>
<p class="guide-meta">Digital X · ažurirano <time datetime="${published}">13. 11. 2026.</time> · ${g.minutes} min čitanja</p>
<ol class="journey" aria-label="Koraci puta">${stages.map(([id, name], n) => { const first = guides.find(x => x.stage === id); return `<li${n === si ? ' class="is-current" aria-current="step"' : n < si ? ' class="is-done"' : ''}><a href="${first ? url(first) : '/znanje/'}"><span>${n + 1}</span>${esc(name)}</a></li>`; }).join('')}</ol></header>
<div class="guide-layout"><aside class="guide-toc" aria-label="Sadržaj"><h2>U ovom vodiču</h2><ol>${toc.map(([h, id]) => `<li><a href="#${id}">${esc(h)}</a></li>`).join('')}<li><a href="#pitanja">Česta pitanja</a></li></ol></aside>
<div class="guide-body"><div class="answer"><p class="eyebrow">KRATAK ODGOVOR</p><p>${esc(g.answer)}</p></div>
${g.sections.map(([h, html]) => `<section id="${slugify(h)}"><h2>${esc(h)}</h2>${html}</section>`).join('')}
<section id="pitanja"><h2>Česta pitanja</h2>${faqHtml(g.faq)}</section>
<section class="related"><h2>Povezane usluge i cijene</h2><div class="related-grid">${g.related.map(([h, n]) => `<a href="${h}">${esc(n)}<span aria-hidden="true">→</span></a>`).join('')}<a href="${c.service[0]}">${esc(c.service[1])}<span aria-hidden="true">→</span></a></div>
${siblings.length || c.blog.length ? `<h3>Još iz teme „${esc(c.name)}“</h3><ul class="more">${siblings.map(x => `<li><a href="${url(x)}">${esc(x.title)}</a></li>`).join('')}${c.blog.map(([h, n]) => `<li><a href="${h}">${esc(n)}</a></li>`).join('')}</ul>` : ''}</section>
<nav class="step-nav" aria-label="Prethodni i sljedeći korak">${prev ? `<a rel="prev" href="${url(prev)}"><small>← Prethodni korak</small>${esc(prev.title)}</a>` : `<a href="/znanje/"><small>← Početak</small>Centar znanja</a>`}${next ? `<a rel="next" href="${url(next)}"><small>Sljedeći korak →</small>${esc(next.title)}</a>` : `<a href="/kontakt.html"><small>Kraj puta →</small>Razgovarajte s Digital X</a>`}</nav>
</div></div></article>${cta}`;
  const schema = [
    { '@type': 'Article', '@id': origin + path + '#article', headline: g.h1, description: g.desc, inLanguage: 'bs', datePublished: published, dateModified: published, wordCount: words, articleSection: c.name, keywords: g.keywords.join(', '), mainEntityOfPage: origin + path, image: origin + '/media/poster/journey-core.jpg', author: { '@id': origin + '/#organization' }, publisher: { '@id': origin + '/#organization' }, isPartOf: { '@id': origin + '/znanje/#hub' } },
    crumbs([['Digital X', '/'], ['Centar znanja', '/znanje/'], [g.title, path]]),
    faqSchema(g.faq),
  ];
  return page({ path, title: `${g.title} | Digital X`, desc: g.desc, keywords: g.keywords, image: '/media/poster/journey-core.jpg', type: 'article', schema, body, bodyClass: 'is-guide' });
}

function hubPage() {
  const byCluster = c => guides.filter(g => g.cluster === c.id);
  const galaxy = { clusters: clusters.map(c => ({ id: c.id, name: c.name, color: c.color, pos: c.pos, nodes: [...byCluster(c).map(g => ({ t: g.title.split(':')[0], h: url(g) })), ...c.blog.map(([h, t]) => ({ t, h }))] })) };
  const panel = (c, n) => `<article class="g-panel" id="${c.id}" data-stop="${n + 1}" style="--accent:${c.color}"><p class="eyebrow">KLASTER ${String(n + 1).padStart(2, '0')} / ${String(clusters.length).padStart(2, '0')}</p><h3>${esc(c.name)}</h3><p>${esc(c.blurb)}</p><ul>${byCluster(c).map(g => `<li><a href="${url(g)}">${esc(g.title)}</a></li>`).join('')}${c.blog.map(([h, t]) => `<li><a href="${h}">${esc(t)}</a></li>`).join('')}</ul><a class="g-service" href="${c.service[0]}">Usluga: ${esc(c.service[1])} →</a></article>`;
  const body = `<section class="hub-hero"><div class="hub-hero-copy"><p class="eyebrow">DIGITAL X / CENTAR ZNANJA</p><h1>Sve što trebate znati o webu, vidljivosti i AI-ju — povezano u jednu mapu.</h1><p class="lead">${guides.length} novih vodiča i ${clusters.reduce((n, c) => n + c.blog.length, 0)} postojećih, složenih u ${clusters.length} tema i sedam koraka: od prvog pitanja do rezultata koji se mjeri. Bez žargona, s javnim cijenama.</p><div class="hub-actions"><a class="btn btn-primary" href="#galaksija">Uđite u galaksiju znanja ↓</a><a class="btn" href="#put">Odaberite svoj put</a></div></div></section>
<section class="g-scroll" id="galaksija" data-galaxy aria-label="Interaktivna mapa znanja"><div class="g-sticky"><canvas class="g-canvas" aria-hidden="true"></canvas><div class="g-labels" aria-hidden="true"></div>
<div class="g-intro g-panel is-active" data-stop="0"><p class="eyebrow">GALAKSIJA ZNANJA</p><h2>Osam tema. Jedan povezan sistem.</h2><p>Skrolajte da proletite kroz teme, povucite da okrenete mapu ili kliknite čvor da otvorite vodič.</p></div>
${clusters.map(panel).join('')}
<nav class="g-rail" aria-label="Teme">${clusters.map((c, n) => `<a href="#${c.id}" data-go="${n + 1}" style="--accent:${c.color}"><span></span>${esc(c.name)}</a>`).join('')}</nav>
<a class="g-skip" href="#put">Preskočite animaciju ↓</a></div></section>
<section class="hub-section" id="put"><p class="eyebrow">ČETIRI PUTA</p><h2>Odaberite situaciju koja vam je najbliža.</h2><div class="paths">${paths.map(p => `<article><h3>${esc(p.name)}</h3><p>${esc(p.text)}</p><ol>${p.steps.map(s => { const g = guide(s); return `<li><a href="${url(g)}">${esc(g.title.split(':')[0])}</a></li>`; }).join('')}</ol><a class="btn btn-small" href="${url(guide(p.steps[0]))}">Počnite ovdje →</a></article>`).join('')}</div></section>
<section class="hub-section" id="koraci"><p class="eyebrow">SEDAM KORAKA</p><h2>Put od pitanja do rezultata.</h2><ol class="stage-list">${stages.map(([id, name, text], n) => `<li><span>${n + 1}</span><div><h3>${esc(name)}</h3><p>${esc(text)}</p><ul>${guides.filter(g => g.stage === id).map(g => `<li><a href="${url(g)}">${esc(g.title)}</a></li>`).join('')}</ul></div></li>`).join('')}</ol></section>
<section class="hub-section" id="pitanja"><p class="eyebrow">ČESTA PITANJA</p><h2>O Centru znanja.</h2>${faqHtml(hubFaq)}</section>${cta}
<script type="application/json" id="galaxy-data">${JSON.stringify(galaxy).replace(/</g, '\\u003c')}</script>`;
  const schema = [
    { '@type': 'CollectionPage', '@id': origin + '/znanje/#hub', url: origin + '/znanje/', name: 'Digital X Centar znanja', description: 'Vodiči o izradi web stranica, SEO, AEO i GEO optimizaciji, oglašavanju, društvenim mrežama i AI automatizaciji za firme u BiH.', inLanguage: 'bs', publisher: { '@id': origin + '/#organization' }, about: clusters.map(c => c.name) },
    { '@type': 'ItemList', name: 'Vodiči', itemListElement: guides.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: g.title, url: origin + url(g) })) },
    crumbs([['Digital X', '/'], ['Centar znanja', '/znanje/']]),
    faqSchema(hubFaq),
  ];
  return page({ path: '/znanje/', title: 'Centar znanja: vodiči za web, SEO, AI i marketing | Digital X', desc: 'Besplatni vodiči Digital X: izrada web stranica, web shop, SEO, AEO i GEO, Google i Meta oglasi, društvene mreže i AI automatizacija — u sedam povezanih koraka.', keywords: ['digitalni marketing vodič', 'izrada web stranica', 'seo optimizacija', 'aeo geo', 'ai automatizacija'], image: '/media/poster/journey-core.jpg', type: 'website', schema, body, scripts: '<script src="/znanje/assets/galaxy.js" defer></script>', bodyClass: 'is-hub' });
}

mkdirSync('znanje', { recursive: true });
writeFileSync('znanje/index.html', hubPage());
guides.forEach((g, i) => { mkdirSync(`znanje/${g.slug}`, { recursive: true }); writeFileSync(`znanje/${g.slug}/index.html`, guidePage(g, i)); });
// Shared with publish.mjs so the sitemap and llms.txt list the same pages.
export const znanjePages = [{ path: '/znanje/', title: 'Centar znanja', desc: 'Mapa svih vodiča po temama i koracima.' }, ...guides.map(g => ({ path: url(g), title: g.title, desc: g.desc }))];
console.log(`Centar znanja: hub + ${guides.length} guides.`);
