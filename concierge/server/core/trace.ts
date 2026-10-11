import { createHash, randomUUID } from 'node:crypto';
// One privacy-safe structured trace per request. Only whitelisted, non-identifying fields are ever serialized;
// visitor message text, e-mail addresses, audited hosts and provider payloads must never reach a trace.
const ALLOWED_FIELDS = new Set([
  'endpoint', 'requestId', 'sessionHash', 'status', 'durationMs', 'mode', 'code',
  'tool', 'count', 'bucket', 'ok', 'round', 'checks', 'delivered',
]);
export type TraceFields = Record<string, string | number | boolean | undefined>;
type TraceEvent = { at: number; name: string } & TraceFields;
let sink: (line: string) => void = (line) => console.log(line);
/** Test/diagnostic hook. Returns a restore callback that reinstates the previous sink. */
export function setTraceSink(next: (line: string) => void): () => void { const previous = sink; sink = next; return () => { sink = previous; }; }
export function sessionHash(sid: string): string { return createHash('sha256').update('dx:trace:' + sid).digest('base64url').slice(0, 12); }
function pick(fields: TraceFields): TraceFields {
  const out: TraceFields = {};
  for (const [key, value] of Object.entries(fields)) if (ALLOWED_FIELDS.has(key) && value !== undefined) out[key] = value;
  return out;
}
export type Trace = {
  readonly requestId: string;
  span: (name: string, fields?: TraceFields) => void;
  setSession: (sid: string) => void;
  end: (status: string, fields?: TraceFields) => void;
};
export function startTrace(endpoint: string): Trace {
  const requestId = randomUUID().slice(0, 8);
  const start = Date.now();
  const events: TraceEvent[] = [];
  let sessionField: string | undefined;
  let ended = false;
  return {
    requestId,
    span(name, fields = {}) { events.push({ at: Date.now() - start, name, ...pick(fields) }); },
    setSession(sid) { sessionField = sessionHash(sid); },
    end(status, fields = {}) {
      if (ended) return; // Exactly one trace line per request.
      ended = true;
      const line = { endpoint, requestId, sessionHash: sessionField, status, durationMs: Date.now() - start, ...pick(fields), events };
      sink(JSON.stringify(line));
    },
  };
}