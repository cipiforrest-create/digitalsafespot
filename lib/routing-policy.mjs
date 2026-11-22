import { cleanPathForLegacy } from './service-seo.mjs';

const CANONICAL_HOST = 'www.digital-x-marketing.com';
// Apex and the production vercel.app alias both serve the live site; send them to www so search
// engines see one host. Preview hosts (digital-x-agency-<hash>/-git-<branch>) are left alone.
const REDIRECTED_HOSTS = new Set(['digital-x-marketing.com', 'digital-x-agency.vercel.app']);

export function canonicalHostTarget(input) {
  const url = input instanceof URL ? new URL(input.href) : new URL(String(input));
  if (url.hostname === CANONICAL_HOST) return null;
  if (!REDIRECTED_HOSTS.has(url.hostname)) return null;
  url.protocol = 'https:';
  url.hostname = CANONICAL_HOST;
  return url.href;
}

// EN/DE copies of legacy landings whose service now has a localized /usluge/ page.
const LOCALIZED_LEGACY = new Map([
  ['/landing-seo.html', '/usluge/seo-aeo-geo/'],
  ['/landing-ai.html', '/usluge/ai-automatizacija/'],
]);

function localizedLegacyTarget(pathname) {
  const match = /^\/(en|de)(\/.*)$/.exec(String(pathname || ''));
  if (!match) return null;
  const clean = LOCALIZED_LEGACY.get(match[2]);
  return clean ? `/${match[1]}${clean}` : null;
}

// Pages merged into another page. The knowledge hub (/znanje/) is now the Blog; its guides keep their URLs.
const MOVED_PAGES = new Map([
  ['/znanje', '/blog/'],
  ['/znanje/', '/blog/'],
  ['/znanje/index.html', '/blog/'],
  // Thin regional city pages consolidated into the main web development service page to avoid doorway duplication.
  ...['banja-luka', 'mostar', 'tuzla', 'zenica'].flatMap((city) => ['', '/', '/index.html'].map((tail) => [
    `/usluge/izrada-web-stranica/${city}${tail}`,
    '/usluge/izrada-web-stranica/',
  ])),
  // Smart Website Launch had two indexable pages with the same H1 and offer. The shop product page is the
  // single canonical one; the concierge offer page redirects to it in every language.
  ...['', '/en', '/de'].flatMap((prefix) => ['', '/', '/index.html'].map((tail) => [
    `${prefix}/smart-website-launch${tail}`,
    `${prefix}/shop/product/smart-website-launch/`,
  ])),
]);

// Final URL for an internal path that has been merged into another page, or null.
export function movedPageTarget(pathname) {
  return MOVED_PAGES.get(String(pathname || '').split('?')[0].split('#')[0]) || null;
}

export function movedPageEntries() {
  return [...MOVED_PAGES.entries()];
}

export function legacyServiceTarget(input) {
  const url = input instanceof URL ? new URL(input.href) : new URL(String(input));
  const clean = cleanPathForLegacy(url.pathname) || localizedLegacyTarget(url.pathname) || MOVED_PAGES.get(url.pathname);
  if (!clean) return null;
  url.protocol = 'https:';
  url.hostname = CANONICAL_HOST;
  url.pathname = clean;
  return url.href;
}

export function isRetiredLegacyPath(pathname) {
  return /^\/2023(?:\/|$)/i.test(String(pathname || ''));
}

export function isLegacyRedirectPath(pathname) {
  return Boolean(cleanPathForLegacy(pathname) || localizedLegacyTarget(pathname) || movedPageTarget(pathname));
}

// Pages published as /name.html (lib/html-routes.json, written by the build): /name and /name/ have
// no file behind them, so they go to the .html URL in one hop instead of /name -> /name/ -> 404.
export function htmlTwinTarget(input, htmlRoutes) {
  const url = input instanceof URL ? new URL(input.href) : new URL(String(input));
  const { pathname } = url;
  if (pathname === '/' || !htmlRoutes) return null;
  const stem = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const last = stem.slice(stem.lastIndexOf('/') + 1);
  if (!last || last.includes('.')) return null;
  const target = `${stem}.html`;
  if (!htmlRoutes.has(target)) return null;
  url.pathname = target;
  return url.href;
}

// Directory pages are canonical with a trailing slash (every sitemap URL ends in "/" or a file
// extension). Send the slashless twin there in one hop so /usluge and /usluge/ don't both answer 200.
export function trailingSlashTarget(input) {
  const url = input instanceof URL ? new URL(input.href) : new URL(String(input));
  const { pathname } = url;
  if (pathname === '/' || pathname.endsWith('/')) return null;
  if (/^\/(?:api|_vercel|_next)(?:\/|$)/.test(pathname)) return null;
  const last = pathname.slice(pathname.lastIndexOf('/') + 1);
  if (!last || last.includes('.')) return null;
  url.pathname = `${pathname}/`;
  return url.href;
}
