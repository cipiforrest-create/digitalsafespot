import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { safeFetch } from '../server/safe-fetch';
test('network pinning, redirect revalidation, body size and read deadlines',async(t)=>{
  let scenario='redirect';let connections=0;
  t.mock.method(http,'request',((_url:URL,options:http.RequestOptions,callback:(value:http.IncomingMessage)=>void)=>{
    connections++;const request=new EventEmitter() as EventEmitter&{end:()=>void};
    assert.equal(options.family,4);assert.equal(options.agent,false);assert.ok(options.lookup);
    // The exact validated address is passed to the socket lookup, not resolved a second time.
    (options.lookup as (host:string,options:object,cb:(error:Error|null,address:string,family:number)=>void)=>void)('irrelevant.example',{},(error,address,family)=>{assert.equal(error,null);assert.equal(address,'8.8.8.8');assert.equal(family,4);});
    request.end=()=>queueMicrotask(()=>{
      const incoming=new PassThrough() as unknown as http.IncomingMessage;
      incoming.statusCode=scenario==='redirect'?302:200;incoming.headers=scenario==='redirect'?{location:'http://127.0.0.1/private'}:{'content-type':'text/html'};callback(incoming);
      if(scenario==='oversized')incoming.emit('data',Buffer.alloc(100));
      if(scenario==='slow'){const keeper=setTimeout(()=>undefined,500);options.signal?.addEventListener('abort',()=>{clearTimeout(keeper);request.emit('error',new Error('aborted'));},{once:true});}
    });return request;
  }) as typeof http.request);
  await assert.rejects(safeFetch('http://8.8.8.8/',AbortSignal.timeout(1000)),/Private/);assert.equal(connections,1);
  // T15: an oversized body is truncated (partial), not rejected, so a large page still yields facts.
  scenario='oversized';const capped=await safeFetch('http://8.8.8.8/',AbortSignal.timeout(1000),20);assert.equal(capped.truncated,true);assert.equal(capped.text.length,20);
  scenario='slow';const start=Date.now();await assert.rejects(safeFetch('http://8.8.8.8/',AbortSignal.timeout(35)),/aborted/);assert.ok(Date.now()-start<1000);
});
test('refuses an HTTPS redirect downgrade before connecting to the redirect target',async(t)=>{
  let connections=0;
  t.mock.method(https,'request',((_url:URL,_options:https.RequestOptions,callback:(value:http.IncomingMessage)=>void)=>{
    connections++;const request=new EventEmitter() as EventEmitter&{end:()=>void};request.end=()=>queueMicrotask(()=>{const incoming=new PassThrough() as unknown as http.IncomingMessage;incoming.statusCode=302;incoming.headers={location:'http://8.8.8.8/downgrade'};callback(incoming);});return request;
  }) as typeof https.request);
  await assert.rejects(safeFetch('https://8.8.8.8/',AbortSignal.timeout(1000)),/insecure_redirect/);assert.equal(connections,1);
});
