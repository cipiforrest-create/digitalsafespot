export type CinemaClip={id:number;duration:number;width:number;height:number;times:number[];frames:number;motion?:number[]};
// One authoritative state machine: every value below is a pure function of scroll position, so reverse scrolling replays it exactly.
export const worldPhases=['INTRO','VIDEO_1','ORB_ARRIVAL','ORB_EXPLORE','ORB_RELEASE','VIDEO_2','X_ARRIVAL','X_EXPLORE','X_RELEASE','VIDEO_3','ENGINE_ARRIVAL','ENGINE_EXPLORE','ENGINE_RELEASE','CONVERGENCE','CONTENT'] as const;
export type WorldPhase=typeof worldPhases[number];
// `pace` is the cumulative scroll distance (stage heights from the chapter start) at which each film frame shows.
export type CinemaSegment={start:number;run:number;hold:number;stop:number;converge:number;end:number;pace:number[]};
// Stage-height units. Checkpoints leave room to arrive, explore and release (phones split each into two calm screens);
// phones compress the film travel to `scale` of the desktop distance.
// The Engine checkpoint is the story's final resting scene: there is no separate convergence stretch (converge: 0),
// scrolling past it goes straight into the page content.
export const pacing={large:{scale:1,stop:2.2,converge:0},small:{scale:.65,stop:2,converge:0}} as const;
export const ARRIVE=.12,RELEASE=.2;
// Story beats per clip: [first source frame, last source frame, desktop scroll distance]. Scroll distance follows what
// the film shows, not its running time, so the transformations get the most travel:
// Video 1: light column (0–50) → the ORB visibly forms (50–140) → the ORB settles into its stop frame (140–240).
// Video 2: the ORB turns (0–48) → it bursts and the X assembles (48–136) → the X consolidates (136–192).
// Video 3: the X with drifting shards (0–40) → the signal network grows into the four system tiles (40–110) → the engine settles (110–192).
export const storyBeats:readonly (readonly (readonly [number,number,number])[])[]=[
 [[0,50,.9],[50,140,2.4],[140,240,1.1]],
 [[0,48,.7],[48,136,3.4],[136,192,.7]],
 [[0,40,.8],[40,110,2.6],[110,192,.9]],
];
// Within a beat, frames share its distance in proportion to how much the picture changes (measured `motion`, see
// concierge/cinema-pace.py) plus a floor, so near-static frames still advance and dense frames never flash past.
// Smoothing stays narrow (±2 frames) so the densest frames (the ORB bursting into the X) keep their own distance.
const FLOOR=1.5,SMOOTH=2;
const checkpoints=['ORB','X','ENGINE'] as const;
const clamp=(v:number)=>Math.min(1,Math.max(0,v)),smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
const box=(v:number[],r:number)=>v.map((_,i)=>{let s=0;for(let k=i-r;k<=i+r;k++)s+=v[Math.min(v.length-1,Math.max(0,k))];return s/(2*r+1);});
// Cumulative scroll distance per frame of one clip at desktop scale.
export function clipPace(c:CinemaClip,beats:readonly (readonly [number,number,number])[]|undefined):number[]{
 const n=c.frames,motion=c.motion?.length===n?c.motion:null;
 const valid=!!beats&&beats.length>0&&beats[0][0]===0&&beats[beats.length-1][1]===n-1&&beats.every(([a,b,d],i)=>b>a&&d>0&&(i===0||a===beats[i-1][1]));
 const plan=valid?beats!:[[0,n-1,c.duration*.4]] as const;
 // Interval j runs from frame j to j+1 and is weighted by the change into frame j+1 (smoothed over ±SMOOTH frames).
 const weight=box(Array.from({length:n-1},(_,j)=>FLOOR+(motion?motion[j+1]:0)),SMOOTH);
 const step=new Array<number>(n-1).fill(0);
 for(const [a,b,distance] of plan){let sum=0;for(let j=a;j<b;j++)sum+=weight[j];for(let j=a;j<b;j++)step[j]=weight[j]/sum*distance;}
 // Soften the speed change where beats meet, keeping the clip's total distance.
 const total=step.reduce((s,v)=>s+v,0),soft=box(step,2),k=total/soft.reduce((s,v)=>s+v,0),pace=[0];
 soft.forEach((v,j)=>pace.push(pace[j]+v*k));
 return pace;
}
const cache=new WeakMap<readonly CinemaClip[],[CinemaSegment[],CinemaSegment[]]>();
export function cinemaTimeline(clips:readonly CinemaClip[],small:boolean):CinemaSegment[]{
 let pair=cache.get(clips);
 if(!pair){
  pair=[false,true].map(sm=>{const p=sm?pacing.small:pacing.large;let offset=0;
   return clips.map((c,i)=>{const pace=clipPace(c,storyBeats[i]).map(v=>v*p.scale),start=offset,run=pace[pace.length-1],converge=i===clips.length-1?p.converge:0,hold=p.stop+converge;offset+=run+hold;return {start,run,hold,stop:p.stop,converge,end:offset,pace};});
  }) as [CinemaSegment[],CinemaSegment[]];
  cache.set(clips,pair);
 }
 return pair[small?1:0];
}
// Inverse of the film mapping: the scroll travel (stage heights) at which `time` of `clip` shows. Used to keep the
// same film time across resizes and to place exact checkpoint seeks.
export function cinemaTravel(clips:readonly CinemaClip[],small:boolean,clip:number,time:number){
 const s=cinemaTimeline(clips,small)[clip],times=clips[clip].times,t=Math.min(times[times.length-1],Math.max(0,time));
 let lo=0,hi=times.length-1;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(times[mid]<=t)lo=mid;else hi=mid-1;}
 const next=Math.min(lo+1,times.length-1),mix=next===lo?0:(t-times[lo])/(times[next]-times[lo]);
 return s.start+s.pace[lo]+(s.pace[next]-s.pace[lo])*mix;
}
export function cinemaPosition(clips:readonly CinemaClip[],small:boolean,travel:number){
 const timeline=cinemaTimeline(clips,small),total=timeline[timeline.length-1].end,position=Math.max(0,Math.min(total,travel));
 let clip=timeline.findIndex(s=>position<s.end);if(clip<0)clip=clips.length-1;
 const s=timeline[clip],u=Math.min(s.run,position-s.start),times=clips[clip].times,pace=s.pace;
 // The frame comes from the paced distance, never from scroll velocity: binary search for the interval holding u.
 let lo=0,hi=pace.length-1;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(pace[mid]<=u)lo=mid;else hi=mid-1;}
 const next=Math.min(lo+1,times.length-1),mix=next===lo?0:clamp((u-pace[lo])/(pace[next]-pace[lo]));
 const time=times[lo]+(times[next]-times[lo])*mix,p=time/times[times.length-1],scroll=u/s.run;
 const hold=position>=s.start+s.run,held=position-s.start-s.run,a=held/s.stop,name=checkpoints[clip];
 let phase:WorldPhase=`VIDEO_${clip+1}` as WorldPhase,local=p,world=0,checkpoint=-1,explore=0,release=0,converge=0;
 if(clip===0&&scroll<.06)phase='INTRO';
 if(hold){
  checkpoint=clip;explore=clamp((a-ARRIVE)/(1-ARRIVE-RELEASE));
  // The converged world stays on screen while the sticky stage scrolls away into the page content.
  if(held>=s.stop){phase=travel>=total?'CONTENT':'CONVERGENCE';local=clamp((held-s.stop)/s.converge);release=1;converge=local;world=1;}
  else if(a<ARRIVE){phase=`${name}_ARRIVAL`;local=a/ARRIVE;world=smooth(local);}
  else if(clip===clips.length-1){
   // Final scene: the live Engine stays interactive to the end; early in it the camera eases right and the closing copy
   // (converge) replaces the chapter title, so the scene that stays on screen carries the closing message.
   explore=clamp((a-ARRIVE)/(1-ARRIVE));phase=travel>=total?'CONTENT':`${name}_EXPLORE`;local=explore;world=1;converge=smooth(explore/.3);
  }
  else if(a<1-RELEASE){phase=`${name}_EXPLORE`;local=explore;world=1;}
  else{phase=`${name}_RELEASE`;local=clamp((a-1+RELEASE)/RELEASE);release=local;world=clip<clips.length-1?1-smooth((local-.55)/.45):1;}
 }
 // Late in a release the film underneath already shows the next clip's first frame, so the WebGL fade reveals continuity.
 const handoff=checkpoint>=0&&checkpoint<clips.length-1&&phase.endsWith('_RELEASE')&&local>=.5;
 return {clip,frame:lo,next,mix,time,progress:p,scroll,hold,total,position,phase,local,checkpoint,explore,release,converge,world,handoff};
}
export type CinemaPosition=ReturnType<typeof cinemaPosition>;
// Rendered playhead (stage heights). Scroll position stays authoritative: the playhead only eases toward it, never
// overshoots, and stops the moment it arrives. Its speed is capped so a fast flick, PageDown or a scrollbar drag still
// plays every paced frame (the pacing makes one stage height a roughly constant amount of visual change), while the
// cap only rises for jumps longer than speed × catchUp (4.5 stage heights), so even those catch up in ~1.5 s.
export const glideLimits={rate:11,speed:3,catchUp:1.5,snap:.5} as const;
export function glide(playhead:number,target:number,dt:number,total:number,limits:{rate:number;speed:number;catchUp:number;snap:number}=glideLimits){
 const gap=target-playhead,distance=Math.abs(gap);
 // First paint, explicit seeks (handled by the caller) and jumps across more than half the story land directly.
 if(playhead<0||distance>total*limits.snap)return target;
 if(distance<.0004)return target;
 const eased=distance*(1-Math.exp(-dt*limits.rate)),cap=Math.max(limits.speed,distance/limits.catchUp)*dt;
 return playhead+Math.sign(gap)*Math.min(eased,cap,distance);
}
