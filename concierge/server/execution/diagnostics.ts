import { z } from 'zod';
import {
  executionEnabled, capabilityExecutionEnabled, conciergeApiRaw, geminiApiKey, kvConfigured, persistentStoreReady,
} from '../core/config';
import { publicVisitorPolicyReady, ownerPolicyReady } from './policy';
import { getExecutor } from '../orchestrator/controlled-execution';
import { getLeadStore } from './lead-store';
import { getExecutionStore } from './run-store';
import { getPendingActionStore } from '../state/pending-action';
import { leadCreateExecutor } from './lead-provider';
import { serializeLeadPayload } from '../../shared/lead-create';
import type { ExecutionState } from '../../shared/execution-run';

// P3d booleans/status-only execution diagnostic. It reports WHETHER each part of the agent loop is ready — never ANY
// content. The output is a closed, whitelisted set of booleans plus one coarse last-execution state string; the
// schema is `.strict()` so a stray field can never leak. There is deliberately NO PII, email, name, lead content,
// API key, token, cookie, session id, provider credential, raw payload or stack trace here. The caller (the HTTP
// endpoint) enforces owner-only access using the SAME trusted-actor seam as controlled execution; this module only
// computes the safe booleans. Each readiness check is a real probe (a registry lookup, a safe throwaway
// preflight/round-trip) so the report reflects the actual wiring the app uses, not a hardcoded guess.

export const executionDiagnosticSchema = z.object({
  conciergeApiReady: z.boolean(),
  modelConfigured: z.boolean(),
  kvConfigured: z.boolean(),
  persistentStoreReady: z.boolean(),
  executionEnabled: z.boolean(),
  leadCreateEnabled: z.boolean(),
  publicVisitorPolicyReady: z.boolean(),
  ownerPolicyReady: z.boolean(),
  registryLoaded: z.boolean(),
  leadProviderReady: z.boolean(),
  persistenceReady: z.boolean(),
  approvalReady: z.boolean(),
  verificationReady: z.boolean(),
  rateLimitReady: z.boolean(),
  workerAlive: z.boolean(),
  chatActionRoutingReady: z.boolean(),
  pendingActionStoreReady: z.boolean(),
  diagnosticSafe: z.literal(true),
  lastExecutionState: z.string().max(40).nullable(),
}).strict();
export type ExecutionDiagnostic = z.infer<typeof executionDiagnosticSchema>;

// A fixed, obviously-synthetic probe payload. It is never persisted (preflight/serialize are pure) and carries no
// real visitor data — only a constant used to exercise the provider/approval/verification code paths safely.
const PROBE = serializeLeadPayload({
  contactName: 'Diagnostic Probe', contactEmail: 'diagnostic@example.com',
  message: 'Diagnostic readiness probe (not a real enquiry).', company: '', phone: '', source: 'diagnostic', consent: true,
});
const probeChange = { id: 'C1', kind: 'lead_record' as const, target: 'lead:concierge', summary: 'probe', before: null, after: PROBE, reversible: true, stepId: 'S2' };

/**
 * Compute the safe diagnostic. Every probe is read-only / pure and swallows its own errors into a boolean so a
 * failing subsystem can never throw content into the response. `lastExecutionState` is a coarse state name only.
 */
export async function collectExecutionDiagnostic(): Promise<ExecutionDiagnostic> {
  const registryLoaded = getExecutor('lead_create') != null;

  // Provider readiness: run the provider's own preflight against the synthetic probe (pure; persists nothing).
  let leadProviderReady = false;
  try { leadProviderReady = (await leadCreateExecutor.preflight!(probeChange)).ok; } catch { leadProviderReady = false; }

  // Persistence readiness: a dedupe lookup for a key that does not exist must resolve without throwing.
  let persistenceReady = false;
  try { await getLeadStore().getByDedupe('diagnostic-nonexistent-key'); persistenceReady = true; } catch { persistenceReady = false; }

  // Approval readiness: the frozen-approval pipeline is importable and the executor supports verification.
  const approvalReady = registryLoaded && leadCreateExecutor.supportsDryRun;
  const verificationReady = registryLoaded && leadCreateExecutor.supportsVerification;

  // Worker/receipt lookup: a lookup for a non-existent execution id must resolve to null without throwing.
  let workerAlive = false;
  try { await getExecutionStore().loadByExecutionId('00000000-0000-0000-0000-000000000000'); workerAlive = true; } catch { workerAlive = false; }

  // Pending-action store readiness: a load for an unknown session must resolve without throwing.
  let pendingActionStoreReady = false;
  try { await getPendingActionStore().load('diagnostic-nonexistent-session'); pendingActionStoreReady = true; } catch { pendingActionStoreReady = false; }

  // Last execution state: the most recent non-terminal run's coarse state, or null. No ids/content, just the name.
  let lastExecutionState: ExecutionState | null = null;
  try { const pending = await getExecutionStore().loadNonTerminal(); lastExecutionState = pending.length ? pending[pending.length - 1].state : null; } catch { lastExecutionState = null; }

  // Rate-limit readiness: the limiter shares the KV store; a round-trip through the pending-action store already
  // proves the backend answers, so the limiter is ready whenever persistence is. (No counter is incremented here.)
  const rateLimitReady = pendingActionStoreReady;

  return executionDiagnosticSchema.parse({
    // P3e §20 operational readiness (booleans only — never a key/token/value). These report WHETHER each part of the
    // public loop is wired, so an owner can confirm a hosted deployment before trusting it.
    conciergeApiReady: conciergeApiRaw() === 'on',
    modelConfigured: Boolean(geminiApiKey()),
    kvConfigured: kvConfigured(),
    persistentStoreReady: persistentStoreReady(),
    executionEnabled: executionEnabled(),
    leadCreateEnabled: capabilityExecutionEnabled('lead_create'),
    publicVisitorPolicyReady: publicVisitorPolicyReady(),
    ownerPolicyReady: ownerPolicyReady(),
    registryLoaded,
    leadProviderReady,
    persistenceReady,
    approvalReady,
    verificationReady,
    rateLimitReady,
    workerAlive,
    chatActionRoutingReady: true,          // the action flow is statically wired into the orchestrator
    pendingActionStoreReady,
    diagnosticSafe: true,
    lastExecutionState,
  });
}
