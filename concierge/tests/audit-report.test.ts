import test from 'node:test';import assert from 'node:assert/strict';import {EventEmitter} from 'node:events';import {randomUUID} from 'node:crypto';
import {auditSummary,priorities,reportHtml,reportText} from '../shared/audit-report';
import {analyzeHtml} from '../server/analyze';
import {signAudit,verifyAudit} from '../server/audit';
import lead from '../server/lead';
import {sign,type Request,type Response} from '../server/http';
import type {AuditCheck,AuditResult} from '../shared/contracts';
const check=(id:string,severity:AuditCheck['severity'],weight:number,extra:Partial<AuditCheck>={}):AuditCheck=>({id,title:id,status:severity==='good'?'found':'attention',severity,weight,category:'Tehnička osnova',evidence:`${id} evidence`,recommendation:severity==='good'?'':`fix ${id}`,url:'https://example.com/',...extra});
const result=(checks:AuditCheck[]):AuditResult=>({url:'https://example.com/',finalUrl:'https://example.com/',checkedAt:'2026-09-25T08:00:00.000Z',checks,limitations:['HTML only.']});

test('score is the weighted mean of graded checks; info checks never count',()=>{
 const s=auditSummary([check('a','good',10),check('b','warning',10),check('c','critical',5),check('d','info',0),check('e','info',8)]);
 assert.equal(s.score,Math.round((10+5)/25*100));assert.equal(s.scored,3);assert.deepEqual([s.good,s.warning,s.critical],[1,1,1]);assert.equal(s.band,'warning');
 assert.equal(auditSummary([check('a','good',1)]).band,'good');assert.equal(auditSummary([check('a','critical',1),check('b','warning',1)]).band,'critical');
 assert.equal(auditSummary([]).score,0);
});
test('priorities put critical first, then heavier checks, and skip good or info',()=>{
 assert.deepEqual(priorities([check('w-light','warning',2),check('good','good',9),check('c','critical',1),check('w-heavy','warning',8),check('i','info',0)]).map(c=>c.id),['c','w-heavy','w-light']);
});
test('reports escape page-controlled text and state how the score is computed',()=>{
 const html=reportHtml(result([check('title','warning',5,{evidence:'<script>alert(1)</script>',title:'Naslov <b>'})]),'Hvala <i>');
 assert.ok(!html.includes('<script>alert'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('Naslov &lt;b&gt;'));assert.ok(html.includes('Hvala &lt;i&gt;'));
 assert.match(reportText(result([check('a','critical',5)])),/Rezultat: 0\/100 \(Kritično\)/);assert.match(html,/Ne mjeri pozicije, promet ni konverzije/);
});
test('analysis grades real signals into good, medium and critical',()=>{
 const good=analyzeHtml(`<html lang="bs"><head><title>Digital X — web i AI agencija Sarajevo</title><meta name="description" content="${'Cinematic web stranice, AI asistenti i SEO za firme u BiH. '.repeat(2)}"><meta name="viewport" content="width=device-width"><link rel="canonical" href="https://example.com/"><meta property="og:title" content="X"><meta property="og:image" content="x.png"><script type="application/ld+json">{"@type":"Organization"}</script></head><body><main><h1>Usluge</h1><h2>A</h2><h2>B</h2><p>${'riječ '.repeat(320)} usluge</p><img src="a" alt="a"><a href="mailto:a@b.c">Kontakt</a></main></body></html>`,'https://example.com/',200);
 for(const id of ['https','title','description','canonical','headings','structure','content','alt','schema','organization','social','contact','services','indexing','mobile','language'])assert.equal(good.find(c=>c.id===id)?.severity,'good',id);
 const bad=analyzeHtml('<html><title>x</title><meta name="robots" content="noindex"><body><img src="a"><img src="b"></body></html>','http://example.com/',200);
 for(const id of ['https','description','headings','content','alt','contact','indexing','mobile'])assert.equal(bad.find(c=>c.id===id)?.severity,'critical',id);
 assert.equal(bad.find(c=>c.id==='title')?.severity,'warning');assert.ok(bad.every(c=>c.severity==='good'||c.severity==='info'||c.recommendation));
});
test('audit signatures survive schema re-ordering but reject any change',()=>{
 process.env.CONCIERGE_SESSION_SECRET='unit-test-session-secret-'.repeat(3);
 const r=result([check('a','warning',5),check('b','good',3)]),sig=signAudit(r,'session-a');
 const reordered=JSON.parse(JSON.stringify({limitations:r.limitations,checks:r.checks.map(c=>Object.fromEntries(Object.entries(c).reverse())),checkedAt:r.checkedAt,finalUrl:r.finalUrl,url:r.url}));
 assert.equal(verifyAudit(reordered,sig,'session-a'),true);assert.equal(verifyAudit(reordered,sig,'session-b'),false);assert.equal(verifyAudit({...r,checks:[{...r.checks[0],severity:'good'},r.checks[1]]},sig,'session-a'),false);assert.equal(verifyAudit(r,sig.slice(0,-2)+'xx','session-a'),false);
});
test('e-mail delivery: team always, visitor report only for a report this server signed',async(t)=>{
 process.env.CONCIERGE_SESSION_SECRET='unit-test-session-secret-'.repeat(3);delete process.env.N8N_WEBHOOK_URL;process.env.RESEND_API_KEY='re_unit_test';process.env.DX_VISITOR_COPY='on';
 const sent:{to:string[];subject:string;html:string;text:string}[]=[];t.mock.method(globalThis,'fetch',async(url:unknown,init:RequestInit)=>{assert.equal(String(url),'https://api.resend.com/emails');sent.push(JSON.parse(init.body as string));return new globalThis.Response('{}',{status:200});});
 const invoke=async(body:unknown,sid=randomUUID())=>{let out='';const req={method:'POST',headers:{host:'qa.example',origin:'https://qa.example','content-type':'application/json',cookie:`dx_concierge=${sign({sid,exp:Date.now()+60000,audience:'qa.example'})}`},body,socket:{remoteAddress:'127.0.0.2'}} as Request;const res=Object.assign(new EventEmitter(),{statusCode:200,setHeader:()=>undefined,end:(v:string)=>{out=v;}}) as unknown as Response;await lead(req,res);return {status:res.statusCode,body:JSON.parse(out)};};
 const base={source:'AI Concierge',submissionId:randomUUID(),company:'QA',businessWebsite:'https://example.com',name:'QA only',email:'qa@example.com',goal:null,summary:'Synthetic test; do not contact.',recommendedService:'',auditStatus:'completed',consent:true,website:''};
 const r={...result([check('safe-title','critical',5,{title:'Generic check',evidence:'PAGE SECRET',recommendation:'PAGE RECOMMENDATION'})]),url:'https://private-host.example/path',finalUrl:'https://private-host.example/path'},suffix=randomUUID().slice(0,8),primaryEmail=`qa-${suffix}@example.com`;
 const sid=randomUUID();const signed=await invoke({...base,email:primaryEmail,audit:{result:r,signature:signAudit(r,sid)}},sid);assert.equal(signed.status,200);assert.equal(signed.body.report,true);
 assert.equal(sent.length,2);assert.equal(sent[0].to[0],'digital.x.agency.ba@gmail.com');assert.equal(sent[1].to[0],primaryEmail);assert.equal(sent[1].subject,'Vaš X Signal rezultat');assert.match(sent[1].html,/0\/100/);assert.match(sent[1].html,/Generic check/);
 for(const content of [sent[1].subject,sent[1].html,sent[1].text]){assert.doesNotMatch(content,/private-host|PAGE SECRET|PAGE RECOMMENDATION/);}
 sent.length=0;const recipientCapped=await invoke({...base,submissionId:randomUUID(),email:primaryEmail,audit:{result:r,signature:signAudit(r,sid)}},sid);assert.equal(recipientCapped.body.report,true);assert.equal(sent.length,1);
 process.env.DX_BUDGET_VISITOR_EMAIL_DAILY='1';sent.length=0;const globalSid=randomUUID(),globalCapped=await invoke({...base,submissionId:randomUUID(),email:`global-${suffix}@example.com`,audit:{result:r,signature:signAudit(r,globalSid)}},globalSid);assert.equal(globalCapped.body.report,true);assert.equal(sent.length,1);
 sent.length=0;const replayed=await invoke({...base,submissionId:randomUUID(),email:'other@example.com',audit:{result:r,signature:signAudit(r,sid)}},randomUUID());assert.equal(replayed.body.report,false);assert.equal(sent.length,1);
 sent.length=0;const forgedSid=randomUUID(),forged=await invoke({...base,submissionId:randomUUID(),email:'forged@example.com',audit:{result:{...r,checks:[{...r.checks[0],evidence:'Buy now!'}]},signature:signAudit(r,forgedSid)}},forgedSid);
 assert.equal(forged.status,200);assert.equal(forged.body.report,false);assert.equal(sent.length,1);assert.equal(sent[0].to[0],'digital.x.agency.ba@gmail.com');
 delete process.env.DX_BUDGET_VISITOR_EMAIL_DAILY;delete process.env.DX_VISITOR_COPY;delete process.env.RESEND_API_KEY;
});
