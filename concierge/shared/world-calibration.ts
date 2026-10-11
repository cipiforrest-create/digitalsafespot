// Calibration measured on the exact stop frames (concierge/source-assets/cinema-stops, 864×496 source pixels).
// All live geometry is defined in those pixels, so the WebGL camera reproduces the film composition by construction.
export type Px=readonly [number,number];
export const FRAME={w:864,h:496} as const;
export const FOV=32;// vertical, degrees, across the source frame height
export const FOCAL=FRAME.h/2/Math.tan(FOV*Math.PI/360);
// Sampled from the three stop frames: shadow / mid / bright / peak luminance bands share this cool blue-white cast.
export const palette={shadow:'#010204',mid:'#39465c',bright:'#abbee2',peak:'#f1f7fc'} as const;
export function framePoint(u:number,v:number,depth:number):[number,number,number]{return [(u-FRAME.w/2)*depth/FOCAL,-(v-FRAME.h/2)*depth/FOCAL,-depth];}
export function projectPoint(x:number,y:number,z:number):[number,number]{return [FRAME.w/2+x/-z*FOCAL,FRAME.h/2-y/-z*FOCAL];}
export type FrameRect={x:number;y:number;w:number;h:number;s:number};
// One fit for the film canvas and the live world, so both layers always share the same pixel mapping.
// Desktop: contain. Phones: crop to a region of interest `roi` (source px wide, centred) so objects read large.
export function frameRect(width:number,height:number,src:{w:number;h:number}=FRAME,roi=0):FrameRect{
 // The crop never trims more than ~5 % off the top or bottom, so short phones keep the whole object in view.
 const contain=Math.min(width/src.w,height/src.h),s=roi?Math.max(contain,Math.min(width/(roi*src.w/FRAME.w),height/(src.h*.9))):contain,w=src.w*s,h=src.h*s;
 return {x:(width-w)/2,y:(height-h)/2,w,h,s:w/FRAME.w};
}
// Phone crop per story position: ORB and X fill the band; Video 3 widens to keep all four system tiles in view.
export function mobileRoi(clip:number,progress:number,hold:boolean){const k=Math.min(1,Math.max(0,(progress-.3)/.4));return clip<2?470:hold?590:470+120*k*k*(3-2*k);}
export type NodeCal={anchor:Px;depth:number;side:'left'|'right'};
export type Ring={center:Px;radius:number;ratio:number;roll:number;speed:number};
export const orbCal={
 center:[427,242] as Px,radius:145,depth:10,
 rings:[{center:[427,210],radius:237,ratio:.17,roll:5,speed:.05},{center:[421,248],radius:218,ratio:.26,roll:-9,speed:-.035},{center:[427,242],radius:176,ratio:.44,roll:24,speed:.08}] as Ring[],
 nodes:[{anchor:[318,128],depth:-.6,side:'left'},{anchor:[538,120],depth:.8,side:'right'},{anchor:[556,330],depth:-.3,side:'right'},{anchor:[300,338],depth:.4,side:'left'}] as NodeCal[],
 zoom:{explore:1.07,anchor:[427,236] as Px},
};
export const xCal={
 depth:10,thickness:.34,pivot:[430,222] as Px,
 outline:[[262,88],[358,83],[425,172],[503,82],[598,90],[460,221],[565,350],[492,349],[422,262],[350,349],[277,349],[392,220]] as Px[],
 // Internal channels run along each arm's centreline into the core, one per service node (same order).
 channels:[[[550,86],[428,222]],[[310,86],[428,222]],[[313,349],[428,222]],[[528,350],[428,222]]] as [Px,Px][],
 // Nodes sit on the arm tips in dark space (never on the bright glass); foot nodes drop to pedestal level, clear of the copy.
 nodes:[{anchor:[590,96],depth:.7,side:'right'},{anchor:[272,66],depth:-.5,side:'right'},{anchor:[262,372],depth:.5,side:'left'},{anchor:[598,372],depth:-.2,side:'right'}] as NodeCal[],
 zoom:{explore:1.06,anchor:[430,216] as Px,release:1.04},
};
export const systemCal={
 depth:10,thickness:.26,pivot:[428,320] as Px,
 outline:[[340,258],[379,254],[428,297],[470,254],[522,258],[453,322],[511,385],[468,385],[426,345],[392,385],[352,385],[405,322]] as Px[],
 // Glass tiles in film order: globe, X, sphere, cubes.
 tiles:[[158,62,276,186],[299,62,416,186],[447,62,565,186],[586,62,707,188]] as [number,number,number,number][],
 paths:[[[425,262],[405,240],[262,226],[229,210],[221,190]],[[425,262],[415,242],[398,224],[372,214],[358,204],[357,190]],[[432,262],[442,242],[460,224],[488,214],[506,204],[508,190]],[[432,262],[452,240],[598,226],[632,210],[640,190]]] as Px[][],
 core:[428,322] as Px,base:[430,398] as Px,
 floor:[{center:[430,410],radius:280,ratio:.15,roll:0,speed:.018},{center:[430,406],radius:214,ratio:.15,roll:0,speed:-.026},{center:[430,402],radius:152,ratio:.155,roll:0,speed:.04}] as Ring[],
 // Engine modules sit on the floor rings: [ring, angle in degrees, 90 = far side].
 modules:[[0,180],[1,146],[1,214],[1,326],[1,34],[0,0]] as [number,number][],
 // Convergence pulls the camera back and slides the system right, leaving the left third for the closing copy.
 zoom:{explore:1.035,anchor:[430,150] as Px,converge:.86,shift:.13},
};
export function ringPoint(r:Ring,deg:number):[number,number]{
 const a=deg*Math.PI/180,x=Math.cos(a)*r.radius,y=-Math.sin(a)*r.radius*r.ratio,c=Math.cos(r.roll*Math.PI/180),s=Math.sin(r.roll*Math.PI/180);
 return [r.center[0]+x*c-y*s,r.center[1]+x*s+y*c];
}
export function moduleAnchor(i:number):Px{const [ring,deg]=systemCal.modules[i];return ringPoint(systemCal.floor[ring],deg);}
