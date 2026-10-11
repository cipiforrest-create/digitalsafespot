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

export function legacyServiceTarget(input) {
  const url = input instanceof URL ? new URL(input.href) : new URL(String(input));
  const clean = cleanPathForLegacy(url.pathname);
  if (!clean) return null;
  url.protocol = 'https:';
  url.hostname = CANONICAL_HOST;
  url.pathname = clean;
  return url.href;
}

export function isRetiredLegacyPath(pathname) {
  return /^\/2023(?:\/|$)/i.test(String(pathname || ''));
}
