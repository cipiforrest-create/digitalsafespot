// DIGITAL X — cinematic binary-void (Canvas 2D, sprite-based)
// v3: kamera se kreće kroz kod na više načina (orbit → let kroz zid koda uz njihanje → explode),
// + AMBIENT mod: na stranicama bez #cine-zone kod tiho plovi sam (zamjena za staru galaksiju).
// FRAME_SEQ: scroll-mapping vozi filmsku frame-sekvencu (site/assets/film/, vidi docs/media-pipeline.md).
// keys:  [progres zone 0..1, normalizovani kadar 0..1] — po dijelovima linearno.
// focal: [normalizovani kadar 0..1, fokalna tačka X 0..1] — cover-crop drži bitni sadržaj u kadru (finalni X je desno).
const FRAME_SEQ = {
  d: { base: 'assets/film/d/f_', count: 177 },   // desktop 1280x720
  m: { base: 'assets/film/m/f_', count: 133 },   // mobitel 832x468
  ext: '.webp', pad: 3,
  // Kratki hold na početku (dok se čita hero), pa ravnomjerna reprodukcija do kraja.
  // Preko filma više nema teksta, pa ne trebaju platoi za čitanje — ravnomjeran tok je gladji.
  keys: [[0, 0], [.10, .03], [1, 1]],
  focal: [[0, .5], [.85, .5], [1, .62]]
};

(function () {
  const canvas = document.getElementById('cine');
  if (!canvas || !window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  const zoneEl = document.getElementById('cine-zone');
  const AMBIENT = !zoneEl;                                   // podstranice: tihi auto-let
  const isMobile = innerWidth < 768 || (innerWidth === 0 && matchMedia('(pointer:coarse)').matches);
  // Film je samo za homepage (#cine-zone); podstranice (AMBIENT) nikad ne povlače kadrove.
  const SEQ = (!AMBIENT && FRAME_SEQ) ? (isMobile ? FRAME_SEQ.m : FRAME_SEQ.d) : null;
  // Film je fotografski sadržaj — DPR 1 je vizuelno dovoljan i crta ~40% manje piksela po kadru.
  const DPR = SEQ ? 1 : Math.min(devicePixelRatio || 1, isMobile ? 1 : 1.25);
  let W = 0, H = 0, rimG = null, vigG = null, midG = null;
  // Keširane mjere layouta: scroll handler nikad ne smije zvati getBoundingClientRect (forced reflow).
  let zoneTop = 0, zoneSpan = 1, secTop = [], secSpan = [], docH = 0;

  function measure() {
    if (!H) return;
    const pageY = scrollY;
    if (zoneEl) {
      const zr = zoneEl.getBoundingClientRect();
      zoneTop = zr.top + pageY;
      zoneSpan = Math.max(1, zr.height - H);
    }
    secTop = []; secSpan = [];
    for (const s of pinSecs) {
      const r = s.getBoundingClientRect();
      secTop.push(r.top + pageY);
      secSpan.push(Math.max(1, r.height - H));
    }
    docH = document.documentElement.scrollHeight;
  }

  function resize() {
    W = innerWidth; H = innerHeight;
    if (!W || !H) return;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // Postavlja se jednom po resizeu — 'high' filtriranje po kadru je bilo glavni trošak crtanja.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'low';
    rimG = ctx.createLinearGradient(W, 0, W * .55, 0);
    rimG.addColorStop(0, 'rgba(103,212,255,.05)'); rimG.addColorStop(1, 'rgba(103,212,255,0)');
    vigG = ctx.createRadialGradient(W / 2, H / 2, H * .32, W / 2, H / 2, H * .95);
    vigG.addColorStop(0, 'rgba(4,7,10,0)'); vigG.addColorStop(1, 'rgba(2,4,6,.74)');
    midG = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * .52);
    midG.addColorStop(0, 'rgba(4,7,10,' + (AMBIENT ? .35 : .6) + ')'); midG.addColorStop(1, 'rgba(4,7,10,0)');
  }
  resize();
  addEventListener('resize', () => { resize(); measure(); updateTargets(); });

  // ---- sprite atlas: '0'/'1' × 8 nivoa svjetline ----
  const LEVELS = 8, BASE = 40, PAD = 14, CELL = BASE + PAD * 2;
  const atlas = document.createElement('canvas');
  atlas.width = CELL * LEVELS; atlas.height = CELL * 2;
  const ax = atlas.getContext('2d');
  ax.textAlign = 'center'; ax.textBaseline = 'middle';
  ax.font = '500 ' + BASE + 'px "Consolas","SF Mono",monospace';
  const DIM = AMBIENT ? .62 : 1;                             // podstranice: prigušenije
  for (let ch = 0; ch < 2; ch++) {
    for (let l = 0; l < LEVELS; l++) {
      const t = (l + 1) / LEVELS;
      ax.save();
      ax.shadowColor = 'rgba(96,205,255,' + (.55 * t * DIM) + ')';
      ax.shadowBlur = 4 + 8 * t;
      ax.fillStyle = t < .75 ? 'rgba(96,190,255,' + ((.12 + .58 * t) * DIM) + ')' : 'rgba(224,246,255,' + (.85 * t * DIM) + ')';
      ax.fillText(String(ch), l * CELL + CELL / 2, ch * CELL + CELL / 2);
      ax.restore();
    }
  }

  // ---- binarne kolone na cilindru ----
  const COLS = (isMobile ? 72 : 84) * (AMBIENT ? .6 : 1) | 0, ROWS = 15, STEP = 27, F = 460;
  const cCos = new Float32Array(COLS), cSin = new Float32Array(COLS), cR = new Float32Array(COLS),
        cY0 = new Float32Array(COLS), cLayer = new Uint8Array(COLS), cSpeed = new Float32Array(COLS);
  const bits = new Uint8Array(COLS * ROWS);
  for (let i = 0; i < COLS; i++) {
    const a = (i / COLS) * Math.PI * 2 + ((i * 37) % 10) * .02;
    cCos[i] = Math.cos(a); cSin[i] = Math.sin(a);
    cR[i] = 300 + ((i * 53) % 7) * 26;
    cY0[i] = -((i * 29) % 5) * 40 - 150;
    cLayer[i] = i % 3;
    cSpeed[i] = 2 + ((i * 17) % 10) * .5;
    for (let j = 0; j < ROWS; j++) bits[i * ROWS + j] = (i * 31 + j * 17) % 2;
  }
  const DN = (isMobile ? 40 : 90) * (AMBIENT ? .5 : 1) | 0;
  const dA = new Float32Array(DN), dR = new Float32Array(DN), dY = new Float32Array(DN), dS = new Float32Array(DN);
  for (let i = 0; i < DN; i++) {
    dA[i] = (i / DN) * Math.PI * 2 + (i % 7) * .13;
    dR[i] = 60 + ((i * 31) % 340); dY[i] = -260 + ((i * 47) % 520); dS[i] = .5 + ((i * 13) % 10) * .12;
  }

  // ---- FILM: scroll-scrubbovana frame-sekvenca (poster ostaje ispod platna dok prvi kadar ne stigne) ----
  let filmImgs = null, filmLoaded = null, filmCount = 0, filmErrors = 0, filmStarted = false,
      filmFallback = false, filmFrame = 0, filmFrameT = 0, filmDrawn = false, filmLanes = 0, filmLastIdx = -1;
  // Kadar se crta tek kad je stvarno dekodiran (img.decode()); crtanje nedekodirane slike
  // radi sinhroni decode na glavnoj niti — to je bio uzrok trzanja i preskakanja.
  // REVEAL: platno se otkriva tek kad ima dovoljno kadrova da skrol ne skače u koracima.
  // FILM_LERP je prigušenje kadra prema cilju: niže = sporije i mekše sustizanje.
  const LOAD_LANES = 6, FILM_LERP = .07, REVEAL = 14;

  function pwlin(table, p) {                       // po dijelovima linearna interpolacija [[x,y],...]
    let a = table[0], b = table[table.length - 1];
    for (let i = 1; i < table.length; i++) if (table[i][0] >= p) { b = table[i]; a = table[i - 1]; break; }
    const span = b[0] - a[0] || 1;
    return a[1] + (b[1] - a[1]) * Math.max(0, Math.min(1, (p - a[0]) / span));
  }
  function filmSrc(i) { return SEQ.base + String(i + 1).padStart(FRAME_SEQ.pad, '0') + FRAME_SEQ.ext; }
  function filmNext() {                            // tier 1: svaki 4. kadar (gusta gruba pokrivenost), tier 2: popuna — oboje najbliže-prvo
    const c = Math.max(0, Math.min(SEQ.count - 1, Math.round(filmFrame)));
    for (const stride of [4, 1]) {
      for (let d = 0; d < SEQ.count; d++) {
        const a = c + d, b = c - d;
        if (a < SEQ.count && a % stride === 0 && !filmLoaded[a]) return a;
        if (b >= 0 && b % stride === 0 && !filmLoaded[b]) return b;
      }
    }
    return -1;
  }
  function filmPump() {
    if (!SEQ || filmFallback) return;
    while (filmLanes < LOAD_LANES) {
      const i = filmNext();
      if (i < 0) return;
      filmLoaded[i] = 1; filmLanes++;
      const img = new Image();
      img.decoding = 'async';
      const ready = () => {
        filmLanes--;
        // Tek nakon uspješnog decode-a kadar ulazi u ponudu za crtanje.
        filmLoaded[i] = 2; filmImgs[i] = img; filmCount++;
        filmPump();
      };
      img.onload = () => {
        if (img.decode) img.decode().then(ready, ready);
        else ready();
      };
      img.onerror = () => { filmLanes--; filmLoaded[i] = 0; if (++filmErrors > 12) filmFallback = true; else setTimeout(filmPump, 1000); };
      img.src = filmSrc(i);
    }
  }
  function startFilm() {
    if (!SEQ || filmStarted) return;
    filmStarted = true;
    filmImgs = new Array(SEQ.count).fill(null);
    filmLoaded = new Uint8Array(SEQ.count);
    setTimeout(() => { if (!filmCount) filmFallback = true; }, 5000);   // mreža ne isporučuje → proceduralni fallback
    filmPump();
  }
  function filmNearest(c) {
    for (let d = 0; d < SEQ.count; d++) {
      if (filmLoaded[c + d] === 2) return c + d;
      if (filmLoaded[c - d] === 2) return c - d;
    }
    return -1;
  }
  function drawFilm() {
    if (filmCount < REVEAL) return false;           // premalo kadrova → poster ostaje, bez vidljivih skokova
    const c = Math.max(0, Math.min(SEQ.count - 1, Math.round(filmFrame)));
    const i = filmNearest(c);
    if (i < 0) return false;
    if (i === filmLastIdx && filmDrawn) return true; // isti kadar → bez ponovnog crtanja
    const src = filmImgs[i];
    const fw = src.naturalWidth, fh = src.naturalHeight;
    if (!fw || !fh) return false;
    const s = Math.max(W / fw, H / fh), dw = fw * s, dh = fh * s;
    const fx = pwlin(FRAME_SEQ.focal, i / (SEQ.count - 1));
    const dx = Math.max(Math.min(W / 2 - fx * dw, 0), W - dw);      // cover-crop oko fokalne tačke
    ctx.drawImage(src, dx, (H - dh) / 2, dw, dh);
    filmLastIdx = i;
    if (!filmDrawn) {
      filmDrawn = true;
      const p = document.getElementById('film-poster');
      if (p) p.classList.add('is-off');
      canvas.classList.add('has-film');            // vinjeta ide u CSS sloj, ne u crtanje po kadru
    }
    return true;
  }

  // ---- kamera: yaw + pozicija (x,y,z) + roll — koreografija u 3 čina ----
  let yawT = 0, explT = 0, fadeT = 1, cxT = 0, cyT = 0, czT = 430, rollT = 0;   // ciljevi
  let yaw = 0, expl = 0, fade = AMBIENT ? .55 : 1, cx = 0, cy2 = 0, cz = 430, roll = 0;
  const pinSecs = Array.from(document.querySelectorAll('.cine-sec'));
  // Po sekciji, ne ravnom listom: #s3 nema .pin-inner (ima .callouts), pa bi ravna lista
  // pomjerila indekse i vezala finale (#s4) za progres trećeg čina.
  const pins = pinSecs.map(s => s.querySelector('.pin-inner'));
  // Discipline su sada obična sekcija ispod filma i pale se preko .reveal (main.js).
  const pinState = new Array(pins.length).fill(null);

  // Progres iz keširanih mjera + scrollY: bez layout reada u scroll/rAF putanji.
  function progAt(top, span) { return Math.max(0, Math.min(1, (scrollY - top) / span)); }
  function progSec(i) { return secTop.length > i ? progAt(secTop[i], secSpan[i]) : 0; }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function updateTargets() {
    if (!H) return;
    if (AMBIENT) { fadeT = .55; return; }
    const p1 = progSec(0), p2 = progSec(1), p3 = progSec(2), p4 = progSec(3);
    // Čin I — spori turntable + blagi dolly-in
    // Čin II — LET KROZ ZID KODA: kamera zaranja naprijed uz bočno njihanje i roll
    // Čin III — explode + povlačenje unazad
    // Čin IV — finale: kamera se smiruje i lagano odmiče (proceduralni fallback prati film)
    yawT = p1 * Math.PI * .9 + p2 * Math.PI * .7 + p3 * .5 + p4 * .35;
    cxT  = Math.sin(p2 * Math.PI) * 130 * (1 - p3);                    // bočno njihanje kroz kod
    cyT  = Math.sin(p1 * Math.PI) * 26 - p2 * 70 + p3 * 40;            // lagani uspon pa poniranje
    czT  = 430 - p1 * 40 - p2 * 250 + ease(p3) * 190 + p4 * 60;        // dolly: 430→390→140→330→390
    rollT = Math.sin(p2 * Math.PI) * .07 * (1 - p3);                   // filmski nagib u letu
    explT = ease(p3);
    if (SEQ) filmFrameT = pwlin(FRAME_SEQ.keys, progAt(zoneTop, zoneSpan)) * (SEQ.count - 1);
    const zb = zoneTop + zoneSpan + H - scrollY;                        // donja ivica zone, iz keša
    fadeT = Math.max(.06, Math.min(1, (zb - H * .25) / (H * .9)));
    for (let i = 0; i < pinSecs.length; i++) {
      const p = progSec(i), on = (i === 0 ? true : p > .04) && p < .96; // hero vidljiv odmah na vrhu
      if (pinState[i] !== on && pins[i]) { pins[i].classList.toggle('on', on); pinState[i] = on; }
    }
  }
  addEventListener('scroll', updateTargets, { passive: true });

  // ---- render ----
  let t = 0, lastFade = -1;
  function render(dt) {
    t += dt;
    if (SEQ && !filmFallback) {
      // Film-mod: dok prvi kadar ne stigne platno je nevidljivo (poster ispod ostaje LCP);
      // nakon prvog kadra platno preuzima, a ispod zone se samo blijedi bez ponovnog crtanja.
      if (fade <= .075 && filmDrawn) {
        if (fade !== lastFade) { canvas.style.opacity = fade.toFixed(3); lastFade = fade; }
        return;
      }
      const ok = drawFilm();
      if (ok) {
        // Opacity se piše samo na stvarnu promjenu (izbjegava style invalidation svaki frejm).
        if (Math.abs(fade - lastFade) > .004) { canvas.style.opacity = fade.toFixed(3); lastFade = fade; }
      } else if (!filmDrawn && lastFade !== 0) {
        canvas.style.opacity = '0'; lastFade = 0;
      }
      return;
    }
    ctx.fillStyle = '#04070a'; ctx.fillRect(0, 0, W, H);
    const cyw = Math.cos(yaw), syw = Math.sin(yaw);
    ctx.save();
    if (roll) { ctx.translate(W / 2, H / 2); ctx.rotate(roll); ctx.translate(-W / 2, -H / 2); }
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < COLS; i++) {
        const rr = cR[i] * (1 + expl * cLayer[i] * 1.05);
        const x = cCos[i] * rr - cx, z = cSin[i] * rr;
        const xr = x * cyw - z * syw, zr = x * syw + z * cyw + cz;
        if (zr < 60) continue;
        if ((zr > cz) !== (pass === 0)) continue;
        const s = F / zr;
        const sx = W / 2 + xr * s;
        if (sx < -40 || sx > W + 40) continue;
        const size = (isMobile ? 20 : 13) * s, half = size * (CELL / BASE) / 2;
        const depth = Math.max(0, Math.min(1, 1 - (zr - 60) / 720));
        const head = (t * cSpeed[i] | 0) % ROWS;
        const yExp = expl * (cLayer[i] - 1) * 130;
        for (let j = 0; j < ROWS; j++) {
          const syp = H / 2 + (cY0[i] + j * STEP + yExp - cy2) * s;
          if (syp < -40 || syp > H + 40) continue;
          let lvl = (depth * (j === head ? 7.9 : 4.2 + (j % 3))) | 0;
          if (lvl > 7) lvl = 7; if (lvl < 0) lvl = 0;
          const bit = bits[i * ROWS + ((j + head) % ROWS)];
          ctx.drawImage(atlas, lvl * CELL, bit * CELL, CELL, CELL, sx - half, syp - half, half * 2, half * 2);
        }
      }
    }
    ctx.fillStyle = 'rgba(140,215,255,' + (AMBIENT ? .18 : .30) + ')';
    for (let i = 0; i < DN; i++) {
      dY[i] -= dS[i] * dt * 4; if (dY[i] < -280) dY[i] = 280;
      const x = Math.cos(dA[i]) * dR[i] - cx, z = Math.sin(dA[i]) * dR[i];
      const xr = x * cyw - z * syw, zr = x * syw + z * cyw + cz;
      if (zr < 80) continue;
      const s = F / zr, r = dS[i] * s;
      ctx.fillRect(W / 2 + xr * s - r / 2, H / 2 + (dY[i] - cy2) * s - r / 2, r, r);
    }
    ctx.restore();
    ctx.fillStyle = midG; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = rimG; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = vigG; ctx.fillRect(0, 0, W, H);
    if (fade !== lastFade) { canvas.style.opacity = fade.toFixed(3); lastFade = fade; }
  }

  // ---- autoplay: "Pokreni cinematic" ----
  // Vozi skrol kroz cijelu zonu zadanim tempom; svaka korisnička interakcija ga odmah prekida.
  let lenis = null, autoFrom = 0, autoTo = 0, autoStart = 0, autoDur = 0, autoOn = false;
  const AUTO_SECONDS = 40;                                   // mirnija automatska projekcija

  function stopAutoplay() {
    if (!autoOn) return;
    autoOn = false;
    document.documentElement.classList.remove('cine-autoplay');
    const b = document.getElementById('cine-play');
    if (b) { b.setAttribute('aria-pressed', 'false'); b.textContent = b.dataset.play || 'Pokreni cinematic'; }
  }
  function startAutoplay() {
    if (!zoneEl || autoOn) return;
    measure();
    autoFrom = scrollY;
    autoTo = zoneTop + zoneSpan;                  // do kraja cinematic zone
    if (autoTo <= autoFrom + 8) { autoFrom = zoneTop; }   // već na dnu → kreni ispočetka
    autoDur = Math.max(4000, AUTO_SECONDS * 1000 * Math.min(1, Math.abs(autoTo - autoFrom) / (zoneSpan || 1)));
    autoStart = performance.now();
    autoOn = true;
    document.documentElement.classList.add('cine-autoplay');
    const b = document.getElementById('cine-play');
    if (b) { b.setAttribute('aria-pressed', 'true'); b.textContent = b.dataset.stop || 'Zaustavi'; }
  }
  function autoplayTick(now) {
    if (!autoOn) return;
    const k = Math.min(1, (now - autoStart) / autoDur);
    const y = autoFrom + (autoTo - autoFrom) * (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
    if (lenis && lenis.scrollTo) lenis.scrollTo(y, { immediate: true });
    else scrollTo(0, y);
    if (k >= 1) stopAutoplay();
  }
  ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(type =>
    addEventListener(type, e => {
      // Klik na samo dugme ne broji se kao prekid (dugme ga pali/gasi).
      if (e.target && e.target.closest && e.target.closest('#cine-play')) return;
      stopAutoplay();
    }, { passive: true }));
  window.digitalXCinematic = { start: startAutoplay, stop: stopAutoplay, isPlaying: () => autoOn };

  // ---- glavni loop ----
  const LERP = .05;                                          // sporije kretanje kamere
  let last = 0, frozen = false, slowFrames = 0;
  function step(now) {
    if (W !== innerWidth || H !== innerHeight) { resize(); updateTargets(); }
    if (!W) return;
    const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
    if (AMBIENT) {                                            // tihi auto-let + reakcija na skrol
      yawT = t * .05 + scrollY * .00045;
      czT = 430 + Math.sin(t * .09) * 45;
      cyT = Math.sin(t * .06) * 22;
      cxT = Math.sin(t * .04) * 60;
    }
    yaw += (yawT - yaw) * LERP; expl += (explT - expl) * LERP; fade += (fadeT - fade) * LERP;
    cx += (cxT - cx) * LERP; cy2 += (cyT - cy2) * LERP; cz += (czT - cz) * LERP; roll += (rollT - roll) * LERP;
    if (SEQ) {
      const d = filmFrameT - filmFrame;
      // Snap na cilj kad je razlika ispod pola kadra — sprječava beskonačno mikro-crtanje.
      // Brzina je ograničena (90 kadrova/s, raste s udaljenošću pa sustiže za ~0,8 s): brzi skrol ne preskače kadrove.
      const cap = Math.max(90, Math.abs(d) / .8) * dt;
      filmFrame = Math.abs(d) < .05 ? filmFrameT : filmFrame + Math.sign(d) * Math.min(Math.abs(d) * FILM_LERP, cap);
    }
    const t0 = performance.now();
    render(dt);
    if (performance.now() - t0 > 120) { if (++slowFrames > 5) frozen = true; } else slowFrames = 0;
  }
  const deferMotion = isMobile && !AMBIENT;
  let motionStarted = false;

  function startCinematicMotion() {
    if (motionStarted) return;
    motionStarted = true;
    if (!isMobile && typeof window.loadDigitalXFonts === 'function') window.loadDigitalXFonts();
    last = performance.now();

    // Lenis starts with the visual loop. On mobile this happens on the first
    // real touch/pointer gesture, so it never competes with the initial LCP paint.
    if (window.Lenis) {
      // Manji wheelMultiplier = kraći skok po potezu točkića, pa film napreduje po manje kadrova.
      lenis = new Lenis({ lerp: .055, smoothWheel: true, wheelMultiplier: .5, touchMultiplier: .9 });
      document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
        const el = document.querySelector(a.getAttribute('href'));
        if (el) { e.preventDefault(); stopAutoplay(); lenis.scrollTo(el, { duration: 1.2 }); }
      }));
    }

    // Jedan rAF za sve: Lenis + kamera + film. Dvije petlje su se otimale oko istog frejma.
    (function loop(now) {
      if (frozen) return;
      if (lenis) lenis.raf(now);
      autoplayTick(now);
      step(now);
      requestAnimationFrame(loop);
    })(last);
  }

  if (deferMotion) {
    ['pointerdown', 'touchstart'].forEach(type => {
      addEventListener(type, startCinematicMotion, { once: true, passive: true });
      if (SEQ) addEventListener(type, startFilm, { once: true, passive: true });   // mobitel: kadrovi tek nakon prvog dodira
    });
  } else {
    setTimeout(startCinematicMotion, 400);
    if (SEQ) {                                                  // desktop: kadrovi tek nakon load + idle (poster je LCP)
      // Idle callback zna izostati (zauzeta ili skrivena kartica), pa ga uvijek prati tvrdi timeout.
      const kick = () => {
        let fired = false;
        const go = () => { if (fired) return; fired = true; startFilm(); };
        if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 2000 });
        setTimeout(go, 2500);
      };
      if (document.readyState === 'complete') kick();
      else addEventListener('load', kick, { once: true });
    }
  }

  // Dugme "Pokreni cinematic" (ako postoji na stranici).
  // Dugme je vidljivo iz HTML-a (ne čeka JS), a sklanja se samo ako nema cinematic zone.
  const playBtn = document.getElementById('cine-play');
  if (playBtn) {
    if (zoneEl) playBtn.addEventListener('click', () => { autoOn ? stopAutoplay() : startAutoplay(); });
    else { const wrap = playBtn.closest('.cine-play-wrap'); if (wrap) wrap.hidden = true; }
  }

  measure(); updateTargets(); step(performance.now());
  // Layout se mijenja i nakon prvog paint-a (fontovi, lazy slike) — premjeri jednom kad se sve slegne.
  addEventListener('load', () => { measure(); updateTargets(); }, { once: true });
  document.addEventListener('visibilitychange', () => { last = performance.now(); });
})();
