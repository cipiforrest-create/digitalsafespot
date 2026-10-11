import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {load} from 'cheerio';
import {ARRIVE,cinemaPosition,cinemaTimeline,cinemaTravel,glide,glideLimits,storyBeats,worldPhases} from '../shared/cinema-timeline';
import {FRAME,framePoint,frameRect,mobileRoi,moduleAnchor,orbCal,projectPoint,ringPoint,systemCal,xCal} from '../shared/world-calibration';
import {parseCinemaManifest,nodeAnchors} from '../client/cinema-story';
const {clips}=parseCinemaManifest(readFileSync('ai-concierge-preview/media/cinema-v1/manifest.json','utf8'));
const sweep=(small:boolean,step=.002)=>{const total=cinemaTimeline(clips,small)[2].end,out=[];for(let t=0;t<=total+step;t+=step)out.push(cinemaPosition(clips,small,t));return out;};

test('one master state machine visits every phase in story order',()=>{
 for(const small of [false,true]){
  const seen=[...new Set(sweep(small).map(p=>p.phase))];
  // The Engine is the final resting scene: no Engine release and no separate convergence stretch.
  assert.deepEqual(seen,worldPhases.filter(p=>p!=='ENGINE_RELEASE'&&p!=='CONVERGENCE'));
  assert.equal(cinemaPosition(clips,small,999).phase,'CONTENT');
 }
});
test('the final Engine scene stays live and interactive, eases into the closing copy and hands over to the page',()=>{
 for(const small of [false,true]){
  const s=cinemaTimeline(clips,small)[2];assert.equal(s.converge,0);assert.equal(s.end,s.start+s.run+s.stop);
  let last=0;for(let a=ARRIVE+.001;a<1;a+=.01){const p=cinemaPosition(clips,small,s.start+s.run+s.stop*a);
   assert.equal(p.phase,'ENGINE_EXPLORE');assert.equal(p.world,1);assert.equal(p.frame,clips[2].frames-1);assert.ok(p.converge>=last);last=p.converge;}
  assert.equal(last,1);assert.equal(cinemaPosition(clips,small,s.end).phase,'CONTENT');
 }
});
test('pacing follows the story beats: transformations get the most travel, the page is not endless',()=>{
 const t=cinemaTimeline(clips,false),m=cinemaTimeline(clips,true);
 for(const s of t){assert.ok(s.run>=3.5&&s.run<=5.5,`video ${s.run}`);assert.ok(s.stop>=1.2&&s.stop<=2.2,`checkpoint ${s.stop}`);}
 assert.ok(t[2].end<23,`total ${t[2].end}`);assert.ok(m[2].end<t[2].end);
 // ORB formation, ORB → X and X → network each get at least 1.8 desktop / 1.2 phone stage heights and the largest
 // share of their chapter (never a 5–10 % sliver).
 storyBeats.forEach((beats,i)=>{const [a,b]=beats[1];
  for(const [seg,min] of [[t[i],1.8],[m[i],1.2]] as const){const span=seg.pace[b]-seg.pace[a];
   assert.ok(span>=min,`clip ${i+1} transformation ${span.toFixed(2)}`);assert.ok(span/(seg.run+seg.stop)>=.3,`clip ${i+1} share`);
   beats.forEach(([x,y])=>assert.ok(seg.pace[y]-seg.pace[x]<=span+1e-9));}
 });
});
test('no frame is skipped: one stage pixel advances the film by at most one frame, monotonically, both ways',()=>{
 for(const small of [false,true])for(const stage of [900,640]){
  const total=cinemaTimeline(clips,small)[2].end,px=1/stage;let prev=cinemaPosition(clips,small,0);
  for(let t=px;t<=total;t+=px){const p=cinemaPosition(clips,small,t);
   if(p.clip===prev.clip)assert.ok(p.frame-prev.frame>=0&&p.frame-prev.frame<=1,`${small} ${stage} clip ${p.clip} frame ${prev.frame}→${p.frame}`);
   else assert.equal(p.frame,0);
   prev=p;}
 }
 // Transformation frames get real distance: at least 1.5 % of a stage height (≈13 px at 900 px) each on desktop.
 const t=cinemaTimeline(clips,false);storyBeats.forEach((beats,i)=>{const [a,b]=beats[1];for(let f=a;f<b;f++)assert.ok(t[i].pace[f+1]-t[i].pace[f]>=.015,`clip ${i+1} f${f}`);});
});
test('cinemaTravel inverts the paced mapping (resize keeps the same frame)',()=>{
 for(const small of [false,true])clips.forEach((c,i)=>{for(let f=0;f<c.frames;f+=7){const p=cinemaPosition(clips,small,cinemaTravel(clips,small,i,c.times[f])+1e-9);assert.equal(p.clip,i);assert.equal(p.frame,f);}
  const mid=(c.times[10]+c.times[11])/2,p=cinemaPosition(clips,small,cinemaTravel(clips,small,i,mid));assert.ok(Math.abs(p.time-mid)<1e-6);});
});
test('required QA positions: correct scene, film/3D opacity and no early next-scene activation',()=>{
 for(const small of [false,true]){
  const t=cinemaTimeline(clips,small);
  t.forEach((s,i)=>{const len=s.end-s.start;
   for(const q of [0,.1,.25,.4,.6,.75,.85,.9,.94,.97,1]){
    const at=s.start+len*q-(q===1?1e-6:0),p=cinemaPosition(clips,small,at),inRun=at<s.start+s.run;
    assert.equal(p.clip,i,`clip ${i} at ${q}`);
    if(inRun){assert.equal(p.world,0);assert.equal(p.checkpoint,-1);assert.ok(p.phase==='INTRO'||p.phase===`VIDEO_${i+1}`);}
    else{assert.equal(p.checkpoint,i);assert.equal(p.frame,clips[i].frames-1);}
    // The next chapter's live object never activates inside this chapter.
    assert.ok(p.checkpoint===-1||p.checkpoint===i);
   }
   // Exact stop: the last film frame and the live object meet at full opacity once arrival completes.
   const arrived=cinemaPosition(clips,small,s.start+s.run+s.stop*ARRIVE+1e-6);assert.equal(arrived.world,1);assert.equal(arrived.frame,clips[i].frames-1);
   const before=cinemaPosition(clips,small,s.start+s.run-1e-6);assert.equal(before.world,0);assert.ok(before.frame>=clips[i].frames-2);
  });
 }
});
test('playhead glide: eases, never overshoots, settles exactly and plays every transformation frame on fast input',()=>{
 const total=cinemaTimeline(clips,false)[2].end;
 // Settles exactly, monotonically, without passing the target, in both directions (capped travel plus a short ease-out).
 for(const [from,to] of [[1,4],[4,1],[6.2,6.25],[9,8.9]]){let p=from,steps=0,last=from;
  while(p!==to&&steps<400){p=glide(p,to,1/60,total);assert.ok(from<to?p>=last&&p<=to:p<=last&&p>=to);last=p;steps++;}
  assert.equal(p,to);assert.ok(steps/60<=Math.abs(to-from)/glideLimits.speed+.7,`${from}→${to} took ${steps} frames`);}
 // A flick or PageDown burst across the whole ORB → X transformation (target jumps 3.5 stage heights in 80 ms).
 const s=cinemaTimeline(clips,false)[1],[a,b]=storyBeats[1][1],from=s.start+s.pace[a]-.2,to=s.start+s.pace[b]+.2;
 let p=from,target=from,frame=cinemaPosition(clips,false,p).frame;const seen=new Set<number>();
 for(let k=0;k<200&&p!==to;k++){target=Math.min(to,from+(to-from)*Math.min(1,(k+1)/5));const next=glide(p,target,1/60,total);
  assert.ok(Math.abs(next-p)<=Math.max(glideLimits.speed,Math.abs(target-p)/glideLimits.catchUp)/60+1e-9);p=next;
  const f=cinemaPosition(clips,false,p);if(f.clip===1){assert.ok(f.frame-frame<=4,`skipped ${frame}→${f.frame}`);frame=f.frame;seen.add(f.frame);}}
 assert.equal(p,to);
 // Rendered frames step through the transformation a few source frames at a time (with cross-frame blending in between).
 assert.ok([...seen].filter(f=>f>=a&&f<=b).length>=(b-a)/4);
 // Explicitly far jumps (anchors across the page) land directly; first paint has no glide.
 assert.equal(glide(0,total*.8,1/60,total),total*.8);assert.equal(glide(-1,3,1/60,total),3);
});
test('reverse scroll reconstructs the same states as forward scroll',()=>{
 for(const small of [false,true]){
  const total=cinemaTimeline(clips,small)[2].end,key=(t:number)=>{const p=cinemaPosition(clips,small,t);return [p.clip,p.frame,p.phase,p.world.toFixed(6),p.mix.toFixed(6)].join();};
  const pts:number[]=[];for(let t=0;t<=total;t+=.0137)pts.push(t);
  const forward=pts.map(key),backward=[...pts].reverse().map(key).reverse();assert.deepEqual(backward,forward);
  // A glide that goes down and comes back up ends in exactly the state it left.
  let p=2;for(let k=0;k<120;k++)p=glide(p,7,1/60,total);for(let k=0;k<200;k++)p=glide(p,2,1/60,total);assert.equal(p,2);assert.equal(key(p),key(2));
 }
});
test('world opacity is continuous in both directions: no pop, no black frame',()=>{
 for(const small of [false,true]){
  const s=sweep(small,.001);
  for(let i=1;i<s.length;i++){
   assert.ok(Math.abs(s[i].world-s[i-1].world)<.03,`jump at ${s[i].position} (${s[i-1].phase} → ${s[i].phase})`);
   if(s[i].phase.startsWith('VIDEO')||s[i].phase==='INTRO')assert.equal(s[i].world,0);
   if(s[i].phase.endsWith('_EXPLORE')||s[i].phase==='CONVERGENCE')assert.equal(s[i].world,1);
  }
 }
});
test('release hands the film the next clip first frame before WebGL fades out',()=>{
 for(const small of [false,true]){
  const t=cinemaTimeline(clips,small);
  for(const cp of [0,1]){
   const end=t[cp].start+t[cp].run+t[cp].stop,late=cinemaPosition(clips,small,end-.0005),early=cinemaPosition(clips,small,end-t[cp].stop*.19);
   assert.equal(late.handoff,true);assert.ok(late.world<.01);assert.equal(early.handoff,false);assert.ok(early.world>.99);
   const next=cinemaPosition(clips,small,end+.0005);assert.equal(next.clip,cp+1);assert.equal(next.frame,0);assert.equal(next.world,0);
  }
  assert.equal(sweep(small).some(p=>p.checkpoint===2&&p.handoff),false);
 }
});
test('camera model round-trips film pixels and shares the film canvas contain-fit',()=>{
 for(const [u,v] of [[0,0],[432,248],[863,495],...orbCal.nodes.map(n=>n.anchor)]){const [x,y,z]=framePoint(u,v,10.3);const [pu,pv]=projectPoint(x,y,z);assert.ok(Math.abs(pu-u)<1e-9&&Math.abs(pv-v)<1e-9);}
 for(const [w,h] of [[1425,900],[390,270],[1024,768],[768,1024]]){
  const r=frameRect(w,h),s=Math.min(w/FRAME.w,h/FRAME.h);
  assert.ok(Math.abs(r.w-FRAME.w*s)<1e-9&&Math.abs(r.x-(w-FRAME.w*s)/2)<1e-9&&Math.abs(r.y-(h-FRAME.h*s)/2)<1e-9);
 }
});
test('phone crop fills the band, trims at most ~5 % top and bottom, and never jumps between chapters',()=>{
 // Continuous at every film/checkpoint boundary, so the band never jumps (ORB and X crop tight, the Engine widens).
 assert.equal(mobileRoi(0,1,false),mobileRoi(0,0,true));assert.equal(mobileRoi(0,0,true),mobileRoi(1,0,false));
 assert.equal(mobileRoi(1,0,true),mobileRoi(2,0,false));assert.equal(mobileRoi(2,1,false),mobileRoi(2,0,true));
 for(let k=0;k<100;k++)assert.ok(Math.abs(mobileRoi(2,(k+1)/100,false)-mobileRoi(2,k/100,false))<5);
 for(const [w,h] of [[390,439],[360,385],[430,485],[375,252]])for(const roi of [470,590])for(const src of [FRAME,{w:640,h:368}]){
  const r=frameRect(w,h,src,roi);
  assert.ok(r.w>=w-1e-9&&r.h<=h/.9+1e-9,`${w}x${h} roi ${roi}`);assert.ok(Math.abs(r.x-(w-r.w)/2)<1e-9&&Math.abs(r.y-(h-r.h)/2)<1e-9);
  assert.ok(Math.abs(r.s-r.w/FRAME.w)<1e-12);
 }
 assert.deepEqual(frameRect(1440,900,FRAME,0),frameRect(1440,900));
});
test('calibrated anchors stay on the film and engine modules sit on their floor rings',()=>{
 for(const list of nodeAnchors)for(const [u,v] of list)assert.ok(u>=0&&u<=FRAME.w&&v>=0&&v<=FRAME.h,`${u},${v}`);
 assert.equal(nodeAnchors[0].length,4);assert.equal(nodeAnchors[1].length,4);assert.equal(nodeAnchors[2].length,10);
 systemCal.modules.forEach(([ring,deg],i)=>assert.deepEqual(moduleAnchor(i),ringPoint(systemCal.floor[ring],deg)));
 assert.equal(xCal.channels.length,xCal.nodes.length);assert.equal(xCal.outline.length,12);
});
test('every spatial service node is a real link to an existing route',()=>{
 const $=load(readFileSync('ai-concierge-preview/index.html','utf8')),counts=[4,4,10];
 counts.forEach((n,cp)=>{const links=$(`[data-world-nodes="${cp}"] [data-world-node] a[href]`);assert.equal(links.length,n);
  links.each((_,a)=>{const href=$(a).attr('href')!;assert.match(href,/^\/[a-z0-9/-]+\/$/);assert.ok(existsSync(`public${href}index.html`),href);assert.ok($(a).find('strong').text().trim());});});
 assert.equal($('h1').length,1);assert.ok($('#jedan-sistem h2').text().includes('postojati'));
 assert.ok($('#jedan-sistem [data-strategy]').length&&$('#jedan-sistem a[href="/ai-concierge-preview/"]').length);
});
