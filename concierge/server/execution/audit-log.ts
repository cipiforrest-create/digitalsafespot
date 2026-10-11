import { createHash } from 'node:crypto';
import { getKv } from '../state/kv';
import {
  executionAuditEventSchema,
  type ExecutionAuditEvent, type ExecutionAuditEventType,
} from '../../shared/execution-run';
import type { ExecutionOperation } from '../../shared/execution';
// P3c §8 append-only execution audit trail. Server-authoritative record of WHAT happened during one execution,
// keyed by execution id. It reuses the KV persistence pattern (audit-record.ts / run-store.ts) rather than a new
// store. Every entry is validated against executionAuditEventSchema which permits ONLY safe metadata: no
// credentials, session secrets, tokens or provider payloads. The actor is referenced by a short salted hash
// (never the raw id), mirroring trace.ts sessionHash. Entries are appended under a monotonic per-execution seq so
// the ordering is deterministic and tests can assert the event sequence.

const AUDIT_TTL_SECONDS = 7 * 24 * 60 * 60; // 7-day retention for investigation; no secrets are stored.
const logKey = (executionId: string) => `dx:c:execaudit:${executionId}`;

/** Short, non-reversible hash of an actor id for correlation without exposing the identity. */
export function actorHash(actorId: string): string {
  return createHash('sha256').update('dx:exec:actor:' + actorId).digest('base64url').slice(0, 16);
}

export interface AuditContext {
  executionId: string;
  actorId?: string | null;
  operation?: ExecutionOperation | null;
  target?: string | null;
}

/**
 * Append one event to an execution's audit log. Append-only: it reads the current list, validates+pushes a new
 * entry with the next seq, and writes it back under the same TTL. Best-effort persistence — an audit write failure
 * must never crash a mutation path — but the entry is always schema-checked so a secret can never be recorded.
 */
export async function appendAuditEvent(ctx: AuditContext, type: ExecutionAuditEventType, status: string | null, now = Date.now()): Promise<void> {
  const kv = getKv();
  const key = logKey(ctx.executionId);
  const events = await loadAuditLog(ctx.executionId);
  const event: ExecutionAuditEvent = executionAuditEventSchema.parse({
    executionId: ctx.executionId,
    seq: events.length,
    type,
    at: now,
    actorHash: ctx.actorId ? actorHash(ctx.actorId) : null,
    operation: ctx.operation ?? null,
    target: ctx.target ?? null,
    status,
  });
  events.push(event);
  try { await kv.set(key, JSON.stringify(events), AUDIT_TTL_SECONDS); } catch { /* audit is best-effort */ }
}

/** Load the ordered audit log for an execution (empty when none / unreadable). */
export async function loadAuditLog(executionId: string): Promise<ExecutionAuditEvent[]> {
  const raw = await getKv().get(logKey(executionId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: ExecutionAuditEvent[] = [];
    for (const item of parsed) {
      const r = executionAuditEventSchema.safeParse(item);
      if (r.success && r.data.executionId === executionId) out.push(r.data);
    }
    return out.sort((a, b) => a.seq - b.seq);
  } catch { return []; }
}
