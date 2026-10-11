/* Digital X scroll-cinematic engine — canvas image-sequence scrub, not WebGL. */
(() => {
  'use strict';

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const pad = (value, width) => String(value).padStart(width, '0');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sections = (window.SCRUB_SECTIONS || [])
    .map((config) => {
      const element = document.querySelector(config.element);
      const canvas = document.querySelector(config.canvas);
      if (!element || !canvas) return null;
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) return null;
      return {
        ...config,
        selector: config.element,
        element,
        canvas,
        context,
        images: new Array(config.frameCount),
        loaded: 0,
        failed: 0,
        lastFrame: -1,
        progress: 0,
        targetProgress: 0,
        lastCopyProgress: -1,
      };
    })
    .filter(Boolean);

  const loader = document.querySelector('[data-cinematic-loader]');
  const loaderBar = document.querySelector('[data-cinematic-loader-bar]');
  const loaderPct = document.querySelector('[data-cinematic-loader-pct]');
  const readyFrames = sections.reduce((sum, section) => {
    if (reduced) return sum + 1;
    const at = Number(section.readyAt);
    return sum + (Number.isFinite(at) && at > 0 ? Math.min(at, section.frameCount) : section.frameCount);
  }, 0);

  let completed = 0;
  let successful = 0;
  let finished = false;
  let lenis = null;
  let rafId = 0;
  let running = false;
  let layoutDirty = true;
  let cachedScrollY = window.scrollY;
  let lastLoaderValue = -1;

  function source(section, index) {
    if (typeof section.src === 'function') return section.src(index);
    const first = section.firstFrame ?? 1;
    return section.src
      .replace('{frame}', pad(index + first, section.pad ?? 4))
      .replace('{index}', String(index + first));
  }

  function drawCover(section, index, force = false) {
    index = clamp(Math.round(index), 0, section.frameCount - 1);
    if (!force && section.lastFrame === index) return;
    let image = section.images[index];
    if (!image?.complete || !image.naturalWidth) {
      for (let distance = 1; distance < section.frameCount; distance += 1) {
        image = section.images[index - distance] || section.images[index + distance];
        if (image?.complete && image.naturalWidth) break;
      }
    }
    if (!image?.naturalWidth) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = section.canvas.clientWidth || window.innerWidth;
    const height = section.canvas.clientHeight || window.innerHeight;
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (section.canvas.width !== pixelWidth || section.canvas.height !== pixelHeight) {
      section.canvas.width = pixelWidth;
      section.canvas.height = pixelHeight;
    }

    const context = section.context;
    const paint = (scale) => {
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      context.drawImage(
        image,
        (pixelWidth - drawWidth) / 2,
        (pixelHeight - drawHeight) / 2,
        drawWidth,
        drawHeight,
      );
    };

    const cover = Math.max(pixelWidth / image.naturalWidth, pixelHeight / image.naturalHeight);
    context.fillStyle = section.background || '#000';
    context.fillRect(0, 0, pixelWidth, pixelHeight);

    if (section.fit === 'contain') {
      const scratch = section.scratch || (section.scratch = document.createElement('canvas'));
      const ratio = image.naturalHeight / image.naturalWidth;
      scratch.width = 64;
      scratch.height = Math.max(1, Math.round(64 * ratio));
      const scratchContext = scratch.getContext('2d');
      if (scratchContext) {
        scratchContext.drawImage(image, 0, 0, scratch.width, scratch.height);
        const backdrop = Math.max(pixelWidth / scratch.width, pixelHeight / scratch.height);
        const backdropWidth = scratch.width * backdrop;
        const backdropHeight = scratch.height * backdrop;
        context.save();
        context.globalAlpha = 0.62;
        context.drawImage(
          scratch,
          (pixelWidth - backdropWidth) / 2,
          (pixelHeight - backdropHeight) / 2,
          backdropWidth,
          backdropHeight,
        );
        context.restore();
      }
      const zoom = Number.isFinite(section.fitScale) ? section.fitScale : 1;
      const contain = Math.min(pixelWidth / image.naturalWidth, pixelHeight / image.naturalHeight);
      paint(Math.min(cover, contain * zoom));
    } else {
      paint(cover);
    }

    section.lastFrame = index;
    section.canvas.dataset.frame = String(index);
  }

  function copyOpacity(progress, start, end) {
    const edge = Math.min(0.09, Math.max(0.025, (end - start) * 0.28));
    if (progress <= start || progress >= end) return 0;
    if (start <= 0 && progress < start + edge) return 1;
    if (progress < start + edge) return clamp((progress - start) / edge);
    if (progress > end - edge) return clamp((end - progress) / edge);
    return 1;
  }

  function updateCopy(section, progress) {
    if (Math.abs(section.lastCopyProgress - progress) < 0.0005) return;
    section.lastCopyProgress = progress;
    section.element.querySelectorAll('[data-scrub-copy]').forEach((copy) => {
      const start = Number(copy.dataset.in ?? 0);
      const end = Number(copy.dataset.out ?? 1);
      const opacity = reduced ? 1 : copyOpacity(progress, start, end);
      copy.style.opacity = String(opacity);
      copy.style.transform = `translate3d(0, ${(1 - opacity) * 24}px, 0)`;
      copy.style.pointerEvents = opacity > 0.6 ? 'auto' : 'none';
    });
  }

  let lastRender = 0;
  function render() {
    const now = performance.now();
    const dt = Math.min(0.05, lastRender ? (now - lastRender) / 1000 : 1 / 60);
    lastRender = now;
    for (const section of sections) {
      if (layoutDirty || section.offsetTop === undefined) {
        const rect = section.element.getBoundingClientRect();
        section.offsetTop = rect.top + window.scrollY;
        section.travel = Math.max(1, rect.height - window.innerHeight);
      }
      section.targetProgress = clamp((cachedScrollY - section.offsetTop) / section.travel);
      const delta = section.targetProgress - section.progress;
      const lerp = Number.isFinite(section.lerp) ? section.lerp : 0.085;
      // Eased toward scroll, but speed-capped (90 frames/s, rising with the distance so it catches up within
      // ~0.8 s) so a fast flick or scrollbar drag still shows every frame; jumps across half the film land directly.
      const step = Math.abs(delta) * (1 - Math.pow(1 - lerp, dt * 60));
      const cap = Math.max(90 / section.frameCount, Math.abs(delta) / 0.8) * dt;
      section.progress = reduced || Math.abs(delta) < 0.0001 || Math.abs(delta) > 0.5
        ? section.targetProgress
        : section.progress + Math.sign(delta) * Math.min(step, cap);
      const frame = reduced ? 0 : section.progress * (section.frameCount - 1);
      drawCover(section, frame);
      updateCopy(section, section.progress);
      section.onProgress?.(section.progress, section);
    }
    layoutDirty = false;
  }

  function loop(time) {
    if (!running) return;
    if (lenis) lenis.raf(time);
    render();
    rafId = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (running || document.hidden) return;
    running = true;
    rafId = requestAnimationFrame(loop);
  }

  function stopLoop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  function updateLoader() {
    const ratio = readyFrames ? Math.min(1, successful / readyFrames) : 1;
    const value = Math.round(ratio * 100);
    if (value === lastLoaderValue) return;
    lastLoaderValue = value;
    if (loaderBar) loaderBar.style.width = `${value}%`;
    if (loaderPct) loaderPct.textContent = `${value}%`;
  }

  function finish() {
    if (finished) return;
    finished = true;
    if (loaderBar) loaderBar.style.width = '100%';
    if (loaderPct) loaderPct.textContent = '100%';
    sections.forEach((section) => drawCover(section, 0, true));
    document.documentElement.classList.add('cinematic-ready');
    loader?.classList.add('is-done');
    window.setTimeout(() => loader?.remove(), 900);
    render();
    window.dispatchEvent(new CustomEvent('cinematic:ready'));
  }

  function preload() {
    if (!sections.length) {
      finish();
      return;
    }

    const queue = [];
    for (const section of sections) {
      const count = reduced ? 1 : section.frameCount;
      const queued = new Set();
      const enqueue = (index) => {
        if (index < 0 || index >= count || queued.has(index)) return;
        queued.add(index);
        queue.push([section, index]);
      };

      // Prioritize the opening sequence so the first visible movement is ready
      // before background refinement starts.
      for (let index = 0; index < Math.min(12, count); index += 1) enqueue(index);
      enqueue(count - 1);

      // Then span the whole timeline with increasingly dense checkpoints.
      for (let stride = 32; stride >= 1; stride = Math.floor(stride / 2)) {
        for (let index = 0; index < count; index += stride) enqueue(index);
        if (stride === 1) break;
      }
    }

    let cursor = 0;
    let active = 0;
    const requested = sections.reduce(
      (value, section) => (Number.isFinite(section.concurrency) ? section.concurrency : value),
      0,
    );
    const concurrency = requested > 0
      ? requested
      : Math.min(12, Math.max(4, Number(navigator.hardwareConcurrency) || 8));

    const pump = () => {
      while (active < concurrency && cursor < queue.length) {
        const [section, index] = queue[cursor++];
        active += 1;
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => {
          section.loaded += 1;
          if (index === 0) drawCover(section, 0, true);
          settle(true);
        };
        image.onerror = () => {
          section.failed += 1;
          settle(false);
        };
        image.src = source(section, index);
        section.images[index] = image;
      }
    };

    const settle = (ok) => {
      active -= 1;
      completed += 1;
      if (ok) successful += 1;
      updateLoader();

      // Readiness is based on decoded frames, never merely completed requests.
      // This prevents 404s/network failures from falsely unlocking a blank canvas.
      if (successful >= readyFrames) {
        finish();
      } else if (completed >= queue.length && active === 0) {
        // Graceful fallback: if some assets are permanently unavailable, do not
        // leave the page trapped behind the loader after every request has settled.
        finish();
      }

      if (cursor < queue.length) pump();
    };

    updateLoader();
    pump();
  }

  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.35 });
  }

  window.addEventListener('resize', () => {
    sections.forEach((section) => { section.lastFrame = -1; });
    layoutDirty = true;
  }, { passive: true });

  window.addEventListener('scroll', () => {
    cachedScrollY = window.scrollY;
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopLoop();
    else {
      cachedScrollY = window.scrollY;
      layoutDirty = true;
      startLoop();
    }
  });

  window.__scrollCinematic = {
    sections,
    render,
    state: () => sections.map((section) => ({
      element: section.selector || section.element.id,
      loaded: section.loaded,
      failed: section.failed,
      frame: section.lastFrame,
      progress: section.progress,
    })),
  };

  preload();
  startLoop();
})();