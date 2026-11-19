import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';

test('the fixed header stays above the footer to the end of every page', () => {
 const css = readFileSync('ai-concierge-preview/visual-experience.css', 'utf8');
 const shared = css.indexOf('#main,.dx-footer{position:relative;z-index:1}');
 const footer = css.indexOf('.dx-footer{z-index:0}');
 // #main (which holds the fixed header) must paint above the footer that follows it.
 assert.ok(shared >= 0 && footer > shared, 'footer is lowered below #main after the shared rule');
});

test('every sitemap URL carries a lastmod date', () => {
 const xml = readFileSync('public/sitemap.xml', 'utf8');
 const urls = xml.match(/<url>.*?<\/url>/g) ?? [];
 assert.ok(urls.length > 100);
 for (const url of urls) assert.match(url, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/, url);
});

test('the IndexNow key file is published at the site root', () => {
 const keys = readdirSync('.').filter(f => /^[0-9a-f]{32}\.txt$/.test(f));
 assert.equal(keys.length, 1);
 const key = keys[0].slice(0, 32);
 assert.equal(readFileSync(keys[0], 'utf8').trim(), key);
 assert.equal(readFileSync(`public/${keys[0]}`, 'utf8').trim(), key);
});

test('homepage prices appear once: the table carries the #pricing target', () => {
 for (const file of ['public/index.html', 'public/en/index.html', 'public/de/index.html']) {
  const html = readFileSync(file, 'utf8');
  assert.equal(html.match(/id="pricing"/g)?.length, 1, file);
  assert.match(html, /<section id="pricing" class="visual-section price-table-section">/, file);
  assert.ok(!html.includes('KORISNO NE MORA BITI VELIKO'), file);
 }
});
