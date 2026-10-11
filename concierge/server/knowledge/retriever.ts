import { buildIndex, scoreDoc, boostSet, type LexicalIndex, type Retrieved } from './lexical';
import { tokenize } from './normalize';
// T11: top-k grounded retrieval over the approved corpus. Instead of sending the whole catalogue to the model,
// callers retrieve a few relevant sources. Below an ungrounded threshold nothing is returned, so an off-topic
// question yields no fabricated grounding.

export const TOP_K = 3;
export const UNGROUNDED_THRESHOLD = 0.75;

let cached: LexicalIndex | null = null;
function index(): LexicalIndex { return (cached ??= buildIndex()); }
/** Test hook: force a rebuild (e.g. after changing approved content). */
export function resetIndex(): void { cached = null; }

export type RetrievalResult = { grounded: boolean; results: Retrieved[] };

/** Retrieve up to TOP_K grounded sources for a query, with an optional page-aware boost. */
export function retrieve(query: string, opts: { pageId?: string; k?: number } = {}): RetrievalResult {
  const idx = index();
  const tokens = tokenize(query);
  if (tokens.length === 0) return { grounded: false, results: [] };
  const boosts = boostSet(opts.pageId);
  const scored: Retrieved[] = idx.docs
    .map(doc => ({ id: doc.source.id, score: scoreDoc(doc, tokens, idx, boosts), source: doc.source }))
    .filter(r => r.score >= UNGROUNDED_THRESHOLD)
    // Deterministic tie-break by id so equal scores never reorder between runs.
    .sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
  const results = scored.slice(0, opts.k ?? TOP_K);
  return { grounded: results.length > 0, results };
}

/** Compact grounding block for a prompt: only retrieved, source-attributed lines. Empty when ungrounded. */
export function groundingText(query: string, opts: { pageId?: string; k?: number } = {}): string {
  const { results } = retrieve(query, opts);
  return results.map(r => `[${r.source.id}] ${r.source.text}`).join('\n');
}