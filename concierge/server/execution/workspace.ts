import { createHash } from 'node:crypto';
import { z } from 'zod';
import { getKv } from '../state/kv';
// P3b draft workspace: the ONLY mutation target the first vertical slice may touch. It is a contained, versioned,
// internal key→content store (backed by the shared KV). It is NOT the filesystem, a CMS, a deploy target or an
// external provider — nothing here leaves the process/KV. Targets are validated against a strict allowlisted shape
// so a caller cannot smuggle a path, URL or traversal ("../", absolute paths, protocol) as a target key. Every entry
// carries a monotonic version and a content hash, which is what optimistic-concurrency and verification compare on.

export const WORKSPACE_TTL_SECONDS = 24 * 60 * 60;
// Allowlisted target shape: `namespace:slug` segments, lowercase alnum + limited punctuation. No slashes, dots,
// backslashes, whitespace or protocol markers — this is the containment check that forbids path traversal / URLs.
const TARGET_RE = /^[a-z0-9][a-z0-9_-]*(?::[a-z0-9][a-z0-9_-]*)*$/;

/** True when a proposed target is a safe, contained workspace key (no path/URL/traversal). */
export function isSafeTarget(target: string): boolean {
  return target.length >= 1 && target.length <= 200 && TARGET_RE.test(target);
}

export const draftEntrySchema = z.object({
  target: z.string().min(1).max(200),
  content: z.string().max(20000),
  version: z.number().int().min(1),
  updatedAt: z.number(),
}).strict();
export type DraftEntry = z.infer<typeof draftEntrySchema>;

const key = (target: string) => `dx:c:ws:${target}`;
const snapKey = (ref: string) => `dx:c:ws:snap:${ref}`;

/** Stable content hash used for concurrency + verification (matches the 32-char base64url convention elsewhere). */
export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('base64url').slice(0, 32);
}

/** Read the current draft entry for a target, or null when absent / invalid / unsafe target. */
export async function readDraft(target: string): Promise<DraftEntry | null> {
  if (!isSafeTarget(target)) return null;
  const raw = await getKv().get(key(target));
  if (!raw) return null;
  try {
    const parsed = draftEntrySchema.safeParse(JSON.parse(raw));
    if (parsed.success && parsed.data.target === target) return parsed.data;
  } catch { /* fall through */ }
  return null;
}

/**
 * Write new content to a draft, bumping the version. Optimistic concurrency: when `expectedVersion` is provided it
 * must equal the current version (or 0 when the target is absent) — otherwise the write is refused (returns null),
 * so a stale attempt can never overwrite a target that changed since preview/dry-run.
 */
export async function writeDraft(target: string, content: string, expectedVersion: number | null): Promise<DraftEntry | null> {
  if (!isSafeTarget(target)) return null;
  const current = await readDraft(target);
  const currentVersion = current ? current.version : 0;
  if (expectedVersion != null && expectedVersion !== currentVersion) return null;
  const next: DraftEntry = { target, content, version: currentVersion + 1, updatedAt: Date.now() };
  await getKv().set(key(target), JSON.stringify(draftEntrySchema.parse(next)), WORKSPACE_TTL_SECONDS);
  return next;
}

/** Capture a rollback snapshot of the current entry (or the absence of one). Returns an opaque snapshot ref. */
export async function captureSnapshot(ref: string, target: string): Promise<void> {
  const current = await readDraft(target);
  const payload = JSON.stringify({ target, entry: current });
  await getKv().set(snapKey(ref), payload, WORKSPACE_TTL_SECONDS);
}

/** Restore a target to a captured snapshot. Returns true on success. Absent snapshot restores to "deleted". */
export async function restoreSnapshot(ref: string, target: string): Promise<boolean> {
  const raw = await getKv().get(snapKey(ref));
  if (!raw) return false;
  try {
    const data = JSON.parse(raw) as { target: string; entry: DraftEntry | null };
    if (data.target !== target) return false;
    if (data.entry === null) { await getKv().del(key(target)); return true; }
    const parsed = draftEntrySchema.safeParse(data.entry);
    if (!parsed.success) return false;
    await getKv().set(key(target), JSON.stringify(parsed.data), WORKSPACE_TTL_SECONDS);
    return true;
  } catch { return false; }
}
