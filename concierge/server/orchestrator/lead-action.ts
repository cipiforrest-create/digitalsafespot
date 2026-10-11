import { randomUUID } from 'node:crypto';
import type { Locale } from '../../shared/i18n';
import {
  leadCreateInputSchema, serializeLeadPayload, type LeadCreateInput,
} from '../../shared/lead-create';
import {
  canTransition, type ActionCard, type ChatActionState, type CollectedLeadArgs, type PendingAction,
  type StoredRunRequest,
} from '../../shared/chat-action';
import type { ExecutionRequest } from '../../shared/execution';
import { buildExecutionPreview, decideApproval, hashIntent, hashPlan, hashChangeSet } from './execution-preview';

// P3d lead.create chat-action brain. Pure, deterministic helpers (no model, no I/O) that the orchestrator composes:
// detect a contact/lead request, extract fields from the visitor's OWN words across turns, revalidate through the
// SAME strict leadCreateInputSchema the executor uses, freeze an approval-bound run request at confirmation time,
// and project a visitor-safe card. Nothing here trusts model JSON or client structure; the server owns every
// control decision. This module performs NO persistence and NO execution — the orchestrator wires those.

// Lead-intent / control detection and the strict email/phone/url shapes live in the browser-safe shared module so
// the client can route action turns with the SAME rules. Re-exported here so existing server imports are unchanged.
import { EMAIL_RE, PHONE_RE, URL_RE, detectLeadIntent, detectControl, type ActionControl } from '../../shared/lead-intent';
export { detectLeadIntent, detectControl, type ActionControl };

// ---------------- Field extraction (from the visitor's own words) ----------------
/** Extract structured fields present in one message. Never fabricates; only returns what is literally present. */
export function extractStructured(message: string): Partial<CollectedLeadArgs> {
  const out: Partial<CollectedLeadArgs> = {};
  const rawEmail = EMAIL_RE.exec(message)?.[0];
  // Strip trailing punctuation the bounded char-class may greedily capture (e.g. "a@b.co," → "a@b.co").
  const email = rawEmail?.replace(/[.,;:!?)\]]+$/, '');
  if (email) out.contactEmail = email.trim();
  const phone = PHONE_RE.exec(message)?.[0];
  if (phone) out.phone = phone.trim();
  // Strip the email before matching a website so the email domain is not mistaken for a site.
  const withoutEmail = rawEmail ? message.replace(rawEmail, ' ') : message;
  const url = URL_RE.exec(withoutEmail)?.[0]?.replace(/[.,;:!?)\]]+$/, '');
  if (url && !/@/.test(url)) out.website = url.trim();
  return out;
}

// Common lead-in phrases a visitor prefixes to a name/enquiry answer. Stripped so the stored value is the value only.
const NAME_PREFIX = /^(?:my name is|i am|i'm|this is|the name is|name:|ime je|ja sam|zovem se|ich (?:bin|heisse|heiße)|mein name ist)\s+/i;
// Cues that begin a trailing DETAIL clause a visitor appends to the same sentence as their name
// ("… Marko Petrovic, email …, phone …, budget 4000 EUR"). The name ends where the first cue starts; everything
// from there on is enquiry context, never part of contactName. Diacritic-free and accented spellings both listed
// because this runs on the raw message (norm() would destroy the original casing the name must keep).
const NAME_STOP = /\b(?:e-?mails?|mail|phone|telefon|tel|mobile|mobitel|broj|number|budget|budzet|budžet|timeline|rok|company|firma|kompanija|website|webseite|web|site|stranica|url|my|moj|moja|moje|mein|meine)\b/i;
// A name token: letters (any script, incl. diacritics), optionally hyphenated/apostrophised, or an initial ("R.").
// Anything carrying a digit or symbol (4000, +387, @) is not a name and terminates the name run.
const NAME_TOKEN = /^[\p{L}][\p{L}\p{M}'’.-]*$/u;

/**
 * Reduce a free-text answer to just the person's name. Collection used to keep the whole leftover, so a single
 * sentence like "My name is Marko Petrovic, email …, phone …, budget around 4000 EUR" stored the entire tail as
 * contactName. The name is now bounded by: the lead-in prefix, the first list/sentence separator, the first detail
 * cue, and the first non-name-like token. Legitimate multi-word names ("Ana Marija van der Berg", "John R. Smith")
 * survive intact — only trailing non-name content is dropped, and the caller preserves it as enquiry context.
 */
export function cleanName(s: string): string {
  let v = s.replace(NAME_PREFIX, '');
  // A name never spans a list separator or a sentence end. `.` after a single capital is an initial, not an end.
  v = v.split(/[,;\n]|(?<!\b\p{Lu})[.!?]/u)[0] ?? '';
  const stop = NAME_STOP.exec(v);
  if (stop) v = v.slice(0, stop.index);
  // Drop a conjunction left dangling by the cut ("First Last and" → "First Last").
  v = v.replace(/\s+(?:and|und|i|a)\s*$/i, '').replace(/[.,;:!?]+$/, '').trim();
  // Keep the leading run of name-like tokens; bounded so a run-on answer can never become a 120-char "name".
  const kept: string[] = [];
  for (const token of v.split(/\s+/).filter(Boolean)) {
    if (!NAME_TOKEN.test(token)) break;
    kept.push(token);
    if (kept.length === 6) break;
  }
  return kept.join(' ');
}

/** The part of a name answer that followed the name — preserved as enquiry context instead of being dropped. */
function nameRemainder(answer: string, name: string): string {
  const stripped = answer.replace(NAME_PREFIX, '');
  const at = name ? stripped.indexOf(name) : -1;
  const tail = at >= 0 ? stripped.slice(at + name.length) : stripped;
  return tail.replace(/^[\s.,;:!?-]+/, '').replace(/\s+/g, ' ').trim();
}

/** Remove extracted tokens from free text, leaving what could be a name/enquiry answer. */
function leftover(message: string, extracted: Partial<CollectedLeadArgs>, raw?: { email?: string }): string {
  let s = message;
  if (raw?.email) s = s.replace(raw.email, ' ');
  for (const v of [extracted.contactEmail, extracted.phone, extracted.website]) if (v) s = s.replace(v, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

export const REQUIRED_ORDER = ['contactName', 'contactEmail', 'message'] as const;

// ---------------- Localized collection + status copy ----------------
// Short, source-free lines for the deterministic action path. Facts never come from here.
type L = Record<Locale, string>;
const ASK: Record<'contactName' | 'contactEmail' | 'message' | 'intro', L> = {
  intro: {
    bs: 'Rado ću to prenijeti timu Digital X. Treba mi još par podataka.',
    en: 'I’ll gladly pass that to the Digital X team. I need a few details.',
    de: 'Das gebe ich gern an das Digital-X-Team weiter. Ich brauche noch ein paar Angaben.',
  },
  contactName: {
    bs: 'Kako glasi vaše ime?', en: 'What is your name?', de: 'Wie lautet Ihr Name?',
  },
  contactEmail: {
    bs: 'Na koji e-mail da vas Digital X kontaktira?', en: 'What is the best email for Digital X to contact you?',
    de: 'Unter welcher E-Mail soll Digital X Sie erreichen?',
  },
  message: {
    bs: 'Ukratko, šta vam je potrebno?', en: 'In short, what do you need?', de: 'Kurz gesagt, was benötigen Sie?',
  },
};
const CARD_NOTE: L = {
  bs: 'Potvrdom dajete saglasnost da vas Digital X kontaktira koristeći navedene podatke.',
  en: 'Confirming gives Digital X consent to contact you using the details above.',
  de: 'Mit der Bestätigung erlauben Sie Digital X, Sie mit den obigen Angaben zu kontaktieren.',
};
const FIELD_LABELS: Record<string, L> = {
  contactName: { bs: 'Ime', en: 'Name', de: 'Name' },
  company: { bs: 'Firma', en: 'Company', de: 'Firma' },
  website: { bs: 'Web', en: 'Website', de: 'Website' },
  contactEmail: { bs: 'E-mail', en: 'Email', de: 'E-Mail' },
  phone: { bs: 'Telefon', en: 'Phone', de: 'Telefon' },
  message: { bs: 'Poruka', en: 'Message', de: 'Nachricht' },
};
function line(l: L, locale: Locale): string { return l[locale] ?? l.bs; }

/** Merge newly-seen fields into the accumulated args. Existing non-empty values are NEVER overwritten by blanks. */
export function mergeArgs(prev: CollectedLeadArgs, next: Partial<CollectedLeadArgs>): CollectedLeadArgs {
  const merged: CollectedLeadArgs = { ...prev };
  for (const [k, v] of Object.entries(next) as [keyof CollectedLeadArgs, string | undefined][]) {
    if (typeof v === 'string' && v.trim()) merged[k] = v.trim();
  }
  return merged;
}

/**
 * Accumulate fields from one visitor message into the args, given which required slot (if any) we just asked for.
 * Structured fields (email/phone/website) are always taken from anywhere in the text; a free-text answer fills the
 * specific slot we asked for (name or message) so we never ask again for something already provided.
 */
export function collectFromMessage(prev: CollectedLeadArgs, message: string, awaiting: string | null): CollectedLeadArgs {
  const rawEmail = EMAIL_RE.exec(message)?.[0];
  const structured = extractStructured(message);
  let merged = mergeArgs(prev, structured);
  const rest = leftover(message, structured, { email: rawEmail });
  if (awaiting === 'contactName' && rest && !merged.contactName) {
    // The name is bounded to the name itself; any trailing free-form detail in the same sentence is NOT discarded —
    // it is folded into the enquiry message (when we don't already have one) so no visitor-supplied context is lost.
    const name = cleanName(rest);
    if (name) {
      merged = mergeArgs(merged, { contactName: name.slice(0, 120) });
      const remainder = nameRemainder(rest, name);
      if (remainder && !merged.message) merged = mergeArgs(merged, { message: remainder.slice(0, 2000) });
    } else {
      // Nothing name-like in the answer: keep the previous behaviour of storing the cleaned free text.
      merged = mergeArgs(merged, { contactName: rest.replace(/[.,;:!?]+$/, '').trim().slice(0, 120) });
    }
  }
  else if (awaiting === 'message' && rest && !merged.message) merged = mergeArgs(merged, { message: rest.slice(0, 2000) });
  else if (!awaiting && rest && !merged.message) {
    // The very first substantive message after intent IS the enquiry; capture it so we never re-ask for it.
    merged = mergeArgs(merged, { message: rest.slice(0, 2000) });
  }
  return merged;
}

/** The first still-missing required field, or null when all required fields are present. Order is stable. */
export function nextMissing(args: CollectedLeadArgs): (typeof REQUIRED_ORDER)[number] | null {
  for (const f of REQUIRED_ORDER) if (!args[f] || !String(args[f]).trim()) return f;
  return null;
}

/** The localized question for the next missing field (prefixed with an intro on the first ask). */
export function promptFor(field: (typeof REQUIRED_ORDER)[number], locale: Locale, withIntro: boolean): string {
  const ask = line(ASK[field], locale);
  return withIntro ? `${line(ASK.intro, locale)} ${ask}` : ask;
}


// ---------------- Server-side revalidation ----------------
/**
 * Build a STRICT LeadCreateInput from the accumulated args by running them through the SAME leadCreateInputSchema the
 * executor uses. Returns the parsed input on success, or the list of missing/invalid required field keys on failure.
 * This never trusts the collected structure: consent is injected server-side as the explicit confirmation signal,
 * and defaults (source/company/phone) come from the schema, never fabricated content.
 */
export function revalidate(args: CollectedLeadArgs): { ok: true; input: LeadCreateInput } | { ok: false; missing: string[] } {
  const candidate = {
    contactName: (args.contactName ?? '').trim(),
    contactEmail: (args.contactEmail ?? '').trim(),
    message: (args.message ?? '').trim(),
    company: (args.company ?? '').trim(),
    phone: (args.phone ?? '').trim(),
    // The website the visitor gave is folded into source context; the strict schema has no website field.
    source: (args.source ?? 'concierge').trim() || 'concierge',
    consent: true as const,
  };
  const parsed = leadCreateInputSchema.safeParse(candidate);
  if (parsed.success) return { ok: true, input: parsed.data };
  // Report which REQUIRED fields are missing/invalid (so collection asks only for those); optional-field errors
  // (e.g. a malformed phone) are surfaced as their own key so the orchestrator can ask for a correction.
  const missing = new Set<string>();
  for (const issue of parsed.error.issues) { const k = issue.path[0]; if (typeof k === 'string') missing.add(k); }
  return { ok: false, missing: [...missing] };
}

// ---------------- Freeze an approval-bound run request ----------------
const LEAD_TARGET = 'lead:concierge';

/**
 * Build the FROZEN, approval-bound, actor-less run request for a validated lead input. This runs the real P3a
 * preview pipeline (intent → plan → change set → approval) with the canonical lead payload in the change `after`,
 * approves it, and assembles the exact ExecutionRunRequest the controlled-execution engine will revalidate. The
 * executionId / approvalId / idempotencyKey are stable for THIS confirmation: a double-confirm replays the identical
 * fingerprint (idempotent), while any edit calls this again and produces a NEW id set (invalidating the old approval).
 */
export function freezeRunRequest(input: LeadCreateInput, now: number): StoredRunRequest {
  const request: ExecutionRequest = { objective: 'Create a lead from the enquiry', target: LEAD_TARGET, operation: 'lead_create', goal: null };
  const changes = [{ target: LEAD_TARGET, summary: 'Create the lead record', before: null, after: serializeLeadPayload(input) }];
  const preview = buildExecutionPreview({ request, capability: null, now }, changes, now);
  const approval = decideApproval(preview.approval, preview.plan, preview.changeSet, true);
  return {
    v: 1,
    executionId: randomUUID(),
    version: 1,
    approvalId: approval.id,
    intent: preview.intent,
    plan: preview.plan,
    changeSet: preview.changeSet,
    expected: { intentHash: hashIntent(preview.intent), planHash: hashPlan(preview.plan), changeSetHash: hashChangeSet(preview.changeSet) },
    approval,
    mode: 'execute',
    idempotencyKey: `lead-create:${approval.id}`,
    requestedAt: now,
  };
}

// ---------------- Visitor-safe card projection ----------------
/** Project a pending action into the bounded ActionCard the client renders (echoes only visitor-provided values). */
export function toActionCard(action: PendingAction, locale: Locale): ActionCard {
  const a = action.args;
  const fields: ActionCard['fields'] = [];
  const push = (key: string, value: string | undefined) => { if (value && value.trim()) fields.push({ key, label: line(FIELD_LABELS[key], locale), value: value.trim() }); };
  push('contactName', a.contactName);
  push('company', a.company);
  push('website', a.website);
  push('contactEmail', a.contactEmail);
  push('phone', a.phone);
  push('message', a.message);
  const title: L = { bs: 'DIGITAL X — ZAHTJEV ZA KONTAKT', en: 'DIGITAL X — CONTACT REQUEST', de: 'DIGITAL X — KONTAKTANFRAGE' };
  const revalidated = revalidate(a);
  return {
    capability: action.capability,
    state: action.state,
    title: line(title, locale),
    fields,
    missing: revalidated.ok ? [] : revalidated.missing,
    canConfirm: action.state === 'awaiting_confirmation',
    executionId: action.executionId,
    note: line(CARD_NOTE, locale),
  };
}

/** Guard a state transition for a pending action; returns the next action or throws on an illegal edge. */
export function transition(action: PendingAction, to: ChatActionState): PendingAction {
  if (!canTransition(action.state, to)) throw new Error(`illegal chat-action transition ${action.state} -> ${to}`);
  return { ...action, state: to, updatedAt: action.updatedAt };
}

