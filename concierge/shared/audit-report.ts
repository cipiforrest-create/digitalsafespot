import type {AuditCheck,AuditResult,Severity} from './contracts';
// One transparent score for the dialog, the downloadable report and the e-mail. It is computed only from the
// automated checks shown with it (public HTML, robots.txt, sitemap, one server response): no rankings, traffic or
// conversions are measured, and informational checks never count.
export const severityValue:Record<Exclude<Severity,'info'>,number>={good:1,warning:.5,critical:0};
export const severityLabel:Record<Severity,string>={good:'Dobro',warning:'Srednje',critical:'Kritično',info:'Informacija'};
export const categories=['Put do upita','Vidljivost u pretrazi i AI','Sadržaj i poruka','Tehnička osnova'] as const;
export type AuditSummary={score:number;band:Exclude<Severity,'info'>;good:number;warning:number;critical:number;scored:number};
export function auditSummary(checks:readonly AuditCheck[]):AuditSummary{
 const scored=checks.filter(c=>c.severity!=='info'&&c.weight>0),weight=scored.reduce((n,c)=>n+c.weight,0);
 const got=scored.reduce((n,c)=>n+c.weight*severityValue[c.severity as Exclude<Severity,'info'>],0),score=weight?Math.round(got/weight*100):0;
 const count=(s:Severity)=>scored.filter(c=>c.severity===s).length;
 return {score,band:score>=80?'good':score>=50?'warning':'critical',good:count('good'),warning:count('warning'),critical:count('critical'),scored:scored.length};
}
// Most valuable fixes first: critical before medium, heavier checks first.
export function priorities(checks:readonly AuditCheck[],limit=5){return checks.filter(c=>c.severity==='critical'||c.severity==='warning').sort((a,b)=>(a.severity===b.severity?0:a.severity==='critical'?-1:1)||b.weight-a.weight).slice(0,limit);}
export const scoreMethod=(s:AuditSummary)=>`Rezultat ${s.score}/100 računa se samo iz ${s.scored} automatskih provjera prikazanih u izvještaju (javni HTML, robots.txt, sitemap i jedno mjerenje odgovora servera). Ne mjeri pozicije, promet ni konverzije.`;
const esc=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const tone={good:'#15803d',warning:'#b45309',critical:'#b91c1c',info:'#475569'} as const;
// E-mail-safe report (tables, inline styles, light background) also used for the downloadable copy.
// extraHtml must already be escaped (the team e-mail puts the enquiry details there).
export function reportHtml(result:AuditResult,intro='',extraHtml=''):string{
 const s=auditSummary(result.checks),top=priorities(result.checks);
 const row=(c:AuditCheck)=>`<tr><td style="padding:12px 0;border-top:1px solid #e5e7eb;vertical-align:top;width:92px"><span style="display:inline-block;padding:3px 8px;border-radius:999px;background:${tone[c.severity]};color:#fff;font-size:11px;font-weight:600">${severityLabel[c.severity]}</span></td><td style="padding:12px 0 12px 10px;border-top:1px solid #e5e7eb;vertical-align:top"><strong style="font-size:14px;color:#0f172a">${esc(c.title)}</strong><div style="font-size:13px;color:#334155;margin-top:4px">${esc(c.evidence)}</div>${c.recommendation?`<div style="font-size:13px;color:#0f172a;margin-top:6px"><strong>Preporuka:</strong> ${esc(c.recommendation)}</div>`:''}</td></tr>`;
 const sections=categories.map(cat=>{const list=result.checks.filter(c=>c.category===cat);return list.length?`<h3 style="font-size:15px;margin:26px 0 4px;color:#0f172a">${cat}</h3><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${list.map(row).join('')}</table>`:'';}).join('');
 return `<!doctype html><html lang="bs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>X Signal — ${esc(result.finalUrl)}</title></head><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#fff;border-radius:12px;padding:28px"><tr><td>
<p style="margin:0;font-size:11px;letter-spacing:2px;color:#475569">DIGITAL X · X SIGNAL</p><h1 style="font-size:22px;margin:8px 0 4px">Izvještaj o web stranici</h1><p style="margin:0;font-size:13px;color:#475569">${esc(result.finalUrl)} · ${esc(new Date(result.checkedAt).toLocaleString('bs-BA'))}</p>${intro?`<p style="font-size:14px;margin:16px 0 0">${esc(intro)}</p>`:''}${extraHtml}
<table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0"><tr><td style="width:110px;height:110px;border:8px solid ${tone[s.band]};border-radius:50%;text-align:center;font-size:30px;font-weight:700;color:${tone[s.band]}">${s.score}<div style="font-size:11px;font-weight:400;color:#475569">/ 100</div></td><td style="padding-left:18px;font-size:14px"><strong style="color:${tone[s.band]}">${severityLabel[s.band]}</strong><div style="margin-top:6px;color:#334155">${s.good} dobro · ${s.warning} srednje · ${s.critical} kritično</div></td></tr></table>
${top.length?`<h2 style="font-size:16px;margin:8px 0">Šta prvo popraviti</h2><ol style="padding-left:20px;margin:0;font-size:14px;color:#0f172a">${top.map(c=>`<li style="margin:6px 0"><strong>${esc(c.title)}</strong> — ${esc(c.recommendation||c.evidence)}</li>`).join('')}</ol>`:''}
${sections}<p style="font-size:12px;color:#64748b;margin-top:24px">${esc(scoreMethod(s))}</p><ul style="font-size:12px;color:#64748b;padding-left:18px">${result.limitations.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>
<p style="font-size:13px;margin-top:20px">Digital X · <a href="mailto:marketing@digital-x-marketing.com">marketing@digital-x-marketing.com</a> · +387 64 438 3566</p></td></tr></table></td></tr></table></body></html>`;
}
export function reportText(result:AuditResult):string{
 const s=auditSummary(result.checks);
 return [`X Signal — ${result.finalUrl}`,`Rezultat: ${s.score}/100 (${severityLabel[s.band]}) · ${s.good} dobro · ${s.warning} srednje · ${s.critical} kritično`,'',...priorities(result.checks,8).map(c=>`[${severityLabel[c.severity]}] ${c.title}: ${c.recommendation||c.evidence}`),'',scoreMethod(s)].join('\n');
}
export function enquiryHtml(detailsHtml:string){return `<!doctype html><html lang="bs"><head><meta charset="utf-8"><title>Digital X upit</title></head><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a"><div style="max-width:640px;margin:24px auto;background:#fff;border-radius:12px;padding:28px"><p style="margin:0;font-size:11px;letter-spacing:2px;color:#475569">DIGITAL X · NOVI UPIT</p>${detailsHtml}</div></body></html>`;}
