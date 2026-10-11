import {writeFileSync,mkdirSync} from 'node:fs';
process.loadEnvFile('.env.concierge.local');
const model=process.env.DX_GEMINI_MODEL||'gemini-2.5-flash';
const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({contents:[{role:'user',parts:[{text:'Say OK.'}]}],generationConfig:{maxOutputTokens:16,thinkingConfig:{thinkingBudget:0}}}),signal:AbortSignal.timeout(15000)});
const data=await response.json();const report={testedAt:new Date().toISOString(),status:response.status,quota:(data.error?.details||[]).flatMap(d=>(d.violations||[]).map(v=>({metric:v.quotaMetric,id:v.quotaId,limit:v.quotaValue}))),retry:(data.error?.details||[]).map(d=>d.retryDelay).filter(Boolean)};
mkdirSync('concierge/.reports',{recursive:true});writeFileSync('concierge/.reports/quota-status.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
