import {test,expect} from '@playwright/test';
const route='/ai-concierge-preview/';
test('three clips scrub, freeze and reverse; holds expose real controls',async({page})=>{
 await page.goto(route);const story=page.locator('[data-cinema-story]');await expect(story).toHaveAttribute('data-enhanced','');
 await expect(page.locator('h1')).toHaveText('Web stranice, SEO i AI automatizacija za firme u Sarajevu i BiH');await expect(page.locator('#hero-title')).toHaveText('Digitalni Asistent');await expect(page.locator('#hero-title + p')).toHaveText('Uvijek korak ispred.');
 for(const clip of [0,1,2,1,0]){
  await story.locator(`[data-cinema-seek="${clip}"]`).click();await expect(story).toHaveAttribute('data-stage',String(clip));await expect(story).toHaveAttribute('data-holding','true');
  const last=await story.getAttribute('data-frame');await page.waitForTimeout(150);await expect(story).toHaveAttribute('data-frame',last!);
  await page.mouse.wheel(0,-700);await expect.poll(async()=>Number(await story.getAttribute('data-frame'))).toBeLessThan(Number(last));
 }
 await expect(story).toHaveAttribute('data-ready','');expect(Number(await story.getAttribute('data-decoded'))).toBeLessThanOrEqual(28);
 await story.locator('[data-cinema-seek="2"]').click();
 // The four system tiles are real links; focusing one selects it (the live world lifts the tile and pulses its path).
 for(const id of ['concierge','cinematic','visibility','automate'])await expect(story.locator(`.world-tile a[href="${route}${id}/"]`)).toBeVisible();
 await story.locator('.world-tile a').first().focus();await expect(story.locator('.world-tile').first()).toHaveAttribute('data-active','');
 await story.locator('.cinema-controls [data-cinema-skip]').click();await expect(page.locator('#cinematic')).toBeFocused();
});
test('mobile controls fit, orientation and reload retain cinematic state',async({page})=>{
 await page.setViewportSize({width:360,height:640});await page.goto(route);const s=page.locator('[data-cinema-story]');
 for(let i=0;i<3;i++){
  await s.locator(`[data-cinema-seek="${i}"]`).click();await expect(s).toHaveAttribute('data-stage',String(i));
  const bounds=await s.locator('.cinema-controls').boundingBox();expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(641);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 }
 await s.locator('[data-cinema-seek="1"]').click();await page.setViewportSize({width:1440,height:900});await expect(s).toHaveAttribute('data-stage','1');await page.reload();await expect(s).toHaveAttribute('data-stage','1');
 await s.locator('[data-cinema-seek="0"]').click();await expect(page.locator('#orb')).toBeVisible();
});
test('reduced motion and failed frames preserve all content and navigation',async({page,browser})=>{
 await page.route('**/cinema-v1/clip-*/*/*.webp',r=>r.abort());await page.goto(route);const s=page.locator('[data-cinema-story]');
 await s.locator('[data-cinema-seek="2"]').click();await expect(s.locator('.world-tile a').first()).toBeVisible();
 await page.emulateMedia({reducedMotion:'reduce'});await expect(s).not.toHaveAttribute('data-enhanced','');
 for(const n of await s.locator('[data-cinema-state]').all())await expect(n).toBeVisible();
 await s.locator('.world-tile a[href$="/concierge/"]').click();await expect(page).toHaveURL(/concierge\/$/);await page.locator('.dx-brand').first().click();await expect(page.locator('[data-cinema-story]')).toHaveCount(1);
 const c=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),p=await c.newPage();await p.goto('http://localhost:4317'+route);for(const n of await p.locator('[data-cinema-state]').all())await expect(n).toBeVisible();await c.close();
});
test('first paint is already the film layout: Video 1 frame 0 at the canvas fit, no poster swap or reflow',async({page})=>{
 for(const [w,h] of [[390,760],[1440,900]]){
  await page.setViewportSize({width:w,height:h});
  let release=()=>{};const gate=new Promise<void>(r=>{release=r;});
  await page.route('**/ai-concierge-preview/assets/main.js',async r=>{await gate;await r.continue();});
  await page.goto('/ai-concierge-preview/',{waitUntil:'commit'});
  const s=page.locator('[data-cinema-story]'),first=s.locator('.cinema-first img');
  await expect(first).toBeVisible();await expect.poll(()=>first.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth)).toBeGreaterThan(0);
  expect(await first.evaluate((i:HTMLImageElement)=>new URL(i.currentSrc).pathname)).toMatch(/clip-1\/(640|864)\/0000\.webp$/);
  await expect(s.locator('[data-cinema-state="1"]')).toBeHidden();await expect(s.locator('.cinema-static-art').first()).toBeHidden();
  await s.evaluate(n=>scrollTo({top:n.getBoundingClientRect().top+scrollY,behavior:'instant'}));
  const before=await s.locator('h1').boundingBox();
  release();await expect(s).toHaveAttribute('data-ready','',{timeout:15000});await expect(first).toBeHidden();
  const after=await s.locator('h1').boundingBox();expect(Math.abs(after!.y-before!.y)).toBeLessThan(2);
  await page.unroute('**/ai-concierge-preview/assets/main.js');
 }
});
