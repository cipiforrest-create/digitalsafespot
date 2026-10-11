import { executionActorSchema, type ExecutionActor } from '../../shared/execution-run';
import { isExecutingRole } from './policy';
// P3b auth/RBAC seam, extended in P3e. This is the SMALLEST clean authorization contract execution needs — not a
// user-management system. It defines "who is allowed to attempt an execution" and is always assembled SERVER-SIDE.
// The browser can never supply a role, capability set or actor id: those arrive here only from a trusted resolver.
// `resolveActor` is the single seam a real implementation replaces; the default dev/test resolver below fails closed
// (no actor) unless an explicit server-side actor context is supplied. P3e note: WHICH operations a role may run is
// decided by the canonical policy matrix in policy.ts — this file only decides whether a role may execute AT ALL.

/**
 * True when the actor's role may attempt execution at all. P3e: `visitor` is now an executing role (so the
 * intentionally-public lead flow works), but the per-operation policy matrix (policy.ts) still restricts a visitor to
 * the public allowlist — this gate alone never grants a privileged operation. An absent actor can never execute.
 */
export function canExecute(actor: ExecutionActor | null): actor is ExecutionActor {
  return actor != null && isExecutingRole(actor.role);
}

/** True when the actor holds the capability an operation requires (or the operation needs none). */
export function hasCapability(actor: ExecutionActor, capability: string | null): boolean {
  if (capability == null) return true;
  return (actor.capabilities as readonly string[]).includes(capability);
}

// The trusted resolver seam. A production build swaps this for a real session/RBAC lookup; the input is opaque
// server-side context (never a parsed client body). It returns a validated ExecutionActor or null (fail closed).
export type ActorResolver = (context: unknown) => ExecutionActor | null;

let resolver: ActorResolver = defaultResolver;

/** Resolve the trusted actor for an execution attempt. Returns null when no trusted actor context exists. */
export function resolveActor(context: unknown): ExecutionActor | null {
  return resolver(context);
}

/** Test/integration hook to install a trusted resolver. Returns a restore callback. */
export function setActorResolver(next: ActorResolver): () => void {
  const previous = resolver;
  resolver = next;
  return () => { resolver = previous; };
}

// Default resolver: development/test only. It returns an actor ONLY when the caller passes an object that is a
// strict-valid, server-derived ExecutionActor (never from the browser) whose role may execute at all. Anything else
// resolves to null so execution fails closed when trusted actor context is absent. The per-operation policy matrix
// (policy.ts) still constrains what that resolved actor may run.
function defaultResolver(context: unknown): ExecutionActor | null {
  if (!context || typeof context !== 'object') return null;
  const parsed = executionActorSchema.safeParse(context);
  if (parsed.success && isExecutingRole(parsed.data.role)) return parsed.data;
  return null;
}
