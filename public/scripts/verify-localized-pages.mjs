import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  for(const lang of ['bs','en','de']){
   const prefix=lang==='bs'?'':`/${lang}`;
   await page.goto(`http://127.0.0.1:4320${prefix}/`);
   await page.waitForSelector('[data-showcase="hotel"]');
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   assert.equal(await page.locator('[data-showcase]').count(),9);
   await page.locator('[data-showcase="penthouse"]').click();
   await page.waitForFunction(()=>!document.querySelector('#showcase-penthouse').hidden);
   assert.equal(await page.locator('#showcase-penthouse a').first().getAttribute('href'),'/cinematic-penthouse/');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
   await page.screenshot({path:`C:/dxrec/home-${lang}-${width}.png`});
   await page.locator('[data-strategy]:visible').first().click();
   await page.waitForSelector('#lead-dialog[open]');
   await page.keyboard.press('Escape');
   // Client-side navigation must retain language and replace alternate links.
   await page.locator(`a[href="${prefix}/kontakt.html"]`).last().click();
   await page.waitForURL(`**${prefix}/kontakt.html`);
   assert.equal(await page.locator('body').getAttribute('data-page'),'contact');
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),`https://www.digital-x-marketing.com${prefix}/kontakt.html`);
   assert.equal(await page.locator('.language-nav a[lang=en]').getAttribute('href'),'/en/kontakt.html');
   await page.locator('.language-nav a[lang=de]').click();
   await page.waitForURL('**/de/kontakt.html');
   assert.equal(await page.locator('html').getAttribute('lang'),'de');
   console.log(JSON.stringify({width,lang,showcase:'pass',form:'pass',navigation:'pass',errors}));
   assert.deepEqual(errors,[]);
  }
  await page.close();
 }
}finally{await browser.close();}
