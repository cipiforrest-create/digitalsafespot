// Measures the video → WebGL handoff: at the end of each ARRIVAL the live world must reproduce the film frame.
// Usage: node concierge/world-handoff-qa.mjs [outDir] [width]x[height]
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const [out='concierge/.screenshots/world-handoff',size='1440x900']=process.argv.slice(2);
const [width,height]=size.split('x').map(Number);mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
await page.goto(`${process.env.CONCIERGE_TEST_ORIGIN||'http://localhost:4317'}/ai-concierge-preview/`,{waitUntil:'load'});
await page.addStyleTag({content:'.cinema-state,.cinema-controls,.world-loader,.dx-navigation{visibility:hidden!important}'});
const story=page.locator('[data-cinema-story]'),report=[];
for(const cp of [0,1,2]){
 await page.evaluate(i=>document.querySelector(`[data-cinema-seek="${i}"]`).click(),cp);
 // Step back into the last few percent of ARRIVAL: world fully faded in, nothing alive yet, zoom exactly 1.
 await page.mouse.wheel(0,-70);await page.waitForTimeout(400);
 await page.waitForFunction(()=>document.querySelector('[data-world-canvas]')?.dataset.visible==='true',null,{timeout:15000});
 await page.waitForTimeout(700);
 const phase=await story.getAttribute('data-phase'),screen=await page.locator('.cinema-screen').boundingBox();
 const live=await page.screenshot({clip:screen});
 await page.addStyleTag({content:'.world-canvas{visibility:hidden!important}'});await page.waitForTimeout(200);
 const film=await page.screenshot({clip:screen});
 await page.evaluate(()=>{for(const s of [...document.querySelectorAll('style')])if(s.textContent.includes('.world-canvas{visibility'))s.remove();});
 writeFileSync(`${out}/${cp}-live.png`,live);writeFileSync(`${out}/${cp}-film.png`,film);
 const stats=await page.evaluate(async([a,b])=>{
  const load=src=>new Promise(r=>{const i=document.createElement('img');i.onload=()=>r(i);i.src=src;});
  const [ia,ib]=await Promise.all([load(a),load(b)]),c=document.createElement('canvas');c.width=ia.width;c.height=ia.height;const g=c.getContext('2d',{willReadFrequently:true});
  g.drawImage(ia,0,0);const da=g.getImageData(0,0,c.width,c.height).data;g.drawImage(ib,0,0);const db=g.getImageData(0,0,c.width,c.height).data;
  const diffs=new Float32Array(da.length/4);let sum=0;for(let i=0;i<diffs.length;i++){const d=(Math.abs(da[i*4]-db[i*4])+Math.abs(da[i*4+1]-db[i*4+1])+Math.abs(da[i*4+2]-db[i*4+2]))/3;diffs[i]=d;sum+=d;}
  const sorted=[...diffs].sort((x,y)=>x-y);return {mean:+(sum/diffs.length).toFixed(3),p99:sorted[Math.floor(sorted.length*.99)],p999:sorted[Math.floor(sorted.length*.999)],over8:+(diffs.filter(d=>d>8).length/diffs.length*100).toFixed(3)};
 },[`data:image/png;base64,${live.toString('base64')}`,`data:image/png;base64,${film.toString('base64')}`]);
 report.push({checkpoint:['ORB','X','ENGINE'][cp],phase,...stats});console.log(JSON.stringify(report.at(-1)));
}
writeFileSync(`${out}/report.json`,JSON.stringify(report,null,1));
await browser.close();
