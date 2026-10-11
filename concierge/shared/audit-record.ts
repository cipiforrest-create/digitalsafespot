import { z } from 'zod';
import { auditResultSchema } from './contracts';
import { auditFactsSchema } from './audit-facts';
// T17: an owner-bound, persisted audit. Each run is stored under a random `auditId` and bound to the session
// that produced it, so a later turn (T18 interpretation) can retrieve deterministic facts by id without
// re-fetching the page, and a record can never be read across sessions.
export const auditRecordSchema = z.object({
  v: z.literal(1),
  auditId: z.string().uuid(),
  sid: z.string(),
  urlKey: z.string().max(64),
  status: z.enum(['completed', 'partial', 'blocked']),
  result: auditResultSchema,
  facts: auditFactsSchema,
  createdAt: z.number(),
}).strict();
export type AuditRecord = z.infer<typeof auditRecordSchema>;
export type AuditRecordStatus = AuditRecord['status'];