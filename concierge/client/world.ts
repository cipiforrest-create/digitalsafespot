import {AdditiveBlending,BoxGeometry,BufferAttribute,BufferGeometry,CatmullRomCurve3,Curve,ExtrudeGeometry,Group,LinearFilter,LinearMipmapNearestFilter,LinearSRGBColorSpace,LineSegments,Mesh,NoColorSpace,PerspectiveCamera,PlaneGeometry,Points,Scene,ShaderMaterial,Shape,Texture,TextureLoader,TubeGeometry,Vector3,WebGLRenderer,type Material,type Object3D} from 'three';
import {FOCAL,FOV,FRAME,framePoint,frameRect,mobileRoi,moduleAnchor,orbCal,palette,projectPoint,ringPoint,systemCal,xCal,type NodeCal,type Px,type Ring} from '../shared/world-calibration';
import type {CinemaPosition} from '../shared/cinema-timeline';

// One persistent WebGL world behind the film canvas. Each checkpoint starts as the exact stop frame (film pixels
// projected onto calibrated geometry) and only comes alive — clean plate plus live light — once the visitor
// interacts or keeps scrolling. Every pose is gated by scroll position, so reverse scrolling replays it exactly.
export type NodePlacement={x:number;y:number;depth:number};
export type WorldHost={canvas:HTMLCanvasElement;screen:HTMLElement;stage:HTMLElement;media:string;bucket:number;small:boolean;place(cp:number,pts:NodePlacement[]):void;fail(reason:string):void;dragged?(cp:number):void};
export type WorldStats={phase:string;checkpoint:number;live:number;zoom:number;yaw:number;pitch:number;fov:number;anchor:Px;light:[number,number];quality:number;fps:number;engaged:boolean;overlay:number};
export type World={prepare(cp:number):Promise<void>;ready(cp:number):boolean;update(p:CinemaPosition):void;resize(bucket:number,small:boolean):void;pause(paused:boolean):void;select(cp:number,node:number|null):void;engage():void;stats():WorldStats;debug(overlay:number):void;dispose():void};
type Uniform<T>={value:T};type Uniforms=Record<string,Uniform<unknown>>;
type State={live:number;gate:number;explore:number;converge:number;yaw:number;pitch:number;light:[number,number];active:number|null};
type Built={stop:Texture;clean:Texture};
type Checkpoint={group:Group;textures:Texture[];anchors:Vector3[];depths:number[];turn(node:number):number;tick(t:number,dt:number,s:State):void;dispose():void};

const hex=(h:string)=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
const col={shadow:hex(palette.shadow),mid:hex(palette.mid),bright:hex(palette.bright),peak:hex(palette.peak)};
const clamp=(v:number,a=0,b=1)=>Math.min(b,Math.max(a,v)),smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
const bump=(v:number,a:number,b:number,c:number)=>smooth((v-a)/(b-a))*(1-smooth((v-b)/(c-b)));
const damp=(cur:number,target:number,rate:number,dt:number)=>target+(cur-target)*Math.exp(-rate*dt);
const at=(u:number,v:number,depth:number)=>new Vector3(...framePoint(u,v,depth));
const worldSize=(px:number,depth:number)=>px*depth/FOCAL;
const LAST=[240,192,192],NAMES=['orb','x','system'];

const fullVert='void main(){gl_Position=vec4(position.xy*2.,0.,1.);}';
// Plate: stop frame → clean plate (live) → next clip's first frame (release), in the film canvas' exact contain-fit.
const plateFrag=`uniform sampler2D tA,tB,tN;uniform vec4 uRect,uRectN,uPed;uniform float uClean,uNext,uDim,uFeather,uPulse,uTime;uniform vec3 uBg;
vec3 pick(sampler2D t,vec4 r,out float inside){vec2 uv=(gl_FragCoord.xy-r.xy)/r.zw;inside=step(0.,uv.x)*step(0.,uv.y)*step(uv.x,1.)*step(uv.y,1.);return texture2D(t,clamp(uv,0.,1.)).rgb;}
void main(){float i1,i2,i3;vec3 c=mix(pick(tA,uRect,i1),pick(tB,uRect,i2),uClean);vec2 q=(gl_FragCoord.xy-uRect.xy)/uRect.zw;
// Idle life: the light around the X (uPed: centre and radii, source px) breathes — visibly dimmer, then brighter —
// and every few seconds flashes: an added glow that fades with distance from the X. No full-height bands.
if(uPulse>0.){vec2 fp=vec2(q.x*864.,(1.-q.y)*496.);float lum=dot(c,vec3(.2126,.7152,.0722));
float r=length((fp-uPed.xy)/uPed.zw),halo=1.-smoothstep(.3,1.,r),glow=1.-smoothstep(.15,1.25,r);
float breath=.5+.5*sin(uTime*1.15);
float f=fract(uTime/3.3),flash=f<.14?sin(f/.14*3.14159):0.;flash+=f>.2&&f<.27?.45*sin((f-.2)/.07*3.14159):0.;
c*=mix(1.,mix(.72,1.14,breath),uPulse*halo*smoothstep(.08,.4,lum));
c+=uPulse*glow*glow*flash*vec3(.34,.36,.4);}
if(uFeather>0.)i1*=smoothstep(0.,uFeather,q.x)*smoothstep(0.,uFeather,1.-q.x)*smoothstep(0.,uFeather*1.7,q.y)*smoothstep(0.,uFeather*1.7,1.-q.y);c=mix(uBg,c,i1);
if(uNext>0.){vec3 n=pick(tN,uRectN,i3);c=mix(c,mix(uBg,n,i3),uNext);}gl_FragColor=vec4(c*uDim,1.);}`;
// Debug only (?debug3d=1): the untouched stop frame drawn over the live render at a chosen opacity.
const overlayFrag=`uniform sampler2D tO;uniform vec4 uRect;uniform float uOverlay;uniform vec3 uBg;
void main(){vec2 uv=(gl_FragCoord.xy-uRect.xy)/uRect.zw;float inside=step(0.,uv.x)*step(0.,uv.y)*step(uv.x,1.)*step(uv.y,1.);gl_FragColor=vec4(mix(uBg,texture2D(tO,clamp(uv,0.,1.)).rgb,inside),uOverlay);}`;
const projVert=`attribute vec2 fuv;varying vec2 vUv,vPx;varying vec3 vN,vP;
void main(){vUv=fuv;vPx=vec2(fuv.x*${FRAME.w}.,(1.-fuv.y)*${FRAME.h}.);vec4 mv=modelViewMatrix*vec4(position,1.);vP=mv.xyz;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*mv;}`;
// Film pixels are the base colour; live light, breathing and channels are added on top and are zero at the handoff.
const projFrag=`uniform sampler2D tFrame;uniform float uBreath,uSpec,uGlow;uniform vec2 uSheen,uSheenDir;uniform vec3 uLight,uPeak,uBright;uniform vec4 uCh[5];uniform float uChA[5];varying vec2 vUv,vPx;varying vec3 vN,vP;
float seg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/max(dot(ba,ba),1e-3),0.,1.);return length(pa-ba*h);}
void main(){vec3 base=texture2D(tFrame,vUv).rgb;float lum=dot(base,vec3(.2126,.7152,.0722));vec3 c=base*(1.+uBreath*smoothstep(.35,.85,lum));
vec3 N=normalize(vN),V=normalize(-vP),H=normalize(normalize(uLight)+V);float band=exp(-pow(dot(vPx-uSheen,uSheenDir)/26.,2.));
float s=uSpec*(band*(.25+.75*smoothstep(.12,.6,lum))+.18*pow(max(dot(N,H),0.),90.));
float ch=0.;for(int i=0;i<5;i++){float d=seg(vPx,uCh[i].xy,uCh[i].zw);ch+=uChA[i]*exp(-d*d/40.);}
c+=uPeak*(s+ch*.6)+uBright*uGlow*(.15+.85*smoothstep(.15,.8,lum));gl_FragColor=vec4(c,1.);}`;
const sideVert='varying vec3 vN,vP;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vP=mv.xyz;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*mv;}';
// Dark titanium / smoked glass walls: only seen once the object turns away from its film pose.
const sideFrag=`uniform vec3 uShadow,uMid,uBright,uLight;varying vec3 vN,vP;
void main(){vec3 N=normalize(vN),V=normalize(-vP);float f=pow(1.-abs(dot(N,V)),2.);vec3 H=normalize(normalize(uLight)+V);float s=pow(max(dot(N,H),0.),24.);gl_FragColor=vec4(mix(uShadow,uMid,.3+.7*f)+uBright*s*.7,1.);}`;
// Additive light strokes (rings, signal paths, floor rings). Occlusion dims the half passing behind the glass orb.
const lineVert=`uniform vec3 uCenter;uniform float uR,uOcc;varying vec2 vUv;varying float vFace,vOcc;
void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vUv=uv;vec3 n=normalize(normalMatrix*normal);vFace=abs(dot(n,normalize(-mv.xyz)));vOcc=1.;
if(uOcc>0.){vec2 onPlane=mv.xy/mv.z*uCenter.z;float inside=1.-smoothstep(uR*.9,uR*1.02,length(onPlane-uCenter.xy));vOcc=1.-step(mv.z,uCenter.z)*inside*uOcc;}gl_Position=projectionMatrix*mv;}`;
const lineFrag=`uniform vec3 uColA,uColB;uniform float uAlpha,uPhase,uHead,uBase,uDash,uSoft;varying vec2 vUv;varying float vFace,vOcc;
void main(){float t=fract(vUv.x-uPhase);float head=pow(t,uHead);float dash=1.;if(uDash>0.){float d=fract(vUv.x*uDash-uPhase*2.);dash=smoothstep(0.,.08,d)*smoothstep(.62,.5,d);}
float b=(uBase+(1.-uBase)*head)*dash;float edge=uSoft>0.?pow(vFace,2.5):1.;gl_FragColor=vec4(mix(uColA,uColB,head),clamp(uAlpha*b*edge*vOcc,0.,1.));}`;
const pointVert='attribute float aSize,aSeed;uniform float uScale;varying float vSeed;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vSeed=aSeed;gl_PointSize=aSize*uScale*(10./-mv.z);gl_Position=projectionMatrix*mv;}';
const pointFrag=`uniform vec3 uColA,uColB;uniform float uAlpha,uTime,uTwinkle;varying float vSeed;
void main(){float r=length(gl_PointCoord-.5);float core=smoothstep(.5,0.,r);float tw=1.-uTwinkle+uTwinkle*(.55+.45*sin(uTime*(1.1+vSeed*2.3)+vSeed*40.));gl_FragColor=vec4(mix(uColA,uColB,vSeed),uAlpha*core*core*tw);}`;
const segVert='attribute float aAlpha;varying float vAlpha;void main(){vAlpha=aAlpha;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const segFrag='uniform vec3 uCol;uniform float uAlpha;varying float vAlpha;void main(){gl_FragColor=vec4(uCol,uAlpha*vAlpha);}';
const uvVert='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
// Live glass: a rim crescent and a soft specular spot that follow the pointer light.
const sheenFrag=`uniform vec2 uLight2;uniform float uAlpha;uniform vec3 uCol;varying vec2 vUv;
void main(){vec2 p=vUv*2.-1.;float r=length(p);float rim=smoothstep(.84,.97,r)*smoothstep(1.02,.97,r);float k=pow(max(dot(normalize(p+1e-4),normalize(uLight2+1e-4)),0.),5.);
float spot=exp(-dot(p-uLight2*.55,p-uLight2*.55)/.03);gl_FragColor=vec4(uCol,uAlpha*(rim*k*.6+spot*.16));}`;
const flatFrag='uniform vec3 uColB;uniform float uAlpha;void main(){gl_FragColor=vec4(uColB,uAlpha);}';
// Floating orb layer: film pixels at rest, the star-free glass once live; clipped at the rim and the pedestal line.
const discFrag=`uniform sampler2D tA,tB;uniform float uLive;uniform vec3 uCut;varying vec2 vUv,vPx;varying vec3 vN,vP;
void main(){vec3 c=mix(texture2D(tA,vUv).rgb,texture2D(tB,vUv).rgb,uLive);float a=(1.-smoothstep(uCut.z-3.,uCut.z+3.,length(vPx-uCut.xy)))*(1.-smoothstep(344.,348.,vPx.y));gl_FragColor=vec4(c,a);}`;

function shader(vertexShader:string,fragmentShader:string,uniforms:Uniforms,additive=false,depth=false){
 return new ShaderMaterial({vertexShader,fragmentShader,uniforms,transparent:additive,...(additive?{blending:AdditiveBlending}:{}),depthTest:depth,depthWrite:depth,toneMapped:false});
}
// Measured frame ellipses lifted into 3D: circles tilted to the measured ratio and rolled to the measured angle.
class RingCurve extends Curve<Vector3>{
 constructor(private r:number,private tilt:number,private roll:number){super();}
 // Depth is compressed so perspective keeps the measured ellipse (the film reads almost orthographic at this range).
 getPoint(t:number,target=new Vector3()){const a=t*Math.PI*2,x=Math.cos(a)*this.r,z=Math.sin(a)*this.r,y=-z*Math.sin(this.tilt),zz=z*Math.cos(this.tilt)*.38,c=Math.cos(this.roll),s=Math.sin(this.roll);return target.set(x*c-y*s,x*s+y*c,zz);}
}
// Floor rings stay in the film's image plane (2.5D), so they overlay the painted rings exactly.
class FlatEllipse extends Curve<Vector3>{
 constructor(private ring:Ring,private depth:number){super();}
 getPoint(t:number,target=new Vector3()){const [u,v]=ringPoint(this.ring,t*360+90);return target.set(...framePoint(u,v,this.depth));}
}
function frameShape(outline:readonly Px[],depth:number){const s=new Shape();outline.forEach(([u,v],i)=>{const [x,y]=framePoint(u,v,depth);if(i)s.lineTo(x,y);else s.moveTo(x,y);});s.closePath();return s;}
// Projection mapping: each vertex samples the film pixel it covers at the canonical pose.
function bakeFrameUv<G extends BufferGeometry>(geo:G){const p=geo.getAttribute('position'),uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){const [u,v]=projectPoint(p.getX(i),p.getY(i),p.getZ(i));uv[i*2]=u/FRAME.w;uv[i*2+1]=1-v/FRAME.h;}geo.setAttribute('fuv',new BufferAttribute(uv,2));return geo;}
// Extruded outline in world space: front cap exactly on the calibrated plane, depth extending away from the camera.
function extrude(outline:readonly Px[],front:number,thickness:number){const g=new ExtrudeGeometry(frameShape(outline,front),{depth:thickness,bevelEnabled:false,steps:1});g.translate(0,0,-front-thickness);return bakeFrameUv(g);}
function pivotAt(p:Vector3,...meshes:Object3D[]){const g=new Group();g.position.copy(p);meshes.forEach(m=>{m.position.copy(p).negate();g.add(m);});return g;}
function disposeTree(root:Object3D){root.traverse(o=>{const m=o as Mesh;m.geometry?.dispose();(Array.isArray(m.material)?m.material:[m.material]).forEach(x=>(x as Material|undefined)?.dispose());});}

export function createWorld(host:WorldHost,signal:AbortSignal):World|null{
 let renderer:WebGLRenderer;
 try{renderer=new WebGLRenderer({canvas:host.canvas,antialias:true,alpha:false,powerPreference:'high-performance',stencil:false});}catch{return null;}
 renderer.setClearColor(0x030303,1);renderer.outputColorSpace=LinearSRGBColorSpace;
 const scene=new Scene(),camera=new PerspectiveCamera(FOV,FRAME.w/FRAME.h,.1,80),loader=new TextureLoader(),bg=[3/255,3/255,3/255];
 let bucket=host.bucket,small=host.small,W=1,H=1,cssW=1,cssH=1,offX=0,offY=0,ratio=1,quality=1,raf=0,last=0,disposed=false,paused=false,overlay=0;
 let pos:CinemaPosition|null=null,active=-1,zoom=1,anchor:Px=[432,248],fps=60,frames=0,acc=0,slow=0,clock=0,wake=0;
 let minify=false;
 const pan=[0,0],cps:(Checkpoint|null)[]=[null,null,null],loading:(Promise<void>|null)[]=[null,null,null],engaged=[false,false,false],selected:(number|null)[]=[null,null,null];
 const st:State={live:0,gate:0,explore:0,converge:0,yaw:0,pitch:0,light:[.3,.4],active:null};
 let userYaw=0,userPitch=0,dragging=false,dragX=0,dragY=0,lastDrag=0,pointer=[0,0],pointerLive=false;
 const plateU:Uniforms={tA:{value:null},tB:{value:null},tN:{value:null},uRect:{value:[0,0,1,1]},uRectN:{value:[0,0,1,1]},uClean:{value:0},uNext:{value:0},uDim:{value:1},uFeather:{value:0},uPulse:{value:0},uTime:{value:0},uPed:{value:[0,0,1,1]},uBg:{value:bg}};
 const plate=new Mesh(new PlaneGeometry(1,1),shader(fullVert,plateFrag,plateU));plate.frustumCulled=false;plate.renderOrder=-10;scene.add(plate);
 const overlayU:Uniforms={tO:{value:null},uRect:{value:[0,0,1,1]},uOverlay:{value:0},uBg:{value:bg}};
 const overlayMesh=new Mesh(new PlaneGeometry(1,1),new ShaderMaterial({vertexShader:fullVert,fragmentShader:overlayFrag,uniforms:overlayU,transparent:true,depthTest:false,depthWrite:false}));overlayMesh.frustumCulled=false;overlayMesh.renderOrder=100;overlayMesh.visible=false;scene.add(overlayMesh);
 const pointScale:Uniform<number>={value:1},time:Uniform<number>={value:0},light:Uniform<number[]>={value:[.3,.4,1]};
 const textures=new Map<string,Promise<Texture>>();
 function texture(url:string){
  let t=textures.get(url);if(t)return t;
  t=new Promise<Texture>((resolve,reject)=>loader.load(url,tex=>{tex.colorSpace=NoColorSpace;tex.magFilter=LinearFilter;tex.generateMipmaps=true;tex.minFilter=minify?LinearMipmapNearestFilter:LinearFilter;resolve(tex);},undefined,()=>reject(new Error('texture '+url))));
  textures.set(url,t);return t;
 }
 const sources=(cp:number)=>({stop:`${host.media}/clip-${cp+1}/${bucket}/${String(LAST[cp]).padStart(4,'0')}.webp`,clean:`${host.media}/world/${NAMES[cp]}-clean-${bucket}.webp`,hole:cp===0?`${host.media}/world/orb-hole-${bucket}.webp`:'',next:cp<2?`${host.media}/clip-${cp+2}/${bucket}/0000.webp`:''});
 function stroke(a:number[],b:number[],o:{head?:number;base?:number;dash?:number;soft?:number;occ?:number;r?:number}={}){
  const u:Uniforms={uColA:{value:a},uColB:{value:b},uAlpha:{value:0},uPhase:{value:0},uHead:{value:o.head??6},uBase:{value:o.base??.35},uDash:{value:o.dash??0},uSoft:{value:o.soft??0},uOcc:{value:o.occ??0},uR:{value:o.r??1},uCenter:{value:[0,0,-10]}};
  return {mat:shader(lineVert,lineFrag,u,true),u};
 }
 function points(positions:number[],sizes:number[],seeds:number[],twinkle:number){
  const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));g.setAttribute('aSize',new BufferAttribute(new Float32Array(sizes),1));g.setAttribute('aSeed',new BufferAttribute(new Float32Array(seeds),1));
  const u:Uniforms={uColA:{value:col.bright},uColB:{value:col.peak},uAlpha:{value:0},uTime:time,uTwinkle:{value:twinkle},uScale:pointScale};
  const p=new Points(g,shader(pointVert,pointFrag,u,true));p.frustumCulled=false;return {p,u,g};
 }
 function filmMaterials(frame:Texture){
  const front:Uniforms={tFrame:{value:frame},uBreath:{value:0},uSpec:{value:0},uGlow:{value:0},uLight:light,uPeak:{value:col.peak},uBright:{value:col.bright},uCh:{value:new Array(20).fill(-99)},uChA:{value:[0,0,0,0,0]},uSheen:{value:[-999,-999]},uSheenDir:{value:[.88,.48]}};
  return {front,film:shader(projVert,projFrag,front,false,true),side:()=>shader(sideVert,sideFrag,{uShadow:{value:col.shadow},uMid:{value:col.mid},uBright:{value:col.bright},uLight:light},false,true)};
 }
 const anchorsOf=(nodes:NodeCal[],depth:number)=>nodes.map(n=>at(n.anchor[0],n.anchor[1],depth+n.depth));

 function buildOrb({stop,clean}:Built):Checkpoint{
  const group=new Group(),C=at(...orbCal.center,orbCal.depth),R=worldSize(orbCal.radius,orbCal.depth),core=new Group();core.position.copy(C);group.add(core);
  const discU:Uniforms={tA:{value:stop},tB:{value:clean},uLive:{value:0},uCut:{value:[orbCal.center[0],orbCal.center[1],orbCal.radius+8]}};
  const discGeo=new PlaneGeometry(R*2.3,R*2.3);discGeo.translate(C.x,C.y,C.z);bakeFrameUv(discGeo);discGeo.translate(-C.x,-C.y,-C.z);
  const disc=new Mesh(discGeo,new ShaderMaterial({vertexShader:projVert,fragmentShader:discFrag,uniforms:discU,transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));disc.position.copy(C);disc.renderOrder=-5;group.add(disc);
  const n=small?360:900,pos:number[]=[],size:number[]=[],seed:number[]=[];
  for(let i=0;i<n;i++){const u=Math.random()*2-1,a=Math.random()*Math.PI*2,r=R*.9*Math.cbrt(Math.random()),q=Math.sqrt(1-u*u);pos.push(Math.cos(a)*q*r,u*r,Math.sin(a)*q*r);size.push(i%23===0?4.2:1.2+Math.random()*1.8);seed.push(Math.random());}
  const stars=points(pos,size,seed,.55);core.add(stars.p);
  // A sparse neural network links each node to its two nearest neighbours inside the glass.
  const seg:number[]=[],alpha:number[]=[],m=small?140:260,d2=(i:number,j:number)=>(pos[i*3]-pos[j*3])**2+(pos[i*3+1]-pos[j*3+1])**2+(pos[i*3+2]-pos[j*3+2])**2;
  for(let i=0;i<m;i++){const near=[] as [number,number][];for(let j=0;j<m;j++)if(j!==i)near.push([d2(i,j),j]);near.sort((a,b)=>a[0]-b[0]);
   for(const [d,j] of near.slice(0,2))if(j>i&&Math.sqrt(d)<R*.42){seg.push(pos[i*3],pos[i*3+1],pos[i*3+2],pos[j*3],pos[j*3+1],pos[j*3+2]);alpha.push(.9,.25);}}
  const netGeo=new BufferGeometry();netGeo.setAttribute('position',new BufferAttribute(new Float32Array(seg),3));netGeo.setAttribute('aAlpha',new BufferAttribute(new Float32Array(alpha),1));
  const netU:Uniforms={uCol:{value:col.bright},uAlpha:{value:0}};core.add(new LineSegments(netGeo,shader(segVert,segFrag,netU,true)));
  const rings=orbCal.rings.map((r,i)=>{
   const curve=new RingCurve(worldSize(r.radius,orbCal.depth),Math.asin(r.ratio),-r.roll*Math.PI/180),g=new Group();g.position.copy(at(r.center[0],r.center[1],orbCal.depth));
   const thin=stroke(col.bright,col.peak,{head:i===0?14:10,base:.3,occ:.72,r:R}),glow=stroke(col.mid,col.bright,{head:10,base:.16,soft:1,occ:.72,r:R});
   for(const s of [thin,glow])s.u.uCenter.value=C.toArray();
   g.add(new Mesh(new TubeGeometry(curve,small?160:280,.0095,5,true),thin.mat),new Mesh(new TubeGeometry(curve,small?100:180,.03,6,true),glow.mat));group.add(g);return {g,thin,glow,cfg:r,y:g.position.y};
  });
  const sheenU:Uniforms={uLight2:{value:[.3,.4]},uAlpha:{value:0},uCol:{value:col.peak}},sheen=new Mesh(new PlaneGeometry(R*2.08,R*2.08),shader(uvVert,sheenFrag,sheenU,true));sheen.position.copy(C).add(new Vector3(0,0,R*.2));group.add(sheen);const sheenY=sheen.position.y;
  // Service nodes: a light marker plus a signal path from the node into the glass.
  const anchors=anchorsOf(orbCal.nodes,orbCal.depth),nodes=anchors.map(p=>{const toward=p.clone().sub(C).normalize().multiplyScalar(R*.98).add(C);
   const path=stroke(col.mid,col.peak,{head:4,base:.15});group.add(new Mesh(new TubeGeometry(new CatmullRomCurve3([p,p.clone().lerp(toward,.5).add(new Vector3(0,.08,.1)),toward]),40,.009,4,false),path.mat));
   const mark=points(p.toArray(),[9],[.8],.25);group.add(mark.p);return {path,mark};});
  return {group,textures:[stop],anchors,depths:orbCal.nodes.map(n=>n.depth),dispose:()=>disposeTree(group),turn:i=>Math.sign(anchors[i].x-C.x)*.22,
   tick(t,_dt,s){
    const L=s.live,spread=1+.1*bump(s.explore,.2,.55,.95)*s.gate;
    // Idle: the orb hovers a few pixels up and down and keeps turning slowly; exactly at rest on the handoff frame.
    const lift=Math.sin(t*.75)*worldSize(4.5,orbCal.depth)*L;// At rest the plate already shows the exact stop frame; the orb layer only exists once it can float.
    disc.visible=L>.001;disc.position.y=C.y+lift;core.position.y=C.y+lift;sheen.position.y=sheenY+lift;discU.uLive.value=L;
    core.rotation.y=s.yaw+t*.035*L;core.rotation.x=s.pitch+Math.sin(t*.4)*.04*L;
    netU.uAlpha.value=.2*L;stars.u.uAlpha.value=.95*L;sheenU.uAlpha.value=L*(.6+.4*Math.min(1,Math.abs(s.yaw)*2));sheenU.uLight2.value=s.light;
    rings.forEach((r,i)=>{const hot=s.active!==null&&s.active%3===i?1:0;r.g.scale.setScalar(spread+(spread-1)*i*.3);r.g.rotation.y=s.yaw*(.4+i*.15);r.g.position.y=r.y+lift;
     for(const m of [r.thin,r.glow])m.u.uPhase.value=t*r.cfg.speed*(1+2*hot);r.thin.u.uAlpha.value=L*(.75+.5*hot);r.glow.u.uAlpha.value=L*(.18+.25*hot);});
    nodes.forEach((n,i)=>{const on=s.active===i?1:0;n.path.u.uAlpha.value=L*(.12+.88*on);n.path.u.uPhase.value=-t*.6;n.mark.u.uAlpha.value=L*(.45+.55*on);});
   }};
 }
 function buildX({stop}:Built):Checkpoint{
  // Layers: a thin film-mapped face, a dark glass body behind it and a light plane between them that only
  // shows when deep inspection separates the layers. At rest they sit flush and read exactly as the film frame.
  const m=filmMaterials(stop),face=new Mesh(extrude(xCal.outline,xCal.depth,.08),[m.film,m.side()]);
  const body=new Mesh(extrude(xCal.outline,xCal.depth+.08,xCal.thickness-.08),[m.side(),m.side()]);
  const coreU:Uniforms={uColB:{value:col.peak},uAlpha:{value:0}},glow=new Mesh(extrude(xCal.outline,xCal.depth+.085,.001),shader(uvVert,flatFrag,coreU,true));
  const P=at(xCal.pivot[0],xCal.pivot[1],xCal.depth+xCal.thickness/2),pivot=pivotAt(P,face,body,glow),group=new Group();group.add(pivot);
  const z0=face.position.z,zb=body.position.z;
  // vec4[] uniforms upload from a flat array.
  xCal.channels.forEach(([a,b],i)=>(m.front.uCh.value as number[]).splice(i*4,4,a[0],a[1],b[0],b[1]));
  const anchors=anchorsOf(xCal.nodes,xCal.depth);
  return {group,textures:[stop],anchors,depths:xCal.nodes.map(n=>n.depth),dispose:()=>disposeTree(group),turn:i=>Math.sign(anchors[i].x-P.x)*.1,
   tick(t,_dt,s){
    const L=s.live,sep=.16*bump(s.explore,.35,.6,.85)*s.gate;
    pivot.rotation.y=s.yaw;pivot.rotation.x=s.pitch;face.position.z=z0+sep;body.position.z=zb-sep*.6;coreU.uAlpha.value=L*sep*2.2;
    // Internal light breathes 0.96 → 1.04, starting from zero at the handoff so the first live frame is the film frame.
    m.front.uBreath.value=.04*Math.sin(t*.9)*L;m.front.uSpec.value=L*(.16+Math.min(.22,Math.abs(s.yaw)*.5));
    // A slow, narrow glint crosses the glass (nudged by the pointer light) instead of brightening the whole face.
    m.front.uSheen.value=[xCal.pivot[0]+(Math.sin(t*.33)*.8+(s.light[0]-.3))*190,xCal.pivot[1]];
    (m.front.uChA.value as number[]).forEach((_,i,a)=>a[i]=L*(s.active===i?1:s.active===null?.08*s.explore:.03));
   }};
 }
 function buildSystem({stop}:Built):Checkpoint{
  const group=new Group(),m=filmMaterials(stop),xMesh=new Mesh(extrude(systemCal.outline,systemCal.depth,systemCal.thickness),[m.film,m.side()]);
  const xPivot=pivotAt(at(systemCal.pivot[0],systemCal.pivot[1],systemCal.depth+systemCal.thickness/2),xMesh);group.add(xPivot);
  (m.front.uCh.value as number[]).splice(0,4,systemCal.core[0],systemCal.core[1]-34,systemCal.core[0],systemCal.core[1]+14);
  const tiles=systemCal.tiles.map(([l,t,r,b])=>{
   const tm=filmMaterials(stop),a=at(l,t,systemCal.depth),c=at(r,b,systemCal.depth),center=at((l+r)/2,(t+b)/2,systemCal.depth);center.z-=.025;
   const geo=new BoxGeometry(c.x-a.x,a.y-c.y,.05);geo.translate(center.x,center.y,center.z);bakeFrameUv(geo);geo.translate(-center.x,-center.y,-center.z);
   const mesh=new Mesh(geo,[tm.side(),tm.side(),tm.side(),tm.side(),tm.film,tm.side()]);mesh.position.copy(center);group.add(mesh);
   return {mesh,u:tm.front,z:center.z,y:center.y,lift:0,label:at((l+r)/2,b+10,systemCal.depth)};
  });
  const paths=systemCal.paths.map(pts=>{const curve=new CatmullRomCurve3(pts.map(([u,v])=>at(u,v,systemCal.depth-.02))),s=stroke(col.mid,col.peak,{head:5,base:.1});group.add(new Mesh(new TubeGeometry(curve,64,.011,4,false),s.mat));return {curve,s};});
  const floors=systemCal.floor.map(r=>{const s=stroke(col.bright,col.peak,{head:3,base:.5,dash:small?10:16}),mesh=new Mesh(new TubeGeometry(new FlatEllipse(r,systemCal.depth),small?120:220,.01,4,true),s.mat);
   const g=pivotAt(at(r.center[0],r.center[1],systemCal.depth),mesh);group.add(g);return {g,s,cfg:r};});
  const modules=systemCal.modules.map((_,i)=>at(...moduleAnchor(i),systemCal.depth));
  // Module signal route: module → along its ring to the front → pedestal → core of the X.
  const routes=systemCal.modules.map(([ring,deg],i)=>{const r=systemCal.floor[ring],delta=((270-deg+540)%360)-180,pts=[modules[i]];
   for(let k=1;k<=8;k++)pts.push(at(...ringPoint(r,deg+delta*k/8),systemCal.depth));pts.push(at(...systemCal.base,systemCal.depth),at(...systemCal.core,systemCal.depth-.05));
   const curve=new CatmullRomCurve3(pts),s=stroke(col.mid,col.peak,{head:4,base:.05});group.add(new Mesh(new TubeGeometry(curve,90,.012,4,false),s.mat));return {curve,s};});
  const markers=points(modules.flatMap(p=>p.toArray()),modules.map(()=>8),modules.map((_,i)=>i/6),.3);group.add(markers.p);
  const pulses=points(new Array(54).fill(0),new Array(18).fill(7),new Array(18).fill(.9),0);group.add(pulses.p);
  const pulsePos=pulses.g.getAttribute('position') as BufferAttribute,tmp=new Vector3();
  return {group,textures:[stop],anchors:[...tiles.map(t=>t.label),...modules],depths:[...tiles.map(()=>0),...modules.map(()=>0)],dispose:()=>disposeTree(group),turn:()=>0,
   tick(t,dt,s){
    const L=s.live,act=clamp(smooth(s.explore/.6)*s.gate+s.converge),spread=1+.06*bump(s.explore,.15,.5,.9)*s.gate,align=smooth((s.explore-.3)/.35);
    xPivot.rotation.y=s.yaw*.6;xPivot.rotation.x=s.pitch*.5;m.front.uBreath.value=.03*Math.sin(t*.9)*L;m.front.uSpec.value=L*(.12+Math.min(.2,Math.abs(s.yaw)*.5));m.front.uSheen.value=[systemCal.pivot[0]+Math.sin(t*.33)*150,systemCal.pivot[1]];
    const tile=s.active!==null&&s.active<4?s.active:-1,mod=s.active!==null&&s.active>=4?s.active-4:-1;
    tiles.forEach((tl,i)=>{tl.lift=damp(tl.lift,i===tile?1:0,6,dt);tl.mesh.position.z=tl.z+.35*tl.lift*L;tl.mesh.position.y=tl.y+Math.sin(t*.7+i*1.7)*worldSize(1.8,systemCal.depth)*L;tl.mesh.rotation.y=(s.light[0]-.3)*.25*tl.lift;tl.mesh.rotation.x=-(s.light[1]-.4)*.18*tl.lift;
     tl.u.uGlow.value=L*(.05*s.converge+.12*tl.lift);tl.u.uSpec.value=L*.25*tl.lift;});
    paths.forEach((p,i)=>{p.s.u.uAlpha.value=L*((i===tile?.95:0)+.55*s.converge+.25*act*(tile<0&&mod<0?1:0));p.s.u.uPhase.value=-t*(.35+.2*i);});
    floors.forEach((f,i)=>{f.g.scale.setScalar(spread+(spread-1)*i*.6);f.s.u.uPhase.value=t*f.cfg.speed*(1+act*2)+(1-align)*i*.37;f.s.u.uAlpha.value=L*(.16+.5*act+.2*(mod>=0?1:0));});
    routes.forEach((r,i)=>{r.s.u.uAlpha.value=L*(i===mod?1:0);r.s.u.uPhase.value=-t*.5;});
    (m.front.uChA.value as number[])[0]=L*(mod>=0||tile>=0?.9:.25*act);markers.u.uAlpha.value=L*(.5+.3*act);
    // Travelling pulses: along the selected path/route, or up every path once the system is converging.
    const lanes=[...(tile>=0?[paths[tile].curve]:[]),...(mod>=0?[routes[mod].curve]:[]),...(s.converge>0||act>.9?paths.map(p=>p.curve):[])];
    for(let k=0;k<18;k++){const c=lanes[k%Math.max(1,lanes.length)];if(!c||k>=lanes.length*3){pulsePos.setXYZ(k,0,0,20);continue;}c.getPointAt((t*.32+Math.floor(k/lanes.length)/3)%1,tmp);pulsePos.setXYZ(k,tmp.x,tmp.y,tmp.z);}
    pulsePos.needsUpdate=true;pulses.u.uAlpha.value=L;
   }};
 }
 const builders=[buildOrb,buildX,buildSystem];
 function prepare(cp:number):Promise<void>{
  if(cps[cp]||disposed)return Promise.resolve();
  if(!loading[cp]){const b=bucket,src=sources(cp);
   loading[cp]=Promise.all([texture(src.stop),texture(src.clean),src.next?texture(src.next):Promise.resolve(null),src.hole?texture(src.hole):Promise.resolve(null)]).then(([stop,clean,next,hole])=>{
    // Plate textures: film stop frame, the live plate (the ORB's has the sphere removed so it can float), next clip.
    if(disposed||b!==bucket)return;const built=builders[cp]({stop,clean});built.textures.push(hole??clean,...(next?[next]:[]));built.group.visible=false;scene.add(built.group);cps[cp]=built;schedule();
   }).catch(()=>{loading[cp]=null;});}
  return loading[cp]!;
 }
 function sizes(){
  const rect=host.screen.getBoundingClientRect(),stage=host.stage.getBoundingClientRect();cssW=Math.max(1,rect.width);cssH=Math.max(1,rect.height);offX=rect.left-stage.left;offY=rect.top-stage.top;
  ratio=Math.min(devicePixelRatio||1,1.5)*quality;W=Math.max(1,Math.round(cssW*ratio));H=Math.max(1,Math.round(cssH*ratio));renderer.setSize(W,H,false);
 }
 // Camera = the film frame: a view offset maps the 864×496 frame onto the same contain-fit rectangle as the film
 // canvas; zoom and pan move that rectangle, so plate and geometry always stay registered.
 function layout(z:number,ax:Px,shift=0){
  const src=bucket===640?{w:640,h:368}:FRAME,r=frameRect(W,H,src,small&&pos?mobileRoi(pos.clip,pos.progress,pos.hold):0),sx=r.w/FRAME.w,sy=r.h/FRAME.h;
  // Match the film canvas' resampling: plain bilinear down to half size, mipmapped below it.
  if(r.w/src.w<.5!==minify){minify=!minify;textures.forEach(p=>void p.then(tex=>{tex.minFilter=minify?LinearMipmapNearestFilter:LinearFilter;tex.needsUpdate=true;}));}
  const zr={x:r.x+ax[0]*sx*(1-z)+pan[0]+shift,y:r.y+ax[1]*sy*(1-z)+pan[1],w:r.w*z,h:r.h*z};
  camera.aspect=zr.w/zr.h;camera.setViewOffset(zr.w,zr.h,-zr.x,-zr.y,W,H);camera.updateProjectionMatrix();
  plateU.uRect.value=[zr.x,H-zr.y-zr.h,zr.w,zr.h];plateU.uRectN.value=overlayU.uRect.value=[r.x,H-r.y-r.h,r.w,r.h];pointScale.value=sx*z;
 }
 function place(cp:number,c:Checkpoint){
  const v=new Vector3();
  host.place(cp,c.anchors.map((p,i)=>{v.copy(p).project(camera);const d=c.depths[i];return {x:offX+(v.x+1)/2*cssW+pan[0]/ratio*d*.6,y:offY+(1-v.y)/2*cssH+pan[1]/ratio*d*.6,depth:d};}));
 }
 function frame(now:number){
  raf=0;if(disposed||paused||!pos)return;
  const dt=Math.min(.05,last?(now-last)/1000:.016);last=now;
  if(!document.body.classList.contains('motion-paused'))clock+=dt;time.value=clock;
  const p=pos,cp=p.checkpoint,c=cp>=0?cps[cp]:null;
  if(cp!==active){cps.forEach((x,i)=>{if(x)x.group.visible=i===cp;});active=cp;wake=0;userYaw=userPitch=0;}
  if(!c||p.world<=0){host.canvas.style.opacity='0';host.canvas.dataset.visible='false';return;}
  const ph=p.phase;
  // Scroll owns the pose gate (deterministic both ways); interaction only adds on top of it.
  const gate=ph.endsWith('_ARRIVAL')?smooth(p.local):ph.endsWith('_RELEASE')&&cp<2?1-smooth(p.local/.45):1;
  // Idle life starts as soon as the object has arrived (it is zero at the handoff frame itself).
  wake=damp(wake,engaged[cp]||p.explore>0||ph==='CONVERGENCE'||ph==='CONTENT'?1:0,3.2,dt);
  if(!dragging&&now-lastDrag>900){userYaw=damp(userYaw,0,.9,dt);userPitch=damp(userPitch,0,1.4,dt);}
  const inspect=[.35*bump(p.explore,.3,.6,.9),.28*bump(p.explore,.4,.65,.9),.12*bump(p.explore,.3,.6,.9)][cp];
  const look=pointerLive?[pointer[0]*.08,pointer[1]*.05]:[0,0],sel=selected[cp],turn=sel===null?0:c.turn(sel);
  st.yaw=damp(st.yaw,(userYaw+inspect+Math.sin(clock*.21)*.02*wake+look[0]+turn)*gate,6,dt);st.pitch=damp(st.pitch,(userPitch+look[1])*gate,6,dt);
  st.light=[.3+pointer[0]*.6,.4-pointer[1]*.5];light.value=[st.light[0],st.light[1],1];
  st.live=wake*gate;st.gate=gate;st.explore=p.explore;st.converge=p.converge;st.active=sel;
  const cal=[orbCal,xCal,systemCal][cp];anchor=cal.zoom.anchor;
  const pull=cp===2?smooth(p.converge):0;
  zoom=(1+(cal.zoom.explore-1)*smooth(p.explore/.45)*gate)*(ph==='X_RELEASE'?1+(xCal.zoom.release-1)*smooth(p.local/.5):1)*(1+(systemCal.zoom.converge-1)*(small?.3:1)*pull);
  for(const i of [0,1])pan[i]=damp(pan[i],pointerLive?-pointer[i]*(i?4:6)*ratio*gate:0,4,dt);
  layout(zoom,anchor,small?0:W*systemCal.zoom.shift*pull);plateU.uFeather.value=.07*pull;
  plateU.tA.value=c.textures[0];plateU.tB.value=c.textures[1];plateU.tN.value=c.textures[2]??c.textures[0];
  plateU.uPulse.value=cp===0?0:st.live*(cp===1?1:.7);plateU.uTime.value=clock;plateU.uPed.value=cp===1?[430,212,250,200]:[428,318,130,105];
  plateU.uClean.value=st.live;plateU.uNext.value=cp<2&&ph.endsWith('_RELEASE')?smooth((p.local-.18)/.32):0;plateU.uDim.value=1-.16*smooth(p.converge);
  c.tick(clock,dt,st);
  overlayU.tO.value=c.textures[0];overlayU.uOverlay.value=overlay;overlayMesh.visible=overlay>0;
  renderer.render(scene,camera);place(cp,c);
  host.canvas.style.opacity=String(p.world);host.canvas.dataset.visible='true';
  // Adaptive quality: step resolution down when frames run long; hand back to the film stills if even the floor is too slow.
  frames++;acc+=dt;if(acc>1){fps=frames/acc;frames=0;acc=0;
   // Full resolution by default: the live layer must be exactly as sharp as the film at the handoff.
   if(fps<32&&quality>.56){quality=Math.max(.55,quality*.85);sizes();}else if(fps>56&&quality<1){quality=Math.min(1,quality*1.08);sizes();}
   slow=fps<18&&quality<=.56?slow+1:0;if(slow>2){host.fail('slow');return;}}
  schedule();
 }
 function schedule(){if(!raf&&!disposed&&!paused&&!document.hidden)raf=requestAnimationFrame(frame);}
 // Pointer: horizontal drag rotates (vertical touch scrolling stays native through touch-action), fine pointers add parallax.
 const interactive='a,button,input,textarea,select,label,.cinema-copy,.cinema-assistant-panel,.cinema-controls,.world-nodes,.world-tags';
 host.stage.addEventListener('pointerdown',e=>{if(active<0||!e.isPrimary||(e.target as Element).closest(interactive))return;
  // A mouse drag turns the object instead of selecting the copy around it (touch keeps native vertical scrolling).
  if(e.pointerType==='mouse')e.preventDefault();dragging=true;dragX=e.clientX;dragY=e.clientY;engaged[active]=true;schedule();},{signal});
 window.addEventListener('pointermove',e=>{
  const r=host.stage.getBoundingClientRect();
  if(e.pointerType==='mouse'&&e.clientY>=r.top&&e.clientY<=r.bottom){pointer=[clamp((e.clientX-r.left)/r.width*2-1,-1,1),clamp((e.clientY-r.top)/r.height*2-1,-1,1)];pointerLive=true;if(active>=0&&(pos?.world??0)>.5)engaged[active]=true;schedule();}
  if(!dragging)return;const dx=e.clientX-dragX,dy=e.clientY-dragY;dragX=e.clientX;dragY=e.clientY;lastDrag=performance.now();if(Math.abs(dx)>1)host.dragged?.(active);
  const lim=[1.4,.55,.3][Math.max(0,active)];userYaw=clamp(userYaw+dx*.006,-lim,lim);userPitch=clamp(userPitch+dy*.0025,active===0?-.28:-.08,active===0?.28:.08);schedule();
 },{signal,passive:true});
 for(const type of ['pointerup','pointercancel'])window.addEventListener(type,()=>{if(dragging)lastDrag=performance.now();dragging=false;},{signal});
 host.stage.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){pointerLive=false;pointer=[0,0];}},{signal});
 host.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();host.fail('context');},{signal});
 document.addEventListener('visibilitychange',()=>{last=0;schedule();},{signal});
 sizes();
 const release=(t:Promise<Texture>)=>void t.then(x=>x.dispose()).catch(()=>{});
 const world:World={
  prepare,ready:cp=>!!cps[cp],
  update(p){pos=p;if(p.checkpoint>=0)void prepare(p.checkpoint);if(p.checkpoint>=0&&p.checkpoint<2&&p.explore>.2)void prepare(p.checkpoint+1);if(p.world<=0){host.canvas.style.opacity='0';host.canvas.dataset.visible='false';}schedule();},
  resize(b,s){small=s;if(b!==bucket){bucket=b;cps.forEach((c,i)=>{if(c){scene.remove(c.group);c.dispose();cps[i]=null;}});textures.forEach(release);textures.clear();loading.fill(null);}sizes();schedule();},
  pause(v){paused=v;if(v){cancelAnimationFrame(raf);raf=0;}else{last=0;schedule();}},
  select(cp,node){selected[cp]=node;if(node!==null)engaged[cp]=true;schedule();},
  engage(){if(active>=0)engaged[active]=true;schedule();},
  stats:()=>({phase:pos?.phase??'',checkpoint:active,live:st.live,zoom,yaw:st.yaw,pitch:st.pitch,fov:FOV,anchor,light:st.light,quality,fps,engaged:active>=0&&engaged[active],overlay}),
  debug(o){overlay=o;schedule();},
  dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);cps.forEach(c=>c?.dispose());textures.forEach(release);disposeTree(scene);renderer.dispose();renderer.forceContextLoss();},
 };
 signal.addEventListener('abort',()=>world.dispose(),{once:true});
 return world;
}
