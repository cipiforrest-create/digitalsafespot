import {readFileSync} from 'node:fs';
import {load} from 'cheerio';
import {copyTranslations} from './seo-copy.mjs';

const origin='https://www.digital-x-marketing.com';
const attributes=['alt','title','aria-label','placeholder','data-feature','data-goal-prompt'];
const reviewed=JSON.parse(readFileSync(new URL('./locales/reviewed.json',import.meta.url),'utf8'));
const dictionaries=Object.fromEntries(['en','de'].map((lang,index)=>{
 const cache=JSON.parse(readFileSync(new URL(`./locales/${lang}.json`,import.meta.url),'utf8'));
 for(const [key,values] of Object.entries(reviewed))cache[key]=values[index];
 for(const [key,values] of Object.entries(copyTranslations))cache[key]=values[index];
 // Symbols, numbers and brand names are not prose. Keep them intact.
 for(const key of Object.keys(cache)){
  if(!/\p{L}/u.test(key)||/^(?:INITIALIZING SIGNAL ENGINE|Cinematic (?:Hotel|Watch|Penthouse|KODENT|Perfume|Sneakers|Dentist|Deepsea|VANTA)$|DIGITAL X$|Digital X$)/.test(key))cache[key]=key;
  if(key.endsWith(' ↗')){
   const base=key.slice(0,-2);
   // Machine-translated link labels can end in runs of dots and quotes; a label before the arrow never needs them.
   cache[key]=(cache[base]||cache[key].replace(/[\u0600-\u06ff\uE000-\uF8FF↗]/g,'')).replace(/(?:\s*[.,"']|\s+\d)+\s*$/,'').trim()+' ↗';
  }
 }
 return [lang,cache];
}));
const demoLanguages={hotel:'en',watch:'en',penthouse:'en',clothes:'en',deepsea:'en',vanta:'en',sneakers:'en',dentist:'bs',perfume:'bs',kodent:'sr-Latn-ME'};
const languageNames={en:{en:'English',bs:'Bosnian','sr-Latn-ME':'Montenegrin'},de:{en:'Englisch',bs:'Bosnisch','sr-Latn-ME':'Montenegrinisch'}};
const languageNote={en:'in',de:'auf'};
export function localizePage(source,lang,route,routes){
 const $=load(source,{scriptingEnabled:false}),dictionary=dictionaries[lang];
 if(!dictionary)throw new Error(`Unsupported page language: ${lang}`);
 const translate=value=>{
  if(!value?.trim())return value;
  const key=value.trim();
  if(!(key in dictionary))throw new Error(`Missing ${lang} page translation: ${key}`);
  return value.replace(key,()=>dictionary[key]);
 };
 const localPath=value=>{
  if(!value||value.startsWith('#'))return value;
  const url=new URL(value,origin);
  if(url.origin!==origin||!routes.has(url.pathname))return value;
  const path=`/${lang}${url.pathname}${url.search}${url.hash}`;
  return value.startsWith(origin)?origin+path:path;
 };
 $('*').contents().filter((_,node)=>node.type==='text'&&!$(node).parents('script,style,svg,code,pre').length).each((_,node)=>{node.data=translate(node.data);});
 $('*').each((_,node)=>{for(const attr of attributes){const value=$(node).attr(attr);if(value)$(node).attr(attr,translate(value));}});
 $('meta[name="description"],meta[name="keywords"],meta[property="og:title"],meta[property="og:description"],meta[name="twitter:title"],meta[name="twitter:description"]').each((_,node)=>{$(node).attr('content',translate($(node).attr('content')));});
 $('a[href]').each((_,node)=>{$(node).attr('href',localPath($(node).attr('href')));});
 // Cinematic demos exist in one language only: keep the original link and say which language it opens in.
 $('a[href]').each((_,node)=>{
  const demoLang=demoLanguages[/^\/cinematic-([a-z]+)\/$/.exec($(node).attr('href'))?.[1]];
  if(!demoLang)return;
  $(node).attr('hreflang',demoLang);
  if(demoLang===lang)return;
  const note=`${languageNote[lang]} ${languageNames[lang][demoLang]}`;
  const label=$(node).attr('aria-label');
  if(label&&!label.includes(note))$(node).attr('aria-label',`${label} (${note})`);
  const eyebrow=$(node).closest('[data-showcase-panel]').find('.showcase-copy .eyebrow').first();
  if(eyebrow.length&&!eyebrow.text().includes(note))eyebrow.text(`${eyebrow.text()} · ${note}`);
 });
 const schema=value=>{
  if(Array.isArray(value))return value.map(schema);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,key==='inLanguage'?lang:schema(item)]));
  if(typeof value!=='string')return value;
  if(value.startsWith(origin))return localPath(value);
  return dictionary[value]??value;
 };
 $('script[type="application/ld+json"]').each((_,node)=>{$(node).text(JSON.stringify(schema(JSON.parse($(node).text()))).replace(/</g,'\\u003c'));});
 $('html').attr('lang',lang);
 $('link[rel="canonical"]').attr('href',origin+`/${lang}${route}`);
 $('meta[property="og:url"]').attr('content',origin+`/${lang}${route}`);
 $('meta[property="og:locale"],link[rel="alternate"][hreflang]').remove();
 $('head').append(`<meta property="og:locale" content="${lang==='de'?'de_DE':'en_US'}">`);
 for(const code of ['bs','en','de','x-default'])$('head').append(`<link rel="alternate" hreflang="${code}" href="${origin}${code==='bs'||code==='x-default'?'':`/${code}`}${route}">`);
 $('.language-nav a').each((_,node)=>{
  const code=$(node).attr('lang');
  $(node).attr('href',`${code==='bs'?'':`/${code}`}${route}`).attr('hreflang',code).removeAttr('target rel aria-current');
  if(code===lang)$(node).attr('aria-current','page');
 });
 return $.html();
}
