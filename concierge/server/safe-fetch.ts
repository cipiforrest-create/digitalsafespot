import dns from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import ipaddr from 'ipaddr.js';

export function publicIp(value: string): boolean {
  try {
    let address = ipaddr.parse(value.replace(/^\[|\]$/g, ''));
    if (address.kind() === 'ipv6' && (address as ipaddr.IPv6).isIPv4MappedAddress()) address = (address as ipaddr.IPv6).toIPv4Address();
    if (address.range() !== 'unicast') return false;
    if (address.kind() === 'ipv4') return true;
    // Globally routable IPv6 unicast is currently allocated from 2000::/3.
    return address.match(ipaddr.parse('2000::'), 3);
  } catch { return false; }
}
export function normalizeTarget(raw: string): URL {
  if (raw.length > 2048) throw new Error('URL is too long');
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(raw) && !/^https?:\/\//i.test(raw)) throw new Error('Only HTTP and HTTPS websites are supported');
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (hostname.includes('%')) throw new Error('Zone identifiers are not allowed');
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port || !hostname || hostname.endsWith('.') || /(^|\.)(localhost|local|internal|test|invalid|example)$/.test(hostname) || ['metadata', 'metadata.google.internal'].includes(hostname)) throw new Error('Enter a public website URL');
  if (ipaddr.isValid(hostname) && !publicIp(hostname)) throw new Error('Private and reserved addresses are not allowed');
  if (!hostname.includes('.') && !hostname.includes(':')) throw new Error('Enter a public website hostname');
  url.hash = ''; return url;
}
export async function resolvePublic(host: string, lookup: (hostname: string, options: { all: true; verbatim: true }) => Promise<{address:string;family:number}[]> = dns.lookup): Promise<{ address: string; family: 4 | 6 }> {
  const hostname = host.replace(/^\[|\]$/g, '');
  if (ipaddr.isValid(hostname)) { if (!publicIp(hostname)) throw new Error('Address is not public'); return { address: hostname, family: ipaddr.parse(hostname).kind() === 'ipv4' ? 4 : 6 }; }
  const records = await lookup(hostname, { all: true, verbatim: true });
  if (!records.length || records.some(r => !publicIp(r.address))) throw new Error('The hostname does not resolve exclusively to public addresses');
  const chosen = records.find(r => r.family === 4) || records[0];
  return { address: chosen.address, family: chosen.family as 4 | 6 };
}
export type Fetched = { url: string; status: number; text: string; headers: http.IncomingHttpHeaders; truncated: boolean };
// A per-audit budget shared across the page fetch and its side fetches (§9): at most 4 requests,
// 12 connections including redirect hops, and 2.5 MB in total. The 20 s deadline is supplied by the caller.
export type FetchBudget = { requests: number; connections: number; bytes: number; maxRequests: number; maxConnections: number; maxBytes: number };
export function createAuditBudget(): FetchBudget { return { requests: 0, connections: 0, bytes: 0, maxRequests: 4, maxConnections: 12, maxBytes: 2_621_440 }; }
// Legacy charsets we are willing to decode. Anything else falls back to UTF-8, so bytes are never executed as another format.
const CHARSETS = new Set(['utf-8', 'windows-1250', 'iso-8859-2', 'windows-1252']);
const CHARSET_ALIASES: Record<string, string> = { utf8: 'utf-8', 'latin-2': 'iso-8859-2', latin2: 'iso-8859-2', 'iso8859-2': 'iso-8859-2', cp1250: 'windows-1250', cp1252: 'windows-1252', 'windows1250': 'windows-1250', 'windows1252': 'windows-1252' };
function pickCharset(label: string | undefined): string | null {
  if (!label) return null;
  const normalized = label.trim().toLowerCase().replace(/["';].*$/, '');
  const resolved = CHARSET_ALIASES[normalized] || normalized;
  return CHARSETS.has(resolved) ? resolved : null;
}
/** Decode a response body using the header charset, then a `<meta charset>` sniff, then UTF-8. Restricted to the allowlist. */
export function decodeBody(buffer: Buffer, headers: http.IncomingHttpHeaders): string {
  const headerType = String(headers['content-type'] || '');
  let charset = pickCharset(/charset=([^;]+)/i.exec(headerType)?.[1]);
  if (!charset) {
    const head = buffer.subarray(0, 2048).toString('latin1');
    charset = pickCharset(/<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1] || /charset=["']?([\w-]+)/i.exec(head)?.[1]);
  }
  return new TextDecoder(charset || 'utf-8').decode(buffer);
}
async function resolveWithAbort(host: string, signal: AbortSignal) {
  let abort: () => void = () => undefined;
  try { return await Promise.race([resolvePublic(host), new Promise<never>((_, reject) => { abort = () => reject(new Error('Request timed out')); if (signal.aborted) abort(); else signal.addEventListener('abort', abort, { once: true }); })]); }
  finally { signal.removeEventListener('abort', abort); }
}
// Recovered audit safeFetch responsibilities; DNS is now pinned to the actual connection.
// A large body is truncated (never rejected): `truncated=true` lets the caller mark the audit partial.
export async function safeFetch(raw: string, signal: AbortSignal, maxBytes = 1_500_000, budget?: FetchBudget): Promise<Fetched> {
  if (budget) { budget.requests += 1; if (budget.requests > budget.maxRequests) throw new Error('request_budget'); }
  let target = normalizeTarget(raw);
  for (let hop = 0; hop < 5; hop++) {
    if (budget) { budget.connections += 1; if (budget.connections > budget.maxConnections) throw new Error('connection_budget'); }
    const cap = budget ? Math.max(0, Math.min(maxBytes, budget.maxBytes - budget.bytes)) : maxBytes;
    const deadline = AbortSignal.any([signal, AbortSignal.timeout(10000)]);
    const address = await resolveWithAbort(target.hostname, deadline);
    const response = await new Promise<Fetched>((resolve, reject) => {
      const request = (target.protocol === 'https:' ? https : http).request(target, {
        method: 'GET', agent: false, family: address.family, signal: deadline,
        lookup: (_hostname, _options, callback) => callback(null, address.address, address.family),
        headers: { 'User-Agent': 'DigitalX-Audit/1.0 (+https://www.digital-x-marketing.com/)', Accept: 'text/html,application/xhtml+xml,application/xml,text/plain;q=0.8', 'Accept-Encoding': 'identity' },
      }, incoming => {
        const status = incoming.statusCode || 0;
        if (status >= 300 && status < 400) { incoming.destroy(); resolve({ url: target.href, status, text: '', headers: incoming.headers, truncated: false }); return; }
        const encoding = incoming.headers['content-encoding'];
        const type = String(incoming.headers['content-type'] || '');
        if ((encoding && encoding !== 'identity') || !/text\/|application\/(xhtml\+xml|xml|json)/i.test(type)) { incoming.destroy(); reject(new Error('The website did not return readable text')); return; }
        const chunks: Buffer[] = []; let size = 0; let truncated = false;
        const finish = () => { const body = Buffer.concat(chunks, size); if (budget) budget.bytes += size; resolve({ url: target.href, status, text: decodeBody(body, incoming.headers), headers: incoming.headers, truncated }); };
        incoming.on('data', (chunk: Buffer) => {
          const room = cap - size;
          if (chunk.length >= room) { chunks.push(chunk.subarray(0, Math.max(0, room))); size += Math.max(0, room); truncated = true; incoming.destroy(); finish(); return; }
          size += chunk.length; chunks.push(chunk);
        });
        incoming.on('end', () => { if (!truncated) finish(); });
        incoming.on('error', reject);
      });
      request.on('error', reject); request.end();
    });
    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      const next = normalizeTarget(new URL(response.headers.location, target).href);
      if (target.protocol === 'https:' && next.protocol === 'http:') throw new Error('insecure_redirect');
      target = next; continue;
    }
    return response;
  }
  throw new Error('Too many redirects');
}
/** True when the two hosts are the same origin family, allowing only a leading `www.` toggle. */
export function sameSiteHost(entered: string, candidate: string): boolean {
  const strip = (h: string) => h.replace(/^\[|\]$/g, '').toLowerCase().replace(/^www\./, '');
  return strip(entered) === strip(candidate);
}
