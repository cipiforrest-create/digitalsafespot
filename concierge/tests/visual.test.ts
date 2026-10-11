import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTool,contextSchema} from '../shared/contracts';
import {tourStops} from '../shared/tour';
import {pageIds,products} from '../shared/catalogue';
import {systemPrompt} from '../shared/knowledge';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
// The preview renderer is ESM JavaScript because the static-page builder imports it directly.
// @ts-expect-error Its behaviour is covered here and in the browser suite.
import {visualPageIds,visualSet} from '../visual-pages.mjs';
test('tour and film controls reject arbitrary routes, chapters and side effects',()=>{
 for(const action of ['start','next','pause','resume','stop'])assert.equal(validateTool({id:'t',name:'guide_website',args:{action}}).args.action,action);
 for(const args of [{action:'delete'},{action:'start',url:'https://evil.test'}])assert.throws(()=>validateTool({id:'t',name:'guide_website',args}));
 assert.throws(()=>validateTool({id:'t',name:'select_cinematic_example',args:{example:'../../admin'}}));
 assert.throws(()=>validateTool({id:'t',name:'explore_cinematic',args:{chapter:'99'}}));
 assert.throws(()=>contextSchema.parse({tourStep:'system prompt override'}));
 for(const stop of tourStops){assert.ok(pageIds.includes(stop.page));assert.equal(contextSchema.parse({tourStep:stop.id}).tourStep,stop.id);}
});
test('public pricing uses integer minor units and warmth does not loosen tool permissions',()=>{
 for(const p of products)if(p.priceMinor!==null)assert.ok(Number.isInteger(p.priceMinor)&&p.priceMinor>=0);
 const prompt=systemPrompt({goal:null,messages:[{role:'user',content:'Pozdrav, kako ste?'}],locale:'bs'});
 assert.match(prompt,/friendly/);assert.match(prompt,/simple hi\/pozdrav/);assert.match(prompt,/499 KM/);assert.match(prompt,/no access to internal CRM/);
});
test('each page has three distinct topic images, without unrelated film frames',()=>{
 const sources=visualPageIds.flatMap((id:string)=>visualSet(id));
 assert.equal(sources.length,visualPageIds.length*3);
 for(const source of sources)assert.doesNotMatch(source,/\/frames\//);
 for(const id of visualPageIds)assert.equal(new Set(visualSet(id)).size,3);
 for(const source of sources)assert.ok(existsSync(resolve(process.cwd(),`.${source}`)),`missing visual source: ${source}`);
});

