// X Deck: the live 3D scene behind the homepage story. One silver command terminal stays on screen for all three
// acts; the concierge hologram above it operates it. Everything is procedural (no model or texture downloads) and
// every scroll-driven value is a pure function of the story position, so reverse scrolling replays it exactly.
import {ACESFilmicToneMapping,AdditiveBlending,BackSide,BoxGeometry,BufferAttribute,BufferGeometry,CanvasTexture,CircleGeometry,Color,CylinderGeometry,DirectionalLight,DoubleSide,ExtrudeGeometry,FogExp2,Group,InstancedMesh,Matrix4,Mesh,MeshBasicMaterial,MeshPhysicalMaterial,MeshStandardMaterial,Object3D,PerspectiveCamera,Plane,PlaneGeometry,PMREMGenerator,PointLight,Points,PointsMaterial,Quaternion,Raycaster,RingGeometry,Scene,ShaderMaterial,Shape,SphereGeometry,SRGBColorSpace,TorusGeometry,Vector2,Vector3,WebGLRenderer,type Material,type Texture} from 'three';
import {smooth,type StoryPosition} from '../shared/cinema-timeline';
import {drawModule,MODULE_COUNT} from './deck-modules';

// Brand palette: cool silver from the hero X, teal from the Digital X film, a little violet in the reflections.
const SILVER=0xcfd6e0,TEAL=0x37e6d0,COOL=0xabbee2,PEAK=0xf1f7fc,BG=0x030303;
const TOP=.645;// height of the deck's glass top
export type NodePlacement={x:number;y:number;depth:number;side:'left'|'right'|'below'};
export type DeckHost={
 canvas:HTMLCanvasElement;screen:HTMLElement;stage:HTMLElement;small:boolean;
 /** Stage-pixel anchors for the spatial service links of checkpoint `cp`. */
 place(cp:number,pts:NodePlacement[]):void;
 /** The scene picked a service (hover, tap or click) or released it. */
 hover(cp:number,node:number|null):void;
 /** The visitor clicked the hologram: open the real concierge. */
 talk():void;
 fail(reason:string):void;
 dragged?(cp:number):void;
};
export type DeckStats={phase:string;quality:number;fps:number;active:[number,number]|null;locked:boolean;yaw:number;power:number};
export type Deck={update(p:StoryPosition):void;resize(small:boolean):void;pause(paused:boolean):void;select(cp:number,node:number|null):void;stats():DeckStats;frame():void;dispose():void};

const clamp=(v:number,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
// X outline in film pixels (the same silhouette as the hero mark), normalised around its pivot.
const X_OUTLINE:[number,number][]=[[262,88],[358,83],[425,172],[503,82],[598,90],[460,221],[565,350],[492,349],[422,262],[350,349],[277,349],[392,220]];
const X_PIVOT:[number,number]=[430,220],X_SCALE=1/135;
const X_TIPS:[number,number][]=[[1.16,.95],[-1.16,.95],[-1.1,-.94],[1.02,-.94]];
const PORTS:[number,number][]=[[-1.22,-.6],[1.22,-.6],[1.22,.6],[-1.22,.6]];
// Service drones: launched from the ports in act 1, they hover where their labels sit (deck space) and the hologram
// reaches for them. Order matches the AI service links: upper left, upper right, lower right, lower left.
const DRONES:[number,number,number,'left'|'right'][]=[[-1.3,TOP+2,.1,'left'],[1.3,TOP+2,.1,'right'],[1,.38,3,'right'],[-1,.38,3,'left']];
// Module mounts: angle from the front (degrees), radius and height. Rear modules stand higher so all six stay in view.
const MOUNTS:[number,number,number][]=[[-118,3.7,3.05],[-80,4.5,2],[-44,4.3,.98],[44,4.3,.98],[80,4.5,2],[118,3.7,3.05]];
const KEYS=14,SLOPE=Math.atan2(.3,.36);

type CameraKey={pos:[number,number,number];target:[number,number,number];off:number};
const CAMERA:CameraKey[]=[
 {pos:[0,2.9,12.4],target:[0,1.1,0],off:-.01},// opening: the dark deck
 {pos:[0,2.6,11],target:[0,1.25,0],off:-.01},// act 1: the hologram
 {pos:[0,2.7,10.4],target:[0,1.8,0],off:.07},// act 2: the X
 {pos:[0,4.4,15.2],target:[0,1.9,0],off:.05},// act 3: the modules
 {pos:[0,4.6,17.6],target:[0,1.85,0],off:.17},// closing: the system slides right for the copy
];

function octagon(hw:number,hd:number,c:number){
 const s=new Shape();
 s.moveTo(-hw+c,-hd);s.lineTo(hw-c,-hd);s.lineTo(hw,-hd+c);s.lineTo(hw,hd-c);s.lineTo(hw-c,hd);s.lineTo(-hw+c,hd);s.lineTo(-hw,hd-c);s.lineTo(-hw,-hd+c);s.closePath();
 return s;
}
function slab(shape:Shape,depth:number,bevel:number){
 const g=new ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,curveSegments:8});
 g.rotateX(-Math.PI/2);return g;
}
function additive(color:number,opacity=1):MeshBasicMaterial{return new MeshBasicMaterial({color,transparent:true,opacity,blending:AdditiveBlending,depthWrite:false,toneMapped:false,side:DoubleSide,fog:false});}
// Floor fade: opaque under the deck, gone before the edge, so the floor never shows a rim against the dark hall.
function fadeTexture(){
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d')!;
 const g=x.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,'#fff');g.addColorStop(.45,'#fff');g.addColorStop(.9,'#000');g.addColorStop(1,'#000');
 x.fillStyle=g;x.fillRect(0,0,256,256);return new CanvasTexture(c);
}
function radialTexture(){
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d')!;
 const g=x.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.45)');g.addColorStop(.6,'rgba(255,255,255,.1)');g.addColorStop(1,'rgba(255,255,255,0)');
 x.fillStyle=g;x.fillRect(0,0,256,256);return new CanvasTexture(c);
}
// The glass top's light: traces from the X slot to the four ports, drawn once and used as an emissive map.
function circuitTexture(hw:number,hd:number){
 const W=1024,H=Math.round(W*hd/hw),c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d')!;
 const px=(u:number)=>(u+hw)/(2*hw)*W,py=(v:number)=>(v+hd)/(2*hd)*H;
 x.fillStyle='#000';x.fillRect(0,0,W,H);x.lineCap='round';x.lineJoin='round';
 x.strokeStyle='rgba(120,160,190,.16)';x.lineWidth=1;
 for(let i=1;i<24;i++){x.beginPath();x.moveTo(i*W/24,0);x.lineTo(i*W/24,H);x.stroke();}
 for(let i=1;i<14;i++){x.beginPath();x.moveTo(0,i*H/14);x.lineTo(W,i*H/14);x.stroke();}
 x.shadowColor='#37e6d0';x.shadowBlur=14;x.strokeStyle='#5cf0dc';x.lineWidth=3;
 PORTS.forEach(([u,v])=>{const sx=Math.sign(u),sy=Math.sign(v);x.beginPath();x.moveTo(px(sx*.34),py(sy*.34));x.lineTo(px(sx*.62),py(sy*.6));x.lineTo(px(u-sx*.16),py(v));x.stroke();x.beginPath();x.arc(px(u),py(v),26,0,Math.PI*2);x.stroke();});
 x.strokeStyle='rgba(92,240,220,.55)';x.lineWidth=2;x.strokeRect(22,22,W-44,H-44);
 for(let i=0;i<9;i++){x.beginPath();x.moveTo(px(-1.05+i*.26),py(-.78));x.lineTo(px(-1.05+i*.26)+26,py(-.78));x.stroke();}
 x.shadowColor='#dfe9ff';x.shadowBlur=22;x.strokeStyle='#eef4ff';x.lineWidth=13;
 x.beginPath();x.moveTo(px(-.36),py(-.36));x.lineTo(px(.36),py(.36));x.moveTo(px(.36),py(-.36));x.lineTo(px(-.36),py(.36));x.stroke();
 x.shadowBlur=10;x.lineWidth=2;x.beginPath();x.arc(px(0),py(0),px(.62)-px(0),0,Math.PI*2);x.stroke();
 const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;t.anisotropy=4;return t;
}
// Studio reflections: a few bright panels in a dark room, so the silver reads as polished metal with brand accents.
function environment(renderer:WebGLRenderer):Texture{
 const room=new Scene(),panel=(w:number,h:number,r:number,g:number,b:number)=>new Mesh(new PlaneGeometry(w,h),new MeshBasicMaterial({color:new Color(r,g,b),side:DoubleSide}));
 // A soft studio dome (bright overhead, dark floor) gives the metal something to reflect everywhere; the panels add
 // the sharp highlights and the brand colours.
 room.add(new Mesh(new SphereGeometry(30,32,24),new ShaderMaterial({side:BackSide,
  vertexShader:`varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`varying vec3 vP;void main(){float h=vP.y;vec3 c=mix(vec3(.012,.015,.022),vec3(.2,.235,.3),smoothstep(-.15,.35,h));c=mix(c,vec3(.9,.98,1.12),smoothstep(.45,1.,h));gl_FragColor=vec4(c,1.);}`})));
 const key=panel(11,5,6.4,6.9,7.8);key.position.set(0,8,2);key.rotation.x=Math.PI/2;room.add(key);
 const teal=panel(1.4,8,.3,4.6,4);teal.position.set(-9,2.5,1);teal.rotation.y=Math.PI/2;room.add(teal);
 const violet=panel(1.2,7,2.2,1.5,5.2);violet.position.set(9,2.5,-2);violet.rotation.y=-Math.PI/2;room.add(violet);
 const fill=panel(16,6,.95,1.05,1.25);fill.position.set(0,3,11);room.add(fill);
 const rim=panel(14,1.1,5,5.6,6.4);rim.position.set(0,5,-10);room.add(rim);
 const low=panel(10,.4,1.6,1.9,2.4);low.position.set(0,.4,9);room.add(low);
 const pmrem=new PMREMGenerator(renderer),texture=pmrem.fromScene(room,.03).texture;pmrem.dispose();
 room.traverse(o=>{if(o instanceof Mesh){o.geometry.dispose();(o.material as Material).dispose();}});
 return texture;
}

export function createDeck(host:DeckHost,signal:AbortSignal):Deck|null{
 let renderer:WebGLRenderer;
 try{renderer=new WebGLRenderer({canvas:host.canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}catch{return null;}
 renderer.setClearColor(BG,1);renderer.toneMapping=ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.outputColorSpace=SRGBColorSpace;renderer.localClippingEnabled=true;
 const disposables:{dispose():void}[]=[];
 const keep=<T extends {dispose():void}>(x:T)=>{disposables.push(x);return x;};
 const scene=new Scene();scene.fog=new FogExp2(BG,.03);
 const env=keep(environment(renderer));scene.environment=env;
 const camera=new PerspectiveCamera(32,1,.1,80);
 const sun=new DirectionalLight(0xdfe8ff,1.1);sun.position.set(-4,7,6);scene.add(sun);
 const holoLight=new PointLight(TEAL,0,9,1.6);scene.add(holoLight);

 // ---- materials ----
 const brushed=keep(new MeshPhysicalMaterial({color:SILVER,metalness:1,roughness:.3,clearcoat:.35,clearcoatRoughness:.25,envMapIntensity:1.15}));
 const polished=keep(new MeshPhysicalMaterial({color:0xe3e9f1,metalness:1,roughness:.09,clearcoat:.6,clearcoatRoughness:.06,envMapIntensity:1.35}));
 const dark=keep(new MeshStandardMaterial({color:0x0a0d12,metalness:.9,roughness:.36}));
 const glow=keep(radialTexture());

 // ---- floor ----
 const floor=new Mesh(keep(new CircleGeometry(18,72)),keep(new MeshStandardMaterial({color:0x030406,metalness:.7,roughness:.5,envMapIntensity:.32,alphaMap:keep(fadeTexture()),transparent:true})));floor.renderOrder=-1;floor.rotation.x=-Math.PI/2;scene.add(floor);
 const floorGlowMat=keep(additive(COOL,0));floorGlowMat.map=glow;
 const floorGlow=new Mesh(keep(new PlaneGeometry(13,13)),floorGlowMat);floorGlow.rotation.x=-Math.PI/2;floorGlow.position.y=.012;scene.add(floorGlow);
 const ringMat=keep(additive(COOL,0));
 [3.5,4.9,6.5].forEach((r,i)=>{const m=new Mesh(keep(new RingGeometry(r,r+.014+i*.004,128)),ringMat);m.rotation.x=-Math.PI/2;m.position.y=.014;scene.add(m);});

 // ---- the deck ----
 const rig=new Group();scene.add(rig);
 const plinth=new Mesh(keep(new CylinderGeometry(2.72,2.86,.12,96)),dark);plinth.position.y=.06;rig.add(plinth);
 const plinthLineMat=keep(additive(TEAL,0));
 const plinthLine=new Mesh(keep(new TorusGeometry(2.73,.012,8,128)),plinthLineMat);plinthLine.rotation.x=Math.PI/2;plinthLine.position.y=.122;rig.add(plinthLine);
 const body=new Mesh(keep(slab(octagon(2,1.25,.45),.3,.035)),brushed);body.position.y=.155;rig.add(body);
 const tier=new Mesh(keep(slab(octagon(1.72,1,.38),.1,.025)),polished);tier.position.y=.515;rig.add(tier);
 const seamMat=keep(additive(TEAL,0));
 const seam=new Mesh(keep(slab(octagon(1.745,1.025,.39),.014,0)),seamMat);seam.position.y=.492;rig.add(seam);
 const GW=1.56,GD=.86;
 const glassGeometry=keep(slab(octagon(GW,GD,.3),.012,0));
 {// Map the emissive traces across the top face.
  const p=glassGeometry.attributes.position,uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){uv[i*2]=(p.getX(i)+GW)/(2*GW);uv[i*2+1]=(-p.getZ(i)+GD)/(2*GD);}
  glassGeometry.setAttribute('uv',new BufferAttribute(uv,2));
 }
 const circuit=keep(circuitTexture(GW,GD));
 const glassMat=keep(new MeshPhysicalMaterial({color:0x04060a,metalness:.5,roughness:.07,clearcoat:1,clearcoatRoughness:.04,emissive:new Color(0xffffff),emissiveMap:circuit,emissiveIntensity:0,envMapIntensity:1.1}));
 const glass=new Mesh(glassGeometry,glassMat);glass.position.y=TOP-.012;rig.add(glass);
 // Ports: the four emitters the hologram reaches for in act 1.
 const portGeometry=keep(new CylinderGeometry(.105,.12,.035,32)),portRingGeometry=keep(new RingGeometry(.062,.098,32));
 const ports=PORTS.map(([x,z])=>{
  const g=new Group();g.position.set(x,TOP,z);
  const cap=new Mesh(portGeometry,polished);cap.position.y=.012;g.add(cap);
  const mat=keep(additive(TEAL,0)),ring=new Mesh(portRingGeometry,mat);ring.rotation.x=-Math.PI/2;ring.position.y=.034;g.add(ring);
  const haloMat=keep(additive(TEAL,0));haloMat.map=glow;const halo=new Mesh(keep(new PlaneGeometry(.9,.9)),haloMat);halo.rotation.x=-Math.PI/2;halo.position.y=.04;g.add(halo);
  rig.add(g);return {group:g,cap,mat,haloMat,level:0};
 });
 const droneGeometry=keep(new CylinderGeometry(.17,.11,.07,24)),droneRingGeometry=keep(new TorusGeometry(.25,.012,8,48)),dronePickGeometry=keep(new SphereGeometry(.36,10,8)),pickMat=keep(new MeshBasicMaterial({colorWrite:false,depthWrite:false}));
 const drones=DRONES.map(([x,y,z])=>{
  const group=new Group(),hull=new Mesh(droneGeometry,polished);group.add(hull);
  const mat=keep(additive(TEAL,0)),ring=new Mesh(droneRingGeometry,mat);ring.rotation.x=Math.PI/2;group.add(ring);
  const haloMat=keep(additive(TEAL,0));haloMat.map=glow;const halo=new Mesh(keep(new PlaneGeometry(1.5,1.5)),haloMat);group.add(halo);
  const pick=new Mesh(dronePickGeometry,pickMat);group.add(pick);group.visible=false;rig.add(group);
  return {group,ring,mat,haloMat,halo,pick,rest:new Vector3(x,y,z),level:0};
 });
 // Key bank on the front console: keys dip under the cursor and a click sends a ripple down the row.
 const keyMat=keep(new MeshPhysicalMaterial({color:0xffffff,metalness:1,roughness:.2,clearcoat:.4,envMapIntensity:1.2}));
 const keys=new InstancedMesh(keep(new BoxGeometry(.15,.05,.115)),keyMat,KEYS);rig.add(keys);
 const keyLevel=new Float32Array(KEYS),keyX=(i:number)=>(i-(KEYS-1)/2)*.19;
 const keyGlowMat=keep(additive(TEAL,.0));keyGlowMat.map=glow;
 const keyGlow=new Mesh(keep(new PlaneGeometry(.5,.34)),keyGlowMat);keyGlow.rotation.x=-Math.PI/2+SLOPE;keyGlow.visible=false;rig.add(keyGlow);
 // Front console: a sloped key panel, the part of the terminal a hand would rest on.
 const wedgeShape=new Shape();wedgeShape.moveTo(0,0);wedgeShape.lineTo(.4,0);wedgeShape.lineTo(.4,.07);wedgeShape.lineTo(.04,.37);wedgeShape.lineTo(0,.37);wedgeShape.closePath();
 const wedgeGeometry=keep(new ExtrudeGeometry(wedgeShape,{depth:2.9,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2}));wedgeGeometry.translate(0,0,-1.45);wedgeGeometry.rotateY(-Math.PI/2);
 const gunmetal=keep(new MeshPhysicalMaterial({color:0x39414d,metalness:1,roughness:.34,clearcoat:.3,clearcoatRoughness:.3,envMapIntensity:1.1}));
 const wedge=new Mesh(wedgeGeometry,gunmetal);wedge.position.set(0,.12,1.22);rig.add(wedge);
 // Rear spine and the two projector pylons that frame the hologram.
 const spine=new Mesh(keep(new BoxGeometry(2.5,.2,.2)),polished);spine.position.set(0,.59,-1.08);rig.add(spine);
 const spineLine=new Mesh(keep(new BoxGeometry(2.3,.018,.018)),seamMat);spineLine.position.set(0,.66,-.975);rig.add(spineLine);
 const pylonGeometry=keep(slab(octagon(.13,.13,.045),1.5,.012)),pylonLineGeometry=keep(new BoxGeometry(.02,1.3,.012)),pylonCapGeometry=keep(new CylinderGeometry(.05,.13,.1,8));
 [-1,1].forEach(side=>{
  const pylon=new Mesh(pylonGeometry,brushed);pylon.position.set(side*1.62,.5,-1.05);rig.add(pylon);
  const line=new Mesh(pylonLineGeometry,seamMat);line.position.set(side*1.62-side*.135,1.25,-1.05);line.rotation.y=Math.PI/2;rig.add(line);
  const cap=new Mesh(pylonCapGeometry,polished);cap.position.set(side*1.62,2.07,-1.05);rig.add(cap);
 });
 const fins=keep(new BoxGeometry(.05,.16,.5));
 [-1,1].forEach(s=>[-.3,0,.3].forEach(z=>{const f=new Mesh(fins,dark);f.position.set(s*1.99,.32,z*1.6);rig.add(f);}));

 // ---- the gate and the X ----
 const gateMat=keep(additive(PEAK,0));gateMat.map=glow;
 const gate=new Mesh(keep(new PlaneGeometry(3.4,3.4)),gateMat);gate.rotation.x=-Math.PI/2;gate.position.y=TOP+.006;rig.add(gate);
 const xShape=new Shape();X_OUTLINE.forEach(([u,v],i)=>{const x=(u-X_PIVOT[0])*X_SCALE,y=-(v-X_PIVOT[1])*X_SCALE;if(i)xShape.lineTo(x,y);else xShape.moveTo(x,y);});xShape.closePath();
 const xGeometry=keep(new ExtrudeGeometry(xShape,{depth:.4,bevelEnabled:true,bevelSize:.05,bevelThickness:.05,bevelSegments:4}));xGeometry.translate(0,0,-.2);
 const xMat=keep(new MeshPhysicalMaterial({color:0xe6ecf4,metalness:1,roughness:.1,clearcoat:.7,clearcoatRoughness:.05,envMapIntensity:1.5,clippingPlanes:[new Plane(new Vector3(0,1,0),-(TOP+.004))]}));
 const xPivot=new Group(),xMesh=new Mesh(xGeometry,xMat);xPivot.add(xMesh);xPivot.visible=false;rig.add(xPivot);
 const X_REST=TOP+1.32,X_START=TOP-1.2;
 const xGlowMat=keep(additive(TEAL,0));xGlowMat.map=glow;
 const xGlow=new Mesh(keep(new PlaneGeometry(4.4,4.4)),xGlowMat);xGlow.position.set(0,X_REST,-.5);rig.add(xGlow);

 // ---- the hologram ----
 const holo=new Group();rig.add(holo);
 const holoUniforms={uTime:{value:0},uAlpha:{value:0},uPulse:{value:0}};
 const count=host.small?900:1600,sphere=new Float32Array(count*3);
 for(let i=0;i<count;i++){const y=1-2*(i+.5)/count,r=Math.sqrt(1-y*y),a=i*2.399963;sphere[i*3]=Math.cos(a)*r;sphere[i*3+1]=y;sphere[i*3+2]=Math.sin(a)*r;}
 const dotsGeometry=keep(new BufferGeometry());dotsGeometry.setAttribute('position',new BufferAttribute(sphere,3));
 const dotsMat=keep(new ShaderMaterial({uniforms:holoUniforms,transparent:true,depthWrite:false,blending:AdditiveBlending,
  vertexShader:`uniform float uTime;uniform float uPulse;varying float vA;
   void main(){vec3 p=position*(.62+.02*sin(uTime*1.7+position.y*9.)+.05*uPulse*sin(uTime*9.+position.x*14.));
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
    float f=fract(sin(dot(position.xy,vec2(12.9898,78.233)))*43758.5453);
    vA=.55+.45*sin(uTime*(1.2+f*2.4)+f*40.);gl_PointSize=(1.4+2.2*f)*(9./-mv.z);}`,
  fragmentShader:`uniform float uAlpha;varying float vA;
   void main(){vec2 d=gl_PointCoord-.5;float a=smoothstep(.5,.05,length(d))*vA*uAlpha;gl_FragColor=vec4(mix(vec3(.22,.9,.82),vec3(.95,.98,1.),vA*.7)*a,a);}`}));
 holo.add(new Points(dotsGeometry,dotsMat));
 const shellMat=keep(new ShaderMaterial({uniforms:holoUniforms,transparent:true,depthWrite:false,blending:AdditiveBlending,
  vertexShader:`varying vec3 vN;varying vec3 vV;varying float vY;
   void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);vY=position.y;gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform float uTime;uniform float uAlpha;uniform float uPulse;varying vec3 vN;varying vec3 vV;varying float vY;
   void main(){float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.2);float scan=.7+.3*sin(vY*70.-uTime*5.);
    float a=(f*1.25+.07)*scan*uAlpha*(1.+uPulse*.6);gl_FragColor=vec4(mix(vec3(.16,.85,.78),vec3(.9,.96,1.),f)*a,a);}`}));
 holo.add(new Mesh(keep(new SphereGeometry(.56,48,32)),shellMat));
 const ringGeometry=keep(new TorusGeometry(.8,.006,6,96)),holoRingMat=keep(additive(COOL,0));
 const holoRings=[0,1,2].map(i=>{const m=new Mesh(ringGeometry,holoRingMat);m.scale.setScalar(1+i*.13);holo.add(m);return m;});
 // The eye: a bright core that turns toward the cursor or toward whatever it is operating.
 const eye=new Group();holo.add(eye);
 const eyeMat=keep(additive(PEAK,0));eyeMat.map=glow;
 const pupil=new Mesh(keep(new PlaneGeometry(.5,.5)),eyeMat);pupil.position.z=.46;eye.add(pupil);
 const irisMat=keep(additive(TEAL,0)),iris=new Mesh(keep(new RingGeometry(.13,.142,40)),irisMat);iris.position.z=.5;eye.add(iris);
 const coneMat=keep(new ShaderMaterial({uniforms:holoUniforms,transparent:true,depthWrite:false,blending:AdditiveBlending,side:DoubleSide,
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform float uTime;uniform float uAlpha;varying vec2 vUv;
   void main(){float a=(1.-vUv.y)*(.16+.06*sin(vUv.y*46.-uTime*7.))*uAlpha;gl_FragColor=vec4(vec3(.3,.92,.86)*a,a);}`}));
 const cone=new Mesh(keep(new CylinderGeometry(.5,.1,1,40,1,true)),coneMat);rig.add(cone);
 const columnMat=keep(new ShaderMaterial({uniforms:{uAlpha:{value:0}},transparent:true,depthWrite:false,blending:AdditiveBlending,side:DoubleSide,
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform float uAlpha;varying vec2 vUv;
   void main(){float x=(vUv.x-.5)*5.;float a=exp(-x*x)*smoothstep(1.,.15,vUv.y)*smoothstep(0.,.06,vUv.y)*uAlpha;gl_FragColor=vec4(vec3(.72,.82,1.)*a,a);}`}));
 const column=new Mesh(keep(new PlaneGeometry(2.6,11)),columnMat);column.position.set(0,TOP+5.5,-.3);scene.add(column);

 const holoHaloMat=keep(additive(TEAL,0));holoHaloMat.map=glow;
 const holoHalo=new Mesh(keep(new PlaneGeometry(3.4,3.4)),holoHaloMat);scene.add(holoHalo);
 const pickHolo=new Mesh(keep(new SphereGeometry(.7,12,10)),pickMat);holo.add(pickHolo);
 // The beam the hologram sends to whatever is selected.
 const beamMat=keep(additive(TEAL,0)),beam=new Mesh(keep(new CylinderGeometry(.012,.034,1,10,1,true)),beamMat);beam.visible=false;scene.add(beam);
 const hitMat=keep(additive(TEAL,0));hitMat.map=glow;const hit=new Mesh(keep(new PlaneGeometry(1,1)),hitMat);hit.visible=false;scene.add(hit);

 // ---- service modules (act 3) ----
 const podBody=keep(new BoxGeometry(1.5,1,.08)),podBezel=keep(new BoxGeometry(1.6,1.1,.05)),podScreen=keep(new PlaneGeometry(1.4,.875)),strut=keep(new CylinderGeometry(.022,.03,1,10)),joint=keep(new SphereGeometry(.06,16,12));
 const pods=MOUNTS.map(([deg,radius,height],i)=>{
  const a=deg*Math.PI/180,rest=new Vector3(Math.sin(a)*radius,height,Math.cos(a)*radius),root=new Vector3(Math.sin(a)*1.9,.36,Math.cos(a)*1.2);
  const group=new Group(),bezel=new Mesh(podBezel,polished),back=new Mesh(podBody,dark);back.position.z=.012;group.add(bezel,back);
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=240;const context=canvas.getContext('2d')!;
  const texture=keep(new CanvasTexture(canvas));texture.colorSpace=SRGBColorSpace;
  const screenMat=keep(new MeshBasicMaterial({map:texture,toneMapped:false,transparent:true,opacity:0}));
  const screen=new Mesh(podScreen,screenMat);screen.position.z=.056;group.add(screen);
  const haloMat=keep(additive(TEAL,0));haloMat.map=glow;const halo=new Mesh(keep(new PlaneGeometry(3.8,2.9)),haloMat);halo.position.z=-.06;group.add(halo);
  const arm=new Mesh(strut,brushed),knuckle=new Mesh(joint,polished);
  rig.add(group,arm,knuckle);
  drawModule(context,i,0,false);texture.needsUpdate=true;
  return {group,bezel,arm,knuckle,rest,root,context,texture,screenMat,haloMat,level:0,clock:i*1.7};
 });
 // Backdrop: distant light columns, the hall the deck stands in (and something bright for the silver to mirror).
 const pillarMat=keep(new ShaderMaterial({uniforms:{uAlpha:{value:0}},transparent:true,depthWrite:false,blending:AdditiveBlending,side:DoubleSide,
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform float uAlpha;varying vec2 vUv;
   void main(){float x=(vUv.x-.5)*4.;float a=exp(-x*x)*smoothstep(1.,.55,vUv.y)*smoothstep(0.,.3,vUv.y)*uAlpha;gl_FragColor=vec4(vec3(.62,.74,1.)*a,a);}`}));
 const pillarGeometry=keep(new PlaneGeometry(1,1));
 for(let i=0;i<16;i++){
  const a=(-64+i*128/15)*Math.PI/180,r=21+(i%3)*2.5,h=7+((i*5)%4)*2.2,w=.35+((i*3)%4)*.22;
  const m=new Mesh(pillarGeometry,pillarMat);m.position.set(Math.sin(a)*r,h/2-.4,-Math.cos(a)*r);m.scale.set(w,h,1);m.rotation.y=-a;scene.add(m);
 }
 // Dust in the light, so the space has depth.
 const dustCount=host.small?140:300,dust=new Float32Array(dustCount*3);
 for(let i=0;i<dustCount;i++){dust[i*3]=(Math.random()-.5)*16;dust[i*3+1]=Math.random()*7;dust[i*3+2]=(Math.random()-.5)*12;}
 const dustGeometry=keep(new BufferGeometry());dustGeometry.setAttribute('position',new BufferAttribute(dust,3));
 const dustMat=keep(new PointsMaterial({color:COOL,size:.028,transparent:true,opacity:.5,blending:AdditiveBlending,depthWrite:false,sizeAttenuation:true,fog:false}));
 const dustPoints=new Points(dustGeometry,dustMat);scene.add(dustPoints);

 // ---- state ----
 let story:StoryPosition|null=null,small=host.small,paused=false,stopped=false,raf=0,lastNow=0,time=0,width=1,height=1;
 let quality=Math.min(devicePixelRatio||1,small?1.5:2),slow=0,fps=60;
 const pointer=new Vector2(0,0),ndc=new Vector2(2,2);let pointerInside=false;
 let hover:[number,number]|null=null,locked:[number,number]|null=null,domActive:[number,number]|null=null,holoHover=false,keyHover=-1;
 let rippleAt=-10,rippleFrom=0,talkPulse=0;
 let deckYaw=0,xYaw=0,xPitch=0,xSpin=0,dragging=false,dragX=0,dragY=0,dragMoved=0,downAt:[number,number]|null=null;
 let beamLevel=0;
 const eyeDir=new Vector3(0,0,1),look=new Vector3(),lockMix={value:0};
 const stageBox={left:0,top:0,width:1,height:1};
 const lastPlaced:string[]=['','',''];
 const raycaster=new Raycaster(),tmp=new Vector3(),tmp2=new Vector3(),up=new Vector3(0,1,0),quat=new Quaternion(),matrix=new Matrix4(),dummy=new Object3D(),color=new Color();
 const silver=new Color(0xffffff),lit=new Color(0x8ffff0);

 const active=()=>locked??hover??domActive;
 function measure(){
  const s=host.screen.getBoundingClientRect(),g=host.stage.getBoundingClientRect();
  stageBox.left=s.left-g.left;stageBox.top=s.top-g.top;stageBox.width=s.width;stageBox.height=s.height;
  width=Math.max(1,s.width);height=Math.max(1,s.height);
 }
 function resize(nextSmall:boolean){
  small=nextSmall;measure();renderer.setPixelRatio(quality);renderer.setSize(width,height,false);
  camera.aspect=width/height;lastPlaced.fill('');
 }
 function project(v:Vector3,side:NodePlacement['side']):NodePlacement{
  tmp2.copy(v).project(camera);
  return {x:stageBox.left+(tmp2.x*.5+.5)*stageBox.width,y:stageBox.top+(-tmp2.y*.5+.5)*stageBox.height,depth:0,side};
 }
 function placeNodes(cp:number,pts:NodePlacement[]){
  const key=pts.map(p=>`${Math.round(p.x)},${Math.round(p.y)},${p.side}`).join(';');
  if(key===lastPlaced[cp])return;lastPlaced[cp]=key;host.place(cp,pts);
 }
 // World-space anchor of a service node: where its label sits and where the hologram's beam lands.
 function anchor(cp:number,i:number,out:Vector3){
  if(cp===0)return drones[i].group.getWorldPosition(out);
  if(cp===1)return out.set(X_TIPS[i][0],X_TIPS[i][1],0).applyMatrix4(xPivot.matrixWorld);
  return pods[i].group.getWorldPosition(out);
 }

 function frame(now:number){
  const dt=lastNow?Math.min(.05,(now-lastNow)/1000):1/60;lastNow=now;time+=dt;
  const p=story;if(!p)return;
  // Adaptive quality: step the resolution down when frames run long, never back up (no oscillation).
  fps=lerp(fps,1/Math.max(dt,.001),.05);
  if(dt>.03)slow++;else slow=Math.max(0,slow-1);
  if(slow>45&&quality>1){quality=Math.max(1,quality-.25);slow=0;renderer.setPixelRatio(quality);renderer.setSize(width,height,false);}

  // ---- scroll-driven values ----
  const c=p.clip,run=p.hold?1:p.progress;
  const power=c>0?1:smooth(run/.55),holoOn=c>0?1:smooth((run-.4)/.6);
  const rise=c>1?1:c===1?smooth((run-.12)/.88):0,gateOpen=c===1&&!p.hold?Math.sin(Math.PI*clamp(run/.9)):0;
  const deploy=c===2?run:0,closing=p.converge;
  // ---- camera ----
  let from=CAMERA[0],to=CAMERA[1];const mix=smooth(run);
  if(c===1){from=CAMERA[1];to=CAMERA[2];}else if(c===2){from=CAMERA[2];to=CAMERA[3];}
  const narrow=clamp((1.45-camera.aspect)/.9),reach=1+narrow*.7;// phones: pull back so the whole deck fits the band
  const k=(i:0|1|2)=>lerp(lerp(from.pos[i],to.pos[i],mix),CAMERA[4].pos[i],closing);
  const t=(i:0|1|2)=>lerp(lerp(from.target[i],to.target[i],mix),CAMERA[4].target[i],closing);
  look.set(t(0),t(1),t(2));
  const sway=pointerInside&&!small?1:0;
  camera.position.set(k(0)*reach+pointer.x*.35*sway,look.y+(k(1)-look.y)*reach-pointer.y*.2*sway,k(2)*reach);
  // A locked module pulls the camera a little toward itself.
  lockMix.value=lerp(lockMix.value,locked&&locked[0]===2?1:0,1-Math.exp(-dt*5));
  if(lockMix.value>.001&&locked){pods[locked[1]].group.getWorldPosition(tmp);look.lerp(tmp,lockMix.value*.45);camera.position.lerp(tmp,lockMix.value*.16);}
  camera.lookAt(look);
  const off=small?0:lerp(lerp(from.off,to.off,mix),CAMERA[4].off,closing);
  camera.setViewOffset(width,height,-off*width,0,width,height);

  // ---- deck ----
  const flicker=power<1?power*(.7+.3*Math.sin(time*38)):1;
  scene.environmentIntensity=.3+.7*power;sun.intensity=.35+.75*power;
  glassMat.emissiveIntensity=flicker*(1.5+.25*Math.sin(time*1.3))+gateOpen*1.2;
  seamMat.opacity=flicker*.95;plinthLineMat.opacity=flicker*.6;ringMat.opacity=power*.22;floorGlowMat.opacity=power*.26+gateOpen*.25;
  rig.rotation.y=deckYaw+Math.sin(time*.21)*.035*power;
  const a=active();
  ports.forEach((port,i)=>{
   const on=c===0&&p.hold&&a?.[0]===0&&a[1]===i?1:0;port.level=lerp(port.level,on,1-Math.exp(-dt*9));
   port.mat.opacity=flicker*(.5+.25*Math.sin(time*2+i*1.6))+port.level*.5;port.haloMat.opacity=port.level*.7+power*.08;
   port.cap.position.y=.012+port.level*.05;
  });
  // Drones launch from their ports as the checkpoint arrives and dock again as it releases.
  const launch=c===0&&p.hold?(p.phase.endsWith('_ARRIVAL')?smooth(p.local):p.phase.endsWith('_RELEASE')?1-smooth(p.local):1):0;
  drones.forEach((drone,i)=>{
   drone.group.visible=launch>.01;if(!drone.group.visible)return;
   drone.level=lerp(drone.level,ports[i].level>.5||(a?.[0]===0&&a[1]===i)?1:0,1-Math.exp(-dt*9));
   tmp.set(PORTS[i][0],TOP+.08,PORTS[i][1]).lerp(drone.rest,launch);tmp.y+=Math.sin(launch*Math.PI)*.5+Math.sin(time*1.3+i*1.9)*.05*launch;
   drone.group.position.copy(tmp);drone.group.scale.setScalar((.4+.6*launch)*(1+drone.level*.3));
   drone.ring.rotation.set(Math.PI/2+Math.sin(time*1.1+i)*.35,time*1.4+i,0);drone.mat.opacity=.55+drone.level*.45;
   drone.halo.quaternion.copy(rig.quaternion).invert().multiply(camera.quaternion);drone.haloMat.opacity=(.22+drone.level*.6)*launch;
  });
  // Keys.
  const wave=(time-rippleAt)*16;
  for(let i=0;i<KEYS;i++){
   const ripple=wave<KEYS+3?clamp(1-Math.abs(Math.abs(i-rippleFrom)-wave)/1.6):0,target=Math.max(i===keyHover?1:0,ripple);
   keyLevel[i]=lerp(keyLevel[i],target,1-Math.exp(-dt*(target>keyLevel[i]?26:7)));
   dummy.position.set(keyX(i),.388-keyLevel[i]*.016,1.432-keyLevel[i]*.012);dummy.rotation.set(SLOPE,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();keys.setMatrixAt(i,dummy.matrix);
   keys.setColorAt(i,color.copy(silver).lerp(lit,keyLevel[i]*power));
  }
  keys.instanceMatrix.needsUpdate=true;if(keys.instanceColor)keys.instanceColor.needsUpdate=true;
  keyGlow.visible=keyHover>=0;if(keyHover>=0){keyGlow.position.set(keyX(keyHover),.43,1.45);keyGlowMat.opacity=.55*power;}

  // ---- gate and X ----
  gateMat.opacity=gateOpen*.95;gate.scale.setScalar(.6+gateOpen*.5);
  xPivot.visible=rise>0;
  const settle=c===1&&!p.hold?1-smooth(run):0;
  xSpin=settle*Math.PI*1.5;
  xPivot.position.y=lerp(X_START,X_REST,rise)+(rise>=1?Math.sin(time*.9)*.035:0);
  xPivot.scale.setScalar(c===2?lerp(1,.8,smooth(deploy/.6)):1);
  xPivot.rotation.set(xPitch,xYaw+xSpin+(rise>=1?Math.sin(time*.33)*.14:0),0);
  xGlowMat.opacity=rise*.2+gateOpen*.3;xGlow.position.y=xPivot.position.y;

  // ---- hologram ----
  const lift=c===0?0:c===1?rise:1,holoY=lerp(TOP+1.08,TOP+2.92,lift),holoScale=lerp(1,.5,lift);
  holo.position.set(0,holoY+Math.sin(time*1.1)*.03,0);holo.scale.setScalar(holoScale*(.6+.4*holoOn));
  talkPulse=Math.max(0,talkPulse-dt*1.6);
  holoUniforms.uTime.value=time;holoUniforms.uAlpha.value=holoOn*(holoHover?1.25:1);holoUniforms.uPulse.value=Math.max(talkPulse,holoHover?.35:0);
  holoRingMat.opacity=holoOn*.5;holoHaloMat.opacity=holoOn*(.26+talkPulse*.3+(holoHover?.12:0));holo.getWorldPosition(holoHalo.position);holoHalo.quaternion.copy(camera.quaternion);holoHalo.scale.setScalar(holoScale);
  pillarMat.uniforms.uAlpha.value=power*.34;
  holoRings.forEach((ring,i)=>ring.rotation.set(Math.PI/2+Math.sin(time*.4+i*2.1)*.5,time*(.3+i*.17),i*1.1));
  cone.visible=holoOn>.01;cone.position.set(0,(TOP+holoY-.5*holoScale)/2,0);cone.scale.set(holoScale,Math.max(.01,holoY-.5*holoScale-TOP),holoScale);
  columnMat.uniforms.uAlpha.value=holoOn*.3+gateOpen*.55;column.quaternion.copy(camera.quaternion);
  holoLight.position.set(0,holoY,0).applyMatrix4(rig.matrixWorld);holoLight.intensity=holoOn*(3.4+talkPulse*4);
  // Where the eye looks: the selected service, otherwise the cursor.
  rig.updateMatrixWorld(true);
  holo.getWorldPosition(tmp);
  const target=a&&p.hold&&a[0]===c?anchor(a[0],a[1],tmp2.set(0,0,0)).clone():null;
  if(target)look.copy(target).sub(tmp).normalize();
  else if(pointerInside&&!small){raycaster.setFromCamera(pointer,camera);look.copy(raycaster.ray.direction).multiplyScalar(camera.position.distanceTo(tmp)*.8).add(raycaster.ray.origin).sub(tmp).normalize();}
  else look.copy(camera.position).sub(tmp).normalize();
  eyeDir.lerp(look,1-Math.exp(-dt*7)).normalize();
  quat.setFromUnitVectors(tmp2.set(0,0,1),eyeDir);eye.quaternion.copy(rig.quaternion).invert().multiply(quat);
  eyeMat.opacity=holoOn*.85;irisMat.opacity=holoOn*.9;iris.scale.setScalar(1+(holoHover?.25:0)+talkPulse*.5);
  // Beam.
  beamLevel=lerp(beamLevel,target?1:0,1-Math.exp(-dt*(target?10:6)));
  if(target&&beamLevel>.01){
   const length=tmp.distanceTo(target);beam.visible=hit.visible=true;
   beam.position.copy(tmp).lerp(target,.5);beam.quaternion.setFromUnitVectors(up,tmp2.copy(target).sub(tmp).normalize());beam.scale.set(1,length,1);
   beamMat.opacity=beamLevel*(.55+.2*Math.sin(time*22));hit.position.copy(target);hit.quaternion.copy(camera.quaternion);hit.scale.setScalar(.7+.15*Math.sin(time*9));hitMat.opacity=beamLevel*.8;
  }else{beam.visible=hit.visible=false;}

  // ---- modules ----
  pods.forEach((pod,i)=>{
   const out=c===2?smooth((deploy-i*.07)/.58):0,on=a?.[0]===2&&a[1]===i&&c===2&&p.hold?1:0;
   pod.level=lerp(pod.level,on,1-Math.exp(-dt*8));
   const visible=out>.001;pod.group.visible=pod.arm.visible=pod.knuckle.visible=visible;if(!visible)return;
   tmp.copy(pod.root).lerp(pod.rest,out);tmp.y+=Math.sin(time*.8+i*1.3)*.035*out+pod.level*.14;
   pod.group.position.copy(tmp);pod.group.scale.setScalar((.2+.8*out)*(1+pod.level*.2));
   // Face the camera (yaw only), in the deck's own frame.
   tmp2.copy(camera.position).applyMatrix4(matrix.copy(rig.matrixWorld).invert());
   pod.group.rotation.set(-.08,Math.atan2(tmp2.x-tmp.x,tmp2.z-tmp.z),0);
   pod.screenMat.opacity=smooth((out-.3)/.4)*(out<.8?.7+.3*Math.sin(time*40+i):1);pod.haloMat.opacity=pod.level*.5;
   tmp2.copy(tmp).setY(tmp.y-.55*pod.group.scale.y);
   pod.arm.position.copy(pod.root).lerp(tmp2,.5);pod.arm.quaternion.setFromUnitVectors(up,look.copy(tmp2).sub(pod.root).normalize());pod.arm.scale.set(1,Math.max(.001,pod.root.distanceTo(tmp2)),1);
   pod.knuckle.position.copy(tmp2);
   // The selected module plays its miniature at full rate; the rest tick over slowly, one per frame.
   const due=pod.level>.05||Math.floor(time*60)%MODULE_COUNT===i;
   if(due&&out>.3){pod.clock+=pod.level>.05?dt:dt*MODULE_COUNT*.35;drawModule(pod.context,i,pod.clock,pod.level>.4);pod.texture.needsUpdate=true;}
  });
  dustPoints.rotation.y=time*.012;dustMat.opacity=.2+.3*power;

  // ---- labels ----
  rig.updateMatrixWorld(true);camera.updateMatrixWorld();
  if(p.hold){
   if(c===0)placeNodes(0,drones.map((_,i)=>project(anchor(0,i,tmp),DRONES[i][3])));
   else if(c===1)placeNodes(1,X_TIPS.map((_,i)=>{const n=project(anchor(1,i,tmp),'right');n.side=n.x<stageBox.left+stageBox.width*(.5+off)?'left':'right';return n;}));
   else placeNodes(2,pods.map((pod,i)=>project(anchor(2,i,tmp).setY(tmp.y-.66*pod.group.scale.y),'below')));
  }
  renderer.render(scene,camera);
 }
 function loop(now:number){raf=0;if(stopped||paused)return;frame(now);raf=requestAnimationFrame(loop);}
 function wake(){if(!raf&&!paused&&!stopped&&!document.hidden)raf=requestAnimationFrame(loop);}

 // ---- pointer ----
 const interactive=(target:EventTarget|null)=>target instanceof Element&&!!target.closest('a,button,input,textarea,select,[role=button]');
 function setPointer(e:PointerEvent){
  const r=host.canvas.getBoundingClientRect();
  pointer.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ndc.copy(pointer);
  pointerInside=Math.abs(pointer.x)<=1&&Math.abs(pointer.y)<=1;
 }
 function pick():{kind:'holo'|'key'|'port'|'x'|'pod';index:number}|null{
  const p=story;if(!p||!pointerInside)return null;
  raycaster.setFromCamera(ndc,camera);
  const c=p.clip,ready=p.hold;
  if(raycaster.intersectObject(pickHolo,false).length&&(c>0||ready))return {kind:'holo',index:0};
  if(c===2&&ready){for(let i=0;i<pods.length;i++)if(raycaster.intersectObject(pods[i].bezel,false).length)return {kind:'pod',index:i};}
  if(c===1&&ready){
   const x=raycaster.intersectObject(xMesh,false)[0];
   if(x){const local=xPivot.worldToLocal(x.point.clone());let best=0,d=Infinity;X_TIPS.forEach(([u,v],i)=>{const q=(local.x-u)**2+(local.y-v)**2;if(q<d){d=q;best=i;}});return {kind:'x',index:best};}
  }
  if(c===0&&ready){for(let i=0;i<drones.length;i++)if(raycaster.intersectObject(drones[i].pick,false).length)return {kind:'port',index:i};}
  const key=raycaster.intersectObject(keys,false)[0];if(key&&key.instanceId!==undefined)return {kind:'key',index:key.instanceId};
  return null;
 }
 function setHover(next:[number,number]|null){
  if(next?.[0]===hover?.[0]&&next?.[1]===hover?.[1])return;
  const previous=hover;hover=next;
  if(previous&&!(locked&&locked[0]===previous[0]&&locked[1]===previous[1]))host.hover(previous[0],null);
  if(next)host.hover(next[0],next[1]);else if(locked)host.hover(locked[0],locked[1]);
 }
 function refreshHover(target:EventTarget|null){
  if(interactive(target)||dragging){holoHover=false;keyHover=-1;setHover(null);host.stage.style.removeProperty('cursor');return;}
  const found=pick();holoHover=found?.kind==='holo';keyHover=found?.kind==='key'?found.index:-1;
  // A locked service stays selected until it is clicked again; hovering others does not steal it.
  setHover(locked?null:found?.kind==='port'?[0,found.index]:found?.kind==='x'?[1,found.index]:found?.kind==='pod'?[2,found.index]:null);
  if(found)host.stage.style.cursor='pointer';else host.stage.style.removeProperty('cursor');
 }
 function onMove(e:PointerEvent){
  setPointer(e);
  if(dragging&&story){
   const dx=e.clientX-dragX,dy=e.clientY-dragY;dragX=e.clientX;dragY=e.clientY;dragMoved+=Math.abs(dx)+Math.abs(dy);
   if(story.checkpoint===1){xYaw+=dx*.008;xPitch=clamp(xPitch+dy*.004,-.45,.45);}
   else deckYaw=clamp(deckYaw+dx*.004,-.55,.55);
   if(dragMoved>12)host.dragged?.(story.checkpoint);
   return;
  }
  if(e.pointerType==='mouse')refreshHover(e.target);
 }
 function onDown(e:PointerEvent){
  if(interactive(e.target)||(e.pointerType==='mouse'&&e.button!==0))return;
  setPointer(e);downAt=[e.clientX,e.clientY];
  if(story&&story.hold){dragging=true;dragX=e.clientX;dragY=e.clientY;dragMoved=0;}
 }
 function onUp(e:PointerEvent){
  const tap=downAt&&Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1])<8;dragging=false;downAt=null;
  if(!tap||interactive(e.target))return;
  setPointer(e);const found=pick();
  if(!found){if(locked){const was=locked;locked=null;host.hover(was[0],null);}return;}
  if(found.kind==='holo'){talkPulse=1;host.talk();return;}
  if(found.kind==='key'){rippleAt=time;rippleFrom=found.index;return;}
  const next:[number,number]=[found.kind==='port'?0:found.kind==='x'?1:2,found.index];
  const same=locked&&locked[0]===next[0]&&locked[1]===next[1];
  if(locked&&!same)host.hover(locked[0],null);
  locked=same?null:next;host.hover(next[0],same?null:next[1]);
  if(same&&e.pointerType!=='mouse')hover=null;
 }
 host.stage.addEventListener('pointermove',onMove,{signal,passive:true});
 host.stage.addEventListener('pointerdown',onDown,{signal,passive:true});
 window.addEventListener('pointerup',onUp,{signal,passive:true});
 window.addEventListener('pointercancel',()=>{dragging=false;downAt=null;},{signal,passive:true});
 host.stage.addEventListener('pointerleave',()=>{pointerInside=false;holoHover=false;keyHover=-1;if(!dragging)setHover(null);host.stage.style.removeProperty('cursor');},{signal,passive:true});
 host.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stopped=true;cancelAnimationFrame(raf);host.fail('context-lost');},{signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;lastNow=0;}else wake();},{signal});

 resize(small);
 return {
  update(p){
   // Leaving a checkpoint releases whatever was selected there.
   if(story&&(story.checkpoint!==p.checkpoint)){if(locked){host.hover(locked[0],null);locked=null;}if(hover){host.hover(hover[0],null);hover=null;}}
   story=p;wake();
  },
  resize,
  pause(next){paused=next;if(paused){cancelAnimationFrame(raf);raf=0;lastNow=0;}else wake();},
  select(cp,node){domActive=node===null?null:[cp,node];},
  stats(){const a=active();return {phase:story?.phase??'',quality,fps:Math.round(fps),active:a?[a[0],a[1]]:null,locked:!!locked,yaw:story?.checkpoint===1?xYaw:deckYaw,power:glassMat.emissiveIntensity};},
  frame(){frame(performance.now());},
  dispose(){
   stopped=true;cancelAnimationFrame(raf);host.stage.style.removeProperty('cursor');
   disposables.forEach(d=>d.dispose());renderer.dispose();
  },
 };
}
