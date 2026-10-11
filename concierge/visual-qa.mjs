import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const folder='../docs/ai-concierge/screenshots/visual-v2';mkdirSync(folder,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const [name,w,h] of [['desktop',1536,1025],['laptop',1440,900],['mobile',390,844]]){await page.setViewportSize({width:w,height:h});await page.goto('http://localhost:4317/ai-concierge-preview/');await page.waitForTimeout(1000);await page.screenshot({path:`${folder}/home-${name}.png`});
 for(const selector of ['#cinematic','#launch','#services','#receptionist','#value','#work']){await page.locator(selector).scrollIntoViewIfNeeded();await page.waitForTimeout(300);await page.screenshot({path:`${folder}/${selector.slice(1)}-${name}.png`});}
 for(const id of ['visibility','shop','blog','contact']){await page.goto('http://localhost:4317/ai-concierge-preview/'+id+'/');await page.waitForTimeout(250);await page.screenshot({path:`${folder}/${id}-${name}.png`});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))errors.push('overflow '+id+' '+name);}
}
writeFileSync(`${folder}/errors.json`,JSON.stringify(errors,null,2));console.log(JSON.stringify({screenshots:folder,errors}));await browser.close();
