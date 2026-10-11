import { z } from 'zod';
import { goalSchema } from './contracts';
// T21 ProjectBrief contract. A progressive, evidence-backed brief assembled deterministically from the visitor's
// OWN words (and an optional owner-bound audit URL). Every captured value must be quotable from a visitor message
// or an audit — the server never invents a value. Unstated fields (e.g. budget) remain null, never guessed. A
// declined field is remembered so it is never asked again. The brief drives a strict one-question-at-a-time policy.

/** Bump when the brief shape or collection policy changes; it is part of the stored state. */
export const PROJECT_BRIEF_VERSION = 1;

// The closed set of fields a brief may hold. Order here is the deterministic ask priority (earliest first).
export const briefFieldKeys = [
  'problem', 'company', 'website', 'budget', 'timeline', 'contactName', 'contactEmail',
] as const;
export type BriefFieldKey = (typeof briefFieldKeys)[number];

// Fields that MUST be known (or explicitly declined is NOT enough) before a brief is ready for owner review.
export const REQUIRED_FIELDS: readonly BriefFieldKey[] = ['problem', 'contactName', 'contactEmail'];

// Provenance of a captured value. 'visitor' = quoted from a visitor message; 'audit' = derived from an owner-bound
// audit record; 'context' = the deterministically selected goal. There is no 'model' provenance — nothing invented.
export const briefProvenanceSchema = z.enum(['visitor', 'audit', 'context']);
export type BriefProvenance = z.infer<typeof briefProvenanceSchema>;

// One piece of evidence for a field. `quote` is the exact supporting text; multiple pieces stack over turns.
export const briefEvidenceSchema = z.object({
  source: briefProvenanceSchema,
  quote: z.string().min(1).max(400),
  at: z.number(),
}).strict();
export type BriefEvidence = z.infer<typeof briefEvidenceSchema>;

export const briefFieldStatusSchema = z.enum(['unknown', 'known', 'declined']);
export type BriefFieldStatus = z.infer<typeof briefFieldStatusSchema>;

export const briefFieldSchema = z.object({
  key: z.enum(briefFieldKeys),
  value: z.string().min(1).max(400).nullable(),
  status: briefFieldStatusSchema,
  evidence: z.array(briefEvidenceSchema).max(6),
}).strict();
export type BriefField = z.infer<typeof briefFieldSchema>;

export const briefStatusSchema = z.enum(['collecting', 'ready_for_review']);
export type BriefStatus = z.infer<typeof briefStatusSchema>;

export const projectBriefSchema = z.object({
  v: z.literal(1),
  version: z.number().int(),
  sid: z.string(),
  goal: goalSchema.nullable(),
  fields: z.array(briefFieldSchema).length(briefFieldKeys.length),
  // The field asked on the previous turn, so the next visitor message is attributed to it (one-question policy).
  askedField: z.enum(briefFieldKeys).nullable(),
  status: briefStatusSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
}).strict();
export type ProjectBrief = z.infer<typeof projectBriefSchema>;

// A bounded, owner-facing review projection. Emitted only when the brief is ready. Never exposes internal state.
export type BriefReviewLine = { key: BriefFieldKey; label: string; value: string | null; status: BriefFieldStatus };
export type BriefCard = {
  status: BriefStatus;
  question: string | null;              // the single next question, or null when ready for review
  askedField: BriefFieldKey | null;
  lines: BriefReviewLine[];
  summary: string | null;               // deterministic review summary, only when ready_for_review
};
