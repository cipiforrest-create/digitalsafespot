import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
import {createRequire} from 'node:module';
import {load} from 'cheerio';
import {filterGscSitemap} from '../lib/gsc-indexing.mjs';
import {isServicePath,replaceLegacyServiceLinks} from '../lib/service-seo.mjs';
import {isLegacyRedirectPath} from '../lib/routing-policy.mjs';
import {readdirSync,statSync} from 'node:fs';
import {localizePage} from './localize-pages.mjs';
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
const urls=new Set([...sitemap('loc').map((i,e)=>sitemap(e).text()).get(),...routes.flatMap(p=>['','/en','/de'].map(prefix=>origin+prefix+p.production))]);
// Only 200 URLs: middleware-served service pages count; redirected legacy URLs never do.
const inSitemap=p=>!isLegacyRedirectPath(p)&&(isServicePath(p)||existsSync('public'+p+(p.endsWith('/')?'index.html':'')));
writeFileSync('public/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...urls].sort().filter(u=>inSitemap(new URL(u).pathname)).map(u=>`<url><loc>${u}</loc></url>`).join('')}</urlset>`);
// Site-wide link hygiene on the published HTML: point internal links straight at the final URL instead of a 301,
// and give Bosnian pages that have EN/DE translations the reciprocal hreflang set their translations already carry.
const localizedLegacy=[['landing-seo.html','usluge/seo-aeo-geo/'],['landing-ai.html','usluge/ai-automatizacija/']];
const htmlFiles=dir=>readdirSync(dir).flatMap(name=>{const f=`${dir}/${name}`;return statSync(f).isDirectory()?htmlFiles(f):f.endsWith('.html')?[f]:[];});
for(const file of htmlFiles('public')){
 if(/^public\/cinematic-(?!digitalx)/.test(file))continue;
 const before=readFileSync(file,'utf8');
 const fileLang=/^public\/(en|de)\//.exec(file)?.[1];
 let html=before;
 // On EN/DE pages a legacy Bosnian landing link should land on the same-language page, not the Bosnian one.
 if(fileLang)for(const [legacy,clean] of [...localizedLegacy,['landing-web.html','landing-web.html']])html=html.replaceAll(`"/${legacy}`,`"/${fileLang}/${clean}`).replaceAll(`${origin}/${legacy}`,`${origin}/${fileLang}/${clean}`);
 html=replaceLegacyServiceLinks(html);
 for(const lang of ['en','de'])for(const [legacy,clean] of localizedLegacy)html=html.replaceAll(`"/${lang}/${legacy}`,`"/${lang}/${clean}`).replaceAll(`${origin}/${lang}/${legacy}`,`${origin}/${lang}/${clean}`);
 const rel=file.slice('public'.length);
 if(!/^\/(en|de)\//.test(rel)&&!isLegacyRedirectPath(rel)&&!/<link[^>]+hreflang=/i.test(html)&&existsSync(`public/en${rel}`)&&existsSync(`public/de${rel}`)){
  const pretty=rel.endsWith('/index.html')?rel.slice(0,-'index.html'.length):rel;
  const links=[['bs',pretty],['en',`/en${pretty}`],['de',`/de${pretty}`],['x-default',pretty]].map(([l,p])=>`<link rel="alternate" hreflang="${l}" href="${origin}${p}">`).join('\n');
  html=html.replace(/<\/head>/i,`${links}\n</head>`);
 }
 if(html!==before)writeFileSync(file,html);
}
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
 '## Projekti i stranice',group(p=>['work','eynna','star','designer','examples','pricing','shop','blog','about','contact'].includes(p.id)),'',
 '## Kontakt',
 '- Email: digital.x.agency.ba@gmail.com',
 '- Telefon i WhatsApp: +387 64 438 3566',
 '- Instagram: https://www.instagram.com/digitalxmarketing.ba',
 `- Web: ${origin}/`,''
].join('\n'));
