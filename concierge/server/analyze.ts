import * as cheerio from 'cheerio';
import type { AuditCategory, AuditCheck, Severity } from '../shared/contracts';
import { FACT_STRING_MAX, type AuditFacts } from '../shared/audit-facts';
// Adapted from the existing auditor's html.ts and JSON-LD graph parser.
export function parseSchema(html: string): { types: string[]; invalid: number } {
  const $ = cheerio.load(html); const types = new Set<string>(); let invalid = 0; let visited = 0;
  function collect(node: unknown, depth = 0) {
    if (depth > 30 || ++visited > 5000) return;
    if (Array.isArray(node)) { node.forEach(v => collect(v, depth + 1)); return; }
    if (node && typeof node === 'object') {
      const value = node as Record<string, unknown>;
      const names = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
      for (const name of names) if (typeof name === 'string') types.add(name.replace(/^https?:\/\/schema.org\//, ''));
      for (const [key, child] of Object.entries(value)) if (key !== '@context' && typeof child === 'object') collect(child, depth + 1);
    }
  }
  $('script[type="application/ld+json"]').each((_, el) => { try { collect(JSON.parse($(el).text())); } catch { invalid++; } });
  return { types: [...types].slice(0,80), invalid };
}
type Grade = { severity: Severity; evidence: string; recommendation?: string };
// Each check is graded good / warning / critical with a weight; the report score is their weighted mean.
export function extractFacts(html: string, url: string, status: number): AuditFacts {
  const $ = cheerio.load(html); const schema = parseSchema(html);
  const ok = status >= 200 && status < 300;
  const title = $('title').first().text().trim();
  const description = $('meta[name="description" i]').attr('content')?.trim() || '';
  const canonicalRaw = $('link[rel="canonical" i]').attr('href');
  const headings = $('h1').map((_, el) => $(el).text().trim()).get();
  const h2 = $('h2').length;
  const main = ($('main').text() || $('body').text()).replace(/\s+/g, ' ').trim(); const words = main ? main.split(' ').length : 0;
  const images = $('img'); const withAlt = images.filter((_, el) => Boolean($(el).attr('alt')?.trim())).length;
  const ogTitle = $('meta[property="og:title" i]').attr('content'); const ogImage = $('meta[property="og:image" i]').attr('content');
  const noindex = /noindex/i.test($('meta[name="robots" i]').attr('content') || '');
  const viewport = $('meta[name="viewport" i]').attr('content'); const lang = $('html').attr('lang');
  const hasContact = $('a[href^="mailto:"],a[href^="tel:"],form').length > 0;
  const mentionsServices = /service|solution|offer|uslug|rješen|ponud|angebot|leistung/i.test(main);
  const cap = (v: string) => v.slice(0, FACT_STRING_MAX);
  return {
    url, status, ok, https: url.startsWith('https:'), title: cap(title), description: cap(description),
    canonical: canonicalRaw != null ? cap(canonicalRaw) : null, headings: headings.map(cap), h2Count: h2,
    wordCount: words, mentionsServices, images: { total: images.length, withAlt }, schema,
    ogTitle: ogTitle != null ? cap(ogTitle) : null, ogImage: ogImage != null ? cap(ogImage) : null, noindex,
    viewport: viewport != null ? cap(viewport) : null, lang: lang != null ? cap(lang) : null, hasContact,
  };
}
export function gradeChecks(facts: AuditFacts): AuditCheck[] {
  const { url, status } = facts; const schema = facts.schema; const checks: AuditCheck[] = [];
  const add = (id: string, title: string, category: AuditCategory, weight: number, g: Grade) => checks.push({ id, title, category, weight, severity: g.severity, status: g.severity === 'good' || g.severity === 'info' ? 'found' : 'attention', evidence: g.evidence.slice(0, 1200), recommendation: g.severity === 'good' || g.severity === 'info' ? '' : (g.recommendation || '').slice(0, 600), url });
  const ok = facts.ok;
  add('access', 'Dostupnost stranice', 'Tehnička osnova', 10, ok ? { severity: 'good', evidence: `Server je vratio HTTP ${status}. Ovo je mrežna provjera, ne WCAG analiza.` } : { severity: 'critical', evidence: `Server je vratio HTTP ${status}.`, recommendation: 'Provjerite hosting, preusmjeravanja i dostupnost stranice.' });
  if (!ok) return checks;
  add('https', 'Sigurna veza (HTTPS)', 'Tehnička osnova', 8, url.startsWith('https:') ? { severity: 'good', evidence: 'Stranica se otvara preko HTTPS-a.' } : { severity: 'critical', evidence: 'Konačna adresa nije HTTPS.', recommendation: 'Uključite SSL certifikat i trajno preusmjerite HTTP na HTTPS; preglednici inače označavaju stranicu kao nesigurnu.' });
  const title = facts.title; const description = facts.description;
  add('title', 'Naslov stranice', 'Vidljivost u pretrazi i AI', 8, !title ? { severity: 'critical', evidence: 'Vraćeni HTML nema naslov stranice.', recommendation: 'Dodajte jasan naslov (15–65 znakova) s nazivom firme i glavnom uslugom.' }
    : title.length < 15 || title.length > 65 ? { severity: 'warning', evidence: `${title} (${title.length} znakova)`, recommendation: 'Naslov od 15–65 znakova se u pretrazi prikazuje cijeli i jasno kaže šta nudite.' } : { severity: 'good', evidence: `${title} (${title.length} znakova)` });
  add('description', 'Opis za pretragu', 'Vidljivost u pretrazi i AI', 6, !description ? { severity: 'critical', evidence: 'Meta opis nije pronađen; pretraživač sam bira tekst ispod naslova.', recommendation: 'Napišite opis od 70–165 znakova: kome pomažete, šta nudite i sljedeći korak.' }
    : description.length < 70 || description.length > 165 ? { severity: 'warning', evidence: `${description} (${description.length} znakova)`, recommendation: 'Opis od 70–165 znakova se prikazuje cijeli i povećava klikove iz pretrage.' } : { severity: 'good', evidence: `${description} (${description.length} znakova)` });
  const canonical = facts.canonical ?? undefined;
  add('canonical', 'Kanonski URL', 'Vidljivost u pretrazi i AI', 4, canonical ? { severity: 'good', evidence: canonical } : { severity: 'warning', evidence: 'Kanonska poveznica nije pronađena.', recommendation: 'Navedite željeni javni URL da se duplikati stranice ne takmiče u pretrazi.' });
  const headings = facts.headings;
  add('headings', 'Glavni naslov (H1)', 'Sadržaj i poruka', 6, headings.length === 1 ? { severity: 'good', evidence: headings[0] || 'Jedan glavni naslov.' } : headings.length === 0 ? { severity: 'critical', evidence: 'Stranica nema glavni naslov (H1).', recommendation: 'Dodajte jedan jasan H1 koji kaže šta nudite i za koga.' } : { severity: 'warning', evidence: `${headings.length} glavnih naslova. ${headings.join(' · ')}`, recommendation: 'Koristite jedan jasan glavni naslov i logičnu hijerarhiju podnaslova.' });
  const h2 = facts.h2Count;
  add('structure', 'Podnaslovi i struktura', 'Sadržaj i poruka', 3, h2 >= 2 ? { severity: 'good', evidence: `${h2} podnaslova (H2) dijeli sadržaj na jasne cjeline.` } : { severity: 'warning', evidence: `${h2} podnaslova (H2).`, recommendation: 'Podijelite sadržaj u cjeline s podnaslovima; ljudi i AI asistenti lakše pronalaze odgovore.' });
  const words = facts.wordCount;
  add('content', 'Količina sadržaja', 'Sadržaj i poruka', 5, words >= 300 ? { severity: 'good', evidence: `Oko ${words} riječi teksta u HTML-u.` } : words >= 120 ? { severity: 'warning', evidence: `Oko ${words} riječi teksta u HTML-u.`, recommendation: 'Dodajte konkretan tekst o uslugama, procesu i čestim pitanjima (300+ riječi).' } : { severity: 'critical', evidence: `Samo oko ${words} riječi teksta u vraćenom HTML-u.`, recommendation: 'Stranica ima premalo teksta koji pretraživači i AI mogu pročitati; objasnite ponudu riječima, ne samo slikama.' });
  const images = { length: facts.images.total }; const withAlt = facts.images.withAlt; const ratio = images.length ? withAlt / images.length : 1;
  add('alt', 'Opisi slika (alt)', 'Sadržaj i poruka', 4, !images.length ? { severity: 'info', evidence: 'U HTML-u nema slika za provjeru.' } : ratio >= .9 ? { severity: 'good', evidence: `${withAlt} od ${images.length} slika ima opis.` } : ratio >= .6 ? { severity: 'warning', evidence: `${withAlt} od ${images.length} slika ima opis.`, recommendation: 'Dodajte kratke opise slikama: pomažu pristupačnosti i pretrazi slika.' } : { severity: 'critical', evidence: `Samo ${withAlt} od ${images.length} slika ima opis.`, recommendation: 'Većina slika nema opis; čitači ekrana i pretraživači ih ne razumiju.' });
  add('schema', 'Strukturirani podaci', 'Vidljivost u pretrazi i AI', 5, schema.invalid > 0 ? { severity: 'critical', evidence: `Neispravni JSON-LD blokovi: ${schema.invalid}. ${schema.types.join(', ')}`, recommendation: 'Popravite neispravne JSON-LD blokove; pretraživači ih ignorišu.' } : schema.types.length ? { severity: 'good', evidence: `Pronađeni tipovi: ${schema.types.join(', ')}.` } : { severity: 'warning', evidence: 'Nisu pronađeni tipizirani JSON-LD entiteti.', recommendation: 'Opišite firmu i usluge tačnim strukturiranim podacima (Organization, LocalBusiness, Service).' });
  const org = schema.types.some(t => ['Organization', 'LocalBusiness', 'ProfessionalService'].includes(t));
  add('organization', 'Podaci o poslovnom subjektu', 'Vidljivost u pretrazi i AI', 4, org ? { severity: 'good', evidence: schema.types.filter(t => /Organization|Business|Service/.test(t)).join(', ') } : { severity: 'warning', evidence: 'JSON-LD ne sadrži odgovarajući tip poslovnog subjekta.', recommendation: 'Povežite naziv organizacije, web stranicu, adresu i kontakt u Organization/LocalBusiness zapisu.' });
  const ogTitle = facts.ogTitle; const ogImage = facts.ogImage;
  add('social', 'Pregled pri dijeljenju', 'Vidljivost u pretrazi i AI', 3, ogTitle && ogImage ? { severity: 'good', evidence: 'Open Graph naslov i slika su postavljeni.' } : { severity: 'warning', evidence: `${ogTitle ? '' : 'og:title nedostaje. '}${ogImage ? '' : 'og:image nedostaje.'}`.trim(), recommendation: 'Dodajte Open Graph naslov i sliku da link izgleda profesionalno na Facebooku, WhatsAppu i LinkedInu.' });
  const faq = schema.types.includes('FAQPage');
  checks.push({ id: 'faq', title: 'Pitanja i odgovori', category: 'Vidljivost u pretrazi i AI', weight: 0, severity: 'info', status: 'found', evidence: faq ? 'FAQPage oznake su pronađene; ne garantuju vidljivost ili proširene rezultate.' : 'FAQPage oznake nisu pronađene. Opcionalne su i prikladne samo uz stvarna pitanja i odgovore.', recommendation: '', url });
  const hasContact = facts.hasContact;
  add('contact', 'Put do upita', 'Put do upita', 10, hasContact ? { severity: 'good', evidence: 'Pronađen je obrazac, e-mail ili telefonska poveznica; slanje nije testirano.' } : { severity: 'critical', evidence: 'Vraćeni HTML nema obrazac, e-mail ili telefonsku poveznicu.', recommendation: 'Ponudite jasan, pristupačan način kontakta na svakoj stranici.' });
  add('services', 'Informacije o uslugama', 'Put do upita', 6, facts.mentionsServices ? { severity: 'good', evidence: 'Tekst spominje usluge ili ponudu. Ovo je ograničena provjera izraza.' } : { severity: 'warning', evidence: 'U tekstu nisu pronađeni izrazi vezani za usluge i ponudu.', recommendation: 'Objasnite kome pomažete, šta nudite i sljedeći korak.' });
  const noindex = facts.noindex;
  add('indexing', 'Uputa za indeksiranje', 'Vidljivost u pretrazi i AI', 10, noindex ? { severity: 'critical', evidence: 'HTML sadrži noindex uputu: pretraživači ne prikazuju ovu stranicu.', recommendation: 'Uklonite noindex ako stranica treba biti pronađena u pretrazi.' } : { severity: 'good', evidence: 'HTML nema noindex uputu. To ne dokazuje da je stranica indeksirana.' });
  add('mobile', 'Mobilni prikaz', 'Tehnička osnova', 8, facts.viewport ? { severity: 'good', evidence: 'Viewport zapis postoji; stvarni raspored nije vizuelno testiran.' } : { severity: 'critical', evidence: 'Viewport zapis nedostaje; na telefonu se stranica prikazuje umanjeno.', recommendation: 'Dodajte viewport zapis i testirajte stvarni mobilni raspored.' });
  add('language', 'Jezik stranice', 'Tehnička osnova', 2, facts.lang ? { severity: 'good', evidence: `Označen jezik: ${facts.lang}.` } : { severity: 'warning', evidence: 'Jezik stranice nije označen.', recommendation: 'Dodajte lang atribut (npr. bs) za čitače ekrana i pretraživače.' });
  return checks;
}
export function analyzeHtml(html: string, url: string, status: number): AuditCheck[] { return gradeChecks(extractFacts(html, url, status)); }
// Reuses longest-match precedence, with consecutive user-agent grouping corrected.
export function robotsAllows(text: string, path: string, agent = '*'): boolean {
  const groups: { agents: string[]; rules: { allow: boolean; pattern: string }[] }[] = [];
  let group = { agents: [] as string[], rules: [] as { allow: boolean; pattern: string }[] };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim(); const colon = line.indexOf(':'); if (colon < 0) continue;
    const field = line.slice(0,colon).toLowerCase().trim(); const value = line.slice(colon+1).trim();
    if (field === 'user-agent') { if (group.rules.length) { groups.push(group); group = { agents: [], rules: [] }; } group.agents.push(value.toLowerCase()); }
    else if (['allow','disallow'].includes(field) && group.agents.length && value) group.rules.push({ allow: field === 'allow', pattern: value });
  }
  groups.push(group); const exact = groups.filter(g => g.agents.includes(agent.toLowerCase())); const selected = exact.length ? exact : groups.filter(g => g.agents.includes('*'));
  const rules = selected.flatMap(g => g.rules).filter(r => new RegExp('^' + r.pattern.split('*').map(part => part.replace(/[.+?^${}()|[\]\\]/g,'\\$&')).join('.*').replace(/\\\$$/,'$')).test(path)).sort((a,b) => b.pattern.length-a.pattern.length || Number(b.allow)-Number(a.allow));
  return rules[0]?.allow ?? true;
}
