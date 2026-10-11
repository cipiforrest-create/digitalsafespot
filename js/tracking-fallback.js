import { eventForLink, shouldUseTrackingFallback } from '/lib/tracking-events.mjs';

(() => {
  if (window.__dxTrackingFallbackInstalled) return;
  window.__dxTrackingFallbackInstalled = true;
  window.dataLayer = window.dataLayer || [];

  const push = (payload) => {
    if (!payload || !shouldUseTrackingFallback(window)) return;
    window.dataLayer.push({
      ...payload,
      event_id: `${payload.event}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      page_location: location.origin + location.pathname,
      page_path: location.pathname,
      page_title: document.title,
    });
  };

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest?.('a[href]');
    if (!anchor) return;
    const payload = eventForLink(anchor.getAttribute('href'), location.href);
    if (!payload) return;
    push({
      ...payload,
      click_text: (anchor.textContent || anchor.getAttribute('aria-label') || '').trim().slice(0, 100),
      click_location: anchor.closest('header,nav') ? 'header' : anchor.closest('footer') ? 'footer' : 'body',
    });
  }, true);

  const started = new WeakSet();
  document.addEventListener('focusin', (event) => {
    const form = event.target.closest?.('form');
    if (!form || started.has(form)) return;
    started.add(form);
    push({
      event: 'form_start',
      form_id: form.id || form.getAttribute('name') || 'form',
      form_name: form.dataset.source || form.dataset.trackForm || 'lead_form',
    });
  }, true);

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    push({
      event: 'form_submit',
      form_id: form.id || form.getAttribute('name') || 'form',
      form_name: form.dataset.source || form.dataset.trackForm || 'lead_form',
    });
  }, true);
})();
