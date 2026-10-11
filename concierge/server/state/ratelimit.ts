import { createHmac } from 'node:crypto';
import ipaddr from 'ipaddr.js';
import { getKv, StoreError } from './kv';
import { sessionSecret } from '../core/config';
import { HttpError } from '../http';
import type { Request } from '../http';
// Durable fixed-window limits (atomic INCR+PEXPIRE via KV EVAL), replacing the per-instance Map limiter.
export type LimitSpec = { max: number; windowSec: number };
/** Atomic fixed-window counter. Returns true when the request is within the limit. */
export async function hit(bucket: string, key: string, spec: LimitSpec): Promise<boolean> {
  const count = Number(await getKv().eval('rate_limit', [`dx:rl:${bucket}:${key}`], [String(spec.windowSec * 1000)]));
  return count <= spec.max;
}
/** HMAC an IP address (IPv6 grouped to /64) under a daily-rotating salt so raw IPs are never stored. */
export function ipKey(req: Request): string {
  const raw = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local').split(',')[0].trim();
  let grouped = raw;
  try {
    if (ipaddr.isValid(raw)) {
      const parsed = ipaddr.parse(raw);
      if (parsed.kind() === 'ipv6') grouped = (parsed as ipaddr.IPv6).toNormalizedString().split(':').slice(0, 4).join(':') + '::/64';
    }
  } catch { /* Fall back to the raw token when parsing fails. */ }
  const day = Math.floor(Date.now() / 86_400_000);
  const salt = (sessionSecret() || 'dx-dev-salt') + ':' + day;
  return createHmac('sha256', salt).update(grouped).digest('base64url').slice(0, 20);
}
// Per-action bucket configuration (§14 defaults).
export type Action = 'session' | 'chat' | 'brief' | 'audit' | 'lead' | 'report' | 'voice';
const CONFIG: Record<Action, { session?: LimitSpec; ip?: LimitSpec; failClosed: boolean }> = {
  session: { ip: { max: 20, windowSec: 600 }, failClosed: false },
  chat: { session: { max: 30, windowSec: 600 }, ip: { max: 150, windowSec: 86_400 }, failClosed: true },
  // T21: the brief is deterministic (no model / no upstream), so it fails open when the store is unreachable.
  brief: { session: { max: 60, windowSec: 600 }, ip: { max: 300, windowSec: 86_400 }, failClosed: false },
  audit: { session: { max: 5, windowSec: 600 }, ip: { max: 20, windowSec: 86_400 }, failClosed: true },
  lead: { session: { max: 5, windowSec: 3_600 }, ip: { max: 10, windowSec: 86_400 }, failClosed: false },
  report: { session: { max: 3, windowSec: 86_400 }, failClosed: false },
  voice: { session: { max: 8, windowSec: 600 }, failClosed: true },
};
const RATE_LIMITED = () => new HttpError(429, 'You’ve reached the limit for now. Please try again in a few minutes.');
/**
 * Enforce the per-session and per-IP limits for an action.
 * Fail-closed actions (model, audit) reject when the store is unreachable; fail-open actions (lead) proceed.
 */
export async function enforce(req: Request, action: Action, sid = ''): Promise<void> {
  const config = CONFIG[action];
  try {
    if (config.ip && !(await hit(`${action}:ip`, ipKey(req), config.ip))) throw RATE_LIMITED();
    if (config.session && sid && !(await hit(`${action}:sid`, sid, config.session))) throw RATE_LIMITED();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error instanceof StoreError) { if (config.failClosed) throw new HttpError(503, 'The concierge is not available yet. Please try again later.'); return; }
    throw error;
  }
}
/** Per-target-host audit limit (10 / 10 min). Fail-closed with audits. */
export async function enforceAuditHost(host: string): Promise<void> {
  try { if (!(await hit('audit:host', host.toLowerCase(), { max: 10, windowSec: 600 }))) throw RATE_LIMITED(); }
  catch (error) { if (error instanceof HttpError) throw error; if (error instanceof StoreError) throw new HttpError(503, 'The concierge is not available yet. Please try again later.'); throw error; }
}