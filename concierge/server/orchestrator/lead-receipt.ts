import { createHash } from 'node:crypto';
import type { Locale } from '../../shared/i18n';
import { t } from '../../shared/i18n';
import type { Receipt, LeadReceiptCard, DestinationKind } from '../../shared/lead-receipt';
import type { ProjectBrief } from '../../shared/project-brief';
import { acceptedChannels } from '../lead-destination';

// T22 receipt messaging. The visitor-facing message is chosen ONLY from receipts a destination actually returned.
// NO RECEIPT = NO CLAIM: with no accepted channel the message never says the enquiry was sent or saved — it tells
// the visitor to keep their summary. Messages are fixed deterministic i18n strings; nothing is model-generated.

// Deterministic decline message when no destination accepted (delivery not connected / all channels failed).
const NOT_DELIVERED: Record<Locale, string> = {
  bs: 'Slanje upita trenutno nije potvrđeno. Sačuvajte svoj sažetak i pokušajte ponovo malo kasnije.',
  en: 'Delivery of your enquiry is not confirmed right now. Keep your summary and try again shortly.',
  de: 'Der Versand Ihrer Anfrage ist derzeit nicht bestätigt. Bewahren Sie Ihre Zusammenfassung auf und versuchen Sie es später erneut.',
};

/**
 * Build the bounded visitor result from receipts. `delivered` and `channels` reflect ONLY accepted receipts. The
 * message is `receipt_sent` when email was accepted (a person will reply), otherwise `receipt_saved` when only the
 * webhook was accepted (queued to the destination service), otherwise the not-delivered decline. No claim without
 * a receipt.
 */
export function toReceiptCard(receipts: Receipt[], locale: Locale): LeadReceiptCard {
  const channels: DestinationKind[] = acceptedChannels(receipts);
  const delivered = channels.length > 0;
  let message: string;
  if (!delivered) message = NOT_DELIVERED[locale];
  else if (channels.includes('email')) message = t('receipt_sent', locale);   // a human will reply by email
  else message = t('receipt_saved', locale);                                   // webhook queued; CRM save not yet confirmed
  return { delivered, channels, message };
}

/** Canonical hash of the exact brief content being delivered, so a retry can be matched to the same dispatch. */
export function briefContentHash(brief: ProjectBrief): string {
  const shape = brief.fields
    .filter(f => f.status === 'known')
    .map(f => ({ k: f.key, v: f.value }))
    .sort((a, b) => (a.k < b.k ? -1 : 1));
  return createHash('sha256').update(JSON.stringify({ goal: brief.goal, shape })).digest('base64url').slice(0, 32);
}
