// Last step of the build: give every sitemap URL a <lastmod> that moves only when the published page changes.
// concierge/.reports/sitemap-lastmod.json keeps {url: {hash, date}}; a URL keeps its date while the hash of its
// published HTML stays the same. New URLs start from the git date of their published file (falling back to today),
// so the first run carries real dates and rebuilding an unchanged site never touches them.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {sourcePathForService,isServicePath} from '../lib/service-seo.mjs';

const ORIGIN='https://www.digital-x-marketing.com';
const STORE='concierge/.reports/sitemap-lastmod.json';
const today=new Date().toISOString().slice(0,10);
const store=existsSync(STORE)?JSON.parse(readFileSync(STORE,'utf8')):{};

function publishedFile(pathname){
 const direct='public'+pathname+(pathname.endsWith('/')?'index.html':'');
 if(existsSync(direct))return direct;
 // Service pages are served by the middleware from another published file.
 if(isServicePath(pathname)){const source=sourcePathForService(pathname);if(source){const f='public/'+String(source).replace(/^\//,'');if(existsSync(f))return f;}}
 return null;
}
function gitDate(file){
 try{
  // Changed by this build and not committed yet: the page changes today.
  try{execFileSync('git',['diff','--quiet','HEAD','--',file],{stdio:'ignore'});}catch(e){if(e.status===1)return today;throw e;}
  return execFileSync('git',['log','-1','--format=%cs','--',file],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim()||null;
 }catch{return null;}
}

const xml=readFileSync('public/sitemap.xml','utf8');
const next={};let dated=0;
const out=xml.replace(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]*)<\/lastmod>)?<\/url>/g,(block,loc,given)=>{
 const file=publishedFile(new URL(loc,ORIGIN).pathname);
 if(!file)return given?block:`<url><loc>${loc}</loc></url>`;
 const hash=createHash('sha1').update(readFileSync(file)).digest('hex').slice(0,16);
 const known=store[loc];
 const date=known&&known.hash===hash?known.date:(known?today:(gitDate(file)||given||today));
 next[loc]={hash,date};dated++;
 return `<url><loc>${loc}</loc><lastmod>${date}</lastmod></url>`;
});
writeFileSync('public/sitemap.xml',out);
writeFileSync(STORE,JSON.stringify(Object.fromEntries(Object.entries(next).sort()),null,1)+'\n');
console.log(`Sitemap: ${dated} URLs carry a lastmod.`);
