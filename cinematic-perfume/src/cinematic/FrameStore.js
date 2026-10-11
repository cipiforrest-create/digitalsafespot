// One scheduler bounds fetch + decode concurrency across the entire timeline.
// Compressed frames and decoded bitmaps have separate caches and budgets.
export class FrameStore {
  constructor(timeline, { onChange = () => {} } = {}) {
    this.timeline = timeline;
    this.onChange = onChange;
    this.concurrency = timeline.variant === 'mobile' ? 4 : 6;
    this.maxDecoded = timeline.variant === 'mobile' ? 36 : 48;
    this.maxBytes = (timeline.variant === 'mobile' ? 16 : 36) * 1024 * 1024;
    this.bitmaps = new Map(); this.blobs = new Map(); this.bytes = 0;
    this.queue = new Map(); this.active = new Map(); this.attempts = new Map();
    this.fetched = new Set(); this.failed = new Set(); this.protected = new Set();
    this.target = 0; this.pin = -1; this.aborted = false;
    this.peakActive = 0; this.peakDecoded = 0;
  }
  has(index) { return this.bitmaps.has(index); }
  get(index) { return this.bitmaps.get(index); }
  beginPlan(target, protectedIndices) {
    this.target = target; this.protected = new Set(protectedIndices);
    this.queue.clear();
  }
  request(index, priority = 10, decode = false) {
    if (this.aborted || index < 0 || index >= this.timeline.count || this.has(index)) return;
    if (!decode && (this.blobs.has(index) || this.fetched.has(index))) return;
    if ((this.attempts.get(index) || 0) >= 2 && this.failed.has(index)) return;
    const existing = this.active.get(index) || this.queue.get(index);
    if (existing) { existing.priority = Math.min(existing.priority, priority); existing.decode ||= decode; return; }
    this.queue.set(index, { index, priority, decode });
  }
  pump() {
    if (this.aborted) return;
    while (this.active.size < this.concurrency && this.queue.size) {
      const job = [...this.queue.values()].sort((a,b) => a.priority-b.priority)[0];
      this.queue.delete(job.index); this.active.set(job.index, job);
      this.peakActive = Math.max(this.peakActive, this.active.size);
      this.run(job);
    }
  }
  async run(job) {
    const {index} = job;
    const controller = new AbortController(); job.controller = controller;
    try {
      let blob = this.blobs.get(index);
      if (!blob) {
        this.attempts.set(index, (this.attempts.get(index) || 0) + 1);
        const response = await fetch(this.timeline.path(index), {signal:controller.signal, priority:job.priority <= 1 ? 'high' : 'low'});
        if (!response.ok) throw new Error(`Frame HTTP ${response.status}`);
        blob = await response.blob();
        if (this.aborted) return;
        this.blobs.set(index,blob); this.bytes += blob.size; this.fetched.add(index);
      }
      if (job.decode) {
        const bitmap = await createImageBitmap(blob);
        if (this.aborted) { bitmap.close(); return; }
        this.bitmaps.set(index, bitmap);
      }
      this.failed.delete(index);
      this.prune();
    } catch (error) {
      if (error.name !== 'AbortError') { this.failed.add(index); const bad=this.blobs.get(index); if(bad){this.bytes-=bad.size;this.blobs.delete(index);} }
    } finally {
      this.active.delete(index);
      if (!this.aborted) { this.onChange({index,failed:this.failed.has(index)}); this.pump(); }
    }
  }
  prune() {
    const distant = [...this.bitmaps.keys()].filter(i=>i !== this.pin && !this.protected.has(i)).sort((a,b)=>Math.abs(b-this.target)-Math.abs(a-this.target));
    while(this.bitmaps.size > this.maxDecoded && distant.length) {
      const key = distant.shift(); this.bitmaps.get(key).close(); this.bitmaps.delete(key);
    }
    this.peakDecoded = Math.max(this.peakDecoded, this.bitmaps.size);
    for (const [index,blob] of this.blobs) {
      if (this.bytes <= this.maxBytes) break;
      if (this.protected.has(index) || index === this.pin || this.active.has(index)) continue;
      this.bytes -= blob.size; this.blobs.delete(index);
    }
  }
  nearest(target, start, end) {
    let nearest = -1; let distance = Infinity;
    for (const index of this.bitmaps.keys()) {
      if (index < start || index > end) continue;
      if (Math.abs(index-target) < distance) { nearest=index; distance=Math.abs(index-target); }
    }
    return nearest;
  }
  abort() {
    this.aborted=true; this.queue.clear();
    for(const job of this.active.values()) job.controller?.abort();
    for(const image of this.bitmaps.values()) image.close();
    this.bitmaps.clear(); this.blobs.clear(); this.bytes=0;
  }
}


