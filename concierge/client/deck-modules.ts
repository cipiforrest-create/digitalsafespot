// Miniatures shown on the six service modules of the X Deck. Each is a small looping picture of what the service
// does, drawn on a 2D canvas that the scene uses as the module's screen. `t` is the module's own clock in seconds.
export const MODULE_COUNT=6;
// Monochrome, like the rest of the scene: silver light on black glass.
const W=384,H=240,ACCENT='#ffffff',COOL='#b8c0cc',PEAK='#f4f6f9',DIM='#5a6270';
const clamp=(v:number)=>Math.min(1,Math.max(0,v)),ease=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
type Ctx=CanvasRenderingContext2D;
function frame(x:Ctx,active:boolean){
 x.globalAlpha=1;x.shadowBlur=0;x.clearRect(0,0,W,H);x.fillStyle='rgba(6,8,11,.86)';x.fillRect(0,0,W,H);
 const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'rgba(255,255,255,.14)');g.addColorStop(.45,'rgba(255,255,255,.02)');g.addColorStop(1,'rgba(255,255,255,.07)');x.fillStyle=g;x.fillRect(0,0,W,H);
 x.strokeStyle=active?'rgba(255,255,255,.95)':'rgba(220,226,235,.45)';x.lineWidth=active?4:2;x.strokeRect(6,6,W-12,H-12);
}
function box(x:Ctx,l:number,t:number,w:number,h:number,a:number,fill=false){x.globalAlpha=a;if(fill)x.fillRect(l,t,w,h);else x.strokeRect(l,t,w,h);x.globalAlpha=1;}
// 0 — Cinematic websites: a page assembles itself block by block, then a cursor presses its button.
function web(x:Ctx,t:number){
 const k=t%5;x.strokeStyle=COOL;x.fillStyle=COOL;x.lineWidth=2;
 box(x,40,40,304,16,ease(k/.5));
 const hero=ease((k-.4)/.6);x.fillStyle=ACCENT;box(x,40+(1-hero)*-30,66,190,62,hero*.85,true);
 x.fillStyle=PEAK;box(x,52,80,110*hero,8,hero,true);box(x,52,96,76*hero,6,hero*.7,true);
 x.strokeStyle=COOL;box(x,242,66+(1-ease((k-.8)/.6))*24,102,62,ease((k-.8)/.6));
 for(let i=0;i<3;i++){const a=ease((k-1.3-i*.25)/.5);box(x,40+i*104,140+(1-a)*18,96,50,a);x.fillStyle=COOL;box(x,50+i*104,174+(1-a)*18,56,5,a*.7,true);}
 const press=ease((k-2.8)/.7),cx=300-press*190,cy=200-press*84;
 x.fillStyle=PEAK;x.globalAlpha=clamp((k-2.4)/.4);x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+14,cy+11);x.lineTo(cx+5,cy+12);x.lineTo(cx+1,cy+20);x.closePath();x.fill();
 if(k>3.5){x.strokeStyle=PEAK;x.globalAlpha=clamp(1-(k-3.5)/.8);x.beginPath();x.arc(cx,cy,(k-3.5)*40,0,Math.PI*2);x.stroke();}
 x.globalAlpha=1;
}
// 1 — SEO · AEO · GEO: a radar sweep finds the business and its result moves up the list.
function radar(x:Ctx,t:number){
 const cx=120,cy=132,sweep=t*1.9;x.strokeStyle=DIM;x.lineWidth=1.5;
 [28,54,80].forEach(r=>{x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.stroke();});
 x.beginPath();x.moveTo(cx-84,cy);x.lineTo(cx+84,cy);x.moveTo(cx,cy-84);x.lineTo(cx,cy+84);x.stroke();
 const g=x.createConicGradient(sweep,cx,cy);g.addColorStop(0,'rgba(55,230,208,.55)');g.addColorStop(.18,'rgba(55,230,208,0)');g.addColorStop(1,'rgba(55,230,208,0)');
 x.fillStyle=g;x.beginPath();x.arc(cx,cy,80,0,Math.PI*2);x.fill();
 x.strokeStyle=ACCENT;x.lineWidth=2;x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+Math.cos(sweep)*80,cy+Math.sin(sweep)*80);x.stroke();
 [[.7,48],[2.4,66],[4.1,34],[5.3,72]].forEach(([a,r])=>{const d=((sweep-a)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);x.globalAlpha=clamp(1-d/3.2);x.fillStyle=PEAK;x.beginPath();x.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,4,0,Math.PI*2);x.fill();});
 x.globalAlpha=1;
 const k=t%6,rank=k<1.5?2:k<3?1:0;
 for(let i=0;i<3;i++){const mine=i===rank;x.fillStyle=mine?ACCENT:DIM;box(x,226,58+i*44,126,32,mine?.9:.6,true);x.fillStyle=mine?'#04070c':COOL;box(x,236,68+i*44,mine?86:60,5,1,true);box(x,236,78+i*44,44,4,.7,true);}
}
// 2 — AI systems: a conversation — a question arrives, the assistant answers, the voice wave follows.
function assistant(x:Ctx,t:number){
 const k=t%5.5;
 const bubble=(l:number,top:number,w:number,a:number,mine:boolean)=>{x.globalAlpha=a;x.fillStyle=mine?DIM:ACCENT;x.beginPath();x.roundRect(l,top+(1-a)*10,w,26,10);x.fill();x.fillStyle=mine?PEAK:'#04070c';x.fillRect(l+12,top+11+(1-a)*10,w-24,4);x.globalAlpha=1;};
 bubble(180,44,164,ease(k/.4),true);
 if(k>.7&&k<1.5){x.fillStyle=ACCENT;for(let i=0;i<3;i++){x.globalAlpha=.4+.6*Math.abs(Math.sin(t*7+i));x.beginPath();x.arc(52+i*14,97,4,0,Math.PI*2);x.fill();}x.globalAlpha=1;}
 bubble(40,82,214,ease((k-1.5)/.4),false);bubble(40,114,150,ease((k-1.9)/.4),false);bubble(214,150,130,ease((k-2.8)/.4),true);
 x.strokeStyle=ACCENT;x.lineWidth=3;x.lineCap='round';const on=ease((k-3.3)/.4);
 for(let i=0;i<34;i++){const h=(6+26*Math.abs(Math.sin(t*5+i*.55))*Math.abs(Math.sin(i*.31+t)))*on;x.globalAlpha=.35+.65*on;x.beginPath();x.moveTo(44+i*9,206-h/2);x.lineTo(44+i*9,206+h/2);x.stroke();}
 x.globalAlpha=1;x.lineCap='butt';
}
// 3 — Automation: a request travels the chain; every step confirms itself.
function chain(x:Ctx,t:number){
 const nodes:[number,number][]=[[62,76],[160,76],[258,76],[322,150],[224,170],[110,170]],k=t%4.5/4.5*nodes.length;
 x.lineWidth=2;
 nodes.forEach(([a,b],i)=>{const [c,d]=nodes[(i+1)%nodes.length],done=clamp(k-i);x.strokeStyle=DIM;x.beginPath();x.moveTo(a,b);x.lineTo(c,d);x.stroke();
  if(done>0){x.strokeStyle=ACCENT;x.beginPath();x.moveTo(a,b);x.lineTo(a+(c-a)*done,b+(d-b)*done);x.stroke();if(done<1){x.fillStyle=PEAK;x.beginPath();x.arc(a+(c-a)*done,b+(d-b)*done,5,0,Math.PI*2);x.fill();}}});
 nodes.forEach(([a,b],i)=>{const on=k>=i;x.fillStyle='#04070c';x.strokeStyle=on?ACCENT:DIM;x.lineWidth=on?3:2;x.beginPath();x.roundRect(a-22,b-16,44,32,7);x.fill();x.stroke();
  if(on){x.strokeStyle=PEAK;x.lineWidth=2.5;x.beginPath();x.moveTo(a-8,b);x.lineTo(a-2,b+6);x.lineTo(a+9,b-6);x.stroke();}else{x.fillStyle=DIM;x.fillRect(a-9,b-2,18,4);}});
}
// 4 — Lead systems: visitors drop through the funnel and come out as counted enquiries.
function funnel(x:Ctx,t:number){
 x.strokeStyle=COOL;x.lineWidth=2;x.beginPath();x.moveTo(50,48);x.lineTo(214,48);x.lineTo(160,128);x.lineTo(160,186);x.lineTo(104,186);x.lineTo(104,128);x.closePath();x.stroke();
 x.strokeStyle=DIM;x.beginPath();x.moveTo(76,88);x.lineTo(188,88);x.moveTo(104,128);x.lineTo(160,128);x.stroke();
 for(let i=0;i<9;i++){const p=(t*.32+i/9)%1,y=40+p*150,spread=(1-clamp((y-48)/80))*70+12,dx=Math.sin(i*2.4)*spread*(1-p*.6);
  x.globalAlpha=p<.9?1:clamp((1-p)/.1);x.fillStyle=p>.55?ACCENT:PEAK;x.beginPath();x.arc(132+dx,y,4,0,Math.PI*2);x.fill();}
 x.globalAlpha=1;const count=12+Math.floor(t*.32*9);
 x.fillStyle=ACCENT;x.font='600 44px sans-serif';x.fillText(String(count),248,128);
 x.fillStyle=COOL;x.fillRect(250,144,84,5);x.fillRect(250,158,56,4);
 const pulse=(t*.32*9)%1;x.strokeStyle=ACCENT;x.globalAlpha=1-pulse;x.beginPath();x.arc(292,112,30+pulse*26,0,Math.PI*2);x.stroke();x.globalAlpha=1;
}
// 5 — Analytics: the bars grow and the trend line climbs past them.
function analytics(x:Ctx,t:number){
 const k=t%5,base=194;x.strokeStyle=DIM;x.lineWidth=1.5;
 for(let i=0;i<4;i++){x.beginPath();x.moveTo(44,base-i*42);x.lineTo(340,base-i*42);x.stroke();}
 const values=[.3,.42,.38,.58,.66,.82,.96];
 values.forEach((v,i)=>{const h=v*128*ease((k-i*.16)/.9);x.fillStyle=i===values.length-1?ACCENT:COOL;x.globalAlpha=i===values.length-1?1:.55;x.fillRect(56+i*40,base-h,24,h);});
 x.globalAlpha=1;x.strokeStyle=PEAK;x.lineWidth=3;x.lineJoin='round';x.beginPath();
 const reach=ease((k-1.2)/1.6)*(values.length-1);
 values.forEach((v,i)=>{if(i>Math.ceil(reach))return;const f=Math.min(1,reach-(i-1)),px=68+(i-1+ (i?f:1))*40,prev=values[Math.max(0,i-1)],py=base-(prev+(v-prev)*(i?f:1))*128-12;if(i)x.lineTo(px,py);else x.moveTo(68,base-v*128-12);});
 x.stroke();
 const up=ease((k-2.8)/.6);x.fillStyle=ACCENT;x.globalAlpha=up;x.beginPath();x.moveTo(286,62);x.lineTo(318,30);x.moveTo(296,30);x.lineTo(318,30);x.lineTo(318,52);x.strokeStyle=ACCENT;x.lineWidth=4;x.stroke();x.globalAlpha=1;
}
const draw=[web,radar,assistant,chain,funnel,analytics];
// Idle face: one line icon per service, like the glass plates on the reference rocks.
const icons:((x:Ctx)=>void)[]=[
 x=>{x.strokeRect(-46,-32,92,60);x.beginPath();x.moveTo(-46,-18);x.lineTo(46,-18);x.moveTo(-14,28);x.lineTo(-20,42);x.lineTo(20,42);x.lineTo(14,28);x.stroke();},
 x=>{x.beginPath();x.arc(-8,-8,28,0,Math.PI*2);x.moveTo(12,12);x.lineTo(40,40);x.stroke();},
 x=>{x.strokeRect(-30,-30,60,60);x.strokeRect(-14,-14,28,28);x.beginPath();for(const k of [-16,0,16]){x.moveTo(k,-30);x.lineTo(k,-42);x.moveTo(k,30);x.lineTo(k,42);x.moveTo(-30,k);x.lineTo(-42,k);x.moveTo(30,k);x.lineTo(42,k);}x.stroke();},
 x=>{x.beginPath();x.arc(0,0,16,0,Math.PI*2);for(let i=0;i<8;i++){const a=i*Math.PI/4;x.moveTo(Math.cos(a)*24,Math.sin(a)*24);x.lineTo(Math.cos(a)*38,Math.sin(a)*38);}x.stroke();x.beginPath();x.arc(0,0,30,0,Math.PI*2);x.stroke();},
 x=>{x.beginPath();x.moveTo(-44,-34);x.lineTo(44,-34);x.lineTo(12,4);x.lineTo(12,38);x.lineTo(-12,30);x.lineTo(-12,4);x.closePath();x.stroke();},
 x=>{x.beginPath();x.moveTo(-44,40);x.lineTo(44,40);x.stroke();[[-30,14],[-6,-6],[18,-28]].forEach(([l,t])=>x.strokeRect(l,t,16,40-t));},
];
export function drawIcon(x:Ctx,index:number,glow:number){
 frame(x,glow>.5);x.save();x.translate(W/2,H/2);x.lineWidth=5;x.lineJoin='round';x.lineCap='round';
 x.shadowColor='rgba(255,255,255,.9)';x.shadowBlur=10+18*glow;x.strokeStyle=`rgba(244,246,249,${.82+.18*glow})`;
 icons[index%MODULE_COUNT](x);x.restore();
}
export function drawModule(x:Ctx,index:number,t:number,active:boolean){frame(x,active);x.save();draw[index%MODULE_COUNT](x,t);x.restore();}
