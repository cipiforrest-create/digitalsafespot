import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import lead from '../server/lead';
import { chat } from '../server/gemini';
import { sign,type Request,type Response } from '../server/http';
function request(body:unknown,sid:string=randomUUID()):Request{return{method:'POST',headers:{host:'qa.example',origin:'https://qa.example','content-type':'application/json',cookie:`dx_concierge=${sign({sid,exp:Date.now()+60000,audience:'qa.example'})}`},body,socket:{remoteAddress:'127.0.0.1'}} as Request;}
async function invoke(body:unknown,sid?:string){let output='';const res=Object.assign(new EventEmitter(),{statusCode:200,setHeader:()=>undefined,end:(value:string)=>{output=value;}}) as unknown as Response;await lead(request(body,sid),res);return{status:res.statusCode,body:JSON.parse(output)};}
const base=()=>({source:'AI Concierge',submissionId:randomUUID(),company:'QA business',businessWebsite:'https://example.com',name:'QA only',email:'qa@example.com',goal:null,summary:'Synthetic test; do not contact.',recommendedService:'',auditStatus:'not_started',consent:true,website:''});
test('lead consent, unconfigured transport, honeypot, duplicate retries and changed payload',async(t)=>{
  process.env.CONCIERGE_SESSION_SECRET='unit-test-session-secret-'.repeat(3);delete process.env.N8N_WEBHOOK_URL;delete process.env.RESEND_API_KEY;
  assert.equal((await invoke(base())).status,503);assert.equal((await invoke({...base(),consent:false})).status,400);assert.equal((await invoke({...base(),website:'spam'})).status,200);
  process.env.N8N_WEBHOOK_URL='https://automation.example/webhook';let sends=0;
  t.mock.method(globalThis,'fetch',async(_url:unknown,init:RequestInit)=>{sends++;const forwarded=JSON.parse(init.body as string);assert.equal(forwarded.businessWebsite,'https://example.com');assert.equal(forwarded.website,'');assert.equal(new Headers(init.headers).get('Idempotency-Key'),forwarded.submissionId);assert.equal(forwarded.audio,undefined);return new globalThis.Response('{}',{status:200});});
  const sid=randomUUID(),payload=base();const replies=await Promise.all([invoke(payload,sid),invoke(payload,sid)]);assert.equal(sends,1);assert.equal(replies[0].body.status,'webhook_accepted');assert.equal((await invoke(payload,sid)).status,200);assert.equal(sends,1);assert.equal((await invoke({...payload,summary:'Changed'},sid)).status,409);
});
test('webhook errors are retryable and are never reported as delivered',async(t)=>{
  process.env.N8N_WEBHOOK_URL='https://automation.example/webhook';t.mock.method(globalThis,'fetch',async()=>new globalThis.Response('',{status:503}));assert.equal((await invoke(base())).status,502);
});
test('visitor report copies are disabled by default',async(t)=>{
  delete process.env.DX_VISITOR_COPY;delete process.env.N8N_WEBHOOK_URL;process.env.RESEND_API_KEY='re_unit_test';
  let sends=0;t.mock.method(globalThis,'fetch',async()=>{sends++;return new globalThis.Response('{}',{status:200});});
  const sid=randomUUID(),payload=base();const audit={url:'https://example.com/',finalUrl:'https://example.com/',checkedAt:new Date().toISOString(),limitations:[],checks:[]};
  const {signAudit}=await import('../server/audit');const response=await invoke({...payload,auditStatus:'completed',audit:{result:audit,signature:signAudit(audit,sid)}},sid);
  assert.equal(response.status,200);assert.equal(response.body.report,true);assert.equal(sends,1);delete process.env.RESEND_API_KEY;
});
test('signed tool acknowledgements reject cross-session replay and altered context',async()=>{
  process.env.GEMINI_API_KEY='synthetic-unit-test';const continuation=sign({sid:'session-a',exp:Date.now()+10000,hash:'invalid-context',contents:[],calls:[],rounds:1});
  await assert.rejects(chat({context:{goal:null,messages:[{role:'user',content:'Hello'}]},continuation,results:[]},'session-b',AbortSignal.timeout(500),()=>undefined),/send your message/);
  await assert.rejects(chat({context:{goal:null,messages:[{role:'user',content:'Hello'}]},continuation,results:[]},'session-a',AbortSignal.timeout(500),()=>undefined),/send your message/);
});
