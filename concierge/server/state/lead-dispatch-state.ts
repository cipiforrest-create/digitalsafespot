import { getKv } from './kv';
import { leadDispatchSchema, type LeadDispatch } from '../../shared/lead-receipt';
// T22 idempotent dispatch record. Keyed by session + submissionId so a retried submission returns the SAME receipts
// instead of re-dispatching. Bound to the session id (never read across sessions). TTL matches the session window.
export const DISPATCH_TTL_SECONDS = 30 * 60;
const key = (sid: string, submissionId: string) => `dx:c:lead:${sid}:${submissionId}`;

/** Load a prior dispatch for this session + submission, or null when none / invalid / cross-session. */
export async function loadDispatch(sid: string, submissionId: string): Promise<LeadDispatch | null> {
  const raw = await getKv().get(key(sid, submissionId));
  if (!raw) return null;
  try {
    const parsed = leadDispatchSchema.safeParse(JSON.parse(raw));
    if (parsed.success && parsed.data.sid === sid && parsed.data.submissionId === submissionId) return parsed.data;
  } catch { /* fall through */ }
  return null;
}

/** Persist a dispatch record. */
export async function saveDispatch(record: LeadDispatch): Promise<void> {
  await getKv().set(key(record.sid, record.submissionId), JSON.stringify(record), DISPATCH_TTL_SECONDS);
}
