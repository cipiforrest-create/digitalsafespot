import {readFileSync,existsSync,statSync,writeFileSync,mkdirSync} from 'node:fs';
import {load} from 'cheerio';
const config=JSON.parse(readFileSync('vercel.json','utf8'));
const origin='https://www.digital-x-marketing.com';
const sitemap=load(readFileSync('public/sitemap.xml','utf8'),{xmlMode:true});
const urls=sitemap('loc').map((i,e)=>sitemap(e).text()).get();
const errors=[],redirects=[];
function fileFor(path){for(const p of ['public'+path,'public'+path+'/index.html'])if(existsSync(p)&&statSync(p).isFile())return p;return null;}
function resolve(url,seen=new Set()){
 if(seen.has(url.href))return {error:'redirect loop'};seen.add(url.href);
 const rule=config.redirects.find(r=>r.source.replace(/\/$/,'')===url.pathname.replace(/\/$/,'')&&(!r.has||r.has.every(h=>h.type==='query'&&url.searchParams.get(h.key)===h.value)));
 if(rule){redirects.push({from:url.href,to:rule.destination});return resolve(new URL(rule.destination,origin),seen);}
 const file=fileFor(url.pathname);return file?{file,url}:{error:'missing file'};
}
for(const url of urls){const result=resolve(new URL(url));if(result.error){errors.push({page:url,error:result.error});continue;}const $=load(readFileSync(result.file,'utf8'));
 for(const raw of $('a[href],img[src],script[src],link[rel=stylesheet]').map((i,e)=>$(e).attr('href')||$(e).attr('src')).get()){
  if(!raw||/^(mailto:|tel:|data:|javascript:)/.test(raw))continue;
  const u=new URL(raw,url);if(!['www.digital-x-marketing.com','digital-x-marketing.com'].includes(u.host)||u.pathname.startsWith('/api/'))continue;
  const target=resolve(u);if(target.error)errors.push({page:url,target:raw,error:target.error});
 }
 const canonical=$('link[rel=canonical]').attr('href');if(!canonical)errors.push({page:url,error:'missing canonical'});else if(resolve(new URL(canonical,url)).error)errors.push({page:url,target:canonical,error:'broken canonical'});
}
mkdirSync('concierge/.reports',{recursive:true});writeFileSync('concierge/.reports/link-check.json',JSON.stringify({pages:urls.length,errors,redirects},null,2));
console.log(JSON.stringify({pages:urls.length,errors:errors.length,targets:[...new Set(errors.map(e=>e.target||e.page))]},null,2));
process.exitCode=errors.length?1:0;
