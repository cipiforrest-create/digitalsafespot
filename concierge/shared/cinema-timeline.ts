// X Deck story timeline. Three acts, each a scroll-driven transformation (`run`) followed by an interactive
// checkpoint (`stop`). Every value below is a pure function of scroll position, so reverse scrolling replays it exactly.
//   Act 1 — the deck powers on and the concierge hologram boots        → ORB checkpoint
//   Act 2 — the deck opens and the silver X rises out of it            → X checkpoint
//   Act 3 — six service modules deploy around the deck                 → ENGINE checkpoint (final scene)
export const worldPhases=['INTRO','ACT_1','ORB_ARRIVAL','ORB_EXPLORE','ORB_RELEASE','ACT_2','X_ARRIVAL','X_EXPLORE','X_RELEASE','ACT_3','ENGINE_ARRIVAL','ENGINE_EXPLORE','ENGINE_RELEASE','CONVERGENCE','CONTENT'] as const;
export type WorldPhase=typeof worldPhases[number];
export type StorySegment={start:number;run:number;stop:number;end:number};
// Stage-height units. Phones split each checkpoint into two calm screens (see data-sub), so their stops are longer
// while the transformations are shorter.
export const pacing={
 large:{run:[.9,1.1,1.1],stop:[1.2,1.3,1.8]},
 small:{run:[.7,.8,.8],stop:[1.6,1.6,2.2]},
} as const;
export const ACTS=3;
export const ARRIVE=.12,RELEASE=.2;
// In the final scene the modules stay explorable first; the closing copy takes over from this share of the stop.
export const CLOSING_AT=.55,CLOSING_SPAN=.3;
const checkpoints=['ORB','X','ENGINE'] as const;
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
export const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
const timelines=[false,true].map(small=>{
 const p=small?pacing.small:pacing.large;let offset=0;
 return p.run.map((run,i)=>{const start=offset,stop=p.stop[i];offset+=run+stop;return {start,run,stop,end:offset};});
}) as [StorySegment[],StorySegment[]];
export function storyTimeline(small:boolean):StorySegment[]{return timelines[small?1:0];}
export function storyTotal(small:boolean){return storyTimeline(small)[ACTS-1].end;}
export function storyPosition(small:boolean,travel:number){
 const timeline=storyTimeline(small),total=timeline[ACTS-1].end,position=Math.max(0,Math.min(total,travel));
 let clip=timeline.findIndex(s=>position<s.end);if(clip<0)clip=ACTS-1;
 const s=timeline[clip],progress=clamp((position-s.start)/s.run);
 const hold=position>=s.start+s.run,held=position-s.start-s.run,a=held/s.stop,name=checkpoints[clip];
 let phase:WorldPhase=`ACT_${clip+1}` as WorldPhase,local=progress,checkpoint=-1,explore=0,release=0,converge=0;
 if(clip===0&&progress<.06)phase='INTRO';
 if(hold){
  checkpoint=clip;explore=clamp((a-ARRIVE)/(1-ARRIVE-RELEASE));
  if(a<ARRIVE){phase=`${name}_ARRIVAL`;local=a/ARRIVE;}
  else if(clip===ACTS-1){
   // Final scene: the deck stays interactive to the end; late in it the camera eases aside and the closing copy
   // (converge) replaces the chapter title, so the scene that stays on screen carries the closing message.
   explore=clamp((a-ARRIVE)/(1-ARRIVE));phase=travel>=total?'CONTENT':`${name}_EXPLORE`;local=explore;converge=smooth((explore-CLOSING_AT)/CLOSING_SPAN);
  }
  else if(a<1-RELEASE){phase=`${name}_EXPLORE`;local=explore;}
  else{phase=`${name}_RELEASE`;local=clamp((a-1+RELEASE)/RELEASE);release=local;}
 }
 return {clip,progress,hold,total,position,phase,local,checkpoint,explore,release,converge};
}
export type StoryPosition=ReturnType<typeof storyPosition>;
// Scroll travel (stage heights) at which a chapter link lands: just inside its checkpoint, after the arrival.
export function checkpointTravel(small:boolean,clip:number){const s=storyTimeline(small)[clip];return s.start+s.run+s.stop*(ARRIVE+.03);}
// Rendered playhead (stage heights). Scroll position stays authoritative: the playhead only eases toward it, never
// overshoots, and stops the moment it arrives. Its speed is capped so a fast flick, PageDown or a scrollbar drag still
// plays the transformation, while the cap rises for long jumps so even those catch up in about `catchUp` seconds.
export const glideLimits={rate:9,speed:2.4,catchUp:1.2,snap:.6} as const;
export function glide(playhead:number,target:number,dt:number,total:number,limits:{rate:number;speed:number;catchUp:number;snap:number}=glideLimits){
 const gap=target-playhead,distance=Math.abs(gap);
 // First paint, explicit seeks (handled by the caller) and jumps across more than `snap` of the story land directly.
 if(playhead<0||distance>total*limits.snap)return target;
 if(distance<.0004)return target;
 const eased=distance*(1-Math.exp(-dt*limits.rate)),cap=Math.max(limits.speed,distance/limits.catchUp)*dt;
 return playhead+Math.sign(gap)*Math.min(eased,cap,distance);
}
