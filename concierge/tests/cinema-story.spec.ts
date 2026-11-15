import {test,expect,type Locator,type Page} from '@playwright/test';
const route='/';
type Stats={phase:string;active:[number,number]|null;locked:boolean;yaw:number};
const stats=(story:Locator)=>story.evaluate(n=>(n as HTMLElement&{deck?:{stats():Stats}}).deck?.stats()??null);
// The rendered playhead eases toward the scroll position: wait until it has arrived before judging a state.
const settled=(page:Page)=>page.waitForFunction(()=>{const s=document.querySelector<HTMLElement>('[data-cinema-story]')!,total=Number(s.style.getPropertyValue('--cinema-travel'));const target=Math.min(total,Math.max(0,-s.getBoundingClientRect().top/s.querySelector<HTMLElement>('.cinema-stage')!.offsetHeight));return Math.abs(Number(s.style.getPropertyValue('--cinema-progress'))*total-target)<.01;},null,{timeout:20000});
const nodePoint=(story:Locator,cp:number,i:number)=>story.locator(`[data-world-nodes="${cp}"] [data-world-node]`).nth(i).evaluate(n=>{const r=n.getBoundingClientRect();return [r.left,r.top] as [number,number];});

test('three acts hold, reverse and expose real controls',async({page})=>{
 await page.goto(route);const story=page.locator('[data-cinema-story]');await expect(story).toHaveAttribute('data-enhanced','');
 await expect(page.locator('h1')).toHaveText('Web stranice, SEO i AI automatizacija za firme u Sarajevu i BiH');await expect(page.locator('#hero-title')).toHaveText('Digitalni Asistent');await expect(page.locator('#hero-title + p')).toHaveText('Uvijek korak ispred.');
 // The whole story is a fraction of the film it replaced: under nine screens of scroll.
 expect(await story.evaluate(n=>(n as HTMLElement).offsetHeight/n.querySelector<HTMLElement>('.cinema-stage')!.offsetHeight)).toBeLessThan(9);
 for(const clip of [0,1,2,1,0]){
  await story.locator(`[data-cinema-seek="${clip}"]`).click();await expect(story).toHaveAttribute('data-stage',String(clip));await expect(story).toHaveAttribute('data-holding','true');
  await expect(story).toHaveAttribute('data-phase',['ORB_EXPLORE','X_EXPLORE','ENGINE_EXPLORE'][clip]);
  await expect(story.locator(`[data-cinema-seek="${clip}"]`)).toHaveAttribute('aria-current','true');
 }
 // Scrolling back from a checkpoint returns to its transformation.
 await story.locator('[data-cinema-seek="1"]').click();await page.mouse.wheel(0,-500);await settled(page);await expect(story).toHaveAttribute('data-phase','ACT_2');
 await story.locator('[data-cinema-seek="2"]').click();
 // The six modules are real links; focusing one selects it (the deck lifts the module and the hologram reaches for it).
 await expect(story.locator('.world-system a[href^="/"]')).toHaveCount(6);for(const link of await story.locator('.world-system a').all())await expect(link).toBeVisible();
 await story.locator('.world-system a').first().focus();await expect(story.locator('.world-system .world-node').first()).toHaveAttribute('data-active','');
 await story.locator('.cinema-controls [data-cinema-skip]').click();await expect(page.locator('#cinematic')).toBeFocused();
});

test('the live deck answers hover, click, drag and the hologram opens the concierge',async({page})=>{
 await page.goto(route+'?world=1');const story=page.locator('[data-cinema-story]');
 await story.locator('[data-cinema-seek="2"]').click();await expect(story).toHaveAttribute('data-world','on',{timeout:15000});await settled(page);
 // Hovering a module in the scene selects its link; a click locks it until the next click.
 let [x,y]=await nodePoint(story,2,4);await page.mouse.move(x,y-70);
 await expect.poll(async()=>(await stats(story))?.active).toEqual([2,4]);await expect(story.locator('.world-system .world-node').nth(4)).toHaveAttribute('data-active','');
 await page.mouse.down();await page.mouse.up();await expect.poll(async()=>(await stats(story))?.locked).toBe(true);
 await page.mouse.move(40,400);await expect(story.locator('.world-system .world-node').nth(4)).toHaveAttribute('data-active','');
 // Dragging the empty stage turns the deck; the drag hint then retires.
 await expect(story).toHaveAttribute('data-hint','true');
 await page.mouse.move(700,760);await page.mouse.down();await page.mouse.move(860,760,{steps:8});await page.mouse.up();
 await expect.poll(async()=>(await stats(story))?.yaw).toBeGreaterThan(.2);await expect(story).toHaveAttribute('data-hint','false');
 // At the X checkpoint the same drag turns the X itself, with no limit.
 await story.locator('[data-cinema-seek="1"]').click();await settled(page);
 await page.mouse.move(700,300);await page.mouse.down();await page.mouse.move(1100,300,{steps:10});await page.mouse.up();
 await expect.poll(async()=>(await stats(story))?.yaw).toBeGreaterThan(2);
 // Selecting a link the other way round drives the scene.
 await story.locator('[data-cinema-seek="0"]').click();await settled(page);
 await story.locator('[data-world-nodes="0"] a').nth(1).focus();await expect.poll(async()=>(await stats(story))?.active).toEqual([0,1]);
 // The hologram is the concierge: clicking it opens the real conversation.
 await expect(page.locator('#conversation')).toBeHidden();
 [x,y]=await story.locator('[data-world-canvas]').evaluate(n=>{const r=n.getBoundingClientRect();return [r.left+r.width*.49,r.top+r.height*.36] as [number,number];});
 await page.mouse.move(x,y);await expect.poll(()=>story.locator('.cinema-stage').evaluate(n=>(n as HTMLElement).style.cursor)).toBe('pointer');
 await page.mouse.down();await page.mouse.up();await expect(page.locator('#conversation')).toBeVisible();
});

test('mobile controls fit, orientation and reload retain the act',async({page})=>{
 await page.setViewportSize({width:360,height:640});await page.goto(route);const s=page.locator('[data-cinema-story]');
 for(let i=0;i<3;i++){
  await s.locator(`[data-cinema-seek="${i}"]`).click();await expect(s).toHaveAttribute('data-stage',String(i));
  const bounds=await s.locator('.cinema-controls').boundingBox();expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(641);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 }
 await s.locator('[data-cinema-seek="1"]').click();await page.setViewportSize({width:1440,height:900});await expect(s).toHaveAttribute('data-stage','1');await page.reload();await expect(s).toHaveAttribute('data-stage','1');
 await s.locator('[data-cinema-seek="0"]').click();await expect(page.locator('#orb')).toBeVisible();
});

test('without WebGL, with reduced motion and without scripts all content and navigation remain',async({page,browser})=>{
 // No live deck: the same scroll story runs over the still renders.
 await page.goto(route+'?world=0');const s=page.locator('[data-cinema-story]');await expect(s).toHaveAttribute('data-world','fallback');await expect(s).toHaveAttribute('data-ready','');
 for(let i=0;i<3;i++){
  await s.locator(`[data-cinema-seek="${i}"]`).click();const art=s.locator(`[data-cinema-state="${i}"] .cinema-static-art`);
  await expect(art).toBeVisible();await expect.poll(()=>art.evaluate(n=>(n as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(s.locator(`[data-world-nodes="${i}"] a`).first()).toBeVisible();
 }
 await page.emulateMedia({reducedMotion:'reduce'});await expect(s).not.toHaveAttribute('data-enhanced','');
 for(const n of await s.locator('[data-cinema-state]').all())await expect(n).toBeVisible();
 for(const n of await s.locator('.cinema-static-art').all())await expect(n).toBeVisible();
 const href=await s.locator('.world-system a').nth(2).getAttribute('href');await s.locator('.world-system a').nth(2).click();await expect(page).toHaveURL(new RegExp(href!.replace(/\//g,'\\/')+'$'));await page.goto(route);await expect(page.locator('[data-cinema-story]')).toHaveCount(1);
 const origin=new URL(page.url()).origin,c=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),p=await c.newPage();await p.goto(origin+route);
 for(const n of await p.locator('[data-cinema-state]').all())await expect(n).toBeVisible();
 for(const n of await p.locator('.cinema-static-art').all())await expect(n).toBeVisible();
 await c.close();
});
