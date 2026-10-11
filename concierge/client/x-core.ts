type State={name:string;start:number;end:number;transition:string;scale:number;anchor:number[]};
export function frameAt(states:readonly State[],progress:number){
 const p=Math.max(0,Math.min(1,progress));
 const index=Math.max(0,states.findIndex(s=>p<s.end));
 const i=p===1?states.length-1:index,s=states[i];
 const local=(p-s.start)/(s.end-s.start);
 return {index:i,next:Math.min(i+1,states.length-1),mix:Math.max(0,Math.min(1,(local-.65)/.35))};
}
export function mountXCore(section:HTMLElement,signal:AbortSignal){
 const canvas=section.querySelector('canvas')!,ctx=canvas.getContext('2d');
 if(!ctx)return;
 const states:State[]=JSON.parse(section.dataset.xManifest||'[]');if(states.length!==15)return;
 const copies=[...section.querySelectorAll<HTMLElement>('[data-x-copy]')];
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),mobile=matchMedia('(max-width:720px)');
 const images=new Map<number,ImageBitmap>(),pending=new Map<number,AbortController>(),failed=new Set<number>();
 let raf=0,visible=false,width=0,height=0,bucket=0,last=0,stopped=false,generation=0,lastProgress=0;
 const limit=()=>mobile.matches?4:6;
 function clear(){generation++;pending.forEach(c=>c.abort());pending.clear();images.forEach(b=>b.close());images.clear();failed.clear();section.removeAttribute('data-ready');}
 function schedule(){if(!raf&&!stopped&&visible&&!reduced.matches&&!document.hidden)raf=requestAnimationFrame(render);}
 function request(index:number){
  if(images.has(index)||pending.has(index)||failed.has(index)||pending.size>=2||stopped)return;
  const c=new AbortController(),version=generation;pending.set(index,c);
  void fetch(`/ai-concierge-preview/media/x-core-v1/${states[index].name}-${bucket}.webp`,{signal:c.signal})
   .then(r=>{if(!r.ok)throw new Error('Image unavailable');return r.blob();}).then(b=>createImageBitmap(b))
   .then(bitmap=>{if(stopped||version!==generation||c.signal.aborted){bitmap.close();return;}images.set(index,bitmap);
    while(images.size>limit()){const victim=[...images.keys()].sort((a,b)=>Math.abs(b-last)-Math.abs(a-last))[0];images.get(victim)!.close();images.delete(victim);}
   }).catch(()=>{if(!c.signal.aborted)failed.add(index);}).finally(()=>{if(pending.get(index)===c)pending.delete(index);schedule();});
 }
 function draw(index:number,alpha:number,zoom:number){
  const bitmap=images.get(index);if(!bitmap)return;
  if(mobile.matches&&index===0){
   const ratio=bitmap.width/1672,sw=630*ratio,sh=640*ratio,fit=Math.min(width/sw,height/sh)*.94;
   ctx!.globalAlpha=alpha;ctx!.drawImage(bitmap,565*ratio,105*ratio,sw,sh,(width-sw*fit)/2,(height-sh*fit)/2,sw*fit,sh*fit);ctx!.globalAlpha=1;return;
  }
  const fit=Math.min(width/bitmap.width,height/bitmap.height),w=bitmap.width*fit*zoom,h=bitmap.height*fit*zoom;
  // Keep the complete wide composition on phones; desktop leaves copy on the left.
  const x=mobile.matches?(width-w)/2:(width-w)*states[index].anchor[0]+width*.12;
  ctx!.globalAlpha=alpha;ctx!.drawImage(bitmap,x,(height-h)/2,w,h);ctx!.globalAlpha=1;
 }
 function render(){
  raf=0;if(stopped||reduced.matches)return;
  const rect=section.getBoundingClientRect(),travel=section.offsetHeight-section.querySelector<HTMLElement>('.x-core-sticky')!.offsetHeight;
  const progress=Math.max(0,Math.min(1,-rect.top/Math.max(1,travel))),f=frameAt(states,progress);last=f.index;
  lastProgress=progress;section.style.setProperty('--x-progress',String(progress));section.dataset.xFrame=String(f.index+1);
  let active=0;copies.forEach((c,i)=>{if(progress>=Number(c.dataset.xCopy))active=i;});
  copies.forEach((c,i)=>{c.hidden=i!==active;});
  section.querySelectorAll<HTMLElement>('nav [data-x-seek]').forEach(a=>{a.setAttribute('aria-current',String(Number(a.dataset.xSeek)===Number(copies[active].dataset.xCopy)));});
  const wanted=[f.index,f.next,Math.max(0,f.index-1),Math.min(14,f.next+1)];
  pending.forEach((c,i)=>{if(!wanted.includes(i)){c.abort();pending.delete(i);}});
  wanted.forEach(request);
  if(!images.size)return;
  ctx!.clearRect(0,0,width,height);ctx!.fillStyle='#000';ctx!.fillRect(0,0,width,height);
  const nearest=images.has(f.index)?f.index:[...images.keys()].sort((a,b)=>Math.abs(a-f.index)-Math.abs(b-f.index))[0];
  const zoom=mobile.matches?1:1+(states[f.index].scale-1)*f.mix;
  draw(nearest,1,zoom);
  if(images.has(f.next)&&f.next!==f.index){
   const t=f.mix*f.mix*(3-2*f.mix);draw(f.next,t,1);
   if(!mobile.matches&&states[f.index].transition!=='fade'){
    ctx!.fillStyle=states[f.index].transition==='dark'?`rgba(0,0,0,${Math.sin(t*Math.PI)*.55})`:`rgba(255,255,255,${Math.sin(t*Math.PI)*.09})`;
    ctx!.fillRect(0,0,width,height);
   }
  }
  section.dataset.ready='';section.dataset.xDecoded=String(images.size);
 }
 function resize(){
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);
  width=Math.max(1,Math.round(rect.width*dpr));height=Math.max(1,Math.round(rect.height*dpr));canvas.width=width;canvas.height=height;
  const next=mobile.matches?640:width<=1200?1024:1672;if(next!==bucket){bucket=next;clear();}schedule();
 }
 function mode(){
  section.toggleAttribute('data-enhanced',!reduced.matches);
  copies.forEach(c=>c.hidden=false);
  if(reduced.matches){cancelAnimationFrame(raf);raf=0;clear();}else resize();
 }
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){resize();schedule();}else{cancelAnimationFrame(raf);raf=0;}},{rootMargin:'600px'});observer.observe(section);
 const resizer=new ResizeObserver(resize);resizer.observe(canvas);
 window.addEventListener('scroll',schedule,{passive:true,signal});
 window.addEventListener('resize',()=>{
  if(lastProgress>0&&lastProgress<1&&!reduced.matches){
   const top=section.getBoundingClientRect().top+scrollY,travel=section.offsetHeight-section.querySelector<HTMLElement>('.x-core-sticky')!.offsetHeight;
   window.scrollTo({top:top+lastProgress*travel,behavior:'instant'});
  }resize();
 },{signal});
 document.addEventListener('visibilitychange',schedule,{signal});
 reduced.addEventListener('change',mode,{signal});
 section.querySelectorAll<HTMLAnchorElement>('[data-x-seek]').forEach(a=>a.addEventListener('click',e=>{
  if(reduced.matches)return;e.preventDefault();e.stopPropagation();
  const p=Number(a.dataset.xSeek),travel=section.offsetHeight-section.querySelector<HTMLElement>('.x-core-sticky')!.offsetHeight;
  window.scrollTo({top:window.scrollY+section.getBoundingClientRect().top+p*travel+1,behavior:'instant'});
  render();const target=document.getElementById(a.hash.slice(1));target?.setAttribute('tabindex','-1');target?.focus({preventScroll:true});
 },{signal}));
 section.querySelector('.x-core-skip')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const next=document.getElementById('cinematic');next?.setAttribute('tabindex','-1');next?.focus({preventScroll:true});next?.scrollIntoView({behavior:'instant'});},{signal});
 signal.addEventListener('abort',()=>{stopped=true;cancelAnimationFrame(raf);observer.disconnect();resizer.disconnect();clear();copies.forEach(c=>c.hidden=false);section.removeAttribute('data-enhanced');},{once:true});
 mode();
}
