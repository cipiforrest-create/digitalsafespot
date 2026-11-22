import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { allServicePaths } from '../lib/service-seo.mjs';

// Every URL in the sitemap and every internal link on a page must reach a real file
// (or a redirect that does). This is what was missing when an audit reported "dead" pages.
const root = 'public';
const origin = 'https://digital-x-marketing.com';
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
const redirects = new Set(vercel.redirects.filter(r => !r.has).map(r => r.source));
const rewrites = new Set(vercel.rewrites.map(r => r.source));
// Service routes the middleware serves from a source file under another name.
const middlewarePages = new Set(allServicePaths());

const fileFor = path => {
  const clean = decodeURI(path.split('#')[0].split('?')[0]);
  if (!clean.startsWith('/')) return null;
  const local = join(root, clean);
  const candidates = clean.endsWith('/') ? [join(local, 'index.html')] : [local, `${local}.html`, join(local, 'index.html')];
  return candidates.find(p => existsSync(p) && statSync(p).isFile()) || null;
};
const reachable = path => {
  const clean = path.split('#')[0].split('?')[0];
  return Boolean(fileFor(clean)) || middlewarePages.has(clean) || redirects.has(clean) || redirects.has(clean.replace(/\/$/, '')) || rewrites.has(clean);
};

const pages = [];
const walk = dir => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.html')) pages.push(p);
  }
};
walk(root);

test('every sitemap URL is a real page, not a redirect', () => {
  const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.ok(urls.length > 100, 'sitemap looks empty');
  const missing = urls.filter(u => !u.startsWith(origin) || !(fileFor(u.slice(origin.length)) || middlewarePages.has(u.slice(origin.length))));
  assert.deepEqual(missing, []);
});

test('no internal link points at a missing page', () => {
  const broken = new Set();
  for (const page of pages) {
    const html = readFileSync(page, 'utf8');
    for (const [, href] of html.matchAll(/<a\b[^>]*?\shref="([^"]+)"/g)) {
      let path = href.replaceAll('&amp;', '&');
      if (path.startsWith(origin)) path = path.slice(origin.length) || '/';
      if (!path.startsWith('/') || path.startsWith('//')) continue;
      if (!reachable(path)) broken.add(`${page.slice(root.length)} -> ${path}`);
    }
  }
  assert.deepEqual([...broken].sort(), []);
});
