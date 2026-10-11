// A scripted, clearly labelled example of the lead flow (enquiry → answer → summary → confirmation).
// It is local only: nothing is sent, stored or booked, and it never claims to be a real client conversation.
import {pageLanguage,ui} from './page-language';
type Line={step:number;kind:'visitor'|'assistant'|'summary'|'confirm';text:string;rows?:[string,string][]};
const script:Line[]=[
 {step:0,kind:'visitor',text:'Dobar dan! Imate li slobodan termin za pregled ove subote?'},
 {step:1,kind:'assistant',text:'Dobar dan! Subotom radimo od 9 do 14 h. Slobodno je u 10:00 i 11:30. Da li je u pitanju prvi pregled?'},
 {step:1,kind:'visitor',text:'Da, prvi pregled. 11:30 mi odgovara.'},
 {step:2,kind:'summary',text:'Sažetak za vaš tim',rows:[['Potreba','Prvi pregled'],['Željeni termin','Subota, 11:30'],['Kanal','Web chat'],['Status','Čeka vašu potvrdu']]},
 {step:3,kind:'confirm',text:'Vi potvrđujete termin jednim klikom, a posjetilac dobija potvrdu. Ova demonstracija ništa ne šalje.'},
];
const translated:Record<'en'|'de',Line[]>={
 en:[
  {step:0,kind:'visitor',text:'Hello! Do you have an appointment for a check-up this Saturday?'},
  {step:1,kind:'assistant',text:'Hello! On Saturdays we are open from 9 am to 2 pm. In this example, 10:00 and 11:30 are available. Is this your first visit?'},
  {step:1,kind:'visitor',text:'Yes, my first visit. 11:30 works for me.'},
  {step:2,kind:'summary',text:'Summary for your team',rows:[['Request','First check-up'],['Preferred time','Saturday, 11:30'],['Channel','Web chat'],['Status','Awaiting your confirmation']]},
  {step:3,kind:'confirm',text:'You confirm the appointment and the visitor receives a confirmation. This demonstration does not send anything.'},
 ],
 de:[
  {step:0,kind:'visitor',text:'Guten Tag! Haben Sie diesen Samstag einen Termin für eine Untersuchung frei?'},
  {step:1,kind:'assistant',text:'Guten Tag! Samstags sind wir von 9 bis 14 Uhr geöffnet. In diesem Beispiel sind 10:00 und 11:30 frei. Ist es Ihr erster Besuch?'},
  {step:1,kind:'visitor',text:'Ja, mein erster Besuch. 11:30 passt mir.'},
  {step:2,kind:'summary',text:'Zusammenfassung für Ihr Team',rows:[['Anliegen','Erste Untersuchung'],['Wunschtermin','Samstag, 11:30'],['Kanal','Web-Chat'],['Status','Wartet auf Ihre Bestätigung']]},
  {step:3,kind:'confirm',text:'Sie bestätigen den Termin und der Besucher erhält eine Bestätigung. Diese Demonstration versendet nichts.'},
 ]
};
const label={visitor:'Posjetilac',assistant:'Asistent',summary:'',confirm:''};
let run=0;
function node(line:Line){
 const item=document.createElement('div');item.className=`demo-line demo-${line.kind}`;
 if(line.kind==='summary'){
  const title=document.createElement('strong');title.textContent=line.text;const list=document.createElement('dl');
  for(const [k,v] of line.rows!){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=v;list.append(dt,dd);}
  item.append(title,list);return item;
 }
 if(label[line.kind]){const who=document.createElement('small');who.textContent=line.kind==='visitor'?ui('Posjetilac','Visitor','Besucher'):ui('Asistent','Assistant','Assistent');item.append(who);}
 const body=document.createElement('p');body.textContent=line.text;item.append(body);return item;
}
export function playDemo(root:HTMLElement|null=document.querySelector('[data-demo]')){
 if(!root)return;const id=++run,output=root.querySelector<HTMLElement>('#demo-output')!,button=root.querySelector<HTMLButtonElement>('#run-demo'),steps=[...root.querySelectorAll<HTMLElement>('[data-demo-step]')];
 const lang=pageLanguage(),lines=lang==='bs'?script:translated[lang];
 const instant=matchMedia('(prefers-reduced-motion:reduce)').matches;
 output.replaceChildren();root.dataset.playing='true';if(button)button.textContent=ui('Pokreni ponovo','Replay example','Beispiel erneut starten');
 const mark=(step:number)=>steps.forEach((s,i)=>{s.dataset.active=String(i<=step);s.toggleAttribute('aria-current',i===step);});
 let i=0;
 const next=()=>{
  if(id!==run||!root.isConnected)return;
  if(i>=lines.length){root.dataset.playing='false';return;}
  const line=lines[i++];
  if(instant){mark(line.step);output.append(node(line));next();return;}
  // A short typing pause before the assistant speaks makes the exchange readable at a glance.
  const typing=line.kind==='assistant'?document.createElement('div'):null;
  if(typing){typing.className='demo-line demo-typing';typing.setAttribute('aria-hidden','true');typing.append(...[0,1,2].map(()=>document.createElement('i')));output.append(typing);}
  setTimeout(()=>{if(id!==run)return;typing?.remove();mark(line.step);output.append(node(line));output.scrollTop=output.scrollHeight;setTimeout(next,line.kind==='visitor'?500:900);},typing?1100:350);
 };
 mark(-1);next();
}
// Plays once when the example scrolls into view; the button replays it.
export function mountDemo(signal:AbortSignal){
 const root=document.querySelector<HTMLElement>('[data-demo]');if(!root)return;
 const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting&&!root.dataset.playing){observer.disconnect();playDemo(root);}},{threshold:.45});
 observer.observe(root);signal.addEventListener('abort',()=>{observer.disconnect();run++;},{once:true});
}
