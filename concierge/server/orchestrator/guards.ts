// T14 output guards. Every model-facing reply passes through here before it reaches the visitor. The guards are
// deterministic and fail safe: a sentence that makes an UNSUPPORTED numeric/price claim, discloses the provider,
// or falsely claims an action was performed is dropped rather than shown. Unsafe HTML/JS is always stripped.
// Supported numbers are exactly those present in the grounded facts passed to the model (approved prices), so a
// grounded price sentence survives while an invented statistic does not.

// Provider/model identifiers that must never surface in visitor text.
const DISCLOSURE = /\b(gemini|google|openai|chatgpt|gpt-?\d?|claude|anthropic|llm|large language model|generativelanguage|vertex|palm|flash|(?<![a-z])pro model)\b/i;
// Multilingual claims that an action already happened. The concierge cannot send email/SMS, call, book or write CRM,
// so any past-tense "done" claim is unsupported and dropped. Patterns are stems to catch inflected forms.
const FALSE_ACTION = [
  /\b(poslao|poslala|poslali|posla(li|o)?\s+smo|zakaza\w*|rezervis\w*|rezervir\w*|obavijestili|kontaktirali\s+smo)\b/i,
  /\b(spremio|spremili|sačuvali\s+smo|upisali\s+smo|unijeli\s+smo)\b.*\b(crm|bazu|sistem)\b/i,
  /\b(i|we)(?:'ve| have)?\s+(sent|booked|scheduled|emailed|called|saved|submitted|contacted)\b/i,
  /\b(sent|booked|scheduled|submitted|saved)\s+(your|the)\s+(enquiry|inquiry|request|email|message|details)\b/i,
  /\b(ich|wir)\s+(habe|haben)\b.*\b(gesendet|gebucht|kontaktiert|gespeichert|übermittelt)\b/i,
];
// Always-unsupported numeric claim shapes, dropped even if the digits happen to appear in grounding.
const ALWAYS_DROP_NUMERIC = [/\d+\s*%/, /\btop\s*\d+\b/i, /\b\d+\s*\+/];

function splitSentences(text: string): string[] {
  // Split on sentence terminators and line/bullet boundaries, keeping content order.
  return text.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(Boolean);
}
function digitGroups(text: string): string[] { return (text.match(/\d+/g) ?? []); }

/** Strip HTML tags, `javascript:` URIs and control characters. Applied to every reply unconditionally. */
export function stripUnsafe(text: string): string {
  return text
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    // eslint-disable-next-line no-control-regex -- intentionally stripping control characters from model output
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}
/** Redact any provider/model disclosure inline (kept as a neutral phrase rather than dropping the whole sentence). */
export function redactDisclosure(text: string): string {
  return text.replace(new RegExp(DISCLOSURE, 'gi'), 'AI').replace(/\bAI\b(\s+AI\b)+/g, 'AI');
}

export type GuardContext = { grounding?: string };
export type GuardResult = { text: string; dropped: string[] };

/** Guard a model reply. Returns the sanitized text plus the list of dropped sentences (for tracing/tests). */
export function guardReply(reply: string, context: GuardContext = {}): GuardResult {
  const supported = new Set(digitGroups(context.grounding ?? ''));
  const dropped: string[] = [];
  const kept: string[] = [];
  for (const rawSentence of splitSentences(reply)) {
    const sentence = redactDisclosure(stripUnsafe(rawSentence));
    if (!sentence) continue;
    if (FALSE_ACTION.some(re => re.test(sentence))) { dropped.push(rawSentence); continue; }
    if (ALWAYS_DROP_NUMERIC.some(re => re.test(sentence))) { dropped.push(rawSentence); continue; }
    const groups = digitGroups(sentence);
    // Allow short standalone numbers (e.g. "2–5 rečenica" style small counts) only when supported by grounding.
    if (groups.some(g => !supported.has(g))) { dropped.push(rawSentence); continue; }
    kept.push(sentence);
  }
  return { text: kept.join(' ').replace(/\s{2,}/g, ' ').trim(), dropped };
}

// Safe fallback when guarding removes everything (e.g. a reply that was entirely an unsupported claim).
export const GUARD_FALLBACK: Record<'bs' | 'en' | 'de', string> = {
  bs: 'Rado ću pomoći. Recite mi šta vas najviše zanima o Digital X uslugama.',
  en: 'Happy to help. Tell me what you’d like to know about Digital X services.',
  de: 'Ich helfe gerne. Sagen Sie mir, was Sie über die Digital-X-Leistungen wissen möchten.',
};