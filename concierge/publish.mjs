import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
import {createRequire} from 'node:module';
import {load} from 'cheerio';
import {filterGscSitemap} from '../lib/gsc-indexing.mjs';
import {allServicePaths,cleanPathForLegacy} from '../lib/service-seo.mjs';
import {localizePage} from './localize-pages.mjs';
import {znanjePages} from './znanje/build.mjs';
const {offers,products}=createRequire(import.meta.url)('../.concierge/catalogue.cjs');
const origin='https://www.digital-x-marketing.com';
const routes=[{id:'home',production:'/'},...offers];
const localizedRoutes=new Set(routes.map(p=>p.production));
for(const p of routes){
 const source=readFileSync(`.concierge/pages/${p.id}.html`,'utf8');
 const $=load(source);
 $('link[rel="alternate"][hreflang]').remove();
 for(const lang of ['bs','en','de','x-default'])$('head').append(`<link rel="alternate" hreflang="${lang}" href="${origin}${lang==='bs'||lang==='x-default'?'':`/${lang}`}${p.production}">`);
 $('.language-nav a').each((_,node)=>{const lang=$(node).attr('lang');$(node).attr('href',`${lang==='bs'?'':`/${lang}`}${p.production}`).attr('hreflang',lang).removeAttr('target rel');});
 const base=$.html();
 for(const lang of ['bs','en','de']){
  const file='public'+(lang==='bs'?'':`/${lang}`)+p.production+(p.production.endsWith('/')?'index.html':'');
  mkdirSync(dirname(file),{recursive:true});writeFileSync(file,lang==='bs'?base:localizePage(base,lang,p.production,localizedRoutes));
 }
}
// Preserve existing translations and legacy URLs in the sitemap; add all published canonical pages.
const sitemap=load(filterGscSitemap(readFileSync('sitemap.xml','utf8')),{xmlMode:true});
const urls=new Set([...sitemap('loc').map((i,e)=>sitemap(e).text()).get(),...routes.flatMap(p=>['','/en','/de'].map(prefix=>origin+prefix+p.production)),...znanjePages.map(p=>origin+p.path)]);
// Service pages such as /usluge/izrada-web-stranica/ are served by middleware, so no file exists for them.
const middlewarePages=new Set(allServicePaths());
const published=p=>middlewarePages.has(p)||existsSync('public'+p+(p.endsWith('/')?'index.html':''));
// A localized legacy URL (/en/landing-seo.html) that 301s to a published page must not be listed.
const redirected=p=>{const m=p.match(/^\/(en|de)(\/.*)$/);const clean=m&&cleanPathForLegacy(m[2]);return Boolean(clean&&existsSync(`public/${m[1]}${clean}index.html`));};
const lastmod=new Map(znanjePages.map(p=>[origin+p.path,p.lastmod]));
writeFileSync('public/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...urls].sort().filter(u=>{const p=new URL(u).pathname;return published(p)&&!redirected(p);}).map(u=>`<url><loc>${u}</loc>${lastmod.has(u)?`<lastmod>${lastmod.get(u)}</lastmod>`:''}</url>`).join('')}</urlset>`);
// Translated guides now inherit the same editorial covers and markup during publication.
const file='public/google-business-profile.html';if(existsSync(file)){const $=load(readFileSync(file,'utf8'));$('meta[property="og:image"]').attr('content',origin+'/media/review-2026/service-local-seo.webp');$('img[src*="service-seo"]').attr('src','/media/review-2026/service-local-seo.webp');writeFileSync(file,$.html());}
console.log(`Published ${routes.length} canonical pages and updated sitemap.`);
// llms.txt: a plain-text summary for AI assistants, built from the same catalogue as the pages so facts never drift.
const kmPrice=p=>p.priceMinor==null?'procjena po zahtjevu':`${p.id==='smart-website-launch'?'':'od '}${(p.priceMinor/100).toLocaleString('bs-BA')} KM (${p.billing})`;
const pageLine=p=>`- [${p.name}](${origin+p.production}): ${p.intro}`;
const group=test=>offers.filter(test).map(pageLine).join('\n');
writeFileSync('public/llms.txt',[
 '# Digital X','',
 '> Digital X je digitalna agencija iz Sarajeva (Bosna i Hercegovina): web stranice i web shopovi, cinematic web iskustva, SEO/AEO/GEO, Google i Meta oglašavanje, sadržaj i AI automatizacija (AI asistenti, recepcionar, obrada upita).','',
 'English summary: Digital X is a digital agency in Sarajevo, Bosnia and Herzegovina. It builds websites and online shops, cinematic web experiences, SEO/AEO/GEO, Google and Meta ads, content and AI automation for businesses in Bosnia and Herzegovina, the region and the diaspora (Germany, Austria, Switzerland). Pages are available in Bosnian (/), English (/en/) and German (/de/).','',
 '## Ukratko',
 '- Sjedište: Sarajevo, Bosna i Hercegovina',
 '- Klijenti: firme u BiH, regionu i dijaspori (Njemačka, Austrija, Švicarska)',
 '- Jezici: bosanski, hrvatski, srpski, engleski, njemački',
 '- Radno vrijeme: ponedjeljak–petak, 09:00–17:00',
 '- Cijene su početne; obim i dostupnost potvrđuju se prije ugovaranja.',
 '- Besplatna analiza sajta provjerava javni HTML i tehničke signale; ne mjeri AI pozicije, konverzije niti Core Web Vitals.','',
 '## Početne cijene',
 ...products.map(p=>`- [${p.name}](${origin}/shop/product/${p.id}/): ${kmPrice(p)}. ${p.summary}`),'',
 '## Usluge',group(p=>p.production.startsWith('/usluge/')||['concierge','launch'].includes(p.id)),'',
 '## Vodiči',group(p=>p.id.startsWith('article-')),'',
 '## Centar znanja',...znanjePages.map(p=>`- [${p.title}](${origin+p.path}): ${p.desc}`),'',
 '## Demo aplikacije',
 `- [GrowthOS](${origin}/growthos.html): interaktivni demo poslovne aplikacije po mjeri sa CRM-om, projektima, automatizacijama, izvještajima, klijentskim portalom i AI Second Brain modulom`,'',
 '## Projekti i stranice',group(p=>['work','eynna','star','designer','examples','pricing','shop','blog','about','contact'].includes(p.id)),'',
 '## Kontakt',
 '- Email: marketing@digital-x-marketing.com',
 '- Telefon i WhatsApp: +387 64 438 3566',
 '- Instagram: https://www.instagram.com/digitalxmarketing.ba',
 `- Web: ${origin}/`,''
].join('\n'));
