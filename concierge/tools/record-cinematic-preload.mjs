/* global window, scrollY, scrollBy -- used inside page.evaluate, which runs in the browser */
// Records, per cinematic example, the media a visitor's browser requests while scrolling the page top to bottom
// (desktop 1440×900 and phone 390×844), in request order, with sizes. cinematic-shared/preload.js warms that list
// ahead of the visitor. Usage: node concierge/tools/record-cinematic-preload.mjs [origin] [slug,slug,...]
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const origin=process.argv[2]||'http://localhost:4317';
const slugs=(process.argv[3]||'hotel,watch,penthouse,perfume,sneakers,deepsea,dentist,vanta,kodent').split(',');
const media=/\.(mp4|webm|m4v|mov|webp|avif|jpe?g|png)(\?|$)/i;
mkdirSync('cinematic-shared/preload',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
for(const slug of slugs){
 const out={};
 for(const [variant,viewport,mobile] of [['desktop',{width:1440,height:900},false],['mobile',{width:390,height:844},true]]){
  const page=await browser.newPage({viewport,deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});
  const seen=new Map();
  page.on('response',async r=>{
   const u=new URL(r.url());if(!media.test(u.pathname)||r.status()>=400)return;
   const key=u.origin===new URL(origin).origin?u.pathname:u.href;if(seen.has(key))return;
   const len=Number(r.headers()['content-length']||0);const range=r.headers()['content-range'];
   seen.set(key,Number(range?.split('/')[1])||len||0);
  });
  await page.goto(`${origin}/cinematic-${slug}/`,{waitUntil:'load',timeout:60000}).catch(()=>{});
  await page.waitForTimeout(2500);
  // Scroll like a visitor, in small steps, until the page stops moving.
  let still=0,last=-1;
  for(let i=0;i<500&&still<6;i++){
   await page.mouse.wheel(0,mobile?260:360).catch(()=>{});
   await page.waitForTimeout(160);
   const y=await page.evaluate(()=>{const before=scrollY;if(before===window.__lastY)scrollBy(0,300);window.__lastY=scrollY;return scrollY;}).catch(()=>last);
   still=y===last?still+1:0;last=y;
  }
  await page.waitForTimeout(2000);
  out[variant]=[...seen].map(([url,bytes])=>({url,bytes}));
  console.log(slug,variant,out[variant].length,'files',Math.round(out[variant].reduce((n,f)=>n+f.bytes,0)/1e6),'MB');
  await page.close();
 }
 writeFileSync(`cinematic-shared/preload/${slug}.json`,JSON.stringify(out));
}
await browser.close();
