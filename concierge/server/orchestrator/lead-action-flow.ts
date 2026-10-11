import type { Locale } from '../../shared/i18n';
import type { ExecutionActor } from '../../shared/execution-run';
import {
  pendingActionSchema, type PendingAction, type ChatActionState,
} from '../../shared/chat-action';
import { getPendingActionStore } from '../state/pending-action';
import { runControlledExecution, loadReceiptByExecutionId, projectStatus } from './controlled-execution';
import {
  detectLeadIntent, detectControl, collectFromMessage, nextMissing, promptFor,
  revalidate, freezeRunRequest, toActionCard,
} from './lead-action';

// P3d chat → action flow controller. This is the orchestrator's single seam for driving a lead.create action from
// conversation. It is deterministic (no model call): it reads/writes the durable pending action, runs the explicit
// state machine, re-validates every collected set through the shared strict schema, presents the confirmation card,
// and on CONFIRM hands the EXACT frozen approved run request to the ONE controlled-execution engine. It never calls
// the provider directly, never fabricates success, and resolves follow-up questions from the durable receipt. All
// control (actor, approval, flags, idempotency, verification) stays server-side; the client only reflects state.

export type Emit = (event: string, data: unknown) => void;
export type ActionTurnResult = { handled: boolean; reply: string; memoryNote: string };

// Localized, source-free status/confirmation copy. Facts never originate here.
type Loc = Record<Locale, string>;
const COPY = {
  cancelled: { bs: 'U redu, otkazao sam taj zahtjev. Ništa nije sačuvano.', en: 'Done — I’ve cancelled that request. Nothing was saved.', de: 'Erledigt — ich habe die Anfrage abgebrochen. Es wurde nichts gespeichert.' },
  nothingToCancel: { bs: 'Trenutno nema aktivnog zahtjeva za otkazivanje.', en: 'There’s no active request to cancel right now.', de: 'Es gibt derzeit keine aktive Anfrage zum Abbrechen.' },
  editReopened: { bs: 'Naravno — šta želite izmijeniti? Postojeći podaci su sačuvani.', en: 'Of course — what would you like to change? Your existing details are kept.', de: 'Natürlich — was möchten Sie ändern? Ihre bisherigen Angaben bleiben erhalten.' },
  succeeded: { bs: 'Vaš zahtjev je sačuvan i provjeren. Digital X vas sada može kontaktirati putem podataka koje ste potvrdili.', en: 'Your request has been saved and verified. Digital X can now follow up using the contact details you confirmed.', de: 'Ihre Anfrage wurde gespeichert und verifiziert. Digital X kann Sie nun mit den bestätigten Kontaktdaten erreichen.' },
  failed: { bs: 'Nažalost, zahtjev nije mogao biti sigurno sačuvan, pa ništa nije zabilježeno. Možete pokušati ponovo.', en: 'I’m sorry — the request could not be saved safely, so nothing was recorded. You can try again.', de: 'Leider konnte die Anfrage nicht sicher gespeichert werden, daher wurde nichts erfasst. Sie können es erneut versuchen.' },
  statusSucceeded: { bs: 'Da — provjerio sam u evidenciji: vaš zahtjev je sačuvan i potvrđen.', en: 'Yes — I checked the record: your request is saved and verified.', de: 'Ja — ich habe den Datensatz geprüft: Ihre Anfrage ist gespeichert und verifiziert.' },
  statusNone: { bs: 'Još nije izvršeno nijedno spremanje — nema zabilježenog zahtjeva.', en: 'No save has happened yet — there’s no recorded request.', de: 'Es wurde noch nichts gespeichert — es gibt keine erfasste Anfrage.' },
  statusFailed: { bs: 'Posljednji pokušaj nije uspješno sačuvan, pa ništa nije zabilježeno.', en: 'The last attempt did not save successfully, so nothing was recorded.', de: 'Der letzte Versuch wurde nicht erfolgreich gespeichert, daher wurde nichts erfasst.' },
  statusPending: { bs: 'Zahtjev je pripremljen, ali još nije potvrđen — ništa nije sačuvano.', en: 'The request is prepared but not confirmed yet — nothing is saved.', de: 'Die Anfrage ist vorbereitet, aber noch nicht bestätigt — es ist nichts gespeichert.' },
  confirmNoCard: { bs: 'Nema zahtjeva koji čeka potvrdu.', en: 'There’s no request waiting for confirmation.', de: 'Es gibt keine Anfrage, die auf Bestätigung wartet.' },
  disabled: { bs: 'Spremanje zahtjeva trenutno nije dostupno. Vaši podaci nisu sačuvani. Naš tim možete kontaktirati izravno.', en: 'Saving the request isn’t available right now, so nothing was saved. You can reach our team directly in the meantime.', de: 'Das Speichern der Anfrage ist derzeit nicht möglich, daher wurde nichts gespeichert. Sie können unser Team direkt kontaktieren.' },
  correctInvalid: { bs: 'Čini se da neki podatak nije ispravan. Možete li ga ponoviti?', en: 'One of the details doesn’t look valid. Could you re-enter it?', de: 'Eine der Angaben scheint ungültig zu sein. Können Sie sie erneut eingeben?' },
} satisfies Record<string, Loc>;


export type ActionTurnInput = {
  sid: string;
  message: string;
  locale: Locale;
  actor: ExecutionActor | null;   // resolved server-side from the session; null = no trusted owner (fail closed)
  command?: 'confirm' | 'edit' | 'cancel';  // explicit client card button (a hint; the server re-validates)
  now?: number;
};

const store = () => getPendingActionStore();
const fresh = (sid: string, now: number): PendingAction => pendingActionSchema.parse({
  v: 1, sid, capability: 'lead.create', state: 'idle', args: {}, reason: '', run: null, executionId: null, createdAt: now, updatedAt: now,
});
function isTerminal(state: ChatActionState): boolean { return state === 'succeeded' || state === 'cancelled'; }

/** Emit the visitor-safe action card for the current pending action. */
function emitCard(action: PendingAction, locale: Locale, emit: Emit): void {
  emit('action_card', toActionCard(action, locale));
}

/**
 * Drive one conversational turn against the durable lead.create action. Returns `handled:false` when the turn is not
 * about an action (the orchestrator then runs its normal answer path). When handled, the reply + any card/status
 * events have already been emitted and the orchestrator just finalizes the stream.
 */
export async function handleActionTurn(input: ActionTurnInput, emit: Emit): Promise<ActionTurnResult> {
  const now = input.now ?? Date.now();
  const locale = input.locale;
  const message = input.message ?? '';
  const control = input.command ?? detectControl(message);
  const existing = await store().load(input.sid);

  // ---- No pending action (or a terminal one) ----
  if (!existing || isTerminal(existing.state)) {
    if (control === 'status') return reportStatus(existing, locale);
    if (control === 'confirm' || control === 'cancel' || control === 'edit') {
      // A stray control with no live action: answer honestly, do not start anything.
      const reply = control === 'cancel' ? L(COPY.nothingToCancel, locale) : L(COPY.confirmNoCard, locale);
      return { handled: true, reply, memoryNote: '' };
    }
    if (!detectLeadIntent(message)) return { handled: false, reply: '', memoryNote: '' };
    // Start a fresh action and collect from the first message.
    let action = fresh(input.sid, now);
    action = { ...action, state: 'collecting', args: collectFromMessage({}, message, null), reason: message.slice(0, 200), updatedAt: now };
    return advance(action, locale, emit);
  }

  // ---- A live pending action exists ----
  if (control === 'cancel') {
    await store().clear(input.sid);
    const cancelled = { ...existing, state: 'cancelled' as ChatActionState, run: null, executionId: null, updatedAt: now };
    emitCard(cancelled, locale, emit);
    return { handled: true, reply: L(COPY.cancelled, locale), memoryNote: 'lead action cancelled' };
  }
  if (control === 'status') return reportStatus(existing, locale);
  if (control === 'edit') {
    // Return to collection and INVALIDATE the frozen approval (run=null). Any new field in this same message is kept.
    const reopened: PendingAction = { ...existing, state: 'collecting', run: null, executionId: null, args: collectFromMessage(existing.args, message, null), updatedAt: now };
    await store().save(reopened);
    emitCard(reopened, locale, emit);
    return { handled: true, reply: L(COPY.editReopened, locale), memoryNote: 'lead action edit' };
  }
  if (control === 'confirm') {
    if (existing.state !== 'awaiting_confirmation' || !existing.run) {
      return { handled: true, reply: L(COPY.confirmNoCard, locale), memoryNote: '' };
    }
    return execute(existing, input.actor, locale, emit, now);
  }

  // Ordinary message during an active action → accumulate fields and re-evaluate.
  const awaiting = nextMissing(existing.args);
  const merged = { ...existing, args: collectFromMessage(existing.args, message, awaiting), updatedAt: now };
  // Collecting a new field while a card was already shown implicitly re-opens collection (approval invalidated).
  const reset: PendingAction = existing.state === 'awaiting_confirmation'
    ? { ...merged, state: 'collecting', run: null, executionId: null }
    : merged;
  return advance(reset, locale, emit);
}


/**
 * Advance a collecting action: re-validate through the strict schema. If a required field is still missing, ask ONLY
 * for the next missing one and persist. If everything validates, FREEZE the approval-bound run request, move to
 * awaiting_confirmation, persist, and present the confirmation card.
 */
async function advance(action: PendingAction, locale: Locale, emit: Emit): Promise<ActionTurnResult> {
  const now = action.updatedAt;
  const missing = nextMissing(action.args);
  if (missing) {
    const withIntro = (action.reason !== '' && Object.values(action.args).filter(Boolean).length <= 1);
    const saved: PendingAction = { ...action, state: 'collecting', run: null };
    await store().save(saved);
    emitCard(saved, locale, emit);
    const reply = promptFor(missing, locale, withIntro);
    return { handled: true, reply, memoryNote: `collecting ${missing}` };
  }
  const check = revalidate(action.args);
  if (!check.ok) {
    // Required set present but something is invalid (e.g. malformed email/phone): ask for a correction, do not freeze.
    const saved: PendingAction = { ...action, state: 'collecting', run: null };
    await store().save(saved);
    emitCard(saved, locale, emit);
    return { handled: true, reply: L(COPY.correctInvalid, locale), memoryNote: 'lead action correction' };
  }
  // Valid → freeze the approval-bound run request and present the confirmation card.
  const run = freezeRunRequest(check.input, now);
  const ready: PendingAction = { ...action, state: 'awaiting_confirmation', run, executionId: null };
  await store().save(ready);
  emitCard(ready, locale, emit);
  const reply = L({ bs: 'Molim vas da pregledate i potvrdite zahtjev u kartici ispod.', en: 'Please review and confirm the request in the card below.', de: 'Bitte prüfen und bestätigen Sie die Anfrage in der Karte unten.' }, locale);
  return { handled: true, reply, memoryNote: 'lead action ready_for_confirmation' };
}

/**
 * CONFIRM: inject the trusted server actor and hand the EXACT frozen approved run request to the ONE controlled-
 * execution engine. The engine owns revalidation, kill switches, authz, preflight, dry-run, mutation, read-back
 * verification, idempotency and the durable receipt. We derive the final NL reply + status card STRICTLY from the
 * returned receipt — never from the model, never optimistic. Double-confirm replays the same idempotency key and
 * returns the same receipt (no second lead). A disabled/unauthorized attempt fails closed with an honest message.
 */
async function execute(action: PendingAction, actor: ExecutionActor | null, locale: Locale, emit: Emit, now: number): Promise<ActionTurnResult> {
  const run = action.run!;
  // Reflect the approved→executing transition for the UI before the engine call (truthful: we are about to attempt).
  const executingCard = { ...action, state: 'executing' as ChatActionState, executionId: run.executionId };
  await store().save(executingCard);
  emitCard(executingCard, locale, emit);

  try {
    const receipt = await runControlledExecution({ ...run, actor }, { actorContext: actor, now: () => now });
    const statusCard = projectStatus(receipt);
    emit('execution_status', statusCard);
    const verified = receipt.state === 'succeeded' && (receipt.verification?.ok ?? false);
    const finalState: ChatActionState = verified ? 'succeeded' : 'failed';
    const finalAction: PendingAction = { ...action, state: finalState, executionId: receipt.executionId };
    await store().save(finalAction);
    emitCard(finalAction, locale, emit);
    const reply = verified ? L(COPY.succeeded, locale) : L(COPY.failed, locale);
    return { handled: true, reply, memoryNote: `lead action ${finalState}` };
  } catch (error) {
    // Gate failures (execution_disabled / unauthorized / fingerprint_mismatch / locked …) throw before any mutation.
    const code = (error as { code?: string }).code ?? '';
    const failed: PendingAction = { ...action, state: 'failed', executionId: run.executionId };
    await store().save(failed);
    emitCard(failed, locale, emit);
    const reply = (code === 'execution_disabled' || code === 'unauthorized') ? L(COPY.disabled, locale) : L(COPY.failed, locale);
    return { handled: true, reply, memoryNote: `lead action gate ${code || 'error'}` };
  }
}

/**
 * Answer a follow-up question ("Did you actually save it?") STRICTLY from durable state: the pending action's
 * execution id → the authoritative receipt. Never from conversational memory. If no execution occurred, say so.
 */
async function reportStatus(action: PendingAction | null, locale: Locale): Promise<ActionTurnResult> {
  if (!action || !action.executionId) {
    if (action && action.state === 'awaiting_confirmation') return { handled: true, reply: L(COPY.statusPending, locale), memoryNote: '' };
    return { handled: true, reply: L(COPY.statusNone, locale), memoryNote: '' };
  }
  const receipt = await loadReceiptByExecutionId(action.executionId);
  if (!receipt) return { handled: true, reply: L(COPY.statusNone, locale), memoryNote: '' };
  const verified = receipt.state === 'succeeded' && (receipt.verification?.ok ?? false);
  const reply = verified ? L(COPY.statusSucceeded, locale) : L(COPY.statusFailed, locale);
  return { handled: true, reply, memoryNote: `status ${receipt.state}` };
}

const L = (m: Loc, locale: Locale) => m[locale] ?? m.bs;
