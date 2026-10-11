import { z } from 'zod';
import { products, offers } from './catalogue';
// T10: the approved, source-attributed Digital X knowledge corpus and its deterministic compiler.
// Content is curated ONLY from already-public catalogue copy (owner decision: KEEP A1–A15 + B1–B5, EXCLUDE C1–C6,
// price review date 2026-09-12). No client results, case studies, guarantees, delivery-time promises, statistics,
// partnerships or rankings are ever authored here. A forbidden-claim scanner is a compile-time safety net.

/** Owner-confirmed price review date. Every price chunk carries this freshness stamp. */
export const REVIEW_DATE = '2026-09-12';
/** Approved starting-price qualifier, taken verbatim from the public shop-category copy (catalogue.ts). */
export const PRICE_QUALIFIER = 'Objavljene cijene su početne. Tačan obim i iznos potvrđujemo prije početka rada.';

// The 15 approved priced products (A1–A15) and 5 approved service overviews (B1–B5). Listing them explicitly
// enforces "only approved content": a new catalogue entry cannot silently enter the corpus.
export const APPROVED_PRICE_IDS = [
  'web-presence', 'ecommerce-launch', 'application-mvp', 'second-brain-os', 'ai-concierge',
  'workflow-starter', 'review-engine', 'seo-aeo', 'growth-campaigns', 'speed-optimization',
  'content-system', 'digital-partner', 'smart-website-launch', 'landing-starter', 'site-care',
] as const;
export const APPROVED_SERVICE_IDS = ['visibility', 'convert', 'growth', 'launch', 'contact'] as const;

export const knowledgeSourceSchema = z.object({
  id: z.string(),
  kind: z.enum(['price', 'service']),
  origin: z.string(),
  reviewDate: z.string(),
  title: z.string(),
  text: z.string(),
  productId: z.string().nullable(),
  priceMinor: z.number().nullable(),
  billing: z.string().nullable(),
}).strict();
export type KnowledgeSource = z.infer<typeof knowledgeSourceSchema>;
export type CompiledCorpus = { reviewDate: string; checksum: string; count: number; sources: KnowledgeSource[] };

// Content withheld from the corpus (owner decision C1–C6). Each lacks a reliable, attributable approved source.
export const EXCLUSIONS = [
  { code: 'C1', source: 'posts[brzina-sajta]', claim: 'Svaki sekund čekanja košta do 20% posjetilaca.', reason: 'Unattributed performance statistic.' },
  { code: 'C2', source: 'posts[automatizacija-recenzija]', claim: 'Do 50+ recenzija bez moljenja kupaca.', reason: 'Unverified outcome/quantity claim.' },
  { code: 'C3', source: 'posts[lokalni-seo-google-mapa]', claim: 'Top 3 na mapi dobijaju većinu poziva.', reason: 'Unattributed market statistic.' },
  { code: 'C4', source: 'posts[ai-chatbot-vodic]', claim: 'Radnik koji ne spava — šta je i koliko košta.', reason: 'Rhetorical price claim; concrete price lives only in priced products.' },
  { code: 'C5', source: '(absent)', claim: 'Client names, testimonials, case-study results, satisfaction scores, project counts, years in business.', reason: 'Not present in approved data; client names/results/partnerships are explicitly unverified.' },
  { code: 'C6', source: '(absent)', claim: 'Delivery-time / turnaround commitments.', reason: 'No approved SLA source in repo.' },
] as const;

type Violation = { id: string; code: string; match: string };
// Positive claim patterns the corpus must never contain. Negated honesty statements (e.g. "ne garantujemo") are allowed.
const FORBIDDEN: { code: string; test: (t: string) => string | null }[] = [
  { code: 'percent-stat', test: t => t.match(/\bdo\s+\d+\s*%|\b\d+\s*%/i)?.[0] ?? null },
  { code: 'count-stat', test: t => t.match(/\b\d+\s*\+/)?.[0] ?? null },
  { code: 'ranking-claim', test: t => t.match(/\btop\s*\d+\b/i)?.[0] ?? null },
  { code: 'guarantee', test: t => (t.replace(/\bne\s+garant\w+/gi, '').match(/\bgarant\w+/i)?.[0] ?? null) },
  { code: 'delivery-promise', test: t => t.match(/\b(?:gotov\w*\s+)?za\s+\d+\s+(?:dan|dana|sedmic\w*|mjesec\w*|sat\w*)\b/i)?.[0] ?? null },
  { code: 'certified-partner', test: t => t.match(/\b(?:zvanični|ovlašten\w*|certificiran\w*)\s+partner\w*/i)?.[0] ?? null },
];
/** Scan corpus sources for forbidden positive claims. Empty result means the corpus is clean. */
export function scanForbidden(sources: readonly KnowledgeSource[]): Violation[] {
  const out: Violation[] = [];
  for (const s of sources) for (const f of FORBIDDEN) { const m = f.test(s.text); if (m) out.push({ id: s.id, code: f.code, match: m }); }
  return out;
}

// Dependency-free FNV-1a hash: a deterministic integrity/determinism stamp that works in any runtime (no node:crypto).
export function corpusChecksum(sources: readonly KnowledgeSource[]): string {
  const json = JSON.stringify(sources);
  let h = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) { h ^= json.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function priceText(priceMinor: number | null, billing: string): string {
  return priceMinor === null ? 'procjena prema obimu' : `${priceMinor / 100} KM (${billing})`;
}

/** Deterministically compile the approved corpus. Throws on any invariant violation. */
export function compileCorpus(): CompiledCorpus {
  const sources: KnowledgeSource[] = [];
  for (const id of APPROVED_PRICE_IDS) {
    const p = products.find(x => x.id === id);
    if (!p) throw new Error(`T10: approved price id "${id}" missing from catalogue`);
    sources.push({
      id: `price.${p.id}`, kind: 'price', origin: `experience-data.ts#products[${p.id}]`, reviewDate: REVIEW_DATE,
      title: p.name, text: `${p.name} — ${p.summary} Početna cijena: ${priceText(p.priceMinor, p.billing)}. ${PRICE_QUALIFIER}`,
      productId: p.id, priceMinor: p.priceMinor, billing: p.billing,
    });
  }
  for (const id of APPROVED_SERVICE_IDS) {
    const o = offers.find(x => x.id === id);
    if (!o) throw new Error(`T10: approved service id "${id}" missing from catalogue`);
    sources.push({
      id: `service.${o.id}`, kind: 'service', origin: `catalogue.ts#offers[${o.id}]`, reviewDate: REVIEW_DATE,
      title: o.name, text: `${o.name} (${o.pillar}) — ${o.intro}`, productId: null, priceMinor: null, billing: null,
    });
  }
  // Deterministic order, independent of catalogue array order.
  sources.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  // Duplicate id protection.
  const seen = new Set<string>();
  for (const s of sources) { if (seen.has(s.id)) throw new Error(`T10: duplicate corpus id "${s.id}"`); seen.add(s.id); }
  // Closed-model validation.
  for (const s of sources) knowledgeSourceSchema.parse(s);
  // Forbidden-claim safety net.
  const violations = scanForbidden(sources);
  if (violations.length) throw new Error(`T10: forbidden claim in corpus: ${JSON.stringify(violations)}`);
  // Price chunks must map to a real product, match its price/billing, and carry the scope qualifier.
  for (const s of sources) {
    if (s.kind !== 'price') continue;
    const p = products.find(x => x.id === s.productId);
    if (!p) throw new Error(`T10: price chunk "${s.id}" maps to unknown product`);
    if (p.priceMinor !== s.priceMinor || p.billing !== s.billing) throw new Error(`T10: price chunk "${s.id}" drifted from catalogue`);
    if (!s.text.includes(PRICE_QUALIFIER)) throw new Error(`T10: price chunk "${s.id}" missing scope qualifier`);
    if (s.reviewDate !== REVIEW_DATE) throw new Error(`T10: price chunk "${s.id}" stale review date`);
  }
  return { reviewDate: REVIEW_DATE, checksum: corpusChecksum(sources), count: sources.length, sources };
}