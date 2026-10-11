import { randomUUID } from 'node:crypto';
import type { Executor } from '../orchestrator/controlled-execution';
import type { ProposedChange } from '../../shared/execution';
import { getKv } from '../state/kv';
import { getLeadStore } from './lead-store';
import { isSafeTarget, hashContent } from './workspace';
import {
  parseLeadPayload, canonicalLeadInput, leadRecordSchema, LEAD_CREATE_VERSION, type LeadRecord,
} from '../../shared/lead-create';
// P3d lead.create provider. This is the FIRST real live-action executor: it turns an approved, frozen enquiry into a
// durable lead record and proves the mutation landed by READING IT BACK from the store. It implements the full
// Executor safety contract (validateTarget / readCurrentState / preflight / dryRunChange / captureRollback /
// applyChange / verifyChange / restoreRollback). Every method is bounded and server-side: the payload is strict-
// parsed from canonical JSON (never trusted as prose), create is idempotent on the content dedupe key, and rollback
// is a reversible soft-delete that never removes a lead that pre-existed this execution. There is NO network call,
// no arbitrary URL, no shell — the only side effect is a schema-validated write to the existing KV lead store.

// Contained target namespace for lead creation. It must be a safe workspace key (no path/URL/traversal) under the
// `lead` namespace, so a caller can never aim this provider at anything but the lead store.
function isLeadTarget(target: string): boolean {
  return isSafeTarget(target) && (target === 'lead' || target.startsWith('lead:'));
}

// The rollback snapshot for a create records ONLY the content dedupe key and whether the record pre-existed this
// attempt. Rollback of a create = soft-delete the record THIS attempt created; if it pre-existed, rollback is a no-op
// so a retried/duplicate enquiry never deletes an earlier genuine lead. No lead content is stored in the snapshot.
const snapKey = (ref: string) => `dx:c:lead:snap:${ref}`;
const SNAP_TTL_SECONDS = 24 * 60 * 60;

/** Build the authoritative stored record from a parsed payload. The id is server-assigned; dedupe binds to content. */
function buildRecord(change: ProposedChange, now: number): LeadRecord | null {
  const input = parseLeadPayload(change.after);
  if (!input) return null;
  const dedupeKey = hashContent(canonicalLeadInput(input));
  return leadRecordSchema.parse({
    v: 1, id: randomUUID(), version: LEAD_CREATE_VERSION, input,
    executionId: null, dedupeKey, deleted: false, createdAt: now, updatedAt: now,
  });
}

export const leadCreateExecutor: Executor = {
  operation: 'lead_create',
  requiredCapability: null,
  riskTier: 'medium',
  reversible: true,
  supportsDryRun: true,
  supportsVerification: true,
  supportsRollback: true,
  rollbackSupported: true,
  validateTarget: (target) => isLeadTarget(target),

  // No singular per-target live state for creation; return null (used only for diagnostics/reconciliation).
  async readCurrentState() { return null; },

  // Provider readiness: the payload must be a strict-valid lead enquiry. A malformed/injected payload fails preflight
  // so no mutation is ever attempted. (The KV store itself has no connect step; getKv is always resolvable.)
  async preflight(change) {
    const input = parseLeadPayload(change.after);
    return input ? { ok: true, detail: 'Lead payload is valid.' } : { ok: false, detail: 'Lead payload is missing or invalid.' };
  },

  // Dry-run: compute what WOULD be created against the current store. A create is never a "conflict" because the
  // dedupe key IS the content hash — an existing record under the same key necessarily matches the payload, so a
  // duplicate is an idempotent no-op, not a stale-target conflict.
  async dryRunChange(change) {
    const input = parseLeadPayload(change.after);
    const proposedAfterHash = input ? hashContent(canonicalLeadInput(input)) : null;
    const dedupe = proposedAfterHash;
    const existing = dedupe ? await getLeadStore().getByDedupe(dedupe) : null;
    const currentHash = existing ? hashContent(canonicalLeadInput(existing.input)) : null;
    return {
      changeId: change.id, target: change.target,
      currentHash, expectedHash: null, proposedAfterHash,
      // conflict only if a record exists whose content differs from the payload (impossible by construction, but
      // checked honestly) — a matching existing record is an idempotent no-op, never a conflict.
      conflict: existing != null && currentHash !== proposedAfterHash,
    };
  },

  // Capture a rollback snapshot BEFORE mutation: note the dedupe key and whether the record already exists, so a
  // later rollback deletes ONLY a record this attempt created.
  async captureRollback(ref, change) {
    const input = parseLeadPayload(change.after);
    const dedupe = input ? hashContent(canonicalLeadInput(input)) : null;
    const preExisted = dedupe ? (await getLeadStore().getByDedupe(dedupe)) != null : false;
    await getKv().set(snapKey(ref), JSON.stringify({ dedupe, preExisted }), SNAP_TTL_SECONDS);
  },

  // Apply: idempotently create the lead record. Returns false on an unparseable payload (→ provider_failed), so a
  // malformed enquiry can never be recorded as a success.
  async applyChange(change) {
    const record = buildRecord(change, Date.now());
    if (!record) return false;
    await getLeadStore().create(record); // idempotent on dedupeKey
    return true;
  },

  // Verify by READING THE RECORD BACK from the store and comparing its canonical content hash to the approved
  // payload. Provider "success" alone is not trusted — only a matching persisted, non-deleted record verifies.
  async verifyChange(change) {
    const input = parseLeadPayload(change.after);
    const expectedHash = input ? hashContent(canonicalLeadInput(input)) : null;
    const dedupe = expectedHash;
    const record = dedupe ? await getLeadStore().getByDedupe(dedupe) : null;
    const actualHash = record && !record.deleted ? hashContent(canonicalLeadInput(record.input)) : null;
    return { changeId: change.id, expectedHash, actualHash, ok: expectedHash != null && expectedHash === actualHash };
  },

  // Restore: reversible-create rollback. If the record pre-existed this attempt, do nothing (never delete a prior
  // genuine lead). Otherwise soft-delete the record this attempt created.
  async restoreRollback(ref) {
    const raw = await getKv().get(snapKey(ref));
    if (!raw) return false;
    try {
      const snap = JSON.parse(raw) as { dedupe: string | null; preExisted: boolean };
      if (snap.preExisted) return true;           // pre-existing lead → rollback is a no-op
      if (!snap.dedupe) return true;              // nothing was created (bad payload) → nothing to undo
      const record = await getLeadStore().getByDedupe(snap.dedupe);
      if (!record) return true;                   // already absent
      return getLeadStore().softDelete(record.id);
    } catch { return false; }
  },
};
