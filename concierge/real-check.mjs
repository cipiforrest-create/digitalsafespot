// Explicit optional live check; never part of default tests. Uses a bounded number of genuine requests.
import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage();
const results=[];await page.goto('http://localhost:4317/ai-concierge-preview/');await page.locator('[data-text]').first().click();
for(const question of ['Pozdrav, kako ste?','Provedi me kroz stranicu i objasni šta nudite.']){
 const before=await page.locator('.message[data-role=assistant]').count();await page.locator('#chat-input').fill(question);await page.locator('#chat-form button').click();
 await page.waitForFunction(()=>document.querySelector('#chat-form')?.getAttribute('aria-busy')==='false',{},{timeout:45000}).catch(()=>{});
 const after=await page.locator('.message[data-role=assistant]').count(),status=await page.locator('#conversation-status').textContent();results.push({question,response:after>before?await page.locator('.message[data-role=assistant]').last().innerText():null,status,path:new URL(page.url()).pathname,tourVisible:await page.locator('#tour-bar').isVisible()});
 if(after===before)break;if(await page.locator('#tour-bar').isVisible()){await page.locator('[data-tour-action=stop]').click();break;}
}
await page.locator('#close-conversation').click().catch(()=>{});await browser.close();writeFileSync('../docs/ai-concierge/REAL-CHECK-V2.json',JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));console.log(JSON.stringify(results));
