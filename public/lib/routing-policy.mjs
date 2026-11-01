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

export function legacyServiceTarget(input) {
  const url = input instanceof URL ? new URL(input.href) : new URL(String(input));
  const clean = cleanPathForLegacy(url.pathname) || localizedLegacyTarget(url.pathname);
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
  return Boolean(cleanPathForLegacy(pathname) || localizedLegacyTarget(pathname));
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
