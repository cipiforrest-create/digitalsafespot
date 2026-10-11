export function el<T extends Element = HTMLElement>(selector: string): T { const node = document.querySelector<T>(selector); if (!node) throw new Error(`Missing element: ${selector}`); return node; }
export function text<K extends keyof HTMLElementTagNameMap>(tag: K, value: string, className = '') { const node = document.createElement(tag); node.textContent = value; node.className = className; return node; }
let noticeTimer: ReturnType<typeof setTimeout>;
export function notice(message: string) { const node = el('#notice'); node.textContent = message; node.hidden = false; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { node.hidden = true; }, 6500); }
export async function post(path: string, body: unknown, signal?: AbortSignal) {
  const response = await fetch(path, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: signal ? AbortSignal.any([signal,AbortSignal.timeout(45000)]) : AbortSignal.timeout(45000) });
  if (!response.ok) { const value = await response.json().catch(() => ({})) as { message?: string }; throw new Error(value.message || 'Zahtjev nije završen. Pokušajte ponovo.'); } return response;
}
function hasConsent() { try { return localStorage.getItem('dx-consent') === 'granted'; } catch { return false; } }
declare global { interface Window { dataLayer?: (Record<string, unknown> | IArguments)[] } }
// Keep the established Google consent-command queue format used by the existing site.
// eslint-disable-next-line prefer-rest-params
function gtag(..._args: unknown[]) { window.dataLayer?.push(arguments); }
export function track(event: string, detail: Record<string, string> = {}) { if (!hasConsent()) return; window.dataLayer ||= []; const mapped = event === 'concierge_lead_handoff' ? 'generate_lead' : event === 'concierge_audit_download' ? 'file_download' : 'cta_click'; window.dataLayer.push({ event: mapped, interaction: event, cta_text: event, ...detail, experience: 'digital_x', page_path: location.pathname }); }
export function trackPage() { if (hasConsent()) gtag('event','page_view',{send_to:'G-TY8M7MTJLN',page_location:location.origin+location.pathname,page_title:document.title}); }
export function loadAnalytics() { if (!hasConsent() || document.getElementById('concierge-gtm')) return; window.dataLayer ||= []; const consent = {analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'}; gtag('consent','default',consent); window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' }); const script = document.createElement('script'); script.id = 'concierge-gtm'; script.async = true; script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-5JT2X695'; document.head.append(script); }
