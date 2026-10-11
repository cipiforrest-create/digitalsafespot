import { z } from 'zod';
// P3d lead.create contracts. This is the SERVER-OWNED, closed data contract for the first live-action capability:
// turning a natural-language enquiry into a durable, verifiable lead record. Nothing here is a generic tool: the
// fields are a fixed, strict, length-capped set, and the stored record is schema-validated on every read so a
// corrupt/injected payload can never be persisted or replayed. The lead PAYLOAD travels inside the P3a change
// `after` field as canonical JSON (the preview pipeline sanitizes free text, so the payload is parsed + revalidated
// here rather than trusted as prose). This module is shared by the chat brain (field collection), the provider
// (apply/verify) and the lead store (persistence).

/** Bump when the lead-create input/record shape changes; it is part of the content hash so old records miss. */
export const LEAD_CREATE_VERSION = 1;

// The closed set of required lead fields. These mirror the existing ProjectBrief field keys (contactName/
// contactEmail) so the concierge's multi-turn collection reuses one vocabulary. `consent` is required and must be
// true — a lead is never created without explicit consent. Optional fields default to empty, never fabricated.
export const REQUIRED_LEAD_FIELDS = ['contactName', 'contactEmail', 'message'] as const;
export type RequiredLeadField = (typeof REQUIRED_LEAD_FIELDS)[number];

// A pragmatic, bounded email shape. Deliberately NOT a permissive catch-all: it rejects whitespace, multiple @,
// and a missing TLD so a malformed address cannot be persisted as a "real" lead.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// A phone is optional and loosely validated (digits, spaces, +, -, parentheses) so an obviously bogus value is rejected.
const PHONE_RE = /^[+()\d][\d\s()+-]{4,24}$/;

/**
 * The strict, client-collectable lead input. The chat brain assembles this across turns from the visitor's own
 * words; the server validates it before it is ever turned into an execution change. Strict + length-capped so no
 * extra field can be smuggled, and every string is bounded like the T13 tool input / ProjectBrief fields.
 */
export const leadCreateInputSchema = z.object({
  contactName: z.string().min(1).max(120),
  contactEmail: z.string().min(3).max(200).regex(EMAIL_RE, 'A valid email address is required.'),
  message: z.string().min(1).max(2000),
  company: z.string().max(160).default(''),
  phone: z.string().max(40).regex(PHONE_RE, 'Enter a valid phone number.').or(z.literal('')).default(''),
  // The on-site section/source the enquiry originated from (bounded free text; used for routing context only).
  source: z.string().max(80).default('concierge'),
  // Explicit consent is mandatory. A lead is never created from an unconsented collection.
  consent: z.literal(true),
}).strict();
export type LeadCreateInput = z.infer<typeof leadCreateInputSchema>;

/**
 * The durable, stored lead record. It extends the validated input with a server-assigned id, the originating
 * execution id (audit linkage), a soft-delete flag (reversible create) and timestamps. This is the AUTHORITATIVE
 * record the provider reads back for verification; the client never writes it directly.
 */
export const leadRecordSchema = z.object({
  v: z.literal(1),
  id: z.string().uuid(),
  version: z.number().int(),
  input: leadCreateInputSchema,
  // The execution attempt that created this record (links a lead to its receipt/audit trail). Never a secret.
  // Nullable because the Executor provider contract applies a change WITHOUT the execution id in scope; the audit
  // linkage is carried by the execution receipt/audit log (keyed by idempotency + execution id) instead.
  executionId: z.string().uuid().nullable(),
  // Stable, content-derived dedupe key: two identical enquiries hash to the same key so a retried create is a no-op.
  dedupeKey: z.string().min(1).max(64),
  // Soft delete supports reversible create: rollback marks the record deleted rather than losing the audit trail.
  deleted: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
}).strict();
export type LeadRecord = z.infer<typeof leadRecordSchema>;

/**
 * Canonical, key-sorted serialization of the lead input, used BOTH for the dedupe key and for the verification
 * content hash. Equivalent inputs serialize identically (so a retry is idempotent) and any field change produces a
 * different hash (so verification catches a record that does not match what was approved). Matches the
 * execution-preview.ts `canonical` discipline so the whole system hashes the same way.
 */
export function canonicalLeadInput(input: LeadCreateInput): string {
  const normalized = {
    v: LEAD_CREATE_VERSION,
    contactName: input.contactName.trim(),
    contactEmail: input.contactEmail.trim().toLowerCase(),
    message: input.message.trim(),
    company: input.company.trim(),
    phone: input.phone.trim(),
    source: input.source.trim(),
    consent: input.consent,
  };
  const sorted = Object.fromEntries(Object.entries(normalized).sort(([a], [b]) => (a < b ? -1 : 1)));
  return JSON.stringify(sorted);
}

/**
 * Parse a lead payload that arrived as JSON inside an execution change's `after` field. Returns the validated input
 * or null when the payload is absent / not JSON / fails the strict schema. Null is a hard provider failure (no lead
 * is ever created from an unparseable payload) — the caller never "repairs" a malformed enquiry.
 */
export function parseLeadPayload(after: string | null | undefined): LeadCreateInput | null {
  if (!after) return null;
  try {
    const parsed = leadCreateInputSchema.safeParse(JSON.parse(after));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}

/**
 * Serialize a validated lead input to the JSON carried in an execution change's `after` field. This is DISTINCT from
 * `canonicalLeadInput`: the canonical form injects a `v` marker for hashing, whereas the wire payload must round-trip
 * back through the strict `leadCreateInputSchema` (which forbids a `v` field). We therefore emit only the schema's
 * own fields, key-sorted so the change-set hash stays stable for idempotency, with the same normalization
 * (trim/lowercased email) the canonical hash uses so the stored and approved bytes agree.
 */
export function serializeLeadPayload(input: LeadCreateInput): string {
  const normalized = {
    contactName: input.contactName.trim(),
    contactEmail: input.contactEmail.trim().toLowerCase(),
    message: input.message.trim(),
    company: input.company.trim(),
    phone: input.phone.trim(),
    source: input.source.trim(),
    consent: input.consent,
  };
  const sorted = Object.fromEntries(Object.entries(normalized).sort(([a], [b]) => (a < b ? -1 : 1)));
  return JSON.stringify(sorted);
}

// The bounded, visitor-safe projection of a created lead. It NEVER exposes the raw email/phone back to the page
// beyond what the visitor already typed; it confirms creation with a short reference only. Used by the action-card
// status. The full record stays server-side; only the owner's diagnostic/audit path can read it.
export type LeadCreateCard = {
  created: boolean;
  reference: string | null;   // the lead id's short, non-identifying prefix, for the "saved" confirmation
  contactName: string;        // echoed from the visitor's own input (already known to them)
};
