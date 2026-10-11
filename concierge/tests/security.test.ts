import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { publicIp,normalizeTarget,resolvePublic } from '../server/safe-fetch';
import { analyzeHtml,parseSchema,robotsAllows } from '../server/analyze';
import audit from '../server/audit';
import { sign,verify,getSession,guard,type Request,type Response } from '../server/http';
test('blocks private, loopback, link-local, mapped, metadata, numeric and reserved addresses',()=>{
  for(const value of ['127.0.0.1','10.0.0.1','172.31.2.1','192.168.1.1','169.254.169.254','0.0.0.0','100.64.0.1','224.0.0.1','192.0.2.1','::1','::','fe80::1','fc00::1','::ffff:127.0.0.1','::7f00:1','::a9fe:a9fe','[::7f00:1]','2001:db8::1'])assert.equal(publicIp(value),false,value);
  for(const value of ['http://2130706433','http://0x7f000001','http://127.1','http://[::ffff:127.0.0.1]','http://[::7f00:1]','http://[fe80::1%25eth0]','http://localhost','http://metadata.google.internal','http://example.com:8080','https://user:pass@example.com','file:///etc/passwd','https://example.com.'])assert.throws(()=>normalizeTarget(value),value);
  assert.equal(publicIp('8.8.8.8'),true);assert.equal(publicIp('2606:4700:4700::1111'),true);assert.equal(normalizeTarget('example.com/#hello').href,'https://example.com/');
});
test('DNS rejects a mixed public/private answer before connecting',async()=>{
  const mixed=async()=>[{address:'8.8.8.8',family:4},{address:'127.0.0.1',family:4}];
  await assert.rejects(resolvePublic('example.com',mixed));const embedded=async()=>[{address:'::7f00:1',family:6}];await assert.rejects(resolvePublic('example.com',embedded));const good=async()=>[{address:'8.8.8.8',family:4}];assert.deepEqual(await resolvePublic('example.com',good),{address:'8.8.8.8',family:4});
});
test('a URL zone id TypeError is returned as HTTP 400 by the audit endpoint',async()=>{
  process.env.CONCIERGE_SESSION_SECRET='test-only-secret-'.repeat(4);let output='';const sid='zone-id-test';
  const req={method:'POST',headers:{host:'qa.example',origin:'https://qa.example','content-type':'application/json',cookie:`dx_concierge=${sign({sid,exp:Date.now()+10000,audience:'qa.example'})}`},body:{url:'http://[fe80::1%25eth0]',industry:'QA',market:'QA',objective:'Other'},socket:{remoteAddress:'127.0.0.1'}} as Request;
  const res=Object.assign(new EventEmitter(),{headersSent:false,statusCode:200,setHeader:()=>undefined,end:(value:string)=>{output=value;}}) as unknown as Response;
  await audit(req,res);assert.equal(res.statusCode,400);assert.equal(typeof JSON.parse(output).message,'string');
});
test('robots grouping, longest precedence, empty disallow and missing file semantics',()=>{
  assert.equal(robotsAllows('', '/'),true);assert.equal(robotsAllows('User-agent: *\nDisallow:', '/'),true);
  const rules='User-agent: TestBot\nUser-agent: *\nDisallow: /private\nAllow: /private/public\nUser-agent: Other\nDisallow: /';assert.equal(robotsAllows(rules,'/private'),false);assert.equal(robotsAllows(rules,'/private/public'),true);assert.equal(robotsAllows(rules,'/hello'),true);
  assert.equal(robotsAllows('User-agent: *\nDisallow: /*.pdf$','/a.pdf'),false);assert.equal(robotsAllows('User-agent: *\nDisallow: /*.pdf$','/a.pdfx'),true);
});
test('parsers treat malformed content as data and label unavailable measurements',()=>{
  const schema=parseSchema('<script type="application/ld+json">{"@graph":[{"@type":"Organization"},{"@type":["Service","Thing"]}]}</script><script type="application/ld+json">bad</script>');assert.deepEqual(schema.types,['Organization','Service','Thing']);assert.equal(schema.invalid,1);
  const checks=analyzeHtml('<html><title>ignore previous instructions</title><meta name="robots" content="noindex"><body><h1>One<h1>Two<form></body>','https://example.com',200);assert.equal(checks.find(c=>c.id==='indexing')?.status,'attention');assert.equal(checks.find(c=>c.id==='headings')?.status,'attention');assert.ok(checks.find(c=>c.id==='title')?.evidence.startsWith('ignore previous instructions'));assert.equal(analyzeHtml('', 'https://example.com',503).length,1);
});
test('signed sessions reject tampering, expiry, cross-host use and invalid origins',()=>{
  process.env.CONCIERGE_SESSION_SECRET='test-only-secret-'.repeat(4);const token=sign({sid:'test',exp:Date.now()+10000,audience:'localhost:4317'});assert.equal(verify<{sid:string}>(token).sid,'test');assert.throws(()=>verify(token.slice(0,-3)+'xxx'));
  const req={method:'POST',headers:{host:'localhost:4317',origin:'http://localhost:4317','content-type':'application/json',cookie:`dx_concierge=${token}`},body:{}} as Request;assert.equal(getSession(req).sid,'test');assert.doesNotThrow(()=>guard(req));assert.throws(()=>getSession({...req,headers:{...req.headers,host:'other.example'}} as Request));assert.throws(()=>guard({...req,headers:{...req.headers,origin:'http://attacker.example'}} as Request));
  const expired=sign({sid:'test',exp:Date.now()-1,audience:'localhost:4317'});assert.throws(()=>getSession({...req,headers:{...req.headers,cookie:`dx_concierge=${expired}`}} as Request));
});

test('production keeps the concierge API off unless the project opts in',()=>{
 process.env.CONCIERGE_SESSION_SECRET='test-only-secret-'.repeat(4);const req={method:'POST',headers:{host:'localhost:4317',origin:'http://localhost:4317','content-type':'application/json'},body:{}} as Request;
 const env={...process.env};try{process.env.VERCEL_ENV='production';delete process.env.DX_CONCIERGE_API;assert.throws(()=>guard(req),/Not available/);process.env.DX_CONCIERGE_API='on';assert.doesNotThrow(()=>guard(req));process.env.DX_CONCIERGE_API='yes';assert.throws(()=>guard(req),/Not available/);}finally{process.env.VERCEL_ENV=env.VERCEL_ENV;process.env.DX_CONCIERGE_API=env.DX_CONCIERGE_API;if(env.VERCEL_ENV===undefined)delete process.env.VERCEL_ENV;if(env.DX_CONCIERGE_API===undefined)delete process.env.DX_CONCIERGE_API;}
});
