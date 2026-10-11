import { cinematicConfig, createTimeline, advancePlayhead, renderStateAtPosition } from './config.js?v=handoff-v3';
import { FrameStore } from './FrameStore.js?v=handoff-v3';
import { CinematicCanvas } from './CinematicCanvas.js?v=handoff-v3';

const range = (start, end) => Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);

export class CinematicSequence {
  constructor(element) {
    this.element = element;
    this.stage = element.querySelector('.cinematic-stage');
    this.copy = element.querySelector('.hero-content');
    this.sceneNumber = element.querySelector('[data-scene-number]');
    this.media = matchMedia(`(max-width: ${cinematicConfig.mobileBreakpoint}px)`);
    this.motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.connection = navigator.connection;
    this.raf = 0;
    this.idleHandle = 0;
    this.idleUsesCallback = false;
    this.currentFrame = -1;
    this.boundUpdate = () => this.requestUpdate();
    this.boundConfigure = () => this.configure();
    this.boundResize = () => {
      this.measure();
      this.requestUpdate();
    };
    this.motion.addEventListener('change', this.boundConfigure);
    this.media.addEventListener('change', this.boundConfigure);
    this.connection?.addEventListener('change', this.boundConfigure);
    window.addEventListener('scroll', this.boundUpdate, { passive: true });
    window.addEventListener('resize', this.boundResize, { passive: true });
    window.addEventListener('pageshow', this.boundResize);
    this.layoutObserver = new ResizeObserver(this.boundResize);
    this.layoutObserver.observe(this.element);
    this.layoutObserver.observe(this.stage);
    this.configure();
  }

  configure() {
    this.cancelIdleWarm();
    this.renderer?.destroy();
    this.store?.abort();
    this.timeline = createTimeline(this.media.matches ? 'mobile' : 'desktop');
    this.staticMode = this.motion.matches || Boolean(this.connection?.saveData) || typeof createImageBitmap !== 'function';
    document.documentElement.classList.toggle('cinematic-enabled', !this.staticMode);
    this.element.classList.toggle('cinematic-static', this.staticMode);
    this.element.classList.toggle('cinematic-active', !this.staticMode);
    this.element.dataset.cinematicMode = this.staticMode ? 'static' : this.timeline.variant;
    this.currentFrame = -1;
    this.playhead = null;
    this.lastTimestamp = 0;
    this.planKey = '';
    this.lastScene = -1;
    this.lastOpacity = -1;
    this.copy.inert = false;

    if (this.staticMode) {
      this.element.style.setProperty('--cinematic-copy-opacity', '1');
      this.element.querySelector('canvas').classList.remove('is-ready');
      return;
    }

    this.store = new FrameStore(this.timeline, {
      onChange: details => {
        if (details.failed) this.planKey = '';
        this.requestUpdate();
      },
    });
    try {
      this.renderer = new CinematicCanvas(this.element.querySelector('canvas'), this.store);
    } catch {
      document.documentElement.classList.remove('cinematic-enabled');
      this.element.classList.add('cinematic-static');
      this.element.classList.remove('cinematic-active');
      this.staticMode = true;
      return;
    }

    this.measure();
    this.preloadHeroOpening();
    this.scheduleIdleHeroWarm();
    this.requestUpdate();
  }

  measure() {
    const top = parseFloat(getComputedStyle(this.stage).top) || 0;
    this.start = this.element.getBoundingClientRect().top + scrollY - top;
    this.distance = Math.max(1, this.element.offsetHeight - this.stage.offsetHeight);
    this.end = this.start + this.element.offsetHeight;
  }

  progress() {
    return Math.min(1, Math.max(0, (scrollY - this.start) / this.distance));
  }

  requestUpdate() {
    if (this.raf || this.staticMode) return;
    this.raf = requestAnimationFrame(time => {
      this.raf = 0;
      this.update(time);
    });
  }

  preloadHeroOpening() {
    const openingCount = cinematicConfig.heroOpeningFrames[this.timeline.variant];
    // Start frame 1 in its own pump so it cannot sit behind the rest of the
    // opening burst. The poster requests the same URL at high priority too.
    this.store.request(0, 0, true);
    this.store.pump();
    range(1, openingCount - 1).forEach(index => this.store.request(index, 0.25 + index / 100, true));
    this.store.pump();
  }

  heroFramesPending() {
    const hero = this.timeline.scenes[0];
    return range(hero.offset, hero.offset + hero.count - 1).filter(index => {
      const permanentlyFailed = this.store.failed.has(index) && (this.store.attempts.get(index) || 0) >= 2;
      return !permanentlyFailed && !this.store.fetched.has(index) && !this.store.active.has(index) && !this.store.queue.has(index);
    });
  }

  scheduleIdleHeroWarm(delay = 0) {
    if (this.staticMode || this.idleHandle) return;
    if (delay > 0) {
      this.idleUsesCallback = false;
      this.idleHandle = setTimeout(() => {
        this.idleHandle = 0;
        this.scheduleIdleHeroWarm();
      }, delay);
      return;
    }
    const run = () => {
      this.idleHandle = 0;
      if (this.staticMode || document.hidden) {
        this.scheduleIdleHeroWarm(1000);
        return;
      }
      const batchSize = cinematicConfig.idleWarmBatch[this.timeline.variant];
      const pending = this.heroFramesPending();
      // Never let speculative warming queue behind visible-frame work.
      if (this.store.active.size || this.store.queue.size) {
        this.scheduleIdleHeroWarm(this.timeline.variant === 'mobile' ? 700 : 350);
        return;
      }
      pending.slice(0, batchSize).forEach(index => this.store.request(index, 30, false));
      this.store.pump();
      if (pending.length > batchSize) this.scheduleIdleHeroWarm(this.timeline.variant === 'mobile' ? 700 : 350);
    };

    if (typeof requestIdleCallback === 'function') {
      this.idleUsesCallback = true;
      this.idleHandle = requestIdleCallback(run, { timeout: 1200 });
    } else {
      this.idleUsesCallback = false;
      this.idleHandle = setTimeout(run, 350);
    }
  }

  cancelIdleWarm() {
    if (!this.idleHandle) return;
    if (this.idleUsesCallback && typeof cancelIdleCallback === 'function') cancelIdleCallback(this.idleHandle);
    else clearTimeout(this.idleHandle);
    this.idleHandle = 0;
  }

  openingFramesForScene3(position) {
    const scene2 = this.timeline.scenes.find(scene => scene.id === cinematicConfig.transition.from);
    const scene3 = this.timeline.scenes.find(scene => scene.id === cinematicConfig.transition.to);
    if (!scene2 || !scene3) return [];
    const localProgress = (position - scene2.playbackStart) / (scene2.count - 1);
    if (localProgress < cinematicConfig.scene3PreloadAt[this.timeline.variant]) return [];
    const count = cinematicConfig.sceneOpeningFrames[this.timeline.variant];
    return range(scene3.offset, scene3.offset + count - 1);
  }

  nearbyFrames(layer, transitioning) {
    const scene = this.timeline.scenes[layer.sceneIndex];
    const radius = transitioning
      ? this.timeline.variant === 'mobile' ? 5 : 8
      : this.timeline.variant === 'mobile' ? 7 : 12;
    const center = Math.floor(layer.assetPosition);
    return range(
      Math.max(scene.offset, center - radius),
      Math.min(scene.offset + scene.count - 1, center + radius),
    );
  }

  plan(position, target, state) {
    const targetState = renderStateAtPosition(this.timeline, target);
    const stateIndices = state.layers.flatMap(layer => [layer.from, layer.to]);
    const landing = targetState.layers.flatMap(layer => [layer.from, layer.to]);
    const nearby = [...new Set(state.layers.flatMap(layer => this.nearbyFrames(layer, Boolean(state.transition))))];
    const scene3Opening = this.openingFramesForScene3(position);
    const key = `${stateIndices.join(',')}:${landing.join(',')}:${scene3Opening.length}`;
    if (key === this.planKey) return;
    this.planKey = key;

    const protectedFrames = [...new Set([
      ...nearby,
      ...scene3Opening,
      ...landing,
      ...stateIndices,
      this.renderer.lastIndex,
    ].filter(index => index >= 0))];
    this.store.beginPlan(stateIndices[0], protectedFrames);
    stateIndices.forEach(index => this.store.request(index, 0, true));
    nearby
      .sort((a, b) => Math.min(...state.layers.map(layer => Math.abs(a - layer.assetPosition))) - Math.min(...state.layers.map(layer => Math.abs(b - layer.assetPosition))))
      .forEach(index => this.store.request(index, 1, true));
    landing.forEach(index => this.store.request(index, 1.5, true));
    scene3Opening.forEach((index, order) => this.store.request(index, 0.8 + order / 100, true));
    this.store.pump();
  }

  withNearestFallback(state) {
    return {
      ...state,
      layers: state.layers.map(layer => {
        if (this.store.has(layer.from) || this.store.has(layer.to)) return layer;
        const scene = this.timeline.scenes[layer.sceneIndex];
        const nearest = this.store.nearest(
          layer.assetPosition,
          Math.max(scene.offset, Math.floor(layer.assetPosition) - 2),
          Math.min(scene.offset + scene.count - 1, Math.ceil(layer.assetPosition) + 2),
        );
        return nearest < 0 ? layer : { ...layer, from: nearest, to: nearest, alpha: 0 };
      }),
    };
  }

  update(time=performance.now()) {
    if (this.staticMode) return;
    if (scrollY > this.end || scrollY + innerHeight * 2 < this.start) {
      this.store.queue.clear();
      this.planKey = '';
      this.playhead = null;
      return;
    }
    const progress = this.progress();
    const target = progress * (this.timeline.playbackCount - 1);
    const elapsed = this.lastTimestamp ? time - this.lastTimestamp : 16.67;
    this.lastTimestamp = time;
    this.playhead = advancePlayhead(this.playhead, target, elapsed);
    const position = this.playhead;
    const state = renderStateAtPosition(this.timeline, position);
    this.plan(position, target, state);
    if (this.renderer.draw(this.withNearestFallback(state))) this.currentFrame = this.renderer.lastIndex;

    this.element.dataset.targetFrame = String(Math.round(target));
    this.element.dataset.drawnFrame = String(this.currentFrame);
    this.element.dataset.playhead = position.toFixed(3);
    this.element.dataset.progress = progress.toFixed(4);
    this.element.dataset.transition = state.transition ? state.transition.alpha.toFixed(3) : '';
    if (state.sceneIndex !== this.lastScene) {
      this.element.dataset.scene = String(state.sceneIndex + 1);
      this.sceneNumber.textContent = String(state.sceneIndex + 1).padStart(2, '0');
      this.lastScene = state.sceneIndex;
    }

    const visualProgress = position / (this.timeline.playbackCount - 1);
    const opacity = visualProgress < 0.1
      ? 1
      : visualProgress < 0.18
        ? 1 - (visualProgress - 0.1) / 0.08
        : visualProgress > 0.96
          ? (visualProgress - 0.96) / 0.04
          : 0;
    const rounded = Math.round(opacity * 1000) / 1000;
    if (rounded !== this.lastOpacity) {
      this.element.style.setProperty('--cinematic-copy-opacity', String(rounded));
      this.copy.inert = rounded < 0.05;
      this.lastOpacity = rounded;
    }
    // Draw fractional frames at display refresh rate only while moving.
    // No perpetual animation loop, autoplay, or time-driven progress when idle.
    if (this.playhead !== target) this.requestUpdate();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.cancelIdleWarm();
    this.renderer?.destroy();
    this.store?.abort();
    this.layoutObserver.disconnect();
    window.removeEventListener('scroll', this.boundUpdate);
    window.removeEventListener('resize', this.boundResize);
    window.removeEventListener('pageshow', this.boundResize);
    this.media.removeEventListener('change', this.boundConfigure);
    this.motion.removeEventListener('change', this.boundConfigure);
    this.connection?.removeEventListener('change', this.boundConfigure);
  }
}


