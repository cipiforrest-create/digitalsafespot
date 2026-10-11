import { createHash } from 'node:crypto';
import { executionActorSchema, type ExecutionActor } from '../../shared/execution-run';
import { executionOwnerHashes } from '../core/config';
import type { Session } from '../http';
// P3c §3 / P3e §1 real session → trusted actor binding. The browser must NEVER be able to declare an actor id, role,
// permissions or capabilities: those are resolved here from trusted server-side session data plus a server-only
// owner allowlist. This is the production adapter that replaces the development actor seam.
//
// P3e change — the server now derives TWO trusted roles, never a client-declared one:
//   • a valid, signed Concierge session           → VISITOR actor (least privilege: public allowlist only)
//   • a valid session whose non-reversible hash is in DX_EXECUTION_OWNERS → OWNER actor (privileged)
//   • an invalid/missing session                  → null (fail closed, no actor)
// This fixes the public-visitor blocker (a normal visitor can now complete the intentionally-public lead.create
// flow) WITHOUT weakening owner security: the per-operation policy matrix (policy.ts) still restricts a visitor to
// the public allowlist, and owner privilege is still proven only by the server-side owner hash. Capabilities are
// NEVER read from client input; a resolved actor is granted none here (capability-gated ops need a future grant).
//
// The project has no full user-management system yet, so the OWNER identity is proven by an allowlist keyed on a
// stable, non-reversible hash of the session id (sha256 → base64url, 16 chars). This keeps the boundary clean for a
// future real auth provider (swap this one function) while never inventing a default admin.

/** Non-reversible short hash of a session id, matching the audit-log/trace convention. */
export function sessionActorHash(sid: string): string {
  return createHash('sha256').update('dx:exec:owner:' + sid).digest('base64url').slice(0, 16);
}

/** True when a live session's id hashes into the server-only owner allowlist. Empty allowlist ⇒ no owners. */
function isOwnerSession(sid: string): boolean {
  const allow = executionOwnerHashes();
  return allow.size > 0 && allow.has(sessionActorHash(sid));
}

/**
 * Resolve the trusted execution actor from an authenticated server session. Returns:
 *   • an OWNER actor   when the session id hashes into DX_EXECUTION_OWNERS,
 *   • a VISITOR actor  for any other valid signed session (the common public case),
 *   • null             when there is no valid session (fail closed).
 * The role is derived here from trusted state ONLY — never from the request body, cookie payload fields the client
 * could set, model output or retrieved content. A visitor actor carries NO capabilities; the policy matrix decides
 * which operations the role may run.
 */
export function resolveSessionActor(session: Session | null | undefined): ExecutionActor | null {
  if (!session || !session.sid) return null;
  const hash = sessionActorHash(session.sid);
  const owner = isOwnerSession(session.sid);
  const parsed = executionActorSchema.safeParse({
    actorId: owner ? `owner:${hash}` : `visitor:${hash}`, // stable, non-identifying reference
    role: owner ? 'owner' : 'visitor',
    sessionId: session.sid,
    capabilities: [],
  });
  return parsed.success ? parsed.data : null;
}
