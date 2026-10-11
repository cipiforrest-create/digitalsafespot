import {test,expect} from '@playwright/test';
test('hero preloads film without scrolling and respects reduced motion for lightning',async({page})=>{
 await page.goto('/');const story=page.locator('[data-cinema-story]');
 await expect.poll(async()=>Number(await story.getAttribute('data-preloaded')),{timeout:20000}).toBeGreaterThan(0);
 expect(await page.evaluate(()=>scrollY)).toBe(0);
 await expect(page.locator('.xs-storm')).toHaveCount(1);
 expect(await page.locator('.xs-storm-left').evaluate(n=>getComputedStyle(n).animationName)).toBe('xs-distant-lightning');
 await page.emulateMedia({reducedMotion:'reduce'});expect(await page.locator('.xs-storm-left').evaluate(n=>getComputedStyle(n).animationName)).toBe('none');
 await expect(page.locator('#main > .source-link a[href*="eynna-hair.ba"]')).toHaveCount(0);
 await expect(page.locator('.final-system-labels a')).toHaveCount(4);
 for(const stage of await page.locator('[data-visual]').all()){
  const sources=await stage.locator('[data-feature-image]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src')));expect(new Set(sources).size).toBe(3);
  for(let i=0;i<3;i++){await stage.locator(`[data-feature-index="${i}"]`).click();const img=stage.locator(`[data-feature-image="${i}"]`);await expect(img).toBeVisible();await expect.poll(()=>img.evaluate(n=>(n as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);}
 }
 await page.locator('#jedan-sistem').scrollIntoViewIfNeeded();await page.screenshot({path:'concierge/.reports/final-labels.png'});
});
test('translated homepages describe the actual free audit and link to it',async({page})=>{
 for(const lang of ['en','de']){await page.goto('/'+lang+'/');await expect(page.locator('html')).toHaveAttribute('lang',lang);await expect(page.locator('#hero h1')).toContainText(lang==='en'?'more than look good':'mehr als gut aussehen');await expect(page.locator('#analiza .audit__cta a')).toHaveAttribute('href','/usluge/x-signal/');await expect(page.locator('#analiza')).not.toContainText(/60 seconds|60 Sekunden|Digital X PDF/);}
});
