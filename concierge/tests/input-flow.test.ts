import {test} from 'node:test';
import assert from 'node:assert/strict';
import {InputFlow} from '../client/input-flow';
test('input pauses early, drains with hysteresis and resumes without a local queue',()=>{
  const flow=new InputFlow();assert.equal(flow.next(47000,0),'send');assert.equal(flow.next(48000,40),'pause');
  assert.equal(flow.paused,true);assert.equal(flow.next(16000,80),'pause');assert.equal(flow.next(8000,120),'resume');
  assert.equal(flow.paused,false);assert.equal(flow.next(0,160),'send');
});
test('persistent backpressure has a bounded recovery deadline, including clock zero',()=>{
  const flow=new InputFlow();assert.equal(flow.next(300000,0),'pause');assert.equal(flow.next(300000,9999),'pause');
  assert.equal(flow.next(300000,10000),'timeout');
});
test('a second outage gets a fresh deadline only after the connection drains',()=>{
  const flow=new InputFlow();flow.next(60000,0);assert.equal(flow.next(8000,9000),'resume');
  assert.equal(flow.next(60000,9500),'pause');assert.equal(flow.next(16000,19000),'pause');assert.equal(flow.next(16000,19500),'timeout');
});
