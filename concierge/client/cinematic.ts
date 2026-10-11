// Production journey frames/pacing; compressed preload, bounded decoding, fractional blending.
export function mountCinematic(section:HTMLElement,signal:AbortSignal){
 const canvas=section.querySelector<HTMLCanvasElement>('canvas')!,ctx=canvas.getContext('2d'),slider=section.querySelector<HTMLInputElement>('input')!;
 if(!ctx)return;
 const small=matchMedia('(max-width:720px)').matches,count=small?180:360,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const blobs=new Map<number,Blob>(),decoded=new Map<number,ImageBitmap>(),decoding=new Set<number>();
 const coarse=new Set(Array.from({length:24},(_,i)=>Math.round(i*(count-1)/23)));
 // Fetch order: 24 evenly spaced keyframes first, then whatever lies nearest the playhead (ahead of it first).
 const pendingFetch=new Set(Array.from({length:count},(_,i)=>i));
 function nextFetch(){for(const i of coarse)if(pendingFetch.has(i)){pendingFetch.delete(i);return i;}const at=playhead*(count-1);let best=-1,score=Infinity;for(const i of pendingFetch){const s=i>=at-1?i-at:(at-i)*3;if(s<score){score=s;best=i;}}if(best>=0)pendingFetch.delete(best);return best;}
 let alive=true,started=false,visible=false,raf=0,playhead=0,target=0,last=0,manual=false,drawn=-1,revision=0,drawRevision=-1,uiAt=0,workersDone=0,shown=-1,heading=1;
 const clamp=(v:number)=>Math.max(0,Math.min(1,v));
 const status=section.querySelector<HTMLElement>('[data-film-loading]');
 function decode(index:number){
  const blob=blobs.get(index);if(!alive||!blob||decoded.has(index)||decoding.has(index)||decoding.size>=6)return;
  decoding.add(index);void createImageBitmap(blob).then(image=>{if(!alive){image.close();return;}decoded.set(index,image);revision++;
   if(decoded.size>42){const removable=[...decoded.keys()].filter(k=>!coarse.has(k)&&k!==shown).sort((a,b)=>Math.abs(b-playhead*(count-1))-Math.abs(a-playhead*(count-1)));while(decoded.size>42&&removable.length){const k=removable.shift()!;decoded.get(k)?.close();decoded.delete(k);}}
   wake();
  }).catch(()=>{/* Keep available frames/poster. */}).finally(()=>decoding.delete(index));
 }
 async function worker(){while(alive&&pendingFetch.size){const index=nextFetch();if(index<0)break;try{const response=await fetch(`/media/frames/journey/r2/${small?'sm':'lg'}/frame_${String(index+1).padStart(4,'0')}.webp`,{signal,cache:'force-cache'});if(!response.ok)continue;const blob=await response.blob();if(!alive)return;blobs.set(index,blob);if(coarse.has(index)||Math.abs(index-playhead*(count-1))<8)decode(index);if(status)status.textContent=blobs.size===count?'Film spreman':`Priprema filma · ${Math.round(blobs.size/count*100)}%`;section.dataset.preloaded=String(blobs.size);}catch{if(signal.aborted)return;}}
  workersDone++;if(workersDone===6&&alive&&status&&blobs.size<count)status.textContent='Dio filma nije dostupan. Istražite dostupne kadrove klizačem.';
 }
 function start(){if(started)return;started=true;for(let i=0;i<6;i++)void worker();}
 function resize(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,small?1.5:1.25);canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));drawn=-1;wake();}
 function paint(image:ImageBitmap,alpha:number){const ratio=small?Math.min(canvas.width/image.width,canvas.height/image.height)*1.4:Math.max(canvas.width/image.width,canvas.height/image.height);ctx!.globalAlpha=alpha;ctx!.drawImage(image,(canvas.width-image.width*ratio)/2,(canvas.height-image.height*ratio)/2,image.width*ratio,image.height*ratio);}
 function tick(time:number){raf=0;if(!alive||!visible||document.hidden)return;
  const paused=document.body.classList.contains('motion-paused');
  if(!manual&&!reduced&&!paused){const rect=section.getBoundingClientRect();target=clamp(-rect.top/Math.max(1,rect.height-innerHeight));}
  const dt=last?Math.min(50,time-last):16.67;last=time;
  // Eased toward scroll, speed-capped (90 frames/s, rising with distance to catch up within ~0.8 s) so fast input
  // still shows every frame; jumps across half the film land directly.
  const gap=target-playhead,eased=Math.abs(gap)*(reduced||paused?1:1-Math.exp(-dt/269)),cap=reduced||paused||Math.abs(gap)>.5?Infinity:Math.max(90/count,Math.abs(gap)/.8)*dt/1000;
  playhead+=Math.sign(gap)*Math.min(eased,cap);if(Math.abs(target-playhead)<.0001)playhead=target;
  const index=playhead*(count-1),floor=Math.floor(index);if(Math.abs(index-drawn)>.01)heading=index>drawn?1:-1;
  // Decode the frames around the playhead, reaching further in the direction of travel.
  for(const k of [0,1,-1,2,3,-2,4,5,6])for(const i of [floor+k*heading])if(i>=0&&i<count)decode(i);
  for(const i of coarse)if(!decoded.has(i))decode(i);
  if(Math.abs(index-drawn)>.008||revision!==drawRevision){
   // Blend only neighbouring frames. If the exact frame is not decoded yet, show the decoded frame closest to it
   // between the last shown frame and the target — so the picture can pause briefly but never jumps backwards.
   let lo:number|undefined,hi:number|undefined;
   if(decoded.has(floor)){lo=floor;if(decoded.has(floor+1))hi=floor+1;}
   else{const from=shown>=0?shown:floor,a=Math.min(from,floor),b=Math.max(from,floor);let best:number|undefined;for(const k of decoded.keys())if(k>=a&&k<=b&&(best===undefined||Math.abs(k-floor)<Math.abs(best-floor)))best=k;
    lo=best??(decoded.has(shown)?shown:[...decoded.keys()].sort((x,y)=>Math.abs(x-floor)-Math.abs(y-floor))[0]);}
   if(lo!==undefined){ctx!.globalAlpha=1;ctx!.fillStyle='#08090b';ctx!.fillRect(0,0,canvas.width,canvas.height);paint(decoded.get(lo)!,1);if(hi!==undefined)paint(decoded.get(hi)!,index-lo);shown=lo;ctx!.globalAlpha=1;canvas.dataset.frame=index.toFixed(2);canvas.dataset.decoded=String(decoded.size);canvas.style.opacity='1';}
   drawn=index;drawRevision=revision;if(time-uiAt>100||playhead===target){uiAt=time;slider.value=String(Math.round(playhead*100));section.style.setProperty('--film-progress',String(playhead));section.querySelectorAll<HTMLElement>('[data-film-chapter]').forEach(b=>b.setAttribute('aria-pressed',String(Math.round(playhead*5)===Number(b.dataset.filmChapter))));}
  }
  if(!paused&&(Math.abs(target-playhead)>.0001||decoding.size>0))raf=requestAnimationFrame(tick);else last=0;
 }
 function wake(){if(alive&&visible&&!raf&&!document.hidden)raf=requestAnimationFrame(tick);}
 function seek(value:number){start();target=clamp(value);manual=true;wake();if(!reduced)window.scrollTo({top:section.getBoundingClientRect().top+scrollY+target*Math.max(1,section.offsetHeight-innerHeight),behavior:'instant'});}
 slider.addEventListener('input',()=>seek(Number(slider.value)/100),{signal});
 section.addEventListener('concierge:film-seek',e=>{const value=(e as CustomEvent<number>).detail;if(Number.isFinite(value))seek(value);},{signal});
 section.querySelectorAll<HTMLElement>('[data-film-chapter]').forEach(b=>b.addEventListener('click',()=>seek(Number(b.dataset.filmChapter)/5),{signal}));
 window.addEventListener('scroll',()=>{if(!reduced)manual=false;wake();},{passive:true,signal});window.addEventListener('resize',resize,{signal});
 document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();},{signal});document.addEventListener('concierge:motion',wake,{signal});
 const preload=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){start();preload.disconnect();}},{rootMargin:'3000px'});preload.observe(section);
 const warmTimer=!reduced&&!(navigator as Navigator&{connection?:{saveData?:boolean}}).connection?.saveData?window.setTimeout(start,8000):0;
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;document.body.classList.toggle('film-visible',visible);if(visible){last=0;wake();}else{cancelAnimationFrame(raf);raf=0;}},{rootMargin:'0px'});observer.observe(section);
 resize();signal.addEventListener('abort',()=>{alive=false;clearTimeout(warmTimer);observer.disconnect();preload.disconnect();cancelAnimationFrame(raf);decoded.forEach(i=>i.close());decoded.clear();blobs.clear();pendingFetch.clear();document.body.classList.remove('film-visible');},{once:true});
}
