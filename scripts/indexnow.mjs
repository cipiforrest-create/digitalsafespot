// Tell IndexNow engines (Bing, Yandex, Seznam, Naver; Bing also feeds ChatGPT search) which pages changed.
// Run AFTER a production deploy is live:  node scripts/indexnow.mjs [--dry-run] [--all]
// It reads the live sitemap, compares each URL's <lastmod> with concierge/.reports/indexnow-sent.json and submits
// only new or changed URLs; --all submits every URL. Google does not use IndexNow (it reads the sitemap instead).
import {readFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs';

const HOST='digital-x-marketing.com';
const ORIGIN=`https://${HOST}`;
const SENT='concierge/.reports/indexnow-sent.json';
const dryRun=process.argv.includes('--dry-run');
const all=process.argv.includes('--all');

const keyFile=readdirSync('.').find(f=>/^[0-9a-f]{32}\.txt$/.test(f));
if(!keyFile)throw new Error('IndexNow key file (<32 hex chars>.txt) is missing from the site root.');
const key=readFileSync(keyFile,'utf8').trim();

const live=await fetch(`${ORIGIN}/${keyFile}`);
if(!live.ok||(await live.text()).trim()!==key)throw new Error(`The key file is not live at ${ORIGIN}/${keyFile} yet; deploy first.`);

const sitemap=await (await fetch(`${ORIGIN}/sitemap.xml`)).text();
const entries=[...sitemap.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]*)<\/lastmod>)?<\/url>/g)].map(([,loc,lastmod])=>({loc,lastmod:lastmod||''}));
const sent=existsSync(SENT)?JSON.parse(readFileSync(SENT,'utf8')):{};
const changed=entries.filter(e=>all||sent[e.loc]!==e.lastmod).map(e=>e.loc);
console.log(`${entries.length} URLs in the live sitemap, ${changed.length} to submit.`);
if(!changed.length||dryRun){if(dryRun)console.log(changed.join('\n'));process.exit(0);}

// IndexNow accepts up to 10,000 URLs per request.
for(let i=0;i<changed.length;i+=10000){
 const urlList=changed.slice(i,i+10000);
 const res=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},body:JSON.stringify({host:HOST,key,keyLocation:`${ORIGIN}/${keyFile}`,urlList})});
 console.log(`IndexNow: HTTP ${res.status} for ${urlList.length} URLs`);
 if(res.status!==200&&res.status!==202)throw new Error(`IndexNow rejected the submission: HTTP ${res.status} ${await res.text()}`);
}
for(const e of entries)sent[e.loc]=e.lastmod;
writeFileSync(SENT,JSON.stringify(Object.fromEntries(Object.entries(sent).sort()),null,1)+'\n');
console.log(`Recorded in ${SENT}.`);
