import {tourStops,type TourStopId} from '../shared/tour';
import {navigate} from './navigation';
type Options={minimize:()=>void;narrate:(id:TourStopId)=>Promise<void>;canAdvance:()=>boolean};
export class WebsiteTour{
 private index=-1;private paused=false;private timer=0;private moving=false;private generation=0;
 constructor(private options:Options){
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.pause();});
  window.addEventListener('pagehide',()=>this.stop());
 }
 get step():TourStopId|undefined{return this.index<0?undefined:tourStops[this.index].id;}
 get active(){return this.index>=0;}
 caption(value:string){const node=document.getElementById('tour-caption');if(node&&this.active)node.textContent=value.replace(/\*\*/g,'').slice(0,260)+(value.length>260?'…':'');}
 private render(){const bar=document.getElementById('tour-bar');if(!bar)return;bar.hidden=!this.active;if(!this.active)return;document.getElementById('tour-label')!.textContent=`${this.index+1}/${tourStops.length} · ${tourStops[this.index].title}${this.paused?' · pauzirano':''}`;const b=bar.querySelector<HTMLElement>('[data-tour-action="pause"],[data-tour-action="resume"]');if(b){b.dataset.tourAction=this.paused?'resume':'pause';b.textContent=this.paused?'Nastavi':'Pauza';}}
 async action(action:string,fromModel=false){if(['start','next','resume'].includes(action)&&document.querySelector('dialog[open]')){this.pause();return false;}if(action==='stop'){this.stop();return true;}if(action==='pause'){this.pause();return this.active;}if(action==='resume'){if(!this.active)return false;return this.move(!fromModel);}if(action==='start'){this.stop();this.index=0;return this.move(false);}if(action==='next')return this.next(!fromModel,fromModel);return false;}
 private async move(narrate:boolean){if(this.moving||!this.active||document.querySelector('dialog[open]')){this.pause();return false;}this.moving=true;clearTimeout(this.timer);const version=this.generation,stop=tourStops[this.index];
  try{this.options.minimize();if(!await navigate(stop.page))throw new Error('navigation');if(version!==this.generation)return false;
   // Navigation mounts page effects asynchronously; the registered page is already in the DOM.
   await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));if(version!==this.generation)return false;
   // Stops show service content only: a named section, otherwise the page heading. Never a film chapter.
   if('section'in stop)document.getElementById(stop.section)?.scrollIntoView({behavior:'smooth',block:'start'});
   this.paused=false;this.render();if(narrate)await this.options.narrate(stop.id);return true;
  }catch{this.pause();return false;}finally{this.moving=false;}
 }
 private async next(narrate=true,fromModel=false){if(!this.active||this.moving)return false;if(!fromModel&&!this.options.canAdvance()){this.pause();return false;}if(this.index===tourStops.length-1){this.stop();return true;}this.index++;return this.move(narrate);}
 completed(){clearTimeout(this.timer);if(!this.active||this.paused||document.hidden)return;this.timer=window.setTimeout(()=>{if(this.options.canAdvance())void this.next();else this.pause();},10000);}
 pause(){clearTimeout(this.timer);if(!this.active)return;this.generation++;this.paused=true;this.render();}
 stop(){clearTimeout(this.timer);this.generation++;this.index=-1;this.paused=false;this.render();}
}
