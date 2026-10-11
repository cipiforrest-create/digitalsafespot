import { z } from 'zod';
import { goalSchema } from '../shared/contracts';
import { guard, getSession, json, fail, renewSession, type Request, type Response } from './http';
import { startTrace } from './core/trace';
import { enforce } from './state/ratelimit';
import { withLock } from './state/lock';
import { resolveLocale, type Locale } from '../shared/i18n';
import { loadBrief, saveBrief, deleteBrief } from './state/brief-state';
import { applyMessage, applyAuditUrl, advance } from './orchestrator/project-brief';
import { getAuditRecord } from './state/audit-record';

// T21 ProjectBrief endpoint. Deterministic, no model: apply the visitor's message (and optionally an owner-bound
// audit URL) to the session's brief, persist it, and return a bounded card with at most one next question. A
// `reset` action clears the brief. The brief is keyed by the session cookie only and never read across sessions.
const briefRequestSchema = z.object({
  action: z.enum(['update', 'reset']).default('update'),
  message: z.string().max(4000).optional(),
  goal: goalSchema.nullable().optional(),
  auditId: z.string().uuid().optional(),
}).strict();

export default async function handler(req: Request, res: Response) {
  const trace = startTrace('brief');
  try {
    guard(req);
    const session = getSession(req); trace.setSession(session.sid);
    await enforce(req, 'brief', session.sid);
    const input = briefRequestSchema.parse(req.body);
    const locale = resolveLocale(req.headers['accept-language'] as string | undefined) as Locale;

    await withLock(session.sid, async () => {
      if (input.action === 'reset') {
        await deleteBrief(session.sid);
        renewSession(session, res);
        json(res, 200, { status: 'reset' });
        return;
      }
      const brief = await loadBrief(session.sid, input.goal ?? null);
      if (input.goal !== undefined) brief.goal = input.goal;

      // Fold in an owner-bound audit URL (provenance 'audit'); a record for another session is treated as absent.
      if (input.auditId) {
        const record = await getAuditRecord(input.auditId, session.sid);
        if (record) applyAuditUrl(brief, record.result.url);
      }
      if (typeof input.message === 'string' && input.message.trim()) applyMessage(brief, input.message);

      const { brief: next, card } = advance(brief, locale);
      await saveBrief(next);
      renewSession(session, res);
      json(res, 200, { card });
    });
    trace.end('ok', { action: input.action });
  } catch (error) {
    fail(res, error, trace.requestId);
    trace.end('error', { code: error instanceof Error ? error.name : 'unknown' });
  }
}
