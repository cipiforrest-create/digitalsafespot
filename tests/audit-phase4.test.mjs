import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const schemaOf = file => JSON.parse(readFileSync(file, 'utf8').match(/data-page-schema="?"?>(.*?)<\/script>/s)[1])['@graph'];
const priced = {
  'seo-aeo-geo': ['249.00', true], 'digitalne-kampanje': ['249.00', true], 'ai-automatizacija': ['349.00', false],
  'smart-storefront': ['2490.00', false], 'meta-ads': ['249.00', true], 'google-ads': ['249.00', true],
  'drustvene-mreze': ['249.00', true], 'produkcija-sadrzaja': ['249.00', true],
};

test('priced service pages carry a Service Offer with the catalogue starting price', () => {
  for (const [slug, [price, monthly]] of Object.entries(priced)) {
    for (const prefix of ['', '/en', '/de']) {
      const graph = schemaOf(`public${prefix}/usluge/${slug}/index.html`);
      const service = graph.find(n => n['@type'] === 'Service' && n.offers);
      assert.ok(service, `${prefix}/usluge/${slug}/ has no priced Service`);
      assert.equal(service.offers.price, price, slug);
      assert.equal(service.offers.priceCurrency, 'BAM', slug);
      assert.equal(service.offers.url, `https://www.digital-x-marketing.com${prefix}/usluge/${slug}/`);
      assert.equal(service.offers.priceSpecification?.unitCode === 'MON', monthly, `${slug} monthly unit`);
    }
  }
});

test('the page generator takes Offer prices from the catalogue and checks them against the visible copy', () => {
  const source = readFileSync('concierge/pages.mjs', 'utf8');
  assert.match(source, /serviceOffer\(p,canonical\)/);
  assert.match(source, /answer copy does not show/);
  assert.match(source, /legalName:'Digital X Marketing'/);
  assert.match(source, /streetAddress:'Stupska bb'/);
});

test('generated service pages name the legal entity and street address', () => {
  const org = schemaOf('public/usluge/meta-ads/index.html').find(n => n['@type'] === 'Organization');
  assert.equal(org.legalName, 'Digital X Marketing');
  assert.equal(org.address.streetAddress, 'Stupska bb');
});
