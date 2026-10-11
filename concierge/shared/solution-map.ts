import { z } from 'zod';
import { goalSchema } from './contracts';
import { capabilityIds } from './capabilities';
// T20 SolutionMap contract. One evidence-linked, bounded map built from a visitor problem, deterministic
// conversation/T19 signals and (optionally) validated T18 audit evidence. Every capability must be a closed,
// approved T19 capability id — the model may never invent a capability, a service name or a piece of evidence.
// `mode` records whether the map came from the bounded reasoning call (REASONING) or the deterministic
// fallback (FALLBACK). `sourceHash` + `version` make equivalent inputs reuse a cached map (idempotency).

/** Bump when the map shape or reasoning policy changes; it is part of the cache key so old entries miss. */
export const SOLUTION_MAP_VERSION = 1;
/** Owner rule (mirrors T19): at most one primary + one supporting capability. Never "you need everything". */
export const MAX_SOLUTION_CAPABILITIES = 2;

// The closed approved capability id set, as a schema, so an unknown id is a distinct, testable rejection.
export const capabilityIdSchema = z.enum([...capabilityIds] as [string, ...string[]]);

export const solutionModeSchema = z.enum(['REASONING', 'FALLBACK']);
export type SolutionMode = z.infer<typeof solutionModeSchema>;

// Evidence is always built deterministically by the server, never invented by the model. `kind` records the
// provenance: a quoted visitor statement, a deterministic conversation/fact signal, a session-bound T18 audit
// reference, or the approved T19 capability mapping itself.
export const evidenceKindSchema = z.enum(['quote', 'signal', 'audit', 'capability']);
export type EvidenceKind = z.infer<typeof evidenceKindSchema>;
export const solutionEvidenceSchema = z.object({
  id: z.string().min(1).max(8),
  kind: evidenceKindSchema,
  detail: z.string().min(1).max(400),
}).strict();
export type SolutionEvidence = z.infer<typeof solutionEvidenceSchema>;

export const solutionCapabilitySchema = z.object({
  id: capabilityIdSchema,
  title: z.string().min(1).max(120),
  role: z.enum(['primary', 'supporting']),
  serviceIds: z.array(z.string().min(1).max(60)).min(1).max(8),
  rationale: z.string().min(1).max(300),
  evidenceRefs: z.array(z.string().min(1).max(8)).min(1).max(4),
  // CAP-03 only: the mandatory not-Core-Web-Vitals / no-speed-gain-promise evidence note.
  speedEvidenceNote: z.string().min(1).max(300).optional(),
}).strict();
export type SolutionCapability = z.infer<typeof solutionCapabilitySchema>;

export const solutionPhaseSchema = z.object({
  title: z.string().min(1).max(80),
  detail: z.string().min(1).max(300),
}).strict();
export type SolutionPhase = z.infer<typeof solutionPhaseSchema>;

export const solutionMapSchema = z.object({
  v: z.literal(1),
  id: z.string().uuid(),
  version: z.number().int(),
  mode: solutionModeSchema,
  goal: goalSchema.nullable(),
  problem: z.string().min(1).max(600),
  evidenceRefs: z.array(solutionEvidenceSchema).min(1).max(12),
  capabilities: z.array(solutionCapabilitySchema).min(1).max(MAX_SOLUTION_CAPABILITIES),
  diagnosis: z.string().min(1).max(600),
  phases: z.array(solutionPhaseSchema).min(1).max(4),
  unknowns: z.array(z.string().min(1).max(120)).max(6),
  nextAction: z.string().min(1).max(400),
  sourceHash: z.string().min(1).max(64),
  createdAt: z.number(),
}).strict();
export type SolutionMap = z.infer<typeof solutionMapSchema>;

// The model-facing REASONING object. `id` and `evidenceRefs` are free strings here so that an unknown capability
// id or an unsupported evidence reference is caught by the validator (a distinct, testable rejection) rather than
// only by schema parsing. The model never sets role, serviceIds or speedEvidenceNote — the server derives those.
export const solutionReasoningSchema = z.object({
  diagnosis: z.string().min(1).max(600),
  capabilities: z.array(z.object({
    id: z.string().min(1).max(10),
    rationale: z.string().min(1).max(300),
    evidenceRefs: z.array(z.string().min(1).max(8)).min(1).max(4),
  }).strict()).min(1).max(MAX_SOLUTION_CAPABILITIES),
  phases: z.array(solutionPhaseSchema).min(1).max(4),
  unknowns: z.array(z.string().min(1).max(120)).max(6),
  nextAction: z.string().min(1).max(400),
}).strict();
export type SolutionReasoning = z.infer<typeof solutionReasoningSchema>;

// A bounded, visitor-safe card projection of a SolutionMap for the UI (T23). Never exposes the reasoning chain.
export type SolutionCard = {
  problem: string;
  diagnosis: string;
  capabilities: { id: string; title: string; role: string; rationale: string; speedEvidenceNote?: string }[];
  evidence: string[];
  phases: SolutionPhase[];
  nextAction: string;
  mode: SolutionMode;
};
