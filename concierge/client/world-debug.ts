import type {World} from './world';
// Developer calibration panel, loaded only with ?debug3d=1: stop-frame overlay opacity plus live camera/pose readouts.
export function mountWorldDebug(section:HTMLElement,world:()=>World|null,signal:AbortSignal){
 const panel=document.createElement('aside');panel.setAttribute('aria-label','3D calibration');
 panel.style.cssText='position:fixed;top:12px;right:12px;z-index:9999;width:250px;padding:12px;border:1px solid #39465c;border-radius:8px;background:#010204e8;color:#f1f7fc;font:11px/1.5 ui-monospace,monospace';
 panel.innerHTML='<strong>debug3d</strong><label style="display:block;margin:8px 0">Stop-frame overlay <input type="range" min="0" max="1" step="0.01" value="0" style="width:100%"></label><pre style="margin:0;white-space:pre-wrap;color:#abbee2"></pre>';
 document.body.append(panel);
 const input=panel.querySelector('input')!,pre=panel.querySelector('pre')!;
 input.addEventListener('input',()=>world()?.debug(Number(input.value)),{signal});
 let raf=0;
 const tick=()=>{const w=world(),s=w?.stats();pre.textContent=s?[
  `phase      ${s.phase}`,`progress   ${Number(section.style.getPropertyValue('--cinema-progress')||0).toFixed(4)}`,`explore    ${Number(section.style.getPropertyValue('--world-explore')||0).toFixed(4)}`,
  `checkpoint ${s.checkpoint}  live ${s.live.toFixed(3)}  engaged ${s.engaged}`,`camera     origin → -Z, fov ${s.fov}°`,`view zoom  ${s.zoom.toFixed(4)} @ px ${s.anchor.join(',')}`,
  `object     yaw ${s.yaw.toFixed(3)}  pitch ${s.pitch.toFixed(3)}`,`light      ${s.light.map(v=>v.toFixed(2)).join(', ')}`,`quality    ${s.quality.toFixed(2)}  fps ${s.fps.toFixed(0)}`,`overlay    ${s.overlay.toFixed(2)}`].join('\n'):'world not running';
  raf=requestAnimationFrame(tick);};
 tick();
 signal.addEventListener('abort',()=>{cancelAnimationFrame(raf);panel.remove();},{once:true});
}
