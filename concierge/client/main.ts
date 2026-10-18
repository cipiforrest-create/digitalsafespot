import {ui} from './page-language';

import {goalLabels,validateTool,type Goal,type Context,type Message,type ToolCall,type ToolResult,type Section} from '../shared/contracts';
import {pageFromPath,type PageId} from '../shared/catalogue';
import {readSse} from '../shared/sse';
import {el,text,notice,post,track,loadAnalytics} from './dom';
import {Forms} from './forms';
import {Waveform} from './waveform';
import {xStageState,xStageVoice,xStageChunk} from './x-stage';
import {voiceLabel,type VoiceState} from './voice-state';
import {navigate} from './navigation';
import {renderMessage} from './messages';
import {WebsiteTour} from './tour';
import {tourStops,type TourStopId} from '../shared/tour';
import {seekFilm,selectShowcase} from './page-effects';
import {playDemo} from './demo';
import type {VoiceSession} from './voice';
import {runChatTurn,type ActionCommand} from './session';
import {renderActionCard,applyExecutionStatus} from './action-card';
import {isLeadRequest,detectControl} from '../shared/lead-intent';
import type {ChatV2Action} from '../shared/chat-v2';
import type {SolutionCard} from '../shared/solution-map';
import type {ActionCard} from '../shared/chat-action';
import type {ExecutionStatusCard} from '../shared/execution-run';
// P3d restore: action turns (a lead/contact request, an active lead.create action, card commands and "was it saved?"
// questions) go through the v2 orchestrator, which owns the server-side pending action and the ONE controlled-execution
// path. Every other text turn keeps the production chat loop below, so page navigation, cinematic/showcase control,
// tours and goal selection keep their full tool set. Setting this to false routes everything back to the legacy loop.
const CHAT_V2:boolean=true;
let goal:Goal|null=null,messages:Message[]=[],recommendation='',voice:VoiceSession|null=null;
let request:AbortController|null=null,busy=false,muted=false,voiceStarting=false,voiceRun=0,followTail=true;
let retryValue='',retryNode:HTMLElement|null=null;
let lastVoiceState:VoiceState='idle';
// P3d: the single reused action-card node for the current pending lead.create action (null when none is visible).
let actionCardNode:HTMLElement|null=null;
// A live (non-terminal) lead action survives a page reload in this tab, so the next answer still reaches the action flow.
// 'live' = a card is collecting/awaiting confirmation; 'done' = a lead action finished in this tab (so "was it saved?"
// is answered from the durable receipt, never improvised).
const LEAD_FLAG='dx-lead-action';
let leadMemory:''|'live'|'done'='';
function leadState():''|'live'|'done'{try{const v=sessionStorage.getItem(LEAD_FLAG);return v==='live'||v==='done'?v:'';}catch{return leadMemory;}}
function setLeadState(value:'live'|'done'){leadMemory=value;try{sessionStorage.setItem(LEAD_FLAG,value);}catch{/* Optional storage. */}}
function isActionTurn(value:string,command?:ActionCommand):boolean{const state=leadState();return Boolean(command)||state==='live'||isLeadRequest(value)||(state==='done'&&detectControl(value)==='status');}
function context():Context{let copy=messages.slice(-16).map(m=>({...m,content:m.content.slice(0,2000)}));while(copy.reduce((n,m)=>n+m.content.length,0)>12000)copy=copy.slice(1);return{goal,messages:copy,pageId:pageFromPath(location.pathname)||'home',locale:document.documentElement.lang==='de'?'de':document.documentElement.lang==='en'?'en':'bs'};}
const forms=new Forms(context,()=>recommendation),waveform=new Waveform(document.querySelector('#waveform')),heroWave=new Waveform(document.querySelector('[data-x-wave]'));
heroWave.onLevel=xStageVoice;
const tour=new WebsiteTour({minimize:minimizePanel,narrate:narrateTour,canAdvance:()=>!busy&&!voiceStarting&&!['speaking','thinking','connecting','recovering'].includes(lastVoiceState)&&!document.querySelector('dialog[open]')});
const drafts:Partial<Record<Message['role'],{node:HTMLElement;value:string}>>={};
function setStatus(value:string){el('#conversation-status').textContent=value;el('#dock-status').textContent=value;}
function sending(value:boolean){busy=value;el<HTMLButtonElement>('#chat-form [type=submit]').disabled=value;el('#chat-form').setAttribute('aria-busy',String(value));}
function setState(state:VoiceState){const previous=lastVoiceState;lastVoiceState=state;if(state==='error'||state==='recovering')tour?.pause();if((state==='listening'||state==='muted')&&previous==='speaking')tour.completed();const core=document.querySelector<HTMLElement>('.ai-core');if(core)core.dataset.state=state;el('#conversation-dock').dataset.state=state;const status=document.querySelector('#core-status');if(status)status.textContent=voiceLabel(state);xStageState(state);setStatus(voiceLabel(state));}
function openPanel(focus=false){el('#conversation-dock').hidden=true;el('#conversation').hidden=false;document.body.classList.remove('concierge-minimized');if(focus)el<HTMLTextAreaElement>('#chat-input').focus({preventScroll:true});}
function minimizePanel(){if(el('#conversation').hidden)return;const focused=el('#conversation').contains(document.activeElement);el('#conversation').hidden=true;el('#conversation-dock').hidden=false;document.body.classList.add('concierge-minimized');if(focused)el<HTMLButtonElement>('#restore-conversation').focus({preventScroll:true});}
// Model-driven page moves keep the conversation open so it never snaps shut mid-answer; the page changes behind it.
// The panel only folds away for the tour, or in voice on a phone where the open panel would cover the page.
function actionMinimize(){if(tour.active||((voice?.active||voiceStarting)&&matchMedia('(max-width: 760px)').matches))minimizePanel();}
function hidePanel(){el('#conversation').hidden=true;el('#conversation-dock').hidden=true;document.body.classList.remove('concierge-minimized');document.querySelector<HTMLButtonElement>('[data-talk]')?.focus({preventScroll:true});}
function scrollTranscript(){if(followTail)el('#transcript').scrollTop=el('#transcript').scrollHeight;else el('#new-messages').hidden=false;if(el('#conversation').hidden)el('#restore-conversation').setAttribute('aria-label','Proširi razgovor — nove poruke');}
function addMessage(role:Message['role'],value:string){const node=text('div','','message');node.dataset.role=role;const body=text('span','');renderMessage(body,value);node.append(text('strong',role==='user'?ui('VI','YOU','SIE'):'DIGITAL X'),body);el('#transcript').append(node);scrollTranscript();return body;}
function transcript(role:Message['role'],value:string,done=false){if(role==='user'&&value)tour.pause();if(value){drafts[role]||={node:addMessage(role,''),value:''};drafts[role]!.value+=value;renderMessage(drafts[role]!.node,drafts[role]!.value);if(role==='assistant')tour.caption(drafts[role]!.value);scrollTranscript();}if(done&&drafts[role]){messages.push({role,content:drafts[role]!.value});delete drafts[role];}if(done&&role==='assistant'&&!request){sending(false);if(lastVoiceState!=='speaking')tour.completed();}}
function finishDrafts(){transcript('user','',true);transcript('assistant','',true);}
function selectGoal(value:Goal){goal=value;document.querySelectorAll<HTMLButtonElement>('[data-goal]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.goal===value)));track('concierge_goal_selected',{goal:value});}
async function reveal(section:Section,move=true):Promise<ToolResult['status']>{if(document.querySelector('dialog[open]'))return'deferred';if(!document.getElementById(section)){if(!move)return'deferred';if(!await navigate('home'))return'deferred';}if(move)actionMinimize();const node=document.getElementById(section);if(!node)return'rejected';if(move)node.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});node.classList.add('is-highlighted');setTimeout(()=>node.classList.remove('is-highlighted'),6000);track('concierge_section_reveal',{section});return'applied';}
async function execute(raw:ToolCall):Promise<ToolResult>{try{const call=validateTool(raw);let status:ToolResult['status']='applied';switch(call.name){
case'select_goal':selectGoal(call.args.goal as Goal);break;
case'navigate_to_section':status=await reveal(call.args.section as Section);break;
case'highlight_solution':status=await reveal(call.args.section as Section,false);break;
case'navigate_to_page':if(document.querySelector('dialog[open]'))status='deferred';else{actionMinimize();status=await navigate(call.args.pageId as PageId)?'applied':'deferred';}break;
case'guide_website':status=await tour.action(call.args.action,true)?'applied':'deferred';break;
case'explore_cinematic':actionMinimize();if(!document.querySelector('[data-sequence]')&&!await navigate('cinematic'))status='deferred';else status=seekFilm(['signal','web','visibility','automation','knowledge','system'].indexOf(call.args.chapter))?'applied':'deferred';break;
case'select_cinematic_example':actionMinimize();if(!document.querySelector('[data-showcase]')&&!await navigate('examples'))status='deferred';else status=selectShowcase(call.args.example)?'applied':'deferred';break;
case'show_recommendation':recommendation=call.args.section;notice(call.args.reason);break;
case'open_ai_audit':if(document.querySelector('dialog[open]'))status='deferred';else forms.openAudit();break;
case'show_lead_response_demo':status=await reveal('receptionist');if(status==='applied')startDemo();break;
case'start_text_mode':case'end_voice_session':setTimeout(toText,80);break;
}return{id:call.id,status,detail:status==='deferred'?'A form or navigation is active; action deferred.':call.name==='guide_website'?`Tour state: ${tour.step||'stopped'}. ${tourStops.find(s=>s.id===tour.step)?.title||''}`:'Website action completed.'};}catch{return{id:raw.id,status:'rejected',detail:'This action could not be executed.'};}}
// T23 v2 action executor. Maps the closed ChatV2Action set to the same deterministic UI handlers the legacy tool loop
// uses. Actions come from the server orchestrator's deterministic rules, so a value outside the switch is ignored.
async function executeAction(action:ChatV2Action):Promise<void>{switch(action.type){case'open_audit':if(!document.querySelector('dialog[open]'))forms.openAudit();break;case'navigate_section':await reveal(action.section as Section);break;case'recommend':recommendation=action.section;notice(action.reason);break;case'start_tour':await tour.action('start',true);break;}}
// P3d action-card handlers. The server owns the pending lead.create action and its state; the client only renders the
// card and dispatches a Confirm/Edit/Cancel command back through a normal chat turn (no direct execution API call).
// The same card node is reused so collection → confirmation → execution update in place.
function onActionCard(card:ActionCard):HTMLElement{openPanel();const node=renderActionCard(el('#transcript'),card,{onCommand:sendActionCommand},actionCardNode);actionCardNode=node;scrollTranscript();if(card.state==='succeeded'||card.state==='cancelled'){actionCardNode=null;setLeadState('done');}else setLeadState('live');return node;}
function onExecutionStatus(card:ExecutionStatusCard):void{applyExecutionStatus(actionCardNode,card);}
// A card button sends an empty-message turn carrying the explicit command. The server re-validates every step, so a
// double Confirm replays the same idempotency key and creates no second lead.
function sendActionCommand(command:ActionCommand):void{void sendMessage('',false,undefined,command);}
// T23 SolutionCard renderer: a bounded, visitor-safe projection written with textContent only (never HTML).
function renderSolution(card:SolutionCard):void{
 const wrap=text('div','','message solution-card');wrap.dataset.role='solution';
 wrap.append(text('strong',ui('PRIJEDLOG RJEŠENJA','PROPOSED SOLUTION','LÖSUNGSVORSCHLAG')));
 wrap.append(text('p',card.diagnosis,'solution-diagnosis'));
 if(card.capabilities.length){const list=text('ul','','solution-capabilities');for(const cap of card.capabilities){const item=document.createElement('li');item.append(text('h4',cap.title));item.append(text('p',cap.rationale));if(cap.speedEvidenceNote)item.append(text('p',cap.speedEvidenceNote,'solution-note'));list.append(item);}wrap.append(list);}
 if(card.phases.length){const list=text('ol','','solution-phases');for(const phase of card.phases){const item=document.createElement('li');item.append(text('strong',phase.title));item.append(text('span',phase.detail));list.append(item);}wrap.append(list);}
 if(card.evidence.length){const list=text('ul','','solution-evidence');for(const line of card.evidence)list.append(text('li',line));wrap.append(list);}
 wrap.append(text('p',card.nextAction,'solution-next'));
 const cta=text('button',ui('Zatraži plan','Request a plan','Plan anfordern'),'button primary');cta.type='button';cta.addEventListener('click',()=>{finishDrafts();forms.openLead();track('concierge_strategy_open');});wrap.append(cta);
 el('#transcript').append(wrap);scrollTranscript();
}
// Example prompts above the composer: one tap sends a ready question about a headline service (BA / EN / DE).
const examplePrompts:[string,string,string,string,string,string][]=[
 ['Nova web stranica + AI asistent','Trebam novu web stranicu s AI asistentom.','New website + AI assistant','I need a new website with an AI assistant.','Neue Website + KI-Assistent','Ich brauche eine neue Website mit KI-Assistent.'],
 ['Besplatna AI analiza stranice','Analiziraj moju web stranicu besplatno.','Free AI website analysis','Analyse my website for free.','Kostenlose KI-Website-Analyse','Analysieren Sie meine Website kostenlos.'],
 ['Vidljivost na Googleu i u AI pretrazi','Kako da me Google i AI asistenti bolje preporučuju?','Rank on Google and AI search','How can Google and AI assistants recommend my business more?','Sichtbar bei Google und KI-Suche','Wie empfehlen Google und KI-Assistenten mein Unternehmen öfter?'],
 ['AI recepcionar 24/7','Kako AI recepcionar odgovara klijentima 24/7?','24/7 AI receptionist','How does an AI receptionist answer my customers 24/7?','KI-Rezeption rund um die Uhr','Wie beantwortet eine KI-Rezeption meine Kundenanfragen rund um die Uhr?'],
 ['Automatizacija posla','Koje poslove u mojoj firmi mogu automatizovati?','Automate my business','Which tasks in my business can be automated?','Abläufe automatisieren','Welche Abläufe in meinem Unternehmen lassen sich automatisieren?'],
 ['Zatraži ponudu','Želim ponudu, molim vas kontaktirajte me.','Get a quote','I would like a quote, please contact me.','Angebot anfordern','Ich möchte ein Angebot, bitte kontaktieren Sie mich.'],
];
function mountExamplePrompts(){if(document.querySelector('.chat-prompts'))return;const form=document.querySelector('#chat-form');if(!form)return;const row=text('div','','chat-prompts');row.setAttribute('role','group');row.setAttribute('aria-label',ui('Primjeri pitanja','Example questions','Beispielfragen'));for(const p of examplePrompts){const label=ui(p[0],p[2],p[4]),prompt=ui(p[1],p[3],p[5]);const b=text('button',label);(b as HTMLButtonElement).type='button';b.addEventListener('click',()=>{track('concierge_example_prompt',{label:p[2]});void sendMessage(prompt);});row.append(b);}form.before(row);}
function updateMute(){for(const selector of ['#mute-voice','#dock-mute']){el(selector).textContent=muted?'Uključi mikrofon':'Isključi mikrofon';el(selector).setAttribute('aria-pressed',String(muted));}el('#dock-mute').setAttribute('aria-label',muted?'Uključi mikrofon':'Isključi mikrofon');}
function voiceControls(active:boolean){el('#mute-voice').hidden=!active;el('#dock-mute').hidden=!active;el('#stop-voice').hidden=!active;el('#voice-mode').hidden=active;muted=false;updateMute();}
function toText(){voiceRun++;voiceStarting=false;finishDrafts();voice?.stop();voice=null;waveform.set(null,null);heroWave.set(null,null);voiceControls(false);if(!request){sending(false);setState('idle');}openPanel(true);}
async function startVoice(){openPanel();if(voiceStarting||voice?.active)return;if(busy){notice('Sačekajte odgovor prije uključivanja glasa.');return;}voiceStarting=true;const run=++voiceRun;voiceControls(true);track('concierge_voice_start');try{const module=await import('./voice');if(run!==voiceRun)return;voice?.stop();voice=new module.VoiceSession({state:setState,error:value=>{finishDrafts();sending(false);voiceControls(false);setState('error');setStatus(value);notice(value);},notice,interrupted:()=>tour.pause(),transcript,tool:execute,analysers:(i,o)=>{waveform.set(i,o);heroWave.set(i,o);}});await voice.start(context());}finally{if(run===voiceRun)voiceStarting=false;}}
function resizeInput(){const input=el<HTMLTextAreaElement>('#chat-input');input.style.height='auto';input.style.height=`${Math.min(144,input.scrollHeight)}px`;}
function clearSubmittedDraft(value:string){const input=el<HTMLTextAreaElement>('#chat-input');if(input.value.trim()===value){input.value='';resizeInput();}}
async function narrateTour(id:TourStopId){
 const stop=tourStops.find(s=>s.id===id)!;
 if(voice?.connected){sending(true);if(!voice.sendText(`Website tour event (not visitor speech): ${stop.title}. ${stop.focus} Briefly explain this visible stop in the visitor's language. Do not navigate or restart the tour.`)){sending(false);tour.pause();}return;}
 await sendMessage('',false,id);
}
async function sendMessage(value:string,retry=false,tourStep?:TourStopId,command?:ActionCommand){
value=value.trim();if(busy||(!value&&!tourStep&&!command))return;if(voiceStarting||(voice?.active&&!voice.connected)){setStatus('Glas se još povezuje. Poruka je sačuvana — pošaljite je kada veza bude spremna.');return;}
if(!tourStep){tour.pause();openPanel();}followTail=true;el('#retry-message').hidden=true;
if(voice?.connected&&!command){try{if(!voice.sendText(value))return;messages.push({role:'user',content:value});addMessage('user',value);clearSubmittedDraft(value);sending(true);}catch{setStatus('Poruka nije poslana. Pokušajte ponovo.');}return;}
const userNode=(tourStep||command)?null:retry&&retryNode?retryNode:addMessage('user',value);if(userNode)userNode.parentElement!.dataset.failed='false';sending(true);setState('thinking');
const controller=new AbortController();request=controller;let answer='',node:HTMLElement|null=null,accepted=false;
if(!retry&&!tourStep&&!command)messages.push({role:'user',content:value});const input={...context(),...(tourStep?{tourStep}:{})};
// P3d action turn: one request → the closed v2 event set (delta / action / build_solution / action_card /
// execution_status / done). The orchestrator owns the turn, so there is no continuation loop here.
if(CHAT_V2&&!tourStep&&isActionTurn(value,command)){let carded=false;const shown:{card:HTMLElement|null}={card:null};
 try{await post('/api/concierge/session',{mode:'text',context:input},controller.signal);
  await runChatTurn(input,{signal:controller.signal,onOpen:()=>{accepted=true;clearSubmittedDraft(value);},
   onDelta:chunk=>{answer+=chunk;xStageChunk();if(answer.length>14000)throw new Error('Odgovor je predug. Postavite kraće pitanje.');node||=addMessage('assistant','');renderMessage(node,answer);tour.caption(answer);scrollTranscript();},
   onAction:executeAction,onSolution:card=>{carded=true;renderSolution(card);},onActionCard:card=>{carded=true;shown.card=onActionCard(card);},onExecutionStatus},command);
  // The reply ("review the card below") streams after the card event, so keep the live card as the newest item.
  if(shown.card?.isConnected){el('#transcript').append(shown.card);scrollTranscript();}
  if(!answer&&!carded)throw new Error('Nije stigao potpun odgovor. Pokušajte ponovo.');if(answer)messages.push({role:'assistant',content:answer});retryValue='';retryNode=null;setState('idle');tour.completed();
 }catch(error){if(!controller.signal.aborted){tour.pause();setState('error');setStatus(error instanceof Error?error.message:'Veza je prekinuta. Pokušajte ponovo.');if(userNode){userNode.parentElement!.dataset.failed='true';retryValue=value;retryNode=userNode;el('#retry-message').hidden=false;}if(node){const partial=node as HTMLElement;partial.parentElement!.dataset.failed='true';partial.append(document.createTextNode('\n[Odgovor je prekinut]'));}if(!accepted&&!command){const draft=el<HTMLTextAreaElement>('#chat-input');if(!draft.value)draft.value=value;resizeInput();}if(command&&actionCardNode)actionCardNode.querySelectorAll<HTMLButtonElement>('button[data-action-command]').forEach(b=>b.disabled=false);}}
 finally{if(request===controller){sending(false);request=null;}}
 return;
}
try{await post('/api/concierge/session',{mode:'text',context:input},controller.signal);let continuation:string|undefined;let results:ToolResult[]=[];
for(let round=0;round<4;round++){
const response=await post('/api/concierge/chat',{context:input,...(continuation?{continuation,results}:{})},controller.signal);
if(!response.body)throw new Error('Veza je prekinuta. Pokušajte ponovo.');accepted=true;clearSubmittedDraft(value);results=[];continuation=undefined;
await readSse(response.body,async(event,data)=>{if(controller.signal.aborted)return;if(event==='delta'){const delta=(data as {text?:unknown}).text;if(typeof delta!=='string')throw new Error('Odgovor nije ispravan. Pokušajte ponovo.');answer+=delta;xStageChunk();if(answer.length>14000)throw new Error('Odgovor je predug. Postavite kraće pitanje.');node||=addMessage('assistant','');renderMessage(node,answer);tour.caption(answer);scrollTranscript();}if(event==='tool')results.push(await execute(data as ToolCall));if(event==='done')continuation=(data as {continuation?:string}).continuation;if(event==='error')throw new Error((data as {message:string}).message);});if(!continuation)break;
}if(!answer)throw new Error('Nije stigao potpun odgovor. Pokušajte ponovo.');messages.push({role:'assistant',content:answer});retryValue='';retryNode=null;setState('idle');tour.completed();
}catch(error){if(!controller.signal.aborted){tour.pause();setState('error');setStatus(error instanceof Error?error.message:'Veza je prekinuta. Pokušajte ponovo.');if(userNode){userNode.parentElement!.dataset.failed='true';retryValue=value;retryNode=userNode;el('#retry-message').hidden=false;}if(node){const partial=node as HTMLElement;partial.parentElement!.dataset.failed='true';partial.append(document.createTextNode('\n[Odgovor je prekinut]'));}if(!accepted&&!tourStep){const draft=el<HTMLTextAreaElement>('#chat-input');if(!draft.value)draft.value=value;resizeInput();}}}
finally{if(request===controller){sending(false);request=null;}}
}
function closeConversation(clear=false){tour.stop();voiceRun++;voiceStarting=false;request?.abort();request=null;sending(false);finishDrafts();voice?.stop();voice=null;if(clear){messages=[];el('#transcript').replaceChildren();retryValue='';retryNode=null;el('#retry-message').hidden=true;el<HTMLTextAreaElement>('#chat-input').value='';}voiceControls(false);setState('idle');hidePanel();}
const startDemo=()=>playDemo();
document.addEventListener('click',event=>{const target=(event.target as Element).closest<HTMLElement>('button,a');if(!target)return;
if(target.hasAttribute('data-tour-start'))void sendMessage('Provedi me kroz Digital X stranicu i objasni šta nudite.');
if(target.dataset.tourAction)void tour.action(target.dataset.tourAction);
if(target.dataset.productInquiry){tour.pause();recommendation=target.dataset.productInquiry;forms.prepareInquiry({service:recommendation});}
if(target.hasAttribute('data-audit')||target.hasAttribute('data-strategy'))tour.pause();
if(target.hasAttribute('data-talk'))void startVoice();if(target.hasAttribute('data-text'))toText();if(target.hasAttribute('data-audit'))forms.openAudit();if(target.hasAttribute('data-strategy')){finishDrafts();forms.openLead();track('concierge_strategy_open');}
if(target.dataset.goal){const value=target.dataset.goal as Goal;selectGoal(value);void sendMessage(target.dataset.goalPrompt||goalLabels[value]);}
if(target.matches('.menu-toggle')){const menu=el('#mobile-menu');menu.hidden=!menu.hidden;target.setAttribute('aria-expanded',String(!menu.hidden));}
if(target.id==='run-demo')startDemo();if(target.closest('#mobile-menu')){el('#mobile-menu').hidden=true;document.querySelector('.menu-toggle')?.setAttribute('aria-expanded','false');}
if(target instanceof HTMLAnchorElement&&!target.closest('.language-nav')&&!target.target&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey){const url=new URL(target.href);const id=pageFromPath(url.pathname);if(url.origin===location.origin&&id){event.preventDefault();tour.pause();minimizePanel();void navigate(id,url.hash).catch(()=>notice('Stranica se nije otvorila. Pokušajte ponovo.'));}}
});
document.addEventListener('submit',event=>{const form=event.target as HTMLFormElement;if(!form.matches('[data-inquiry-form]'))return;event.preventDefault();if(!form.reportValidity())return;tour.pause();const data=new FormData(form);recommendation=String(data.get('service')||'');forms.prepareInquiry({name:String(data.get('name')||''),email:String(data.get('email')||''),service:recommendation,objective:String(data.get('objective')||'')});});
el('#voice-mode').addEventListener('click',()=>void startVoice());el('#text-mode').addEventListener('click',()=>{tour.pause();toText();});el('#stop-voice').addEventListener('click',()=>{tour.pause();toText();});
for(const selector of ['#mute-voice','#dock-mute'])el(selector).addEventListener('click',()=>{muted=!muted;voice?.setMuted(muted);updateMute();});
el('#end-conversation').addEventListener('click',()=>closeConversation(true));el('#dock-end').addEventListener('click',()=>closeConversation(true));el('#close-conversation').addEventListener('click',()=>closeConversation());
el('#minimize-conversation').addEventListener('click',minimizePanel);el('#restore-conversation').addEventListener('click',()=>{openPanel();el('#restore-conversation').setAttribute('aria-label','Proširi razgovor');el<HTMLButtonElement>('#minimize-conversation').focus({preventScroll:true});});
el('#conversation').addEventListener('keydown',event=>{if((event as KeyboardEvent).key==='Escape'){event.preventDefault();minimizePanel();}});
el<HTMLFormElement>('#chat-form').addEventListener('submit',event=>{event.preventDefault();const value=el<HTMLTextAreaElement>('#chat-input').value;void sendMessage(value,value.trim()===retryValue);});
el('#chat-input').addEventListener('input',resizeInput);el('#chat-input').addEventListener('keydown',event=>{const key=event as KeyboardEvent;if(key.key==='Enter'&&!key.shiftKey&&!key.isComposing&&key.keyCode!==229){key.preventDefault();el<HTMLFormElement>('#chat-form').requestSubmit();}});
el('#retry-message').addEventListener('click',()=>{if(retryValue)void sendMessage(retryValue,true);});el('#review-lead').addEventListener('click',()=>{finishDrafts();forms.openLead();});
el('#transcript').addEventListener('scroll',()=>{const node=el('#transcript');followTail=node.scrollHeight-node.scrollTop-node.clientHeight<60;if(followTail)el('#new-messages').hidden=true;});el('#new-messages').addEventListener('click',()=>{followTail=true;scrollTranscript();el('#new-messages').hidden=true;});
el('#cookie-preferences').addEventListener('click',()=>el<HTMLDialogElement>('#consent-dialog').showModal());document.querySelectorAll<HTMLButtonElement>('[data-consent]').forEach(b=>b.onclick=()=>{try{localStorage.setItem('dx-consent',b.dataset.consent!);}catch{/* Optional storage. */}el<HTMLDialogElement>('#consent-dialog').close();if(b.dataset.consent==='granted')loadAnalytics();else if(document.getElementById('concierge-gtm'))location.reload();});
function viewport(){const view=window.visualViewport;document.documentElement.style.setProperty('--visible-height',`${view?.height||innerHeight}px`);document.documentElement.style.setProperty('--keyboard-offset',`${Math.max(0,innerHeight-(view?.height||innerHeight)-(view?.offsetTop||0))}px`);}
mountExamplePrompts();
window.visualViewport?.addEventListener('resize',viewport);window.visualViewport?.addEventListener('scroll',viewport);viewport();
document.addEventListener('concierge:navigated',()=>{waveform.attach(document.querySelector('#waveform'));heroWave.attach(document.querySelector('[data-x-wave]'));void import('./page-effects').then(m=>{m.mountEffects();xStageState(lastVoiceState);});});
window.addEventListener('popstate',()=>{const id=pageFromPath(location.pathname);if(id)void navigate(id,location.hash,false).catch(()=>notice('Povratak nije uspio. Otvorite stranicu ponovo.'));});
document.addEventListener('visibilitychange',()=>{waveform.resume();heroWave.resume();});window.addEventListener('pagehide',()=>{request?.abort();voice?.stop();});loadAnalytics();
// Page effects (ambient canvas, cinema story, 3D world) start once the hero has painted its largest element (or
// after 2.5 s), so the first screen never waits for their setup work.
function afterHeroPaint(run:()=>void){let done=false;const go=()=>{if(done)return;done=true;observer?.disconnect();requestAnimationFrame(()=>setTimeout(run,0));};const observer='PerformanceObserver' in window&&PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint')?new PerformanceObserver(go):null;observer?.observe({type:'largest-contentful-paint',buffered:true});setTimeout(go,observer?2500:0);}
afterHeroPaint(()=>void import('./page-effects').then(m=>m.mountEffects()));
