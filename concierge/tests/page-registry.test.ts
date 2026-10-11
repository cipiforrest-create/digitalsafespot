import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { buildPageRegistry, resolvePageContext, homeSections, sectionIds } from '../shared/page-registry';
import { pageIds } from '../shared/catalogue';
import { sectionSchema } from '../shared/contracts';

test('the registry covers every catalogue pageId and only known ids', () => {
  const registry = buildPageRegistry();
  for (const [, entry] of registry) assert.ok((pageIds as readonly string[]).includes(entry.pageId), entry.pageId);
  for (const id of pageIds) assert.ok(registry.has(id), `registry missing ${id}`);
});

test('home-section keys match the section schema and reference existing service ids', () => {
  assert.deepEqual([...sectionIds].sort(), [...sectionSchema.options].sort());
  for (const section of sectionIds) for (const serviceId of homeSections[section].serviceIds) assert.ok((pageIds as readonly string[]).includes(serviceId), `${section} -> ${serviceId}`);
});

test('every home-section id exists in the built home page', () => {
  const path = '.concierge/pages/home.html';
  if (!existsSync(path)) return; // Requires a build; covered after npm run build in preflight.
  const html = readFileSync(path, 'utf8');
  for (const section of sectionIds) assert.match(html, new RegExp(`id="${section}"`), `home.html missing #${section}`);
});

test('resolvePageContext drops unknown ids and builds a page line for samples', () => {
  assert.equal(resolvePageContext({ pageId: 'does-not-exist' }), null);
  assert.equal(resolvePageContext({}), null);
  for (const pageId of ['home', 'receptionist', 'cinematic', 'services', 'concierge']) {
    const resolved = resolvePageContext({ pageId });
    assert.ok(resolved, pageId);
    assert.match(resolved!.line, /^Visitor is viewing: .+ page/);
  }
  const withSection = resolvePageContext({ pageId: 'home', section: 'receptionist' });
  assert.deepEqual(withSection!.focusServiceIds, homeSections.receptionist.serviceIds);
  assert.match(withSection!.line, /section "receptionist"/);
  // An unknown section is dropped, not an error.
  const unknownSection = resolvePageContext({ pageId: 'home', section: 'not-a-section' });
  assert.equal(unknownSection!.section, undefined);
});