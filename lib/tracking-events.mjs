export function classifyHref(href, base = 'https://www.digital-x-marketing.com/') {
  const raw = String(href || '').trim();
  if (/^mailto:/i.test(raw)) return 'email';
  if (/^tel:/i.test(raw)) return 'phone';
  if (/^https?:\/\/(?:wa\.me|api\.whatsapp\.com)(?:\/|$)/i.test(raw)) return 'whatsapp';
  try {
    const url = new URL(raw, base);
    if (url.hostname === 'audit.digital-x-marketing.com') return 'audit';
    const baseUrl = new URL(base);
    return url.hostname === baseUrl.hostname ? 'internal' : 'outbound';
  } catch {
    return 'unknown';
  }
}

export function shouldUseTrackingFallback(win = {}) {
  return !Boolean(win.__dxEnrichedTracking);
}

export function eventForLink(href, base) {
  const type = classifyHref(href, base);
  if (['email', 'phone', 'whatsapp'].includes(type)) {
    return { event: 'contact_click', contact_method: type, click_type: type };
  }
  if (type === 'audit') {
    return { event: 'click', click_type: 'audit', cta_name: 'audit' };
  }
  return null;
}
