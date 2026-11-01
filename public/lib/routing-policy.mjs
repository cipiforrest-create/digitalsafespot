import { cleanPathForLegacy } from './service-seo.mjs';

const CANONICAL_HOST = 'www.digital-x-marketing.com';

export function canonicalHostTarget(input) {
  const url = input instanceof URL ? new URL(input.href) : new URL(String(input));
  if (url.hostname === CANONICAL_HOST) return null;
  if (url.hostname !== 'digital-x-marketing.com') return null;
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
