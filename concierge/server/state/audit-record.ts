import { randomUUID } from 'node:crypto';
import { getKv } from './kv';
import { auditRecordSchema, type AuditRecord, type AuditRecordStatus } from '../../shared/audit-record';
import type { AuditResult } from '../../shared/contracts';
import type { AuditFacts } from '../../shared/audit-facts';
// T17: KV persistence for owner-bound audit records. Records live for the session idle window so a follow-up
// turn can reuse them; the reuse index lets an identical URL in the same session skip a second fetch.
export const AUDIT_RECORD_TTL_SECONDS = 30 * 60;
const recordKey = (auditId: string) => `dx:c:audit:rec:${auditId}`;
const reuseKey = (sid: string, urlKey: string) => `dx:c:audit:byurl:${sid}:${urlKey}`;

export function buildAuditRecord(sid: string, urlKey: string, result: AuditResult, facts: AuditFacts, status: AuditRecordStatus): AuditRecord {
  return { v: 1, auditId: randomUUID(), sid, urlKey, status, result, facts, createdAt: Date.now() };
}
/** Persist a record by id and index it for same-session URL reuse. */
export async function saveAuditRecord(record: AuditRecord): Promise<void> {
  const kv = getKv();
  await kv.set(recordKey(record.auditId), JSON.stringify(record), AUDIT_RECORD_TTL_SECONDS);
  await kv.set(reuseKey(record.sid, record.urlKey), record.auditId, AUDIT_RECORD_TTL_SECONDS);
}
/** Load a record and enforce owner binding: a record for another session is treated as absent (→ 404). */
export async function getAuditRecord(auditId: string, sid: string): Promise<AuditRecord | null> {
  const raw = await getKv().get(recordKey(auditId));
  if (!raw) return null;
  let record: AuditRecord;
  try { record = auditRecordSchema.parse(JSON.parse(raw)); } catch { return null; }
  return record.sid === sid ? record : null;
}
/** Find a still-fresh audit for this session and normalized URL so an identical request does not refetch. */
export async function findReusableAudit(sid: string, urlKey: string): Promise<AuditRecord | null> {
  const auditId = await getKv().get(reuseKey(sid, urlKey));
  if (!auditId) return null;
  return getAuditRecord(auditId, sid);
}