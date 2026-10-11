// Weighted box integration keeps fractional sample boundaries at 44.1 and 48 kHz.
class ConciergePCM extends AudioWorkletProcessor {
  constructor() { super(); this.buffer = new Int16Array(640); this.index = 0; this.phase = 0; this.sum = 0; this.count = 0; }
  process(inputs) {
    const samples = inputs[0]?.[0]; if (!samples) return true;
    const ratio = sampleRate / 16000;
    for (const sample of samples) {
      let remaining = 1;
      while (remaining > 1e-9) {
        const portion = Math.min(remaining, ratio - this.phase);
        this.sum += sample * portion; this.phase += portion; remaining -= portion;
        if (this.phase < ratio - 1e-9) continue;
        const value = Math.max(-1, Math.min(1, this.sum / ratio));
        this.buffer[this.index++] = Math.round(value * (value < 0 ? 32768 : 32767));
        this.phase = 0; this.sum = 0;
        if (this.index === this.buffer.length) { this.port.postMessage(this.buffer.buffer, [this.buffer.buffer]); this.buffer = new Int16Array(640); this.index = 0; }
      }
    }
    return true;
  }
}
registerProcessor('concierge-pcm', ConciergePCM);
