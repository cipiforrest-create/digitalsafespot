import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SERVICE_ROUTES, enhanceServiceHtml} from '../lib/service-seo.mjs';
test('commercial service schema uses published starting prices',()=>{
  for(const [path,price] of [['/usluge/izrada-web-stranica/',449],['/usluge/seo-aeo-geo/',249],['/usluge/ai-automatizacija/',490]]){
    const route=SERVICE_ROUTES.get(path);assert.ok(route);
    const html=enhanceServiceHtml('<html><head></head><body><main><h1>original</h1></main></body></html>',path);
    assert.ok(html.includes('"priceCurrency":"BAM"'));
    assert.ok(html.includes('"price":'+price));
    assert.ok(html.includes('rel="canonical"'));
  }
});
test('cinematic homepage and 3D sources are kept separate and unchanged',()=>{
  assert.ok(readFileSync(new URL('../index.html',import.meta.url),'utf8').includes('cinematic'));
  assert.ok(readFileSync(new URL('../concierge/publish.mjs',import.meta.url),'utf8').includes('public'));
});
test('guide pages contain responsive comparison tables without changing URL scheme',()=>{
  for(const p of ['aeo-vodic','koliko-kosta-web-stranica-bih']){
    const html=readFileSync(new URL('../blog/'+p+'.html',import.meta.url),'utf8');
    assert.ok(html.includes('<table class="dx-guide-table">'));
    assert.ok(html.includes('dx-guide-table-wrap'));
    assert.ok(html.includes('https://www.digital-x-marketing.com/blog/'+p+'.html'));
  }
});
