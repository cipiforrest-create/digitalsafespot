import { getKv } from '../state/kv';
import { leadRecordSchema, type LeadRecord } from '../../shared/lead-create';
// P3d durable lead record store. This REUSES the existing shared KV infrastructure (getKv → memory in dev/test,
// Upstash in prod) and mirrors the run-store.ts / workspace.ts pattern exactly — it is NOT a new/parallel datastore
// technology. It persists the AUTHORITATIVE lead record so the lead.create provider can READ IT BACK to verify a
// mutation actually landed (provider "success" is never trusted alone). Records are:
//   • schema-validated on every read (a corrupt/injected payload is dropped, never returned);
//   • addressable by lead id (the status/verification path) AND by content dedupe key (idempotent create);
//   • TTL-bounded so dev/preview data self-expires; a real long-term CRM swap replaces only this one module.
// No secrets are stored — only the schema-validated record. A test can install a deterministic store via setLeadStore.

const LEAD_TTL_SECONDS = 30 * 24 * 60 * 60; // 30-day retention for a demonstrable lead; self-expires in preview.
const idKey = (id: string) => `dx:c:lead:rec:${id}`;
const dedupeKey = (k: string) => `dx:c:lead:dedupe:${k}`;

export interface LeadStore {
  /** Read a lead record by its id (used by verification + the owner diagnostic/status path). Null when absent/invalid. */
  getById(id: string): Promise<LeadRecord | null>;
  /** Read a lead record by its content dedupe key (used to make create idempotent). Null when none. */
  getByDedupe(dedupe: string): Promise<LeadRecord | null>;
  /**
   * Idempotently create a lead record. If a record already exists for this dedupe key it is returned UNCHANGED
   * (the create is a no-op, so a retried/duplicate enquiry never doubles). Otherwise the record is persisted and
   * indexed by both id and dedupe key. Returns the authoritative stored record.
   */
  create(record: LeadRecord): Promise<LeadRecord>;
  /** Soft-delete a lead by id (reversible-create rollback): marks deleted, keeps the audit trail. Returns success. */
  softDelete(id: string): Promise<boolean>;
}

class KvLeadStore implements LeadStore {
  async getById(id: string): Promise<LeadRecord | null> {
    return this.read(idKey(id), (r) => r.id === id);
  }
  async getByDedupe(dedupe: string): Promise<LeadRecord | null> {
    const id = await getKv().get(dedupeKey(dedupe));
    if (!id) return null;
    return this.getById(id);
  }
  private async read(k: string, ok: (r: LeadRecord) => boolean): Promise<LeadRecord | null> {
    const raw = await getKv().get(k);
    if (!raw) return null;
    try {
      const parsed = leadRecordSchema.safeParse(JSON.parse(raw));
      if (parsed.success && ok(parsed.data)) return parsed.data;
    } catch { /* fall through */ }
    return null;
  }
  async create(record: LeadRecord): Promise<LeadRecord> {
    const validated = leadRecordSchema.parse(record);
    const kv = getKv();
    // Idempotent: a prior record under the same dedupe key wins (never a second insert for the same enquiry).
    const existing = await this.getByDedupe(validated.dedupeKey);
    if (existing) return existing;
    await kv.set(idKey(validated.id), JSON.stringify(validated), LEAD_TTL_SECONDS);
    await kv.set(dedupeKey(validated.dedupeKey), validated.id, LEAD_TTL_SECONDS);
    return validated;
  }
  async softDelete(id: string): Promise<boolean> {
    const current = await this.getById(id);
    if (!current) return false;
    const next = leadRecordSchema.parse({ ...current, deleted: true, updatedAt: Date.now() });
    await getKv().set(idKey(id), JSON.stringify(next), LEAD_TTL_SECONDS);
    return true;
  }
}

let store: LeadStore = new KvLeadStore();

export function getLeadStore(): LeadStore { return store; }
/** Test hook: install a deterministic lead store. Returns a restore callback. */
export function setLeadStore(next: LeadStore): () => void {
  const previous = store;
  store = next;
  return () => { store = previous; };
}
