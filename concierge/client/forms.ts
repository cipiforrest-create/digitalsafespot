import {ui} from './page-language';

import type { Context, AuditCheck, AuditResult } from '../shared/contracts';
import { goalLabels } from '../shared/goals';
import { auditSummary, categories, priorities, reportHtml, reportText, scoreMethod, severityLabel } from '../shared/audit-report';
import { readSse } from '../shared/sse';
import { el, text, post, track } from './dom';

export class Forms {
  private step = 0;
  private values = { url: '', industry: '', market: '', objective: 'More leads',businessName:'',city:'' };
  private result: AuditResult | null = null;
  private auditStatus = 'not_started';
  private request: AbortController | null = null;
  private submissionId = crypto.randomUUID();
  private fingerprint = '';
  private deliveryConfigured = false;
  constructor(private context: () => Context, private recommendation: () => string) {
    document.querySelectorAll('[data-close-dialog]').forEach(b => b.addEventListener('click', () => b.closest('dialog')?.close()));
    el<HTMLDialogElement>('#audit-dialog').addEventListener('close', () => { this.request?.abort(); this.request = null; });
    el<HTMLFormElement>('#lead-form').addEventListener('submit', event => { event.preventDefault(); void this.submitLead(); });
    el('#export-lead').addEventListener('click', () => this.exportLead());
  }
  openAudit() { el<HTMLDialogElement>('#audit-dialog').showModal(); if (this.result) this.renderResult(); else this.renderStep(); track('concierge_audit_open'); }
  private renderStep() {
    const host = el('#audit-content'); host.replaceChildren();
    host.append(text('p', `KORAK ${this.step + 1} OD 4`, 'step-counter'));
    const form = document.createElement('form'); const label = document.createElement('label');
    const fields = ['url', 'industry', 'market', 'objective'] as const; const field = fields[this.step];
    label.append(text('span', ['Vaša web stranica', 'U kojoj djelatnosti poslujete?', 'Koje tržište pokrivate?', 'Šta želite unaprijediti?'][this.step]));
    let input: HTMLInputElement | HTMLSelectElement;
    if (field === 'objective') { input = document.createElement('select'); for (const [value,label] of [['More leads','Više upita'],['AI visibility','AI vidljivost'],['Website redesign','Redizajn stranice'],['Lead response automation','Automatizacija odgovora'],['Other','Drugo']]) { const option = text('option', label); option.value = value; input.append(option); } }
    else { input = document.createElement('input'); input.type = 'text'; input.maxLength = field === 'url' ? 2048 : 120; input.placeholder = field === 'url' ? 'https://vasa-firma.ba' : field === 'industry' ? 'npr. ugostiteljstvo, zdravstvo, trgovina' : 'npr. Sarajevo, Bosna i Hercegovina'; input.minLength = field === 'url' ? 3 : 2; }
    input.name = field; input.required = true; input.value = this.values[field]; label.append(input); form.append(label);
    if(this.step===0)for(const[key,title]of [['businessName','Naziv firme (opcionalno)'],['city','Grad (opcionalno)']] as const){const extra=document.createElement('label'),control=document.createElement('input');extra.textContent=title;control.name=key;control.maxLength=key==='city'?120:160;control.value=this.values[key];control.oninput=()=>{this.values[key]=control.value;};extra.append(control);form.append(extra);}
    const actions = text('div', '', 'dialog-actions');
    if (this.step > 0) { const back = text('button','Nazad','button'); back.type = 'button'; back.onclick = () => { this.values[field] = input.value; this.step--; this.renderStep(); }; actions.append(back); }
    const next = text('button',this.step === 3 ? 'Pokreni provjeru' : 'Nastavi','button primary'); next.type = 'submit'; actions.append(next); form.append(actions);
    form.onsubmit = event => {
      event.preventDefault(); input.setCustomValidity(''); let value = input.value.trim();
      if (field === 'url') { if (!/^https?:\/\//i.test(value)) value = `https://${value}`; try { const url = new URL(value); if (!['https:','http:'].includes(url.protocol)) throw new Error(); } catch { input.setCustomValidity('Unesite ispravnu web adresu.'); input.reportValidity(); return; } }
      this.values[field] = value; if (this.step < 3) { this.step++; this.renderStep(); } else void this.runAudit();
    };
    input.oninput = () => input.setCustomValidity(''); host.append(form); input.focus();
  }
  private async runAudit() {
    this.request?.abort(); const request = new AbortController(); this.request = request;
    const host = el('#audit-content'); host.replaceChildren(text('h3','Provjeravamo dostupne podatke')); const progress = text('ol','','audit-progress'); progress.setAttribute('aria-live','polite'); host.append(progress);
    try {
      const session = await post('/api/concierge/session',{ mode:'audit',context:this.context() },request.signal);
      this.deliveryConfigured = Boolean((await session.json() as {leadConfigured?:boolean}).leadConfigured);
      const response = await post('/api/concierge/audit',this.values,request.signal); if (!response.body) throw new Error('Veza za analizu je prekinuta.');
      await readSse(response.body,(event,data) => { if (event === 'progress') progress.append(text('li',(data as {message:string}).message)); if (event === 'error') throw new Error((data as {message:string}).message); if (event === 'result') this.result = data as AuditResult; });
      if (!this.result) throw new Error('Rezultati nisu stigli. Pokušajte ponovo.');
      this.auditStatus = this.result.checks.some(c=>c.status==='unavailable') ? 'partial' : 'completed'; this.renderResult(); track('concierge_audit_complete',{status:this.auditStatus});
    } catch (error) { if (request.signal.aborted) return; this.auditStatus = 'failed'; host.append(text('p',error instanceof Error ? error.message : 'Analiza nije završena.','form-error')); const retry=text('button','Pokušaj ponovo','button');retry.onclick=()=>this.renderStep();host.append(retry); }
    finally { if (this.request === request) this.request = null; }
  }
  // Older or partial results (no severity) still render: found → good, attention → medium, unavailable → info.
  private normalized(): AuditResult | null {
    if (!this.result) return null;
    return { ...this.result, checks: this.result.checks.map(c => ({ ...c, severity: c.severity ?? (c.status === 'found' ? 'good' : c.status === 'attention' ? 'warning' : 'info'), weight: c.weight ?? (c.status === 'unavailable' ? 0 : 1), category: c.category ?? 'Tehnička osnova' })) };
  }
  private renderResult() {
    const result = this.normalized(); if (!result) return; const host = el('#audit-content'); host.replaceChildren();
    const s = auditSummary(result.checks), report = text('div', '', 'audit-report');
    // Scoreboard: 0–100 gauge in the band colour, counts per severity.
    const board = text('header', '', 'audit-score'); board.dataset.band = s.band;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 120 120'); svg.setAttribute('aria-hidden', 'true'); svg.classList.add('audit-gauge');
    for (const cls of ['track', 'value']) { const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('cx', '60'); c.setAttribute('cy', '60'); c.setAttribute('r', '52'); c.classList.add(cls); if (cls === 'value') c.setAttribute('stroke-dasharray', `${(s.score / 100 * 326.7).toFixed(1)} 326.7`); svg.append(c); }
    const dial = text('div', '', 'audit-dial'); dial.append(svg, text('strong', String(s.score)), text('span', '/ 100'));
    const copy = text('div', '', 'audit-score-copy');
    copy.append(text('p', 'REZULTAT PROVJERENIH SIGNALA', 'eyebrow'), text('h3', `${severityLabel[s.band]} — ${s.band === 'good' ? 'solidna osnova.' : s.band === 'warning' ? 'ima prostora za rast.' : 'ovo prvo treba popraviti.'}`));
    const counts = text('p', '', 'audit-counts'); for (const [k, n] of [['good', s.good], ['warning', s.warning], ['critical', s.critical]] as const) { const chip = text('span', `${n} ${severityLabel[k].toLowerCase()}`); chip.dataset.severity = k; counts.append(chip); }
    copy.append(counts, text('p', `${result.finalUrl} · ${new Date(result.checkedAt).toLocaleString('bs-BA')}`, 'result-meta'));
    board.append(dial, copy); board.setAttribute('aria-label', `Rezultat ${s.score} od 100: ${severityLabel[s.band]}`); report.append(board);
    const top = priorities(result.checks);
    if (top.length) { const box = text('section', '', 'audit-priorities'); box.append(text('h4', 'Šta prvo popraviti')); const list = document.createElement('ol'); for (const c of top) { const li = document.createElement('li'); li.dataset.severity = c.severity; li.append(text('strong', c.title), text('span', c.recommendation || c.evidence)); list.append(li); } box.append(list); report.append(box); }
    for (const cat of categories) {
      const list = result.checks.filter(c => c.category === cat); if (!list.length) continue;
      const group = text('section', '', 'audit-group'); const head = text('div', '', 'audit-group-head'); head.append(text('h4', cat));
      const bar = text('span', '', 'audit-bar'); bar.setAttribute('aria-hidden', 'true'); for (const c of list) { const seg = document.createElement('i'); seg.dataset.severity = c.severity; bar.append(seg); } head.append(bar); group.append(head);
      for (const check of list) group.append(this.checkRow(check)); report.append(group);
    }
    report.append(text('p', scoreMethod(s), 'audit-method')); const limits = text('ul', '', 'audit-limitations'); result.limitations.forEach(l => limits.append(text('li', l))); report.append(limits);
    host.append(report);
    const followup = document.createElement('form'); followup.className = 'audit-followup'; followup.append(text('h4', 'Pošaljite mi detaljan izvještaj'), text('p', 'Ostavite e-mail: poslat ćemo vam ovaj izvještaj s preporukama, a Digital X tim će predložiti sljedeći korak. Slanje potvrđujete u sljedećem koraku.'));
    const label = text('label', 'Vaš e-mail'), email = document.createElement('input'); email.type = 'email'; email.name = 'email'; email.autocomplete = 'email'; email.required = true; email.maxLength = 254; label.append(email); followup.append(label);
    const review = text('button', 'Pregledaj i pošalji izvještaj', 'button primary'); review.type = 'submit'; followup.append(review);
    followup.onsubmit = e => { e.preventDefault(); if (!followup.reportValidity()) return; el<HTMLDialogElement>('#audit-dialog').close(); this.prepareInquiry({ email: email.value, service: 'Detaljnija analiza web stranice', objective: `Želim detaljan izvještaj i preporuke za ${result.finalUrl} (rezultat ${s.score}/100).` }); };
    if (this.deliveryConfigured) host.append(followup);
    const download = text('button', 'Preuzmi besplatan izvještaj', 'button primary'); download.type = 'button'; download.onclick = () => { this.exportLead(); track('concierge_audit_download'); }; host.append(download);
    const actions = text('div', '', 'dialog-actions'); const next = text('button', 'Razgovarajmo o sljedećem koraku', 'button'); next.onclick = () => { el<HTMLDialogElement>('#audit-dialog').close(); this.openLead(); };
    const another = text('button', 'Provjeri drugu stranicu', 'button'); another.onclick = () => { this.result = null; this.step = 0; this.renderStep(); }; actions.append(next, another); host.append(actions);
  }
  private checkRow(check: AuditCheck) {
    const item = text('article', '', 'audit-check'); item.dataset.status = check.status; item.dataset.severity = check.severity;
    item.append(text('span', severityLabel[check.severity].toUpperCase(), 'check-status'), text('h4', check.title), text('p', check.evidence));
    if (check.recommendation) item.append(text('p', check.recommendation, 'recommendation')); item.append(text('small', `Provjereno: ${check.url}`)); return item;
  }
  prepareInquiry(values:{name?:string;email?:string;service?:string;objective?:string}){
    this.openLead();const form=el<HTMLFormElement>('#lead-form');
    if(values.name)(form.elements.namedItem('name') as HTMLInputElement).value=values.name.slice(0,120);
    if(values.email)(form.elements.namedItem('email') as HTMLInputElement).value=values.email.slice(0,254);
    const summary=form.elements.namedItem('summary') as HTMLTextAreaElement;
    summary.value=[values.service?`Zanimanje za: ${values.service}`:'',values.objective||'',this.result?summary.value:''].filter(Boolean).join('\n').slice(0,4000);
  }
  openLead() {
    const form=el<HTMLFormElement>('#lead-form'); const context=this.context();
    const summary=[context.goal ? `Cilj: ${goalLabels[context.goal]}` : ui('Želim razgovarati o Digital X projektu.','I would like to discuss a Digital X project.','Ich möchte ein Digital X Projekt besprechen.'),this.values.industry?`Djelatnost: ${this.values.industry}`:'',this.values.market?`Tržište: ${this.values.market}`:'',this.recommendation()?`Predložena usluga: ${this.recommendation()}`:'',...context.messages.filter(m=>m.role==='user').slice(-4).map(m=>`Podijeljeni detalji: ${m.content.slice(0,500)}`),this.result?`Analiza stranice: ${this.result.finalUrl} (${this.auditStatus}), rezultat ${auditSummary(this.normalized()!.checks).score}/100. Prioriteti: ${priorities(this.normalized()!.checks).map(c=>c.title).join('; ')}`:''].filter(Boolean).join('\n');
    (form.elements.namedItem('summary') as HTMLTextAreaElement).value=summary.slice(0,4000);
    if(this.values.url)(form.elements.namedItem('businessWebsite') as HTMLInputElement).value=this.values.url;
    (form.elements.namedItem('consent') as HTMLInputElement).checked=false;el('#lead-status').textContent='';el<HTMLDialogElement>('#lead-dialog').showModal();
  }
  private leadPayload() { const form=el<HTMLFormElement>('#lead-form');const data=new FormData(form);return {source:'AI Concierge',submissionId:this.submissionId,company:String(data.get('company')||''),businessWebsite:String(data.get('businessWebsite')||''),name:String(data.get('name')||''),email:String(data.get('email')||''),goal:this.context().goal,summary:String(data.get('summary')||''),recommendedService:this.recommendation().slice(0,160),auditStatus:this.auditStatus,...this.auditPayload(),consent:data.get('consent')==='on',website:String(data.get('website')||'')}; }
  private auditPayload(){const r=this.result;if(!r?.signature||!r.checks.every(c=>c.severity))return {};const {signature,...result}=r;return {audit:{result,signature}};}
  private async submitLead() {
    const form=el<HTMLFormElement>('#lead-form');if(!form.reportValidity())return;const button=form.querySelector<HTMLButtonElement>('[type=submit]')!;button.disabled=true;const status=el('#lead-status');status.textContent='Šaljemo vaš odobreni sažetak…';
    try { const payload=this.leadPayload();const fingerprint=JSON.stringify({...payload,submissionId:''});if(this.fingerprint&&this.fingerprint!==fingerprint)this.submissionId=crypto.randomUUID();this.fingerprint=fingerprint;payload.submissionId=this.submissionId;
      await post('/api/concierge/session',{mode:'text',context:this.context()});const response=await post('/api/lead',payload);const data=await response.json() as {message:string};status.textContent=data.message;track('concierge_lead_handoff',{status:'accepted'});
    } catch(error) { status.textContent=error instanceof Error?error.message:'Upit nije poslan. Preuzmite sažetak ili pokušajte ponovo.';this.offerMail(status); } finally {button.disabled=false;}
  }
  // Fallback that always works: the visitor's own e-mail app, addressed to Digital X, with summary and report highlights.
  private offerMail(status:HTMLElement){const p=this.leadPayload(),r=this.normalized(),body=[`${p.name} · ${p.email}${p.company?` · ${p.company}`:''}`,p.businessWebsite,'',p.summary,r?`\n${reportText(r)}`:''].filter(v=>v!==undefined).join('\n').slice(0,1800);
   const link=text('a','Pošaljite upit iz svoje e-mail aplikacije','button mail-fallback');link.setAttribute('href',`mailto:marketing@digital-x-marketing.com?subject=${encodeURIComponent(`Upit — ${p.company||p.name||'Digital X'}${r?` · X Signal ${auditSummary(r.checks).score}/100`:''}`)}&body=${encodeURIComponent(body)}`);status.append(document.createElement('br'),link);
  }
  private exportLead() { const p=this.leadPayload(),r=this.normalized();
    const esc=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
    const summary=`<section style="max-width:640px;margin:24px auto;font-family:Arial,sans-serif"><h2>Sažetak upita</h2><p>${esc(p.name)} · ${esc(p.email)}${p.company?` · ${esc(p.company)}`:''}</p><pre style="white-space:pre-wrap;font-family:inherit">${esc(p.summary)}</pre></section>`;
    const html=r?reportHtml(r).replace('</body>',`${summary}</body>`):`<!doctype html><html lang="bs"><meta charset="utf-8"><title>Digital X upit</title><body>${summary}</body></html>`;
    const url=URL.createObjectURL(new Blob([html],{type:'text/html'}));const link=document.createElement('a');link.href=url;link.download=r?'digital-x-izvjestaj.html':'digital-x-upit.html';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
}
