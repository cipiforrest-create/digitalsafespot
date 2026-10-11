import {text} from './dom';
import type {ExecutionStatusCard} from '../shared/execution-run';
// P3b Controlled Execution status renderer. This EXTENDS the P3a preview UX rather than adding a new admin UI: it
// renders the server's AUTHORITATIVE execution status card with the same .solution-card family of classes and the
// same textContent-only discipline (nothing here can inject markup). It shows the real lifecycle state reported by
// the server — approved → checking → dry-run → executing → verifying → completed / conflict / failed / rolled-back —
// and NEVER decides success on its own: the status comes straight from the receipt projection. The card exposes only
// the safe projection (status, operation/target, counts, conflicts, rollback/verify flags, sanitized error code);
// it never receives actor ids, hashes, before/after content or authorization data.

// Server-reported lifecycle states. The client only DISPLAYS these; it never fakes a completion (P3c §13). The
// UX order is: Approved → Final preflight → Dry run → Executing → Verifying → Completed, or a safe failure state.
const statusLabel:Record<ExecutionStatusCard['status'],string>={
 pending:'Odobreno — priprema',
 claimed:'Odobreno — zauzeto',
 preflight:'Završna provjera',
 dry_run:'Probni prolaz',
 executing:'Izvršavanje',
 verifying:'Provjera rezultata',
 succeeded:'Dovršeno',
 failed:'Sigurno zaustavljeno',
 rolled_back:'Vraćeno na prethodno stanje',
 rollback_pending:'Vraćanje u tijeku',
 rollback_failed:'Vraćanje nije uspjelo',
 conflict:'Otkriven sukob — potrebno novo odobrenje',
};
const errorLabel:Record<NonNullable<ExecutionStatusCard['errorCode']>,string>={
 invalid_request:'Neispravan zahtjev',
 approval_mismatch:'Odobrenje se ne podudara',
 approval_expired:'Odobrenje je isteklo',
 unauthorized:'Nedovoljne ovlasti',
 execution_disabled:'Izvršenje je onemogućeno',
 unsupported_operation:'Operacija nije podržana',
 duplicate_request:'Dvostruki zahtjev',
 preflight_failed:'Sigurnosna provjera nije prošla',
 stale_target:'Cilj je promijenjen u međuvremenu',
 provider_failed:'Izvršenje nije uspjelo',
 verification_failed:'Provjera rezultata nije uspjela',
 rollback_failed:'Vraćanje nije uspjelo',
 locked:'Izvršenje je već u tijeku',
 fingerprint_mismatch:'Zahtjev se ne podudara s odobrenjem',
 reconciliation_required:'Potrebno je ručno usklađivanje',
};
const modeLabel:Record<ExecutionStatusCard['mode'],string>={dry_run:'Probni prolaz',execute:'Izvršenje'};

/**
 * Build the execution status card from a projected, already-sanitized ExecutionStatusCard. Returns the node so the
 * caller can append it to the transcript (like renderExecutionPreview). It renders no execute control — the server
 * receipt is authoritative; the client only DISPLAYS the reported state.
 */
export function renderExecutionStatus(card:ExecutionStatusCard):HTMLElement{
 const wrap=text('div','','message solution-card');wrap.dataset.role='execution-status';wrap.dataset.status=card.status;
 wrap.append(text('strong','STATUS IZVRŠENJA'));
 wrap.append(text('p',statusLabel[card.status],'solution-diagnosis'));
 wrap.append(text('p',`${card.operation} · ${card.target}`,'solution-note'));
 const flags=[modeLabel[card.mode],`${card.changeCount} izmjena`,card.verified?'provjereno':'nije provjereno',card.rollbackAvailable?'povrat dostupan':'bez povrata'];
 if(card.rollbackPerformed)flags.push('povrat izvršen');
 wrap.append(text('p',flags.join(' · '),'solution-note'));
 if(card.conflicts.length){const list=text('ul','','solution-evidence');for(const line of card.conflicts)list.append(text('li',line));wrap.append(list);}
 if(card.errorCode)wrap.append(text('p',errorLabel[card.errorCode],'solution-next'));
 return wrap;
}
