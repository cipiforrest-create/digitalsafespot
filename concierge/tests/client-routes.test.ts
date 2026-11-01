import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { pageIds, previewPath, pageFromPath } from '../shared/catalogue';
import * as routes from '../client/routes';

// The browser bundle reads page paths from shared/page-routes.json instead of the full catalogue.
test('client route map matches the catalogue for every page', () => {
  for (const id of pageIds) {
    assert.equal(routes.previewPath(id), previewPath(id), id);
    for (const prefix of ['', '/en', '/de']) assert.equal(routes.pageFromPath(prefix + previewPath(id)), pageFromPath(prefix + previewPath(id)), prefix + id);
  }
  assert.equal(routes.pageFromPath('/ai-concierge-preview/visibility'), pageFromPath('/ai-concierge-preview/visibility'));
  assert.equal(routes.pageFromPath('/does-not-exist/'), undefined);
});

test('homepage head stylesheets are inlined and showcase tabs use valid ARIA', () => {
  for (const file of ['public/index.html', 'public/en/index.html', 'public/de/index.html']) {
    const html = readFileSync(file, 'utf8');
    const head = html.slice(0, html.indexOf('</head>'));
    assert.doesNotMatch(head, /<link rel="stylesheet"/, file);
    assert.match(head, /<style data-inline="\/css\/x-stage\.css">/, file);
    assert.doesNotMatch(html, /role="tab"[^>]*aria-pressed/, file);
    assert.doesNotMatch(html, /<article[^>]*role="tabpanel"/, file);
  }
});

test('homepage loads one Inter file per subset and preloads its module graph', () => {
  for (const file of ['public/index.html', 'public/en/index.html', 'public/de/index.html']) {
    const html = readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /inter-500-latin|inter-400-latin-ext/, file);
    const preloads = [...html.matchAll(/<link rel="modulepreload" href="\/ai-concierge-preview\/assets\/([\w-]+\.js)">/g)].map(m => m[1]);
    assert.ok(preloads.some(name => name.startsWith('page-effects-')), file);
    for (const name of preloads) assert.ok(existsSync(`ai-concierge-preview/assets/${name}`), `${file}: ${name}`);
  }
});
