/* Digital X homepage — film HUD, navigation, service explorer, growth path,
   before/after concepts and the lead form.
   The frame scrub itself is driven by /cinematic-shared/scroll-cinematic.js. */
(() => {
  'use strict';

  const doc = document;
  const root = doc.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* Capture the Lenis instance the shared engine creates so anchors and the
     skip button travel through the same smooth pipeline. */
  if (window.Lenis && !window.__dxLenisWrapped) {
    const Original = window.Lenis;
    const Wrapped = function (options) {
      const instance = new Original(options);
      window.__dxLenis = instance;
      return instance;
    };
    Wrapped.prototype = Original.prototype;
    window.Lenis = Wrapped;
    window.__dxLenisWrapped = true;
  }

  const navHeight = () => (doc.querySelector('[data-nav]')?.offsetHeight || 72);

  const scrollTo = (target, offset = 0) => {
    const element = typeof target === 'string' ? doc.querySelector(target) : target;
    if (!element) return;
    if (window.__dxLenis && !reduced) {
      window.__dxLenis.scrollTo(element, { offset, duration: 1.4 });
      return;
    }
    const top = element.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  };

  /* ---------- Film: rail, chapter marks, skip ---------- */

  const film = doc.querySelector('[data-film]');
  const rail = doc.querySelector('[data-film-rail]');
  // The closing plate is the only copy in the film; `is-resolved` fades in the
  // scrim that makes it readable, and nothing else is drawn over the picture.
  const RESOLVE_AT = 0.92;
  let moved = false;
  let resolved = false;
  let running = false;

  if (film && reduced) film.classList.add('film--still');

  window.DX_FILM = {
    onProgress(progress) {
      if (!film) return;
      if (rail) rail.style.transform = `scaleX(${progress.toFixed(4)})`;
      if (!moved && progress > 0.01) { moved = true; film.classList.add('has-moved'); }
      if (moved && progress <= 0.004) { moved = false; film.classList.remove('has-moved'); }
      // While the film is playing the navigation stands down, so the only
      // things on screen are the picture and the brand mark. It comes back the
      // moment the film resolves, alongside the closing plate.
      const playing = progress > 0.002 && progress < RESOLVE_AT;
      if (playing !== running) {
        running = playing;
        root.classList.toggle('film-running', running);
      }
      const next = progress >= RESOLVE_AT;
      if (next === resolved) return;
      resolved = next;
      film.classList.toggle('is-resolved', resolved);
    },
  };

  doc.querySelector('[data-film-skip]')?.addEventListener('click', () => {
    const after = film?.nextElementSibling;
    if (after) scrollTo(after, -navHeight() + 8);
  });

  /* The shared engine hands the page over once the coarse pass has decoded;
     `is-ready` releases the scroll lock and fades the canvas in. */
  window.addEventListener('cinematic:ready', () => root.classList.add('is-ready'), { once: true });
  window.setTimeout(() => root.classList.add('is-ready'), 8000);
  doc.querySelector('[data-boot-skip]')?.addEventListener('click', () => root.classList.add('is-ready'));

  /* ---------- Navigation ---------- */

  const nav = doc.querySelector('[data-nav]');
  const toggle = doc.querySelector('[data-nav-toggle]');
  const sheet = doc.querySelector('[data-nav-sheet]');
  const setSheet = (open) => {
    if (!toggle || !sheet) return;
    toggle.setAttribute('aria-expanded', String(open));
    sheet.hidden = !open;
  };
  toggle?.addEventListener('click', () => setSheet(sheet.hidden));
  sheet?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setSheet(false)));
  doc.addEventListener('keydown', (event) => { if (event.key === 'Escape') setSheet(false); });

  let stuck = false;
  const updateNav = () => {
    const next = window.scrollY > 40;
    if (next === stuck) return;
    stuck = next;
    nav?.classList.toggle('is-stuck', next);
  };
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  doc.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    if (id.length < 2) return;
    const target = doc.querySelector(id);
    if (!target) return;
    event.preventDefault();
    setSheet(false);
    scrollTo(target, id === '#top' ? 0 : -navHeight() + 8);
    history.replaceState(null, '', id);
  });

  /* ---------- Reveal on scroll ---------- */

  const revealable = [
    ...doc.querySelectorAll('.section .shead, .positioning__body, .showcase__item, .offer__copy, .offer__card, .offer__media, .disc__item, .price, .bundle, .panel, .demo, .shop__item, .guide, .process__step, .audit__axis, .contact__direct, .contact__form, .explorer__ui'),
  ];
  if (!reduced) revealable.forEach((el) => el.setAttribute('data-reveal', ''));
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }), { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    revealable.forEach((el) => io.observe(el));
  } else {
    revealable.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Service explorer ---------- */

  const tabs = [...doc.querySelectorAll('[data-explorer-tabs] [role="tab"]')];
  const panels = [...doc.querySelectorAll('.explorer__panel')];
  const features = [...doc.querySelectorAll('[data-explorer-feature]')];
  const dots = [...doc.querySelectorAll('[data-dot]')];
  const orbitFill = doc.querySelector('[data-orbit-fill]');
  let currentTab = -1;

  const selectTab = (index, focus = false) => {
    if (index === currentTab) return;
    const previous = currentTab;
    currentTab = index;
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) tab.focus();
    });
    panels.forEach((panel, i) => {
      panel.classList.remove('is-entering', 'is-leaving');
      panel.hidden = i !== index;
      if (i === index && previous !== -1 && !reduced) panel.classList.add('is-entering');
    });
    features.forEach((figure, i) => figure.classList.toggle('is-on', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('is-on', i === index));
    if (orbitFill) orbitFill.style.width = `${Number(tabs[index]?.dataset.orbit || 0) * 100}%`;
  };

  if (tabs.length) {
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => selectTab(i));
      tab.addEventListener('keydown', (event) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        if (!step) return;
        event.preventDefault();
        selectTab((i + step + tabs.length) % tabs.length, true);
      });
    });
    selectTab(0);
  }

  /* ---------- Growth path ---------- */

  const stages = [...doc.querySelectorAll('[data-growth-stages] [data-stage]')];
  const signal = doc.querySelector('[data-growth-signal]');
  const liveLine = doc.querySelector('[data-growth-live]');
  // pathLength normalises the rail to 1 so the dash can be driven as a ratio.
  liveLine?.setAttribute('pathLength', '1');

  if (stages.length) {
    const selectStage = (index) => {
      stages.forEach((stage, i) => stage.classList.toggle('is-on', i === index));
      const ratio = (index + 0.5) / stages.length;
      if (signal) signal.style.left = `${(2 + ratio * 96).toFixed(2)}%`;
      if (liveLine) {
        liveLine.style.strokeDasharray = `${ratio} 1`;
        liveLine.style.strokeDashoffset = '0';
      }
    };
    stages.forEach((stage, i) => {
      const button = stage.querySelector('[data-stage-btn]');
      button?.addEventListener('click', () => selectStage(i));
      button?.addEventListener('focus', () => selectStage(i));
      if (finePointer) stage.addEventListener('pointerenter', () => selectStage(i));
    });
    selectStage(0);
  }

  /* ---------- Automation chain ---------- */

  const chainSteps = [...doc.querySelectorAll('[data-chain-step]')];
  if (chainSteps.length) {
    if ('IntersectionObserver' in window && !reduced) {
      const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-on');
        io.unobserve(entry.target);
      }), { threshold: 0.5 });
      chainSteps.forEach((step) => io.observe(step));
    } else {
      chainSteps.forEach((step) => step.classList.add('is-on'));
    }
  }

  /* ---------- Before / after concept sliders ---------- */

  doc.querySelectorAll('[data-compare]').forEach((frame) => {
    const input = frame.querySelector('[data-compare-input]');
    if (!input) return;
    const apply = () => frame.style.setProperty('--split', `${input.value}%`);
    input.addEventListener('input', apply);
    apply();
    // Dragging anywhere on the frame reads more naturally than the hidden range.
    const track = (event) => {
      if (event.type === 'pointermove' && event.buttons !== 1) return;
      const rect = frame.getBoundingClientRect();
      input.value = String(Math.round(clamp((event.clientX - rect.left) / rect.width) * 100));
      apply();
    };
    frame.addEventListener('pointerdown', track);
    frame.addEventListener('pointermove', track);
  });

  /* ---------- Lead form → /api/lead, mailto fallback ---------- */

  const form = doc.querySelector('[data-contact]');
  if (form) {
    const status = form.querySelector('[data-form-status]');
    const submit = form.querySelector('[type="submit"]');

    const honeypot = doc.createElement('input');
    honeypot.type = 'text';
    honeypot.name = 'website';
    honeypot.tabIndex = -1;
    honeypot.autocomplete = 'off';
    honeypot.setAttribute('aria-hidden', 'true');
    honeypot.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
    form.appendChild(honeypot);

    if (!form.querySelector('[name="consent"]')) {
      const consent = doc.createElement('label');
      consent.className = 'consent-check';
      consent.innerHTML = '<input type="checkbox" name="consent" required> <span>Slažem se s obradom podataka prema <a href="/privatnost.html" target="_blank" rel="noopener">politici privatnosti</a>.</span>';
      if (submit) form.insertBefore(consent, submit); else form.appendChild(consent);
    }

    const say = (text, tone = '') => {
      if (!status) return;
      status.textContent = text;
      if (tone) status.dataset.tone = tone; else delete status.dataset.tone;
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if (data.website) return;
      delete data.website;
      if (!data.name?.trim() || !data.email?.trim() || !data.message?.trim()) {
        say('Molimo popunite ime, email i poruku.', 'error');
        return;
      }
      if (!data.consent) {
        say('Molimo prihvatite politiku privatnosti.', 'error');
        return;
      }
      data.izvor = form.dataset.source || location.pathname;
      data.vrijeme = new Date().toISOString();
      say('Šaljem…');
      try {
        const response = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('fallback');
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'generate_lead',
          form_source: data.izvor,
          lead_source: 'website',
          value: 1,
          currency: 'BAM',
          page_location: location.origin + location.pathname,
        });
        location.href = '/hvala.html';
      } catch {
        const body = Object.entries(data).map(([key, value]) => `${key}: ${value}`).join('\n');
        say('Otvaramo pripremljeni email — pošaljite ga i javljamo se u roku od 24 sata.');
        location.href = `mailto:digital.x.agency.ba@gmail.com?subject=${encodeURIComponent(`Upit sa sajta (${data.izvor})`)}&body=${encodeURIComponent(body)}`;
      }
    });
  }
})();
