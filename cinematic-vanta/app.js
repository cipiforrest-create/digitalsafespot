/* ================= VANTA · cinematic scroll engine ================= */
(() => {
  "use strict";

  const FRAME_COUNT = 361;                 // frame_001 .. frame_361
  const FRAME_PATH  = i => `/assets/primjeri/vanta/frames/frame_${String(i).padStart(3, "0")}.jpg`;
  const HERO_SRC    = "/assets/primjeri/vanta/hero.jpg";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- element refs ---------- */
  const $  = s => document.querySelector(s);
  const canvas = $("#drive");
  const ctx    = canvas.getContext("2d", { alpha: false });
  const preloader = $("#preloader");
  const plFill = $("#plFill");
  const plPct  = $("#plPct");

  /* ---------- frame store ---------- */
  const frames = new Array(FRAME_COUNT);
  let loaded = 0;
  let ready = false;
  let running = false;
  let rafId = 0;
  let loaderPct = -1;

  /* ---------- canvas sizing (cover) ---------- */
  let cw = 0, ch = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = canvas.clientWidth;
    ch = canvas.clientHeight;
    canvas.width  = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFrame(currentIndex, true);
  }

  function drawImageCover(img) {
    if (!img || !img.width) return;
    const ir = img.width / img.height;
    const cr = cw / ch;
    let w, h, x, y;
    if (ir > cr) { h = ch; w = ch * ir; x = (cw - w) / 2; y = 0; }
    else         { w = cw; h = cw / ir; x = 0; y = (ch - h) / 2; }
    ctx.drawImage(img, x, y, w, h);
  }

  let currentIndex = 1;
  function drawFrame(idx, force) {
    idx = Math.max(1, Math.min(FRAME_COUNT, Math.round(idx)));
    if (!force && idx === currentIndex) return;
    currentIndex = idx;
    const img = frames[idx - 1];
    if (img && img.complete) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, cw, ch);
      drawImageCover(img);
    }
  }

  /* ---------- progressive frame loading ---------- */
  // Load frame 1 first so we can show something instantly, then batch the rest.
  function loadFrame(i) {
    return new Promise(res => {
      const img = new Image();
      img.decoding = "async";
      img.onload = img.onerror = () => {
        frames[i - 1] = img;
        loaded++;
        const pct = Math.round((loaded / FRAME_COUNT) * 100);
        if (pct !== loaderPct) {
          loaderPct = pct;
          plFill.style.width = pct + "%";
          plPct.textContent = pct;
        }
        res();
      };
      img.src = FRAME_PATH(i);
    });
  }

  async function boot() {
    resize();
    // first frame ASAP
    await loadFrame(1);
    drawFrame(1, true);
    // remaining frames with limited concurrency
    const queue = [];
    for (let i = 2; i <= FRAME_COUNT; i++) queue.push(i);
    const CONC = 8;
    async function worker() {
      while (queue.length) { await loadFrame(queue.shift()); }
    }
    await Promise.all(Array.from({ length: CONC }, worker));
    ready = true;
    finishPreload();
  }

  function finishPreload() {
    preloader.classList.add("done");
    document.body.classList.add("ready");
    setTimeout(() => { preloader.style.display = "none"; }, 850);
    // reveal HUD + rail
    $("#hud").classList.add("show");
    $("#rail").classList.add("show");
    onScroll();
  }

  /* ---------- scroll → frame + HUD ---------- */
  const hudMph  = $("#mph");
  const hudBar  = $("#mphBar");
  const hudBatt = $("#hudBatt");
  const hudG    = $("#hudG");
  const hudMode = $("#hudMode");
  const scrollCue = $("#scrollCue");
  const topbar  = $("#topbar");
  const wipe    = $("#wipe");

  let targetProg = 0;   // 0..1 from scroll
  let smoothProg = 0;   // eased
  let lastProg = 0;
  let lastT = performance.now();

  function scrollProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? window.scrollY / max : 0;
  }

  function onScroll() {
    targetProg = scrollProgress();
    // hide cue after first movement
    if (window.scrollY > 40) scrollCue.classList.add("hide");
    else scrollCue.classList.remove("hide");
    // topbar hide when scrolling into deep content handled in raf
  }


  let prevMph = 0, battery = 100;
  let lastHud = { mph: -1, batt: -1, g: "", mode: "", topbar: false };
  function raf(now) {
    if (!running) return;
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;

    // ease frame progress toward target (lower factor = slower, smoother scrub)
    // Eased toward scroll (frame-rate independent) and speed-capped at 90 frames/s, rising with the distance so it
    // catches up within ~0.8 s: fast input still shows every frame instead of skipping through the sequence.
    const gap = targetProg - smoothProg;
    const step = Math.abs(gap) * (reduce ? 1 : 1 - Math.pow(0.94, dt * 60));
    const cap = reduce || Math.abs(gap) > 0.5 ? Infinity : Math.max(90 / FRAME_COUNT, Math.abs(gap) / 0.8) * dt;
    smoothProg += Math.sign(gap) * Math.min(step, cap);
    const idx = 1 + smoothProg * (FRAME_COUNT - 1);
    drawFrame(idx);

    // ---- SPEED: derived from scroll velocity, mapped 0..250 ----
    const velocity = Math.abs(smoothProg - lastProg) / (dt || 0.016); // prog/sec
    lastProg = smoothProg;
    // base cruising speed rises with position; velocity adds surge
    const base = 40 + smoothProg * 150;
    const surge = Math.min(velocity * 900, 110);
    let mph = Math.min(250, base + surge);
    // smooth the readout
    mph = prevMph + (mph - prevMph) * 0.15;

    // g-force from acceleration
    const accel = (mph - prevMph);
    prevMph = mph;

    // battery drains subtly with distance
    battery = Math.max(38, 100 - smoothProg * 62);

    if (hudMph) {
      const mphValue = Math.round(mph);
      const battValue = Math.round(battery);
      const gValue = Math.min(1.9, Math.abs(accel) * 0.6).toFixed(1);
      const modeValue = smoothProg > 0.55 ? "AUTONOMY · ON" : "AUTONOMY · OFF";
      if (mphValue !== lastHud.mph) {
        lastHud.mph = mphValue;
        hudMph.textContent = mphValue;
        hudBar.style.width = (mph / 250 * 100) + "%";
      }
      if (battValue !== lastHud.batt) { lastHud.batt = battValue; hudBatt.textContent = battValue; }
      if (gValue !== lastHud.g) { lastHud.g = gValue; hudG.textContent = gValue; }
      if (modeValue !== lastHud.mode) { lastHud.mode = modeValue; hudMode.textContent = modeValue; }
    }

    // topbar visibility
    const hideTopbar = window.scrollY > window.innerHeight * 0.6;
    if (hideTopbar !== lastHud.topbar) {
      lastHud.topbar = hideTopbar;
      topbar.classList.toggle("hide", hideTopbar);
    }

    rafId = requestAnimationFrame(raf);
  }

  function startRaf() {
    if (running || document.hidden) return;
    running = true;
    lastT = performance.now();
    rafId = requestAnimationFrame(raf);
  }

  function stopRaf() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  /* ---------- chapter rail + reveals via IntersectionObserver ---------- */
  const railItems = [...document.querySelectorAll(".rail-item")];
  const chapterOf = {};
  railItems.forEach(it => chapterOf[it.dataset.target] = it);

  function setActiveChapter(ch) {
    railItems.forEach(it => it.classList.toggle("is-active", it.dataset.target === ch));
  }

  // reveal observer
  const revObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("in"); });
  }, { threshold: 0.25 });
  document.querySelectorAll(".reveal").forEach(el => revObs.observe(el));

  // chapter tracking + motion-blur wipe on section change
  let activeChapter = "ch-flats";
  const chapObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && e.intersectionRatio > 0.5) {
        const ch = e.target.dataset.chapter;
        if (ch && ch !== activeChapter) {
          activeChapter = ch;
          setActiveChapter(ch);
          triggerWipe();
        }
      }
    });
  }, { threshold: [0.5, 0.75] });
  document.querySelectorAll("[data-chapter]").forEach(el => chapObs.observe(el));

  let wipeT;
  function triggerWipe() {
    if (reduce) return;
    clearTimeout(wipeT);
    wipe.style.transition = "none";
    wipe.style.opacity = "1";
    wipe.style.transform = "translateX(-30%)";
    requestAnimationFrame(() => {
      wipe.style.transition = "transform .9s cubic-bezier(.16,1,.3,1), opacity .9s";
      wipe.style.transform = "translateX(60%)";
      wipe.style.opacity = "0";
    });
  }

  // rail click → scroll to section
  railItems.forEach(it => it.addEventListener("click", () => {
    const el = document.getElementById(it.dataset.target);
    if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }));


  /* ---------- count-up stats ---------- */
  const counters = [...document.querySelectorAll(".count")];
  const countObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { runCount(e.target); countObs.unobserve(e.target); }
    });
  }, { threshold: 0.6 });
  counters.forEach(c => countObs.observe(c));

  function runCount(el) {
    const to = parseFloat(el.dataset.to);
    const dec = parseInt(el.dataset.dec, 10) || 0;
    const dur = 1500;
    const t0 = performance.now();
    function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = to * eased;
      el.textContent = dec ? val.toFixed(dec) : Math.round(val).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = dec ? to.toFixed(dec) : to.toLocaleString();
    }
    requestAnimationFrame(tick);
  }

  /* ---------- configurator: live recolor of hero still ---------- */
  const paint = document.getElementById("paintCanvas");
  const pctx  = paint.getContext("2d");
  const heroImg = new Image();
  let heroReady = false;
  const macroEls = document.querySelectorAll(".macro-img");

  heroImg.onload = () => {
    heroReady = true;
    paint.width = heroImg.width;
    paint.height = heroImg.height;
    // feed the design macro tiles from the same still
    const url = `url("${HERO_SRC}")`;
    macroEls.forEach(m => m.style.backgroundImage = url);
    applyPaint(activePaint);
  };
  heroImg.src = HERO_SRC;

  let activePaint = { hue: 0, sat: 0.62, lum: 0.9, accent: "#00E5FF", name: "Obsidian" };

  function applyPaint(p) {
    if (!heroReady) return;
    const w = paint.width, h = paint.height;
    pctx.clearRect(0, 0, w, h);
    pctx.drawImage(heroImg, 0, 0, w, h);

    // hue rotate + tint using compositing for a believable repaint
    if (p.hue !== 0) {
      pctx.save();
      pctx.globalCompositeOperation = "hue";
      pctx.fillStyle = `hsl(${(p.hue + 360) % 360},70%,50%)`;
      pctx.globalAlpha = 0.55;
      pctx.fillRect(0, 0, w, h);
      pctx.restore();
    }
    // saturation / luminance polish
    pctx.save();
    pctx.globalCompositeOperation = "overlay";
    const l = p.lum;
    const shade = l >= 1 ? 255 : 0;
    pctx.globalAlpha = Math.abs(1 - l) * 0.6;
    pctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    pctx.fillRect(0, 0, w, h);
    pctx.restore();

    // accent glow wash (bottom) to echo the light blade
    pctx.save();
    pctx.globalCompositeOperation = "screen";
    const g = pctx.createLinearGradient(0, h, 0, h * 0.55);
    g.addColorStop(0, hexA(p.accent, 0.22));
    g.addColorStop(1, hexA(p.accent, 0));
    pctx.fillStyle = g;
    pctx.fillRect(0, 0, w, h);
    pctx.restore();

    // update accent-driven UI
    document.documentElement.style.setProperty("--accent", p.accent);
    document.getElementById("paintName").textContent = p.name;
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
  }

  document.querySelectorAll(".swatch").forEach(sw => {
    sw.addEventListener("click", () => {
      document.querySelectorAll(".swatch").forEach(s => s.classList.remove("is-active"));
      sw.classList.add("is-active");
      activePaint = {
        hue: parseFloat(sw.dataset.hue),
        sat: parseFloat(sw.dataset.sat),
        lum: parseFloat(sw.dataset.lum),
        accent: sw.dataset.accent,
        name: sw.dataset.name
      };
      applyPaint(activePaint);
      const sel = document.getElementById("finishSelect");
      if (sel) sel.value = activePaint.name;
    });
  });


  /* ---------- reserve form (local confirm) ---------- */
  const form = document.getElementById("reserveForm");
  const card = document.getElementById("reserveCard");
  const done = document.getElementById("reserveDone");
  const doneMsg = document.getElementById("doneMsg");

  // restore any prior reservation
  try {
    const saved = JSON.parse(localStorage.getItem("vanta_reservation") || "null");
    if (saved) showDone(saved, false);
  } catch (e) {}

  form.addEventListener("submit", ev => {
    ev.preventDefault();
    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      finish: form.finish.value,
      ts: Date.now()
    };
    let ok = true;
    form.querySelectorAll(".field").forEach(f => f.classList.remove("err"));
    if (!data.name) { form.name.closest(".field").classList.add("err"); ok = false; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) { form.email.closest(".field").classList.add("err"); ok = false; }
    if (!ok) return;
    localStorage.setItem("vanta_reservation", JSON.stringify(data));
    showDone(data, true);
  });

  function showDone(data, animate) {
    form.hidden = true;
    done.hidden = false;
    const ref = "VNT-" + String(data.ts).slice(-6);
    doneMsg.innerHTML = `${data.name.split(" ")[0]}, your <b>${data.finish}</b> VANTA is locked. ` +
                        `Reference <b>${ref}</b> — sent to ${data.email}.`;
    if (animate) card.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  document.getElementById("resetReserve").addEventListener("click", () => {
    localStorage.removeItem("vanta_reservation");
    done.hidden = true;
    form.hidden = false;
    form.reset();
  });

  /* ---------- listeners + start ---------- */
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopRaf();
    else { onScroll(); startRaf(); }
  });
  startRaf();
  boot();
})();
