import { offers, products, posts, type PageId } from './catalogue';
import type { Section } from './contracts';
// Page awareness registry (§8): a pure function of offers/products/posts plus a hand-authored home-section map.
// Existing ids only. No generated page is changed. serviceIds reference existing catalogue pageIds.
type HomeSection = { label: string; serviceIds: PageId[] };
export const homeSections: Record<Section, HomeSection> = {
  cinematic: { label: 'Cinematic web stranice', serviceIds: ['cinematic', 'convert'] },
  launch: { label: 'Smart Website Launch', serviceIds: ['storefront', 'convert'] },
  storefront: { label: 'Smart Storefront', serviceIds: ['storefront'] },
  examples: { label: 'Primjeri web stranica', serviceIds: ['work', 'eynna', 'star'] },
  services: { label: 'Usluge', serviceIds: ['services'] },
  growth: { label: 'Rast i oglašavanje', serviceIds: ['growth', 'meta-ads', 'google-ads'] },
  receptionist: { label: 'AI Receptionist', serviceIds: ['receptionist', 'lead-desk'] },
  aeo: { label: 'AEO vidljivost', serviceIds: ['visibility', 'tracker'] },
  value: { label: 'Vrijednost', serviceIds: ['services'] },
  work: { label: 'Radovi', serviceIds: ['work'] },
  transformations: { label: 'Transformacije', serviceIds: ['work'] },
  pricing: { label: 'Cjenovnik', serviceIds: ['services'] },
  shop: { label: 'Shop', serviceIds: ['storefront'] },
  blog: { label: 'Uvidi i blog', serviceIds: [] },
  process: { label: 'Proces saradnje', serviceIds: ['services'] },
  strategy: { label: 'Strategija', serviceIds: ['services'] },
};
export const sectionIds = Object.keys(homeSections) as Section[];
function isSection(value: string | undefined): value is Section { return value !== undefined && Object.hasOwn(homeSections, value); }
export type PageType = 'home' | 'service' | 'shop' | 'blog' | 'concierge';
export type PageEntry = { pageId: PageId; title: string; type: PageType };
/** Build the page registry from the catalogue. Pure and deterministic. */
export function buildPageRegistry(): Map<PageId, PageEntry> {
  const registry = new Map<PageId, PageEntry>();
  registry.set('home', { pageId: 'home', title: 'Digital X — Početna', type: 'home' });
  for (const offer of offers) {
    const type: PageType = offer.id === 'concierge' ? 'concierge' : 'service';
    registry.set(offer.id, { pageId: offer.id, title: offer.name, type });
  }
  void products; void posts;
  return registry;
}
const registry = buildPageRegistry();
export type PageContextInput = { pageId?: string; section?: string };
export type ResolvedPageContext = { pageId: PageId; title: string; type: PageType; section?: Section; focusServiceIds: PageId[]; line: string };
/** Server-side resolution: drop unknown ids instead of failing; derive title/type and one prompt line. */
export function resolvePageContext(input: PageContextInput): ResolvedPageContext | null {
  const entry = input.pageId && registry.has(input.pageId as PageId) ? registry.get(input.pageId as PageId)! : null;
  if (!entry) return null;
  const section = isSection(input.section) ? input.section : undefined;
  const focusServiceIds = section ? homeSections[section].serviceIds : [];
  const sectionText = section ? ` — section "${section}"${focusServiceIds.length ? ` (services: ${focusServiceIds.join(', ')})` : ''}` : '';
  const line = `Visitor is viewing: ${entry.title} page${sectionText}.`;
  return { pageId: entry.pageId, title: entry.title, type: entry.type, section, focusServiceIds, line };
}