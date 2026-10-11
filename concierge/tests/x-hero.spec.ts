import {test,expect} from '@playwright/test';
const route='/ai-concierge-preview/';
const sse=(event:string,data:unknown)=>`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
test('the X hero is the first screen, above the 3D story, with the orb on the X crossing',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const [w,h] of [[1440,900],[1920,1080],[820,1180],[390,844]]){
  await page.setViewportSize({width:w,height:h});await page.goto(route);
  const hero=page.locator('[data-x-stage]');await expect(hero).toBeVisible();
  expect(await page.evaluate(()=>{const x=document.querySelector('[data-x-stage]')!,story=document.querySelector('[data-cinema-story]')!;return x.getBoundingClientRect().top<=0&&Boolean(x.compareDocumentPosition(story)&Node.DOCUMENT_POSITION_FOLLOWING);})).toBe(true);
  // The story keeps the page's single h1.
  await expect(page.locator('h1')).toHaveCount(1);await expect(hero.locator('h2')).toHaveText('Vaša web stranica moževiše od dobrog izgleda.');
  const [orb,camera]=await Promise.all([hero.locator('.xh-orb').boundingBox(),hero.locator('.xs-camera').boundingBox()]);
  expect(Math.abs(orb!.x+orb!.width/2-(camera!.x+camera!.width*767.5/1536))).toBeLessThan(3);
  expect(Math.abs(orb!.y+orb!.height/2-(camera!.y+camera!.height*511/1024))).toBeLessThan(3);
  // Heading, then the orb, then the goals and actions; nothing scrolls sideways.
  const [title,core,actions,goals]=await Promise.all(['h2','.xh-orb','.xh-actions','.xh-goals'].map(s=>hero.locator(s).boundingBox()));
  expect(core!.y).toBeGreaterThan(title!.y+title!.height);for(const box of [actions,goals])expect(box!.y).toBeGreaterThan(core!.y+core!.height);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 }
});
test('hero goals, text and audit reach the concierge; the hero follows its state',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/concierge/session',route=>route.fulfill({json:{expiresAt:Date.now()+600000,leadConfigured:false}}));
 let asked='';
 await page.route('**/api/concierge/chat',async route=>{const body=route.request().postDataJSON();asked=body.context?.messages?.at(-1)?.content||'';await new Promise(r=>setTimeout(r,400));await route.fulfill({contentType:'text/event-stream',body:sse('delta',{text:'Evo prvog koraka.'})+sse('done',{})});});
 await page.goto(route);const hero=page.locator('[data-x-stage]');
 await hero.locator('[data-goal=website]').click();
 await expect(hero).toHaveAttribute('data-state','thinking');await expect(hero.locator('[data-x-status]')).toHaveText('Razmišljam…');
 await expect(hero.locator('[data-goal=website]')).toHaveAttribute('aria-pressed','true');
 await expect(hero).toHaveAttribute('data-state','idle');await expect(hero.locator('[data-x-status]')).toHaveText('Spreman za razgovor');
 expect(asked).toContain('Web stranici treba novi izgled');
 await expect(page.locator('#transcript')).toContainText('Evo prvog koraka.');
 await hero.locator('[data-text]').click();await expect(page.locator('#conversation')).toBeVisible();await expect(page.locator('#chat-input')).toBeFocused();await page.locator('#close-conversation').click();
 await hero.locator('[data-audit]').click();await expect(page.locator('#audit-dialog')).toBeVisible();
 expect(errors).toEqual([]);
});
test('the homepage URL serves the indexable 3D homepage, and Back from a page returns to it',async({page})=>{
 await page.goto('/');await expect(page.locator('[data-x-stage]')).toBeVisible();
 await expect(page.locator('meta[name=robots]')).toHaveAttribute('content',/^index,follow/);
 await expect(page).toHaveTitle('Digital X Sarajevo | Web stranice, SEO i AI automatizacija');
 await page.locator('.desktop-nav').getByRole('link',{name:'Usluge',exact:true}).click();await expect(page).toHaveURL(/services\/$/);
 await page.goBack();await expect.poll(()=>new URL(page.url()).pathname).toBe('/');await expect(page.locator('[data-x-stage]')).toBeVisible();
});
