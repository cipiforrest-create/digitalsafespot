import { tokenize } from '../knowledge/normalize';
import type { AuditFacts } from '../../shared/audit-facts';
import type { AuditCheck } from '../../shared/contracts';
import {
  CAPABILITIES, CAP03_SPEED_EVIDENCE_NOTE, capabilityById,
  type Capability, type CapabilityId, type FactCondition,
} from '../../shared/capabilities';
// T19 deterministic capability selection. Given the visitor's message and (optionally) a persisted audit's facts
// and checks, this returns a bounded, ranked set of approved capabilities. Selection is entirely rule-based: the
// model never invents a capability↔problem mapping. A capability becomes a CANDIDATE only when it has at least one
// PRIMARY source — a matched conversation stem, a `role: 'primary'` fact condition, or an approved AuditCheck
// trigger. `role: 'supporting'` facts only raise an existing candidate's score; a supporting fact alone (e.g. an
// unrelated audit fact) never recommends a service. Output is capped so the concierge never hard-sell-stacks.

// Maximum capabilities surfaced at once. Owner rule: never recommend 3+ services (no hard-sell stacking).
export const MAX_CAPABILITIES = 2;

// Deterministic predicates for each named FactCondition. Bounded, pure, and unit-tested. `lowWordCount`/`noH2`
// use the same thin-content thresholds gradeChecks already treats as attention-worthy.
const LOW_WORD_COUNT = 120;
const factPredicates: Record<FactCondition, (f: AuditFacts) => boolean> = {
  noindex: f => f.noindex === true,
  titleEmpty: f => f.title.trim().length === 0,
  descriptionEmpty: f => f.description.trim().length === 0,
  canonicalNull: f => f.canonical === null,
  schemaEmpty: f => f.schema.types.length === 0,
  noServices: f => f.mentionsServices === false,
  langNull: f => f.lang === null,
  viewportNull: f => f.viewport === null,
  noContact: f => f.hasContact === false,
  noH2: f => f.h2Count === 0,
  lowWordCount: f => f.wordCount < LOW_WORD_COUNT,
  missingAlt: f => f.images.total > 0 && f.images.withAlt < f.images.total,
  notOk: f => f.ok === false || f.status >= 400,
  ogImageNull: f => f.ogImage === null,
};

/** True when a named deterministic AuditFacts condition holds. Exposed for tests. */
export function factConditionMet(condition: FactCondition, facts: AuditFacts): boolean {
  return factPredicates[condition](facts);
}

// Scores per source kind. Primary sources make a candidate; supporting only strengthens an existing candidate.
const SCORE = { conversation: 2, primaryFact: 2, auditCheck: 2, supportingFact: 1 } as const;

export type SignalSource = 'conversation' | 'fact' | 'audit-check';
export type CapabilitySignal = {
  id: CapabilityId;
  title: string;
  serviceIds: readonly string[];
  score: number;
  primary: boolean;
  sources: SignalSource[];
  matchedStems: string[];
  matchedFacts: FactCondition[];
  matchedChecks: string[];
  // CAP-03 only: the mandatory evidence note stating this was one server-response measurement, not Core Web Vitals.
  speedEvidenceNote?: string;
};

export type SignalInput = {
  message?: string;
  facts?: AuditFacts;
  // The deterministic checks from an audit record's AuditResult. Only the `speed` AuditCheck is consulted (CAP-03).
  checks?: readonly AuditCheck[];
};

type Accumulator = {
  score: number; primary: boolean; sources: Set<SignalSource>;
  stems: string[]; facts: FactCondition[]; checks: string[]; speedNote?: string;
};

function matchConversationStems(cap: Capability, tokens: Set<string>): string[] {
  const hits: string[] = [];
  for (const stem of cap.conversationStems) {
    for (const tok of tokens) { if (tok.startsWith(stem)) { hits.push(stem); break; } }
  }
  return hits;
}

/**
 * Deterministically select approved capabilities for a turn. Pure function of its inputs; no model, no I/O.
 * Ordering is stable: higher score first, ties broken by the capability's fixed order in the approved table.
 */
export function selectCapabilities(input: SignalInput): CapabilitySignal[] {
  const tokens = input.message ? new Set(tokenize(input.message)) : new Set<string>();
  const acc = new Map<CapabilityId, Accumulator>();
  const bump = (id: CapabilityId): Accumulator => {
    let a = acc.get(id);
    if (!a) { a = { score: 0, primary: false, sources: new Set(), stems: [], facts: [], checks: [] }; acc.set(id, a); }
    return a;
  };

  for (const cap of CAPABILITIES) {
    // 1. Conversation stems (primary source).
    const stems = tokens.size ? matchConversationStems(cap, tokens) : [];
    if (stems.length) { const a = bump(cap.id); a.score += SCORE.conversation; a.primary = true; a.sources.add('conversation'); a.stems = stems; }
    // 2. Fact signals. Primary conditions make a candidate; supporting conditions only add score.
    if (input.facts) {
      for (const sig of cap.factSignals) {
        if (!factConditionMet(sig.condition, input.facts)) continue;
        const a = bump(cap.id); a.facts.push(sig.condition); a.sources.add('fact');
        if (sig.role === 'primary') { a.score += SCORE.primaryFact; a.primary = true; }
        else a.score += SCORE.supportingFact;
      }
    }
    // 3. Audit-check triggers (CAP-03 `speed` only). Deterministic AuditCheck, NOT a T16 AuditFacts FactKey.
    if (input.checks?.length) {
      for (const trig of cap.auditCheckTriggers) {
        const check = input.checks.find(c => c.id === trig.checkId);
        if (!check) continue;
        if (!(trig.severities as readonly string[]).includes(check.severity)) continue;
        const a = bump(cap.id); a.score += SCORE.auditCheck; a.primary = true; a.sources.add('audit-check'); a.checks.push(trig.checkId);
        if (trig.checkId === 'speed') a.speedNote = CAP03_SPEED_EVIDENCE_NOTE;
      }
    }
  }

  const candidates: CapabilitySignal[] = [];
  for (const cap of CAPABILITIES) {
    const a = acc.get(cap.id);
    // A supporting-only match (no primary source) is dropped: an unrelated audit fact must not recommend a service.
    if (!a || !a.primary) continue;
    candidates.push({
      id: cap.id, title: cap.title, serviceIds: cap.serviceIds, score: a.score, primary: true,
      sources: [...a.sources], matchedStems: a.stems, matchedFacts: a.facts, matchedChecks: a.checks,
      ...(a.speedNote ? { speedEvidenceNote: a.speedNote } : {}),
    });
  }

  const order = new Map(CAPABILITIES.map((c, i) => [c.id, i]));
  candidates.sort((x, y) => y.score - x.score || order.get(x.id)! - order.get(y.id)!);
  return candidates.slice(0, MAX_CAPABILITIES);
}

/** Convenience: capability titles for the selected set, in ranked order. */
export function selectedTitles(signals: CapabilitySignal[]): string[] {
  return signals.map(s => capabilityById(s.id).title);
}

