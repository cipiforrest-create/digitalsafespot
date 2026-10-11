import {text} from './dom';
import type {ExecutionPreviewCard} from '../shared/execution';
// P3a Interactive Execution Preview renderer. PREVIEW ONLY. This builds the visitor-safe execution preview card
// exactly like renderSolution: every string is written with textContent (never innerHTML), so nothing in the card
// — objective, step descriptions, before/after diffs — can inject markup. It reuses the .solution-card family of
// classes so spacing, borders and the transcript tail behave identically to the recommendation card. It never
// exposes hashes or internal ids, and it renders no "execute/apply" control: the boundary is disabled in P3a, so
// the strongest action the card offers is "request this change", which hands off to the lead brief like the
// solution card's CTA. approvalState is shown read-only so the reviewer sees exactly where the proposal stands.

const riskLabel:Record<ExecutionPreviewCard['risk'],string>={low:'Nizak rizik',medium:'Srednji rizik',high:'Visok rizik'};
const approvalLabel:Record<ExecutionPreviewCard['approvalLevel'],string>={none:'Bez odobrenja',owner:'Odobrenje vlasnika',privileged:'Povlašteno odobrenje'};
const stateLabel:Record<ExecutionPreviewCard['approvalState'],string>={pending:'Na čekanju',approved:'Odobreno',rejected:'Odbijeno'};
const sideLabel:Record<ExecutionPreviewCard['steps'][number]['sideEffect'],string>={none:'bez učinka',preview:'pregled',external_write:'vanjski upis',destructive:'nepovratno'};

/**
 * Build the execution-preview card element from a projected, already-sanitized ExecutionPreviewCard. Returns the
 * node so the caller can append it to the transcript (like renderSolution) or mount it anywhere for a preview demo.
 * `onRequest` is an optional handoff (e.g. open the lead brief); when omitted no CTA is rendered.
 */
export function renderExecutionPreview(card:ExecutionPreviewCard,onRequest?:()=>void):HTMLElement{
 const wrap=text('div','','message solution-card');wrap.dataset.role='execution-preview';
 wrap.append(text('strong','PREGLED IZVRŠENJA'));
 wrap.append(text('p',card.objective,'solution-diagnosis'));
 const meta=text('p',`${card.operation} · ${card.target}`,'solution-note');wrap.append(meta);
 const badges=text('p',`${riskLabel[card.risk]} · ${approvalLabel[card.approvalLevel]} · ${stateLabel[card.approvalState]} · ${card.reversible?'povratno':'nepovratno'}`,'solution-note');
 badges.dataset.risk=card.risk;badges.dataset.state=card.approvalState;wrap.append(badges);
 if(card.steps.length){const list=text('ol','','solution-phases');for(const step of card.steps){const item=document.createElement('li');item.append(text('strong',`${step.id} · ${sideLabel[step.sideEffect]}${step.reversible?'':' · nepovratno'}`));item.append(text('span',step.description));list.append(item);}wrap.append(list);}
 if(card.changes.length){const list=text('ul','','solution-capabilities');for(const change of card.changes){const item=document.createElement('li');item.append(text('h4',`${change.id} · ${change.kind} · ${change.target}`));item.append(text('p',change.summary));if(change.before!=null)item.append(text('p',`Prije: ${change.before}`,'solution-note'));if(change.after!=null)item.append(text('p',`Poslije: ${change.after}`,'solution-note'));list.append(item);}wrap.append(list);}
 if(card.risks.length){const list=text('ul','','solution-evidence');for(const line of card.risks)list.append(text('li',line));wrap.append(list);}
 wrap.append(text('p',card.expectedResult,'solution-next'));
 if(onRequest){const cta=text('button','Zatraži ovu izmjenu','button primary');cta.type='button';cta.addEventListener('click',onRequest);wrap.append(cta);}
 return wrap;
}
