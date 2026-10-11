import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {cinemaPosition,cinemaTimeline,cinemaTravel} from '../shared/cinema-timeline';import {parseCinemaManifest} from '../client/cinema-story';
const manifest=parseCinemaManifest(readFileSync('ai-concierge-preview/media/cinema-v1/manifest.json','utf8'));
test('source timeline retains all 627 frames with exact reversible endpoints and holds',()=>{
 assert.equal(manifest.clips.reduce((n,c)=>n+c.frames,0),627);
 for(const small of [false,true]){
  const timeline=cinemaTimeline(manifest.clips,small);
  manifest.clips.forEach((c,i)=>{for(const f of [0,1,Math.floor(c.frames/2),c.frames-1]){
   const position=cinemaTravel(manifest.clips,small,i,c.times[f]);
   const got=cinemaPosition(manifest.clips,small,position+1e-9);assert.equal(got.clip,i);assert.equal(got.frame,f);
   assert.ok(existsSync(`ai-concierge-preview/media/cinema-v1/clip-${i+1}/${small?640:864}/${String(f).padStart(4,'0')}.webp`));
  }const hold=cinemaPosition(manifest.clips,small,timeline[i].start+timeline[i].run+.1);assert.equal(hold.frame,c.frames-1);assert.equal(hold.hold,true);});
  assert.equal(cinemaPosition(manifest.clips,small,-2).frame,0);assert.equal(cinemaPosition(manifest.clips,small,999).clip,2);
 }
});
test('manifest rejects unbounded and non-monotonic frame data',()=>{
 const bad=structuredClone(manifest);bad.clips[0].times[1]=-1;assert.throws(()=>parseCinemaManifest(JSON.stringify(bad)));
 const huge=structuredClone(manifest);huge.clips[0].duration=1e6;assert.throws(()=>parseCinemaManifest(JSON.stringify(huge)));
 assert.throws(()=>parseCinemaManifest('{}'));
 const short=structuredClone(manifest);short.clips[1].motion=[1,2];assert.throws(()=>parseCinemaManifest(JSON.stringify(short)));
 const negative=structuredClone(manifest);negative.clips[2].motion![5]=-1;assert.throws(()=>parseCinemaManifest(JSON.stringify(negative)));
});
