// bs/en/de copy for every visitor-facing error code, plus shared fallback/receipt keys.
// Parity is enforced by concierge/tests/i18n.test.ts: every locale defines exactly the same keys.
import type { ErrorCode } from '../server/core/errors';
export const locales = ['bs', 'en', 'de'] as const;
export type Locale = (typeof locales)[number];
type MessageKey = ErrorCode | 'fallback' | 'receipt_saved' | 'receipt_sent';
export const messages: Record<Locale, Record<MessageKey, string>> = {
  bs: {
    not_available: 'Asistent trenutno nije dostupan. Pokušajte kasnije.',
    method_not_allowed: 'Provjerite unesene podatke i pokušajte ponovo sa stranice.',
    invalid_request: 'Provjerite unesene podatke i pokušajte ponovo sa stranice.',
    too_large: 'Zahtjev je prevelik. Skratite poruku i pokušajte ponovo.',
    rate_limited: 'Dostignuto je trenutno ograničenje. Vaša poruka je sačuvana. Pokušajte kasnije ili odaberite drugi način razgovora.',
    session_unavailable: 'Sesija je završena. Ponovo uključite razgovor; dosadašnje poruke su sačuvane.',
    ai_unavailable: 'Asistent trenutno nije dostupan. Pokušajte kasnije.',
    voice_unavailable: 'Glasovni razgovor trenutno nije dostupan. Pokušajte ponovo ili nastavite pisanjem.',
    delivery_unavailable: 'Slanje upita trenutno nije povezano. Preuzmite sažetak i sačuvajte ga za kasnije.',
    unsafe_url: 'Web adresu nije moguće sigurno provjeriti. Provjerite javnu adresu i pokušajte ponovo.',
    insecure_connection: 'Potrebna je sigurna veza. Pokušajte ponovo sa stranice.',
    upstream_unavailable: 'Veza je prekinuta ili odgovor nije dostupan. Pokušajte ponovo; vaša poruka je sačuvana.',
    fallback: 'Veza je prekinuta ili odgovor nije dostupan. Pokušajte ponovo; vaša poruka je sačuvana.',
    receipt_saved: 'Servis za predaju je prihvatio upit. Spremanje u odredišni CRM još nije potvrđeno.',
    receipt_sent: 'Upit je poslan Digital X timu. Javit ćemo vam se na navedeni e-mail.',
  },
  en: {
    not_available: 'The assistant is not available right now. Please try again later.',
    method_not_allowed: 'Please check the information and try again from the page.',
    invalid_request: 'Please check the information and try again from the page.',
    too_large: 'This request is too large. Please shorten your message and try again.',
    rate_limited: 'You’ve reached the limit for now. Your message is saved. Please try again later or choose another way to talk.',
    session_unavailable: 'Your session has ended. Please reconnect; your previous messages are saved.',
    ai_unavailable: 'The assistant is not available right now. Please try again later.',
    voice_unavailable: 'Voice is unavailable right now. Please try again or continue in text.',
    delivery_unavailable: 'Enquiry delivery is not connected right now. Download your summary and keep it for later.',
    unsafe_url: 'The website address could not be verified safely. Check the public address and try again.',
    insecure_connection: 'A secure connection is required. Please try again from the page.',
    upstream_unavailable: 'The connection was interrupted or no response is available. Please try again; your message is saved.',
    fallback: 'The connection was interrupted or no response is available. Please try again; your message is saved.',
    receipt_saved: 'The submission service accepted the enquiry. Saving to the destination CRM is not yet confirmed.',
    receipt_sent: 'Your enquiry was sent to the Digital X team. We will reply to the email you provided.',
  },
  de: {
    not_available: 'Der Assistent ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.',
    method_not_allowed: 'Bitte prüfen Sie die Angaben und versuchen Sie es erneut von der Seite.',
    invalid_request: 'Bitte prüfen Sie die Angaben und versuchen Sie es erneut von der Seite.',
    too_large: 'Diese Anfrage ist zu groß. Bitte kürzen Sie Ihre Nachricht und versuchen Sie es erneut.',
    rate_limited: 'Das aktuelle Limit ist erreicht. Ihre Nachricht ist gespeichert. Bitte versuchen Sie es später oder wählen Sie einen anderen Weg.',
    session_unavailable: 'Ihre Sitzung ist beendet. Bitte verbinden Sie sich neu; Ihre bisherigen Nachrichten sind gespeichert.',
    ai_unavailable: 'Der Assistent ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.',
    voice_unavailable: 'Die Sprachfunktion ist derzeit nicht verfügbar. Bitte versuchen Sie es erneut oder schreiben Sie weiter.',
    delivery_unavailable: 'Der Versand der Anfrage ist derzeit nicht verbunden. Laden Sie Ihre Zusammenfassung herunter und bewahren Sie sie auf.',
    unsafe_url: 'Die Webadresse konnte nicht sicher geprüft werden. Prüfen Sie die öffentliche Adresse und versuchen Sie es erneut.',
    insecure_connection: 'Eine sichere Verbindung ist erforderlich. Bitte versuchen Sie es erneut von der Seite.',
    upstream_unavailable: 'Die Verbindung wurde unterbrochen oder es ist keine Antwort verfügbar. Bitte versuchen Sie es erneut; Ihre Nachricht ist gespeichert.',
    fallback: 'Die Verbindung wurde unterbrochen oder es ist keine Antwort verfügbar. Bitte versuchen Sie es erneut; Ihre Nachricht ist gespeichert.',
    receipt_saved: 'Der Übermittlungsdienst hat die Anfrage angenommen. Die Speicherung im Ziel-CRM ist noch nicht bestätigt.',
    receipt_sent: 'Ihre Anfrage wurde an das Digital X Team gesendet. Wir melden uns unter der angegebenen E-Mail.',
  },
};
export function resolveLocale(value: string | undefined): Locale {
  const short = String(value || '').slice(0, 2).toLowerCase();
  return (locales as readonly string[]).includes(short) ? (short as Locale) : 'bs';
}
export function t(key: MessageKey, locale: Locale = 'bs'): string {
  return messages[locale]?.[key] ?? messages.bs[key];
}