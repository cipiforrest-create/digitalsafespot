// Real-browser motion QA for the homepage cinema story: required chapter positions, A–G handoff screenshots,
// fast wheel / PageDown / scrollbar-style jumps, reverse scrolling, resize and reduced motion.
// Usage (dev server running: npm run dev): npx tsx concierge/scroll-motion-qa.ts [outDir] [origin]
import {chromium,type Page} from '@playwright/test';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {cinemaTimeline,storyBeats} from './shared/cinema-timeline';
import {parseCinemaManifest} from './client/cinema-story';
const [out='concierge/.screenshots/motion',origin=process.env.CONCIERGE_TEST_ORIGIN||'http://localhost:4317']=process.argv.slice(2);
mkdirSync(out,{recursive:true});
const {clips}=parseCinemaManifest(readFileSync('ai-concierge-preview/media/cinema-v1/manifest.json','utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
type State={phase:string;clip:number;frame:number;checkpoint:number;world:string;world3d:number;hint:string;overflow:boolean};
const report:Record<string,unknown>={},errors:string[]=[],failures:string[]=[];
const check=(ok:boolean,msg:string)=>{if(!ok)failures.push(msg);};

async function open(width:number,height:number,mobile=false,reduced=false){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,hasTouch:mobile,isMobile:mobile,reducedMotion:reduced?'reduce':'no-preference'});
 page.on('pageerror',e=>errors.push(`${width}x${height}: ${e}`));
 page.on('console',m=>{if(m.type()==='error'&&!/favicon|Failed to load resource/.test(m.text()))errors.push(`${width}x${height}: ${m.text()}`);});
 // tsx keeps function names with a __name helper that does not exist inside the page.
 await page.addInitScript({content:'window.__name=(f)=>f'});
 await page.goto(`${origin}/`,{waitUntil:'load'});
 if(!reduced){
  // On phones the X hero comes first; the story starts below it and only mounts its film once in view.
  await page.evaluate(()=>{const s=document.querySelector('[data-cinema-story]')!;document.documentElement.scrollTop=s.getBoundingClientRect().top+document.documentElement.scrollTop;});
  await page.waitForFunction(()=>document.querySelector('[data-cinema-story]')!.hasAttribute('data-ready'),null,{timeout:90000});
  // Judge motion, not the network: wait until the whole film is local.
  await page.waitForFunction(()=>Number((document.querySelector('[data-cinema-story]') as HTMLElement).dataset.preloaded||0)>=100,null,{timeout:180000}).catch(()=>errors.push(`${width}x${height}: preload incomplete`));
 }
 return page;
}
const geometry=(page:Page)=>page.evaluate(()=>{const s=document.querySelector('[data-cinema-story]') as HTMLElement,st=s.querySelector('.cinema-stage') as HTMLElement;return {top:s.getBoundingClientRect().top+document.documentElement.scrollTop,stage:st.offsetHeight};});
const state=(page:Page)=>page.evaluate(():State=>{const s=document.querySelector('[data-cinema-story]') as HTMLElement,c=s.querySelector('[data-world-canvas]') as HTMLCanvasElement|null,d=s.dataset;
 return {phase:d.phase!,clip:Number(d.stage),frame:Number(d.frame),checkpoint:Number(d.checkpoint),world:d.world!,world3d:c&&!c.hidden&&c.dataset.visible==='true'?Number(c.style.opacity||0):0,hint:d.hint!,overflow:document.documentElement.scrollWidth>innerWidth};});
// Waits until scroll, frame, phase and the WebGL opacity have been stable for 45 animation frames (past the glide's ease-out tail).
const settle=(page:Page)=>page.waitForFunction(()=>new Promise(r=>{let last='',same=0;const tick=()=>{const s=document.querySelector('[data-cinema-story]') as HTMLElement,c=s.querySelector('[data-world-canvas]') as HTMLElement|null;
 const k=[document.documentElement.scrollTop,s.dataset.frame,s.dataset.phase,c?.style.opacity].join('|');same=k===last?same+1:0;last=k;if(same>=45)r(true);else requestAnimationFrame(tick);};tick();}),null,{timeout:30000});
async function goTo(page:Page,travel:number){const g=await geometry(page);await page.evaluate(y=>{document.documentElement.scrollTop=y;},g.top+travel*g.stage);await settle(page);return state(page);}
// Every rendered frame during an input burst: [clip, frame, phase].
const record=(page:Page)=>page.evaluate(()=>{const s=document.querySelector('[data-cinema-story]') as HTMLElement,w=window as unknown as {__rec:[number,number,string][];__raf:number};w.__rec=[];
 const tick=()=>{w.__rec.push([Number(s.dataset.stage),Number(s.dataset.frame),s.dataset.phase!,performance.now()]);w.__raf=requestAnimationFrame(tick);};tick();});
const stop=(page:Page)=>page.evaluate(()=>{const w=window as unknown as {__rec:[number,number,string,number][];__raf:number};cancelAnimationFrame(w.__raf);return w.__rec;});
// Largest source-frame step between consecutive rendered frames inside the given clip and frame range.
// Largest source-frame step per 1/60 s between consecutive rendered frames inside the given clip and frame range
// (normalised by the real render interval, so a slow headless GPU is not mistaken for skipping).
const maxStep=(rec:[number,number,string,number][],clip:number,a:number,b:number)=>{let m=0;for(let i=1;i<rec.length;i++){const [c0,f0,,t0]=rec[i-1],[c1,f1,,t1]=rec[i];if(c0===clip&&c1===clip&&Math.max(f0,f1)>=a&&Math.min(f0,f1)<=b)m=Math.max(m,Math.abs(f1-f0)/Math.max(1,(t1-t0)/16.7));}return Math.round(m*10)/10;};
// Visual change per 1/60 s (sum of the film's own measured frame-to-frame luma change across the frames passed).
// The film itself changes by up to its peak single-frame step; the presentation must never exceed that.
const peak=Math.max(...clips.flatMap(c=>c.motion??[0]));
const changePer60=(rec:[number,number,string,number][],clip:number)=>{const m=clips[clip].motion??[];let worst=0;for(let i=1;i<rec.length;i++){const [c0,f0,,t0]=rec[i-1],[c1,f1,,t1]=rec[i];if(c0!==clip||c1!==clip||f0===f1)continue;let sum=0;for(let f=Math.min(f0,f1)+1;f<=Math.max(f0,f1);f++)sum+=m[f]??0;worst=Math.max(worst,sum/Math.max(1,(t1-t0)/16.7));}return Math.round(worst*10)/10;};
const fps=(rec:[number,number,string,number][])=>Math.round((rec.length-1)/((rec.at(-1)![3]-rec[0][3])/1000));

for(const [width,height,mobile] of [[1440,900,false],[390,844,true]] as const){
 const tag=`${width}x${height}`,small=width<=720,t=cinemaTimeline(clips,small),page=await open(width,height,mobile);
 // 1. Required positions per chapter, and the A–G handoff sequence with screenshots.
 const rows:unknown[]=[];
 for(let i=0;i<3;i++){const s=t[i],len=s.end-s.start;
  for(const q of [0,.1,.25,.4,.6,.75,.85,.9,.94,.97,1]){const at=s.start+len*q+(q===0?.003:q===1?-.002:0),st=await state(page).then(()=>goTo(page,at)),inRun=at<s.start+s.run;
   rows.push({chapter:i+1,q,...st});
   check(st.clip===i,`${tag} ch${i+1} ${q}: clip ${st.clip}`);check(!st.overflow,`${tag} overflow`);
   if(inRun)check(st.world3d===0&&st.checkpoint===-1,`${tag} ch${i+1} ${q}: 3D visible during film (${st.world3d})`);
   else{check(st.frame===clips[i].frames-1,`${tag} ch${i+1} ${q}: not on stop frame (${st.frame})`);check(st.checkpoint===i,`${tag} ch${i+1} ${q}: checkpoint ${st.checkpoint}`);}
  }
  const [a,b]=storyBeats[i][1],shots:[string,number][]=[['A-early',s.start+s.pace[a]*.5],['B-transform',s.start+(s.pace[a]+s.pace[b])/2],['C-half-handoff',s.start+s.run+s.stop*.06],['D-stop',s.start+s.run+s.stop*.3],['F-onward',i<2?s.end+.3:s.start+s.run+s.stop+.3],['G-reverse-handoff',s.start+s.run+s.stop*.06],['G-reverse-film',s.start+s.pace[b]-.05]];
  for(const [name,at] of shots){const st=await goTo(page,at);
   if(name==='D-stop'){
    // E: interaction at the exact stop: a horizontal drag across the stage turns the live object.
    await page.screenshot({path:`${out}/${tag}-ch${i+1}-D-stop.png`});
    const x=width*.5,y=height*(small?.3:.72);await page.mouse.move(x,y);await page.mouse.down();for(let k=1;k<=12;k++)await page.mouse.move(x+k*16,y+k);await page.mouse.up();await page.waitForTimeout(250);
    await page.screenshot({path:`${out}/${tag}-ch${i+1}-E-interaction.png`});rows.push({chapter:i+1,shot:'E-interaction',...await state(page)});continue;}
   await page.screenshot({path:`${out}/${tag}-ch${i+1}-${name}.png`});rows.push({chapter:i+1,shot:name,...st});
  }
 }
 report[`${tag} positions`]=rows;
 // 2. Velocity: fast wheel, PageDown, a scrollbar-style drag and an instant 3-stage jump through each transformation.
 const vel:Record<string,unknown>={};
 for(let i=0;i<3;i++){const s=t[i],[a,b]=storyBeats[i][1],from=s.start+s.pace[a]-.15,to=s.start+s.pace[b]+.15,g=await geometry(page);
  for(const mode of ['wheel-fast','pagedown','scrollbar-drag','instant-jump']){
   if(mode==='pagedown'&&mobile)continue;
   await goTo(page,from);await record(page);
   if(mode==='wheel-fast'){if(!mobile){await page.mouse.move(width/2,height/2);for(let k=0;k<12;k++){await page.mouse.wheel(0,(to-from)*g.stage/12);await page.waitForTimeout(16);}}else{await page.evaluate(([y0,y1])=>new Promise<void>(r=>{let k=0;const tick=()=>{k++;document.documentElement.scrollTop=y0+(y1-y0)*Math.min(1,k/12);if(k<12)requestAnimationFrame(tick);else r();};tick();}),[g.top+from*g.stage,g.top+to*g.stage]);}}
   else if(mode==='pagedown'){await page.keyboard.press('PageDown');await page.keyboard.press('PageDown');await page.keyboard.press('PageDown');}
   else if(mode==='scrollbar-drag')await page.evaluate(([y0,y1])=>new Promise<void>(r=>{let k=0;const tick=()=>{k++;document.documentElement.scrollTop=y0+(y1-y0)*Math.min(1,k/20);if(k<20)requestAnimationFrame(tick);else r();};tick();}),[g.top+from*g.stage,g.top+to*g.stage]);
   else await page.evaluate(y=>{document.documentElement.scrollTop=y;},g.top+to*g.stage);
   await settle(page);const rec=await stop(page),step=maxStep(rec,i,a,b),visited=new Set(rec.filter(r=>r[0]===i&&r[1]>=a&&r[1]<=b).map(r=>r[1])).size;
   vel[`ch${i+1} ${mode}`]={maxFrameStepPer60Hz:step,lumaChangePer60Hz:changePer60(rec,i),fps:fps(rec),transformationFramesShown:visited,of:b-a+1,renders:rec.length};
   check(changePer60(rec,i)<=peak*1.05,`${tag} ch${i+1} ${mode}: visual change ${changePer60(rec,i)} per 1/60 s exceeds the film's own peak ${peak}`);
  }
  // Reverse immediately after the fast movement.
  await record(page);await page.evaluate(y=>{document.documentElement.scrollTop=y;},g.top+from*g.stage);await settle(page);
  const rec=await stop(page);vel[`ch${i+1} reverse-after-fast`]={maxFrameStepPer60Hz:maxStep(rec,i,a,b),lumaChangePer60Hz:changePer60(rec,i),fps:fps(rec),renders:rec.length};check(changePer60(rec,i)<=peak*1.05,`${tag} ch${i+1} reverse: visual change ${changePer60(rec,i)} per 1/60 s`);
 }
 report[`${tag} velocity`]=vel;writeFileSync(`${out}/report.json`,JSON.stringify({...report,errors,failures},null,1));
 // 3. Reverse from the ENGINE back to the opening: every position matches its forward state.
 const probe=[...Array(28)].map((_,k)=>.35+k*(t[2].start+t[2].run+t[2].stop*.5-.35)/27),fwd:State[]=[],back:State[]=[];
 for(const p of probe)fwd.push(await goTo(page,p));for(const p of [...probe].reverse())back.unshift(await goTo(page,p));
 const mismatch=probe.filter((_,k)=>JSON.stringify(fwd[k])!==JSON.stringify(back[k]));
 report[`${tag} reverse`]={positions:probe.length,mismatches:mismatch.length,firstState:back[0]};check(!mismatch.length,`${tag} reverse mismatches at ${mismatch.join(',')}`);
 await page.close();
}
// 4. Resize and orientation: the film keeps its frame (or checkpoint), no overflow, no reset.
{const page=await open(1440,900),t=cinemaTimeline(clips,false),res:unknown[]=[];
 const at=t[1].start+(t[1].pace[storyBeats[1][1][0]]+t[1].pace[storyBeats[1][1][1]])/2;let before=await goTo(page,at);
 for(const [w,h] of [[1024,768],[768,1024],[390,844],[844,390],[390,844],[360,740],[1440,900]]){await page.setViewportSize({width:w,height:h});await page.waitForTimeout(400);await settle(page);const st=await state(page);
  res.push({size:`${w}x${h}`,...st});check(st.clip===before.clip&&Math.abs(st.frame-before.frame)<=2,`resize ${w}x${h}: ${before.clip}/${before.frame} → ${st.clip}/${st.frame}`);check(!st.overflow,`resize ${w}x${h} overflow`);before=st;}
 report.resize=res;await page.close();}
// 5. Reduced motion: still key states, no scroll-length stage, content reachable.
{const page=await open(1440,900,false,true);const r=await page.evaluate(()=>{const s=document.querySelector('[data-cinema-story]') as HTMLElement;return {enhanced:s.hasAttribute('data-enhanced'),height:s.style.height,phase:s.dataset.phase??null,stills:s.querySelectorAll('.cinema-static-art').length,overflow:document.documentElement.scrollWidth>innerWidth,smooth:getComputedStyle(document.documentElement).scrollBehavior};});
 await page.screenshot({path:`${out}/reduced-1440x900.png`,fullPage:false});report.reduced=r;check(!r.enhanced&&!r.height&&r.smooth!=='smooth',`reduced motion: ${JSON.stringify(r)}`);await page.close();}
await browser.close();
report.errors=errors;report.failures=failures;
writeFileSync(`${out}/report.json`,JSON.stringify(report,null,1));
console.log(JSON.stringify({velocity:Object.fromEntries(Object.entries(report).filter(([k])=>k.endsWith('velocity')||k.endsWith('reverse'))),resize:report.resize,reduced:report.reduced,errors,failures},null,1));
process.exitCode=failures.length?1:0;
