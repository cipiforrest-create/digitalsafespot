import {
  isTerminalState,
  type ExecutionState, type RecoveryClassification, type RecoveryDisposition,
} from '../../shared/execution-run';
// P3c §7/§10 execution state machine. Valid execution transitions are EXPLICIT: a run may only move along the
// allowed edges below, never mutate to an arbitrary state. This makes crash recovery deterministic (§10) — an
// interrupted run's state tells us exactly whether it had mutated yet. The engine calls `assertTransition` before
// persisting any new state, so a bug that tried to skip preflight/dry-run (or resurrect a terminal run) throws.

// Allowed forward + failure edges. The happy path is:
//   pending → claimed → preflight → dry_run → executing → verifying → succeeded
// with failure branches from most states, and the rollback sub-path executing/verifying → rollback_pending →
// rolled_back | rollback_failed. `dry_run` is terminal in dry_run mode but may continue to `executing` in execute
// mode, so it appears both as a terminal state (via TERMINAL_STATES) and with onward edges here.
const TRANSITIONS: Record<ExecutionState, readonly ExecutionState[]> = {
  pending: ['claimed', 'failed'],
  claimed: ['preflight', 'failed'],
  preflight: ['dry_run', 'failed'],
  dry_run: ['executing', 'conflict', 'failed'],
  executing: ['verifying', 'rollback_pending', 'failed'],
  verifying: ['succeeded', 'rollback_pending', 'failed'],
  rollback_pending: ['rolled_back', 'rollback_failed'],
  succeeded: [],
  failed: [],
  rolled_back: [],
  rollback_failed: [],
  conflict: [],
};

/** True when `to` is a permitted transition from `from`. */
export function canTransition(from: ExecutionState, to: ExecutionState): boolean {
  return (TRANSITIONS[from] ?? []).includes(to);
}

/** Thrown when the engine attempts an invalid state transition (a bug or a tampered persisted record). */
export class InvalidTransitionError extends Error {
  constructor(public readonly from: ExecutionState, public readonly to: ExecutionState) {
    super(`Invalid execution transition: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

/** Guard used by the engine before persisting a new state; throws on an illegal transition. */
export function assertTransition(from: ExecutionState, to: ExecutionState): void {
  if (from === to) return; // Idempotent re-save of the same state is allowed.
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to);
}

// Recovery classification (§10). Given a record left in a non-terminal state after a crash/restart, decide how it may
// be recovered WITHOUT ever blindly repeating a side effect. The rule: a run that had not yet begin mutating is a
// clean failure/resume; a run that was executing/verifying/rolling-back has an UNCERTAIN provider result and must be
// reconciled — we never re-run the mutation just because the process died mid-flight.
const DISPOSITION: Record<ExecutionState, RecoveryDisposition> = {
  pending: 'finalize_failure',   // never claimed the work → safe to mark failed
  claimed: 'finalize_failure',   // claimed but no preflight/mutation yet → safe to mark failed
  preflight: 'finalize_failure', // preflight only, no mutation → safe to mark failed
  dry_run: 'finalize_failure',   // dry-run only, no mutation → safe to mark failed
  executing: 'reconcile',        // mutation may or may not have landed → reconcile, do NOT retry
  verifying: 'reconcile',        // mutation happened, verification unknown → reconcile
  rollback_pending: 'reconcile', // rollback outcome unknown → reconcile
  // terminal states (should not be passed here, handled defensively)
  succeeded: 'already_terminal',
  failed: 'already_terminal',
  rolled_back: 'already_terminal',
  rollback_failed: 'already_terminal',
  conflict: 'already_terminal',
};

const REASON: Record<RecoveryDisposition, string> = {
  finalize_failure: 'No mutation had started; the interrupted run can be finalized as failed.',
  reconcile: 'Provider result is uncertain after interruption; reconcile before any retry (no blind side effect).',
  resumable: 'The run may be safely retried from the start.',
  already_terminal: 'The run already reached a terminal state; no recovery needed.',
};

/** Classify an interrupted run for recovery. Never returns a disposition that repeats an uncertain side effect. */
export function classifyRecovery(executionId: string, state: ExecutionState): RecoveryClassification {
  const disposition = isTerminalState(state) ? 'already_terminal' : DISPOSITION[state];
  return { executionId, fromState: state, disposition, reason: REASON[disposition] };
}
