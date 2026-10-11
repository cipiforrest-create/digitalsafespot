import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
import {createRequire} from 'node:module';
import {load} from 'cheerio';
import {filterGscSitemap} from '../lib/gsc-indexing.mjs';
import {localizePage} from './localize-pages.mjs';
const {offers}=createRequire(import.meta.url)('../.concierge/catalogue.cjs');
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
const urls=new Set([...sitemap('loc').map((i,e)=>sitemap(e).text()).get(),...routes.flatMap(p=>['','/en','/de'].map(prefix=>origin+prefix+p.production))]);
writeFileSync('public/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...urls].sort().filter(u=>{const p=new URL(u).pathname;return existsSync('public'+p+(p.endsWith('/')?'index.html':''));}).map(u=>`<url><loc>${u}</loc></url>`).join('')}</urlset>`);
// Translated guides now inherit the same editorial covers and markup during publication.
const file='public/google-business-profile.html';if(existsSync(file)){const $=load(readFileSync(file,'utf8'));$('meta[property="og:image"]').attr('content',origin+'/media/review-2026/service-local-seo.webp');$('img[src*="service-seo"]').attr('src','/media/review-2026/service-local-seo.webp');writeFileSync(file,$.html());}
console.log(`Published ${routes.length} canonical pages and updated sitemap.`);
writeFileSync('public/llms.txt',`# Digital X\n\n> Digitalna agencija iz Sarajeva: web stranice, SEO/AEO/GEO, sadržaj i AI automatizacija.\n\nCijene su početne; obim i dostupnost potvrđuju se prije ugovaranja. Audit provjerava javni HTML i tehničke signale; ne mjeri AI pozicije, konverzije niti Core Web Vitals.\n\n## Usluge i vodiči\n${offers.map(p=>`- [${p.name}](${origin+p.production}): ${p.intro}`).join('\n')}\n\n## Kontakt\n- digital.x.agency.ba@gmail.com\n- +387 64 438 3566\n`);
