import type { PageId } from './catalogue';
import type { FactKey } from './audit-facts';
// T19 approved capability table (owner sign-off 2026-09-27). This is the closed, stable set of capabilities the
// concierge may EVER recommend. It is declarative data only: the model never invents capabilities or mappings —
// deterministic rules in server/orchestrator/signals.ts select from this table. A problem maps to a bounded set,
// never to "all services". Changing this table is the only way to change what can be recommended.

// Closed capability id union. No capability exists outside CAP-01…CAP-13.
export type CapabilityId =
  | 'CAP-01' | 'CAP-02' | 'CAP-03' | 'CAP-04' | 'CAP-05' | 'CAP-06' | 'CAP-07'
  | 'CAP-08' | 'CAP-09' | 'CAP-10' | 'CAP-11' | 'CAP-12' | 'CAP-13';

// A named, deterministic condition over the T16 AuditFacts model. Each maps to exactly one AuditFacts FactKey and a
// bounded predicate implemented in signals.ts. `speed` is intentionally NOT here: speed is a deterministic AuditCheck
// (server response measurement), never a FactKey — see AUDIT_CHECK triggers below.
export type FactCondition =
  | 'noindex' | 'titleEmpty' | 'descriptionEmpty' | 'canonicalNull' | 'schemaEmpty' | 'noServices' | 'langNull'
  | 'viewportNull' | 'noContact' | 'noH2' | 'lowWordCount' | 'missingAlt' | 'notOk' | 'ogImageNull';

// A fact signal for a capability. `role: 'primary'` may create a recommendation on its own; `role: 'supporting'`
// only strengthens a capability already matched by a primary signal (fact/check) or a conversation signal — a
// supporting fact alone never produces a recommendation, so an unrelated audit fact cannot recommend a service.
export type FactSignal = { condition: FactCondition; fact: FactKey; role: 'primary' | 'supporting' };

// A deterministic AuditCheck trigger (NOT a FactKey). Only CAP-03 uses this, referencing the existing `speed` check.
export type AuditCheckTrigger = { checkId: string; severities: ReadonlyArray<'warning' | 'critical'>; role: 'primary' };

export type Capability = {
  id: CapabilityId;
  title: string;
  serviceIds: readonly PageId[];
  conversationStems: readonly string[];
  factSignals: readonly FactSignal[];
  auditCheckTriggers: readonly AuditCheckTrigger[];
};

// The deterministic `speed` AuditCheck id emitted by server/audit.ts. It is a single server-response measurement
// (includes DNS/TLS), NOT Core Web Vitals and NOT an AuditFacts field. CAP-03 evidence must say exactly this.
export const SPEED_AUDIT_CHECK_ID = 'speed';
export const CAP03_SPEED_EVIDENCE_NOTE =
  'Analiza je izmjerila jedno vrijeme odgovora servera (uključuje DNS i TLS). To nije Core Web Vitals mjerenje i ne obećava dobitak u brzini.';

export const CAPABILITIES: readonly Capability[] = [
  {
    id: 'CAP-01', title: 'Search & AI visibility', serviceIds: ['visibility', 'signal'],
    conversationStems: ['seo', 'geo', 'aeo', 'googl', 'preporuc', 'vidljiv', 'pretra', 'rankin'],
    factSignals: [
      { condition: 'noindex', fact: 'noindex', role: 'primary' },
      { condition: 'titleEmpty', fact: 'title', role: 'primary' },
      { condition: 'descriptionEmpty', fact: 'description', role: 'primary' },
      { condition: 'canonicalNull', fact: 'canonical', role: 'primary' },
      { condition: 'schemaEmpty', fact: 'schema', role: 'primary' },
      { condition: 'noServices', fact: 'mentionsServices', role: 'primary' },
      { condition: 'langNull', fact: 'lang', role: 'primary' },
    ],
    auditCheckTriggers: [],
  },
  {
    id: 'CAP-02', title: 'Website experience / redesign', serviceIds: ['convert', 'cinematic', 'storefront'],
    conversationStems: ['redizajn', 'izgled', 'moderniz', 'mobiln', 'zastar'],
    factSignals: [
      { condition: 'viewportNull', fact: 'viewport', role: 'primary' },
      { condition: 'noContact', fact: 'hasContact', role: 'primary' },
      { condition: 'noH2', fact: 'h2Count', role: 'primary' },
      { condition: 'lowWordCount', fact: 'wordCount', role: 'primary' },
      { condition: 'missingAlt', fact: 'images', role: 'primary' },
      { condition: 'notOk', fact: 'ok', role: 'primary' },
    ],
    auditCheckTriggers: [],
  },
  {
    // EDIT (owner 2026-09-27): evidence is the deterministic `speed` AuditCheck, NOT a T16 AuditFacts FactKey.
    // viewport is a supporting AuditFacts signal only. Recommendation must carry CAP03_SPEED_EVIDENCE_NOTE.
    id: 'CAP-03', title: 'Speed / technical foundation', serviceIds: ['product-speed-optimization', 'convert'],
    conversationStems: ['spor', 'brzin', 'ucitav', 'performans'],
    factSignals: [{ condition: 'viewportNull', fact: 'viewport', role: 'supporting' }],
    auditCheckTriggers: [{ checkId: SPEED_AUDIT_CHECK_ID, severities: ['warning', 'critical'], role: 'primary' }],
  },
  {
    id: 'CAP-04', title: 'Lead response & qualification', serviceIds: ['receptionist', 'lead-desk'],
    conversationStems: ['propust', 'upit', 'recepcion', 'kvalifik', 'odgovar'],
    factSignals: [{ condition: 'noContact', fact: 'hasContact', role: 'supporting' }],
    auditCheckTriggers: [],
  },
  {
    id: 'CAP-05', title: 'On-site conversation assistant', serviceIds: ['concierge'],
    conversationStems: ['chatbot', 'asistent', 'voden'],
    factSignals: [],
    auditCheckTriggers: [],
  },
  {
    id: 'CAP-06', title: 'Workflow automation & knowledge', serviceIds: ['automate', 'second-brain'],
    conversationStems: ['automatiz', 'rucn', 'ponavl', 'dokument'],
    factSignals: [],
    auditCheckTriggers: [],
  },
  {
    id: 'CAP-07', title: 'Paid campaigns (Meta / Google)', serviceIds: ['growth', 'meta-ads', 'google-ads'],
    conversationStems: ['oglas', 'kampanj', 'budzet', 'facebook'],
    factSignals: [
      { condition: 'noContact', fact: 'hasContact', role: 'supporting' },
      { condition: 'noH2', fact: 'h2Count', role: 'supporting' },
      { condition: 'lowWordCount', fact: 'wordCount', role: 'supporting' },
    ],
    auditCheckTriggers: [],
  },
  {
    id: 'CAP-08', title: 'Organic social', serviceIds: ['social-management', 'social-growth'],
    conversationStems: ['drustven', 'instagram', 'objav', 'angazm'],
    factSignals: [],
    auditCheckTriggers: [],
  },
  {
    id: 'CAP-09', title: 'Content & production', serviceIds: ['content', 'photography', 'video', 'catalogues'],
    conversationStems: ['fotograf', 'video', 'katalog', 'snimanj', 'produkcij', 'sadrzaj'],
    factSignals: [
      { condition: 'missingAlt', fact: 'images', role: 'supporting' },
      { condition: 'ogImageNull', fact: 'ogImage', role: 'supporting' },
    ],
    auditCheckTriggers: [],
  },
  {
    id: 'CAP-10', title: 'Reviews / reputation', serviceIds: ['product-review-engine'],
    conversationStems: ['recenzij', 'ocjen', 'reputacij'],
    factSignals: [],
    auditCheckTriggers: [],
  },
  {
    // EDIT (owner 2026-09-27): P0 is conversation-driven only. No audit/fact trigger — the model may not infer
    // "recurring technical gaps" as evidence. A bounded deterministic derived signal was deemed not needed for P0.
    id: 'CAP-11', title: 'Ongoing partnership & site care', serviceIds: ['product-digital-partner', 'product-site-care'],
    conversationStems: ['odrzavanj', 'partner', 'mjesecn', 'podrsk'],
    factSignals: [],
    auditCheckTriggers: [],
  },
  {
    id: 'CAP-12', title: 'E-commerce launch', serviceIds: ['storefront', 'product-ecommerce-launch'],
    conversationStems: ['webshop', 'prodavnic', 'ecommerce', 'korpa'],
    factSignals: [{ condition: 'noServices', fact: 'mentionsServices', role: 'supporting' }],
    auditCheckTriggers: [],
  },
  {
    id: 'CAP-13', title: 'Custom application (MVP)', serviceIds: ['product-application-mvp'],
    conversationStems: ['aplikacij', 'softver', 'mvp', 'app'],
    factSignals: [],
    auditCheckTriggers: [],
  },
] as const;

export const capabilityIds = CAPABILITIES.map(c => c.id) as readonly CapabilityId[];
const byId = new Map<CapabilityId, Capability>(CAPABILITIES.map(c => [c.id, c]));
export function capabilityById(id: CapabilityId): Capability { return byId.get(id)!; }
export function isCapabilityId(value: string): value is CapabilityId { return byId.has(value as CapabilityId); }

