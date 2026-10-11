import test from 'node:test';
import assert from 'node:assert/strict';
import {frameAt} from '../client/x-core';
const bounds=[0,.10,.17,.25,.32,.40,.47,.55,.62,.70,.77,.84,.89,.93,.97,1];
const states=bounds.slice(0,-1).map((start,i)=>({start,end:bounds[i+1],name:String(i),transition:'fade',scale:1,anchor:[.5,.5]}));
test('X Core boundaries are reversible, bounded and hold the last frame',()=>{
 for(const i of [...states.keys(),...states.keys()].reverse()){
  assert.equal(frameAt(states,bounds[i]+.001).index,i);
  assert.equal(frameAt(states,(bounds[i]+bounds[i+1])/2).mix,0);
 }
 assert.equal(frameAt(states,-1).index,0);assert.equal(frameAt(states,2).index,14);
 assert.equal(frameAt(states,1).next,14);
});
