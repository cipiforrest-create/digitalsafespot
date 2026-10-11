import { z } from 'zod';
// T16: the closed, deterministic fact model produced by extractFacts and consumed by gradeChecks.
// Facts are numbers, booleans, enums and bounded strings only; page-controlled snippets are length-capped
// so a hostile page can never inflate stored state. Grading (severity, wording, weights) lives in gradeChecks.
export const auditFactsSchema = z.object({
  url: z.string(),
  status: z.number(),
  ok: z.boolean(),
  https: z.boolean(),
  title: z.string(),
  description: z.string(),
  canonical: z.string().nullable(),
  headings: z.array(z.string()),
  h2Count: z.number(),
  wordCount: z.number(),
  mentionsServices: z.boolean(),
  images: z.object({ total: z.number(), withAlt: z.number() }).strict(),
  schema: z.object({ types: z.array(z.string()), invalid: z.number() }).strict(),
  ogTitle: z.string().nullable(),
  ogImage: z.string().nullable(),
  noindex: z.boolean(),
  viewport: z.string().nullable(),
  lang: z.string().nullable(),
  hasContact: z.boolean(),
}).strict();
export type AuditFacts = z.infer<typeof auditFactsSchema>;
// A closed union of every fact name. `null` in a string field is the explicit "unknown / not present" state.
export type FactKey = keyof AuditFacts;
export const factKeys = [
  'url', 'status', 'ok', 'https', 'title', 'description', 'canonical', 'headings', 'h2Count', 'wordCount',
  'mentionsServices', 'images', 'schema', 'ogTitle', 'ogImage', 'noindex', 'viewport', 'lang', 'hasContact',
] as const satisfies readonly FactKey[];
// The maximum length for any page-controlled string kept in the fact model.
export const FACT_STRING_MAX = 4000;