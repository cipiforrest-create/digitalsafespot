import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {load} from 'cheerio';
import {pageIds,pageFromPath,previewPath} from '../shared/catalogue';

const read=(route:string)=>readFileSync(`public${route}${route.endsWith('/')?'index.html':''}`,'utf8');
for(const lang of ['en','de']){
 test(`${lang}: every published page preserves the Bosnian structure and shared assets`,()=>{
  for(const id of pageIds){
   const route=previewPath(id),bs=load(read(route)),$=load(read(`/${lang}${route}`));
   assert.equal($('html').attr('lang'),lang,route);
   assert.equal($('body').attr('data-page'),id);
   for(const selector of ['main section','main canvas','main [data-showcase]','main img','main video','main form']){
    assert.equal($(selector).length,bs(selector).length,`${route}: ${selector}`);
   }
   const resources=(doc:ReturnType<typeof load>)=>doc('script[src],link[rel=stylesheet],main img').toArray().map(n=>doc(n).attr('src')||doc(n).attr('href'));
   assert.deepEqual(resources($),resources(bs),route);
   assert.equal($('link[rel=canonical]').attr('href'),`https://www.digital-x-marketing.com/${lang}${route}`);
   assert.deepEqual($('link[hreflang]').map((_,n)=>$(n).attr('hreflang')).get(),['bs','en','de','x-default']);
   assert.equal($(`.language-nav a[lang=${lang}]`).attr('aria-current'),'page');
   assert.equal($(`.language-nav a[lang=bs]`).attr('href'),route);
   assert.equal(pageFromPath(`/${lang}${route}`),id);
   $('a[href]').each((_,n)=>{
    const href=$(n).attr('href')!;
    if($(n).closest('.language-nav').length||!href.startsWith('/'))return;
    const path=href.split(/[?#]/)[0];
    if(pageFromPath(path))assert.ok(path.startsWith(`/${lang}/`),`${route}: ${href}`);
   });
  }
 });
 test(`${lang}: homepage has current hero, nine examples and working interaction hooks`,()=>{
  const $=load(read(`/${lang}/`));
  assert.equal($('[data-showcase]').length,9);
  assert.deepEqual($('[data-showcase]').map((_,n)=>$(n).attr('data-showcase')).get().slice(0,3),['hotel','watch','penthouse']);
  assert.equal($('[data-cinema-story]').length,1);
  assert.ok($('[data-strategy]').length>0);
  assert.doesNotMatch($('main').text(),/Vaš sljedeći upit|Odaberite branšu|Šta dobijate/);
 });
}
test('locale prefixes do not change unknown routes or the Bosnian route registry',()=>{
 assert.equal(pageFromPath('/en/not-a-page/'),undefined);
 assert.equal(pageFromPath('/de/'),'home');
 assert.equal(pageFromPath('/en/index.html'),'home');
 assert.equal(previewPath('home'),'/');
});
