import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {load} from 'cheerio';
import {pageFromPath} from '../shared/catalogue';
type Rule={source:string;headers:{key:string;value:string}[]};
const config=JSON.parse(readFileSync('vercel.json','utf8')) as {redirects:{source:string;has?:unknown}[];headers:Rule[]};
// The header sources used here are plain paths or regex groups, so they read as anchored regular expressions.
const headersFor=(path:string)=>Object.fromEntries(config.headers.filter(rule=>new RegExp(`^${rule.source}$`).test(path)).flatMap(rule=>rule.headers.map(h=>[h.key,h.value])));
test('home and the separate concierge landing are public and support voice',()=>{
 assert.equal(config.redirects.some(r=>r.source==='/'&&!r.has),false);
 const root=headersFor('/');
 assert.equal(root['X-Robots-Tag'],undefined);
 assert.match(root['Permissions-Policy'],/microphone=\(self\)/);
 assert.match(root['Content-Security-Policy'],/connect-src[^;]*wss:\/\/generativelanguage\.googleapis\.com/);
 assert.match(headersFor('/usluge/')['Permissions-Policy'],/microphone=\(self\)/);
 assert.equal(headersFor('/ai-concierge-preview/')['X-Robots-Tag'],undefined);
 assert.equal(pageFromPath('/ai-concierge-preview/'),'concierge');
 assert.equal(pageFromPath('/'),'home');
});
test('canonical pages publish at their public routes, with a distinct concierge landing',()=>{
 const $=load(readFileSync('public/index.html','utf8')),classic=load(readFileSync('index.html','utf8'));
 assert.equal($('meta[name=robots]').attr('content'),'index,follow,max-image-preview:large');
 assert.equal($('title').text(),classic('title').text());
 assert.equal($('link[rel=canonical]').attr('href'),'https://www.digital-x-marketing.com/');
 assert.deepEqual($('link[rel=alternate][hreflang]').toArray().map(n=>$(n).attr('hreflang')),['bs','en','de','x-default']);
 assert.equal($('h1').length,1);
 assert.deepEqual(JSON.parse($('script[data-page-schema]').text())['@graph'].map((n:{'@type':string|string[]})=>n['@type']),[['Organization','ProfessionalService'],'WebPage']);
 for(const route of ['usluge/index.html','cjenovnik/index.html','kontakt.html','ai-concierge-preview/index.html'])assert.doesNotMatch(load(readFileSync(`public/${route}`,'utf8'))('meta[name=robots]').attr('content')!,/noindex/);
 const landing=load(readFileSync('public/ai-concierge-preview/index.html','utf8'));assert.equal(landing('body').attr('data-page'),'concierge');assert.equal(landing('link[rel=canonical]').attr('href'),'https://www.digital-x-marketing.com/ai-concierge-preview/');
 assert.equal($('.brand').first().attr('href'),'/');assert.equal($('.xh-actions [data-tour-start]').length,1);assert.equal($('.final-system-labels a').length,4);
});
test('homepage answers search and AI audits: organisation, short descriptions, decorative images, llms.txt',()=>{
 for(const file of ['public/index.html','public/en/index.html','public/de/index.html']){
  const $=load(readFileSync(file,'utf8'));
  const description=$('meta[name=description]').attr('content')!;
  assert.ok(description.length>=50&&description.length<=160,file+' description length');
  assert.ok(description.split(/(?<=\.)\s/)[0].length<110,file+' description lead sentence');
  const org=JSON.parse($('script[data-page-schema]').text())['@graph'][0];
  assert.equal(org.name,'Digital X');assert.match(org.url,/^https:\/\/www\.digital-x-marketing\.com\/(?:en\/|de\/)?$/);
  assert.ok(org.logo?.url&&org.sameAs?.length&&org.address?.addressLocality==='Sarajevo');
  assert.equal($('img:not([alt])').length,0);assert.equal($('img[alt=""]:not([role=presentation])').length,0);
  // Below-the-fold media must not compete with the first screen.
  assert.equal($('.sequence-poster').attr('loading'),'lazy');assert.equal($('.launch-art img').attr('loading'),'lazy');
  assert.deepEqual($('img[fetchpriority=high]').toArray().map(n=>$(n).closest('.xs-plate').length),[1]);
 }
 const guide=JSON.parse(load(readFileSync('public/blog/aeo-vodic.html','utf8'))('script[data-page-schema]').text())['@graph'].find((n:{'@type':string})=>n['@type']==='HowTo');
 assert.equal(guide.step.length,5);
 const llms=readFileSync('public/llms.txt','utf8');
 for(const fact of ['Sarajevo','digital.x.agency.ba@gmail.com','## Početne cijene','## Vodiči','/blog/aeo-vodic.html'])assert.ok(llms.includes(fact),fact);
});
test('EN and DE pages carry reviewed translations, not machine errors the audit found',()=>{
 const pages=['index.html','usluge/seo-aeo-geo/index.html','cjenovnik/index.html','kontakt.html'];
 for(const lang of ['en','de'])for(const page of pages){
  const text=load(readFileSync(`public/${lang}/${page}`,'utf8'))('body').text();
  for(const bad of ['Synchronising folder','Ordner synchronisieren','AEO Rast','AEO-Rass','STRONGER BREND','QUANTITATIVE','RÜCKGEHENDE','Recipeist','Rezeptmacher'])assert.ok(!text.includes(bad),`${lang}/${page}: ${bad}`);
 }
 assert.ok(load(readFileSync('public/en/usluge/seo-aeo-geo/index.html','utf8'))('body').text().includes('Search intent mapping'));
 // The inquiry form offers every service, not a single run-together option.
 assert.equal(load(readFileSync('public/kontakt.html','utf8'))('select[name=service] option').length,9);
});
