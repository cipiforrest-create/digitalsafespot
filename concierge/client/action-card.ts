import { text } from './dom';
import { pageLanguage, ui } from './page-language';
import type { ActionCard } from '../shared/chat-action';
import type { ExecutionStatusCard } from '../shared/execution-run';
// P3d client action-card renderer. This EXTENDS the existing concierge transcript UX (same .solution-card family and
// textContent-only discipline — nothing here injects markup). It renders the SERVER-OWNED confirmation card and the
// authoritative execution-status projection; it never decides state and never fabricates success. A single card node
// is reused across a turn so collection/confirmation/execution all update the same visible card in place. Confirm /
// Edit / Cancel buttons dispatch a command back through the normal chat turn — there is no separate execution API
// call from the browser. The card is keyed per capability so one pending action maps to one card.

export type ActionCommand = 'confirm' | 'edit' | 'cancel';

// Localized button/state labels (BA / EN / DE, following the page language). Kept tiny and source-free (mirrors
// execution-run.ts labels). Card title, field labels and note are already localized server-side.
type Lang = 'bs' | 'en' | 'de';
const STATE_LABEL: Record<Lang, Record<ActionCard['state'], string>> = {
  bs: {
    idle: 'Priprema', collecting: 'Prikupljanje podataka', ready_for_confirmation: 'Spremno za potvrdu',
    awaiting_confirmation: 'Čeka potvrdu', approved: 'Odobreno', executing: 'Izvršavanje', verifying: 'Provjera rezultata',
    succeeded: 'Dovršeno i provjereno', failed: 'Sigurno zaustavljeno', cancelled: 'Otkazano',
  },
  en: {
    idle: 'Preparing', collecting: 'Collecting details', ready_for_confirmation: 'Ready to confirm',
    awaiting_confirmation: 'Awaiting confirmation', approved: 'Approved', executing: 'Running', verifying: 'Verifying result',
    succeeded: 'Completed and verified', failed: 'Safely stopped', cancelled: 'Cancelled',
  },
  de: {
    idle: 'Vorbereitung', collecting: 'Angaben werden erfasst', ready_for_confirmation: 'Bereit zur Bestätigung',
    awaiting_confirmation: 'Wartet auf Bestätigung', approved: 'Freigegeben', executing: 'Wird ausgeführt', verifying: 'Ergebnis wird geprüft',
    succeeded: 'Abgeschlossen und geprüft', failed: 'Sicher gestoppt', cancelled: 'Abgebrochen',
  },
};
const EXEC_STATE_LABEL: Record<Lang, Record<ExecutionStatusCard['status'], string>> = {
  bs: {
    pending: 'Priprema', claimed: 'Zauzeto', preflight: 'Završna provjera', dry_run: 'Probni prolaz',
    executing: 'Izvršavanje', verifying: 'Provjera rezultata', succeeded: 'Dovršeno', failed: 'Zaustavljeno',
    rolled_back: 'Vraćeno', rollback_pending: 'Vraćanje u tijeku', rollback_failed: 'Vraćanje nije uspjelo',
    conflict: 'Sukob — potrebno novo odobrenje',
  },
  en: {
    pending: 'Preparing', claimed: 'Claimed', preflight: 'Final check', dry_run: 'Dry run',
    executing: 'Running', verifying: 'Verifying result', succeeded: 'Completed', failed: 'Stopped',
    rolled_back: 'Rolled back', rollback_pending: 'Rollback in progress', rollback_failed: 'Rollback failed',
    conflict: 'Conflict — new approval needed',
  },
  de: {
    pending: 'Vorbereitung', claimed: 'Übernommen', preflight: 'Abschlussprüfung', dry_run: 'Probelauf',
    executing: 'Wird ausgeführt', verifying: 'Ergebnis wird geprüft', succeeded: 'Abgeschlossen', failed: 'Gestoppt',
    rolled_back: 'Zurückgesetzt', rollback_pending: 'Zurücksetzen läuft', rollback_failed: 'Zurücksetzen fehlgeschlagen',
    conflict: 'Konflikt — neue Freigabe nötig',
  },
};
const FIELD_LABEL: Record<Lang, Record<string, string>> = {
  bs: { contactName: 'Ime', company: 'Firma', website: 'Web', contactEmail: 'E-mail', phone: 'Telefon', message: 'Poruka' },
  en: { contactName: 'Name', company: 'Company', website: 'Website', contactEmail: 'Email', phone: 'Phone', message: 'Message' },
  de: { contactName: 'Name', company: 'Firma', website: 'Website', contactEmail: 'E-Mail', phone: 'Telefon', message: 'Nachricht' },
};

export type ActionCardHandlers = { onCommand: (command: ActionCommand) => void };

/**
 * Render (or re-render) a confirmation/action card into `host`, reusing the existing card node when present so the
 * same visible card updates in place across collection → confirmation → execution. Returns the card node. Confirm is
 * only enabled when the server reports `canConfirm` (awaiting_confirmation); it is disabled the instant it is clicked
 * so a double-click cannot fire twice (server-side idempotency remains the real authority).
 */
export function renderActionCard(host: HTMLElement, card: ActionCard, handlers: ActionCardHandlers, existing?: HTMLElement | null): HTMLElement {
  const wrap = existing && existing.isConnected ? existing : text('div', '', 'message solution-card action-card');
  wrap.dataset.role = 'action-card';
  wrap.dataset.state = card.state;
  wrap.dataset.capability = card.capability;
  wrap.replaceChildren();

  wrap.append(text('strong', card.title));
  wrap.append(text('p', STATE_LABEL[pageLanguage()][card.state] ?? card.state, 'solution-note'));

  if (card.fields.length) {
    const list = text('ul', '', 'solution-evidence');
    for (const f of card.fields) list.append(text('li', `${f.label}: ${f.value}`));
    wrap.append(list);
  }
  if (card.missing.length) {
    const labels = FIELD_LABEL[pageLanguage()];
    wrap.append(text('p', `${ui('Nedostaje', 'Missing', 'Fehlt')}: ${card.missing.map(k => labels[k] ?? k).join(', ')}`, 'solution-next'));
  }
  if (card.state === 'awaiting_confirmation') {
    wrap.append(text('p', card.note, 'solution-note'));
  }

  // Controls only while the action is live and confirmable / editable; terminal states show no buttons.
  const terminal = card.state === 'succeeded' || card.state === 'cancelled';
  const inFlight = card.state === 'executing' || card.state === 'verifying' || card.state === 'approved';
  if (!terminal && !inFlight) {
    const actions = text('div', '', 'action-card-controls');
    if (card.canConfirm) {
      const confirm = text('button', ui('Potvrdi', 'Confirm', 'Bestätigen'), 'button primary') as HTMLButtonElement;
      confirm.type = 'button'; confirm.dataset.actionCommand = 'confirm';
      confirm.addEventListener('click', () => { confirm.disabled = true; handlers.onCommand('confirm'); });
      actions.append(confirm);
    }
    const edit = text('button', ui('Izmijeni', 'Edit', 'Bearbeiten'), 'button') as HTMLButtonElement;
    edit.type = 'button'; edit.dataset.actionCommand = 'edit';
    edit.addEventListener('click', () => handlers.onCommand('edit'));
    actions.append(edit);
    const cancel = text('button', ui('Otkaži', 'Cancel', 'Abbrechen'), 'button') as HTMLButtonElement;
    cancel.type = 'button'; cancel.dataset.actionCommand = 'cancel';
    cancel.addEventListener('click', () => handlers.onCommand('cancel'));
    actions.append(cancel);
    wrap.append(actions);
  }

  if (!wrap.isConnected) host.append(wrap);
  return wrap;
}

/** Update the card node with the authoritative execution status (truthful live states only — never faked). */
export function applyExecutionStatus(wrap: HTMLElement | null, status: ExecutionStatusCard): void {
  if (!wrap || !wrap.isConnected) return;
  wrap.dataset.execStatus = status.status;
  const note = wrap.querySelector<HTMLElement>('.solution-note');
  if (note) note.textContent = EXEC_STATE_LABEL[pageLanguage()][status.status] ?? status.status;
}
