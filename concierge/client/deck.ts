// X Isle: the live 3D scene behind the homepage story. A black lake at night, a glass orb (the concierge) on a rock,
// a marble X that rises out of the water, and service rocks that surface around it, joined by arcs of light.
// The backdrop and the stone textures are generated images (ai-concierge-preview/media/isle-v1); everything else is
// procedural. Every scroll-driven value is a pure function of the story position, so reverse scrolling replays it.
import {ACESFilmicToneMapping,AdditiveBlending,AmbientLight,BackSide,BufferAttribute,BufferGeometry,CanvasTexture,Color,CylinderGeometry,DirectionalLight,DoubleSide,EdgesGeometry,ExtrudeGeometry,FogExp2,Group,IcosahedronGeometry,LineBasicMaterial,Matrix4,LineSegments,Mesh,MeshBasicMaterial,MeshPhysicalMaterial,MeshStandardMaterial,MirroredRepeatWrapping,PerspectiveCamera,Plane,PlaneGeometry,PMREMGenerator,PointLight,Points,PointsMaterial,QuadraticBezierCurve3,Quaternion,Raycaster,RepeatWrapping,RingGeometry,Scene,ShaderMaterial,Shape,SphereGeometry,SRGBColorSpace,TextureLoader,TorusGeometry,TubeGeometry,Vector2,Vector3,WebGLRenderer,BoxGeometry,type Material,type Texture} from 'three';
import {Reflector} from 'three/examples/jsm/objects/Reflector.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {smooth,type StoryPosition} from '../shared/cinema-timeline';
import {drawIcon,drawModule} from './deck-modules';

export type NodePlacement={x:number;y:number;depth:number;side:'left'|'right'|'below'|'above'};
export type DeckHost={
 canvas:HTMLCanvasElement;screen:HTMLElement;stage:HTMLElement;small:boolean;
 /** Stage-pixel anchors for the spatial service links of checkpoint `cp`. */
 place(cp:number,pts:NodePlacement[]):void;
 /** The scene picked a service (hover, tap or click) or released it. */
 hover(cp:number,node:number|null):void;
 /** The visitor clicked the orb: open the real concierge. */
 talk():void;
 fail(reason:string):void;
 dragged?(cp:number):void;
};
export type DeckStats={phase:string;quality:number;fps:number;active:[number,number]|null;locked:boolean;yaw:number;power:number};
export type Deck={update(p:StoryPosition):void;resize(small:boolean):void;pause(paused:boolean):void;select(cp:number,node:number|null):void;stats():DeckStats;frame():void;dispose():void};

const MEDIA='/ai-concierge-preview/media/isle-v1';
const BG=0x07090c,MOON=0xdfe6f0,WHITE=0xf4f6f9;
const clamp=(v:number,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
// X outline in film pixels (the same silhouette as the hero mark), normalised around its pivot.
const X_OUTLINE:[number,number][]=[[262,88],[358,83],[425,172],[503,82],[598,90],[460,221],[565,350],[492,349],[422,262],[350,349],[277,349],[392,220]];
const X_PIVOT:[number,number]=[430,220],X_SCALE=1.35/135;
const X_TIPS:[number,number][]=[[1.16,.95],[-1.16,.95],[-1.1,-.94],[1.02,-.94]];
// Central rock: its flat top, and the orb that rests on it.
const TOP=.42,ORB_R=.82,ORB_REST=TOP+ORB_R*.93;
// AI satellites around the orb in act 1 (orb space): upper left, upper right, lower right, lower left.
const SATS:[number,number,number,'left'|'right'][]=[[-1.45,.75,.2,'left'],[1.45,.8,.1,'right'],[1.55,-.55,.6,'right'],[-1.5,-.6,.55,'left']];
// Service rocks: angle from the front (degrees), radius, and how high the glass plate floats above the rock.
const MOUNTS:[number,number,number][]=[[-124,4.5,1.55],[-78,5.1,1.3],[-38,4.9,1.05],[38,4.9,1.05],[78,5.1,1.3],[124,4.5,1.55]];
const PLATE_W=1.32,PLATE_H=.82;

type CameraKey={pos:[number,number,number];target:[number,number,number];off:number};
const CAMERA:CameraKey[]=[
 {pos:[0,1.15,13.5],target:[0,1.05,0],off:0},// opening: the empty lake in the fog
 {pos:[0,1.85,8.4],target:[0,1.22,0],off:.05},// act 1: the orb on its rock
 {pos:[0,2.35,10.6],target:[0,1.9,0],off:.07},// act 2: the X
 {pos:[0,4.5,15.8],target:[0,1.65,0],off:.05},// act 3: the service rocks
 {pos:[0,5.4,20.5],target:[0,1.6,0],off:.14},// closing: the isle slides right for the copy
];

// ---- procedural helpers ----
function hash(x:number,y:number,z:number){const h=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return h-Math.floor(h);}
function noise(x:number,y:number,z:number){
 const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),xf=x-xi,yf=y-yi,zf=z-zi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),w=zf*zf*(3-2*zf);
 const l=(a:number,b:number,t:number)=>a+(b-a)*t,c=(dx:number,dy:number,dz:number)=>hash(xi+dx,yi+dy,zi+dz);
 return l(l(l(c(0,0,0),c(1,0,0),u),l(c(0,1,0),c(1,1,0),u),v),l(l(c(0,0,1),c(1,0,1),u),l(c(0,1,1),c(1,1,1),u),v),w)*2-1;
}
function fbm(x:number,y:number,z:number){let a=0,f=1,s=.5;for(let i=0;i<4;i++){a+=noise(x*f,y*f,z*f)*s;f*=2.1;s*=.5;}return a;}
// A craggy rock: a displaced sphere with a flat, slightly uneven top at local y = .45 (objects stand there) and a
// rough body that sinks below the waterline.
function rockGeometry(seed:number,detail:number,flat=.45):BufferGeometry{
 const g=new IcosahedronGeometry(1,detail),p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=1+.36*fbm(x*1.5+seed,y*1.5-seed,z*1.5+seed*.7)+.12*fbm(x*5+seed,y*5,z*5)+.04*fbm(x*13,y*13+seed,z*13);
  let ny=y*r;if(ny>flat)ny=flat+(ny-flat)*.08+.02*fbm(x*4+seed,0,z*4);
  p.setXYZ(i,x*r,ny,z*r);
 }
 g.computeVertexNormals();return g;
}
function glowTexture(){
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d')!;
 const g=x.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.22,'rgba(255,255,255,.42)');g.addColorStop(.55,'rgba(255,255,255,.08)');g.addColorStop(1,'rgba(255,255,255,0)');
 x.fillStyle=g;x.fillRect(0,0,256,256);return new CanvasTexture(c);
}
// Studio reflections in monochrome: a soft dome, a bright moon panel behind and a dim fill in front, so the marble
// and the glass read as polished without picking up any colour.
function environment(renderer:WebGLRenderer,lake?:Texture):Texture{
 const room=new Scene(),panel=(w:number,h:number,v:number)=>new Mesh(new PlaneGeometry(w,h),new MeshBasicMaterial({color:new Color(v,v*1.04,v*1.1),side:DoubleSide}));
 // With the 360° lake panorama loaded, the orb, the marble and the rocks reflect the real lake and moon; until then a
 // soft gradient dome stands in.
 if(lake)room.add(new Mesh(new SphereGeometry(30,64,32),new MeshBasicMaterial({map:lake,side:BackSide,color:new Color(1.7,1.75,1.85)})));
 else room.add(new Mesh(new SphereGeometry(30,32,24),new ShaderMaterial({side:BackSide,
  vertexShader:`varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`varying vec3 vP;void main(){float h=vP.y;vec3 c=mix(vec3(.01,.012,.016),vec3(.16,.17,.2),smoothstep(-.1,.4,h));c=mix(c,vec3(.75,.78,.84),smoothstep(.55,1.,h));gl_FragColor=vec4(c,1.);}`})));
 const moon=panel(10,5,7);moon.position.set(0,7,-12);moon.lookAt(0,0,0);room.add(moon);
 const rim=panel(18,1,4);rim.position.set(0,3,-14);room.add(rim);
 const left=panel(1.2,8,1.6);left.position.set(-10,3,0);left.rotation.y=Math.PI/2;room.add(left);
 const right=panel(1.2,8,1.4);right.position.set(10,3,-2);right.rotation.y=-Math.PI/2;room.add(right);
 const fill=panel(14,4,1.1);fill.position.set(0,2.5,12);room.add(fill);
 const pmrem=new PMREMGenerator(renderer),texture=pmrem.fromScene(room,.03).texture;pmrem.dispose();
 room.traverse(o=>{if(o instanceof Mesh){o.geometry.dispose();(o.material as Material).dispose();}});
 return texture;
}
const WATER_VERTEX=`uniform mat4 textureMatrix;varying vec4 vUv;varying vec3 vWorld;
 void main(){vUv=textureMatrix*vec4(position,1.);vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
// Black water: the mirrored scene, broken by a slow ripple, darkened by a fresnel term, fading out with distance so
// the backdrop's own lake takes over at the horizon. `uMirror` is 0 where there is no reflection pass (phones).
const WATER_FRAGMENT=`uniform sampler2D tDiffuse;uniform float uTime;uniform float uMirror;uniform vec3 uTint;varying vec4 vUv;varying vec3 vWorld;
 void main(){
  vec2 w=vWorld.xz;
  vec2 d=vec2(sin(w.x*1.9+uTime*.55)+sin(w.y*2.7-uTime*.42)+.5*sin((w.x+w.y)*5.3+uTime*.9),cos(w.y*2.1+uTime*.47)+sin(w.x*2.9+uTime*.33)+.5*cos((w.x-w.y)*4.7-uTime*.8))*.0055;
  vec3 refl=uMirror>0.?texture2DProj(tDiffuse,vec4(vUv.xy+d*vUv.w,vUv.zw)).rgb:vec3(0.);
  vec3 view=normalize(cameraPosition-vWorld);float fres=.25+.75*pow(1.-max(view.y,0.),3.);
  vec3 col=uTint+refl*fres*.82;
  float dist=length(w);float a=1.-smoothstep(10.,25.,dist);
  gl_FragColor=vec4(col,a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`;

export function createDeck(host:DeckHost,signal:AbortSignal):Deck|null{
 let renderer:WebGLRenderer;
 try{renderer=new WebGLRenderer({canvas:host.canvas,antialias:true,alpha:true,powerPreference:'high-performance'});}catch{return null;}
 renderer.setClearColor(BG,0);renderer.toneMapping=ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.outputColorSpace=SRGBColorSpace;renderer.localClippingEnabled=true;
 const disposables:{dispose():void}[]=[];
 const keep=<T extends {dispose():void}>(x:T)=>{disposables.push(x);return x;};
 const small0=host.small,mirror=!small0;
 const scene=new Scene();scene.fog=new FogExp2(BG,.03);
 let env=environment(renderer);scene.environment=env;disposables.push({dispose:()=>env.dispose()});
 const camera=new PerspectiveCamera(32,1,.1,200);scene.add(camera);
 const ambient=new AmbientLight(0xc8d0dc,.18);scene.add(ambient);
 const moon=new DirectionalLight(MOON,2.4);moon.position.set(1.5,9,-14);scene.add(moon);
 const fill=new DirectionalLight(0xc0c8d4,.85);fill.position.set(-5,4,10);scene.add(fill);
 const orbLight=new PointLight(WHITE,0,6,1.7);scene.add(orbLight);
 const glow=keep(glowTexture());

 // ---- textures ----
 const loader=new TextureLoader(),texture=(file:string,mirrored:boolean,repeat:number)=>{
  const t=keep(loader.load(`${MEDIA}/${file}`));t.colorSpace=SRGBColorSpace;t.wrapS=t.wrapT=mirrored?MirroredRepeatWrapping:RepeatWrapping;t.repeat.set(repeat,repeat);t.anisotropy=4;return t;
 };
 loader.load(`${MEDIA}/lake-360.webp`,t=>{if(stopped){t.dispose();return;}t.colorSpace=SRGBColorSpace;const next=environment(renderer,t);t.dispose();env.dispose();env=next;scene.environment=env;wake();});
 const rockMap=texture('rock-1024.webp',true,2),marbleMap=texture('marble-1024.webp',true,.3);
 // Keep the mirror line of the repeated marble off the face of the X.
 marbleMap.offset.set(.55,.55);

 // ---- backdrop: the generated lake plate, fixed to the camera and slid so its horizon meets the 3D horizon ----
 // Two plates: a wide one for desktops and a tall one for phones, each with its horizon row (share from the top).
 const BACK_D=90,IMG_ASPECT=small0?941/1672:16/9,IMG_HORIZON=small0?.44:.565;
 const backMat=keep(new ShaderMaterial({uniforms:{map:{value:null as Texture|null},uFade:{value:0}},depthWrite:false,transparent:true,fog:false,
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D map;uniform float uFade;varying vec2 vUv;
   void main(){vec3 c=texture2D(map,vUv).rgb;
    gl_FragColor=vec4(c*.92,uFade);
    #include <colorspace_fragment>
   }`}));
 const backdrop=new Mesh(keep(new PlaneGeometry(1,1)),backMat);backdrop.renderOrder=-10;backdrop.frustumCulled=false;camera.add(backdrop);
 loader.load(`${MEDIA}/${small0?'backdrop-phone':'backdrop-2048'}.webp`,t=>{if(stopped){t.dispose();return;}keep(t);t.colorSpace=SRGBColorSpace;backMat.uniforms.map.value=t;backReady=true;wake();});
 let backReady=false,backFade=0;

 // ---- water ----
 const waterShader={uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null},uTime:{value:0},uMirror:{value:mirror?1:0},uTint:{value:new Color(.006,.008,.011)}},vertexShader:WATER_VERTEX,fragmentShader:WATER_FRAGMENT};
 const waterGeometry=keep(new PlaneGeometry(64,64));
 let water:Mesh,waterUniforms:Record<string,{value:unknown}>;
 if(mirror){
  const r=new Reflector(waterGeometry,{textureWidth:512,textureHeight:512,clipBias:.003,multisample:0,shader:waterShader});
  // The backdrop belongs to the real camera only; keep it out of the mirrored pass.
  const before=r.onBeforeRender.bind(r);r.onBeforeRender=(...args:Parameters<typeof r.onBeforeRender>)=>{backdrop.visible=false;before(...args);backdrop.visible=true;};
  water=r;waterUniforms=(r.material as ShaderMaterial).uniforms;disposables.push({dispose:()=>r.dispose()});
 }else{
  const m=keep(new ShaderMaterial({uniforms:{...waterShader.uniforms,tDiffuse:{value:null},textureMatrix:{value:new Matrix4()}},vertexShader:WATER_VERTEX,fragmentShader:WATER_FRAGMENT}));
  water=new Mesh(waterGeometry,m);waterUniforms=m.uniforms;
 }
 (water.material as ShaderMaterial).transparent=true;(water.material as ShaderMaterial).depthWrite=false;
 water.rotation.x=-Math.PI/2;water.renderOrder=-5;scene.add(water);
 // Moonlight path on the water, shimmering.
 const pathMat=keep(new ShaderMaterial({uniforms:{uTime:{value:0},uAlpha:{value:.0}},transparent:true,depthWrite:false,blending:AdditiveBlending,fog:false,
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform float uTime;uniform float uAlpha;varying vec2 vUv;
   void main(){float x=(vUv.x-.5)*2.;float core=exp(-x*x*9.);float ripple=.55+.45*sin(vUv.y*170.+uTime*1.6+sin(vUv.x*31.+uTime)*2.);
    float a=core*ripple*smoothstep(0.,.25,vUv.y)*smoothstep(1.,.55,vUv.y)*uAlpha;gl_FragColor=vec4(vec3(.85,.9,.98)*a,a);}`}));
 const path=new Mesh(keep(new PlaneGeometry(3.4,34)),pathMat);path.rotation.x=-Math.PI/2;path.position.set(0,.01,-12);scene.add(path);

 // ---- the isle ----
 const rig=new Group();scene.add(rig);
 const rockMat=keep(new MeshStandardMaterial({map:rockMap,color:0x8e949c,roughness:.58,metalness:.12,bumpMap:rockMap,bumpScale:3,envMapIntensity:.55}));
 const detail=small0?4:5;
 const centre=new Mesh(keep(rockGeometry(3.1,detail)),rockMat);rig.add(centre);
 const rippleGeometry=keep(new RingGeometry(.96,1,96));
 const ripple=(opacity:number)=>{const m=keep(new MeshBasicMaterial({color:WHITE,transparent:true,opacity,blending:AdditiveBlending,depthWrite:false,fog:false}));const r=new Mesh(rippleGeometry,m);r.rotation.x=-Math.PI/2;r.position.y=.012;return r;};
 const centreRipples=[ripple(0),ripple(0)];centreRipples.forEach(r=>rig.add(r));

 // ---- the marble X ----
 const xShape=new Shape();X_OUTLINE.forEach(([u,v],i)=>{const x=(u-X_PIVOT[0])*X_SCALE,y=-(v-X_PIVOT[1])*X_SCALE;if(i)xShape.lineTo(x,y);else xShape.moveTo(x,y);});xShape.closePath();
 const xGeometry=keep(new ExtrudeGeometry(xShape,{depth:.46,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:3}));xGeometry.translate(0,0,-.23);
 const xClip=new Plane(new Vector3(0,1,0),-(TOP-.02));
 const xMat=keep(new MeshPhysicalMaterial({map:marbleMap,color:0xd4d8de,roughness:.24,metalness:.05,clearcoat:1,clearcoatRoughness:.06,envMapIntensity:1.6,emissive:new Color(0xffffff),emissiveMap:marbleMap,emissiveIntensity:.08,clippingPlanes:[xClip]}));
 const xPivot=new Group(),xMesh=new Mesh(xGeometry,xMat);xPivot.add(xMesh);xPivot.visible=false;rig.add(xPivot);
 const X_HALF=(350-82)*X_SCALE/2,X_REST=TOP+X_HALF+.02,X_START=TOP-X_HALF*2.1;
 const xGlowMat=keep(new MeshBasicMaterial({color:WHITE,map:glow,transparent:true,opacity:0,blending:AdditiveBlending,depthWrite:false,fog:false}));
 const xGlow=new Mesh(keep(new PlaneGeometry(5.2,5.2)),xGlowMat);xGlow.position.set(0,X_REST,-.9);rig.add(xGlow);

 // ---- the orb (the concierge) ----
 const orb=new Group();rig.add(orb);
 const orbUniforms={uTime:{value:0},uAlpha:{value:0},uPulse:{value:0},uTilt:{value:new Vector2()}};
 const shellMat=keep(new ShaderMaterial({uniforms:orbUniforms,transparent:true,depthWrite:false,blending:AdditiveBlending,
  vertexShader:`varying vec3 vN;varying vec3 vV;varying vec3 vP;
   void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);vP=position;gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform float uAlpha;uniform float uPulse;varying vec3 vN;varying vec3 vV;varying vec3 vP;
   void main(){vec3 n=normalize(vN);float f=pow(1.-abs(dot(n,normalize(vV))),2.6);
    float spec=pow(max(dot(n,normalize(vec3(-.45,.6,.65))),0.),40.)*1.4;float lower=smoothstep(-.2,-1.,vP.y/.82)*.35;
    float a=(f*1.05+.035+spec+lower*f)*uAlpha*(1.+uPulse*.5);gl_FragColor=vec4(vec3(.9,.94,1.)*a,a);}`}));
 // Glass body: a solid lens ball. Each pixel looks through the sphere and samples the backdrop plate along the bent ray,
 // so the lake shows inverted and compressed inside it, the way a real crystal ball does.
 const glassUniforms={uBack:backMat.uniforms.map,uBackSize:{value:new Vector2(1,1)},uBackY:{value:0},uBackD:{value:BACK_D},uFade:{value:0},uAlpha:orbUniforms.uAlpha};
 const glassMat=keep(new ShaderMaterial({uniforms:glassUniforms,transparent:true,depthWrite:false,
  vertexShader:`varying vec3 vN;varying vec3 vP;
   void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vP=mv.xyz;gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform sampler2D uBack;uniform vec2 uBackSize;uniform float uBackY;uniform float uBackD;uniform float uFade;uniform float uAlpha;
   varying vec3 vN;varying vec3 vP;
   vec3 look(vec3 d){d.z=min(d.z,-.05);vec2 h=d.xy*(uBackD/-d.z);vec2 uv=vec2(h.x/uBackSize.x+.5,(h.y-uBackY)/uBackSize.y+.5);return texture2D(uBack,clamp(uv,.002,.998)).rgb;}
   void main(){vec3 n=normalize(vN),v=normalize(vP);float edge=1.-abs(dot(n,-v));
    vec3 d=normalize(v-n*1.15);
    vec3 c=look(d)*.7+look(normalize(v-n*1.22))*.3;
    c=c*1.35*uFade+vec3(.035,.04,.05);
    c*=1.-.55*pow(edge,3.);
    float a=uAlpha*(.9-.25*edge);gl_FragColor=vec4(c,clamp(a,0.,1.));
    #include <colorspace_fragment>
   }`}));
 const glassBody=new Mesh(keep(new SphereGeometry(ORB_R*.995,64,40)),glassMat);glassBody.renderOrder=1;orb.add(glassBody);
 const shell=new Mesh(keep(new SphereGeometry(ORB_R,64,40)),shellMat);shell.renderOrder=2;orb.add(shell);
 // Light ribbons inside the glass: dense points along a few flowing sheets, brightest on their centre lines.
 const ribbons=new Group();orb.add(ribbons);
 {
  const sheets=3,across=small0?40:64,along=small0?120:200,n=sheets*across*along,pos=new Float32Array(n*3),info=new Float32Array(n*2);let k=0;
  for(let s=0;s<sheets;s++)for(let i=0;i<across;i++)for(let j=0;j<along;j++){
   pos[k*3]=j/(along-1)*2-1;pos[k*3+1]=s;pos[k*3+2]=i/(across-1)*2-1;info[k*2]=hash(i,j,s);info[k*2+1]=s;k++;
  }
  const g=keep(new BufferGeometry());g.setAttribute('position',new BufferAttribute(pos,3));g.setAttribute('aInfo',new BufferAttribute(info,2));
  const m=keep(new ShaderMaterial({uniforms:orbUniforms,transparent:true,depthWrite:false,blending:AdditiveBlending,
   vertexShader:`uniform float uTime;uniform float uPulse;attribute vec2 aInfo;varying float vA;
    void main(){float s=aInfo.y;float u=position.x,w=position.z;
     float phase=uTime*(.55+s*.12)+s*2.1;
     float y=.34*sin(u*2.3+phase)*cos(w*.9+s)+(s-1.)*.16+.05*sin(u*7.+phase*1.7)*uPulse;
     vec3 p=vec3(u*.78,y,w*.18*(1.+.4*sin(u*3.+phase)));
     float c=cos(s*1.05),sn=sin(s*1.05);p.xz=mat2(c,-sn,sn,c)*p.xz;
     float r=length(p);vA=smoothstep(.8,.6,r)*exp(-w*w*9.)*(.45+.55*aInfo.x)*.6;
     vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(1.2+1.6*aInfo.x)*(8./-mv.z);}`,
   fragmentShader:`uniform float uAlpha;varying float vA;
    void main(){vec2 d=gl_PointCoord-.5;float a=smoothstep(.5,0.,length(d))*vA*uAlpha;gl_FragColor=vec4(vec3(.92,.95,1.)*a,a);}`}));
  ribbons.add(new Points(g,m));
 }
 ribbons.renderOrder=3;
 // Sparks inside the orb.
 {
  const n=small0?160:320,pos=new Float32Array(n*3);
  for(let i=0;i<n;i++){const r=Math.cbrt(hash(i,1,2))*ORB_R*.85,a=hash(i,3,4)*Math.PI*2,b=Math.acos(hash(i,5,6)*2-1);pos[i*3]=r*Math.sin(b)*Math.cos(a);pos[i*3+1]=r*Math.cos(b);pos[i*3+2]=r*Math.sin(b)*Math.sin(a);}
  const g=keep(new BufferGeometry());g.setAttribute('position',new BufferAttribute(pos,3));
  ribbons.add(new Points(g,keep(new PointsMaterial({color:WHITE,size:.018,transparent:true,opacity:.7,blending:AdditiveBlending,depthWrite:false,fog:false}))));
 }
 // A constellation inside the glass: points near the inner surface joined to their nearest neighbours.
 const net=new Group();orb.add(net);net.renderOrder=3;
 const netPts:Vector3[]=[];{const n=small0?46:72;for(let i=0;i<n;i++){const y=1-2*(i+.5)/n,r=Math.sqrt(1-y*y),a=i*2.39996;const d=ORB_R*(.62+.3*hash(i,7,1));netPts.push(new Vector3(Math.cos(a)*r*d,y*d,Math.sin(a)*r*d));}}
 const netLinePos:number[]=[];netPts.forEach((pt,i)=>{netPts.map((q,j)=>[pt.distanceTo(q),j] as [number,number]).filter(([d,j])=>j>i&&d<ORB_R*.62).sort((a,b)=>a[0]-b[0]).slice(0,2).forEach(([,j])=>{netLinePos.push(pt.x,pt.y,pt.z,netPts[j].x,netPts[j].y,netPts[j].z);});});
 const netLineGeometry=keep(new BufferGeometry());netLineGeometry.setAttribute('position',new BufferAttribute(new Float32Array(netLinePos),3));
 const netLineMat=keep(new LineBasicMaterial({color:WHITE,transparent:true,opacity:0,blending:AdditiveBlending,depthWrite:false,fog:false}));
 const netLines=new LineSegments(netLineGeometry,netLineMat);netLines.renderOrder=3;net.add(netLines);
 const netNodeGeometry=keep(new BufferGeometry());netNodeGeometry.setFromPoints(netPts);
 const netNodeMat=keep(new PointsMaterial({color:WHITE,map:glow,size:.11,transparent:true,opacity:0,blending:AdditiveBlending,depthWrite:false,fog:false}));
 const netNodes=new Points(netNodeGeometry,netNodeMat);netNodes.renderOrder=3;net.add(netNodes);
 // Two orbit rings of fine particles around the glass, each with a bright runner. Particles behind the sphere are
 // dimmed in the shader, as if seen through the glass.
 const orbitUniforms={uAlpha:{value:0}};
 const orbitMat=keep(new ShaderMaterial({uniforms:orbitUniforms,transparent:true,depthWrite:false,blending:AdditiveBlending,
  vertexShader:`attribute float aSeed;varying float vA;
   void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vec4 c=modelViewMatrix*vec4(0.,0.,0.,1.);
    float behind=step(mv.z,c.z-.02);vA=(.55+.45*aSeed)*(1.-.7*behind);gl_Position=projectionMatrix*mv;gl_PointSize=(2.2+3.6*aSeed)*(9./-mv.z);}`,
  fragmentShader:`uniform float uAlpha;varying float vA;void main(){float a=smoothstep(.5,0.,length(gl_PointCoord-.5))*vA*uAlpha;gl_FragColor=vec4(vec3(.94,.96,1.)*a,a);}`}));
 const orbits=[[1.38,1.32,.24],[1.55,1.42,-.3]].map(([radius,tiltX,tiltZ],k)=>{
  const n=small0?160:300,pos=new Float32Array(n*3),seed=new Float32Array(n);
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2,j=(hash(i,k,9)-.5)*.03;pos[i*3]=Math.cos(a)*ORB_R*radius*(1+j);pos[i*3+1]=(hash(i,k,4)-.5)*.02;pos[i*3+2]=Math.sin(a)*ORB_R*radius*(1+j);seed[i]=Math.pow(hash(i,k,5),3);}
  const g=keep(new BufferGeometry());g.setAttribute('position',new BufferAttribute(pos,3));g.setAttribute('aSeed',new BufferAttribute(seed,1));
  const ring=new Points(g,orbitMat);ring.renderOrder=3;const pivot=new Group();pivot.rotation.set(tiltX,0,tiltZ);pivot.add(ring);orb.add(pivot);
  const runnerMat=keep(new MeshBasicMaterial({color:WHITE,map:glow,transparent:true,opacity:0,blending:AdditiveBlending,depthWrite:false,fog:false}));
  const runner=new Mesh(keep(new PlaneGeometry(.34,.34)),runnerMat);runner.renderOrder=4;pivot.add(runner);
  return {ring,pivot,runner,runnerMat,radius:ORB_R*radius,speed:k?-.42:.3};
 });
 const orbHaloMat=keep(new MeshBasicMaterial({color:WHITE,map:glow,transparent:true,opacity:0,blending:AdditiveBlending,depthWrite:false,fog:false}));
 const orbHalo=new Mesh(keep(new PlaneGeometry(4.2,4.2)),orbHaloMat);scene.add(orbHalo);
 const poolMat=keep(new MeshBasicMaterial({color:WHITE,map:glow,transparent:true,opacity:0,blending:AdditiveBlending,depthWrite:false,fog:false}));
 const pool=new Mesh(keep(new PlaneGeometry(2.6,2.6)),poolMat);pool.rotation.x=-Math.PI/2;pool.position.y=TOP+.015;rig.add(pool);
 const pickMat=keep(new MeshBasicMaterial({colorWrite:false,depthWrite:false}));
 const pickOrb=new Mesh(keep(new SphereGeometry(ORB_R*1.05,16,12)),pickMat);orb.add(pickOrb);
 // Satellites: small glass beads that come out of the orb at the act 1 checkpoint (the AI services).
 const beadGeometry=keep(new SphereGeometry(.15,32,20)),beadCoreGeometry=keep(new PlaneGeometry(.2,.2)),beadRingGeometry=keep(new TorusGeometry(.26,.004,6,64)),beadPick=keep(new SphereGeometry(.34,10,8));
 const sats=SATS.map(([x,y,z])=>{
  const g=new Group(),body=new Mesh(beadGeometry,glassMat);body.renderOrder=1;g.add(body);const bead=new Mesh(beadGeometry,shellMat);bead.renderOrder=2;g.add(bead);
  const core=new Mesh(beadCoreGeometry,keep(new MeshBasicMaterial({color:WHITE,map:glow,transparent:true,opacity:0,blending:AdditiveBlending,depthWrite:false,fog:false})));core.renderOrder=3;g.add(core);
  const ringMat=keep(new MeshBasicMaterial({color:WHITE,transparent:true,opacity:0,blending:AdditiveBlending,depthWrite:false,fog:false})),ring=new Mesh(beadRingGeometry,ringMat);g.add(ring);
  const haloMat=keep(new MeshBasicMaterial({color:WHITE,map:glow,transparent:true,opacity:0,blending:AdditiveBlending,depthWrite:false,fog:false})),halo=new Mesh(keep(new PlaneGeometry(1.1,1.1)),haloMat);g.add(halo);
  const pick=new Mesh(beadPick,pickMat);g.add(pick);g.visible=false;orb.add(g);
  return {group:g,ring,ringMat,haloMat,halo,core,pick,rest:new Vector3(x,y,z),level:0};
 });
 // Beam from the orb to whatever is selected.
 // The beam is drawn over the scene: it always leaves the orb in front of the X and lands on the X's visible face.
 const beamMat=keep(new MeshBasicMaterial({color:WHITE,transparent:true,opacity:0,blending:AdditiveBlending,depthWrite:false,depthTest:false,fog:false}));
 const beam=new Mesh(keep(new CylinderGeometry(.006,.014,1,8,1,true)),beamMat);beam.visible=false;scene.add(beam);
 const beamGlowMat=keep(new MeshBasicMaterial({color:WHITE,transparent:true,opacity:0,blending:AdditiveBlending,depthWrite:false,depthTest:false,fog:false}));
 const beamGlow=new Mesh(keep(new CylinderGeometry(.03,.06,1,12,1,true)),beamGlowMat);beam.add(beamGlow);
 const hitMat=keep(new MeshBasicMaterial({color:WHITE,map:glow,transparent:true,opacity:0,blending:AdditiveBlending,depthWrite:false,fog:false}));
 const hit=new Mesh(keep(new PlaneGeometry(.9,.9)),hitMat);hit.visible=false;scene.add(hit);

 // ---- service rocks with glass plates (act 3) ----
 const plateGeometry=keep(new PlaneGeometry(PLATE_W,PLATE_H)),plateEdges=keep(new EdgesGeometry(new BoxGeometry(PLATE_W+.04,PLATE_H+.04,.03))),platePick=keep(new BoxGeometry(PLATE_W+.1,PLATE_H+.1,.1));
 const arcMats:ShaderMaterial[]=[];
 const isles=MOUNTS.map(([deg,radius,lift],i)=>{
  const a=deg*Math.PI/180,base=new Vector3(Math.sin(a)*radius,0,Math.cos(a)*radius),size=.95+hash(i,7,1)*.35;
  const rock=new Mesh(keep(rockGeometry(11+i*3.7,small0?2:3)),rockMat);rock.scale.set(size*1.05,.85*size,size*.9);rig.add(rock);
  const plate=new Group();rig.add(plate);
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=240;const context=canvas.getContext('2d')!;
  const tex=keep(new CanvasTexture(canvas));tex.colorSpace=SRGBColorSpace;
  const faceMat=keep(new MeshBasicMaterial({map:tex,transparent:true,opacity:0,toneMapped:false,depthWrite:false,fog:false,side:DoubleSide}));
  const face=new Mesh(plateGeometry,faceMat);plate.add(face);
  const edgeMat=keep(new LineBasicMaterial({color:WHITE,transparent:true,opacity:0,fog:false})),edge=new LineSegments(plateEdges,edgeMat);plate.add(edge);
  const haloMat=keep(new MeshBasicMaterial({color:WHITE,map:glow,transparent:true,opacity:0,blending:AdditiveBlending,depthWrite:false,fog:false})),halo=new Mesh(keep(new PlaneGeometry(3,2.2)),haloMat);halo.position.z=-.05;plate.add(halo);
  const pick=new Mesh(platePick,pickMat);plate.add(pick);
  const rings=[ripple(0),ripple(0)];rings.forEach(r=>{r.position.x=base.x;r.position.z=base.z;rig.add(r);});
  // Arc of light from the foot of the X to the rock.
  const top=base.clone().setY(.3),from=new Vector3(base.x*.12,.55,base.z*.12),mid=from.clone().lerp(top,.5).setY(1.6+radius*.18);
  const arcMat=keep(new ShaderMaterial({uniforms:{uDraw:{value:0},uTime:{value:0},uOn:{value:0}},transparent:true,depthWrite:false,blending:AdditiveBlending,fog:false,
   vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
   fragmentShader:`uniform float uDraw;uniform float uTime;uniform float uOn;varying vec2 vUv;
    void main(){float t=vUv.x;if(t>uDraw)discard;float head=smoothstep(uDraw-.12,uDraw,t)*(1.-step(.999,uDraw));
     float pulse=pow(.5+.5*sin(t*18.-uTime*(3.+uOn*4.)),6.);float ends=smoothstep(0.,.06,t)*smoothstep(1.,.92,t);
     float a=ends*(.32+.4*uOn+pulse*(.3+.7*uOn)+head*.8);gl_FragColor=vec4(vec3(.92,.95,1.)*a,a);}`}));
  arcMats.push(arcMat);
  const arc=new Mesh(keep(new TubeGeometry(new QuadraticBezierCurve3(from,mid,top),48,.012,6,false)),arcMat);rig.add(arc);
  drawIcon(context,i,0);tex.needsUpdate=true;
  return {rock,plate,face,faceMat,edgeMat,haloMat,pick,rings,arc,arcMat,context,tex,base,size,lift,level:0,clock:i*1.7,showing:'icon' as 'icon'|'live'};
 });

 // Sculpted basalt from Blender (ai-concierge-preview/media/isle-v1/rocks.glb): one plinth and three islands, in the
 // same local units as rockGeometry (radius about 1, flat top at .45), so they replace the procedural rocks in place
 // as soon as the file arrives.
 new GLTFLoader().load(`${MEDIA}/rocks.glb`,gltf=>{
  if(stopped)return;const found:Record<string,BufferGeometry>={};
  gltf.scene.traverse(o=>{if(o instanceof Mesh){const key=(o.parent&&o.parent!==gltf.scene?o.parent.name:o.name).replace(/\.\d+$/,'');found[key]=keep(o.geometry as BufferGeometry);}});
  const plinth=found.ROCK_plinth,islands=['ROCK_island_1','ROCK_island_2','ROCK_island_3'].map(n=>found[n]).filter(Boolean);
  if(plinth){const old=centre.geometry;centre.geometry=plinth;old.dispose();}
  if(islands.length)isles.forEach((isle,i)=>{const old=isle.rock.geometry;isle.rock.geometry=islands[i%islands.length];old.dispose();});
  wake();
 },undefined,()=>{/* The procedural rocks stay. */});
 // ---- atmosphere ----
 // Fog banks: the supplied fog images (luminance as alpha), two planes each, at different depths and drift speeds.
 const fogMaps=[1,2,3].map(n=>{const t=keep(loader.load(`${MEDIA}/fog-${n}.webp`,()=>{fogReady++;wake();}));return t;});let fogReady=0;
 const fogs=[0,1,2,3,4,5].map(i=>{
  const m=keep(new MeshBasicMaterial({color:0xb8c0ca,alphaMap:fogMaps[i%3],transparent:true,opacity:0,depthWrite:false,fog:false}));
  const mesh=new Mesh(keep(new PlaneGeometry(24,8)),m);mesh.position.set((hash(i,2,3)-.5)*10,.7+hash(i,4,5)*1.4,-5-i*3.3);mesh.visible=false;scene.add(mesh);
  return {mesh,mat:m,speed:(hash(i,6,7)-.5)*.25,x:mesh.position.x,base:.19+hash(i,8,9)*.12};
 });

 const dustCount=small0?160:340,dust=new Float32Array(dustCount*3);
 for(let i=0;i<dustCount;i++){dust[i*3]=(hash(i,1,1)-.5)*22;dust[i*3+1]=.2+hash(i,2,2)*6;dust[i*3+2]=(hash(i,3,3)-.5)*16;}
 const dustGeometry=keep(new BufferGeometry());dustGeometry.setAttribute('position',new BufferAttribute(dust,3));
 const dustMat=keep(new PointsMaterial({color:WHITE,size:.022,transparent:true,opacity:.35,blending:AdditiveBlending,depthWrite:false,sizeAttenuation:true,fog:false}));
 const dustPoints=new Points(dustGeometry,dustMat);scene.add(dustPoints);

 // ---- state ----
 let story:StoryPosition|null=null,small=host.small,paused=false,stopped=false,raf=0,lastNow=0,time=0,width=1,height=1;
 let quality=Math.min(devicePixelRatio||1,small?1.5:2),slow=0,fps=60;
 const pointer=new Vector2(0,0),ndc=new Vector2(2,2);let pointerInside=false;
 let hover:[number,number]|null=null,locked:[number,number]|null=null,domActive:[number,number]|null=null,orbHover=false;
 let talkPulse=0,isleYaw=0,xYaw=0,xPitch=0,dragging=false,dragX=0,dragY=0,dragMoved=0,downAt:[number,number]|null=null,beamLevel=0,lockMix=0;
 const look=new Vector3(),tilt=new Vector2(),zero2=new Vector2();
 const stageBox={left:0,top:0,width:1,height:1};
 const lastPlaced:string[]=['','',''];
 const tmpQ=new Quaternion(),raycaster=new Raycaster(),tmp=new Vector3(),tmp2=new Vector3(),tmp3=new Vector3(),up=new Vector3(0,1,0);

 const active=()=>locked??hover??domActive;
 function measure(){
  const s=host.screen.getBoundingClientRect(),g=host.stage.getBoundingClientRect();
  stageBox.left=s.left-g.left;stageBox.top=s.top-g.top;stageBox.width=s.width;stageBox.height=s.height;
  width=Math.max(1,s.width);height=Math.max(1,s.height);
 }
 function resize(nextSmall:boolean){
  small=nextSmall;measure();renderer.setPixelRatio(quality);renderer.setSize(width,height,false);
  camera.aspect=width/height;lastPlaced.fill('');
  if(mirror)(water as Reflector).getRenderTarget().setSize(Math.round(width*quality*.5),Math.round(height*quality*.5));
 }
 function project(v:Vector3,side:NodePlacement['side']):NodePlacement{
  tmp2.copy(v).project(camera);
  return {x:stageBox.left+(tmp2.x*.5+.5)*stageBox.width,y:stageBox.top+(-tmp2.y*.5+.5)*stageBox.height,depth:0,side};
 }
 function placeNodes(cp:number,pts:NodePlacement[]){
  const key=pts.map(p=>`${Math.round(p.x)},${Math.round(p.y)},${p.side}`).join(';');
  if(key===lastPlaced[cp])return;lastPlaced[cp]=key;host.place(cp,pts);
 }
 // World-space anchor of a service node: where its label sits and where the orb's beam lands.
 // Where the beam lands: on the X it hits the face turned toward the camera, just inside the tip.
 function beamTarget(cp:number,i:number,out:Vector3){
  if(cp!==1)return anchor(cp,i,out);
  tmp3.copy(camera.position);xMesh.worldToLocal(tmp3);const face=tmp3.z>=0?.27:-.27;
  return out.set(X_TIPS[i][0]*.82,X_TIPS[i][1]*.82,face).applyMatrix4(xMesh.matrixWorld);
 }
 function anchor(cp:number,i:number,out:Vector3){
  if(cp===0)return sats[i].group.getWorldPosition(out);
  if(cp===1)return out.set(X_TIPS[i][0]*1.15,X_TIPS[i][1]*1.15,0).applyMatrix4(xPivot.matrixWorld);
  return isles[i].plate.getWorldPosition(out);
 }
 const setRipple=(r:Mesh,progress:number,radius:number,lag:number)=>{
  const t=clamp(progress*1.15-lag);(r.material as MeshBasicMaterial).opacity=Math.sin(Math.PI*t)*.32;r.scale.setScalar(radius*(.6+t*1.6));
 };

 function frame(now:number){
  const dt=lastNow?Math.min(.05,(now-lastNow)/1000):1/60;lastNow=now;time+=dt;
  const p=story;if(!p)return;
  // Adaptive quality: step the resolution down when frames run long, never back up (no oscillation).
  fps=lerp(fps,1/Math.max(dt,.001),.05);
  if(dt>.03)slow++;else slow=Math.max(0,slow-1);
  if(slow>45&&quality>1){quality=Math.max(1,quality-.25);slow=0;resize(small);}

  // ---- scroll-driven values ----
  const c=p.clip,run=p.hold?1:p.progress;
  const emerge=c>0?1:smooth(run/.6),orbOn=c>0?1:smooth((run-.35)/.6);
  const rise=c>1?1:c===1?smooth((run-.1)/.85):0,deploy=c===2?run:0,closing=p.converge;
  const grow=c>1?1:c===1?smooth(run/.6):0;// the centre rock widens into the X's plinth

  // ---- camera ----
  let from=CAMERA[0],to=CAMERA[1];const mix=smooth(run);
  if(c===1){from=CAMERA[1];to=CAMERA[2];}else if(c===2){from=CAMERA[2];to=CAMERA[3];}
  const narrow=clamp((1.45-camera.aspect)/.9),reach=1+narrow*.75;// phones: pull back so the whole isle fits the band
  const k=(i:0|1|2)=>lerp(lerp(from.pos[i],to.pos[i],mix),CAMERA[4].pos[i],closing);
  const t=(i:0|1|2)=>lerp(lerp(from.target[i],to.target[i],mix),CAMERA[4].target[i],closing);
  look.set(t(0),t(1),t(2));
  const sway=pointerInside&&!small?1:0;
  camera.position.set(k(0)*reach+pointer.x*.3*sway,look.y+(k(1)-look.y)*reach-pointer.y*.15*sway,k(2)*reach);
  lockMix=lerp(lockMix,locked&&locked[0]===2?1:0,1-Math.exp(-dt*5));
  if(lockMix>.001&&locked){isles[locked[1]].plate.getWorldPosition(tmp);look.lerp(tmp,lockMix*.4);camera.position.lerp(tmp,lockMix*.14);}
  camera.lookAt(look);
  const off=small?0:lerp(lerp(from.off,to.off,mix),CAMERA[4].off,closing);
  camera.setViewOffset(width,height,-off*width,0,width,height);
  camera.updateMatrixWorld();

  // ---- backdrop: cover the view and put the plate's horizon on the true horizon ----
  const halfH=Math.tan(camera.fov*Math.PI/360)*BACK_D,viewH=halfH*2*1.18,viewW=viewH*Math.max(camera.aspect,1e-3)*1.1;
  tmp.set(0,0,-1).applyQuaternion(camera.quaternion).setY(0).normalize().multiplyScalar(1e4).add(camera.position);
  tmp.applyMatrix4(camera.matrixWorldInverse);const horizonY=tmp.y/-tmp.z*BACK_D;
  // Cover the whole view while the plate's horizon sits on the true horizon: tall enough above and below it.
  const bh=Math.max(viewH,viewW/IMG_ASPECT,(halfH*1.1-horizonY)/IMG_HORIZON,(halfH*1.1+horizonY)/(1-IMG_HORIZON)),bw=bh*IMG_ASPECT;
  backdrop.scale.set(bw,bh,1);backdrop.position.set(0,horizonY-(.5-IMG_HORIZON)*bh,-BACK_D);
  backFade=lerp(backFade,backReady?1:0,1-Math.exp(-dt*3));backMat.uniforms.uFade.value=backFade;
  glassUniforms.uBackSize.value.set(bw,bh);glassUniforms.uBackY.value=backdrop.position.y;glassUniforms.uFade.value=backFade;

  // ---- water, moon, fog ----
  waterUniforms.uTime.value=time;pathMat.uniforms.uTime.value=time;pathMat.uniforms.uAlpha.value=.35+.15*emerge;
  moon.intensity=1.2+1.2*emerge;ambient.intensity=.12+.08*emerge;
  fogs.forEach((f,i)=>{f.mesh.position.x=f.x+Math.sin(time*.04+i)*2+time*f.speed%8;f.mesh.quaternion.copy(camera.quaternion);f.mesh.visible=fogReady===3;f.mat.opacity=f.base*(1.15-.55*deploy)*(1-.5*closing);});
  dustPoints.rotation.y=time*.01;

  // ---- centre rock, rising out of the water in act 1 and widening into a plinth in act 2 ----
  const sx=lerp(1.25,2.5,grow),sy=lerp(.85,1.05,grow),sz=lerp(1.05,1.95,grow);
  const surface=lerp(-1.4,TOP,emerge);
  centre.scale.set(sx,sy,sz);centre.position.y=surface-.45*sy;
  setRipple(centreRipples[0],c===0&&!p.hold?run/.7:c===1&&!p.hold?run:1,1.6+grow*1.4,0);
  setRipple(centreRipples[1],c===0&&!p.hold?run/.7:c===1&&!p.hold?run:1,1.6+grow*1.4,.3);
  rig.rotation.y=isleYaw+Math.sin(time*.17)*.025;

  // ---- the orb: forms on its rock in act 1, lifts above the X in act 2 ----
  const lift=c===0?0:c===1?smooth(run/.8):1;
  const orbY=lerp(ORB_REST+(surface-TOP),c===2?lerp(3.9,4.35,smooth(run)):3.9,lift),orbScale=lerp(1,.44,lift)*(.55+.45*orbOn);
  const orbZ=c===0?0:c===1?lerp(0,.9,lift):lerp(.9,-.55,smooth(run));
  orb.position.set(0,orbY+Math.sin(time*1.05)*.035*lift+Math.sin(time*.8)*.012,orbZ);orb.scale.setScalar(orbScale);
  talkPulse=Math.max(0,talkPulse-dt*1.5);
  orbUniforms.uTime.value=time;orbUniforms.uAlpha.value=orbOn*(orbHover?1.25:1);orbUniforms.uPulse.value=Math.max(talkPulse,orbHover?.4:0);
  // The ribbons lean toward the cursor, so the orb seems to pay attention.
  const a=active();
  tilt.lerp(pointerInside&&!small?pointer:zero2,1-Math.exp(-dt*3));
  ribbons.rotation.set(-tilt.y*.35,tilt.x*.5+time*.05,0);
  net.rotation.set(-tilt.y*.25,time*.07+tilt.x*.35,0);netLineMat.opacity=orbOn*(.22+.2*talkPulse+(orbHover?.1:0));netNodeMat.opacity=orbOn*(.85+.15*Math.sin(time*2.2));
  orbitUniforms.uAlpha.value=orbOn*(1-.45*lift);
  orbits.forEach(o=>{o.ring.rotation.y=time*o.speed*.35;const a=time*o.speed*2.2;o.runner.position.set(Math.cos(a)*o.radius,0,Math.sin(a)*o.radius);
   o.runner.quaternion.copy(o.pivot.getWorldQuaternion(tmpQ)).invert().multiply(camera.quaternion);
   o.runner.getWorldPosition(tmp3);tmp2.copy(tmp3).applyMatrix4(camera.matrixWorldInverse);orb.getWorldPosition(tmp3).applyMatrix4(camera.matrixWorldInverse);
   o.runnerMat.opacity=orbOn*(1-.45*lift)*(tmp2.z<tmp3.z?.25:.95);});
  orb.getWorldPosition(orbHalo.position);orbHalo.quaternion.copy(camera.quaternion);orbHalo.scale.setScalar(orbScale*(1+talkPulse*.4));
  orbHaloMat.opacity=orbOn*(.26+.2*talkPulse+(orbHover?.12:0));
  pool.position.y=TOP+.015;poolMat.opacity=orbOn*(1-lift)*.5;pool.scale.setScalar(1+grow*.6);
  orbLight.position.copy(orbHalo.position).y-=.2;orbLight.intensity=orbOn*(2.2+talkPulse*3)*(1-lift*.55);
  // Satellites leave the orb as the checkpoint arrives and return as it releases.
  const launch=c===0&&p.hold?(p.phase.endsWith('_ARRIVAL')?smooth(p.local):p.phase.endsWith('_RELEASE')?1-smooth(p.local):1):0;
  sats.forEach((s,i)=>{
   s.group.visible=launch>.01;if(!s.group.visible)return;
   s.level=lerp(s.level,a?.[0]===0&&a[1]===i?1:0,1-Math.exp(-dt*9));
   s.group.position.copy(s.rest).multiplyScalar(launch);s.group.position.y+=Math.sin(time*1.2+i*1.9)*.05*launch;
   s.group.scale.setScalar((.4+.6*launch)*(1+s.level*.35));
   s.ring.rotation.set(Math.PI/2-.28,0,time*.6+i);s.ringMat.opacity=(.18+.55*s.level)*launch;
   s.halo.quaternion.copy(rig.quaternion).invert().multiply(camera.quaternion);s.haloMat.opacity=(.1+.4*s.level)*launch;
   s.core.quaternion.copy(s.halo.quaternion);(s.core.material as MeshBasicMaterial).opacity=(.55+.45*s.level)*launch*(.85+.15*Math.sin(time*2.4+i*1.3));
  });

  // ---- the X: rises out of the stone and settles with a slow turn ----
  xPivot.visible=rise>0;
  const settle=c===1&&!p.hold?1-smooth(run):0;
  xPivot.position.y=lerp(X_START,X_REST,rise)+(rise>=1?Math.sin(time*.8)*.025:0);
  xPivot.scale.setScalar(c===2?lerp(1,.86,smooth(deploy/.6)):1);
  xPivot.rotation.set(xPitch,xYaw+settle*Math.PI*.42+(rise>=1?Math.sin(time*.3)*.12:0),0);
  xClip.constant=-(TOP-.02);
  // While the X rises the stone opens in light, so the cut through the rock reads as a gateway, not as debris.
  const gate=c===1&&!p.hold?Math.sin(Math.PI*clamp((run-.05)/.9)):0;
  if(gate>0){poolMat.opacity=Math.max(poolMat.opacity,gate);pool.scale.setScalar(1.6+gate*1.2);}
  xGlowMat.opacity=rise*(.1+.04*Math.sin(time*.7))+gate*.45;xGlow.position.y=xPivot.position.y;
  xMat.emissiveIntensity=.12+.08*rise+gate*.25+(a?.[0]===1&&c===1&&p.hold?.08:0);

  // ---- service rocks ----
  rig.updateMatrixWorld(true);
  const toCam=tmp3.copy(camera.position).applyMatrix4(rig.matrixWorld.clone().invert());
  isles.forEach((isle,i)=>{
   const out=c===2?smooth((deploy-i*.07)/.55):0,on=a?.[0]===2&&a[1]===i&&c===2&&p.hold?1:0;
   isle.level=lerp(isle.level,on,1-Math.exp(-dt*8));
   const visible=out>.001;isle.rock.visible=isle.plate.visible=isle.arc.visible=visible;
   setRipple(isle.rings[0],c===2?deploy*1.4-i*.1:0,isle.size*1.3,0);setRipple(isle.rings[1],c===2?deploy*1.4-i*.1:0,isle.size*1.3,.3);
   if(!visible)return;
   const rockTop=lerp(-1.2,.32,out);isle.rock.position.set(isle.base.x,rockTop-.45*isle.rock.scale.y,isle.base.z);
   const plateOut=smooth((out-.35)/.65);
   isle.plate.position.set(isle.base.x,rockTop+isle.lift*plateOut+.45+Math.sin(time*.9+i*1.3)*.04+isle.level*.18,isle.base.z);
   isle.plate.scale.setScalar((.35+.65*plateOut)*(1+isle.level*.22));
   isle.plate.rotation.set(-.06,Math.atan2(toCam.x-isle.base.x,toCam.z-isle.base.z),0);
   isle.faceMat.opacity=plateOut*(out<.9?.75+.25*Math.sin(time*30+i):1);isle.edgeMat.opacity=plateOut*(.45+.55*isle.level);isle.haloMat.opacity=plateOut*(.12+.4*isle.level);
   isle.arcMat.uniforms.uDraw.value=smooth((out-.2)/.8);isle.arcMat.uniforms.uTime.value=time;isle.arcMat.uniforms.uOn.value=isle.level;
   // The selected plate plays its miniature; the rest show their icon.
   if(isle.level>.05){isle.clock+=dt;drawModule(isle.context,i,isle.clock,isle.level>.4);isle.tex.needsUpdate=true;isle.showing='live';}
   else if(isle.showing==='live'){drawIcon(isle.context,i,0);isle.tex.needsUpdate=true;isle.showing='icon';}
  });

  // ---- beam from the orb to the selected service ----
  rig.updateMatrixWorld(true);
  orb.getWorldPosition(tmp);
  const target=a&&p.hold&&a[0]===c&&a[0]!==0?beamTarget(a[0],a[1],new Vector3()):null;
  // Leave the orb from its surface on the side facing the target, not from its centre.
  if(target)tmp.addScaledVector(tmp3.copy(target).sub(tmp).normalize(),ORB_R*orbScale*.92);
  beamLevel=lerp(beamLevel,target?1:0,1-Math.exp(-dt*(target?10:6)));
  if(target&&beamLevel>.01){
   const length=tmp.distanceTo(target);beam.visible=hit.visible=true;
   beam.position.copy(tmp).lerp(target,.5);beam.quaternion.setFromUnitVectors(up,tmp2.copy(target).sub(tmp).normalize());beam.scale.set(1,length,1);
   beam.renderOrder=beamGlow.renderOrder=hit.renderOrder=10;beamMat.opacity=beamLevel*(.6+.15*Math.sin(time*20));beamGlowMat.opacity=beamLevel*(.1+.04*Math.sin(time*7));hit.position.copy(target);hit.quaternion.copy(camera.quaternion);hit.scale.setScalar(.8+.12*Math.sin(time*8));hitMat.opacity=beamLevel*.7;
  }else{beam.visible=hit.visible=false;}

  // ---- labels ----
  if(p.hold){
   if(c===0){
    // Labels sit above the upper satellites and below the lower ones, clear of the bead and its ring, so the four
    // boxes stay in the gap between the hero copy and the concierge panel instead of covering the beads.
    tmp3.setFromMatrixColumn(camera.matrixWorld,1);
    placeNodes(0,sats.map((s,i)=>{const upper=SATS[i][1]>0,side=upper?'above':'below',at=anchor(0,i,tmp),n=project(at,side),ry=n.y;
     const edge=project(at.addScaledVector(tmp3,.3*s.group.getWorldScale(tmp2).x),side).y,gap=Math.abs(edge-ry)+10;
     n.y=ry+(upper?-gap:gap);return n;}));
   }
   else if(c===1)placeNodes(1,X_TIPS.map((_,i)=>{const n=project(anchor(1,i,tmp),'right');n.side=n.x<stageBox.left+stageBox.width*(.5+off)?'left':'right';return n;}));
   else placeNodes(2,isles.map((isle,i)=>project(anchor(2,i,tmp).setY(tmp.y-PLATE_H*.62*isle.plate.scale.y),'below')));
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
 function pick():{kind:'orb'|'sat'|'x'|'isle';index:number}|null{
  const p=story;if(!p||!pointerInside)return null;
  raycaster.setFromCamera(ndc,camera);
  const c=p.clip,ready=p.hold;
  if(c===0&&ready){for(let i=0;i<sats.length;i++)if(sats[i].group.visible&&raycaster.intersectObject(sats[i].pick,false).length)return {kind:'sat',index:i};}
  if(raycaster.intersectObject(pickOrb,false).length&&(c>0||ready))return {kind:'orb',index:0};
  if(c===2&&ready){for(let i=0;i<isles.length;i++)if(raycaster.intersectObject(isles[i].pick,false).length||raycaster.intersectObject(isles[i].rock,false).length)return {kind:'isle',index:i};}
  if(c===1&&ready){
   const x=raycaster.intersectObject(xMesh,false)[0];
   if(x){const local=xPivot.worldToLocal(x.point.clone());let best=0,d=Infinity;X_TIPS.forEach(([u,v],i)=>{const q=(local.x-u)**2+(local.y-v)**2;if(q<d){d=q;best=i;}});return {kind:'x',index:best};}
  }
  return null;
 }
 const cpOf=(kind:'sat'|'x'|'isle')=>kind==='sat'?0:kind==='x'?1:2;
 function setHover(next:[number,number]|null){
  if(next?.[0]===hover?.[0]&&next?.[1]===hover?.[1])return;
  const previous=hover;hover=next;
  if(previous&&!(locked&&locked[0]===previous[0]&&locked[1]===previous[1]))host.hover(previous[0],null);
  if(next)host.hover(next[0],next[1]);else if(locked)host.hover(locked[0],locked[1]);
 }
 function refreshHover(target:EventTarget|null){
  if(interactive(target)||dragging){orbHover=false;setHover(null);host.stage.style.removeProperty('cursor');return;}
  const found=pick();orbHover=found?.kind==='orb';
  // A locked service stays selected until it is clicked again; hovering others does not steal it.
  setHover(locked||!found||found.kind==='orb'?null:[cpOf(found.kind),found.index]);
  if(found)host.stage.style.cursor='pointer';else host.stage.style.removeProperty('cursor');
 }
 function onMove(e:PointerEvent){
  setPointer(e);
  if(dragging&&story){
   const dx=e.clientX-dragX,dy=e.clientY-dragY;dragX=e.clientX;dragY=e.clientY;dragMoved+=Math.abs(dx)+Math.abs(dy);
   if(story.checkpoint===1){xYaw+=dx*.008;xPitch=clamp(xPitch+dy*.004,-.4,.4);}
   else isleYaw=clamp(isleYaw+dx*.004,-.55,.55);
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
  if(found.kind==='orb'){talkPulse=1;host.talk();return;}
  const next:[number,number]=[cpOf(found.kind),found.index];
  const same=locked&&locked[0]===next[0]&&locked[1]===next[1];
  if(locked&&!same)host.hover(locked[0],null);
  locked=same?null:next;host.hover(next[0],same?null:next[1]);
  if(same&&e.pointerType!=='mouse')hover=null;
 }
 host.stage.addEventListener('pointermove',onMove,{signal,passive:true});
 host.stage.addEventListener('pointerdown',onDown,{signal,passive:true});
 window.addEventListener('pointerup',onUp,{signal,passive:true});
 window.addEventListener('pointercancel',()=>{dragging=false;downAt=null;},{signal,passive:true});
 host.stage.addEventListener('pointerleave',()=>{pointerInside=false;orbHover=false;if(!dragging)setHover(null);host.stage.style.removeProperty('cursor');},{signal,passive:true});
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
  stats(){const a=active();return {phase:story?.phase??'',quality,fps:Math.round(fps),active:a?[a[0],a[1]]:null,locked:!!locked,yaw:story?.checkpoint===1?xYaw:isleYaw,power:moon.intensity};},
  frame(){frame(performance.now());},
  dispose(){
   stopped=true;cancelAnimationFrame(raf);host.stage.style.removeProperty('cursor');
   disposables.forEach(d=>d.dispose());renderer.dispose();
  },
 };
}
