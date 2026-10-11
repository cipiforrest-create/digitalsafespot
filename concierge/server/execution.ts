import { z } from 'zod';
import { guard, getSession, json, HttpError, type Request, type Response } from './http';
import { startTrace } from './core/trace';
import { enforce } from './state/ratelimit';
import { executionRunRequestSchema, ExecutionError, type ExecutionErrorCode } from '../shared/execution-run';
import { runControlledExecution, projectStatus, loadReceiptByExecutionId } from './orchestrator/controlled-execution';
import { resolveSessionActor, sessionActorHash } from './execution/session-actor';
import { collectExecutionDiagnostic } from './execution/diagnostics';
// P3c §2/§9 HTTP execution API. A NARROW, authenticated server route for controlled execution and status reads. It
// reuses the existing security envelope verbatim — guard() enforces POST-only, origin === host (CSRF/origin), JSON
// content-type, https on Vercel, size limit and the production API kill switch; the session cookie is HttpOnly +
// SameSite=Strict. It resolves the TRUSTED actor server-side from the session (never from the body), so the browser
// can never declare a role/capabilities. It returns ONLY the sanitized client projection of the receipt — never
// internal executor objects, provider credentials, rollback snapshots, raw stack traces or secret metadata. There is
// no generic tool/function name API: the only lever is the strict ExecutionRequest whose operation must be
// allowlisted server-side.

// The client-facing request. It carries the full frozen P3a artifacts and the run envelope, but NOT the actor — the
// actor is assembled server-side. Strict + actor omitted so a client cannot smuggle a role/capability claim.
const executeBodySchema = z.object({
  action: z.literal('execute'),
  request: executionRunRequestSchema.omit({ actor: true }).strict(),
}).strict();
const statusBodySchema = z.object({
  action: z.literal('status'),
  executionId: z.string().uuid(),
}).strict();
// P3d booleans/status-only diagnostic. Owner-gated like every other action; returns only the whitelisted readiness
// booleans + a coarse last-state string (never any content). No executionId or payload is accepted.
const diagnosticBodySchema = z.object({
  action: z.literal('diagnostic'),
}).strict();
const bodySchema = z.discriminatedUnion('action', [executeBodySchema, statusBodySchema, diagnosticBodySchema]);

// Map a structured ExecutionError code to a safe HTTP status. Gate failures are 4xx (client can fix or is denied);
// operational recording outcomes never throw here. Nothing leaks beyond the code itself.
const STATUS_BY_CODE: Record<ExecutionErrorCode, number> = {
  invalid_request: 400,
  approval_mismatch: 409,
  approval_expired: 410,
  unauthorized: 403,
  execution_disabled: 503,
  unsupported_operation: 422,
  duplicate_request: 409,
  fingerprint_mismatch: 409,
  locked: 423,
  preflight_failed: 422,
  stale_target: 409,
  provider_failed: 502,
  verification_failed: 502,
  rollback_failed: 500,
  reconciliation_required: 409,
};

export default async function handler(req: Request, res: Response) {
  const trace = startTrace('execution');
  try {
    // 1. Origin/CSRF/method/JSON/prod-gate + 2. authenticated session (throws 401 when absent).
    guard(req);
    const session = getSession(req);
    trace.setSession(session.sid);
    await enforce(req, 'audit', session.sid); // reuse the strictest (fail-closed) per-session/IP bucket

    // 3. Strict body parse — unknown fields and any malformed artifact are rejected as 400.
    const body = bodySchema.parse(req.body);

    // 4. Resolve the TRUSTED actor from the session; the browser never supplies role/capabilities. Fail closed.
    // P3e: a normal signed session now resolves to a VISITOR actor and an owner-hashed session to an OWNER actor.
    // The role is server-derived here and never trusted from the request; the policy matrix decides authority.
    const actor = resolveSessionActor(session);
    if (!actor) throw new HttpError(403, 'You are not authorized to run this action.');

    if (body.action === 'diagnostic') {
      // P3e §20: the readiness diagnostic is OWNER-ONLY. A visitor actor (the common public case) is denied even
      // though it is a valid actor — privilege is re-checked here, never inferred from "an actor exists".
      if (actor.role !== 'owner') throw new HttpError(403, 'You are not authorized to run this action.');
      // Owner-only readiness report. No ids/content accepted or returned — only whitelisted booleans + a coarse state.
      const diagnostic = await collectExecutionDiagnostic();
      json(res, 200, { diagnostic });
      trace.end('ok', { mode: 'diagnostic' });
      return;
    }

    if (body.action === 'status') {
      // 9. Status read: authorization applies. A receipt is only visible to the actor that created it — knowing an
      // id is not enough (ownership is compared on the server-derived actor id, never a client claim).
      const receipt = await loadReceiptByExecutionId(body.executionId);
      if (!receipt || receipt.actorId !== actor.actorId) throw new HttpError(404, 'Not found.');
      json(res, 200, { status: projectStatus(receipt) });
      trace.end('ok', { mode: 'status' });
      return;
    }

    // 5. Execute: inject the server actor (overriding anything a client might have sent) and run the guarded engine.
    // 6. Return ONLY the sanitized projection of the authoritative receipt.
    const runRequest = { ...body.request, actor };
    const receipt = await runControlledExecution(runRequest, { actorContext: actor });
    json(res, 200, { status: projectStatus(receipt) });
    trace.end('ok', { mode: 'execute', code: receipt.state });
  } catch (error) {
    // 7. Safe structured status/error mapping. An ExecutionError maps to a code-specific status with only the code;
    // everything else falls through to the shared fail() envelope. No stack traces or internals ever reach the wire.
    if (error instanceof ExecutionError) {
      const status = STATUS_BY_CODE[error.code] ?? 400;
      if (!res.headersSent) json(res, status, { errorCode: error.code, requestId: trace.requestId });
      trace.end('error', { code: error.code });
      return;
    }
    failSafe(res, error, trace.requestId);
    trace.end('error', { code: error instanceof Error ? error.name : 'unknown' });
  }
}

// A local safe failure writer. HttpError keeps its status; validation errors become 400; anything else is a generic
// 502. It never serializes an internal message beyond a short, safe string.
function failSafe(res: Response, error: unknown, requestId: string) {
  if (res.headersSent) { res.end(); return; }
  const invalid = error instanceof Error && ['ZodError', 'SyntaxError', 'TypeError'].includes(error.name);
  const status = error instanceof HttpError ? error.status : invalid ? 400 : 502;
  const message = error instanceof HttpError ? error.message : invalid ? 'Please check the information and try again.' : 'The connection was interrupted. Please try again.';
  json(res, status, { message, requestId });
}

// Re-export the owner-hash helper so operators/tests can compute the DX_EXECUTION_OWNERS entry for a session id.
export { sessionActorHash };
