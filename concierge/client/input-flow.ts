// Drop current microphone frames while the connection drains; never queue stale speech.
export class InputFlow {
  private blockedAt: number | null = null;
  get paused() { return this.blockedAt !== null; }
  next(bufferedBytes: number, now: number): 'send' | 'pause' | 'resume' | 'timeout' {
    if (this.blockedAt === null) {
      if (bufferedBytes < 48000) return 'send';
      this.blockedAt = now;
    }
    if (now - this.blockedAt >= 10000) return 'timeout';
    if (bufferedBytes <= 8000) { this.blockedAt = null; return 'resume'; }
    return 'pause';
  }
}
