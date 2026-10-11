// Explicit integration probe. Uses only server-issued credentials and does not print them.
import { mkdirSync, writeFileSync } from 'node:fs';
const origin=process.env.CONCIERGE_TEST_ORIGIN || 'http://localhost:4317';
let cookie='';
async function post(path,body){const response=await fetch(origin+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body),signal:AbortSignal.timeout(45000)});if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];return response;}
const mode=process.argv[2]||'text';
if(mode==='text'){
  console.log('Session status',(await post('/api/concierge/session',{mode:'text',context:{goal:null,messages:[]}})).status);
  const response=await post('/api/concierge/chat',{context:{goal:null,messages:[{role:'user',content:'We lose leads because replies take too long. Please show me your receptionist section and explain one next step.'}]}});
  const raw=await response.text();const sanitized=raw.replace(/"continuation":"[^"]+"/g,'"continuation":"[signed continuation omitted]"');console.log('Chat status',response.status,sanitized);
}else if(mode==='audit'){
  await post('/api/concierge/session',{mode:'audit',context:{goal:null,messages:[]}});
  const response=await post('/api/concierge/audit',{url:'https://www.digital-x-marketing.com/',industry:'Digital services',market:'Bosnia and Herzegovina',objective:'AI visibility'});const raw=await response.text();mkdirSync('concierge/.screenshots',{recursive:true});writeFileSync('concierge/.screenshots/live-audit.txt',raw);console.log('Audit status',response.status,'result',raw.includes('event: result'),'bytes',raw.length);
}else if(mode==='voice'){
  const response=await post('/api/concierge/session',{mode:'voice',context:{goal:null,messages:[]}});const token=await response.json();if(!response.ok){console.log('Voice token status',response.status,token);process.exitCode=1;}
  else { console.log('Voice token issued',response.status,'model',token.model);await new Promise(resolve=>{
    const socket=new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token.token)}`);let audioBytes=0,transcript='',ready=false,finished=false;
    const timer=setTimeout(()=>{console.log('Voice deadline',{ready,audioBytes,transcript});socket.close();resolve();},30000);
    socket.onopen=()=>socket.send(JSON.stringify({setup:{model:`models/${token.model}`}}));
    socket.onmessage=async event=>{const data=JSON.parse(typeof event.data==='string'?event.data:await event.data.text());if(data.error)console.log('Voice error',data.error);if(data.setupComplete){ready=true;socket.send(JSON.stringify({clientContent:{turns:[],turnComplete:true}}));socket.send(JSON.stringify({realtimeInput:{text:'Please say in English: Hello, how can Digital X help your business today? Do not use a tool.'}}));}
      if(data.serverContent?.outputTranscription?.text)transcript+=data.serverContent.outputTranscription.text;
      for(const part of data.serverContent?.modelTurn?.parts||[])if(part.inlineData)audioBytes+=Buffer.from(part.inlineData.data,'base64').length;
      if(data.serverContent?.turnComplete&&!finished){finished=true;console.log('Live response',{ready,audioBytes,transcript});clearTimeout(timer);socket.close();resolve();}
    };
    socket.onclose=event=>{if(!finished){console.log('Voice closed',event.code,event.reason,{ready,audioBytes,transcript});clearTimeout(timer);resolve();}};socket.onerror=()=>console.log('Voice transport error');
  }); }
}
