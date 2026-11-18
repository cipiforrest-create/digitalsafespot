import assert from 'node:assert/strict';
import test from 'node:test';
import {ACTS,ARRIVE,RELEASE,checkpointTravel,glide,glideLimits,pacing,storyPosition,storyTimeline,storyTotal,worldPhases} from '../shared/cinema-timeline';
import {deckCapable,nodeAnchors} from '../client/cinema-story';
import {MODULE_COUNT} from '../client/deck-modules';

const near=(a:number,b:number,eps=1e-9)=>Math.abs(a-b)<eps;

test('the story is three acts and far shorter than the film it replaced',()=>{
 for(const small of [false,true]){
  const timeline=storyTimeline(small),p=small?pacing.small:pacing.large;
  assert.equal(timeline.length,ACTS);
  timeline.forEach((s,i)=>{assert.equal(s.run,p.run[i]);assert.equal(s.stop,p.stop[i]);assert.ok(near(s.end,s.start+s.run+s.stop));if(i)assert.ok(near(s.start,timeline[i-1].end));});
  assert.ok(near(storyTotal(small),timeline[ACTS-1].end));
  // The film story ran 16 to 19 stage heights. Desktop stays under half of that; phones scroll the acts more slowly
  // on purpose (owner request, Nov 2026) and stay under 12.
  assert.ok(storyTotal(small)<(small?12:8),`total ${storyTotal(small)}`);
 }
});

test('phases advance in story order and every phase is a known one',()=>{
 for(const small of [false,true]){
  const total=storyTotal(small);let lastIndex=-1;const seen=new Set<string>();
  for(let i=0;i<=4000;i++){
   const p=storyPosition(small,total*i/4000),index=worldPhases.indexOf(p.phase);
   assert.ok(index>=0,p.phase);assert.ok(index>=lastIndex,`${p.phase} after ${worldPhases[lastIndex]}`);lastIndex=index;seen.add(p.phase);
  }
  for(const phase of ['INTRO','ACT_1','ORB_ARRIVAL','ORB_EXPLORE','ORB_RELEASE','ACT_2','X_ARRIVAL','X_EXPLORE','X_RELEASE','ACT_3','ENGINE_ARRIVAL','ENGINE_EXPLORE','CONTENT'])assert.ok(seen.has(phase),`${phase} missing (${small?'small':'large'})`);
 }
});

test('position is a pure function of travel, so reverse scrolling replays it exactly',()=>{
 const total=storyTotal(false),forward=Array.from({length:300},(_,i)=>storyPosition(false,total*i/299));
 const backward=Array.from({length:300},(_,i)=>storyPosition(false,total*(299-i)/299)).reverse();
 assert.deepEqual(backward,forward);
 assert.deepEqual(storyPosition(false,-3),storyPosition(false,0));
 assert.equal(storyPosition(false,total+5).phase,'CONTENT');
});

test('transformations and checkpoints report continuous progress',()=>{
 for(const small of [false,true])storyTimeline(small).forEach((s,clip)=>{
  const start=storyPosition(small,s.start+1e-6),mid=storyPosition(small,s.start+s.run/2),end=storyPosition(small,s.start+s.run-1e-6);
  assert.equal(start.clip,clip);assert.equal(start.hold,false);assert.ok(start.progress<.001);assert.ok(near(mid.progress,.5,1e-6));assert.ok(end.progress>.999);
  const arrive=storyPosition(small,s.start+s.run+s.stop*ARRIVE/2),explore=storyPosition(small,s.start+s.run+s.stop*.5);
  assert.equal(arrive.hold,true);assert.equal(arrive.checkpoint,clip);assert.ok(arrive.phase.endsWith('_ARRIVAL'));assert.ok(near(arrive.local,.5,1e-6));
  assert.ok(explore.phase.endsWith('_EXPLORE'));assert.ok(explore.explore>0&&explore.explore<1);
  if(clip<ACTS-1){const release=storyPosition(small,s.start+s.run+s.stop*(1-RELEASE/2));assert.ok(release.phase.endsWith('_RELEASE'));assert.ok(near(release.release,.5,1e-6));assert.equal(release.converge,0);}
 });
});

test('the final scene stays explorable before the closing copy takes over',()=>{
 for(const small of [false,true]){
  const s=storyTimeline(small)[ACTS-1],at=(share:number)=>storyPosition(small,s.start+s.run+s.stop*share);
  assert.equal(at(.3).converge,0);assert.equal(at(.3).phase,'ENGINE_EXPLORE');
  assert.ok(at(.99).converge>.99);
  let last=0;for(let i=0;i<=200;i++){const c=at(i/200*.999).converge;assert.ok(c>=last-1e-12);last=c;}
 }
});

test('chapter links land inside their checkpoint, after the arrival',()=>{
 for(const small of [false,true])for(let clip=0;clip<ACTS;clip++){
  const p=storyPosition(small,checkpointTravel(small,clip));
  assert.equal(p.clip,clip);assert.equal(p.hold,true);assert.ok(p.phase.endsWith('_EXPLORE'),p.phase);
 }
});

test('the playhead eases toward scroll, never overshoots and settles exactly',()=>{
 const total=storyTotal(false);
 assert.equal(glide(-1,2.5,1/60,total),2.5);// first paint lands directly
 assert.equal(glide(.2,total,1/60,total),total);// a jump across most of the story lands directly
 let playhead=1;const target=2;
 for(let i=0;i<600;i++){const next=glide(playhead,target,1/60,total);assert.ok(next>=playhead&&next<=target);playhead=next;}
 assert.equal(playhead,target);
 playhead=3;for(let i=0;i<600;i++){const next=glide(playhead,target,1/60,total);assert.ok(next<=playhead&&next>=target);playhead=next;}
 assert.equal(playhead,target);
 // One frame never travels further than the speed cap allows.
 assert.ok(glide(1,2,1/60,total)-1<=glideLimits.speed/60+1e-9);
});

test('still anchors cover every service link and stay on screen',()=>{
 assert.deepEqual(nodeAnchors.map(list=>list.length),[4,4,MODULE_COUNT]);
 for(const [u,v,side] of nodeAnchors.flat()){assert.ok(u>0&&u<1&&v>0&&v<1);assert.ok(['left','right','below'].includes(side));}
});

test('the live deck is skipped on constrained devices and can be forced either way',()=>{
 const yes=()=>true,no=()=>false;
 assert.equal(deckCapable('',{},yes),true);
 assert.equal(deckCapable('',{},no),false);
 assert.equal(deckCapable('',{connection:{saveData:true}},yes),false);
 assert.equal(deckCapable('',{deviceMemory:1},yes),false);
 assert.equal(deckCapable('',{hardwareConcurrency:1},yes),false);
 assert.equal(deckCapable('?world=0',{},yes),false);
 assert.equal(deckCapable('?world=1',{deviceMemory:1},yes),true);
 assert.equal(deckCapable('?world=1',{},no),false);
});
