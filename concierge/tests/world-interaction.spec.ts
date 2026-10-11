import {test,expect,type Page} from '@playwright/test';
const route='/ai-concierge-preview/';
const phase=(page:Page)=>page.locator('[data-cinema-story]').getAttribute('data-phase');
async function live(page:Page,cp:number){
 const s=page.locator('[data-cinema-story]');await s.locator(`[data-cinema-seek="${cp}"]`).click();
 await expect(s).toHaveAttribute('data-world','on',{timeout:15000});
 await expect(page.locator('[data-world-canvas]')).toHaveAttribute('data-visible','true',{timeout:15000});
 return s;
}
test('one persistent WebGL world answers drag and service nodes at every checkpoint',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(route);const canvas=page.locator('[data-world-canvas]');
 for(const [cp,name,nodes] of [[0,'ORB',4],[1,'X',4],[2,'ENGINE',10]] as const){
  const s=await live(page,cp);expect(await phase(page)).toBe(`${name}_EXPLORE`);
  await expect(s.locator(`[data-world-nodes="${cp}"] [data-world-node]`)).toHaveCount(nodes);
  // Horizontal drag on empty stage rotates; the page does not scroll.
  const before=await page.evaluate(()=>scrollY);await page.mouse.move(760,640);await page.mouse.down();for(let i=1;i<=8;i++)await page.mouse.move(760+i*25,642);await page.mouse.up();
  expect(await page.evaluate(()=>scrollY)).toBe(before);await expect(canvas).toHaveAttribute('data-visible','true');
  // Nodes are zero-size anchors; their link is the hit target.
  const node=s.locator(`[data-world-nodes="${cp}"] [data-world-node]`).first();await node.locator('a').hover();await expect(node).toHaveAttribute('data-active','');
  await expect(s.locator(`[data-world-nodes="${cp}"]`)).toHaveAttribute('data-has-active','');
 }
 // The same canvas element (and context) served all three checkpoints.
 expect(await canvas.count()).toBe(1);expect(await page.evaluate(()=>document.querySelectorAll('canvas[data-world-canvas]').length)).toBe(1);
 expect(errors).toEqual([]);
});
test('reverse scrolling walks every state back without black frames or stuck pins',async({page})=>{
 // Up to 160 wheel steps with a settle wait each: this walk alone runs close to the default 30 s budget.
 test.setTimeout(60000);
 await page.goto(route);const s=await live(page,2);const seen:string[]=[];
 for(let i=0;i<160&&(await phase(page))!=='INTRO';i++){await page.mouse.wheel(0,-150);await page.waitForTimeout(60);const p=await phase(page);if(p&&seen.at(-1)!==p)seen.push(p);await expect(s).toHaveAttribute('data-ready','');}
 for(const expected of ['ENGINE_ARRIVAL','VIDEO_3','X_RELEASE','X_EXPLORE','VIDEO_2','ORB_RELEASE','ORB_EXPLORE','VIDEO_1'])expect(seen,`missing ${expected} in ${seen.join(' > ')}`).toContain(expected);
 expect(seen.indexOf('VIDEO_3')).toBeLessThan(seen.indexOf('X_EXPLORE'));expect(seen.indexOf('VIDEO_2')).toBeLessThan(seen.indexOf('ORB_EXPLORE'));
});
test('touch keeps vertical scrolling native and nodes need a deliberate second tap',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto(route);const s=await live(page,1);
 expect(await s.locator('.cinema-stage').evaluate(n=>getComputedStyle(n).touchAction)).toBe('pan-y pinch-zoom');
 // Phones split the checkpoint: the chapter link lands on its copy (screen a), the services follow one scroll later (b).
 await expect(s).toHaveAttribute('data-sub','a');await expect(s.locator('[data-world-nodes="1"]')).toBeHidden();
 await page.evaluate(()=>scrollBy(0,document.querySelector<HTMLElement>('.cinema-stage')!.offsetHeight*.75));
 await expect(s).toHaveAttribute('data-sub','b');await expect(s.locator('.cinema-core .cinema-actions')).toBeHidden();
 const node=s.locator('[data-world-nodes="1"] [data-world-node]').first();await node.locator('a').tap();
 await expect(node).toHaveAttribute('data-active','');await expect(page).toHaveURL(/ai-concierge-preview\/$/);
 await node.locator('a').tap();await expect(page).toHaveURL(/cinematic\/$/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
});
test('without WebGL the exact stills, nodes and links remain',async({page})=>{
 await page.goto(route+'?world=0');const s=page.locator('[data-cinema-story]');await s.locator('[data-cinema-seek="0"]').click();
 await expect(s).toHaveAttribute('data-world','fallback');await expect(page.locator('[data-world-canvas]')).toBeHidden();
 await expect(s.locator('[data-world-nodes="0"] a[href$="/concierge/"]')).toBeVisible();await expect(page.locator('#orb')).toBeVisible();
});
test('phones: the film band stays on top and no screen runs into the chapter dock',async({page})=>{
 test.setTimeout(150000);
 for(const [w,h] of [[390,664],[360,740],[430,932]]){
  await page.setViewportSize({width:w,height:h});await page.goto(route);const s=page.locator('[data-cinema-story]');
  await s.evaluate(n=>scrollTo({top:n.getBoundingClientRect().top+scrollY,behavior:'instant'}));await expect(s).toHaveAttribute('data-ready','',{timeout:15000});
  // Story positions in stage heights: Video 1, ORB a/b, Video 2, X a/b, Video 3, Engine a/b, convergence.
  for(const [pos,sub] of [[2.4,'v'],[3.1,'a'],[3.9,'b'],[5.8,'v'],[7.2,'a'],[8,'b'],[9.9,'v'],[11.3,'a'],[12.1,'b'],[13.2,'c']] as const){
   await page.evaluate(p=>{const n=document.querySelector<HTMLElement>('[data-cinema-story]')!;scrollTo({top:n.getBoundingClientRect().top+scrollY+p*n.querySelector<HTMLElement>('.cinema-stage')!.offsetHeight,behavior:'instant'});},pos);
   await expect(s).toHaveAttribute('data-sub',sub);await page.waitForTimeout(700);
   const r=await page.evaluate(()=>{const n=document.querySelector('[data-cinema-story]')!,screen=n.querySelector('.cinema-screen')!.getBoundingClientRect(),dock=n.querySelector('.cinema-controls nav')!.getBoundingClientRect(),state=[...n.querySelectorAll<HTMLElement>('[data-cinema-state]')].find(e=>!e.hidden)!;
    let top=Infinity,bottom=0;for(const e of state.querySelectorAll<HTMLElement>('.cinema-copy>*,.world-node,.cinema-assistant-panel>*')){if(!e.checkVisibility({opacityProperty:true}))continue;const b=e.getBoundingClientRect();if(!b.height)continue;top=Math.min(top,b.top);bottom=Math.max(bottom,b.bottom);}
    return {screenTop:screen.top,screenH:screen.height,top,bottom,dock:dock.top,vh:innerHeight};});
   const where=`${w}x${h} @${pos} ${JSON.stringify(r)}`;
   expect(r.screenTop,where).toBe(0);expect(r.screenH,where).toBeGreaterThanOrEqual(r.vh*.45);
   expect(r.top,where).toBeGreaterThan(r.screenH*.8);expect(r.bottom,where).toBeLessThanOrEqual(r.dock-4);
  }
 }
});
