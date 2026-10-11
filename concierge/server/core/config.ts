import { z } from 'zod';
// Central, validated access to configuration. Server and shared code must never read process.env directly;
// the only exceptions are the build/dev entry scripts (concierge/build.mjs, concierge/dev.mjs).
const on = (value: string | undefined) => value === 'on' || value === 'true' || value === '1';
export const envSchema = z.object({
  CONCIERGE_SESSION_SECRET: z.string().min(32).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  DX_GEMINI_MODEL: z.string().optional(),
  DX_MODEL_FAST: z.string().optional(),
  DX_MODEL_REASONING: z.string().optional(),
  DX_REASONING_THINKING: z.string().optional(),
  DX_CONCIERGE_LIVE_MODEL: z.string().optional(),
  DX_CONCIERGE_MODE: z.string().optional(),
  DX_EXECUTION: z.string().optional(),
  DX_CONCIERGE_VOICE: z.string().optional(),
  DX_CONCIERGE_API: z.string().optional(),
  DX_STORE: z.string().optional(),
  DX_RETRIEVAL_MIN: z.string().optional(),
  DX_LEAD_V1: z.string().optional(),
  DX_VISITOR_COPY: z.string().optional(),
  DX_BUDGET_VISITOR_EMAIL_DAILY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  LEAD_NOTIFY_EMAIL: z.string().optional(),
  LEAD_FROM_EMAIL: z.string().optional(),
  N8N_WEBHOOK_URL: z.string().optional(),
  KV_REST_API_URL: z.string().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  VERCEL: z.string().optional(),
  VERCEL_ENV: z.string().optional(),
  PORT: z.string().optional(),
});
export type Env = z.infer<typeof envSchema>;
// Resolve a validated, alias-aware snapshot. Used by tests and diagnostics; the hot path uses the live getters below.
export function parseConfig(source: Record<string, string | undefined> = process.env) {
  const env = envSchema.parse(source);
  return {
    sessionSecret: env.CONCIERGE_SESSION_SECRET,
    geminiApiKey: env.GEMINI_API_KEY,
    fastModel: env.DX_GEMINI_MODEL || env.DX_MODEL_FAST || 'gemini-2.5-flash',
    reasoningModel: env.DX_MODEL_REASONING || 'gemini-2.5-flash',
    liveModel: env.DX_CONCIERGE_LIVE_MODEL || 'gemini-3.1-flash-live-preview',
    kvUrl: env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL,
    kvToken: env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN,
    store: env.DX_STORE || 'memory',
    visitorCopy: on(env.DX_VISITOR_COPY),
    conciergeApi: env.DX_CONCIERGE_API,
    vercelEnv: env.VERCEL_ENV,
    isVercel: Boolean(env.VERCEL),
  } as const;
}
// Live getters (read process.env at call time so runtime changes and per-request env are honoured).
export const sessionSecret = () => process.env.CONCIERGE_SESSION_SECRET;
export const geminiApiKey = () => process.env.GEMINI_API_KEY;
export const geminiModel = () => process.env.DX_GEMINI_MODEL || process.env.DX_MODEL_FAST || 'gemini-2.5-flash';
export const liveModel = () => process.env.DX_CONCIERGE_LIVE_MODEL || 'gemini-3.1-flash-live-preview';
export const vercelEnv = () => process.env.VERCEL_ENV;
export const isVercel = () => Boolean(process.env.VERCEL);
export const conciergeApiRaw = () => process.env.DX_CONCIERGE_API;
// Voice is off in P0 (T09): no Live token can be minted unless the project explicitly opts in.
export const voiceEnabled = () => process.env.DX_CONCIERGE_VOICE === 'on';
export const n8nWebhookUrl = () => process.env.N8N_WEBHOOK_URL;
// T22: when set, force the legacy lead path even for a v2 body (rollback switch). Off by default so v2 is used.
export const leadV1Only = () => process.env.DX_LEAD_V1 === 'on';
export const resendApiKey = () => process.env.RESEND_API_KEY;
export const teamInbox = () => process.env.LEAD_NOTIFY_EMAIL || 'digital.x.agency.ba@gmail.com';
export const fromEmail = () => process.env.LEAD_FROM_EMAIL || 'Digital X <analiza@digital-x-marketing.com>';
export const visitorCopyEnabled = () => process.env.DX_VISITOR_COPY === 'on';
export const visitorCopyDailyMaximum = () => {
  const value = Number(process.env.DX_BUDGET_VISITOR_EMAIL_DAILY || 100);
  return Number.isSafeInteger(value) && value > 0 ? value : 100;
};
export const kvConfig = () => ({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});
/** True when a persistent KV backend (Vercel KV or Upstash, via either alias) is configured. */
export const kvConfigured = () => { const c = kvConfig(); return Boolean(c.url && c.token); };
// P3e §8/§9: Vercel Production AND Preview must use a persistent cross-instance store — never the in-memory
// development fallback — for sessions, pending actions, receipts, leads, idempotency and locks. Dev/test may keep
// the memory fallback. `productionLike()` is true only on a real Vercel deployment targeting production/preview.
export const productionLike = () => isVercel() && (vercelEnv() === 'production' || vercelEnv() === 'preview');
/** Readiness: a persistent store is only REQUIRED in a production-like Vercel environment. Elsewhere memory is fine. */
export const persistentStoreReady = () => !productionLike() || kvConfigured();
export const conciergeMode = () => process.env.DX_CONCIERGE_MODE;
// P3b controlled-execution kill switch. Execution is OFF unless DX_EXECUTION is explicitly enabled. This is a
// server-only toggle: no browser flag can turn it on, and every mutation path checks it before touching a provider.
export const executionEnabled = () => on(process.env.DX_EXECUTION);
// P3c per-capability server kill switch. Even with the global DX_EXECUTION on, an individual operation stays OFF
// unless BOTH the global switch is on AND its capability switch is either unset (defaulting to the global) or
// explicitly enabled. A dangerous future provider can therefore be independently gated: setting e.g.
// DX_EXECUTION_CMS_DRAFT=off disables just that operation. This is server-only; no browser flag can flip it.
export const capabilityExecutionEnabled = (operation: string) => {
  if (!executionEnabled()) return false;
  const raw = process.env[`DX_EXECUTION_${operation.toUpperCase()}`];
  return raw === undefined ? true : on(raw);
};
// P3c trusted-owner allowlist. A server-only, comma/space-separated set of session-id hashes permitted to execute.
// The browser can never add itself; only an operator provisioning this env can grant execution. Empty => no owners.
export const executionOwnerHashes = () => new Set((process.env.DX_EXECUTION_OWNERS || '').split(/[,\s]+/).map(s => s.trim()).filter(Boolean));
export const reasoningModel = () => process.env.DX_MODEL_REASONING || 'gemini-2.5-pro';
export const reasoningThinking = () => { const value = Number(process.env.DX_REASONING_THINKING); return Number.isSafeInteger(value) && value >= 0 ? value : 1024; };
export const reasoningSessionMax = () => { const value = Number(process.env.DX_SESSION_REASONING_MAX); return Number.isSafeInteger(value) && value > 0 ? value : 4; };
const budgetLimit = (raw: string | undefined) => { const value = Number(raw); return Number.isSafeInteger(value) && value > 0 ? value : Infinity; };
export const budgets = () => ({
  fast: budgetLimit(process.env.DX_BUDGET_FAST_DAILY),
  reasoning: budgetLimit(process.env.DX_BUDGET_REASONING_DAILY),
  tokens: budgetLimit(process.env.DX_BUDGET_TOKENS_DAILY),
  audits: budgetLimit(process.env.DX_BUDGET_AUDITS_DAILY),
});