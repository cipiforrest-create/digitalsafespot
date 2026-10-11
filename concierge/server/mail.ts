import { HttpError } from './http';
import { resendApiKey, teamInbox as configTeamInbox, fromEmail } from './core/config';
// Resend HTTP API, no SDK. Needs RESEND_API_KEY; the sender defaults to the verified digital-x-marketing.com domain
// and team notifications go to the published Digital X inbox unless LEAD_NOTIFY_EMAIL overrides it.
export const mailConfigured = () => Boolean(resendApiKey());
export const teamInbox = () => configTeamInbox();
export async function sendMail(message: { to: string; subject: string; html: string; text: string; replyTo?: string; key: string }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', signal: AbortSignal.timeout(10000), redirect: 'error',
    headers: { Authorization: `Bearer ${resendApiKey()}`, 'Content-Type': 'application/json', 'Idempotency-Key': message.key },
    body: JSON.stringify({ from: fromEmail(), to: [message.to], subject: message.subject.slice(0, 180), html: message.html, text: message.text, ...(message.replyTo ? { reply_to: message.replyTo } : {}) }),
  });
  await response.body?.cancel();
  if (!response.ok) throw new HttpError(502, 'Delivery was not confirmed. Keep your summary and retry shortly.');
}
