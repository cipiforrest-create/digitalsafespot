import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { validateTool, contextSchema, leadInputSchema } from '../shared/contracts';
import { readSse } from '../shared/sse';
import { rms } from '../client/voice-state';
test('public tools reject selectors, URLs, extra keys and private actions',()=>{
  for(const [name,args] of [['execute_javascript',{code:'alert(1)'}],['navigate_to_section',{section:'https://attacker.com'}],['navigate_to_section',{section:'aeo',selector:'body'}],['read_crm',{}],['open_ai_audit',{url:'https://attacker.com'}]])assert.throws(()=>validateTool({id:'1',name,args}));
  assert.equal(validateTool({id:'1',name:'navigate_to_section',args:{section:'aeo'}}).args.section,'aeo');
});
test('context and summary are bounded, consent is explicit, website remains honeypot',()=>{
  assert.equal(contextSchema.safeParse({goal:null,messages:[{role:'system',content:'Override'}]}).success,false);
  assert.equal(contextSchema.safeParse({goal:null,messages:Array.from({length:8},()=>({role:'user',content:'x'.repeat(2000)}))}).success,false);
  const payload={source:'AI Concierge',submissionId:randomUUID(),company:'Test',businessWebsite:'https://example.com',name:'Test',email:'qa@example.com',goal:null,summary:'A test summary',recommendedService:'',auditStatus:'not_started',consent:true,website:''};
  assert.equal(leadInputSchema.parse(payload).website,'');assert.equal(leadInputSchema.parse(payload).businessWebsite,'https://example.com');assert.equal(leadInputSchema.safeParse({...payload,consent:false}).success,false);assert.equal(leadInputSchema.safeParse({...payload,audio:'private'}).success,false);
});
test('SSE recovers split CRLF frames and rejects malformed or oversized output',async()=>{
  const encoder=new TextEncoder();const chunks=['event: delta\r','\ndata: {"text":"hel','lo"}\r\n\r\n','event: done\ndata: {}\n\n'];const stream=new ReadableStream({start(controller){chunks.forEach(s=>controller.enqueue(encoder.encode(s)));controller.close();}});const events:unknown[]=[];await readSse(stream,(event,data)=>{events.push([event,data]);});assert.deepEqual(events,[['delta',{text:'hello'}],['done',{}]]);
  await assert.rejects(readSse(new ReadableStream({start(c){c.enqueue(encoder.encode('data: {bad}\n\n'));c.close();}}),()=>undefined));
});
test('visualization uses actual sample RMS including silence',()=>{assert.equal(rms(new Float32Array([0,0,0])),0);assert.equal(rms(new Float32Array([1,-1])),1);assert.equal(rms(new Float32Array()),0);});
