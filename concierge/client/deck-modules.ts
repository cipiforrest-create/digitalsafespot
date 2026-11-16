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
// Static icons, redrawn from the supplied Digital X icon set: thin glowing line art over a faint reticle.
function rr(x:Ctx,l:number,t:number,w:number,h:number,r:number){x.moveTo(l+r,t);x.arcTo(l+w,t,l+w,t+h,r);x.arcTo(l+w,t+h,l,t+h,r);x.arcTo(l,t+h,l,t,r);x.arcTo(l,t,l+w,t,r);x.closePath();}
function gear(x:Ctx,cx:number,cy:number,r:number,teeth:number,hole:number){
 x.beginPath();const tooth=r*.22,step=Math.PI*2/teeth;
 for(let i=0;i<teeth;i++){const a=i*step;const p=[[a-step*.5,r],[a-step*.22,r],[a-step*.16,r+tooth],[a+step*.16,r+tooth],[a+step*.22,r],[a+step*.5,r]];
  p.forEach(([b,d],k)=>{const px=cx+Math.cos(b)*d,py=cy+Math.sin(b)*d;if(i===0&&k===0)x.moveTo(px,py);else x.lineTo(px,py);});}
 x.closePath();x.stroke();x.beginPath();x.arc(cx,cy,hole,0,Math.PI*2);x.stroke();
}
function arrowHead(x:Ctx,px:number,py:number,a:number,s=9){x.beginPath();x.moveTo(px+Math.cos(a+2.5)*s,py+Math.sin(a+2.5)*s);x.lineTo(px,py);x.lineTo(px+Math.cos(a-2.5)*s,py+Math.sin(a-2.5)*s);x.stroke();}
const icons:((x:Ctx)=>void)[]=[
 // Cinematic websites: a browser window with a play button and a film strip.
 x=>{x.beginPath();rr(x,-82,-56,164,112,10);x.moveTo(-82,-36);x.lineTo(82,-36);x.moveTo(40,-36);x.lineTo(40,56);x.stroke();
  [-68,-54,-40].forEach(c=>{x.beginPath();x.arc(c,-46,4.5,0,Math.PI*2);x.stroke();});
  x.beginPath();x.moveTo(-26,-12);x.lineTo(-26,34);x.lineTo(12,11);x.closePath();x.stroke();
  for(let i=0;i<4;i++){x.beginPath();rr(x,50,-29+i*21,22,15,3);x.stroke();x.fillStyle='rgba(244,246,249,.85)';x.fillRect(44,-26+i*21,3,4);x.fillRect(44,-18+i*21,3,4);x.fillRect(75,-26+i*21,3,4);x.fillRect(75,-18+i*21,3,4);}},
 // SEO · AEO · GEO: a magnifying glass holding a location pin and rising bars.
 x=>{x.beginPath();x.arc(-12,-10,54,0,Math.PI*2);x.stroke();
  x.beginPath();x.moveTo(27,33);x.lineTo(56,62);x.stroke();x.save();x.lineWidth=13;x.globalAlpha=.25;x.beginPath();x.moveTo(30,36);x.lineTo(56,62);x.stroke();x.restore();
  x.beginPath();x.arc(-24,-30,15,Math.PI*.82,Math.PI*2.18);x.lineTo(-24,-4);x.closePath();x.stroke();x.beginPath();x.arc(-24,-30,5.5,0,Math.PI*2);x.stroke();
  [[-38,8,11,14],[-22,0,11,22],[-6,-10,11,32]].forEach(([l,t,w,h])=>{x.beginPath();rr(x,l+20,t+10,w,h,2.5);x.stroke();});},
 // AI systems: a hexagonal core with six connected nodes.
 x=>{x.beginPath();for(let i=0;i<6;i++){const a=-Math.PI/2+i*Math.PI/3;const px=Math.cos(a)*38,py=Math.sin(a)*38;if(i)x.lineTo(px,py);else x.moveTo(px,py);}x.closePath();x.stroke();
  for(let i=0;i<6;i++){const a=-Math.PI/2+i*Math.PI/3,c=Math.cos(a),sn=Math.sin(a);x.beginPath();x.moveTo(c*38,sn*38);x.lineTo(c*62,sn*62);x.stroke();x.beginPath();x.arc(c*73,sn*73,11,0,Math.PI*2);x.stroke();}},
 // Automation: two interlocking gears inside a looping arrow.
 x=>{x.beginPath();x.arc(0,0,72,Math.PI*1.08,Math.PI*1.9);x.stroke();arrowHead(x,Math.cos(Math.PI*1.9)*72,Math.sin(Math.PI*1.9)*72,Math.PI*1.9+Math.PI/2);
  x.beginPath();x.arc(0,0,72,Math.PI*.08,Math.PI*.9);x.stroke();arrowHead(x,Math.cos(Math.PI*.9)*72,Math.sin(Math.PI*.9)*72,Math.PI*.9+Math.PI/2);
  gear(x,-14,-12,26,8,11);gear(x,24,22,18,8,8);},
 // Lead systems: three leads drop into a funnel and one client comes out.
 x=>{[-34,0,34].forEach(c=>{x.beginPath();x.arc(c,-80,8,0,Math.PI*2);x.stroke();});
  x.beginPath();x.moveTo(-30,-66);x.quadraticCurveTo(-22,-56,-18,-46);x.moveTo(0,-68);x.lineTo(0,-46);x.moveTo(30,-66);x.quadraticCurveTo(22,-56,18,-46);x.stroke();
  arrowHead(x,-18,-44,Math.PI*.42,7);arrowHead(x,0,-44,Math.PI/2,7);arrowHead(x,18,-44,Math.PI*.58,7);
  x.beginPath();x.ellipse(0,-30,50,9,0,0,Math.PI*2);x.moveTo(-50,-30);x.lineTo(-10,20);x.lineTo(-10,38);x.lineTo(10,38);x.lineTo(10,20);x.lineTo(50,-30);x.stroke();
  x.beginPath();x.moveTo(0,46);x.lineTo(0,62);x.stroke();arrowHead(x,0,64,Math.PI/2,7);x.beginPath();x.arc(0,80,8,0,Math.PI*2);x.stroke();},
 // Analytics: rising bars with a growth line that ends in a bright point.
 x=>{x.beginPath();x.moveTo(-74,56);x.lineTo(74,56);x.stroke();
  [[-62,30],[-30,14],[2,-2],[34,-24]].forEach(([l,t])=>{x.beginPath();rr(x,l,t,24,56-t,4);x.stroke();});
  const pts=[[-56,6],[-20,-12],[16,-30],[56,-56]];x.beginPath();pts.forEach(([px,py],i)=>{if(i)x.lineTo(px,py);else x.moveTo(px,py);});x.stroke();
  pts.forEach(([px,py],i)=>{x.beginPath();x.arc(px,py,i===3?8:6,0,Math.PI*2);if(i===3){x.fillStyle='rgba(255,255,255,1)';x.fill();}else{x.fillStyle='rgba(6,8,11,1)';x.fill();x.stroke();}});},
];
// The faint reticle and corner glints of the glass plate behind every icon.
function reticle(x:Ctx){
 x.save();x.shadowBlur=0;x.strokeStyle='rgba(220,226,235,.14)';x.lineWidth=1;x.beginPath();x.arc(0,0,96,0,Math.PI*2);x.moveTo(-150,0);x.lineTo(150,0);x.moveTo(0,-110);x.lineTo(0,110);x.stroke();
 x.fillStyle='rgba(235,240,246,.55)';for(let i=0;i<8;i++){const a=i*Math.PI/4;x.beginPath();x.arc(Math.cos(a)*96,Math.sin(a)*96,1.6,0,Math.PI*2);x.fill();}
 for(const [cx,cy] of [[-W/2+10,-H/2+10],[W/2-10,-H/2+10],[-W/2+10,H/2-10],[W/2-10,H/2-10],[0,H/2-8]]){const g=x.createRadialGradient(cx,cy,0,cx,cy,16);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(cx-16,cy-16,32,32);}
 x.restore();
}
export function drawIcon(x:Ctx,index:number,glow:number,bare=false){
 if(!bare)frame(x,glow>.5);x.save();x.translate(W/2,H/2);if(!bare)reticle(x);x.scale(1.16,1.16);x.lineWidth=3;x.lineJoin='round';x.lineCap='round';
 x.shadowColor='rgba(255,255,255,.95)';x.shadowBlur=8+16*glow;x.strokeStyle=`rgba(244,246,249,${.86+.14*glow})`;
 icons[index%MODULE_COUNT](x);x.shadowBlur=0;x.globalAlpha=.55;icons[index%MODULE_COUNT](x);x.restore();
}
export function drawModule(x:Ctx,index:number,t:number,active:boolean,bare=false){if(!bare)frame(x,active);x.save();draw[index%MODULE_COUNT](x,t);x.restore();}
// Act 3 glass panel (after the Digital X key visual): the service's icon, or its live miniature while selected, a
// divider, then its name. 640×200 canvas; the name comes from the page so translations carry through.
export const PANEL_W=640,PANEL_H=200;
export function drawPanel(x:Ctx,index:number,name:string,level:number,t:number,font:string){
 x.globalAlpha=1;x.shadowBlur=0;x.clearRect(0,0,PANEL_W,PANEL_H);
 x.beginPath();x.roundRect(4,4,PANEL_W-8,PANEL_H-8,18);x.fillStyle=`rgba(8,10,14,${.72+.12*level})`;x.fill();
 const g=x.createLinearGradient(0,0,PANEL_W*.6,PANEL_H);g.addColorStop(0,'rgba(255,255,255,.16)');g.addColorStop(.5,'rgba(255,255,255,.03)');g.addColorStop(1,'rgba(255,255,255,.08)');x.fillStyle=g;x.fill();
 x.lineWidth=2+2*level;x.strokeStyle=`rgba(232,238,246,${.5+.45*level})`;x.stroke();
 x.save();x.beginPath();x.roundRect(4,4,PANEL_W-8,PANEL_H-8,18);x.clip();
 // icon area: 320×200 (the 384×240 drawings scaled to fit)
 x.save();x.translate(8,0);x.scale(PANEL_H/H,PANEL_H/H);
 if(level>.05)drawModule(x,index,t,level>.4,true);else drawIcon(x,index,level,true);
 x.restore();x.restore();
 x.globalAlpha=1;x.shadowBlur=0;x.strokeStyle='rgba(220,226,235,.35)';x.lineWidth=1.5;x.beginPath();x.moveTo(338,38);x.lineTo(338,PANEL_H-38);x.stroke();
 // name: up to two lines, wide letter spacing
 x.fillStyle=`rgba(244,246,249,${.82+.18*level})`;x.shadowColor='rgba(255,255,255,.6)';x.shadowBlur=4+10*level;x.textBaseline='middle';
 let size=30;x.font=`600 ${size}px ${font}`;(x as Ctx&{letterSpacing:string}).letterSpacing='3px';
 const words=name.toUpperCase().split(/\s+/),lines:string[]=[];let line='';
 for(const w of words){const test=line?line+' '+w:w;if(x.measureText(test).width>262&&line){lines.push(line);line=w;}else line=test;}if(line)lines.push(line);
 while(lines.some(l=>x.measureText(l).width>262)&&size>16){size-=2;x.font=`600 ${size}px ${font}`;}
 const lh=size*1.35,top=PANEL_H/2-(lines.length-1)*lh/2;lines.slice(0,3).forEach((l,i)=>x.fillText(l,362,top+i*lh));
 // selected: a small arrow says a second click opens the page
 if(level>.5){x.globalAlpha=level;x.font=`600 26px ${font}`;x.fillText('↗',PANEL_W-46,34);x.globalAlpha=1;}
 x.shadowBlur=0;
}
