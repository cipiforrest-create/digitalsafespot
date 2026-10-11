// Typed, domain-separated error codes. Each code has a bs/en/de visitor message in concierge/shared/i18n.ts.
export const errorCodes = [
  'not_available',
  'method_not_allowed',
  'invalid_request',
  'too_large',
  'rate_limited',
  'session_unavailable',
  'ai_unavailable',
  'voice_unavailable',
  'delivery_unavailable',
  'unsafe_url',
  'insecure_connection',
  'upstream_unavailable',
] as const;
export type ErrorCode = (typeof errorCodes)[number];
export class ConciergeError extends Error {
  constructor(public readonly code: ErrorCode, public readonly status: number) {
    super(code);
    this.name = 'ConciergeError';
  }
}