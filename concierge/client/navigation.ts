import {pageFromPath,previewPath,type PageId} from '../shared/catalogue';
import {trackPage} from './dom';
let navigation:AbortController|null=null;
export async function navigate(id:PageId,hash='',push=true):Promise<boolean>{
  if(document.querySelector('dialog[open]'))return false;
  const locale=document.documentElement.lang;const path=(locale==='en'||locale==='de'?`/${locale}`:'')+previewPath(id);navigation?.abort();const controller=new AbortController();navigation=controller;
  try{
    if(document.body.dataset.page!==id){
      const response=await fetch(path,{signal:controller.signal,credentials:'same-origin'});
      if(!response.ok||pageFromPath(new URL(response.url).pathname)!==id)throw new Error('Navigation unavailable');
      const html=await response.text();if(html.length>1_000_000)throw new Error('Page too large');
      if(controller.signal.aborted)return false;
      const doc=new DOMParser().parseFromString(html,'text/html');const next=doc.querySelector('main#main');
      if(!next||doc.documentElement.dataset.experience!=='digital-x-preview')throw new Error('Unexpected page');
      // Only registered first-party build output enters the document. Never audit or model HTML.
      next.querySelectorAll('script').forEach(n=>n.remove());
      // Crossfade the page swap where supported instead of a hard cut while the concierge keeps talking.
      // The swap runs once: if the browser is not rendering (a background tab), it falls back to a plain swap.
      let swapped=false;const swap=()=>{if(swapped)return;swapped=true;document.querySelector('main#main')!.replaceWith(document.importNode(next,true));};
      const start=(document as Document&{startViewTransition?:(update:()=>void)=>{updateCallbackDone:Promise<void>}}).startViewTransition;
      if(start&&document.visibilityState==='visible'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)await Promise.race([start.call(document,swap).updateCallbackDone.catch(()=>undefined),new Promise(resolve=>setTimeout(resolve,400))]);
      swap();
      document.title=doc.title;
      for(const selector of ['meta[name="description"]','meta[name="robots"]','meta[name="keywords"]','meta[property="og:image"]','meta[property="og:title"]','meta[property="og:description"]','meta[property="og:url"]','link[rel="canonical"]','link[rel="alternate"][hreflang]','script[data-page-schema]']){
        document.querySelectorAll(selector).forEach(node=>node.remove());doc.querySelectorAll(selector).forEach(node=>document.head.append(document.importNode(node,true)));
      }
      document.body.dataset.page=id;document.dispatchEvent(new Event('concierge:navigated'));
    }
    if(controller.signal.aborted)return false;
    if(push)history.pushState({pageId:id},'',path+hash);
    trackPage();
    const target=hash?document.getElementById(hash.slice(1)):document.querySelector('main h1');
    if(target){target.setAttribute('tabindex','-1');(target as HTMLElement).focus({preventScroll:true});if(hash)target.scrollIntoView({behavior:'instant'});else window.scrollTo(0,0);}
    return true;
  }finally{if(navigation===controller)navigation=null;}
}
