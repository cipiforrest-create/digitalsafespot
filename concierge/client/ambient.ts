// Binary rain: black-and-white 0/1 streams that only fall, top to bottom, in three depth layers (far digits read
// small and dim, near ones large and bright). Columns never move sideways; the digits keep flipping as they fall.
export function mountAmbient(signal:AbortSignal){
 const canvas=document.querySelector<HTMLCanvasElement>('#matrix-background'),ctx=canvas?.getContext('2d',{alpha:false});
 if(!canvas||!ctx||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
 const mobile=innerWidth<768,LEVELS=8,BASE=40,PAD=14,CELL=BASE+PAD*2,DIM=.62;
 // Sprite atlas: '0' and '1' at eight brightness levels, drawn once.
 const atlas=document.createElement('canvas');atlas.width=CELL*LEVELS;atlas.height=CELL*2;const ax=atlas.getContext('2d')!;
 ax.textAlign='center';ax.textBaseline='middle';ax.font=`500 ${BASE}px Consolas,"SF Mono",ui-monospace,monospace`;
 for(let ch=0;ch<2;ch++)for(let l=0;l<LEVELS;l++){const t=(l+1)/LEVELS;ax.save();ax.shadowColor=`rgba(255,255,255,${.5*t*DIM})`;ax.shadowBlur=4+8*t;ax.fillStyle=t<.75?`rgba(208,208,210,${(.12+.58*t)*DIM})`:`rgba(250,250,250,${.85*t*DIM})`;ax.fillText(String(ch),l*CELL+CELL/2,ch*CELL+CELL/2);ax.restore();}
 // Depth layers: glyph size (px), fall speed (px/s), brightness ceiling, share of columns.
 const layers=[{size:mobile?11:10,speed:38,light:.45,share:.5},{size:mobile?16:15,speed:62,light:.7,share:.33},{size:mobile?24:23,speed:96,light:1,share:.17}];
 const MAX=160,TRAIL=24;
 const colX=new Float32Array(MAX),colY=new Float32Array(MAX),colLen=new Uint8Array(MAX),colLayer=new Uint8Array(MAX),colJitter=new Float32Array(MAX),bits=new Uint8Array(MAX*TRAIL);
 let W=0,H=0,laidW=-1,raf=0,last=0,count=0,mid:CanvasGradient|null=null,vig:CanvasGradient|null=null;
 const rand=(a:number,b:number)=>a+Math.random()*(b-a);
 function spawn(i:number,anywhere:boolean){
  const l=layers[colLayer[i]],step=l.size*1.15;colLen[i]=(8+Math.random()*(TRAIL-8))|0;colJitter[i]=rand(.85,1.2);
  colY[i]=anywhere?rand(-step*colLen[i],H+step*colLen[i]):-rand(0,H*.6);
 }
 function resize(){
  const dpr=Math.min(devicePixelRatio||1,mobile?1:1.25);W=innerWidth;H=innerHeight;canvas!.width=Math.round(W*dpr);canvas!.height=Math.round(H*dpr);canvas!.style.width=`${W}px`;canvas!.style.height=`${H}px`;ctx!.setTransform(dpr,0,0,dpr,0,0);
  mid=ctx!.createRadialGradient(W/2,H/2,0,W/2,H/2,H*.52);mid.addColorStop(0,'rgba(5,5,6,.35)');mid.addColorStop(1,'rgba(5,5,6,0)');
  vig=ctx!.createRadialGradient(W/2,H/2,H*.32,W/2,H/2,H*.95);vig.addColorStop(0,'rgba(3,3,4,0)');vig.addColorStop(1,'rgba(3,3,4,.74)');
  // Columns sit on fixed x positions (a loose grid per layer), so nothing ever drifts sideways. A height-only change
  // (a phone's browser bar) keeps the streams where they are.
  if(W===laidW)return;laidW=W;count=0;
  layers.forEach((l,li)=>{const n=Math.min(MAX-count,Math.round(W/(mobile?22:24)*l.share*1.6));for(let k=0;k<n;k++){const i=count++;colLayer[i]=li;colX[i]=(k+rand(.2,.8))*W/n;spawn(i,true);for(let j=0;j<TRAIL;j++)bits[i*TRAIL+j]=Math.random()<.5?0:1;}});
 }
 // The X hero stage and the film stage are opaque: while either fills the viewport there is nothing of the background
 // to draw. Their rects are re-measured after a scroll or resize (and every 30 frames as a safety net), not every frame,
 // so an idle page does not force a layout on each animation frame.
 const opaque=['.xs-stage','[data-cinema-story][data-enhanced]'];
 let hidden=false,storyFound=false,stale=true,age=0;const invalidate=()=>{stale=true;};
 function covered(){
  if(stale||++age>30){stale=false;age=0;hidden=false;storyFound=false;
   for(const selector of opaque){const node=document.querySelector(selector);if(!node)continue;if(selector!=='.xs-stage')storyFound=true;
    const r=node.getBoundingClientRect();if(r.top<=0&&r.bottom>=innerHeight){hidden=true;break;}}}
  return hidden||(!storyFound&&document.body.classList.contains('film-visible'));
 }
 function tick(now:number){
  raf=requestAnimationFrame(tick);const dt=Math.min(.05,last?(now-last)/1000:.016);last=now;
  if(document.body.classList.contains('motion-paused')||covered())return;
  // Matrix flicker: a few percent of the digits switch 0 ↔ 1 every frame.
  for(let n=Math.ceil(count*TRAIL*.03);n>0;n--){const i=Math.random()*count*TRAIL|0;bits[i]^=1;}
  ctx!.fillStyle='#060607';ctx!.fillRect(0,0,W,H);
  for(let i=0;i<count;i++){
   const l=layers[colLayer[i]],step=l.size*1.15,half=l.size*(CELL/BASE)/2,len=colLen[i];
   colY[i]+=l.speed*colJitter[i]*dt;if(colY[i]-len*step>H+half)spawn(i,false);
   // The head leads the stream downward; the trail fades upward behind it.
   for(let j=0;j<len;j++){
    const y=colY[i]-j*step;if(y<-half||y>H+half)continue;
    const fade=j===0?1:.78*(1-j/len),lvl=Math.max(0,Math.min(7,(l.light*fade*7.9)|0));
    ctx!.drawImage(atlas,lvl*CELL,bits[i*TRAIL+j]*CELL,CELL,CELL,colX[i]-half,y-half,half*2,half*2);
   }
  }
  ctx!.fillStyle=mid!;ctx!.fillRect(0,0,W,H);ctx!.fillStyle=vig!;ctx!.fillRect(0,0,W,H);
 }
 resize();raf=requestAnimationFrame(tick);window.addEventListener('resize',()=>{resize();invalidate();},{signal});window.addEventListener('scroll',invalidate,{passive:true,signal});
 document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);last=0;if(!document.hidden)raf=requestAnimationFrame(tick);},{signal});
 signal.addEventListener('abort',()=>cancelAnimationFrame(raf),{once:true});
}
