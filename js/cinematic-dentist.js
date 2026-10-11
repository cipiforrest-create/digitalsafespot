/* ==========================================================================
   Edin Topcic — Cinematic 3D Scroll Portfolio
   Lenis smooth scroll + GSAP ScrollTrigger + canvas frame-sequence scrub
   ========================================================================== */

gsap.registerPlugin(ScrollTrigger);

/* ---------- Config ---------- */
const FRAME_COUNT = 192;
const framePath = (i) => `/media/frames/dentist/hero_${String(i).padStart(3, "0")}.jpg`;

/* ---------- Elements ---------- */
const canvas = document.getElementById("heroCanvas");
const ctx = canvas.getContext("2d", { alpha: false });
const preloader = document.getElementById("preloader");
const preBar = document.getElementById("preBar");
const prePct = document.getElementById("prePct");

/* ---------- Frame preloading ---------- */
const images = [];
let loaded = 0;
const seq = { frame: 0 };
let lastDrawnFrame = -1;
let lastPreloadPercent = -1;

function setProgress(p) {
  const value = Math.round(p);
  if (value === lastPreloadPercent) return;
  lastPreloadPercent = value;
  preBar.style.width = value + "%";
  prePct.textContent = value + "%";
}

function loadFrame(i) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = img.onerror = () => {
      images[i - 1] = img;
      loaded++;
      setProgress((loaded / FRAME_COUNT) * 100);
      resolve();
    };
    img.src = framePath(i);
  });
}

async function preload() {
  await loadFrame(1);
  sizeCanvas();
  const queue = Array.from({ length: FRAME_COUNT - 1 }, (_, index) => index + 2);
  const concurrency = Math.min(8, Math.max(4, Number(navigator.hardwareConcurrency) || 8));
  async function worker() {
    while (queue.length) await loadFrame(queue.shift());
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  start();
}

/* ---------- Canvas draw (cover fit) ---------- */
function sizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  drawFrame(Math.round(seq.frame), true);
}

function drawFrame(index, force = false) {
  index = Math.max(0, Math.min(FRAME_COUNT - 1, index));
  if (!force && index === lastDrawnFrame) return;
  const img = images[index];
  if (!img || !img.width) return;
  lastDrawnFrame = index;
  const cw = canvas.width, ch = canvas.height;
  const ir = img.width / img.height;
  const cr = cw / ch;
  let dw, dh, dx, dy;
  if (cr > ir) { dw = cw; dh = cw / ir; dx = 0; dy = (ch - dh) / 2; }
  else { dh = ch; dw = ch * ir; dy = 0; dx = (cw - dw) / 2; }
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
}

/* ---------- Kinetic hero name ---------- */
function buildKineticName() {
  const el = document.getElementById("heroName");
  if (!el) return;
  const text = "Edin Topcic";
  el.innerHTML = "";
  [...text].forEach((c) => {
    if (c === " ") {
      const s = document.createElement("span");
      s.className = "space";
      el.appendChild(s);
    } else {
      const wrap = document.createElement("span");
      wrap.style.display = "inline-block";
      wrap.style.overflow = "hidden";
      wrap.style.verticalAlign = "top";
      const ch = document.createElement("span");
      ch.className = "ch";
      ch.textContent = c;
      wrap.appendChild(ch);
      el.appendChild(wrap);
    }
  });
}

/* ---------- Finale title split ---------- */
function splitFinale() {
  const el = document.getElementById("finaleTitle");
  if (!el) return;
  const text = el.textContent;
  el.innerHTML = "";
  [...text].forEach((c) => {
    const s = document.createElement("span");
    s.className = "ch";
    s.textContent = c === " " ? "\u00A0" : c;
    el.appendChild(s);
  });
}

/* ==========================================================================
   START — runs after all frames preloaded
   ========================================================================== */
function start() {
  preloader.classList.add("done");

  buildKineticName();
  splitFinale();
  sizeCanvas();

  /* ---- Lenis smooth scroll ---- */
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    lerp: 0.09,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) lenis.stop();
    else lenis.start();
  });

  /* =====================================================
     HERO — scrub the orbit frame sequence
     ===================================================== */
  gsap.to(seq, {
    frame: FRAME_COUNT - 1,
    ease: "none",
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5,
    },
    onUpdate: () => drawFrame(Math.round(seq.frame)),
  });

  /* Kinetic name tracks in letter-by-letter across the first part of the orbit */
  gsap.to(".hero__name .ch", {
    y: "0%",
    opacity: 1,
    ease: "power3.out",
    stagger: 0.05,
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "35% top",
      scrub: 1,
    },
  });

  /* Subtitle fades up slightly later */
  gsap.to("#heroSub", {
    opacity: 1,
    y: 0,
    ease: "power2.out",
    scrollTrigger: {
      trigger: "#hero",
      start: "18% top",
      end: "40% top",
      scrub: 1,
    },
  });

  /* Fade scroll hint away quickly */
  gsap.to("#scrollHint", {
    opacity: 0,
    ease: "none",
    scrollTrigger: { trigger: "#hero", start: "top top", end: "8% top", scrub: true },
  });

  /* Subtle push toward end of orbit — name drifts up, letting the face own the frame */
  gsap.to(".hero__type", {
    y: "-8vh",
    opacity: 0.15,
    ease: "none",
    scrollTrigger: { trigger: "#hero", start: "60% top", end: "bottom bottom", scrub: true },
  });

  /* =====================================================
     STATS — count up on enter
     ===================================================== */
  document.querySelectorAll(".stat").forEach((stat) => {
    const numEl = stat.querySelector(".stat__num");
    const target = parseFloat(stat.dataset.target);
    const suffix = stat.dataset.suffix || "";
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: stat,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          v: target,
          duration: 2,
          ease: "power2.out",
          onUpdate: () => {
            numEl.textContent = Math.round(obj.v).toLocaleString("de-DE") + suffix;
          },
        });
      },
    });
    gsap.from(stat, {
      y: 40, opacity: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: stat, start: "top 88%", once: true },
    });
  });

  /* =====================================================
     PILLARS — play video + reveal one at a time
     ===================================================== */
  const builderVideo = document.getElementById("builderVideo");
  ScrollTrigger.create({
    trigger: "#pillars",
    start: "top 60%",
    end: "bottom top",
    onEnter: () => builderVideo.play().catch(() => {}),
    onEnterBack: () => builderVideo.play().catch(() => {}),
    onLeave: () => builderVideo.pause(),
    onLeaveBack: () => builderVideo.pause(),
  });

  const pillars = gsap.utils.toArray(".pillar");
  pillars.forEach((p, i) => {
    ScrollTrigger.create({
      trigger: "#pillars",
      start: () => `${18 + i * 24}% top`,
      end: () => `${42 + i * 24}% top`,
      onEnter: () => p.classList.add("active"),
      onLeaveBack: () => p.classList.remove("active"),
    });
  });

  /* Head parallax */
  gsap.to(".pillars__head", {
    y: -60, ease: "none",
    scrollTrigger: { trigger: "#pillars", start: "top top", end: "bottom top", scrub: true },
  });
  gsap.to(".pillars__video", {
    scale: 1.16, ease: "none",
    scrollTrigger: { trigger: "#pillars", start: "top top", end: "bottom top", scrub: true },
  });

  /* =====================================================
     WORK — play video + reveal cards
     ===================================================== */
  const closerVideo = document.getElementById("closerVideo");
  ScrollTrigger.create({
    trigger: "#work",
    start: "top 60%",
    end: "bottom top",
    onEnter: () => closerVideo.play().catch(() => {}),
    onEnterBack: () => closerVideo.play().catch(() => {}),
    onLeave: () => closerVideo.pause(),
    onLeaveBack: () => closerVideo.pause(),
  });

  gsap.utils.toArray(".card").forEach((card, i) => {
    ScrollTrigger.create({
      trigger: "#work",
      start: () => `${20 + i * 12}% top`,
      once: true,
      onEnter: () => setTimeout(() => card.classList.add("reveal"), i * 90),
    });
  });

  gsap.to(".work__head", {
    y: -50, ease: "none",
    scrollTrigger: { trigger: "#work", start: "top top", end: "bottom top", scrub: true },
  });

  /* =====================================================
     FINALE — title chars pop in
     ===================================================== */
  gsap.from("#finaleTitle .ch", {
    y: 120, opacity: 0, rotateX: -60, transformOrigin: "50% 100%",
    stagger: 0.03, ease: "power4.out", duration: 0.9,
    scrollTrigger: { trigger: "#finale", start: "top 70%", once: true },
  });
  gsap.from(".finale__btns .btn", {
    y: 30, opacity: 0, stagger: 0.1, ease: "power3.out", duration: 0.7,
    scrollTrigger: { trigger: ".finale__btns", start: "top 85%", once: true },
  });

  /* Refresh once everything is registered */
  ScrollTrigger.refresh();
}

/* ---------- Events ---------- */
let resizeTO;
window.addEventListener("resize", () => {
  clearTimeout(resizeTO);
  resizeTO = setTimeout(() => {
    sizeCanvas();
    ScrollTrigger.refresh();
  }, 150);
});

document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- Boot ---------- */
preload();
