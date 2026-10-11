import {test,expect} from '@playwright/test';
type AudioQA = { tracks:MediaStreamTrack[]; contexts:AudioContext[]; stops:number; sockets:{readyState:number;bufferedAmount:number;sent:Record<string,unknown>[];emit:(data:unknown)=>void}[] };
declare global { interface Window { qaAudio: AudioQA } }

test('voice interruption pauses the guided tour while retaining the same connection',async({page})=>{
 await page.goto('/ai-concierge-preview/');await page.locator('#orb').click();await expect(page.locator('.ai-core')).toHaveAttribute('data-state','listening');
 await page.evaluate(()=>window.qaAudio.sockets[0].emit({toolCall:{functionCalls:[{id:'tour',name:'guide_website',args:{action:'start'}}]}}));await expect(page).toHaveURL(/services\/$/);await expect(page.locator('#tour-bar')).toBeVisible();
 await page.evaluate(()=>window.qaAudio.sockets[0].emit({serverContent:{interrupted:true}}));await expect(page.locator('#tour-label')).toContainText('pauzirano');expect(await page.evaluate(()=>window.qaAudio.sockets.length)).toBe(1);expect(await page.evaluate(()=>window.qaAudio.tracks[0].readyState)).toBe('live');await page.locator('#dock-end').click();await expect(page.locator('#tour-bar')).toBeHidden();expect(await page.evaluate(()=>window.qaAudio.tracks[0].readyState)).toBe('ended');
});
test.beforeEach(async({page})=>{
  await page.route('**/api/concierge/session',route=>route.fulfill({json:{token:'synthetic-test-token',model:'synthetic-test-model',expiresAt:Date.now()+600000}}));
  await page.addInitScript(()=>{
    const state:AudioQA={tracks:[],contexts:[],stops:0,sockets:[]};
    Object.assign(window,{qaAudio:state});const NativeAudio=window.AudioContext;
    window.AudioContext=class extends NativeAudio{constructor(options?:AudioContextOptions){super(options);state.contexts.push(this);}createBufferSource(){const source=super.createBufferSource();const stop=source.stop.bind(source);source.stop=(when?:number)=>{state.stops++;stop(when);};return source;}};
    navigator.mediaDevices.getUserMedia=async()=>{const generator=new NativeAudio();const destination=generator.createMediaStreamDestination();const oscillator=generator.createOscillator();oscillator.connect(destination);oscillator.start();const track=destination.stream.getAudioTracks()[0];const stop=track.stop.bind(track);track.stop=()=>{stop();oscillator.stop();void generator.close();};state.tracks.push(track);return destination.stream;};
    class Socket {
      sent:Record<string,unknown>[]=[];
      static CONNECTING=0;static OPEN=1;readyState:number=0;bufferedAmount=0;onopen:((event:Event)=>void)|null=null;onmessage:((event:MessageEvent)=>void)|null=null;onerror:((event:Event)=>void)|null=null;onclose:((event:Event)=>void)|null=null;
      constructor(){state.sockets.push(this);setTimeout(()=>{this.readyState=1;this.onopen?.(new Event('open'));},5);}
      emit(data:unknown){this.onmessage?.(new MessageEvent('message',{data:JSON.stringify(data)}));}
      send(value:string){const data=JSON.parse(value);this.sent.push(data);if(data.setup)setTimeout(()=>this.emit({setupComplete:{}}),5);}
      close(){this.readyState=3;}
    }
    window.WebSocket=Socket as unknown as typeof WebSocket;
  });
});
test('voice mute, interruption, stop, resume and end release audio resources',async({page})=>{
  await page.goto('/ai-concierge-preview');await page.locator('#orb').click();await expect(page.locator('.ai-core')).toHaveAttribute('data-state','listening');
  await page.getByRole('button',{name:'Isključi mikrofon',exact:true}).click();expect(await page.evaluate(()=>((window as unknown as {qaAudio:{tracks:MediaStreamTrack[]}}).qaAudio.tracks[0].enabled))).toBe(false);
  await page.getByRole('button',{name:'Uključi mikrofon',exact:true}).click();
  await page.evaluate(()=>{const state=(window as unknown as {qaAudio:{sockets:{emit:(data:unknown)=>void}[]}}).qaAudio;state.sockets[0].emit({serverContent:{modelTurn:{parts:[{inlineData:{mimeType:'audio/pcm;rate=24000',data:btoa('\0'.repeat(240000))}}]}}});});
  await expect(page.locator('.ai-core')).toHaveAttribute('data-state','speaking');await page.evaluate(()=>{const state=(window as unknown as {qaAudio:{sockets:{emit:(data:unknown)=>void}[]}}).qaAudio;state.sockets[0].emit({serverContent:{interrupted:true}});});await expect(page.locator('.ai-core')).toHaveAttribute('data-state','listening');
  await page.getByRole('button',{name:'Zaustavi glas',exact:true}).click();expect(await page.evaluate(()=>{const state=(window as unknown as {qaAudio:{tracks:MediaStreamTrack[];contexts:AudioContext[];stops:number;sockets:{readyState:number}[]}}).qaAudio;return{tracks:state.tracks.every(t=>t.readyState==='ended'),contexts:state.contexts.every(c=>c.state==='closed'),stopped:state.stops>0,sockets:state.sockets.every(s=>s.readyState===3)};})).toEqual({tracks:true,contexts:true,stopped:true,sockets:true});
  await page.getByRole('button',{name:'Glas',exact:true}).click();await expect(page.locator('.ai-core')).toHaveAttribute('data-state','listening');await page.getByRole('button',{name:'Završi razgovor',exact:true}).click();await expect(page.locator('#conversation')).toBeHidden();expect(await page.evaluate(()=>((window as unknown as {qaAudio:{tracks:MediaStreamTrack[]}}).qaAudio.tracks.every(t=>t.readyState==='ended')))).toBe(true);
});
test('mobile minimize preserves voice, tool navigation, incoming speech, transcript and keyboard focus',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/ai-concierge-preview');await page.locator('#orb').tap();await expect(page.locator('#conversation-status')).toHaveText('Slušam…');
  await page.locator('#minimize-conversation').tap();await expect(page.locator('#conversation')).toBeHidden();await expect(page.locator('#restore-conversation')).toBeFocused();
  const dock=await page.locator('#conversation-dock').boundingBox();expect(dock!.height).toBeLessThan(100);expect(dock!.y).toBeGreaterThan(700);
  await expect.poll(()=>page.evaluate(()=>window.qaAudio.sockets[0].sent.filter(s=>s.realtimeInput).length)).toBeGreaterThan(2);
  await page.evaluate(()=>window.qaAudio.sockets[0].emit({toolCall:{functionCalls:[{id:'guided',name:'navigate_to_section',args:{section:'storefront'}}]}}));
  await expect(page.locator('#storefront')).toHaveClass(/is-highlighted/);await expect(page.locator('#conversation')).toBeHidden();
  await expect.poll(()=>page.evaluate(()=>window.qaAudio.sockets[0].sent.some(s=>s.toolResponse))).toBe(true);
  await page.evaluate(()=>window.qaAudio.sockets[0].emit({serverContent:{outputTranscription:{text:'Explore the Smart Storefront.'},modelTurn:{parts:[{inlineData:{mimeType:'audio/pcm;rate=24000',data:btoa('\0'.repeat(240000))}}]}}}));
  await expect(page.locator('#dock-status')).toHaveText('Govorim…');await expect(page.locator('#conversation')).toBeHidden();
  expect(await page.evaluate(()=>({live:window.qaAudio.tracks[0].readyState,open:window.qaAudio.sockets[0].readyState,connections:window.qaAudio.sockets.length,playing:window.qaAudio.contexts[0].state}))).toEqual({live:'live',open:1,connections:1,playing:'running'});
  await page.locator('#dock-mute').tap();await expect(page.locator('#dock-mute')).toHaveText('Uključi mikrofon');expect(await page.evaluate(()=>window.qaAudio.tracks[0].enabled)).toBe(false);
  await page.locator('#dock-mute').tap();await page.locator('#restore-conversation').tap();await expect(page.locator('#minimize-conversation')).toBeFocused();await expect(page.locator('#transcript')).toContainText('Explore the Smart Storefront.');
  await page.evaluate(()=>window.qaAudio.sockets[0].emit({toolCall:{functionCalls:[{id:'auto',name:'navigate_to_section',args:{section:'aeo'}}]}}));
  await expect(page.locator('#conversation')).toBeHidden();await expect(page.locator('#aeo')).toHaveClass(/is-highlighted/);
  await page.locator('#restore-conversation').tap();await page.keyboard.press('Escape');await expect(page.locator('#conversation')).toBeHidden();expect(await page.evaluate(()=>window.qaAudio.sockets.length)).toBe(1);
  await page.locator('#dock-end').tap();await expect(page.locator('#conversation-dock')).toBeHidden();await expect(page.locator('#transcript')).toBeEmpty();expect(await page.evaluate(()=>window.qaAudio.tracks.every(t=>t.readyState==='ended')&&window.qaAudio.sockets.every(s=>s.readyState===3))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);expect(errors).toEqual([]);
});
test('temporary outgoing congestion recovers without reconnecting or sending stale frames',async({page})=>{
  await page.goto('/ai-concierge-preview');await page.locator('#orb').click();await expect(page.locator('#conversation-status')).toHaveText('Slušam…');await page.locator('#minimize-conversation').click();
  await page.evaluate(()=>{window.qaAudio.sockets[0].bufferedAmount=300000;});await expect(page.locator('#dock-status')).toHaveText('Veza se oporavlja…');
  const sent=await page.evaluate(()=>window.qaAudio.sockets[0].sent.length);await page.waitForTimeout(250);expect(await page.evaluate(()=>window.qaAudio.sockets[0].sent.length)).toBe(sent);
  await page.evaluate(()=>{window.qaAudio.sockets[0].bufferedAmount=0;});await expect(page.locator('#dock-status')).toHaveText('Slušam…');await expect.poll(()=>page.evaluate(()=>window.qaAudio.sockets[0].sent.length)).toBeGreaterThan(sent);
  expect(await page.evaluate(()=>window.qaAudio.sockets.length)).toBe(1);await expect(page.getByText('Veza je obnovljena. Ponovite riječi izgovorene tokom prekida.')).toBeVisible();
  await page.evaluate(()=>window.qaAudio.sockets[0].emit({error:{message:'synthetic disconnect'}}));await expect(page.locator('#dock-status')).toContainText('Glasovni razgovor trenutno nije dostupan');await expect(page.locator('#dock-mute')).toBeHidden();await page.locator('#restore-conversation').click();await page.locator('#voice-mode').click();await expect(page.locator('#conversation-status')).toHaveText('Slušam…');expect(await page.evaluate(()=>window.qaAudio.sockets.length)).toBe(2);await page.locator('#end-conversation').click();
});

test('voice continues across full service pages with one socket and a preserved transcript',async({page})=>{
 await page.goto('/ai-concierge-preview/');await page.locator('#orb').click();await expect(page.locator('#conversation-status')).toHaveText('Slušam…');
 await page.evaluate(()=>window.qaAudio.sockets[0].emit({serverContent:{outputTranscription:{text:'Pogledajmo Google Ads.'},turnComplete:true}}));
 await page.evaluate(()=>window.qaAudio.sockets[0].emit({toolCall:{functionCalls:[{id:'page',name:'navigate_to_page',args:{pageId:'google-ads'}}]}}));
 await expect(page).toHaveURL(/google-ads\/$/);await expect(page.locator('h1')).toContainText('namjera');await expect(page.locator('#conversation-dock')).toBeVisible();
 expect(await page.evaluate(()=>({connections:window.qaAudio.sockets.length,track:window.qaAudio.tracks[0].readyState,context:window.qaAudio.contexts[0].state}))).toEqual({connections:1,track:'live',context:'running'});
 await page.locator('#restore-conversation').click();await expect(page.locator('#transcript')).toContainText('Pogledajmo Google Ads.');await page.goBack();await expect(page.locator('#orb')).toBeVisible();expect(await page.evaluate(()=>window.qaAudio.sockets.length)).toBe(1);await page.locator('#end-conversation').click();
});
