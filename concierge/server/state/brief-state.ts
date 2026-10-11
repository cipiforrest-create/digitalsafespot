import { getKv } from './kv';
import { projectBriefSchema, type ProjectBrief } from '../../shared/project-brief';
import type { Goal } from '../../shared/contracts';
import { emptyBrief } from '../orchestrator/project-brief';
// T21 persistence for the per-session ProjectBrief. Keyed by the cookie sid only (never carried in the body), so a
// brief can never be read across sessions. TTL matches the session idle window; a follow-up turn resumes the brief.
export const BRIEF_TTL_SECONDS = 30 * 60;
const key = (sid: string) => `dx:c:brief:${sid}`;

/** Load the session's brief, or a fresh empty one when none exists or the stored shape is invalid. */
export async function loadBrief(sid: string, goal: Goal | null): Promise<ProjectBrief> {
  const raw = await getKv().get(key(sid));
  if (!raw) return emptyBrief(sid, goal);
  try {
    const parsed = projectBriefSchema.safeParse(JSON.parse(raw));
    if (parsed.success && parsed.data.sid === sid) return parsed.data;
  } catch { /* fall through to a fresh brief */ }
  return emptyBrief(sid, goal);
}

/** Persist the brief under its session id. */
export async function saveBrief(brief: ProjectBrief): Promise<void> {
  await getKv().set(key(brief.sid), JSON.stringify(brief), BRIEF_TTL_SECONDS);
}

/** Delete the session's brief (explicit end / reset). */
export async function deleteBrief(sid: string): Promise<void> {
  await getKv().del(key(sid));
}
