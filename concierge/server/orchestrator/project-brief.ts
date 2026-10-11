import {
  PROJECT_BRIEF_VERSION, briefFieldKeys, REQUIRED_FIELDS, projectBriefSchema,
  type ProjectBrief, type BriefField, type BriefFieldKey, type BriefProvenance, type BriefCard, type BriefReviewLine,
} from '../../shared/project-brief';
import type { Goal } from '../../shared/contracts';
import type { Locale } from '../../shared/i18n';
import { stripUnsafe } from './guards';

// T21 ProjectBrief assembly. This module is fully deterministic (no model): it captures field values ONLY when
// they can be quoted from the visitor's own message or from an owner-bound audit URL. Unstated fields stay null
// (never guessed). A declined field is remembered and never re-asked. The one-question policy asks at most one
// missing field per turn, in the fixed priority order, and attributes the next visitor message to the field that
// was asked. Provenance stacks across turns so a later turn can add evidence without overwriting earlier proof.

const MAX_EVIDENCE = 6;
const SUBSTANTIVE_MIN = 8; // A problem statement must be more than a greeting/one word.

/** A fresh, empty brief for a session. Every field starts unknown with no evidence. */
export function emptyBrief(sid: string, goal: Goal | null): ProjectBrief {
  const now = Date.now();
  const fields: BriefField[] = briefFieldKeys.map(key => ({ key, value: null, status: 'unknown', evidence: [] }));
  return { v: 1, version: PROJECT_BRIEF_VERSION, sid, goal, fields, askedField: null, status: 'collecting', createdAt: now, updatedAt: now };
}

function field(brief: ProjectBrief, key: BriefFieldKey): BriefField {
  return brief.fields.find(f => f.key === key)!;
}

/**
 * Capture a value for a field, but ONLY when `value` is actually present in `quote` (the supporting text). This is
 * the core guard: the server can never store a value that the visitor did not say (or that an audit did not carry).
 * Returns true when the value was captured (field was unknown). Known fields are not overwritten; evidence stacks.
 */
export function captureField(brief: ProjectBrief, key: BriefFieldKey, value: string, quote: string, source: BriefProvenance, at = Date.now()): boolean {
  const cleanValue = stripUnsafe(value).trim().slice(0, 400);
  const cleanQuote = stripUnsafe(quote).trim().slice(0, 400);
  if (!cleanValue || !cleanQuote) return false;
  // Provenance guard: the value must be quotable from its own supporting text (case-insensitive).
  if (!cleanQuote.toLowerCase().includes(cleanValue.toLowerCase())) return false;
  const f = field(brief, key);
  if (f.status === 'declined') return false; // a declined field is never re-captured automatically
  if (f.status === 'known') { // stack evidence only, keep the first captured value
    if (f.evidence.length < MAX_EVIDENCE && !f.evidence.some(e => e.quote === cleanQuote)) f.evidence.push({ source, quote: cleanQuote, at });
    return false;
  }
  f.value = cleanValue; f.status = 'known';
  f.evidence.push({ source, quote: cleanQuote, at });
  return true;
}

/** Mark a field as explicitly declined so it is never asked again. Idempotent. */
export function declineField(brief: ProjectBrief, key: BriefFieldKey): void {
  const f = field(brief, key);
  if (f.status === 'known') return; // a captured value is not overridden by a later decline
  f.status = 'declined'; f.value = null;
}

// ---- Deterministic extractors. Each returns the matched value (a substring of the message) or null. ----

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const URL_RE = /\b(?:https?:\/\/|www\.)[^\s,;]+/i;
// A budget must carry a currency token or an explicit budget word next to a number — a bare number is never a budget.
const CURRENCY_AMOUNT_RE = /\b\d[\d.,]*\s?(?:km|kn|€|eur|bam|\$|usd|marak\w*)\b/i;
const BUDGET_WORD_AMOUNT_RE = /\b(?:bud[žz]et|budget)\b[^.\n]{0,40}?\b\d[\d.,]*/i;
const TIMELINE_RE = /\b(?:\d+\s?(?:dan\w*|sedmic\w*|nedjelj\w*|mjesec\w*|week\w*|month\w*|godin\w*|year\w*)|do\s+(?:kraja|ljeta|jeseni|prolje\w+|zime)\b[^.\n]{0,20}|(?:sljede\w+|idu\w+)\s+(?:mjesec\w*|sedmic\w*|kvartal\w*)|[šs]to\s+prije|[čc]im\s+prije|asap|hitno|urgentn\w*|urgent)\b/i;

function firstMatch(re: RegExp, text: string): string | null {
  const m = re.exec(text);
  return m ? m[0].trim().slice(0, 400) : null;
}

// Decline phrases (multilingual). A visitor may skip any asked field; we then never ask it again.
const DECLINE_RE = /(?:\bpresko\w*|\bne\s+(?:želim|zelim|bih|treba\w*)|\bnije\s+bitno|\bkasnij\w*|\bne\s+znam|\bradije\s+ne|\bskip\b|\blater\b|\bnot\s+now\b|\brather\s+not\b|\bprefer\s+not\b|\büberspringen\b|\bsp[aä]ter\b|\bkeine\s+angabe\b)/i;

/** True when the message reads as an explicit decline to answer (only meaningful when a field was asked). */
export function isDecline(message: string): boolean {
  return DECLINE_RE.test(stripUnsafe(message));
}

/**
 * Apply one visitor message to the brief. Deterministic pipeline:
 *  1. If a field was asked and the visitor declines → mark it declined.
 *  2. Run typed extractors (email, website, budget, timeline) → capture any volunteered, format-valid values.
 *  3. If a field was asked and it is still unknown and no typed extractor filled it → attribute the message to it.
 *  4. If `problem` is still unknown and the message is substantive → capture it as the problem statement.
 * Returns the updated brief (mutated in place and returned for convenience).
 */
export function applyMessage(brief: ProjectBrief, rawMessage: string, at = Date.now()): ProjectBrief {
  const message = stripUnsafe(rawMessage).trim();
  if (!message) return brief;
  const asked = brief.askedField;

  if (asked && isDecline(message) && field(brief, asked).status === 'unknown') {
    declineField(brief, asked);
    brief.askedField = null; brief.updatedAt = at;
    return finalizeStatus(brief);
  }

  // Typed, volunteered values (can appear in any message). Email captured before URL so an email host is not a website.
  const email = firstMatch(EMAIL_RE, message);
  if (email) captureField(brief, 'contactEmail', email, message, 'visitor', at);
  const websiteText = message.replace(EMAIL_RE, ' ');
  const website = firstMatch(URL_RE, websiteText);
  if (website) captureField(brief, 'website', website, message, 'visitor', at);
  const budget = firstMatch(CURRENCY_AMOUNT_RE, message) ?? firstMatch(BUDGET_WORD_AMOUNT_RE, message);
  if (budget) captureField(brief, 'budget', budget, message, 'visitor', at);
  const timeline = firstMatch(TIMELINE_RE, message);
  if (timeline) captureField(brief, 'timeline', timeline, message, 'visitor', at);

  // Attribute a free-text answer to the field we asked, when a typed extractor did not already fill it.
  if (asked && field(brief, asked).status === 'unknown') {
    captureField(brief, asked, message, message, 'visitor', at);
  }

  // The problem statement: the visitor's own substantive words, captured once.
  if (field(brief, 'problem').status === 'unknown' && message.length >= SUBSTANTIVE_MIN && asked !== 'problem') {
    captureField(brief, 'problem', message, message, 'visitor', at);
  }

  brief.askedField = null; // the asked field has now been handled (answered, declined, or left for a later ask)
  brief.updatedAt = at;
  return finalizeStatus(brief);
}

/** Fold an owner-bound audit URL into the brief's website field (provenance 'audit'), never re-asking it. */
export function applyAuditUrl(brief: ProjectBrief, url: string, at = Date.now()): ProjectBrief {
  const clean = stripUnsafe(url).trim().slice(0, 400);
  if (clean) captureField(brief, 'website', clean, clean, 'audit', at);
  brief.updatedAt = at;
  return finalizeStatus(brief);
}

/** Recompute readiness: ready once every REQUIRED field is known. Declined required fields keep it collecting. */
function finalizeStatus(brief: ProjectBrief): ProjectBrief {
  const ready = REQUIRED_FIELDS.every(k => field(brief, k).status === 'known');
  brief.status = ready ? 'ready_for_review' : 'collecting';
  return brief;
}

/** The single next field to ask: the first field, in priority order, that is still unknown. Null when none remain. */
export function nextFieldToAsk(brief: ProjectBrief): BriefFieldKey | null {
  for (const key of briefFieldKeys) if (field(brief, key).status === 'unknown') return key;
  return null;
}



const QUESTIONS: Record<BriefFieldKey, Record<Locale, string>> = {
  problem: {
    bs: 'Ukratko, koji problem želite riješiti?',
    en: 'In short, what problem would you like to solve?',
    de: 'Kurz gesagt, welches Problem möchten Sie lösen?',
  },
  company: {
    bs: 'Kako se zove vaša firma ili projekt?',
    en: 'What is your company or project called?',
    de: 'Wie heißt Ihr Unternehmen oder Projekt?',
  },
  website: {
    bs: 'Imate li web adresu koju da pogledamo? (Ako nemate, recite mi.)',
    en: 'Do you have a website address for us to look at? (If not, let me know.)',
    de: 'Haben Sie eine Website-Adresse, die wir ansehen sollen? (Falls nicht, sagen Sie es.)',
  },
  budget: {
    bs: 'Imate li okvirni budžet na umu? (Ako ne, preskočit ćemo.)',
    en: 'Do you have a rough budget in mind? (If not, we can skip it.)',
    de: 'Haben Sie ein ungefähres Budget im Sinn? (Falls nicht, überspringen wir es.)',
  },
  timeline: {
    bs: 'Do kada bi trebalo biti gotovo? (Ako nije bitno, recite.)',
    en: 'By when should it be done? (If timing is open, let me know.)',
    de: 'Bis wann sollte es fertig sein? (Falls offen, sagen Sie es.)',
  },
  contactName: {
    bs: 'Kako da vas oslovimo?',
    en: 'What name should we use for you?',
    de: 'Wie dürfen wir Sie ansprechen?',
  },
  contactEmail: {
    bs: 'Na koji e-mail da vam pošaljemo sažetak?',
    en: 'Which email should we send your summary to?',
    de: 'An welche E-Mail sollen wir Ihre Zusammenfassung senden?',
  },
};

const FIELD_LABELS: Record<BriefFieldKey, Record<Locale, string>> = {
  problem: { bs: 'Problem', en: 'Problem', de: 'Problem' },
  company: { bs: 'Firma / projekt', en: 'Company / project', de: 'Unternehmen / Projekt' },
  website: { bs: 'Web adresa', en: 'Website', de: 'Website' },
  budget: { bs: 'Budžet', en: 'Budget', de: 'Budget' },
  timeline: { bs: 'Rok', en: 'Timeline', de: 'Zeitrahmen' },
  contactName: { bs: 'Ime', en: 'Name', de: 'Name' },
  contactEmail: { bs: 'E-mail', en: 'Email', de: 'E-Mail' },
};

const SUMMARY_LEAD: Record<Locale, string> = {
  bs: 'Sažetak za pregled:',
  en: 'Summary for review:',
  de: 'Zusammenfassung zur Prüfung:',
};
const NOT_STATED: Record<Locale, string> = { bs: 'nije navedeno', en: 'not stated', de: 'nicht angegeben' };

/** Deterministic, evidence-only review summary. Built purely from captured values — never invents anything. */
export function reviewSummary(brief: ProjectBrief, locale: Locale): string {
  const parts = brief.fields
    .filter(f => f.status === 'known' && f.value)
    .map(f => `${FIELD_LABELS[f.key][locale]}: ${f.value}`);
  return `${SUMMARY_LEAD[locale]} ${parts.join(' · ')}`.trim();
}

/** Project the brief into a bounded card: the one next question (or null) plus a review of what is captured. */
export function toBriefCard(brief: ProjectBrief, locale: Locale): BriefCard {
  const askKey = brief.status === 'ready_for_review' ? null : nextFieldToAsk(brief);
  const lines: BriefReviewLine[] = brief.fields.map(f => ({
    key: f.key, label: FIELD_LABELS[f.key][locale],
    value: f.status === 'known' ? f.value : (f.status === 'declined' ? NOT_STATED[locale] : null),
    status: f.status,
  }));
  return {
    status: brief.status,
    question: askKey ? QUESTIONS[askKey][locale] : null,
    askedField: askKey,
    lines,
    summary: brief.status === 'ready_for_review' ? reviewSummary(brief, locale) : null,
  };
}

/** Compute the next turn: mark which field we are about to ask (for one-question attribution) and build the card. */
export function advance(brief: ProjectBrief, locale: Locale): { brief: ProjectBrief; card: BriefCard } {
  finalizeStatus(brief);
  const card = toBriefCard(brief, locale);
  brief.askedField = card.askedField;
  return { brief, card };
}

/** Validate/parse a stored brief; returns null when the stored shape is invalid (caller starts fresh). */
export function parseBrief(raw: unknown): ProjectBrief | null {
  const parsed = projectBriefSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
