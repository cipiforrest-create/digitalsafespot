import type { ActorRole } from '../../shared/execution-run';
import type { ExecutionOperation } from '../../shared/execution';
// P3e §6 canonical EXECUTION POLICY MATRIX. This is the SINGLE server-owned source of truth for "which trusted role
// may run which operation". Role checks are NOT scattered across the codebase: the controlled-execution engine
// consults this one module before any mutation. Everything not explicitly allowed is DENIED — an unknown role, an
// unknown/unregistered operation, or any operation outside a role's set all return false. The browser, the model and
// any retrieved document can never influence this: the inputs are a server-derived ActorRole and a server-known
// ExecutionOperation only. Widening a role's authority is a deliberate code change here, reviewed in isolation.

// The ONLY mutating capability a normal PUBLIC VISITOR may execute. Intentionally minimal (P3e §2/§3): a visitor can
// create their OWN contact lead and nothing else. Adding another public operation is a deliberate, gated future step.
export const VISITOR_OPERATIONS: ReadonlySet<ExecutionOperation> = new Set<ExecutionOperation>(['lead_create']);

// Operations an OWNER (trusted, server-derived) may execute. Owner keeps the public lead flow plus the existing
// internal, reversible draft operation. A future privileged/destructive operation is added here ONLY when it is also
// individually registered in the executor registry AND enabled by its own DX_EXECUTION_* capability switch — the
// matrix alone never turns a provider on.
export const OWNER_OPERATIONS: ReadonlySet<ExecutionOperation> = new Set<ExecutionOperation>([
  'lead_create', 'cms_draft',
]);

// Roles that may ever ATTEMPT an execution at all. `visitor` is now a real (least-privilege) executing role so the
// intentionally-public lead flow works; `owner`/`admin`/`system` are the trusted privileged roles. An absent actor
// (null) or any role outside this set can never execute.
const EXECUTING_ROLES: ReadonlySet<ActorRole> = new Set<ActorRole>(['visitor', 'owner', 'admin', 'system']);

/** True when a role may attempt execution at all (before the per-operation matrix is consulted). */
export function isExecutingRole(role: ActorRole | null | undefined): boolean {
  return role != null && EXECUTING_ROLES.has(role);
}

/**
 * The authoritative policy decision: may this trusted role run this operation? Fail-closed for every unknown/
 * unlisted combination. This is the one function the engine calls to gate a mutation by role.
 */
export function isOperationAllowedForRole(role: ActorRole, operation: ExecutionOperation): boolean {
  switch (role) {
    case 'visitor': return VISITOR_OPERATIONS.has(operation);
    case 'owner':
    case 'admin':
    case 'system': return OWNER_OPERATIONS.has(operation);
    default: return false;
  }
}

/** True when the public visitor policy is correctly wired (lead.create public, privileged ops not). Diagnostic use. */
export function publicVisitorPolicyReady(): boolean {
  return VISITOR_OPERATIONS.has('lead_create') && !VISITOR_OPERATIONS.has('cms_draft');
}

/** True when the owner policy retains the privileged boundary (owner keeps lead + internal draft). Diagnostic use. */
export function ownerPolicyReady(): boolean {
  return OWNER_OPERATIONS.has('lead_create') && isOperationAllowedForRole('owner', 'cms_draft');
}
