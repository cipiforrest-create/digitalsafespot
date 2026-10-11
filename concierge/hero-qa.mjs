import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('concierge/.screenshots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const [width, height] of [[1536,1025],[1440,900],[390,844]]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:4317/ai-concierge-preview'); await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `concierge/.screenshots/hero-${width}.png` });
  if(width===390)await page.screenshot({path:'concierge/.screenshots/full-mobile.png',fullPage:true});
  console.log(JSON.stringify({ width, height, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), errors }));
  await page.close();
}
await browser.close();
