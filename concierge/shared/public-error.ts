import { errorCodes, type ErrorCode } from '../server/core/errors';
import { t, resolveLocale, type Locale } from './i18n';
/** Stable visitor messages; never echo provider payloads or infrastructure errors. */
export function publicError(message:string, locale?:string):string {
 // Preferred path: a typed error code resolves to locale-aware i18n copy.
 if((errorCodes as readonly string[]).includes(message)) return t(message as ErrorCode, resolveLocale(locale ?? 'bs') as Locale);
 // Legacy path: free-text messages are mapped by pattern to stable bs copy (behaviour unchanged).
 if(/[čćžšđ]/i.test(message))return message;
 if(/microphone|permission/i.test(message))return 'Mikrofon nije dostupan. Provjerite dozvolu ili nastavite pisanjem.';
 if(/not recovered|slow|congestion/i.test(message))return 'Veza se nije oporavila. Ponovo uključite glas ili nastavite pisanjem. Razgovor je sačuvan.';
 if(/session|expired|reconnect/i.test(message))return 'Sesija je završena. Ponovo uključite razgovor; dosadašnje poruke su sačuvane.';
 if(/limit|busy|wait/i.test(message))return 'Dostignuto je trenutno ograničenje. Vaša poruka je sačuvana. Pokušajte kasnije ili odaberite drugi način razgovora.';
 if(/enquiry|webhook|delivery/i.test(message))return 'Slanje upita trenutno nije povezano. Preuzmite sažetak i sačuvajte ga za kasnije.';
 if(/voice|audio|spoken/i.test(message))return 'Glasovni razgovor trenutno nije dostupan. Pokušajte ponovo ili nastavite pisanjem.';
 if(/not available yet|key|secret/i.test(message))return 'Asistent trenutno nije dostupan. Pokušajte kasnije.';
 if(/private|public|address|url|redirect|fetch|website|response.*large/i.test(message))return 'Web adresu nije moguće sigurno provjeriti. Provjerite javnu adresu i pokušajte ponovo.';
 if(/information|invalid|request|allowed|json|post|secure/i.test(message))return 'Provjerite unesene podatke i pokušajte ponovo sa stranice.';
 return 'Veza je prekinuta ili odgovor nije dostupan. Pokušajte ponovo; vaša poruka je sačuvana.';
}
