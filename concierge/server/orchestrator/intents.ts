import { tokenize } from '../knowledge/normalize';
// T13 deterministic intent rules. These run BEFORE any model call so common asks (greeting, guided tour,
// open the audit, navigate to a section) are handled without spending a FAST call and without letting the
// model invent an action. Matching is multilingual and diacritic-insensitive via the shared tokenizer.
export type Intent =
  | { kind: 'greeting' }
  | { kind: 'tour' }
  | { kind: 'audit' }
  | { kind: 'navigate'; section: string }
  | { kind: 'model' };

// Stemmed trigger tokens. Kept minimal and specific so they do not fire on unrelated sentences.
// Triggers are stored as tokenizer STEMS (the tokenizer stems input before matching): e.g. "zdravo"→"zdrav".
const GREETING = new Set(['pozdrav', 'zdrav', 'cao', 'hej', 'hi', 'hell', 'hallo', 'dobar', 'dobr']);
const TOUR = new Set(['vod', 'proved', 'obilaz', 'tour', 'guide', 'fuhr']);
// Audit needs BOTH an analysis noun and a run/open verb, so a pricing question like "koliko košta analiza"
// (no verb) is NOT treated as a request to open the audit — it falls through to the model.
const AUDIT_NOUN = new Set(['analiz', 'audit', 'analys', 'analyz']);
const AUDIT_VERB = new Set(['pokren', 'run', 'start', 'starte', 'urad', 'otvor', 'open', 'skenir', 'scan', 'zeig']);
// A navigation ask needs BOTH a "show/open" verb and a section keyword, so "what does SEO cost" does not navigate.
const SHOW = new Set(['pokaz', 'otvor', 'vod', 'idi', 'show', 'open', 'zeig', 'offne', 'take']);
const SECTION_WORDS: Record<string, string> = {
  seo: 'aeo', aeo: 'aeo', geo: 'aeo', vidljiv: 'aeo', visibility: 'aeo', sichtbar: 'aeo',
  oglas: 'growth', kampanj: 'growth', ads: 'growth', campaign: 'growth', werb: 'growth', rast: 'growth', growth: 'growth',
  recepcion: 'receptionist', receptionist: 'receptionist', upit: 'receptionist', lead: 'receptionist', response: 'receptionist',
  cinematic: 'cinematic', film: 'cinematic', filmsk: 'cinematic',
  shop: 'shop', trgovin: 'shop', prodavnic: 'shop', store: 'shop',
  blog: 'blog', vodic: 'blog',
  cjenovnik: 'pricing', cijen: 'pricing', price: 'pricing', preis: 'pricing', pricing: 'pricing',
  rad: 'work', portfolio: 'work', primjer: 'work', example: 'work', work: 'work',
};

function hasAny(tokens: Set<string>, triggers: Set<string>): boolean {
  for (const tok of tokens) {
    if (triggers.has(tok)) return true;
    // Prefix match: a stemmed trigger like "analiz" matches "analiza"/"analizu"/"analizirati".
    for (const trig of triggers) if (trig.length >= 3 && tok.startsWith(trig)) return true;
  }
  return false;
}
function findSection(tokens: Set<string>): string | undefined {
  for (const tok of tokens) for (const [word, section] of Object.entries(SECTION_WORDS)) if (tok.startsWith(word)) return section;
  return undefined;
}

/** Classify the latest visitor message into a deterministic intent. Order matters: explicit actions win. */
export function classifyIntent(message: string): Intent {
  const tokens = new Set(tokenize(message));
  if (tokens.size === 0) return { kind: 'model' };
  if (hasAny(tokens, TOUR)) return { kind: 'tour' };
  if (hasAny(tokens, AUDIT_NOUN) && hasAny(tokens, AUDIT_VERB)) return { kind: 'audit' };
  const section = findSection(tokens);
  if (section && hasAny(tokens, SHOW)) return { kind: 'navigate', section };
  // A short pure-greeting message (no other substantive tokens) gets the greeting path.
  if (hasAny(tokens, GREETING) && tokens.size <= 3) return { kind: 'greeting' };
  return { kind: 'model' };
}