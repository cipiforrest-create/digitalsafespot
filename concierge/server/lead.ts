import { createHash } from 'node:crypto';
import { leadInputSchema, type AuditResult } from '../shared/contracts';
import { reportHtml, reportText, auditSummary, enquiryHtml } from '../shared/audit-report';
import { verifyAudit } from './audit';
import { mailConfigured, sendMail, teamInbox } from './mail';
import { guard, getSession, json, fail, renewSession, HttpError, type Request, type Response, type Session } from './http';
import { n8nWebhookUrl, visitorCopyEnabled as configVisitorCopyEnabled, visitorCopyDailyMaximum as configVisitorCopyDailyMaximum } from './core/config';
import { startTrace } from './core/trace';
import { enforce } from './state/ratelimit';
import { getKv, StoreError } from './state/kv';
import { leadV1Only } from './core/config';
import { resolveLocale, type Locale } from '../shared/i18n';
import { leadV2RequestSchema, LEAD_RECEIPT_VERSION, type Receipt } from '../shared/lead-receipt';
import { loadBrief } from './state/brief-state';
import { reviewSummary } from './orchestrator/project-brief';
import { getAuditRecord } from './state/audit-record';
import { dispatchAll, acceptedChannels } from './lead-destination';
import { toReceiptCard, briefContentHash } from './orchestrator/lead-receipt';
import { loadDispatch, saveDispatch } from './state/lead-dispatch-state';
import type { LeadDispatch } from '../shared/lead-receipt';
// In-process de-duplication for concurrent identical v2 submissions: both callers await the SAME dispatch promise so
// destinations are hit at most once per submission (the durable KV record is the cross-instance backstop on replay).
const pendingV2 = new Map<string, Promise<LeadDispatch>>();
const accepted = new Map<string, { hash: string; expires: number; message: string }>();
const pending = new Map<string, { hash: string; promise: Promise<string> }>();
const esc = (v: string) => v.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const visitorCopyEnabled = () => configVisitorCopyEnabled();
const visitorCopyDailyMaximum = () => configVisitorCopyDailyMaximum();
// Durable visitor-copy quota (T06): 1 per recipient-hash per day and a global daily cap.
// Fails closed (denies the optional copy) if the store is unavailable, so the report cannot mail third parties at volume.
async function takeVisitorCopyQuota(email: string): Promise<boolean> {
  const day = Math.floor(Date.now() / 86_400_000);
  const secondsToDayEnd = Math.ceil(((day + 1) * 86_400_000 - Date.now()) / 1000) || 1;
  const recipient = createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
  try {
    const kv = getKv();
    const globalKey = `dx:vcopy:${day}:global`;
    if ((Number(await kv.get(globalKey)) || 0) >= visitorCopyDailyMaximum()) return false;
    if (!(await kv.setNX(`dx:vcopy:${day}:r:${recipient}`, '1', secondsToDayEnd * 1000))) return false;
    await kv.eval('rate_limit', [globalKey], [String(secondsToDayEnd * 1000)]);
    return true;
  } catch (error) { if (error instanceof StoreError) return false; throw error; }
}
function visitorReport(result: AuditResult): { html: string; text: string } {
  const score = auditSummary(result.checks).score;
  const titles = result.checks.map(check => check.title);
  const html = `<!doctype html><html lang="bs"><head><meta charset="utf-8"><title>Digital X · X Signal</title></head><body><h1>X Signal rezultat: ${score}/100</h1><h2>Provjere</h2><ul>${titles.map(title => `<li>${esc(title)}</li>`).join('')}</ul></body></html>`;
  return { html, text: [`X Signal rezultat: ${score}/100`, '', 'Provjere:', ...titles.map(title => `- ${title}`)].join('\n') };
}
// T22 lead v2. The enquiry content is the SERVER-SIDE session brief (T21), never the body, so the client cannot
// inject unverified values. Each configured destination returns a Receipt; the visitor result is derived ONLY from
// accepted receipts (NO RECEIPT = NO CLAIM). Retries are idempotent by session + submissionId. A stale brief (one
// that no longer matches the dispatch it was delivered under) is rejected with 409 so we never claim a mismatch.
async function handleLeadV2(req: Request, res: Response, session: Session, locale: Locale): Promise<void> {
  const input = leadV2RequestSchema.parse(req.body);
  // Honeypot: accept silently, dispatch nothing (mirrors legacy behaviour).
  if (input.website) { renewSession(session, res); json(res, 200, { status: 'received', delivered: false }); return; }

  const brief = await loadBrief(session.sid, null);
  if (brief.status !== 'ready_for_review') throw new HttpError(409, 'The summary is not ready to send yet. Please complete the brief.');
  const briefHash = briefContentHash(brief);

  // Idempotent replay: an identical submission returns the SAME receipts. A submission whose brief content changed
  // since the recorded dispatch is a stale conflict — never silently re-delivered under the old id.
  const prior = await loadDispatch(session.sid, input.submissionId);
  if (prior) {
    if (prior.briefHash !== briefHash) throw new HttpError(409, 'The summary changed. Please review and send it again.');
    const card = toReceiptCard(prior.receipts, locale);
    renewSession(session, res);
    json(res, 200, { status: card.delivered ? 'delivered' : 'not_delivered', delivered: card.delivered, channels: card.channels, message: card.message });
    return;
  }

  const id = `${session.sid}:${input.submissionId}`;
  let task = pendingV2.get(id);
  if (!task) {
    task = (async (): Promise<LeadDispatch> => {
      // Only a report this server signed and bound to this session is ever attached to the team notification.
      const report = input.auditId ? (await getAuditRecord(input.auditId, session.sid))?.result ?? null : null;
      const summaryText = reviewSummary(brief, locale);
      const receipts: Receipt[] = await dispatchAll({ brief, submissionId: input.submissionId, summaryText, report });
      const record: LeadDispatch = {
        v: 1, version: LEAD_RECEIPT_VERSION, sid: session.sid, submissionId: input.submissionId,
        briefHash, goal: brief.goal, receipts, delivered: acceptedChannels(receipts).length > 0, createdAt: Date.now(),
      };
      await saveDispatch(record);
      return record;
    })();
    pendingV2.set(id, task);
  }
  let record: LeadDispatch;
  try { record = await task; } finally { pendingV2.delete(id); }

  const card = toReceiptCard(record.receipts, locale);
  renewSession(session, res);
  json(res, 200, { status: record.delivered ? 'delivered' : 'not_delivered', delivered: record.delivered, channels: card.channels, message: card.message });
}

function isV2Body(body: unknown): boolean {
  return typeof body === 'object' && body !== null && (body as { v?: unknown }).v === 2;
}

export default async function handler(req: Request, res: Response) {
  const trace = startTrace('lead');
  try {
    guard(req); const session = getSession(req); await enforce(req, 'lead', session.sid);
    trace.setSession(session.sid);
    // T22: dispatch a v2 body through the receipt pipeline unless the v1-only rollback flag forces the legacy path.
    if (isV2Body(req.body) && !leadV1Only()) {
      const locale = resolveLocale(req.headers['accept-language'] as string | undefined) as Locale;
      await handleLeadV2(req, res, session, locale);
      trace.end('ok', { v: 2 });
      return;
    }
    const input = leadInputSchema.parse(req.body);
    if (input.website) { json(res, 200, { status: 'received' }); trace.end('ok', { delivered: false }); return; }
    if (input.businessWebsite && !/^https?:\/\//i.test(input.businessWebsite)) throw new HttpError(400, 'Please enter a valid business website.');
    const webhook = n8nWebhookUrl(), email = mailConfigured();
    if (!webhook && !email) throw new HttpError(503, 'Enquiry delivery is not connected yet. Download your summary and keep it for later.');
    if (webhook && new URL(webhook).protocol !== 'https:') throw new HttpError(503, 'Enquiry delivery needs attention. Please keep your summary.');
    // Only a report this server signed is ever e-mailed to the visitor; anything else stays a plain team enquiry.
    const report: AuditResult | null = input.audit && verifyAudit(input.audit.result, input.audit.signature, session.sid) ? input.audit.result : null;
    const id = `${session.sid}:${input.submissionId}`; const hash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    for (const [key, entry] of accepted) if (entry.expires < Date.now()) accepted.delete(key);
    const prior = accepted.get(id) || pending.get(id);
    if (prior && prior.hash !== hash) throw new HttpError(409, 'The enquiry changed. Please submit the revised summary again.');
    let message = accepted.get(id)?.message;
    if (!message) {
      let task = pending.get(id)?.promise;
      if (!task) {
        task = (async () => {
          const { audit: _audit, ...lead } = input;
          if (webhook) {
            const response = await fetch(webhook, { method: 'POST', signal: AbortSignal.timeout(10000), redirect: 'error', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': input.submissionId }, body: JSON.stringify({ ...lead, auditScore: report ? auditSummary(report.checks).score : null, primljeno: new Date().toISOString(), consentAt: new Date().toISOString() }) });
            if (!response.ok) throw new HttpError(502, 'Delivery was not confirmed. Keep your summary and retry shortly.');
            await response.body?.cancel();
          }
          let copy = false;
          if (email) {
            const who = esc(input.company || input.name), details = `<p><strong>${who}</strong> · ${esc(input.name)} · <a href="mailto:${esc(input.email)}">${esc(input.email)}</a>${input.businessWebsite ? ` · ${esc(input.businessWebsite)}` : ''}</p><pre style="white-space:pre-wrap;font-family:inherit">${esc(input.summary)}</pre>`;
            await sendMail({ key: `${input.submissionId}-team`, to: teamInbox(), replyTo: input.email, subject: `Novi upit — ${input.company || input.name}${report ? ` · X Signal ${auditSummary(report.checks).score}/100` : ''}`, html: report ? reportHtml(report, '', details) : enquiryHtml(details), text: `${input.name} <${input.email}>\n${input.summary}${report ? `\n\n${reportText(report)}` : ''}` });
            // Visitor copies have their own small budget, so the report can't be used to mail third parties at volume.
            copy = Boolean(report) && visitorCopyEnabled();
            if (copy) try { await enforce(req, 'report', session.sid); } catch { copy = false; }
            if (copy) copy = await takeVisitorCopyQuota(input.email);
            if (report && copy) {
              const visitor = visitorReport(report);
              await sendMail({ key: `${input.submissionId}-visitor`, to: input.email, replyTo: teamInbox(), subject: 'Vaš X Signal rezultat', html: visitor.html, text: visitor.text });
            }
          }
          const done = email && report && copy ? 'Upit je poslan Digital X timu, a detaljan izvještaj je na putu na vaš e-mail.' : email ? 'Upit je poslan Digital X timu. Javit ćemo vam se na navedeni e-mail.' : 'Servis za predaju je prihvatio upit. Spremanje u odredišni CRM još nije potvrđeno.';
          accepted.set(id, { hash, expires: Date.now() + 600000, message: done }); return done;
        })();
        pending.set(id, { hash, promise: task });
      }
      try { message = await task; } finally { pending.delete(id); }
    }
    renewSession(session, res);
    json(res, 200, { status: email ? 'email_sent' : 'webhook_accepted', report: Boolean(report), message });
    trace.end('ok', { delivered: true });
  } catch (error) { fail(res, error instanceof TypeError || (error instanceof Error && error.name === 'TimeoutError') ? new HttpError(502, 'Delivery was not confirmed. Keep your summary and retry shortly.') : error, trace.requestId); trace.end('error', { code: error instanceof Error ? error.name : 'unknown' }); }
}
