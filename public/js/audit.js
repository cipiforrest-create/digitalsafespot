// DIGITAL X — GEO/SEO/AEO audit (pošteno strog: stvarni PageSpeed podaci + strogi AEO/GEO kriteriji)
  // PageSpeed se poziva preko /api/psi (serverless proxy), ne direktno iz browsera.
  // Direktan poziv bez ključa dijeli globalnu anonimnu kvotu i vraća "429 Quota
  // exceeded" stvarnim posjetiocima — alat je tiho prestajao raditi. Ključ sada
  // stoji na serveru (PSI_API_KEY u Vercel env) i kvota je naša.
const form = document.getElementById('audit-form');
const out = document.getElementById('audit-result');

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (form.querySelector('input[name="website"]')?.value) return; // honeypot tripped → drop silently
  if (!form.querySelector('input[name="consent"]')?.checked) {
    out.style.display = 'block';
    out.innerHTML = '<div class="issue"><span class="dot y"></span><div>Molimo prihvatite politiku privatnosti prije analize.</div></div>';
    return;
  }
  let url = document.getElementById('a-url').value.trim();
  const email = document.getElementById('a-email').value.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  out.style.display = 'block';
  renderProgress(url);
  out.scrollIntoView({ behavior: 'smooth' });

  // Lead ide u CRM odmah, ali conversion event tek nakon potvrđenog HTTP uspjeha.
  // Posjetiočev email i auditirani URL nikad ne ulaze u dataLayer.
  fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ izvor: 'audit-alat', url, kontakt: email, email, consent: 'on', vrijeme: new Date().toISOString() }) })
    .then(function (response) {
      if (!response.ok) return;
      if (window.DXTracking) window.DXTracking.generateLead({ formSource: 'website_audit_form', leadSource: 'website' });
      else {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'generate_lead', form_source: 'website_audit_form', lead_source: 'website', value: 1, currency: 'BAM', page_location: location.origin + location.pathname });
      }
    })
    .catch(function () {});

  try {
    const api = '/api/psi?url=' + encodeURIComponent(url)
      + '&category=PERFORMANCE&category=SEO&category=BEST_PRACTICES&strategy=mobile';
    const r = await fetch(api); const d = await r.json();
    if (!r.ok || !d.lighthouseResult) throw new Error(d.error?.message || d.error || 'Stranica nije dostupna za analizu.');
    const cat = d.lighthouseResult.categories;
    const audits = d.lighthouseResult.audits;
    const perf = Math.round((cat.performance?.score || 0) * 100);
    const seoBase = Math.round((cat.seo?.score || 0) * 100);

    // strogi SEO skor: Google SEO skor je blag (mjeri samo osnove) → ponderiši s performansama i praksama
    const bp = Math.round((cat['best-practices']?.score || 0) * 100);
    const seo = Math.round(seoBase * .55 + perf * .30 + bp * .15);

    // AEO provjere iz stvarnih Lighthouse audita (strogo: bez dokaza = 0 bodova)
    let aeo = 0; const issues = [];
    const sd = audits['structured-data'];
    if (sd && sd.score === 1) aeo += 30; else issues.push(['r', 'Nema validnih strukturiranih podataka (schema markup) — AI pretraživači ne razumiju ko ste i šta nudite.']);
    if (audits['document-title']?.score === 1) aeo += 15; else issues.push(['r', 'Naslov stranice (title) nedostaje ili je loš — prva stvar koju AI i Google čitaju.']);
    if (audits['meta-description']?.score === 1) aeo += 15; else issues.push(['y', 'Meta opis nedostaje — gubite kontrolu nad tim kako vas pretraživači predstavljaju.']);
    if (audits['is-crawlable']?.score === 1) aeo += 20; else issues.push(['r', 'Stranica blokira indeksiranje — ni Google ni AI je ne mogu pročitati!']);
    if (audits['http-status-code']?.score === 1) aeo += 10;
    if (audits['link-text']?.score === 1) aeo += 10; else issues.push(['y', 'Linkovi bez opisnog teksta — slabiji signal i za SEO i za AI.']);
    // llms.txt / AI-crawler pristup i GBP se ne mogu provjeriti iz browsera → ide u puni izvještaj
    const aeoNote = 'llms.txt, pristup AI crawlera (GPTBot, ClaudeBot, PerplexityBot) i Q&A struktura sadržaja provjeravaju se ručno — stižu u punom izvještaju na email.';

    if (perf < 50) issues.unshift(['r', 'Brzina na mobitelu: ' + perf + '/100 — svaka sekunda čekanja povećava broj posjetilaca koji odu.']);
    else if (perf < 90) issues.push(['y', 'Brzina na mobitelu: ' + perf + '/100 — ima prostora, konkurencija s 90+ prolazi bolje na Googlu.']);
    if (seoBase < 90) issues.push(['y', 'Google SEO osnove: ' + seoBase + '/100 — čak i osnovni signali nisu kompletni.']);

    render(perf, seo, aeo, issues, aeoNote, email, url);
  } catch (err) {
    stopProgress();
    const m = /quota/i.test(err.message) ? 'Dnevni limit besplatnih analiza je dostignut — veliki interes danas!' : 'Analiza nije uspjela: ' + esc(err.message);
    out.innerHTML = '<div class="issue"><span class="dot r"></span><div>' + m +
      '<br>Vaš upit je zabilježen — ručnu analizu šaljemo besplatno na vaš email u roku 24h. (Direktno: <b>' + (typeof FALLBACK_EMAIL !== 'undefined' ? FALLBACK_EMAIL : 'email') + '</b>)</div></div>';
  }
});

// Steps shown while PageSpeed runs. It is one request, so these name the phases
// of that single analysis rather than implying separate measurements — and the
// last one only completes when real data lands.
const AUDIT_STEPS = [
  'Otvaram stranicu kao mobilni posjetilac',
  'Mjerim brzinu ucitavanja (Google Lighthouse)',
  'Provjeravam SEO osnove i indeksiranje',
  'Analiziram AI vidljivost (AEO)'
];
let stepTimer = null;

function renderProgress(url) {
  out.innerHTML =
    '<p class="center" style="color:var(--muted)">Analiziram <b>' + esc(url) +
    '</b> \u2014 stvarni Google podaci, traje 20\u201340 sekundi.</p>' +
    '<div class="audit-steps">' +
    AUDIT_STEPS.map(function (label, i) {
      return '<div class="audit-step" data-step="' + i + '">' +
             '<span class="mark">' + (i + 1) + '</span><span>' + label + '</span></div>';
    }).join('') +
    '</div>';

  let i = 0;
  const advance = function () {
    const nodes = out.querySelectorAll('.audit-step');
    if (!nodes.length) return;
    if (i > 0) {
      nodes[i - 1].classList.remove('active');
      nodes[i - 1].classList.add('done');
      nodes[i - 1].querySelector('.mark').textContent = '\u2713';
    }
    if (i < nodes.length) { nodes[i].classList.add('active'); i++; }
    else if (stepTimer) { clearInterval(stepTimer); stepTimer = null; }
  };
  advance();
  stepTimer = setInterval(advance, 5200);
}

function stopProgress() {
  if (stepTimer) { clearInterval(stepTimer); stepTimer = null; }
}

// Which offer the score points at. Speed is checked first: it is the
// productised one and the only one carrying a guarantee.
function offerFor(perf, seo, aeo) {
  if (perf < 90) return {
    title: 'Va\u0161a brzina se mo\u017ee popraviti \u2014 garantovano',
    body: 'Isti sadr\u017eaj, isti dizajn, samo br\u017ee. Ako ne dostignemo Google 90+, radimo dalje bez naplate.',
    from: perf, to: '90+', metric: 'Brzina (mobilna)',
    price: 'od 99 KM, jednokratno \u00b7 izvje\u0161taj prije/poslije',
    href: 'shop/product/speed-optimization/', cta: 'Popravite mi brzinu'
  };
  if (aeo < 70) return {
    title: 'AI pretra\u017eiva\u010di vas slabo vide',
    body: 'ChatGPT, Perplexity i Google AI odgovori sve \u010de\u0161\u0107e zamjenjuju klasi\u010dne rezultate. Bez schema podataka i llms.txt vas jednostavno ne citiraju.',
    from: aeo, to: '85+', metric: 'AEO \u2014 AI vidljivost',
    price: 'od 249 KM/mjesec \u00b7 tehni\u010dki SEO + AEO',
    href: 'shop/product/seo-aeo/', cta: '\u017delim AI vidljivost'
  };
  if (seo < 85) return {
    title: 'SEO osnove nisu kompletne',
    body: 'Naslovi, meta opisi, struktura i interni linkovi \u2014 sitnice koje zajedno odlu\u010duju gdje \u0107ete se rangirati.',
    from: seo, to: '90+', metric: 'SEO',
    price: 'od 249 KM/mjesec',
    href: 'shop/product/seo-aeo/', cta: 'Popravite mi SEO'
  };
  return null;
}

function renderOffer(perf, seo, aeo) {
  const o = offerFor(perf, seo, aeo);
  if (!o) {
    return '<div class="audit-offer"><h4>Sajt vam je u dobrom stanju.</h4>' +
      '<p style="color:var(--muted);font-size:.9rem">Nema hitnih problema. Sljede\u0107i korak su lokalna vidljivost, sadr\u017eaj i kampanje.</p>' +
      '<a class="btn btn-p" href="index.html#kontakt" style="margin-top:14px">Besplatne konzultacije</a></div>';
  }
  return '<div class="audit-offer">' +
    '<h4>' + o.title + '</h4>' +
    '<p style="color:var(--muted);font-size:.9rem">' + o.body + '</p>' +
    '<div class="jump"><span class="from">' + o.from + '</span>' +
    '<span class="arrow">' + o.metric + ' \u2192</span><span class="to">' + o.to + '</span></div>' +
    '<p class="price">' + o.price + '</p>' +
    '<a class="btn btn-p" href="' + o.href + '">' + o.cta + '</a></div>';
}

// Drawn at zero, then animated on the next frame so the ring sweeps and the
// number counts up instead of simply being there.
function gauge(v, label, index) {
  const col = v >= 80 ? 'var(--ok)' : v >= 55 ? 'var(--warn)' : 'var(--bad)';
  const c = 2 * Math.PI * 54;
  return '<div class="gauge" data-val="' + v + '" data-i="' + index + '">' +
    '<svg width="130" height="130">' +
    '<circle cx="65" cy="65" r="54" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="10"/>' +
    '<circle class="arc" cx="65" cy="65" r="54" fill="none" stroke="' + col + '" stroke-width="10" ' +
    'stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '"/></svg>' +
    '<span class="val" style="color:' + col + '">0</span><span class="cap">' + label + '</span></div>';
}

function animateGauges() {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  out.querySelectorAll('.gauge').forEach(function (el) {
    const target = Number(el.getAttribute('data-val')) || 0;
    const delay = reduce ? 0 : Number(el.getAttribute('data-i')) * 260;
    setTimeout(function () {
      el.classList.add('in');
      const arc = el.querySelector('circle.arc');
      const c = 2 * Math.PI * 54;
      if (arc) arc.setAttribute('stroke-dashoffset', String(c - (target / 100) * c));
      const val = el.querySelector('.val');
      if (!val) return;
      if (reduce) { val.textContent = String(target); return; }
      const start = performance.now(), dur = 1100;
      const tick = function (now) {
        const t = Math.min(1, (now - start) / dur);
        val.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      // requestAnimationFrame is paused in a background tab, so a visitor who
      // switches away mid-audit would come back to a gauge stuck on 0 next to a
      // correctly drawn ring. Guarantee the final number regardless.
      setTimeout(function () { val.textContent = String(target); }, dur + 120);
    }, delay);
  });
}

function render(perf, seo, aeo, issues, aeoNote, email, url) {
  stopProgress();
  const avg = Math.round((perf + seo + aeo) / 3);
  out.innerHTML =
    '<h3 class="center" style="font-size:1.5rem;margin-bottom:6px">Ukupna ocjena: <span class="grad-text">' + avg + '/100</span></h3>' +
    '<p class="center" style="color:var(--muted);font-size:.9rem">Mjereno stvarnim Google Lighthouse podacima + strogim AEO kriterijima za AI vidljivost.</p>' +
    '<div class="gauges">' + gauge(perf, 'Brzina (mobilna)', 0) + gauge(seo, 'SEO', 1) + gauge(aeo, 'AEO \u2014 AI vidljivost', 2) + '</div>' +
    renderOffer(perf, seo, aeo) +
    '<div class="issues" style="margin-top:34px">' +
    '<h4 style="margin-bottom:14px">Prona\u0111eni problemi (' + issues.length + '):</h4>' +
    issues.map(function (i) { return '<div class="issue"><span class="dot ' + i[0] + '"></span><div>' + i[1] + '</div></div>'; }).join('') +
    '<div class="issue"><span class="dot y"></span><div><b>Napomena:</b> ' + aeoNote + '</div></div>' +
    '</div>' +
    '<div class="center" style="margin-top:30px">' +
    '<p style="color:var(--muted);margin-bottom:18px">Puni izvje\u0161taj (GEO + lokalna vidljivost + plan popravke) sti\u017ee na <b>' + esc(email) + '</b> u roku 24h.</p>' +
    '<a class="btn" href="index.html#kontakt">Besplatne konzultacije</a></div>';
  animateGauges();
}

function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
