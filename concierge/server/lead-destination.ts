import { sendMail, mailConfigured, teamInbox } from './mail';
import { n8nWebhookUrl } from './core/config';
import { enquiryHtml, reportHtml, reportText, auditSummary } from '../shared/audit-report';
import type { AuditResult } from '../shared/contracts';
import type { Receipt, DestinationKind } from '../shared/lead-receipt';
import type { ProjectBrief } from '../shared/project-brief';

// T22 LeadDestination. Each destination is an independent, fail-open channel that turns a submitted brief into a
// Receipt. A destination returns an `accepted` receipt ONLY when it actually confirmed intake (a Resend/webhook
// 2xx). Any error, timeout or misconfiguration returns a `failed` receipt — never an optimistic success. The
// caller aggregates receipts; NO RECEIPT (no accepted channel) = NO CLAIM. Destinations never throw to the caller.

const esc = (v: string) => v.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export type DispatchContext = {
  brief: ProjectBrief;
  submissionId: string;
  summaryText: string;             // deterministic review summary (server-built, T21)
  report: AuditResult | null;      // only a server-signed audit result, verified by the caller
};

/** The name/email/website captured in the brief, for the team notification. Missing values are omitted, never faked. */
function contactLines(ctx: DispatchContext): { name: string; email: string; company: string; website: string } {
  const get = (key: string) => ctx.brief.fields.find(f => f.key === key && f.status === 'known')?.value ?? '';
  return { name: get('contactName'), email: get('contactEmail'), company: get('company'), website: get('website') };
}

/** Email destination (Resend). Returns an accepted receipt only on a confirmed send. */
export async function deliverEmail(ctx: DispatchContext): Promise<Receipt | null> {
  if (!mailConfigured()) return null; // channel not configured → not attempted, no receipt
  const at = Date.now();
  try {
    const c = contactLines(ctx);
    const details = `<p><strong>${esc(c.company || c.name || 'Upit')}</strong>${c.name ? ` · ${esc(c.name)}` : ''}${c.email ? ` · <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ''}${c.website ? ` · ${esc(c.website)}` : ''}</p><pre style="white-space:pre-wrap;font-family:inherit">${esc(ctx.summaryText)}</pre>`;
    const subject = `Novi upit — ${c.company || c.name || 'AI Concierge'}${ctx.report ? ` · X Signal ${auditSummary(ctx.report.checks).score}/100` : ''}`;
    await sendMail({
      key: `${ctx.submissionId}-team`, to: teamInbox(), replyTo: c.email || undefined, subject,
      html: ctx.report ? reportHtml(ctx.report, '', details) : enquiryHtml(details),
      text: `${c.name || 'Upit'}${c.email ? ` <${c.email}>` : ''}\n${ctx.summaryText}${ctx.report ? `\n\n${reportText(ctx.report)}` : ''}`,
    });
    return { kind: 'email', status: 'accepted', reference: `${ctx.submissionId}-team`, at };
  } catch { return { kind: 'email', status: 'failed', reference: null, at }; }
}

/** Webhook destination (n8n / CRM). Returns an accepted receipt only on a 2xx over HTTPS. */
export async function deliverWebhook(ctx: DispatchContext): Promise<Receipt | null> {
  const webhook = n8nWebhookUrl();
  if (!webhook) return null; // channel not configured → not attempted, no receipt
  const at = Date.now();
  try {
    if (new URL(webhook).protocol !== 'https:') return { kind: 'webhook', status: 'failed', reference: null, at };
    const c = contactLines(ctx);
    const response = await fetch(webhook, {
      method: 'POST', signal: AbortSignal.timeout(10000), redirect: 'error',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': ctx.submissionId },
      body: JSON.stringify({
        source: 'AI Concierge', submissionId: ctx.submissionId,
        company: c.company, name: c.name, email: c.email, businessWebsite: c.website,
        goal: ctx.brief.goal, summary: ctx.summaryText,
        auditScore: ctx.report ? auditSummary(ctx.report.checks).score : null,
        primljeno: new Date(at).toISOString(), consentAt: new Date(at).toISOString(),
      }),
    });
    const ok = response.ok;
    await response.body?.cancel();
    return ok ? { kind: 'webhook', status: 'accepted', reference: ctx.submissionId, at } : { kind: 'webhook', status: 'failed', reference: null, at };
  } catch { return { kind: 'webhook', status: 'failed', reference: null, at }; }
}

/** True when at least one destination is configured, so the caller can decline early with a clear message. */
export function anyDestinationConfigured(): boolean {
  return mailConfigured() || Boolean(n8nWebhookUrl());
}

/** Dispatch to every configured destination and collect their receipts (nulls = not-configured channels). */
export async function dispatchAll(ctx: DispatchContext): Promise<Receipt[]> {
  const results = await Promise.all([deliverEmail(ctx), deliverWebhook(ctx)]);
  return results.filter((r): r is Receipt => r !== null);
}

/** The channels that actually accepted the enquiry. Empty array ⇒ NO CLAIM. */
export function acceptedChannels(receipts: Receipt[]): DestinationKind[] {
  return receipts.filter(r => r.status === 'accepted').map(r => r.kind);
}
