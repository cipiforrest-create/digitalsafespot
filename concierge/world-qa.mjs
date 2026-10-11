// Screenshots the cinema story at chosen scroll positions (in stage heights) for visual QA.
// Usage: node concierge/world-qa.mjs <outDir> <width>x<height> <pos,pos,...> [query] [--reduced] [--mobile]
import {chromium} from '@playwright/test';
import {mkdirSync} from 'node:fs';
const [out='concierge/.screenshots/world',size='1440x900',list='0',query='',...flags]=process.argv.slice(2);
const [width,height]=size.split('x').map(Number);mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,hasTouch:flags.includes('--mobile'),isMobile:flags.includes('--mobile'),reducedMotion:flags.includes('--reduced')?'reduce':'no-preference'});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.goto(`${process.env.CONCIERGE_TEST_ORIGIN||'http://localhost:4317'}/ai-concierge-preview/${query}`,{waitUntil:'load'});
for(const pos of list.split(',').map(Number)){
 await page.evaluate(p=>{const s=document.querySelector('[data-cinema-story]'),root=document.documentElement;root.scrollTop=s.getBoundingClientRect().top+root.scrollTop+p*s.querySelector('.cinema-stage').offsetHeight;},pos);
 // The page scrolls smoothly: wait until the position settles before judging a frame.
 await page.waitForFunction(()=>new Promise(r=>{const root=document.documentElement;let last=-1,same=0;const tick=()=>{same=root.scrollTop===last?same+1:0;last=root.scrollTop;if(same>=6)r(true);else setTimeout(tick,16);};tick();}),null,{timeout:20000}).catch(()=>{});
 await page.waitForFunction(()=>{const s=document.querySelector('[data-cinema-story]');return !s.hasAttribute('data-enhanced')||s.hasAttribute('data-ready');},null,{timeout:15000}).catch(()=>{});
 await page.waitForTimeout(1600);
 // --drag: a horizontal drag across the empty stage, as a visitor rotating the object.
 if(flags.includes('--drag')){const x=width*.52,y=height*.72;await page.mouse.move(x,y);await page.mouse.down();for(let i=1;i<=12;i++)await page.mouse.move(x+i*18,y+i*1.5);await page.mouse.up();await page.waitForTimeout(500);}
 const state=await page.evaluate(()=>{const s=document.querySelector('[data-cinema-story]');return {...s.dataset,scrollWidth:document.documentElement.scrollWidth};});
 await page.screenshot({path:`${out}/${width}x${height}-${String(pos).replace('.','_')}.png`});
 console.log(pos,JSON.stringify({phase:state.phase,stage:state.stage,frame:state.frame,world:state.world,fail:state.worldFail,sub:state.sub,overflow:state.scrollWidth>width}));
}
console.log(errors.length?`ERRORS:\n${errors.join('\n')}`:'No console errors');
await browser.close();
