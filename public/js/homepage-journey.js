/* Digital X homepage — journey rail, cursor, nav, system map, reveals, lead form.
   The frame scrub itself is driven by /cinematic-shared/scroll-cinematic.js. */
(() => {
  'use strict';

  const doc = document;
  const root = doc.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* Capture the Lenis instance the shared engine creates so anchors and the
     skip button can scroll through the same smooth pipeline. */
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

  const scrollTo = (target, offset = 0) => {
    const element = typeof target === 'string' ? doc.querySelector(target) : target;
    if (!element) return;
    if (window.__dxLenis && !reduced) {
      window.__dxLenis.scrollTo(element, { offset, duration: 1.4 });
    } else {
      const top = element.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    }
  };

  /* ---------- Journey rail + chapter state ---------- */
  const journey = doc.querySelector('[data-journey]');
  const marks = [...doc.querySelectorAll('[data-journey-mark]')];
  const ranges = marks.map((mark) => [Number(mark.dataset.from), Number(mark.dataset.to)]);
  let activeMark = -1;
  let moved = false;

  window.DX_JOURNEY = window.DX_JOURNEY || {};
  window.DX_JOURNEY.onProgress = (progress) => {
    if (!journey) return;
    journey.style.setProperty('--journey-progress', progress.toFixed(4));
    if (!moved && progress > 0.01) { moved = true; journey.classList.add('has-moved'); }
    if (moved && progress <= 0.005) { moved = false; journey.classList.remove('has-moved'); }
    let next = -1;
    for (let i = 0; i < ranges.length; i += 1) {
      if (progress >= ranges[i][0] && progress < ranges[i][1]) { next = i; break; }
    }
    if (progress >= 0.999) next = ranges.length - 1;
    if (next !== activeMark) {
      marks.forEach((mark, i) => mark.classList.toggle('is-on', i === next));
      activeMark = next;
    }
  };

  doc.querySelector('[data-journey-skip]')?.addEventListener('click', () => {
    const after = journey?.nextElementSibling;
    if (after) scrollTo(after, -8);
  });

  /* Loader skip — appears after a moment for slow connections; frames keep loading. */
  const loader = doc.querySelector('[data-cinematic-loader]');
  const loaderSkip = doc.querySelector('[data-loader-skip]');
  if (loader && loaderSkip) {
    window.setTimeout(() => loaderSkip.classList.add('is-ready'), 2400);
    loaderSkip.addEventListener('click', () => {
      loader.classList.add('is-done');
      root.classList.add('cinematic-ready');
      window.setTimeout(() => loader.remove(), 900);
    });
  }

  /* ---------- Nav ---------- */
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

  let navSolid = false;
  const updateNav = () => {
    const solid = window.scrollY > window.innerHeight * 0.6;
    if (solid !== navSolid) { navSolid = solid; nav?.classList.toggle('is-solid', solid); }
  };
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* Same-page anchors travel through the smooth scroller. */
  doc.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    if (id === '#' || id.length < 2) return;
    const target = doc.querySelector(id);
    if (!target) return;
    event.preventDefault();
    setSheet(false);
    scrollTo(target, id === '#top' ? 0 : -(parseFloat(getComputedStyle(root).getPropertyValue('--nav-h')) * 16 || 72) + 8);
    history.replaceState(null, '', id);
  });

  /* ---------- Reveal on scroll ---------- */
  const revealables = [...doc.querySelectorAll('[data-reveal], [data-axis]')];
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }), { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('in'));
  }

  /* ---------- Custom cursor (fine pointers only) ---------- */
  const cursor = doc.querySelector('[data-cursor]');
  const finePointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
  if (cursor && finePointer && !reduced) {
    let x = -100; let y = -100; let cx = x; let cy = y; let raf = 0; let shown = false;
    const move = () => {
      cx += (x - cx) * 0.35;
      cy += (y - cy) * 0.35;
      cursor.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.2 ? requestAnimationFrame(move) : 0;
    };
    doc.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      x = event.clientX; y = event.clientY;
      if (!shown) { shown = true; cx = x; cy = y; root.classList.add('has-cursor'); }
      if (!raf) raf = requestAnimationFrame(move);
      const interactive = event.target.closest('a, button, [role="tab"], input, select, textarea, label');
      cursor.classList.toggle('is-active', Boolean(interactive));
    }, { passive: true });
    doc.addEventListener('pointerleave', () => root.classList.remove('has-cursor'));
    doc.addEventListener('pointerenter', () => { if (shown) root.classList.add('has-cursor'); });
  }

  /* ---------- System map (tabs + SVG) ---------- */
  const systemTabs = [...doc.querySelectorAll('[data-system-tab]')];
  const systemPanels = [...doc.querySelectorAll('[data-system-panel]')];
  const systemNodes = [...doc.querySelectorAll('[data-system-node]')];
  const systemLinks = [...doc.querySelectorAll('[data-system-link]')];
  const selectSystem = (index, focus = false) => {
    systemTabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) tab.focus();
    });
    systemPanels.forEach((panel, i) => { panel.hidden = i !== index; });
    systemNodes.forEach((node) => node.classList.toggle('is-on', node.dataset.systemNode === String(index)));
    systemLinks.forEach((link) => link.classList.toggle('is-on', link.dataset.systemLink === String(index)));
  };
  if (systemTabs.length) {
    systemTabs.forEach((tab, i) => {
      tab.addEventListener('click', () => selectSystem(i));
      tab.addEventListener('keydown', (event) => {
        const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        if (!(event.key in keys)) return;
        event.preventDefault();
        selectSystem((i + keys[event.key] + systemTabs.length) % systemTabs.length, true);
      });
    });
    systemNodes.forEach((node) => {
      node.addEventListener('click', () => selectSystem(Number(node.dataset.systemNode)));
    });
    selectSystem(0);
  }

  /* ---------- Before / after concept sliders ---------- */
  doc.querySelectorAll('[data-compare]').forEach((frame) => {
    const input = frame.querySelector('[data-compare-input]');
    if (!input) return;
    const apply = () => frame.style.setProperty('--cut', `${input.value}%`);
    input.addEventListener('input', apply);
    apply();
    // Dragging anywhere on the frame feels more natural than the hidden range alone.
    const track = (event) => {
      if (event.buttons !== 1 && event.type !== 'pointerdown') return;
      const rect = frame.getBoundingClientRect();
      input.value = String(Math.round(clamp((event.clientX - rect.left) / rect.width) * 100));
      apply();
    };
    frame.addEventListener('pointerdown', track);
    frame.addEventListener('pointermove', track);
  });

  /* ---------- Growth path ---------- */
  const stages = [...doc.querySelectorAll('[data-growth-stage]')];
  const live = doc.querySelector('[data-growth-live]');
  if (stages.length) {
    const selectStage = (index) => {
      stages.forEach((stage, i) => {
        const on = i === index;
        stage.classList.toggle('is-on', on);
        stage.querySelector('[data-stage-btn]')?.setAttribute('aria-pressed', String(on));
      });
      if (live) live.style.setProperty('--growth-live', `${((index + 1) / stages.length) * 100}%`);
    };
    stages.forEach((stage, i) => {
      const btn = stage.querySelector('[data-stage-btn]');
      if (!btn) return;
      btn.addEventListener('click', () => selectStage(i));
      btn.addEventListener('focus', () => selectStage(i));
      if (finePointer) stage.addEventListener('pointerenter', () => selectStage(i));
      btn.addEventListener('keydown', (event) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        if (!step) return;
        event.preventDefault();
        const next = (i + step + stages.length) % stages.length;
        stages[next].querySelector('[data-stage-btn]')?.focus();
      });
    });
    selectStage(0);
  }

  /* ---------- Lead form → /api/lead, mailto fallback ---------- */
  const form = doc.querySelector('[data-contact]');
  if (form) {
    const status = form.querySelector('[data-form-status]');
    const honeypot = doc.createElement('input');
    honeypot.type = 'text'; honeypot.name = 'website'; honeypot.tabIndex = -1; honeypot.autocomplete = 'off';
    honeypot.setAttribute('aria-hidden', 'true');
    honeypot.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
    form.appendChild(honeypot);

    const say = (text, kind = '') => {
      if (!status) return;
      status.textContent = text;
      status.className = `form__status${kind ? ` is-${kind}` : ''}`;
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
        const res = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('fallback');
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'generate_lead', form_source: data.izvor, lead_source: 'website', value: 1, currency: 'BAM', page_location: location.origin + location.pathname });
        location.href = '/hvala.html';
      } catch {
        const body = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n');
        say('Otvaramo pripremljeni email — pošaljite ga i javljamo se u roku od 24 sata.', 'ok');
        location.href = `mailto:digital.x.agency.ba@gmail.com?subject=${encodeURIComponent('Upit sa sajta (' + data.izvor + ')')}&body=${encodeURIComponent(body)}`;
      }
    });
  }
})();
