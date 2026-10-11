import { z } from 'zod';
import { goalSchema } from './contracts';
// T22 delivery receipts. A Receipt is PROOF that a named destination accepted the enquiry. The core rule is
// NO RECEIPT = NO CLAIM: the visitor-facing message is derived ONLY from receipts that a destination actually
// returned. If no destination confirmed acceptance, the response never claims the enquiry was sent or saved.

/** Bump when the receipt or lead-v2 shape changes. */
export const LEAD_RECEIPT_VERSION = 1;

// The delivery channels the concierge can dispatch to. `email` = Resend team notification; `webhook` = n8n/CRM.
export const destinationKindSchema = z.enum(['email', 'webhook']);
export type DestinationKind = z.infer<typeof destinationKindSchema>;

// A single destination's outcome. `accepted` means the destination confirmed intake (2xx / provider id). `failed`
// means it was attempted but not confirmed — this NEVER counts as a success claim. There is no optimistic state.
export const receiptSchema = z.object({
  kind: destinationKindSchema,
  status: z.enum(['accepted', 'failed']),
  // A provider-side identifier when the destination returned one (e.g. Resend id). Never fabricated.
  reference: z.string().min(1).max(200).nullable(),
  at: z.number(),
}).strict();
export type Receipt = z.infer<typeof receiptSchema>;

// The lead v2 request. The enquiry content itself comes from the server-side session brief (T21), never the body,
// so the client cannot inject unverified values. Only the honeypot, consent and an idempotency key travel here.
export const leadV2RequestSchema = z.object({
  v: z.literal(2),
  submissionId: z.string().uuid(),
  consent: z.literal(true),
  // Optional audit binding: an owner-bound auditId whose signed result may be attached to the team notification.
  auditId: z.string().uuid().optional(),
  // Honeypot; a non-empty value is silently accepted without dispatching (mirrors legacy behaviour).
  website: z.string().max(200).default(''),
}).strict();
export type LeadV2Request = z.infer<typeof leadV2RequestSchema>;

// The stored dispatch record, keyed by session + submissionId for idempotency. `receipts` is the authoritative
// list of destination outcomes; `delivered` is true only when at least one destination was `accepted`.
export const leadDispatchSchema = z.object({
  v: z.literal(1),
  version: z.number().int(),
  sid: z.string(),
  submissionId: z.string().uuid(),
  briefHash: z.string().min(1).max(64),   // binds the dispatch to the exact brief content it delivered
  goal: goalSchema.nullable(),
  receipts: z.array(receiptSchema).max(4),
  delivered: z.boolean(),
  createdAt: z.number(),
}).strict();
export type LeadDispatch = z.infer<typeof leadDispatchSchema>;

// The bounded, visitor-facing result. `message` is a deterministic i18n receipt string chosen ONLY from receipts.
export type LeadReceiptCard = {
  delivered: boolean;
  channels: DestinationKind[];   // channels that were `accepted` (never the failed ones)
  message: string;
};
