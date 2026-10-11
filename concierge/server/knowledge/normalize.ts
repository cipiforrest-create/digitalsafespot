// T11: deterministic, dependency-free multilingual normalization for lexical retrieval (bs/hr/sr/en/de).
// Serbian Cyrillic is transliterated to Latin, diacritics are folded, then a light suffix stemmer unifies
// case/plural variants so a query in one language can match the Bosnian corpus text and its search tags.

const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'dj', е: 'e', ж: 'z', з: 'z', и: 'i', ј: 'j', к: 'k', л: 'l',
  љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r', с: 's', т: 't', ћ: 'c', у: 'u', ф: 'f', х: 'h',
  ц: 'c', ч: 'c', џ: 'dz', ш: 's',
};
const DIACRITICS: Record<string, string> = { č: 'c', ć: 'c', đ: 'dj', š: 's', ž: 'z', ä: 'a', ö: 'o', ü: 'u', ß: 'ss' };
// Non-distinguishing function words across the five supported languages.
const STOPWORDS = new Set([
  'the', 'a', 'an', 'of', 'for', 'to', 'is', 'are', 'and', 'or', 'on', 'in', 'it', 'do', 'does', 'can', 'could',
  'would', 'what', 'which', 'your', 'my', 'me', 'we', 'you', 'how', 'much', 'with', 'about', 'more',
  'da', 'li', 'je', 'su', 'sam', 'mi', 'vi', 'se', 'na', 'za', 'ili', 'sta', 'koji', 'koja', 'koje', 'koliko',
  'kako', 'gdje', 'gde', 'sto', 'nam', 'vas', 'ce', 'te',
  'was', 'wie', 'der', 'die', 'das', 'und', 'oder', 'fur', 'ich', 'wir', 'sie', 'ist', 'sind', 'kann', 'wo', 'mir',
]);
// Suffixes stripped once, longest first, only when a stem of length >= 4 remains.
const SLAVIC_SUFFIXES = ['ovima', 'ijama', 'ama', 'ima', 'ova', 'om', 'em', 'im', 'ih', 'ju', 'je', 'ja', 'ma', 'a', 'e', 'i', 'o', 'u'];

export function fold(input: string): string {
  let out = '';
  for (const ch of input.toLowerCase()) out += CYRILLIC[ch] ?? DIACRITICS[ch] ?? ch;
  return out;
}

export function stem(word: string): string {
  let w = word;
  if (w.length <= 3) return w;
  // English plural.
  if (w.length > 4 && w.endsWith('es')) w = w.slice(0, -2);
  else if (w.length > 4 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
  // Slavic case/number ending.
  for (const suf of SLAVIC_SUFFIXES) {
    if (w.endsWith(suf) && w.length - suf.length >= 4) { w = w.slice(0, -suf.length); break; }
  }
  return w;
}

/** Fold, split, drop stopwords, stem. Returns stemmed tokens in order (duplicates preserved). */
export function tokenize(input: string): string[] {
  const raw = fold(input).replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/);
  const out: string[] = [];
  for (const token of raw) {
    if (token.length < 2 || STOPWORDS.has(token)) continue;
    const s = stem(token);
    if (s.length >= 2 && !STOPWORDS.has(s)) out.push(s);
  }
  return out;
}