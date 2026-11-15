// Homepage story controller: maps scroll to the three-act X Deck timeline, drives the copy for each act and hosts
// the live 3D deck. Without WebGL (or on very constrained devices) the same scroll story runs over still renders.
import {checkpointTravel,glide,storyPosition,storyTimeline,storyTotal,type StoryPosition} from '../shared/cinema-timeline';
import type {Deck,NodePlacement} from './deck';
const fade=(v:number)=>Math.min(1,Math.max(0,v));
// Still-layout anchors (fractions of the screen) for the service links when the live deck is unavailable.
export const nodeAnchors:[number,number,NodePlacement['side']][][]=[
 [[.385,.285,'left'],[.607,.28,'right'],[.61,.76,'right'],[.385,.77,'left']],
 [[.678,.31,'right'],[.458,.31,'left'],[.462,.625,'left'],[.664,.62,'right']],
 [[.357,.43,'below'],[.253,.59,'below'],[.324,.8,'below'],[.787,.8,'below'],[.843,.595,'below'],[.732,.435,'below']],
];
export function deckCapable(search:string,nav:{deviceMemory?:number;hardwareConcurrency?:number;connection?:{saveData?:boolean}},webgl:()=>boolean){
 const q=new URLSearchParams(search).get('world');if(q==='0')return false;if(q==='1')return webgl();
 if(nav.connection?.saveData||(nav.deviceMemory!==undefined&&nav.deviceMemory<2)||(nav.hardwareConcurrency||4)<2)return false;
 return webgl();
}
function hasWebgl(){try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}catch{return false;}}
export function mountCinemaStory(section:HTMLElement,signal:AbortSignal){
 if(signal.aborted)return;
 const stage=section.querySelector<HTMLElement>('.cinema-stage'),screen=section.querySelector<HTMLElement>('.cinema-screen'),canvas=section.querySelector<HTMLCanvasElement>('[data-world-canvas]');
 if(!stage||!screen||!canvas)return;
 const loaderEl=section.querySelector<HTMLElement>('.world-loader');
 const states=[...section.querySelectorAll<HTMLElement>('[data-cinema-state]')];
 const groups=[0,1,2].map(i=>[...section.querySelectorAll<HTMLElement>(`[data-world-nodes="${i}"] [data-world-node]`)]);
 const seeks=[...section.querySelectorAll<HTMLAnchorElement>('[data-cinema-seek]')];
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),mobile=matchMedia('(max-width:720px)');
 // Chrome skips a MediaQueryList 'change' event when .matches was read after the change but before the event. So the
 // event comes from a separate query nothing reads, and the preference is also re-checked wherever the loop reads it.
 let motion=reduced.matches;const checkMotion=()=>{if(reduced.matches!==motion)mode();};
 let stopped=false,visible=false,raf=0,playhead=-1,snapNext=false,lastRender=0,lastTravel=0,deckQueued=false;
 let deck:Deck|null=null,deckState:'off'|'loading'|'on'|'fallback'=deckCapable(location.search,navigator as Navigator&{deviceMemory?:number;connection?:{saveData?:boolean}},hasWebgl)?'off':'fallback',last:StoryPosition|null=null;
 const dragged=[false,false,false];
 function schedule(){checkMotion();if(!raf&&visible&&!stopped&&!reduced.matches&&!document.hidden)raf=requestAnimationFrame(render);}
 // Spatial nodes follow the live projection when the deck runs, otherwise their still anchors.
 function place(cp:number,pts:NodePlacement[]){
  groups[cp].forEach((n,i)=>{const p=pts[i];if(!p)return;n.style.setProperty('--nx',`${p.x.toFixed(1)}px`);n.style.setProperty('--ny',`${p.y.toFixed(1)}px`);n.style.setProperty('--nd',String(p.depth));n.dataset.side=p.side;});
 }
 function placeStatic(){
  const s=screen!.getBoundingClientRect(),g=stage!.getBoundingClientRect();
  nodeAnchors.forEach((list,cp)=>place(cp,list.map(([u,v,side])=>({x:s.left-g.left+u*s.width,y:s.top-g.top+v*s.height,depth:0,side}))));
 }
 function setDeck(state:typeof deckState){deckState=state;section.dataset.world=state;if(state==='fallback'){deck?.dispose();deck=null;canvas!.hidden=true;placeStatic();ready();}}
 function ready(){section.dataset.ready='';if(loaderEl){loaderEl.dataset.done='';setTimeout(()=>{loaderEl.hidden=true;},450);}}
 function mark(cp:number,node:number|null){
  groups[cp].forEach((n,i)=>n.toggleAttribute('data-active',i===node));
  groups[cp][0]?.closest('[data-world-nodes]')?.toggleAttribute('data-has-active',node!==null);
 }
 async function startDeck(){
  if(deckState!=='off'||stopped)return;setDeck('loading');
  try{
   const {createDeck}=await import('./deck');if(stopped)return;
   canvas!.hidden=false;
   deck=createDeck({canvas:canvas!,screen:screen!,stage:stage!,small:mobile.matches,place,hover:mark,
    talk:()=>section.querySelector<HTMLButtonElement>('[data-talk]')?.click(),
    fail:reason=>{section.dataset.worldFail=reason;setDeck('fallback');},
    dragged:cp=>{if(cp>=0&&!dragged[cp]){dragged[cp]=true;schedule();}}},signal);
   if(!deck){setDeck('fallback');return;}
   setDeck('on');deck.pause(!visible);if(last)deck.update(last);ready();schedule();
   (section as HTMLElement&{deck?:Deck}).deck=deck;
  }catch(e){section.dataset.worldFail=e instanceof Error?e.message.slice(0,80):'error';setDeck('fallback');}
 }
 const idle=(fn:()=>void)=>'requestIdleCallback' in window?requestIdleCallback(fn,{timeout:900}):setTimeout(fn,250);
 function copy(p:StoryPosition){
  // Opening typography reveals as the deck powers on, then clears for the hologram.
  section.dataset.reveal=p.clip===0&&!p.hold?String(p.progress<.2?0:p.progress<.45?1:p.progress<.7?2:p.progress<.9?3:4):'hold';
  // Phones split each checkpoint into two screens (a: arrival and first half of explore, b: the rest) and show the
  // coming chapter's title during its transformation, so the space under the scene is never empty.
  // The final scene swaps its chapter title for the closing copy once the camera has eased aside (converge ≥ .5).
  const closing=p.phase==='CONTENT'||(p.checkpoint===2&&p.converge>=.5);
  section.dataset.sub=!p.hold?'v':closing?'c':p.phase.endsWith('_ARRIVAL')||(p.phase.endsWith('_EXPLORE')&&p.explore<.5)?'a':'b';
  const index=closing?3:p.clip;
  states.forEach((s,i)=>{
   let o=0;
   if(i===index){
    if(i===3)o=p.phase==='CONTENT'?1:fade((p.converge-.5)/.5);
    else if(!p.hold)o=i===0?1:mobile.matches?fade((p.progress-.1)/.2):fade((p.progress-.72)/.28);
    else if(p.phase.endsWith('_RELEASE'))o=1-fade(p.local/.5);
    else o=1;
   }
   // In the final scene the chapter stays mounted (its live service links stay on screen) while only its heading
   // fades out under the closing copy.
   const engine=i===2&&p.checkpoint===2&&p.hold;
   if(engine){o=1;s.style.setProperty('--cinema-heading-opacity',String(1-fade(p.converge/.5)));}else s.style.removeProperty('--cinema-heading-opacity');
   s.hidden=i!==index&&!engine;s.style.setProperty('--cinema-copy-opacity',String(o));s.inert=(i!==index&&!engine)||o<.5;
  });
 }
 function render(){
  raf=0;checkMotion();if(stopped||reduced.matches||!visible)return;
  const small=mobile.matches,total=storyTotal(small);
  const target=Math.max(0,-section.getBoundingClientRect().top/Math.max(1,stage!.offsetHeight)),now=performance.now(),dt=lastRender?Math.min(.05,(now-lastRender)/1000):1/60;lastRender=now;
  // Eased, speed-capped playhead (see glide): a wheel notch glides, a fast flick still plays the transformation,
  // and it settles exactly on the scroll position. Explicit seeks land directly.
  playhead=snapNext?target:glide(playhead,target,dt,total);snapNext=false;
  const p=storyPosition(small,playhead);
  // While gliding the next render follows; once settled the clock resets, so the first frame of the next input burst
  // steps one display frame, not the whole idle gap.
  if(playhead!==target)schedule();else lastRender=0;
  lastTravel=playhead;last=p;
  section.dataset.stage=String(p.clip);section.dataset.holding=String(p.hold);section.dataset.phase=p.phase;section.dataset.checkpoint=String(p.checkpoint);
  section.style.setProperty('--cinema-progress',String(p.position/p.total));section.style.setProperty('--world-explore',String(p.explore));
  copy(p);
  seeks.forEach(a=>a.setAttribute('aria-current',String(Number(a.dataset.cinemaSeek)===p.clip)));
  // Drag hint: shown at a live checkpoint until the visitor has turned that object once.
  section.dataset.hint=String(deckState==='on'&&p.phase.endsWith('_EXPLORE')&&p.checkpoint>=0&&!dragged[p.checkpoint]);
  if(deck)deck.update(p);else if(deckState==='off'&&!deckQueued){deckQueued=true;idle(()=>void startDeck());}
 }
 function resize(){
  if(reduced.matches)return;
  const total=storyTotal(mobile.matches);
  section.style.setProperty('--cinema-travel',String(total));section.style.height=`${(total+1)*stage!.offsetHeight}px`;
  deck?.resize(mobile.matches);if(!deck)placeStatic();schedule();
 }
 function mode(){
  motion=reduced.matches;section.toggleAttribute('data-enhanced',!reduced.matches);section.dataset.mounted='';
  states.forEach(s=>{s.hidden=false;s.inert=false;s.style.removeProperty('--cinema-copy-opacity');});
  if(reduced.matches){cancelAnimationFrame(raf);raf=0;deck?.pause(true);section.style.removeProperty('height');if(loaderEl)loaderEl.hidden=true;['phase','reveal','checkpoint','sub'].forEach(k=>delete section.dataset[k]);}
  else{deck?.pause(!visible);resize();}
 }
 function seek(clip:number){window.scrollTo({top:section.getBoundingClientRect().top+scrollY+checkpointTravel(mobile.matches,clip)*stage!.offsetHeight,behavior:'instant'});visible=true;snapNext=true;render();}
 seeks.forEach(a=>a.addEventListener('click',e=>{if(reduced.matches)return;e.preventDefault();e.stopPropagation();const clip=Number(a.dataset.cinemaSeek);seek(clip);states[clip].setAttribute('tabindex','-1');states[clip].focus({preventScroll:true});},{signal}));
 section.querySelectorAll<HTMLAnchorElement>('[data-cinema-skip]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const target=document.getElementById('cinematic');target?.setAttribute('tabindex','-1');target?.focus({preventScroll:true});target?.scrollIntoView({behavior:'instant'});},{signal}));
 // Hover, focus or a first tap selects a node (the deck answers); a second tap on touch follows the link.
 groups.forEach((nodes,cp)=>nodes.forEach((node,i)=>{
  const on=()=>{mark(cp,i);deck?.select(cp,i);};
  const off=()=>{if(node.matches(':focus-within,:hover'))return;if(node.hasAttribute('data-active'))mark(cp,null);deck?.select(cp,null);};
  node.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')on();},{signal});node.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')off();},{signal});
  node.addEventListener('focusin',on,{signal});node.addEventListener('focusout',()=>setTimeout(off),{signal});
  // Selection state is read at pointerdown: a tap focuses the link (which selects it) before the click arrives.
  let firstTap=false;node.addEventListener('pointerdown',e=>{firstTap=e.pointerType!=='mouse'&&!node.hasAttribute('data-active');},{signal});
  // stopPropagation as with the chapter links: the site router navigates internal links from a document listener.
  node.addEventListener('click',e=>{if(firstTap&&!reduced.matches&&section.hasAttribute('data-enhanced')){e.preventDefault();e.stopPropagation();on();}firstTap=false;},{signal});
 }));
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;deck?.pause(!visible||reduced.matches);if(visible){resize();schedule();}else{cancelAnimationFrame(raf);raf=0;}},{rootMargin:'250px'});observer.observe(section);
 const ro=new ResizeObserver(resize);ro.observe(screen);
 window.addEventListener('scroll',schedule,{passive:true,signal});
 // Resizing (including desktop ↔ mobile pacing) keeps the same place in the story: the same share of the current
 // transformation or checkpoint.
 let pacedSmall=mobile.matches;
 window.addEventListener('resize',()=>{
  const before=storyTimeline(pacedSmall),was=last,within=lastTravel>0&&lastTravel<storyTotal(pacedSmall);resize();pacedSmall=mobile.matches;
  if(within&&was&&!reduced.matches){
   const a=before[was.clip],b=storyTimeline(mobile.matches)[was.clip];
   const travel=was.hold?b.start+b.run+Math.min(.999,(lastTravel-a.start-a.run)/a.stop)*b.stop:b.start+was.progress*b.run;
   window.scrollTo({top:section.getBoundingClientRect().top+scrollY+travel*stage!.offsetHeight,behavior:'instant'});snapNext=true;
  }
  schedule();
 },{signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else schedule();},{signal});
 const motionWatch=matchMedia('(prefers-reduced-motion:reduce)');motionWatch.addEventListener('change',checkMotion);signal.addEventListener('abort',()=>motionWatch.removeEventListener('change',checkMotion),{once:true});
 signal.addEventListener('abort',()=>{stopped=true;cancelAnimationFrame(raf);observer.disconnect();ro.disconnect();deck?.dispose();states.forEach(s=>{s.hidden=false;s.inert=false;});},{once:true});
 section.dataset.world=deckState;if(deckState==='fallback')ready();mode();
}
