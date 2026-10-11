/* ===================================================================
   ABYSSAL — scroll-scrubbed descent engine
   Scrolling down = diving down. Canvas plays a 480-frame sequence
   built from the five concatenated EREBUS clips (one seamless descent).
   =================================================================== */
(() => {
  'use strict';

  // ---- config ----
  const FRAME_COUNT = 480;                 // f_0001 .. f_0480
  const FRAME_PATH  = i => `frames/f_${String(i).padStart(4, '0')}.jpg`;
  const MAX_DEPTH   = 3800;                // meters
  const SCROLL_VH   = 720;                 // total scroll length in vh (longer = slower/smoother scrub)

  // Zone boundaries as fraction of the descent (0..1) -> label
  const ZONES = [
    { at: 0.00, label: 'THE SURFACE' },
    { at: 0.20, label: 'SUNLIT ZONE' },
    { at: 0.42, label: 'TWILIGHT ZONE' },
    { at: 0.64, label: 'MIDNIGHT ZONE' },
    { at: 0.86, label: 'THE FLOOR' },
  ];

  // Color grade keyframes: navy -> pure black with depth.
  // [progress, r,g,b, alpha]  (overlay multiplied over the footage)
  const GRADE = [
    { p: 0.00, c: [10, 30, 48],  a: 0.00 },
    { p: 0.22, c: [6, 26, 46],   a: 0.14 },
    { p: 0.45, c: [3, 14, 30],   a: 0.34 },
    { p: 0.68, c: [1, 6, 16],    a: 0.60 },
    { p: 0.88, c: [0, 2, 8],     a: 0.82 },
    { p: 1.00, c: [0, 1, 5],     a: 0.88 },
  ];

  // ---- elements ----
  const canvas   = document.getElementById('scene');
  const ctx      = canvas.getContext('2d', { alpha: false });
  const grade    = document.getElementById('grade');
  const loader   = document.getElementById('loader');
  const fill     = document.getElementById('loader-fill');
  const pct      = document.getElementById('loader-pct');
  const depthVal = document.getElementById('depth-val');
  const depthZone= document.getElementById('depth-zone');
  const dmProg   = document.getElementById('dm-progress');
  const pressVal = document.getElementById('press-val');
  const scrollHint = document.getElementById('scroll-hint');
  const ticksWrap  = document.getElementById('dm-ticks');
  const story    = document.getElementById('story');

  // ---- state ----
  const images = new Array(FRAME_COUNT);
  let loaded = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let vw = 0, vh = 0;
  let imgW = 0, imgH = 0;
  let currentFrame = -1;
  let targetProgress = 0;   // where the scroll says we should be (0..1)
  let renderProgress = 0;   // smoothed value actually drawn
  let ready = false;

  // ---- scroll length ----
  // The 10 story panels (each ~100vh) provide the full scroll height.
  // The fixed canvas scrubs the 480-frame descent from page top (0) to
  // page bottom (1). Text panels scroll over the fixed footage — the
  // words move, the dive continues, scrolling down IS diving down.
  void SCROLL_VH; // retained for reference / tuning


  // ---- canvas sizing ----
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    vw = window.innerWidth;
    vh = window.innerHeight;
    canvas.width  = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    canvas.style.width  = vw + 'px';
    canvas.style.height = vh + 'px';
    if (images[0]) { imgW = images[0].naturalWidth; imgH = images[0].naturalHeight; }
    currentFrame = -1; // force redraw
    draw(renderProgress);
  }

  // ---- draw one frame (cover fit) ----
  function drawImageCover(img) {
    const cw = canvas.width, ch = canvas.height;
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = cw / ch;
    let dw, dh, dx, dy;
    if (cr > ir) { dw = cw; dh = cw / ir; dx = 0; dy = (ch - dh) / 2; }
    else         { dh = ch; dw = ch * ir; dy = 0; dx = (cw - dw) / 2; }
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function frameForProgress(p) {
    const idx = Math.round(p * (FRAME_COUNT - 1));
    return Math.max(0, Math.min(FRAME_COUNT - 1, idx));
  }

  function draw(p) {
    const idx = frameForProgress(p);
    const img = images[idx];
    if (img && img.complete) {
      if (idx !== currentFrame) {
        drawImageCover(img);
        currentFrame = idx;
      }
    } else {
      // fallback: nearest already-loaded frame
      for (let d = 1; d < FRAME_COUNT; d++) {
        const a = images[idx - d], b = images[idx + d];
        if (a && a.complete) { drawImageCover(a); break; }
        if (b && b.complete) { drawImageCover(b); break; }
      }
    }
    updateGrade(p);
  }

  // ---- color grade + vignette-by-depth ----
  function lerp(a, b, t) { return a + (b - a) * t; }
  function updateGrade(p) {
    let g0 = GRADE[0], g1 = GRADE[GRADE.length - 1];
    for (let i = 0; i < GRADE.length - 1; i++) {
      if (p >= GRADE[i].p && p <= GRADE[i + 1].p) { g0 = GRADE[i]; g1 = GRADE[i + 1]; break; }
    }
    const span = (g1.p - g0.p) || 1;
    const t = Math.max(0, Math.min(1, (p - g0.p) / span));
    const r = Math.round(lerp(g0.c[0], g1.c[0], t));
    const gg = Math.round(lerp(g0.c[1], g1.c[1], t));
    const b = Math.round(lerp(g0.c[2], g1.c[2], t));
    const a = lerp(g0.a, g1.a, t);
    grade.style.background =
      `linear-gradient(180deg, rgba(${r},${gg},${b},${a*0.7}) 0%, rgba(${Math.round(r*0.4)},${Math.round(gg*0.4)},${Math.round(b*0.4)},${a}) 100%)`;
  }

  // ---- HUD updates ----
  function zoneForProgress(p) {
    let z = ZONES[0].label;
    for (const zn of ZONES) if (p >= zn.at) z = zn.label;
    return z;
  }
  let displayDepth = 0;
  function updateHUD(p) {
    const depth = p * MAX_DEPTH;
    displayDepth += (depth - displayDepth) * 0.2;
    const shown = Math.round(displayDepth);
    depthVal.textContent = shown.toLocaleString('en-US');
    dmProg.style.height = (p * 100).toFixed(2) + '%';
    // pressure ~ 1 atm per 10m + surface atm
    pressVal.textContent = (1 + displayDepth / 10).toFixed(1);
    const zone = zoneForProgress(p);
    if (depthZone.textContent !== zone) depthZone.textContent = zone;
  }

  // ---- build depth ticks ----
  function buildTicks() {
    const marks = [0, 950, 1900, 2850, 3800];
    ticksWrap.innerHTML = '';
    marks.forEach(m => {
      const i = document.createElement('i');
      i.style.top = (m / MAX_DEPTH * 100) + '%';
      const s = document.createElement('span');
      s.textContent = m.toLocaleString('en-US') + 'm';
      i.appendChild(s);
      ticksWrap.appendChild(i);
    });
  }

  // ---- scroll -> progress ----
  function computeProgress() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const y = window.scrollY || window.pageYOffset;
    return scrollable > 0 ? Math.max(0, Math.min(1, y / scrollable)) : 0;
  }

  // ---- main render loop (smoothed scrub) ----
  let lastLoop = 0;
  function loop(now) {
    // Eased toward scroll (frame-rate independent) and speed-capped at 90 frames/s, rising with the distance so it
    // catches up within ~0.8 s: fast input still shows every frame of the descent.
    const dt = Math.min(0.05, lastLoop && now ? (now - lastLoop) / 1000 : 1 / 60);
    lastLoop = now || 0;
    const gap = targetProgress - renderProgress;
    const cap = Math.abs(gap) > 0.5 ? Infinity : Math.max(90 / FRAME_COUNT, Math.abs(gap) / 0.8) * dt;
    renderProgress += Math.sign(gap) * Math.min(Math.abs(gap) * (1 - Math.pow(0.88, dt * 60)), cap);
    if (Math.abs(targetProgress - renderProgress) < 0.0002) renderProgress = targetProgress;
    draw(renderProgress);
    updateHUD(renderProgress);
    requestAnimationFrame(loop);
  }

  function onScroll() {
    targetProgress = computeProgress();
    if (targetProgress > 0.02) scrollHint.classList.add('hide');
    else scrollHint.classList.remove('hide');
  }

  // ---- section reveal via IntersectionObserver ----
  function setupReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { threshold: 0.25 });
    document.querySelectorAll('.panel').forEach(p => io.observe(p));
  }

  // ---- preload frames (priority: spread, then fill) ----
  function preload(done) {
    // Load in an order that fills coarse frames first for fast first paint,
    // then fills the gaps — so scrubbing has something everywhere quickly.
    const order = [];
    const step = 8;
    for (let s = 0; s < step; s++)
      for (let i = s; i < FRAME_COUNT; i += step) order.push(i);

    let started = 0;
    const CONCURRENCY = 12;

    function loadOne(i) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = img.onerror = () => {
        loaded++;
        const frac = loaded / FRAME_COUNT;
        fill.style.width = (frac * 100).toFixed(1) + '%';
        pct.textContent = Math.round(frac * 100) + '%';
        if (i === 0 && img.complete) { imgW = img.naturalWidth; imgH = img.naturalHeight; }
        if (loaded === FRAME_COUNT && done) done();
        pump();
      };
      img.src = FRAME_PATH(i + 1);
      images[i] = img;
    }
    function pump() {
      while (started < order.length &&
             (started - loaded) < CONCURRENCY) {
        loadOne(order[started++]);
      }
    }
    pump();
  }

  // ---- boot ----
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  buildTicks();
  setupReveal();
  resize();

  preload(() => {
    // fully loaded
  });

  // Reveal the experience as soon as the FIRST usable frames are ready,
  // don't wait for all 480.
  const readyCheck = setInterval(() => {
    if (loaded >= 24 && images[0] && images[0].complete) {
      clearInterval(readyCheck);
      imgW = images[0].naturalWidth; imgH = images[0].naturalHeight;
      resize();
      onScroll();
      loop();
      // small delay so the loader bar reads meaningfully
      setTimeout(() => loader.classList.add('done'), 500);
      ready = true;
    }
  }, 60);

})();
