// Opt-in real Live QA; uses a synthetic microphone and consumes configured API usage.
/* global window, navigator */
import {chromium, expect} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const origin=process.env.CONCIERGE_TEST_ORIGIN||'http://localhost:4317';
const directory='concierge/.screenshots';mkdirSync(directory,{recursive:true});
const wav=readFileSync(`${directory}/voice-input.wav`);let offset=12;
while(wav.toString('ascii',offset,offset+4)!=='data')offset+=8+wav.readUInt32LE(offset+4)+(wav.readUInt32LE(offset+4)%2);
const length=wav.readUInt32LE(offset+4),silence=Buffer.alloc(16000*2*10);
const padded=Buffer.concat([wav.subarray(0,offset+8),silence,wav.subarray(offset+8,offset+8+length)]);
padded.writeUInt32LE(padded.length-8,4);padded.writeUInt32LE(length+silence.length,offset+4);
const sample=resolve(`${directory}/minimized-input.wav`);writeFileSync(sample,padded);
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream',`--use-file-for-fake-audio-capture=${sample}%noloop`]});
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,permissions:['microphone'],reducedMotion:'reduce'});
if(origin.startsWith('https:')){
  const cookies=readFileSync(`${directory}/deployed-cookies.txt`,'utf8').split('\n').filter(line=>line.startsWith('#HttpOnly_')||!line.startsWith('#')).map(line=>line.replace(/^#HttpOnly_/,'').trim().split('\t')).filter(row=>row.length===7&&row[0]===new URL(origin).hostname).map(row=>({name:row[5],value:row[6],domain:row[0],path:row[2],secure:row[3]==='TRUE',httpOnly:true,expires:Number(row[4])}));
  await context.addCookies(cookies);
}
await context.addInitScript(()=>{
  const qa={tracks:[],contexts:[],playbacks:0};window.minimizedQA=qa;
  const getMedia=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia=async constraints=>{const stream=await getMedia(constraints);qa.tracks.push(...stream.getTracks());return stream;};
  const NativeAudio=window.AudioContext;
  window.AudioContext=class extends NativeAudio{constructor(options){super(options);qa.contexts.push(this);}createBufferSource(){const source=super.createBufferSource(),start=source.start.bind(source);source.start=(...args)=>{qa.playbacks++;return start(...args);};return source;}};
});
const page=await context.newPage();let minimized=false;
const report={route:`${origin}/ai-concierge-preview`,syntheticMicrophone:true,connections:0,inputBytesWhileMinimized:0,outputBytesWhileMinimized:0,toolAcknowledgements:[],errors:[],screenshots:[]};
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
page.on('websocket',socket=>{
  report.connections++;
  socket.on('framesent',event=>{const data=JSON.parse(String(event.payload));if(minimized&&data.realtimeInput?.audio)report.inputBytesWhileMinimized+=Buffer.from(data.realtimeInput.audio.data,'base64').length;
    for(const ack of data.toolResponse?.functionResponses||[])report.toolAcknowledgements.push({name:ack.name,status:ack.response?.status});});
  socket.on('framereceived',event=>{const data=JSON.parse(String(event.payload));if(minimized)for(const part of data.serverContent?.modelTurn?.parts||[])if(part.inlineData)report.outputBytesWhileMinimized+=Buffer.from(part.inlineData.data,'base64').length;});
});
try{
  const response=await page.goto(report.route);report.httpStatus=response.status();
  await page.locator('#orb').tap();await expect(page.locator('#conversation-status')).toHaveText('Slušam…',{timeout:35000});
  await page.locator('#minimize-conversation').tap();minimized=true;
  await expect(page.locator('#conversation-dock')).toBeVisible();
  await expect.poll(()=>report.inputBytesWhileMinimized,{timeout:15000}).toBeGreaterThan(1000);
  await expect.poll(()=>report.outputBytesWhileMinimized,{timeout:45000}).toBeGreaterThan(1000);
  await expect.poll(()=>page.locator('[data-role=user]').count(),{timeout:45000}).toBeGreaterThan(0);
  report.audio=await page.evaluate(()=>({tracks:window.minimizedQA.tracks.map(t=>t.readyState),contexts:window.minimizedQA.contexts.map(c=>c.state),playbacks:window.minimizedQA.playbacks,panelHidden:document.querySelector('#conversation').hidden}));
  await expect(page.locator('.ai-core')).toHaveAttribute('data-state','listening',{timeout:35000});
  await page.locator('#restore-conversation').tap();minimized=false;await page.locator('#mute-voice').tap();
  await page.locator('#chat-input').fill('Please use navigate_to_page to open the google-ads page now and explain it in one short English sentence.');
  await page.getByRole('button',{name:'Pošalji poruku',exact:true}).tap();
  await expect(page).toHaveURL(/google-ads\/$/,{timeout:30000});
  await expect(page.locator('#conversation')).toBeHidden();await expect(page.locator('#conversation-dock')).toBeVisible();minimized=true;
  await page.locator('#dock-mute').tap();
  report.guidedNavigation=true;report.dockHeight=(await page.locator('#conversation-dock').boundingBox()).height;
  for(const[width,height]of[[390,844],[1440,900],[1536,1025]]){
    await page.setViewportSize({width,height});await page.evaluate(()=>document.querySelector('main h1').scrollIntoView({behavior:'instant'}));
    await page.screenshot({path:`${directory}/minimized-${width}.png`});
    report.screenshots.push({width,height,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
  }
  await page.setViewportSize({width:390,height:844});await page.locator('#restore-conversation').tap();minimized=false;
  await page.screenshot({path:`${directory}/expanded-390.png`});
  report.restoreConnections=report.connections;report.transcriptPreserved=await page.locator('[data-role=user]').count()>0;
  await page.locator('#minimize-conversation').tap();await page.locator('#dock-end').tap();
  report.cleanup=await page.evaluate(()=>({tracksEnded:window.minimizedQA.tracks.every(t=>t.readyState==='ended'),contextsClosed:window.minimizedQA.contexts.every(c=>c.state==='closed'),dockHidden:document.querySelector('#conversation-dock').hidden,transcriptCleared:!document.querySelector('#transcript').textContent}));
  expect(report.connections).toBe(1);expect(report.audio.panelHidden).toBe(true);expect(report.audio.playbacks).toBeGreaterThan(0);expect(report.errors).toEqual([]);expect(Object.values(report.cleanup).every(Boolean)).toBe(true);expect(report.screenshots.every(s=>!s.overflow)).toBe(true);
}catch(error){report.failure=error.message;report.status=await page.locator('#conversation-status').textContent().catch(()=>null);process.exitCode=1;}
finally{writeFileSync(`${directory}/minimized-verification.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();}
