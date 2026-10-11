export class CinematicCanvas {
  constructor(canvas, store) {
    this.canvas = canvas;
    this.store = store;
    this.context = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!this.context) throw new Error('Canvas unavailable');
    this.lastState = null;
    this.lastIndex = -1;
    this.signature = '';
    this.needsResize = true;
    this.drawCount = 0;
    this.observer = new ResizeObserver(() => {
      this.needsResize = true;
      this.resize();
    });
    this.observer.observe(canvas);
  }

  cover(image, { alpha = 1, scale = 1, brightness = 1 } = {}) {
    const { width, height } = this.canvas;
    const coverScale = Math.max(width / image.width, height / image.height) * scale;
    const drawWidth = image.width * coverScale;
    const drawHeight = image.height * coverScale;
    this.context.save();
    this.context.globalAlpha = alpha;
    this.context.filter = `brightness(${brightness})`;
    this.context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    this.context.restore();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const factor = Math.min(1, Math.sqrt((2560 * 1440) / Math.max(1, rect.width * rect.height * dpr * dpr)));
    const width = Math.max(1, Math.round(rect.width * dpr * factor));
    const height = Math.max(1, Math.round(rect.height * dpr * factor));
    this.needsResize = false;
    if (this.canvas.width === width && this.canvas.height === height) return;
    this.canvas.width = width;
    this.canvas.height = height;
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';
    this.signature = '';
    if (this.lastState) this.paint(this.lastState, true);
  }

  resolveLayer(layer, preferNearest = false) {
    const from = this.store.get(layer.from);
    const to = this.store.get(layer.to);
    if (!from && !to) return null;
    if (!from) return { base: to, baseIndex: layer.to, blend: null, blendIndex: -1, blendAlpha: 0 };
    if (!to || layer.from === layer.to) return { base: from, baseIndex: layer.from, blend: null, blendIndex: -1, blendAlpha: 0 };
    if (preferNearest) {
      return layer.alpha < 0.5
        ? { base: from, baseIndex: layer.from, blend: null, blendIndex: -1, blendAlpha: 0 }
        : { base: to, baseIndex: layer.to, blend: null, blendIndex: -1, blendAlpha: 0 };
    }
    return { base: from, baseIndex: layer.from, blend: to, blendIndex: layer.to, blendAlpha: layer.alpha };
  }

  paint(state, force = false) {
    const transitioning = Boolean(state.transition);
    const outgoing = this.resolveLayer(state.layers[0], transitioning);
    const incoming = transitioning ? this.resolveLayer(state.layers[1], true) : null;
    if (!outgoing && !incoming) return false;

    const signature = [
      outgoing?.baseIndex ?? -1,
      outgoing?.blendIndex ?? -1,
      outgoing?.blendAlpha.toFixed(4) ?? '0',
      incoming?.baseIndex ?? -1,
      state.transition?.alpha.toFixed(4) ?? '0',
      ...state.layers.flatMap(layer => [layer.scale.toFixed(4), layer.brightness.toFixed(4)]),
    ].join(':');
    if (!force && signature === this.signature && !this.needsResize) return true;

    if (outgoing) {
      const visual = state.layers[0];
      // Start each composite from an opaque image. The incoming source-over
      // alpha supplies the complementary outgoing fade without accumulating
      // translucent frames from earlier paints.
      this.cover(outgoing.base, { ...visual, alpha: 1 });
      if (outgoing.blend && outgoing.blendAlpha > 0) {
        this.cover(outgoing.blend, { ...visual, alpha: outgoing.blendAlpha });
      }
    }

    if (incoming) {
      const visual = state.layers[1];
      // Incoming alpha over an opaque outgoing frame gives complementary
      // scene weights. Without outgoing media, paint incoming opaquely rather
      // than exposing a cleared canvas after a deep-link reload.
      this.cover(incoming.base, { ...visual, alpha: outgoing ? state.transition.alpha : 1 });
    }

    const displayed = incoming && state.transition.alpha >= 0.5 ? incoming : outgoing || incoming;
    this.lastIndex = displayed.baseIndex;
    this.store.pin = this.lastIndex;
    this.signature = signature;
    this.drawCount += 1;
    this.canvas.classList.add('is-ready');
    return true;
  }

  draw(state) {
    if (this.needsResize) this.resize();
    if (!this.paint(state)) return false;
    this.lastState = state;
    return true;
  }

  destroy() {
    this.observer.disconnect();
    this.lastState = null;
  }
}
