// Read-only deployed release verification; the text model is not called.
import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
const origin=process.env.CONCIERGE_TEST_ORIGIN;
if(!origin?.startsWith('https://'))throw new Error('An explicit HTTPS Preview origin is required');
const cookies=readFileSync('concierge/.screenshots/deployed-cookies.txt','utf8').split('\n').filter(l=>l.startsWith('#HttpOnly_')||!l.startsWith('#')).map(l=>l.replace(/^#HttpOnly_/,'').trim().split('\t')).filter(r=>r.length===7&&r[0]===new URL(origin).hostname).map(r=>({name:r[5],value:r[6],domain:r[0],path:r[2],secure:r[3]==='TRUE',httpOnly:true,expires:Number(r[4])}));
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext();await context.addCookies(cookies);
const report={testedAt:new Date().toISOString(),origin,errors:[],routes:[],production:[]};
try{
  report.anonymousStatus=(await fetch(origin+'/ai-concierge-preview',{redirect:'manual'})).status;
  for(const path of ['/ai-concierge-preview','/ai-concierge-preview/google-ads/','/ai-concierge-preview/cinematic/','/ai-concierge-preview/services/','/','/o-nama.html','/blog/','/projekti/','/shop/']){
    const response=await context.request.get(origin+path);const html=await response.text();const h=response.headers();
    report.routes.push({path,status:response.status(),permissions:h['permissions-policy'],robots:h['x-robots-tag'],noindex:/name="robots"[^>]*noindex/.test(html),concierge:html.includes('id="hero-title"')});
    if(!response.ok())throw new Error(`Route failed: ${path}`);
    if(path.startsWith('/ai-concierge-preview')&&(!h['permissions-policy']?.includes('microphone=(self)')||!h['content-security-policy']?.includes('wss://generativelanguage.googleapis.com')||!h['x-robots-tag']?.includes('noindex')))throw new Error(`Preview security headers missing: ${path}`);
    if(path==='/ai-concierge-preview')report.csp=h['content-security-policy'];
  }
  const session=await context.request.post(origin+'/api/concierge/session',{headers:{Origin:origin},data:{mode:'text',context:{goal:null,messages:[]}}});
  report.session={status:session.status(),ready:session.ok()};
  if(!session.ok())throw new Error('Deployed session failed');
  report.text={tested:false,reason:'Configured text model daily free-tier quota exhausted; no additional model request made.'};
  const audit=await context.request.post(origin+'/api/concierge/audit',{headers:{Origin:origin},data:{url:'https://www.digital-x-marketing.com/',industry:'Digital services',market:'Bosnia and Herzegovina',objective:'AI visibility'},timeout:35000});
  const body=await audit.text();report.audit={status:audit.status(),hasEvidence:body.includes('event: result')};
  if(!audit.ok()||!report.audit.hasEvidence)throw new Error('Deployed audit failed');
  report.n8n={configured:false,tested:false,reason:'N8N_WEBHOOK_URL is absent; no enquiry submitted.'};
  for(const path of ['/','/o-nama.html','/blog/','/projekti/','/shop/']){
    const response=await fetch('https://www.digital-x-marketing.com'+path);const html=await response.text();
    report.production.push({path,status:response.status,concierge:html.includes('id="hero-title"')});
  }
  const star=await context.request.get(origin+'/ai-concierge-preview/star/');
  report.star={status:star.status(),brokenExternalLinkRemoved:!(await star.text()).includes('https://star-sarajevo.vercel.app/')};
}catch(error){report.errors.push(error.message);process.exitCode=1;}
finally{writeFileSync('concierge/.screenshots/https-release-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();}
