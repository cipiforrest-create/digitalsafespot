import { compileCorpus, type KnowledgeSource } from '../../shared/knowledge-corpus';
import { tokenize } from './normalize';
// T11: a small deterministic lexical index over the approved corpus. Each source becomes a bag of stemmed tokens
// (from its own approved text) plus a curated multilingual tag set so a bs/hr/sr/en/de query reaches the right
// Bosnian source. Tags describe existing services only; they add no new claims.

// Curated, grounded topic tags per corpus id. Terms are synonyms/translations of what the source already says.
const TAGS: Record<string, string> = {
  'service.visibility': 'seo aeo geo vidljivost visibility sichtbarkeit pretraga search google chatgpt ai preporuka ranking pozicija',
  'service.convert': 'konverzija conversion dizajn design landing web iskustvo experience umwandlung cta upit',
  'service.growth': 'rast growth wachstum oglasi ads kampanje campaigns meta google budzet marketing',
  'service.launch': 'launch pokretanje start web stranica website webseite cinematic lead assistant nova',
  'service.contact': 'kontakt kontaktirati contact kontaktieren ponuda procjena razgovor obim quote email telefon javiti upit',
  'price.web-presence': 'cijena price preis kosten kostet web prisustvo stranica website webseite webseiten presentation prezentacija',
  'price.ecommerce-launch': 'cijena price preis ecommerce trgovina shop webshop prodavnica online',
  'price.application-mvp': 'cijena price preis aplikacija application app portal booking dashboard software',
  'price.second-brain-os': 'cijena price preis second brain ai memorija knowledge copilot asistent baza',
  'price.ai-concierge': 'cijena price preis ai asistent assistant concierge chatbot prodajni razgovor',
  'price.workflow-starter': 'cijena price preis automatizacija automation workflow crm zadatak proces starter',
  'price.review-engine': 'cijena price preis recenzije reviews bewertungen google ocjene automatski',
  'price.seo-aeo': 'cijena price preis seo aeo geo vidljivost lokalno lokalni content struktura pretplata',
  'price.growth-campaigns': 'cijena price preis kampanje campaigns oglasi ads meta google budzet mjesecno',
  'price.speed-optimization': 'cijena price preis brzina speed geschwindigkeit optimizacija ucitavanje performanse',
  'price.content-system': 'cijena price preis sadrzaj content copy video vizuali sistem plan',
  'price.digital-partner': 'cijena price preis partner saradnja kombinovano paket mjesecno kontinuirano',
  'price.smart-website-launch': 'cijena price preis smart website launch cinematic lead assistant pet stranica',
  'price.landing-starter': 'cijena price preis landing stranica jedna cilj kampanja starter',
  'price.site-care': 'cijena price preis odrzavanje maintenance wartung podrska mjesecno care sigurnost',
};

// Page-aware boost map: when the visitor is on this page, these corpus ids are more relevant.
const PAGE_BOOSTS: Record<string, string[]> = {
  visibility: ['service.visibility', 'price.seo-aeo'],
  convert: ['service.convert', 'price.web-presence', 'price.landing-starter'],
  growth: ['service.growth', 'price.growth-campaigns'],
  launch: ['service.launch', 'price.smart-website-launch'],
  contact: ['service.contact'],
  concierge: ['price.ai-concierge'],
  'second-brain': ['price.second-brain-os'],
  automate: ['price.workflow-starter'],
  content: ['price.content-system'],
  pricing: ['price.web-presence', 'price.landing-starter', 'price.digital-partner'],
};

export type IndexDoc = { source: KnowledgeSource; text: number; tags: Set<string>; tf: Map<string, number> };
export type Retrieved = { id: string; score: number; source: KnowledgeSource };

function buildDoc(source: KnowledgeSource): IndexDoc {
  const tf = new Map<string, number>();
  for (const tok of tokenize(source.text)) tf.set(tok, (tf.get(tok) ?? 0) + 1);
  const tags = new Set(tokenize(TAGS[source.id] ?? ''));
  return { source, text: 1, tags, tf };
}

export type LexicalIndex = { docs: IndexDoc[]; df: Map<string, number>; total: number };

/** Build the deterministic index once from the compiled corpus. */
export function buildIndex(): LexicalIndex {
  const docs = compileCorpus().sources.map(buildDoc);
  const df = new Map<string, number>();
  for (const d of docs) for (const tok of new Set([...d.tf.keys(), ...d.tags])) df.set(tok, (df.get(tok) ?? 0) + 1);
  return { docs, df, total: docs.length };
}

// Weights: a tag hit is authoritative for topic routing; a body hit is supporting; rarer terms (low df) count more.
const TAG_WEIGHT = 3;
const BODY_WEIGHT = 1;
const PAGE_BOOST = 1.5;

/** Score one document for a set of stemmed query tokens, applying the page boost when relevant. */
export function scoreDoc(doc: IndexDoc, queryTokens: string[], index: LexicalIndex, boostIds: Set<string>): number {
  let score = 0;
  for (const tok of new Set(queryTokens)) {
    const df = index.df.get(tok) ?? 0;
    if (df === 0) continue;
    const idf = Math.log(1 + index.total / df);
    if (doc.tags.has(tok)) score += TAG_WEIGHT * idf;
    const bodyTf = doc.tf.get(tok) ?? 0;
    if (bodyTf > 0) score += BODY_WEIGHT * idf * (1 + Math.log(bodyTf));
  }
  if (score > 0 && boostIds.has(doc.source.id)) score *= PAGE_BOOST;
  return score;
}

export function boostSet(pageId?: string): Set<string> {
  return new Set(pageId ? PAGE_BOOSTS[pageId] ?? [] : []);
}