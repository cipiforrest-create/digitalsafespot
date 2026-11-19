// X Stage controller. The animation lives in /css/x-stage.css; this module only feeds it numbers:
// measured voice levels (--xs-in visitor, --xs-level assistant), a decaying pulse per streamed text
// chunk, pointer parallax and an offscreen pause so the loops never run while the stage is out of view.
import {voiceLabel,type VoiceState} from './voice-state';
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
class XStage{
 private input=0;private output=0;private pulse=0;private frame=0;private pointer=0;private px=0;private py=0;
 // Raw meter readings jump every audio frame; the stage eases toward them so the light swells instead of strobing.
 private inTarget=0;private outTarget=0;private ease=0;
 constructor(private root:HTMLElement,signal:AbortSignal){
  const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting)delete root.dataset.offscreen;else root.dataset.offscreen='';});observer.observe(root);
  if(matchMedia('(pointer:fine)').matches&&!reduced()){
   root.addEventListener('pointermove',event=>{this.px=Math.max(-1,Math.min(1,(event.clientX/innerWidth-.5)*2));this.py=Math.max(-1,Math.min(1,(event.clientY/innerHeight-.5)*2));this.pointer||=requestAnimationFrame(()=>{this.pointer=0;root.style.setProperty('--xs-px',this.px.toFixed(3));root.style.setProperty('--xs-py',this.py.toFixed(3));});},{signal,passive:true});
   root.addEventListener('pointerleave',()=>{root.style.setProperty('--xs-px','0');root.style.setProperty('--xs-py','0');},{signal});
  }
  signal.addEventListener('abort',()=>{observer.disconnect();cancelAnimationFrame(this.frame);cancelAnimationFrame(this.ease);cancelAnimationFrame(this.pointer);if(current===this)current=null;},{once:true});
 }
 private write(){const level=Math.max(this.output,this.pulse);this.root.style.setProperty('--xs-level',level.toFixed(3));this.root.style.setProperty('--xs-in',this.input.toFixed(3));}
 state(state:VoiceState){this.root.dataset.state=state;const status=this.root.querySelector('[data-x-status]');if(status)status.textContent=voiceLabel(state);if(!['speaking','listening','muted'].includes(state)){this.inTarget=this.outTarget=0;this.settle();}}
 voice(input:number,output:number){this.inTarget=Math.min(1,Math.max(0,input));this.outTarget=Math.min(1,Math.max(0,output));this.settle();}
 private settle(){if(reduced()){this.input=this.inTarget;this.output=this.outTarget;this.write();return;}this.ease||=requestAnimationFrame(this.step);}
 // Rises in ~150 ms, falls in ~400 ms; stops once it has reached the target.
 private step=()=>{const k=(v:number,t:number)=>v+(t-v)*(t>v?.2:.08);this.input=k(this.input,this.inTarget);this.output=k(this.output,this.outTarget);
  if(Math.abs(this.input-this.inTarget)<.004)this.input=this.inTarget;if(Math.abs(this.output-this.outTarget)<.004)this.output=this.outTarget;this.write();
  this.ease=this.input!==this.inTarget||this.output!==this.outTarget?requestAnimationFrame(this.step):0;};
 /** A streamed text chunk arrived: the X "speaks" it with a short, decaying flare. */
 chunk(){if(reduced())return;this.pulse=Math.min(.5,this.pulse+.12);if(!this.frame)this.frame=requestAnimationFrame(this.decay);}
 private decay=()=>{this.pulse*=.94;if(this.pulse<.015)this.pulse=0;this.write();this.frame=this.pulse?requestAnimationFrame(this.decay):0;};
}
let current:XStage|null=null;
export function mountXStage(signal:AbortSignal){const root=document.querySelector<HTMLElement>('[data-x-stage]');current=root?new XStage(root,signal):null;return current!==null;}
export function xStageState(state:VoiceState){current?.state(state);}
export function xStageVoice(input:number,output:number){current?.voice(input,output);}
export function xStageChunk(){current?.chunk();}
