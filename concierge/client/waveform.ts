import { rms } from './voice-state';
export class Waveform {
  private input: AnalyserNode | null = null; private output: AnalyserNode | null = null;
  /** Receives the measured visitor and assistant levels (0..1) on every frame. */
  onLevel: ((input:number,output:number)=>void) | null = null;
  private frame = 0; private amplitude = 0; private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(private canvas: HTMLCanvasElement | null) { this.draw(); }
  attach(canvas:HTMLCanvasElement|null){this.canvas=canvas;this.resume();}
  set(input: AnalyserNode | null, output: AnalyserNode | null) { this.input = input; this.output = output; cancelAnimationFrame(this.frame); this.draw(); }
  private draw = () => {
    if(!this.canvas)return;const ctx = this.canvas.getContext('2d'); if (!ctx) return;
    const levels = [this.input,this.output].map(analyser => { if (!analyser) return 0; const data = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(data); return rms(data); });
    const level = Math.max(...levels); this.onLevel?.(Math.min(1,levels[0]*6),Math.min(1,levels[1]*6));
    this.amplitude += (Math.min(1,level*6)-this.amplitude)*.24;
    const width = this.canvas.width, mid = this.canvas.height/2; ctx.clearRect(0,0,width,this.canvas.height);
    const active = Boolean(this.input || this.output); const strength = active ? this.amplitude : .11;
    ctx.strokeStyle = active ? '#c5dfff' : '#b4d6fc90'; ctx.shadowColor = '#9ac4ff'; ctx.shadowBlur = this.reduced ? 0 : 12; ctx.lineWidth = 2;
    // Idle shape is decorative and static; during a session its height follows measured audio only.
    for (let x=40;x<width-40;x+=12) {
      const distance = Math.abs(x-width/2)/(width/2); const envelope = Math.exp(-Math.pow((distance-.34)*5,2));
      const height = active ? (2 + strength*mid*.85*envelope*(.35+.65*Math.abs(Math.sin(x*.018)) )) : (1 + 29*envelope*Math.abs(Math.sin(x*.07)));
      ctx.globalAlpha = .12 + Math.max(0,1-distance)*.75; ctx.beginPath(); ctx.moveTo(x,mid-height); ctx.lineTo(x,mid+height); ctx.stroke();
    }
    ctx.globalAlpha=.22;ctx.beginPath();ctx.moveTo(10,mid);ctx.lineTo(width-10,mid);ctx.stroke();ctx.globalAlpha=1;
    if (active && !document.hidden) this.frame=requestAnimationFrame(this.draw);
  };
  resume() { cancelAnimationFrame(this.frame); this.draw(); }
}
