import {ARRIVE,cinemaPosition,cinemaTimeline,cinemaTravel,glide,glideLimits,pacing,type CinemaClip,type CinemaPosition} from '../shared/cinema-timeline';
import {FRAME,frameRect,mobileRoi,moduleAnchor,orbCal,systemCal,xCal,type Px} from '../shared/world-calibration';
import type {NodePlacement,World} from './world';
type Manifest={clips:CinemaClip[]};
export function parseCinemaManifest(value:string):Manifest{
 const data=JSON.parse(value) as Manifest;
 if(!Array.isArray(data.clips)||data.clips.length!==3||data.clips.some((c,i)=>c.id!==i+1||!Number.isFinite(c.duration)||c.duration<=0||c.duration>30||!Array.isArray(c.times)||c.times.length<2||c.times.length>2000||c.frames!==c.times.length||c.times.some((t,j)=>!Number.isFinite(t)||t<0||(j>0&&t<=c.times[j-1]))||(c.motion!==undefined&&(!Array.isArray(c.motion)||c.motion.length!==c.frames||c.motion.some(m=>!Number.isFinite(m)||m<0||m>255)))))throw new Error('Invalid cinematic manifest');
 return data;
}
// Static anchors (film pixels) for the spatial service nodes when the live world is unavailable.
export const nodeAnchors:Px[][]=[orbCal.nodes.map(n=>n.anchor),xCal.nodes.map(n=>n.anchor),[...systemCal.tiles.map(([l,,r,b])=>[(l+r)/2,b+10] as Px),...systemCal.modules.map((_,i)=>moduleAnchor(i))]];
const fade=(v:number)=>Math.min(1,Math.max(0,v));
function worldCapable(){
 const q=new URLSearchParams(location.search).get('world');if(q==='0')return false;if(q==='1')return true;
 const nav=navigator as Navigator&{deviceMemory?:number;connection?:{saveData?:boolean}};
 if(nav.connection?.saveData||(nav.deviceMemory!==undefined&&nav.deviceMemory<2)||(nav.hardwareConcurrency||4)<2)return false;
 try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}catch{return false;}
}
export function mountCinemaStory(section:HTMLElement,signal:AbortSignal){
 if(signal.aborted)return;
 let clips:CinemaClip[];try{clips=parseCinemaManifest(section.dataset.cinemaManifest||'').clips;}catch{return;}
 const canvas=section.querySelector<HTMLCanvasElement>('.cinema-screen canvas')!,context=canvas.getContext('2d');if(!context)return;
 const stage=section.querySelector<HTMLElement>('.cinema-stage')!,screen=section.querySelector<HTMLElement>('.cinema-screen')!;
 const worldCanvas=section.querySelector<HTMLCanvasElement>('[data-world-canvas]'),loaderEl=section.querySelector<HTMLElement>('.world-loader');
 const states=[...section.querySelectorAll<HTMLElement>('[data-cinema-state]')];
 const tags=[...section.querySelectorAll<HTMLElement>('.world-tag')];
 const groups=[0,1,2].map(i=>[...section.querySelectorAll<HTMLElement>(`[data-world-nodes="${i}"] [data-world-node]`)]);
 const sides=[orbCal.nodes.map(n=>n.side),xCal.nodes.map(n=>n.side),[...systemCal.tiles.map(()=>'below'),...systemCal.modules.map((_,i)=>moduleAnchor(i)[0]<systemCal.base[0]?'left':'right')]];
 groups.forEach((nodes,cp)=>nodes.forEach((n,i)=>n.dataset.side=sides[cp][i]??'right'));
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),mobile=matchMedia('(max-width:720px)');
 // Chrome skips a MediaQueryList 'change' event when .matches was read after the change but before the event (the
 // preload loop reads it on every fetch). So the event comes from a separate query nothing reads, and the preference is
 // also re-checked wherever the loops read it.
 let motion=reduced.matches;const checkMotion=()=>{if(reduced.matches!==motion)mode();};
 const bitmaps=new Map<string,ImageBitmap>(),blobs=new Map<string,Blob>(),pending=new Map<string,AbortController>(),decoding=new Set<string>(),failed=new Set<string>();
 let stopped=false,visible=false,raf=0,epoch=0,bucket=mobile.matches?640:864,w=0,h=0,activeClip=0,activeFrame=0,lastTime=0,lastHold=false,lastTravel=0,loadingTimer=0,loaderTimer=0;
 const dragged=[false,false,false];
 let playhead=-1,snapNext=false,lastRender=0,worldQueued=false,world:World|null=null,worldState:'off'|'loading'|'on'|'fallback'=worldCanvas&&worldCapable()?'off':'fallback',last:CinemaPosition|null=null;
 const key=(clip:number,frame:number)=>`${clip}:${frame}`;
 // Phones crop the film to its centre (see mobileRoi); the live world applies the same fit.
 const roi=()=>mobile.matches?mobileRoi(last?.clip??0,last?.progress??0,last?.hold??false):0;
 const distance=(k:string)=>{const[c,f]=k.split(':').map(Number);return lastHold&&c===activeClip+1&&f<2?24+f:Math.abs(c-activeClip)*3000+Math.abs(f-activeFrame);};
 function trim<T>(map:Map<string,T>,max:number,dispose?:(x:T)=>void){while(map.size>max){const far=[...map.keys()].sort((a,b)=>distance(b)-distance(a))[0];dispose?.(map.get(far)!);map.delete(far);}}
 function schedule(){checkMotion();if(!raf&&visible&&!stopped&&!reduced.matches&&!document.hidden)raf=requestAnimationFrame(render);}
 function reset(){epoch++;warmCursor=0;warm=0;pending.forEach(c=>c.abort());pending.clear();bitmaps.forEach(b=>b.close());bitmaps.clear();blobs.clear();failed.clear();decoding.clear();section.removeAttribute('data-ready');}
 function decode(k:string){
  if(bitmaps.has(k)||failed.has(k)||decoding.has(k)||!blobs.has(k)||decoding.size>=6)return;
  const version=epoch;decoding.add(k);
  void createImageBitmap(blobs.get(k)!).then(b=>{if(stopped||version!==epoch){b.close();return;}bitmaps.set(k,b);trim(bitmaps,mobile.matches?22:28,b=>b.close());}).catch(()=>failed.add(k)).finally(()=>{if(version===epoch)decoding.delete(k);schedule();});
 }
 function request(clip:number,frame:number){
  if(frame<0||frame>=clips[clip].frames)return;const k=key(clip,frame);
  if(blobs.has(k)){if(distance(k)<12)decode(k);return;}
  if(pending.has(k)||failed.has(k)||pending.size>=4)return;
  const c=new AbortController(),version=epoch;pending.set(k,c);
  void fetch(`/ai-concierge-preview/media/cinema-v1/clip-${clip+1}/${bucket}/${String(frame).padStart(4,'0')}.webp`,{signal:c.signal})
   .then(r=>{if(!r.ok)throw new Error('Frame unavailable');return r.blob();})
   .then(b=>{if(stopped||version!==epoch)return;blobs.set(k,b);if(distance(k)<12)decode(k);})
   .catch(()=>{if(!c.signal.aborted&&version===epoch)failed.add(k);})
   .finally(()=>{if(pending.get(k)===c)pending.delete(k);schedule();});
 }
 // Whole-film preload after the first frame: every clip in story order, two quiet requests at a time, so fast
 // scrolling later finds compressed frames already local and only decodes them.
 let warm=0,warmCursor=0;const total=()=>clips.reduce((n,c)=>n+c.frames,0);
 function preload(){
  checkMotion();if(stopped||reduced.matches||(navigator as Navigator&{connection?:{saveData?:boolean}}).connection?.saveData)return;const version=epoch;
  // Video 1 (the opening) warms four at a time from the first moment; the rest of the film follows two at a time.
  while(warm<(warmCursor<clips[0].frames?4:2)&&warmCursor<total()){
   let n=warmCursor++,clip=0;while(n>=clips[clip].frames){n-=clips[clip].frames;clip++;}
   const k=key(clip,n);if(blobs.has(k)||pending.has(k)||failed.has(k))continue;warm++;
   void fetch(`/ai-concierge-preview/media/cinema-v1/clip-${clip+1}/${bucket}/${String(n).padStart(4,'0')}.webp`,{signal}).then(r=>r.ok?r.blob():Promise.reject(new Error('Frame unavailable')))
    .then(b=>{if(!stopped&&version===epoch&&!blobs.has(k)){blobs.set(k,b);if(distance(k)<12)decode(k);}}).catch(()=>{}).finally(()=>{if(version===epoch){warm--;preload();}});
  }
  section.dataset.preloaded=String(Math.round(blobs.size/total()*100));
 }
 function draw(k:string,alpha:number){
  const b=bitmaps.get(k);if(!b)return;const r=frameRect(w,h,{w:b.width,h:b.height},roi());
  context!.globalAlpha=alpha;context!.drawImage(b,r.x,r.y,r.w,r.h);context!.globalAlpha=1;
 }
 // Spatial nodes follow the live projection when the world runs, otherwise their film anchors.
 function place(cp:number,pts:NodePlacement[]){
  const set=(n:HTMLElement,p:NodePlacement)=>{n.style.setProperty('--nx',`${p.x.toFixed(1)}px`);n.style.setProperty('--ny',`${p.y.toFixed(1)}px`);n.style.setProperty('--nd',String(p.depth));};
  groups[cp].forEach((n,i)=>{if(pts[i])set(n,pts[i]);});
  // The phone tile labels follow the same four tile anchors.
  if(cp===2){const edge=stage.clientWidth;tags.forEach((n,i)=>{const p=pts[i];if(!p)return;const half=n.offsetWidth/2;set(n,{...p,x:half?Math.min(edge-half-6,Math.max(half+6,p.x)):p.x});});}
 }
 function placeStatic(){
  const s=screen.getBoundingClientRect(),g=stage.getBoundingClientRect(),r=frameRect(s.width,s.height,FRAME,roi());
  nodeAnchors.forEach((list,cp)=>place(cp,list.map(([u,v])=>({x:s.left-g.left+r.x+u*r.w/FRAME.w,y:s.top-g.top+r.y+v*r.h/FRAME.h,depth:0}))));
 }
 function setWorld(state:typeof worldState){worldState=state;section.dataset.world=state;if(state==='fallback'){world?.dispose();world=null;if(worldCanvas){worldCanvas.hidden=true;worldCanvas.style.opacity='0';}placeStatic();}}
 async function startWorld(){
  if(worldState!=='off'||!worldCanvas||stopped)return;setWorld('loading');
  try{
   const {createWorld}=await import('./world');if(stopped)return;
   worldCanvas.hidden=false;
   world=createWorld({canvas:worldCanvas,screen,stage,media:'/ai-concierge-preview/media/cinema-v1',bucket,small:mobile.matches,place,fail:reason=>{section.dataset.worldFail=reason;setWorld('fallback');},dragged:cp=>{if(cp>=0&&!dragged[cp]){dragged[cp]=true;schedule();}}},signal);
   if(!world){setWorld('fallback');return;}
   setWorld('on');
   if(new URLSearchParams(location.search).has('debug3d'))void import('./world-debug').then(m=>m.mountWorldDebug(section,()=>world,signal));
   await world.prepare(last&&last.checkpoint>0?last.checkpoint:0);if(last)world.update(last);
  }catch(e){section.dataset.worldFail=e instanceof Error?e.message.slice(0,80):'error';setWorld('fallback');}
 }
 const idle=(fn:()=>void)=>'requestIdleCallback' in window?requestIdleCallback(fn,{timeout:1200}):setTimeout(fn,400);
 function copy(p:CinemaPosition){
  // Opening typography reveals with Video 1 progress, then clears for the ORB handoff.
  section.dataset.reveal=p.clip===0&&!p.hold?String(p.progress<.2?0:p.progress<.45?1:p.progress<.7?2:p.progress<.9?3:4):'hold';
  // Phones split each checkpoint into two screens (a: arrival and first half of explore, b: the rest) and show the
  // coming chapter's title during its video, so the space under the film band is never empty.
  // The final Engine scene swaps its chapter title for the closing copy once the camera has eased over (converge ≥ .5).
  const closing=p.phase==='CONVERGENCE'||p.phase==='CONTENT'||(p.checkpoint===2&&p.converge>=.5);
  section.dataset.sub=!p.hold?'v':closing?'c':p.phase.endsWith('_ARRIVAL')||(p.phase.endsWith('_EXPLORE')&&p.explore<.5)?'a':'b';
  const index=closing?3:p.clip;
  states.forEach((s,i)=>{
   let o=0;
   if(i===index){
    if(i===3)o=p.phase==='CONTENT'?1:fade((p.converge-.5)/.5);
    else if(!p.hold)o=i===0?1:mobile.matches?fade((p.progress-.1)/.2):fade((p.progress-.9)/.1);
    else if(p.phase.endsWith('_RELEASE'))o=i<2?1-fade(p.local/.5):1-fade((p.local-.3)/.6);
    else o=1;
   }
   // In the final Engine scene the chapter stays mounted (its live service nodes and tile tags stay on screen) while only
   // its heading fades out under the closing copy.
   const engine=i===2&&p.checkpoint===2&&p.hold;
   if(engine){o=1;s.style.setProperty('--cinema-heading-opacity',String(1-fade(p.converge/.5)));}else s.style.removeProperty('--cinema-heading-opacity');
   s.hidden=i!==index&&!engine;s.style.setProperty('--cinema-copy-opacity',String(o));s.inert=(i!==index&&!engine)||o<.5;
  });
 }
 function render(){
  raf=0;checkMotion();if(stopped||reduced.matches||!visible)return;
  const target=Math.max(0,-section.getBoundingClientRect().top/Math.max(1,stage.offsetHeight)),now=performance.now(),dt=lastRender?Math.min(.05,(now-lastRender)/1000):1/60;lastRender=now;
  // Eased, speed-capped playhead (see glide): a wheel notch glides across frames, a fast flick or scrollbar drag still
  // plays every transformation frame, and it settles exactly on the scroll position. Explicit seeks land directly.
  const total=cinemaTimeline(clips,mobile.matches)[2].end;
  // Phones compress the film travel, so their speed cap scales with it: the same film rate on every device.
  playhead=snapNext?target:glide(playhead,target,dt,total,{...glideLimits,speed:glideLimits.speed*(mobile.matches?pacing.small.scale:1)});snapNext=false;
  const travel=playhead,p=cinemaPosition(clips,mobile.matches,travel);
  // While gliding the next render follows; once settled the clock resets, so the first frame of the next input burst
  // steps one display frame, not the whole idle gap.
  if(playhead!==target)schedule();else lastRender=0;
  lastTravel=travel;activeClip=p.clip;activeFrame=p.frame;lastTime=p.time;lastHold=p.hold;last=p;
  section.dataset.stage=String(p.clip);section.dataset.frame=String(p.frame);section.dataset.holding=String(p.hold);section.dataset.phase=p.phase;section.dataset.checkpoint=String(p.checkpoint);
  section.style.setProperty('--cinema-progress',String(p.position/p.total));section.style.setProperty('--world-explore',String(p.explore));
  copy(p);
  section.querySelectorAll<HTMLElement>('[data-cinema-seek]').forEach(a=>a.setAttribute('aria-current',String(Number(a.dataset.cinemaSeek)===p.clip)));
  pending.forEach((c,k)=>{if(distance(k)>40){c.abort();pending.delete(k);}});
  // Nearest frames first (both directions), then a lookahead; the whole film also warms in the background.
  [p.frame,p.next,p.frame-1,p.next+1,p.next+2,p.frame-2,p.frame-3,...Array.from({length:24},(_,i)=>p.next+3+i)].forEach(f=>request(p.clip,f));
  if(p.hold&&p.clip<2&&pending.size<4){request(p.clip+1,0);request(p.clip+1,1);}
  // Late in a release the film shows the next clip's first frame, so the WebGL fade reveals exact continuity.
  const shown=p.handoff&&bitmaps.has(key(p.clip+1,0))?key(p.clip+1,0):key(p.clip,p.frame),following=key(p.clip,p.next);
  const shownClip=Number(shown.split(':')[0]);
  // A missing frame falls back to the closest earlier frame (the one just shown), never to one further ahead: no back-and-forth jumps.
  const want=Number(shown.split(':')[1]),lag=(k:string)=>{const f=Number(k.split(':')[1]);return f<=want?want-f:(f-want)*6;};
  const nearest=bitmaps.has(shown)?shown:[...bitmaps.keys()].filter(k=>Number(k.split(':')[0])===shownClip).sort((a,b)=>lag(a)-lag(b))[0];
  if(nearest){
   context!.fillStyle='#030303';context!.fillRect(0,0,w,h);draw(nearest,1);
   if(!p.handoff&&bitmaps.has(shown)&&bitmaps.has(following)&&p.next!==p.frame)draw(following,p.mix);
   section.dataset.ready='';clearTimeout(loadingTimer);loadingTimer=0;section.querySelector<HTMLElement>('.cinema-loading')!.hidden=true;
  }else{
   section.removeAttribute('data-ready');if(!loadingTimer)loadingTimer=window.setTimeout(()=>{if(!stopped){const label=section.querySelector<HTMLElement>('.cinema-loading')!;label.textContent=failed.has(shown)?'Animacija trenutno nije dostupna. Sadržaj možete nastaviti istraživati.':'Pripremamo sljedeći kadar…';label.hidden=false;}},700);
  }
  loader();if(!warm&&warmCursor===0)preload();
  // Drag hint: shown at a live checkpoint until the visitor has turned that object once.
  section.dataset.hint=String(worldState==='on'&&p.phase.endsWith('_EXPLORE')&&p.checkpoint>=0&&!dragged[p.checkpoint]);
  // The world loads only after the first film frame is on screen, in idle time.
  // Without the live world, the still anchors follow the phone crop (which widens during Video 3).
  if(!world&&p.hold&&mobile.matches)placeStatic();
  if(world)world.update(p);else if(worldState==='off'&&!worldQueued&&section.hasAttribute('data-ready')){worldQueued=true;idle(()=>void startWorld());}
  section.dataset.decoded=String(bitmaps.size);section.dataset.buffered=String(blobs.size);
 }
 // Real opening progress: the first twelve frames of Video 1. The loader never blocks once the first frame is drawn.
 function loader(){
  if(!loaderEl)return;const ready=section.hasAttribute('data-ready');
  if(ready){clearTimeout(loaderTimer);loaderTimer=0;loaderEl.dataset.done='';setTimeout(()=>{if(section.hasAttribute('data-ready'))loaderEl.hidden=true;},450);return;}
  const have=Array.from({length:12},(_,i)=>blobs.has(key(0,i))||bitmaps.has(key(0,i))).filter(Boolean).length;
  loaderEl.style.setProperty('--load',String(have/12));loaderEl.querySelector('[data-load-value]')!.textContent=`${Math.round(have/12*100)}%`;
  if(loaderEl.hidden&&!loaderTimer)loaderTimer=window.setTimeout(()=>{if(!section.hasAttribute('data-ready')){loaderEl.removeAttribute('data-done');loaderEl.hidden=false;}},1200);
 }
 function resize(){
  if(reduced.matches)return;
  const timeline=cinemaTimeline(clips,mobile.matches),total=timeline[2].end;
  section.style.setProperty('--cinema-travel',String(total));section.style.height=`${(total+1)*stage.offsetHeight}px`;
  const rect=screen.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,1.5);w=Math.max(1,Math.round(rect.width*ratio));h=Math.max(1,Math.round(rect.height*ratio));
  if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
  const next=mobile.matches?640:864;if(next!==bucket){bucket=next;reset();}
  world?.resize(bucket,mobile.matches);if(!world)placeStatic();schedule();
 }
 function mode(){motion=reduced.matches;section.toggleAttribute('data-enhanced',!reduced.matches);section.dataset.mounted='';states.forEach(s=>{s.hidden=false;s.inert=false;s.style.removeProperty('--cinema-copy-opacity');});
  if(reduced.matches){cancelAnimationFrame(raf);raf=0;reset();world?.pause(true);section.style.removeProperty('height');clearTimeout(loadingTimer);loadingTimer=0;section.querySelector<HTMLElement>('.cinema-loading')!.hidden=true;if(loaderEl)loaderEl.hidden=true;['phase','reveal','checkpoint','sub'].forEach(k=>delete section.dataset[k]);}
  else{world?.pause(false);resize();}
 }
 function seek(clip:number){const t=cinemaTimeline(clips,mobile.matches)[clip];window.scrollTo({top:section.getBoundingClientRect().top+scrollY+(t.start+t.run+t.stop*(ARRIVE+.03))*stage.offsetHeight,behavior:'instant'});visible=true;snapNext=true;render();}
 section.querySelectorAll<HTMLAnchorElement>('[data-cinema-seek]').forEach(a=>a.addEventListener('click',e=>{if(reduced.matches)return;e.preventDefault();e.stopPropagation();const clip=Number(a.dataset.cinemaSeek);seek(clip);states[clip].setAttribute('tabindex','-1');states[clip].focus({preventScroll:true});},{signal}));
 section.querySelectorAll<HTMLAnchorElement>('[data-cinema-skip]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const target=document.getElementById('cinematic');target?.setAttribute('tabindex','-1');target?.focus({preventScroll:true});target?.scrollIntoView({behavior:'instant'});},{signal}));
 // Hover, focus or a first tap selects a node (the world answers); a second tap on touch follows the link.
 groups.forEach((nodes,cp)=>nodes.forEach((node,i)=>{
  const on=()=>{nodes.forEach(n=>n.toggleAttribute('data-active',n===node));node.closest('[data-world-nodes]')?.setAttribute('data-has-active','');world?.select(cp,i);};
  const off=()=>{if(node.matches(':focus-within,:hover'))return;node.removeAttribute('data-active');if(!nodes.some(n=>n.hasAttribute('data-active')))node.closest('[data-world-nodes]')?.removeAttribute('data-has-active');world?.select(cp,null);};
  node.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')on();},{signal});node.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')off();},{signal});
  node.addEventListener('focusin',on,{signal});node.addEventListener('focusout',()=>setTimeout(off),{signal});
  // Selection state is read at pointerdown: a tap focuses the link (which selects it) before the click arrives.
  let firstTap=false;node.addEventListener('pointerdown',e=>{firstTap=e.pointerType!=='mouse'&&!node.hasAttribute('data-active');},{signal});
  // stopPropagation as with the chapter links: the site router navigates internal links from a document listener.
  node.addEventListener('click',e=>{if(firstTap&&!reduced.matches&&section.hasAttribute('data-enhanced')){e.preventDefault();e.stopPropagation();on();}firstTap=false;},{signal});
 }));
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;world?.pause(!visible);if(visible){resize();schedule();}else{cancelAnimationFrame(raf);raf=0;pending.forEach(c=>c.abort());pending.clear();}},{rootMargin:'250px'});observer.observe(section);
 const ro=new ResizeObserver(resize);ro.observe(screen);
 window.addEventListener('scroll',schedule,{passive:true,signal});
 // Resizing (including desktop ↔ mobile pacing) keeps the same film time, or the same fraction of the current checkpoint.
 let pacedSmall=mobile.matches;
 window.addEventListener('resize',()=>{
  const before=cinemaTimeline(clips,pacedSmall)[activeClip],within=lastTravel>0&&lastTravel<cinemaTimeline(clips,pacedSmall)[2].end;resize();pacedSmall=mobile.matches;
  if(within&&!reduced.matches){const t=cinemaTimeline(clips,mobile.matches)[activeClip],held=lastHold?Math.min(.999,(lastTravel-before.start-before.run)/before.hold)*t.hold:0;
   const travel=lastHold?t.start+t.run+held:cinemaTravel(clips,mobile.matches,activeClip,lastTime);
   window.scrollTo({top:section.getBoundingClientRect().top+scrollY+travel*stage.offsetHeight,behavior:'instant'});snapNext=true;}
  schedule();
 },{signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else schedule();},{signal});const motionWatch=matchMedia('(prefers-reduced-motion:reduce)');motionWatch.addEventListener('change',checkMotion);signal.addEventListener('abort',()=>motionWatch.removeEventListener('change',checkMotion),{once:true});
 signal.addEventListener('abort',()=>{stopped=true;cancelAnimationFrame(raf);clearTimeout(loadingTimer);clearTimeout(loaderTimer);observer.disconnect();ro.disconnect();reset();world?.dispose();states.forEach(s=>{s.hidden=false;s.inert=false;});},{once:true});
 section.dataset.world=worldState;mode();idle(preload);
}
