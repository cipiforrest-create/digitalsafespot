// DIGITAL X — site behavior
// ⬇️ KONFIGURACIJA: zalijepi svoj n8n/Make webhook URL (vidi prirucnik/03-automatizacije-uputstvo.md)
const WEBHOOK_URL = "";            // npr. https://n8n.tvoj-server.com/webhook/leads
const FALLBACK_EMAIL = "marketing@digital-x-marketing.com";
const PAGE_LOCALE = document.documentElement.lang || 'bs';
const UI_COPY = PAGE_LOCALE === 'en' ? {
  skip: 'Skip to content', field: 'Field', service: 'Choose a service'
} : PAGE_LOCALE === 'de' ? {
  skip: 'Zum Inhalt springen', field: 'Feld', service: 'Dienstleistung auswählen'
} : {
  skip: 'Preskoči na sadržaj', field: 'Polje', service: 'Odaberite uslugu'
};

// Vercel Web Analytics + Speed Insights.
// One shared loader covers every HTML page; local/offline previews stay quiet.
(() => {
  const isLocalPreview = location.protocol === "file:" ||
    ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
  if (isLocalPreview) return;

  const inject = (src) => {
    if (document.head.querySelector(`script[src="${src}"]`)) return;
    const script = document.createElement("script");
    script.defer = true;
    script.src = src;
    document.head.append(script);
  };

  window.va = window.va || function (...args) {
    (window.vaq = window.vaq || []).push(args);
  };
  window.si = window.si || function (...args) {
    (window.siq = window.siq || []).push(args);
  };

  inject("/_vercel/insights/script.js");
  inject("/_vercel/speed-insights/script.js");
})();

// reveal on scroll
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Chrome's native lazy-load distance varies with simulated network speed. That
// made below-fold service images enter some Lighthouse runs but not others.
// Load these previews only when they are genuinely close to the viewport.
const perfLazyImages = [...document.querySelectorAll('img[data-perf-src]')];
if (perfLazyImages.length) {
  const loadPerfImage = image => {
    // srcset se postavlja prije src-a da preglednik odmah bira ispravnu širinu
    if (image.dataset.perfSrcset) {
      image.srcset = image.dataset.perfSrcset;
      image.removeAttribute('data-perf-srcset');
    }
    image.src = image.dataset.perfSrc;
    image.removeAttribute('data-perf-src');
  };
  if ('IntersectionObserver' in window) {
    const perfImageObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (typeof window.loadDigitalXFonts === 'function') window.loadDigitalXFonts();
      loadPerfImage(entry.target);
      perfImageObserver.unobserve(entry.target);
    }), { rootMargin: '320px 0px' });
    perfLazyImages.forEach(image => perfImageObserver.observe(image));
  } else {
    perfLazyImages.forEach(loadPerfImage);
  }
}

// mobile nav (accessible: expose expanded state and the controlled region)
const burger = document.querySelector('.burger');
const navLinks = document.querySelector('.nav-links');
if (burger && navLinks) {
  if (!navLinks.id) navLinks.id = 'primary-nav';
  burger.setAttribute('aria-controls', navLinks.id);
  burger.setAttribute('aria-expanded', 'false');
  burger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
}

// Skip-to-content link injected for keyboard/screen-reader users. Targets the
// first <main>; adds an id + programmatic focus target if the page lacks one.
(() => {
  const main = document.querySelector('main');
  if (!main) return;
  if (!main.id) main.id = 'content';
  if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
  if (document.querySelector('.skip-link')) return;
  const skip = document.createElement('a');
  skip.className = 'skip-link';
  skip.href = `#${main.id}`;
  skip.textContent = UI_COPY.skip;
  document.body.prepend(skip);
})();

// before/after sliders
document.querySelectorAll('.ba').forEach(ba => {
  const r = ba.querySelector('input[type=range]');
  if (r) r.addEventListener('input', () => ba.style.setProperty('--cut', r.value + '%'));
});

// Responsive depth for generated visuals; cinematic canvas remains owned by cinema.js.
const depthMedia = [...document.querySelectorAll('[data-depth]')];
let depthFrame = 0;
function updateDepthMedia() {
  depthFrame = 0;
  const mobile = matchMedia('(max-width:600px)').matches;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (reduced) {
    depthMedia.forEach(media => media.removeAttribute('style'));
    return;
  }

  // Read every layout value first, then write transforms in a second pass.
  // Interleaving these operations forces the browser to recalculate layout
  // once per visual and caused the mobile Lighthouse reflow spike.
  const states = depthMedia.map((media, index) => {
    const rect = media.getBoundingClientRect();
    const range = (innerHeight + rect.height) / 2;
    const progress = Math.max(-1, Math.min(1, (innerHeight / 2 - (rect.top + rect.height / 2)) / range));
    return { media, index, progress };
  });
  states.forEach(({ media, index, progress }) => {
    media.style.setProperty('--depth-x', `${(progress * (mobile ? 3 : 5)).toFixed(2)}deg`);
    media.style.setProperty('--depth-y', `${((index % 2 ? 1 : -1) * Math.abs(progress) * (mobile ? 1 : 2)).toFixed(2)}deg`);
    media.style.setProperty('--depth-lift', `${(progress * (mobile ? -4 : -8)).toFixed(2)}px`);
    media.style.setProperty('--depth-scale', (1 - Math.abs(progress) * (mobile ? .016 : .025)).toFixed(4));
  });
}
function requestDepthMedia() { if (!depthFrame) depthFrame = requestAnimationFrame(updateDepthMedia); }
if (depthMedia.length) {
  addEventListener('scroll', requestDepthMedia, { passive: true });
  addEventListener('resize', requestDepthMedia);
  const queueInitialDepthMedia = () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(requestDepthMedia, { timeout: 1800 });
    } else {
      setTimeout(requestDepthMedia, 800);
    }
  };
  if (document.readyState === 'complete') queueInitialDepthMedia();
  else addEventListener('load', queueInitialDepthMedia, { once: true });
}

// Accessibility: give every form control a real (visually hidden) label from its placeholder.
document.querySelectorAll('form.lead-form input, form.lead-form textarea, form.lead-form select, #audit-form input, #audit-form textarea').forEach((ctrl, i) => {
  if (ctrl.type === 'hidden' || ctrl.name === 'website' || ctrl.name === 'consent') return;
  if (ctrl.getAttribute('aria-label') || (ctrl.id && document.querySelector(`label[for="${ctrl.id}"]`))) return;
  const text = (ctrl.placeholder || (ctrl.tagName === 'SELECT' ? UI_COPY.service : ctrl.name) || UI_COPY.field).replace(/\s*\*$/, '');
  if (!ctrl.id) ctrl.id = 'dxf_' + (ctrl.name || 'field') + '_' + i;
  const label = document.createElement('label');
  label.className = 'sr-only';
  label.setAttribute('for', ctrl.id);
  label.textContent = text;
  ctrl.parentNode.insertBefore(label, ctrl);
});

// Lead forms → /api/lead (server forwards to n8n). Honeypot + privacy consent + mailto fallback.
document.querySelectorAll('form.lead-form').forEach(form => {
  // Honeypot: bots fill hidden fields; humans never see this one.
  const hp = document.createElement('input');
  hp.type = 'text'; hp.name = 'website'; hp.tabIndex = -1; hp.autocomplete = 'off';
  hp.setAttribute('aria-hidden', 'true');
  hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
  form.appendChild(hp);

  // Required privacy consent (GDPR) — injected so every form gets it.
  if (!form.querySelector('[name="consent"]')) {
    const consent = document.createElement('label');
    consent.className = 'consent-check';
    consent.innerHTML = '<input type="checkbox" name="consent" required> <span>Slažem se s obradom podataka prema <a href="/privatnost.html" target="_blank" rel="noopener">politici privatnosti</a>.</span>';
    const submit = form.querySelector('[type="submit"]') || form.querySelector('button');
    if (submit) form.insertBefore(consent, submit); else form.appendChild(consent);
  }

  // Live-region status line.
  let msg = form.querySelector('.form-msg');
  if (!msg) { msg = document.createElement('p'); msg.className = 'form-msg'; form.appendChild(msg); }
  msg.setAttribute('aria-live', 'polite');

  if (form.id === 'audit-form') return; // audit.js owns this form's submit
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (data.website) return; // honeypot tripped → drop silently
    if (!data.consent) { msg.textContent = 'Molimo prihvatite politiku privatnosti.'; msg.className = 'form-msg err'; return; }
    delete data.website;
    data.izvor = form.dataset.source || location.pathname;
    data.vrijeme = new Date().toISOString();
    msg.textContent = 'Šaljem...'; msg.className = 'form-msg';
    try {
      const res = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) {
        if (window.DXTracking) {
          window.DXTracking.generateLead({ formSource: data.izvor, leadSource: 'website' });
        } else {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ event: 'generate_lead', form_source: data.izvor, lead_source: 'website', value: 1, currency: 'BAM', page_location: location.origin + location.pathname });
        }
        location.href = '/hvala.html';
        return;
      }
      throw new Error('fallback');
    } catch {
      // Fallback so no lead is ever lost: open a pre-filled email.
      const body = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n');
      location.href = `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent('Upit sa sajta (' + data.izvor + ')')}&body=${encodeURIComponent(body)}`;
    }
  });
});

// Lightweight site-wide Digital X Co-Pilot. Answers from the public company knowledge base.
(() => {
  if (document.querySelector(".digitalx-assistant")) return;

  const rootPrefix = /\/(?:blog|shop)\//.test(location.pathname.replaceAll("\\", "/")) ? "../" : "";
  const linkTo = (path) => `${rootPrefix}${path}`;
  const normalize = (value) => value.toLocaleLowerCase("bs").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const knowledge = [
    {
      priority: 3,
      keys: ["cijena", "cijene", "cjenovnik", "koliko kosta", "budzet", "paket"],
      text: "Početne cijene su: landing stranica od 199 KM, prezentacijska stranica od 449 KM, e-commerce od 2.490 KM, e-commerce + SEO/AEO od 3.490 KM, SEO/GEO/AEO od 249 KM mjesečno, AI chatbot od 490 KM + 39 KM mjesečno, speed optimizacija od 99 KM i održavanje od 29 KM mjesečno. Konačna cijena zavisi od obima.",
      href: linkTo("index.html#cjenovnik"),
      label: "Otvori cjenovnik",
    },
    {
      priority: 2,
      keys: ["web", "web stranica", "sajt", "landing", "ecommerce", "e-commerce", "web shop", "trgovina"],
      text: "Digital X izrađuje landing stranice, prezentacijske web stranice i e-commerce trgovine. Uključujemo responsive dizajn, jasnu strukturu konverzije, osnovni SEO i povezivanje formi, plaćanja ili CRM-a prema projektu.",
      href: linkTo("landing-web.html"),
      label: "Web usluge",
    },
    {
      priority: 2,
      keys: ["seo", "geo", "aeo", "google", "mapa", "vidljivost", "rangiranje"],
      text: "SEO / GEO / AEO usluga povezuje tehničku optimizaciju, sadržaj, Google Business i mape, strukturirane podatke i pripremu sadržaja za klasične i AI rezultate pretrage. Paket počinje od 249 KM mjesečno.",
      href: linkTo("landing-seo.html"),
      label: "SEO / GEO / AEO",
    },
    {
      priority: 2,
      keys: ["automatizacija", "automatizacije", "workflow", "crm", "n8n", "make", "proces"],
      text: "Automatizacije mogu povezati forme, email, CRM, kalendar, termine, dokumente, podsjetnike, recenzije i izvještaje. Rješenje se projektuje prema vašem stvarnom procesu, sa jasnim vlasnicima, uslovima i tragom izvršenja.",
      href: linkTo("shop/category/automation/"),
      label: "Automatizacijski proizvodi",
    },
    {
      priority: 2,
      keys: ["chatbot", "chat asistent", "ai asistent", "copilot", "co-pilot", "24/7"],
      text: "Digital X AI asistent koristi sadržaj i ton vaše firme za odgovore 24/7, kvalifikaciju upita i predaju razgovora čovjeku. Početna ponuda je od 490 KM + 39 KM mjesečno, uz demo prije kupovine.",
      href: linkTo("landing-ai.html"),
      label: "AI asistent detalji",
    },
    {
      priority: 2,
      keys: ["second brain", "drugi mozak", "brain os", "galaksija", "znanje", "knowledge"],
      text: "AI Second Brain OS povezuje dokumente, sastanke, projekte, klijente, odluke i procese u privatnu poslovnu memoriju. Co-Pilot pronalazi kontekst, prikazuje izvore i izvršava samo odobrene komande. Cijena se procjenjuje prema izvorima, korisnicima i integracijama.",
      href: linkTo("second-brain-os.html"),
      label: "AI Second Brain OS",
    },
    {
      priority: 2,
      keys: ["growthos", "growth os", "poslovni sistem", "dashboard", "aplikacija"],
      text: "GrowthOS je prilagodljiv poslovni operativni sistem za prodaju, klijente, projekte, termine, sadržaj, automatizacije, izvještaje, portal i poslovno znanje. Moduli se biraju prema potrebama klijenta, a javni demo koristi izmišljene podatke.",
      href: linkTo("growthos.html"),
      label: "Pogledajte GrowthOS",
    },
    {
      priority: 2,
      keys: ["oglasavanje", "oglasi", "meta", "facebook", "instagram", "sadrzaj", "drustvene mreze", "reels"],
      text: "Ponuda za rast uključuje Meta i Google kampanje, remarketing, mjesečne izvještaje, plan sadržaja, objave, Reels i upravljanje društvenim mrežama. Oglašavanje i društvene mreže počinju od 249 KM mjesečno, bez medijskog budžeta.",
      href: linkTo("index.html#cjenovnik"),
      label: "Paketi za rast",
    },
    {
      priority: 2,
      keys: ["audit", "analiza", "brzina", "speed", "sporo", "optimizacija"],
      text: "Možete pokrenuti besplatnu kratku analizu web stranice. Speed optimizacija počinje od 99 KM i uključuje prije/poslije izvještaj; tačan rezultat zavisi od hostinga, teme i postojećih dodataka.",
      href: linkTo("audit.html"),
      label: "Pokreni analizu",
    },
    {
      priority: 1,
      keys: ["usluge", "sta nudite", "ponuda", "mozete uraditi", "digital x"],
      text: "Digital X nudi web i e-commerce, aplikacije po mjeri, SEO / GEO / AEO, oglašavanje, sadržaj i video, automatizacije, AI asistente, AI Second Brain OS, GrowthOS, speed optimizaciju, održavanje i projekte po zahtjevu.",
      href: linkTo("index.html#visual-services"),
      label: "Pregled usluga",
    },
    {
      priority: 1,
      keys: ["kontakt", "email", "razgovor", "procjena", "zahtjev", "treba mi", "po mjeri"],
      text: "Opišite cilj, problem i usluge koje trebate. Digital X zatim definiše obim, faze, način saradnje i realnu procjenu cijene. Možete koristiti kontakt formu ili pisati na marketing@digital-x-marketing.com.",
      href: linkTo("index.html#custom-requirements"),
      label: "Zatražite procjenu",
    },
  ];

  const findAnswer = (question) => {
    const input = normalize(question);
    let best = null;
    let bestScore = 0;
    for (const item of knowledge) {
      const keywordScore = item.keys.reduce((total, key) => total + (input.includes(normalize(key)) ? key.length : 0), 0);
      const score = keywordScore ? keywordScore + item.priority * 100 : 0;
      if (score > bestScore) { best = item; bestScore = score; }
    }
    return best || {
      text: "Mogu pomoći s uslugama, cijenama, web projektima, SEO/GEO/AEO, automatizacijama, GrowthOS-om, AI Second Brain OS-om ili procjenom projekta. Napišite šta želite postići.",
      href: linkTo("index.html#custom-requirements"),
      label: "Kontakt i procjena",
    };
  };

  const assistant = document.createElement("div");
  assistant.className = "digitalx-assistant";
  assistant.innerHTML = `
    <button class="dx-assistant-toggle" type="button" aria-label="Otvorite Digital X Co-Pilot" aria-expanded="false" aria-controls="dx-assistant-panel"><span>DX</span></button>
    <aside id="dx-assistant-panel" class="dx-assistant-panel" role="dialog" aria-modal="false" aria-label="Digital X Co-Pilot" hidden>
      <header><span class="dx-assistant-mark">DX</span><div><strong>Digital X Co-Pilot</strong><small>Usluge · cijene · rješenja</small></div><button class="dx-assistant-close" type="button" aria-label="Zatvorite chat">×</button></header>
      <div class="dx-assistant-messages" role="log" aria-live="polite"></div>
      <div class="dx-assistant-quick" aria-label="Brza pitanja">
        <button type="button">Usluge</button><button type="button">Cijene</button><button type="button">GrowthOS</button><button type="button">Second Brain</button>
      </div>
      <form class="dx-assistant-form"><label class="sr-only" for="dx-assistant-input">Vaše pitanje</label><input id="dx-assistant-input" autocomplete="off" placeholder="Pitajte o uslugama…" required><button type="submit" aria-label="Pošaljite pitanje">→</button></form>
      <p class="dx-assistant-note">Lokalni vodič kroz javnu Digital X ponudu. Ne šalje podatke na server.</p>
    </aside>`;
  document.body.append(assistant);

  const toggle = assistant.querySelector(".dx-assistant-toggle");
  const panel = assistant.querySelector(".dx-assistant-panel");
  const close = assistant.querySelector(".dx-assistant-close");
  const messages = assistant.querySelector(".dx-assistant-messages");
  const form = assistant.querySelector(".dx-assistant-form");
  const input = assistant.querySelector("#dx-assistant-input");

  const addMessage = (text, type, answer) => {
    const message = document.createElement("div");
    message.className = `dx-assistant-message ${type}`;
    const copy = document.createElement("p");
    copy.textContent = text;
    message.append(copy);
    if (answer?.href) {
      const action = document.createElement("a");
      action.href = answer.href;
      action.textContent = `${answer.label} →`;
      message.append(action);
    }
    messages.append(message);
    // The panel starts hidden, so measuring scrollHeight during page startup
    // forces a full layout before the LCP headline can paint.
    if (!panel.hidden) {
      requestAnimationFrame(() => { messages.scrollTop = messages.scrollHeight; });
    }
  };

  const ask = (question) => {
    const clean = question.trim();
    if (!clean) return;
    addMessage(clean, "user");
    const answer = findAnswer(clean);
    addMessage(answer.text, "assistant", answer);
  };

  const setOpen = (open) => {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    if (open) input.focus();
    else toggle.focus();
  };

  addMessage("Zdravo! Ja sam Digital X Co-Pilot. Pitajte me o uslugama, cijenama ili rješenju za vaš cilj.", "assistant");
  toggle.addEventListener("click", () => setOpen(panel.hidden));
  close.addEventListener("click", () => setOpen(false));
  assistant.querySelectorAll(".dx-assistant-quick button").forEach((button) => button.addEventListener("click", () => ask(button.textContent)));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    ask(input.value);
    input.value = "";
  });
  addEventListener("keydown", (event) => { if (event.key === "Escape" && !panel.hidden) setOpen(false); });
})();
