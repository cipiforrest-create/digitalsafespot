import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { publicError } from '../shared/public-error';
import { sessionSecret, geminiApiKey, vercelEnv, isVercel, conciergeApiRaw } from './core/config';
export type Request = IncomingMessage & { body?: unknown };
export type Response = ServerResponse;
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export function json(res: Response, status: number, body: unknown) { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(body)); }
export function fail(res: Response, error: unknown, requestId?: string) {
  const invalid=error instanceof Error&&['ZodError','SyntaxError','TypeError'].includes(error.name);
  const status = error instanceof HttpError ? error.status : invalid?400:502;
  const message = publicError(error instanceof HttpError ? error.message : invalid?'Please check the information and try again.':'The connection was interrupted. Please try again.');
  const body = requestId ? { message, requestId } : { message };
  if (res.headersSent) { send(res, 'error', body); res.end(); } else json(res, status, body);
}
export function guard(req: Request) {
  // Production keeps the concierge API off unless that project explicitly opts in (the main domain never does).
  if (vercelEnv() === 'production' && conciergeApiRaw() !== 'on') throw new HttpError(404, 'Not available.');
  if (req.method !== 'POST') throw new HttpError(405, 'Use POST.');
  const origin = req.headers.origin; const host = req.headers.host;
  if (!origin || !host) throw new HttpError(403, 'Please open this page directly and try again.');
  let parsed: URL; try { parsed = new URL(origin); } catch { throw new HttpError(403, 'Request not allowed.'); }
  if (parsed.host !== host || !['http:', 'https:'].includes(parsed.protocol)) throw new HttpError(403, 'Request not allowed.');
  if (isVercel() && parsed.protocol !== 'https:') throw new HttpError(403, 'A secure connection is required.');
  if (!String(req.headers['content-type'] || '').includes('application/json')) throw new HttpError(415, 'Send a JSON request.');
  if (JSON.stringify(req.body ?? {}).length > 64000) throw new HttpError(413, 'This request is too large.');
}
function secret(): string { const value = sessionSecret(); if (!value || value.length < 32) throw new HttpError(503, 'The concierge is not available yet. Please try again later.'); return value; }
export function sign(payload: unknown): string { const body = Buffer.from(JSON.stringify(payload)).toString('base64url'); return body + '.' + createHmac('sha256', secret()).update(body).digest('base64url'); }
export function verify<T>(token: string): T {
  const [body, mac, extra] = token.split('.');
  if (!body || !mac || extra) throw new HttpError(401, 'Your session has expired. Please reconnect.');
  const expected = createHmac('sha256', secret()).update(body).digest(); const actual = Buffer.from(mac, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new HttpError(401, 'Your session has expired. Please reconnect.');
  try { return JSON.parse(Buffer.from(body, 'base64url').toString()) as T; } catch { throw new HttpError(401, 'Please reconnect.'); }
}
export type Session = { sid: string; exp: number; audience: string; issuedAt?: number };
const IDLE_TTL_MS = 30 * 60_000;          // Sliding idle window, re-issued on every successful call.
const ABSOLUTE_TTL_MS = 2 * 3600_000;     // Hard cap measured from issuedAt.
export function getSession(req: Request): Session {
  const token = /(?:^|;\s*)dx_concierge=([^;]+)/.exec(req.headers.cookie || '')?.[1];
  if (!token) throw new HttpError(401, 'Please start a new conversation.');
  const data = verify<Session>(token);
  if (!data.sid || data.exp < Date.now() || data.audience !== req.headers.host) throw new HttpError(401, 'Your session has expired. Please reconnect.');
  // Absolute lifetime cap: once issuedAt + 2 h passes, the session cannot be renewed further.
  if (data.issuedAt && data.issuedAt + ABSOLUTE_TTL_MS < Date.now()) throw new HttpError(401, 'Your session has expired. Please reconnect.');
  return data;
}
function setSessionCookie(res: Response, session: Session) {
  const maxAge = Math.max(1, Math.round((session.exp - Date.now()) / 1000));
  res.setHeader('Set-Cookie', `dx_concierge=${sign(session)}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${maxAge}${isVercel() ? '; Secure' : ''}`);
}
export function createSession(req: Request, res: Response): Session {
  try { return getSession(req); } catch (error) { if (error instanceof HttpError && error.status === 503) throw error; }
  const now = Date.now();
  const session: Session = { sid: randomUUID(), issuedAt: now, exp: now + IDLE_TTL_MS, audience: String(req.headers.host) };
  setSessionCookie(res, session);
  return session;
}
/** Sliding renewal: re-issue the cookie with a fresh idle TTL, bounded by the absolute cap. Call on success. */
export function renewSession(session: Session, res: Response): void {
  if (res.headersSent) return;
  const now = Date.now();
  const issuedAt = session.issuedAt ?? now;
  const exp = Math.min(now + IDLE_TTL_MS, issuedAt + ABSOLUTE_TTL_MS);
  setSessionCookie(res, { ...session, issuedAt, exp });
}
/** Delete the session cookie (explicit end). */
export function clearSession(res: Response): void {
  res.setHeader('Set-Cookie', `dx_concierge=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0${isVercel() ? '; Secure' : ''}`);
}
export function stream(res: Response) { res.setHeader('Content-Type', 'text/event-stream; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Accel-Buffering', 'no'); res.flushHeaders(); }
export function send(res: Response, event: string, data: unknown) { if (!res.destroyed && !res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); }
export function apiKey(): string { const key = geminiApiKey(); if (!key) throw new HttpError(503, 'The AI connection is not available yet. Please try again later.'); return key; }
