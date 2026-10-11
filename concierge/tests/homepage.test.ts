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
 assert.deepEqual(JSON.parse($('script[data-page-schema]').text())['@graph'].map((n:{'@type':string})=>n['@type']),['ProfessionalService','WebPage']);
 for(const route of ['usluge/index.html','cjenovnik/index.html','kontakt.html','ai-concierge-preview/index.html'])assert.doesNotMatch(load(readFileSync(`public/${route}`,'utf8'))('meta[name=robots]').attr('content')!,/noindex/);
 const landing=load(readFileSync('public/ai-concierge-preview/index.html','utf8'));assert.equal(landing('body').attr('data-page'),'concierge');assert.equal(landing('link[rel=canonical]').attr('href'),'https://www.digital-x-marketing.com/ai-concierge-preview/');
 assert.equal($('.brand').first().attr('href'),'/');assert.equal($('.xh-actions [data-tour-start]').length,1);assert.equal($('.final-system-labels a').length,4);
});
