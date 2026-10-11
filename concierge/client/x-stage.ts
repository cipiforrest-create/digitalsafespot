// X Stage controller. The animation lives in /css/x-stage.css; this module only feeds it numbers:
// measured voice levels (--xs-in visitor, --xs-level assistant), a decaying pulse per streamed text
// chunk, pointer parallax and an offscreen pause so the loops never run while the stage is out of view.
import {voiceLabel,type VoiceState} from './voice-state';
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
class XStage{
 private input=0;private output=0;private pulse=0;private frame=0;private pointer=0;private px=0;private py=0;
 constructor(private root:HTMLElement,signal:AbortSignal){
  const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting)delete root.dataset.offscreen;else root.dataset.offscreen='';});observer.observe(root);
  if(matchMedia('(pointer:fine)').matches&&!reduced()){
   root.addEventListener('pointermove',event=>{this.px=Math.max(-1,Math.min(1,(event.clientX/innerWidth-.5)*2));this.py=Math.max(-1,Math.min(1,(event.clientY/innerHeight-.5)*2));this.pointer||=requestAnimationFrame(()=>{this.pointer=0;root.style.setProperty('--xs-px',this.px.toFixed(3));root.style.setProperty('--xs-py',this.py.toFixed(3));});},{signal,passive:true});
   root.addEventListener('pointerleave',()=>{root.style.setProperty('--xs-px','0');root.style.setProperty('--xs-py','0');},{signal});
  }
  signal.addEventListener('abort',()=>{observer.disconnect();cancelAnimationFrame(this.frame);cancelAnimationFrame(this.pointer);if(current===this)current=null;},{once:true});
 }
 private write(){const level=Math.max(this.output,this.pulse);this.root.style.setProperty('--xs-level',level.toFixed(3));this.root.style.setProperty('--xs-in',this.input.toFixed(3));}
 state(state:VoiceState){this.root.dataset.state=state;const status=this.root.querySelector('[data-x-status]');if(status)status.textContent=voiceLabel(state);if(!['speaking','listening','muted'].includes(state)&&!this.pulse){this.input=this.output=0;this.write();}}
 voice(input:number,output:number){this.input=input;this.output=output;this.write();}
 /** A streamed text chunk arrived: the X "speaks" it with a short, decaying flare. */
 chunk(){if(reduced())return;this.pulse=Math.min(1,this.pulse+.45);if(!this.frame)this.frame=requestAnimationFrame(this.decay);}
 private decay=()=>{this.pulse*=.9;if(this.pulse<.015)this.pulse=0;this.write();this.frame=this.pulse?requestAnimationFrame(this.decay):0;};
}
let current:XStage|null=null;
export function mountXStage(signal:AbortSignal){const root=document.querySelector<HTMLElement>('[data-x-stage]');current=root?new XStage(root,signal):null;return current!==null;}
export function xStageState(state:VoiceState){current?.state(state);}
export function xStageVoice(input:number,output:number){current?.voice(input,output);}
export function xStageChunk(){current?.chunk();}
