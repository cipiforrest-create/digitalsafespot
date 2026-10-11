// P3d lead/contact intent and action-control detection. Pure, dependency-free and browser-safe so the SAME rules
// decide two things: the server orchestrator uses them to start/drive the durable lead.create action, and the client
// uses them only to ROUTE a text turn to the v2 action path (it never decides action state — the server re-derives
// and re-validates every step). Moved verbatim from server/orchestrator/lead-action.ts, which re-exports them.

// The strict email/phone shapes mirror lead-create.ts so collection rejects the same malformed values the executor
// would.
export const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]{2,}/;
export const PHONE_RE = /(?:(?:\+|00)\d[\d\s().-]{6,}\d)|(?:\b0\d[\d\s().-]{6,}\d)/;
export const URL_RE = /\b((?:https?:\/\/)?(?:www\.)?[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?)\b/i;

// Lead/contact intent triggers (stem-ish, diacritic-tolerant). A turn is a lead intent when the visitor expresses
// wanting Digital X to contact them / make a request / be reached. Deliberately specific so it does not fire on a
// generic pricing or info question (those keep the existing grounded-answer path).
const CONTACT_TRIGGERS = [
  'kontakt', 'kontaktir', 'javite', 'javi mi', 'nazov', 'pozov', 'stupite u kontakt', 'da me kontaktirate',
  'ostav', 'posalj', 'upit', 'ponud', 'zatraz', 'zelim da me', 'želim da me', 'trebam', 'treba mi',
  'contact me', 'reach out', 'get in touch', 'reach me', 'call me', 'email me', 'send me', 'request a',
  'i would like', "i'd like", 'i want', 'quote', 'kontaktieren', 'melden sie', 'anfrage', 'angebot',
];
// A stronger "wants a website / service and to be contacted" cue; combined with a contact trigger this is a lead.
const SERVICE_TRIGGERS = ['websajt', 'web sajt', 'web stranic', 'stranic', 'website', 'web site', 'ai ', 'webseite', 'automatizac', 'automation', 'recepcion'];

export function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** True when the message expresses a desire for Digital X to contact them / make a request (a lead intent). */
export function detectLeadIntent(message: string): boolean {
  const n = norm(message);
  if (!n.trim()) return false;
  const hasContact = CONTACT_TRIGGERS.some(t => n.includes(norm(t)));
  if (hasContact) return true;
  // "I need an AI website for my business" style: a service cue plus a first-person need verb also starts a lead.
  const hasService = SERVICE_TRIGGERS.some(t => n.includes(norm(t)));
  const hasNeed = /(trebam|treba mi|zelim|zelja|hocu|hoću|i need|i want|we need|ich brauche|wir brauchen)/.test(n);
  return hasService && hasNeed;
}

// Client-side ROUTING only: a stricter subset of detectLeadIntent that sends a turn to the v2 action flow when the
// visitor explicitly asks to be contacted or for an offer, or states a service need ("I need an AI website"). Broad
// triggers ("i want", "trebam", "send me") are left out on purpose so navigation-style asks ("I want to see the
// examples") stay on the site-action chat path. Anything routed here is still re-checked by detectLeadIntent on the
// server; anything not routed simply keeps the existing production behaviour.
const EXPLICIT_CONTACT = [
  'kontaktir', 'javite', 'javi mi', 'javite mi', 'nazov', 'pozov', 'stupite u kontakt', 'zelim da me', 'ponud', 'upit',
  'contact me', 'contact us', 'reach out', 'get in touch', 'reach me', 'call me', 'email me', 'quote',
  'kontaktieren', 'melden sie', 'rufen sie', 'anfrage', 'angebot',
];
export function isLeadRequest(message: string): boolean {
  const n = norm(message);
  if (!n.trim()) return false;
  if (EXPLICIT_CONTACT.some(t => n.includes(norm(t)))) return true;
  const hasService = SERVICE_TRIGGERS.some(t => n.includes(norm(t)));
  const hasNeed = /(trebam|treba mi|zelim|hocu|i need|we need|ich brauche|wir brauchen)/.test(n);
  return hasService && hasNeed;
}

// Interrupt / control language recognized BEFORE ordinary interpretation. Returns the control kind or null.
export type ActionControl = 'cancel' | 'edit' | 'confirm' | 'status';
export function detectControl(message: string): ActionControl | null {
  // A message that carries a data value (email/phone/url) is a field answer, not a control command — even if it
  // happens to contain a control substring (e.g. an email like "...-confirm@..."). Treat it as data, not control.
  if (EMAIL_RE.test(message) || PHONE_RE.test(message) || URL_RE.test(message)) return null;
  const n = norm(message);
  if (/(otkaz|ponisti|odustani|nemoj (to )?(slati|cuvati|spremati)|stani|prekini|zaboravi|cancel|never mind|stop|don't send|do not send|don't save|do not save)/.test(n)) return 'cancel';
  if (/(izmijeni|izmjeni|promijeni|promjeni|uredi|ispravi|edit it|change my|change the|edit the|update my|let me edit|show me first|prikazi prvo)/.test(n)) return 'edit';
  if (/(^|\b)(potvrdi|potvrda|posalji sada|da posalji|confirm|yes send|send it now|go ahead|proceed)(\b|$)/.test(n)) return 'confirm';
  if (/(da li (si|je|ste)|jesi li|jeste li|je li (to )?(sacuvano|spremljeno|poslano)|did (you|that|it)|was it (saved|sent)|did it work|what happened|sta se desilo|status)/.test(n)) return 'status';
  return null;
}
