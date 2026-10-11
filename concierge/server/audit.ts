import { createHash } from 'node:crypto';
import { auditRequestSchema, type AuditCheck, type AuditResult } from '../shared/contracts';
import type { AuditFacts } from '../shared/audit-facts';
import type { AuditRecord } from '../shared/audit-record';
import { extractFacts, gradeChecks, robotsAllows } from './analyze';
import { safeFetch, normalizeTarget, createAuditBudget, sameSiteHost, type FetchBudget } from './safe-fetch';
import { guard, getSession, stream, send, fail, sign, verify, renewSession, HttpError, type Request, type Response } from './http';
import { startTrace } from './core/trace';
import { enforce, enforceAuditHost } from './state/ratelimit';
import { available, charge } from './state/budget';
import { urlKey, isNegativelyCached, cacheNegative, assertAuditUnlocked, recordBlockedUrl } from './state/audit-guard';
import { buildAuditRecord, saveAuditRecord, getAuditRecord, findReusableAudit } from './state/audit-record';
import { interpretAudit } from './orchestrator/audit-interpret';
import { getProvider } from './ai';
import { mode } from './state/budget';
import { resolveLocale } from '../shared/i18n';
// Results are signed so a later e-mail can include exactly what this server measured, never a forged report.
// Key-sorted form: the lead endpoint re-parses the result (schema key order), so the digest must not depend on order.
const canonical = (v: unknown): unknown => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k, x]) => k !== 'signature' && x !== undefined).sort(([a], [b]) => a < b ? -1 : 1).map(([k, x]) => [k, canonical(x)])) : v;
export const auditDigest = (result: AuditResult) => createHash('sha256').update(JSON.stringify(canonical(result))).digest('base64url');
export function signAudit(result: AuditResult, sid: string) { return sign({ kind: 'audit', sid, digest: auditDigest(result), exp: Date.now() + 2 * 3600_000 }); }
export function verifyAudit(result: AuditResult, signature: string, sid: string) { try { const v = verify<{ kind: string; sid: string; digest: string; exp: number }>(signature); return v.kind === 'audit' && v.sid === sid && v.exp > Date.now() && v.digest === auditDigest(result); } catch { return false; } }
export type AuditRun = { result: AuditResult; facts: AuditFacts; partial: boolean };
export async function runAudit(url: string, signal: AbortSignal, progress: (message: string) => void): Promise<AuditRun> {
  const target = normalizeTarget(url); const checks: AuditCheck[] = [];
  const budget: FetchBudget = createAuditBudget();
  progress('Otvaramo javnu web stranicu');
  const started = performance.now(); const page = await safeFetch(target.href, signal, 1_500_000, budget); const elapsed = Math.round(performance.now() - started);
  const facts = extractFacts(page.text, page.url, page.status);
  checks.push(...gradeChecks(facts));
  checks.push({ id: 'speed', title: 'Odgovor servera', category: 'Tehnička osnova', weight: 6, severity: elapsed < 900 ? 'good' : elapsed < 2200 ? 'warning' : 'critical', status: elapsed < 900 ? 'found' : 'attention', evidence: `Stranica je stigla za ${elapsed} ms (jedno mjerenje s našeg servera, uključuje DNS i TLS). Nije Core Web Vitals mjerenje.`, recommendation: elapsed < 900 ? '' : 'Spor odgovor gubi posjetioce: provjerite hosting, keširanje i veličinu stranice.', url: page.url });
  const origin = new URL(page.url).origin;
  // Side fetches go to the final origin only when its host matches the entered host (a leading www toggle is allowed);
  // otherwise the audit stays scoped to what the visitor typed and records a limitation instead of fetching cross-host.
  const sideAllowed = sameSiteHost(target.hostname, new URL(page.url).hostname);
  const limitations = ['Analiza pregleda vraćeni HTML, ne prikaz stranice u pregledniku.', 'Ne mjeri AI pozicije, posjete, konverzije ili Core Web Vitals.', 'AI vidljivost zahtijeva zasebnu metodologiju i povezane izvore.'];
  if (page.truncated) limitations.push('Stranica je velika: analizirali smo prvih 1.5 MB HTML-a.');
  progress('Provjeravamo upute za pretraživače i sitemap');
  if (sideAllowed) await Promise.all([
    (async () => {
      const robotsUrl = `${origin}/robots.txt`;
      const base = { id: 'robots', title: 'Upute za pretraživače', category: 'Vidljivost u pretrazi i AI' as const, url: robotsUrl };
      try {
        const robots = await safeFetch(robotsUrl, signal, 256000, budget);
        const exists = robots.status >= 200 && robots.status < 300 && !/<html/i.test(robots.text);
        const allowed = exists ? robotsAllows(robots.text, new URL(page.url).pathname) : true;
        checks.push(exists ? (allowed ? { ...base, weight: 5, severity: 'good', status: 'found', evidence: 'robots.txt postoji i ne blokira ovu putanju.', recommendation: '' } : { ...base, weight: 5, severity: 'critical', status: 'attention', evidence: 'robots.txt blokira ovu putanju za pretraživače.', recommendation: 'Provjerite da li je ovo ograničenje namjerno; blokirana stranica se ne pojavljuje u pretrazi.' })
          : { ...base, weight: 0, severity: 'info', status: 'unavailable', evidence: `robots.txt nije potvrđen (HTTP ${robots.status}). Nedostatak robots.txt datoteke sam po sebi ne blokira pretraživače.`, recommendation: '' });
      } catch { checks.push({ ...base, weight: 0, severity: 'info', status: 'unavailable', evidence: 'robots.txt nije sigurno dohvaćen. Pristup pretraživača nije potvrđen.', recommendation: '' }); }
    })(),
    (async () => {
      let found = false;
      for (const path of ['/sitemap.xml', '/sitemap_index.xml']) {
        if (signal.aborted) break;
        try { const sitemap = await safeFetch(origin + path, signal, 500000, budget); if (sitemap.status === 200 && /<(urlset|sitemapindex)[\s>]/i.test(sitemap.text)) { checks.push({ id: 'sitemap', title: 'Sitemap', category: 'Vidljivost u pretrazi i AI', weight: 4, severity: 'good', status: 'found', evidence: 'XML sitemap je pronađen. Navedeni URL-ovi nisu pojedinačno provjereni.', recommendation: '', url: sitemap.url }); found = true; break; } } catch { /* Try the second conventional location within the shared deadline. */ }
      }
      if (!found) checks.push({ id: 'sitemap', title: 'Sitemap', category: 'Vidljivost u pretrazi i AI', weight: 4, severity: 'warning', status: 'unavailable', evidence: 'Sitemap nije potvrđen na dvije uobičajene lokacije. Može postojati na drugoj putanji.', recommendation: 'Objavite XML sitemap i prijavite ga u Google Search Console da nove stranice brže budu pronađene.', url: origin });
    })(),
  ]); else limitations.push('Preusmjereno na drugi domen, pa robots.txt i sitemap nisu provjereni na izvornom domenu.');
  progress('Računamo rezultat i prioritete');
  const result: AuditResult = { url: target.href, finalUrl: page.url, checkedAt: new Date().toISOString(), checks, limitations };
  return { result, facts, partial: page.truncated };
}
export default async function handler(req: Request, res: Response) {
  const trace = startTrace('audit');
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 28000); res.on('close', () => controller.abort());
  try {
    guard(req); const session = getSession(req); trace.setSession(session.sid); await enforce(req, 'audit', session.sid);
    await assertAuditUnlocked(session.sid);
    const input = auditRequestSchema.parse(req.body);
    // Lookup path: return a previously persisted, owner-bound record by id without refetching (cross-session → 404).
    if (input.auditId && !input.url) {
      const record = await getAuditRecord(input.auditId, session.sid);
      if (!record) throw new HttpError(404, 'That analysis is no longer available. Please run a new one.');
      renewSession(session, res); stream(res);
      // audit_ready interpretation path: interpret the owner-bound facts (never the raw page) with a
      // deterministic fallback. Additive: legacy clients that omit `interpret` still get the facts+result events.
      if (input.interpret) {
        const effectiveMode = await mode();
        const locale = resolveLocale(req.headers['accept-language'] as string | undefined);
        const interpretation = await interpretAudit({ record, provider: getProvider(), signal: controller.signal, locale, degraded: effectiveMode !== 'on' });
        send(res, 'interpretation', interpretation);
        res.end(); trace.end('ok', { checks: record.result.checks.length }); return;
      }
      emitAudit(res, session.sid, record);
      res.end(); trace.end('ok', { checks: record.result.checks.length }); return;
    }
    let target;
    try { target = normalizeTarget(input.url!); } catch (parseError) { await recordBlockedUrl(session.sid); throw parseError; }
    await enforceAuditHost(target.hostname);
    const key = urlKey(target.href);
    // Reuse path: an identical URL already audited in this session skips the fetch and the budget charge.
    const reusable = await findReusableAudit(session.sid, key);
    if (reusable) {
      renewSession(session, res); stream(res);
      emitAudit(res, session.sid, reusable);
      res.end(); trace.end('ok', { checks: reusable.result.checks.length }); return;
    }
    if (await isNegativelyCached(key)) throw new HttpError(502, 'That website could not be reached recently. Please try again in a few minutes.');
    // Audits pause while the audit budget is exhausted (degraded mode); this fails closed for cost control.
    if (!(await available('audits')) || !(await charge('audits'))) throw new HttpError(503, 'Audits are paused right now. Please try again later.');
    renewSession(session, res); stream(res);
    let run;
    try { run = await runAudit(input.url!, controller.signal, message => send(res, 'progress', { message })); }
    catch (fetchError) { await cacheNegative(key); throw fetchError; }
    const record = buildAuditRecord(session.sid, key, run.result, run.facts, run.partial ? 'partial' : 'completed');
    await saveAuditRecord(record);
    emitAudit(res, session.sid, record); res.end(); trace.end('ok', { checks: run.result.checks.length });
  }
  catch (error) { fail(res, error, trace.requestId); trace.end('error', { code: error instanceof Error ? error.name : 'unknown' }); } finally { clearTimeout(timer); }
}
// Emit both the v2 `facts` event (auditId + deterministic facts for T18) and the unchanged signed `result`
// event the current client already consumes. Order is facts-then-result so a v2 reader sees the id first.
function emitAudit(res: Response, sid: string, record: AuditRecord) {
  send(res, 'facts', { auditId: record.auditId, status: record.status, facts: record.facts });
  send(res, 'result', { ...record.result, signature: signAudit(record.result, sid) });
}
