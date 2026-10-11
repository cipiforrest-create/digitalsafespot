import { z } from 'zod';
// T18: the contract for interpreting a persisted, owner-bound audit. The model never sees raw page HTML; it only
// receives the closed, deterministic AuditFacts digest (which is itself untrusted DATA) and must cite a valid
// fact reference for every finding. Everything here is additive and independent of the legacy chat/audit flow.

/** Bump when the interpretation shape or prompt policy changes; it is part of the cache key so old cache misses. */
export const INTERPRETATION_VERSION = 1;

// A finding's polarity is a closed enum so it can be checked against the deterministic facts for contradictions.
export const interpretationPolarity = z.enum(['good', 'bad']);
export type InterpretationPolarity = z.infer<typeof interpretationPolarity>;

// The model-facing REASONING object. `factRef` is a free string here so an INVENTED reference is caught by our
// validator (a distinct, testable rejection) rather than only by schema parsing.
export const modelFindingSchema = z.object({
  factRef: z.string().min(1).max(40),
  polarity: interpretationPolarity,
  note: z.string().min(1).max(240),
}).strict();
export const auditReasoningSchema = z.object({
  summary: z.string().min(1).max(400),
  findings: z.array(modelFindingSchema).min(1).max(6),
  nextAction: z.string().min(1).max(240),
}).strict();
export type AuditReasoning = z.infer<typeof auditReasoningSchema>;

// The stored / returned interpretation. `source` records whether it came from the model or the deterministic
// rules fallback; `factsHash` + `version` bind a cache entry to the exact facts it interpreted.
export const interpretationFindingSchema = modelFindingSchema;
export type InterpretationFinding = z.infer<typeof interpretationFindingSchema>;
export const auditInterpretationSchema = z.object({
  v: z.literal(2),
  auditId: z.string().uuid(),
  factsHash: z.string().min(1).max(64),
  version: z.number().int(),
  source: z.enum(['model', 'rules']),
  summary: z.string().min(1).max(600),
  findings: z.array(interpretationFindingSchema).min(1).max(8),
  nextAction: z.string().min(1).max(400),
}).strict();
export type AuditInterpretation = z.infer<typeof auditInterpretationSchema>;