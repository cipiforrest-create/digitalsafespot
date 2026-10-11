import { CINEMATIC_PAGES, enhanceCinematicHtml } from "./lib/cinematic-seo.mjs";
import conciergeRoutes from "./lib/concierge-routes.json";
import {
  enhanceGscIndexingHtml,
  filterGscSitemap,
  isGscIndexingPath,
} from "./lib/gsc-indexing.mjs";
import {
  enhanceSecondLayerHtml,
  shouldEnhanceSecondLayerPath,
} from "./lib/second-layer.mjs";
import {
  enhanceFinalPolishHtml,
  shouldPolishPath,
} from "./lib/final-polish.mjs";
import {
  addResponsiveImageCandidates,
  enhanceSiteHtml,
  normalizeHeadingHierarchy,
  removeEmptyHeadings,
  shouldEnhanceSitePath,
} from "./lib/site-seo.mjs";
import {
  enhanceServiceHtml,
  injectTrackingFallback,
  isServicePath,
  replaceLegacyServiceLinks,
  sourcePathForService,
} from "./lib/service-seo.mjs";
import { enhanceStructuredDataHtml } from "./lib/structured-data-fixes.mjs";
import { enhancePerformanceHtml } from "./lib/performance-html.mjs";
import {
  canonicalHostTarget,
  isRetiredLegacyPath,
  legacyServiceTarget,
} from "./lib/routing-policy.mjs";

const RAW_QUERY = "__dx_seo_raw";
const CONTINUE_REQUEST = { headers: { "x-middleware-next": "1" } };
const CINEMATIC_ENGINE_VERSION = "20260910-2fd6fd2";

const WATCH_BUNDLE_PATH = "/cinematic-watch/assets/index-DKmP0uHv-perf.js";
const WATCH_BUNDLE_VERSION = "20260910-watch-media-1";
const WATCH_MEDIA_OLD = "https://digital-x-pi.vercel.app/cinematic-watch/media/";
const WATCH_MEDIA_NEW = "https://raw.githubusercontent.com/cipiforrest-create/cinematic-watch/37acf15d3a8068cd2c9137f0da6e5f62c8556937/public/media/";

const PENTHOUSE_BUNDLE_PATH = "/cinematic-penthouse/assets/index-CGSoINYS-perf.js";
const PENTHOUSE_BUNDLE_VERSION = "20260911-penthouse-media-1";
const PENTHOUSE_MEDIA_OLD = "https://digital-x-pi.vercel.app/cinematic-penthouse/";
const PENTHOUSE_MEDIA_NEW = "https://raw.githubusercontent.com/cipiforrest-create/cinematic-penthouse/5776c4a08533b98cb4ad7cb83f0118264b759abe/public/";

function next() {
  return new Response(null, CONTINUE_REQUEST);
}

// Edge runtime bundles the ES-module lib/*.mjs imports; the Node runtime would require() them and fail.
export const config = {
  runtime: "edge",
  matcher: [
    "/((?!api/|assets/|media/|fonts/|css/|js/|lib/|cinematic-shared/|_vercel/|.*\\.(?:png|jpg|jpeg|webp|avif|gif|svg|ico|woff2?|ttf|mp4|webm|pdf)$).*)",
  ],
};

function redirect301(target) {
  return new Response(null, {
    status: 301,
    headers: {
      location: target,
      "cache-control": "public, max-age=3600",
    },
  });
}

function retired410() {
  return new Response("This legacy URL has been permanently removed.", {
    status: 410,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-robots-tag": "noindex, follow",
      "cache-control": "public, max-age=86400",
    },
  });
}

function finalizeHtml(html, pathname) {
  let enhanced = replaceLegacyServiceLinks(html);
  enhanced = removeEmptyHeadings(enhanced);
  enhanced = normalizeHeadingHierarchy(enhanced);
  enhanced = addResponsiveImageCandidates(enhanced);
  enhanced = enhanceStructuredDataHtml(enhanced, pathname);
  enhanced = enhancePerformanceHtml(enhanced);
  enhanced = injectTrackingFallback(enhanced);
  enhanced = enhanced
    .replaceAll('class="boot" data-boot', 'class="boot" data-boot data-cinematic-loader')
    .replaceAll('data-boot-bar></i>', 'data-boot-bar data-cinematic-loader-bar></i>')
    .replaceAll('data-boot-pct aria-live=', 'data-boot-pct data-cinematic-loader-pct aria-live=');
  enhanced = enhanced.replaceAll(
    'src="/cinematic-shared/scroll-cinematic.js"',
    `src="/cinematic-shared/scroll-cinematic.js?v=${CINEMATIC_ENGINE_VERSION}"`,
  );
  return enhanced;
}

function htmlResponse(upstream, enhanced, markerName, markerValue) {
  const headers = new Headers(upstream.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "public, s-maxage=3600, stale-while-revalidate=86400");
  headers.set(markerName, markerValue);
  return new Response(enhanced, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

function allowRawGithubMedia(response) {
  const csp = response.headers.get("content-security-policy");
  if (!csp) return response;
  let nextCsp = csp;
  nextCsp = nextCsp.replace(
    "media-src 'self'",
    "media-src 'self' https://raw.githubusercontent.com",
  );
  nextCsp = nextCsp.replace(
    "connect-src 'self'",
    "connect-src 'self' https://raw.githubusercontent.com",
  );
  response.headers.set("content-security-policy", nextCsp);
  return response;
}

function xmlResponse(upstream, xml) {
  const headers = new Headers(upstream.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.set("content-type", "application/xml; charset=utf-8");
  headers.set("cache-control", "public, s-maxage=3600, stale-while-revalidate=86400");
  headers.set("x-digital-x-gsc-sitemap", "filtered-v2");
  return new Response(xml, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

function requestHeaders(request, accept, userAgent) {
  return {
    accept,
    "accept-language": request.headers.get("accept-language") || "bs,en;q=0.8",
    "user-agent": request.headers.get("user-agent") || userAgent,
  };
}

async function rawFetch(request, accept, userAgent) {
  const rawUrl = new URL(request.url);
  rawUrl.searchParams.set(RAW_QUERY, "1");
  return fetch(rawUrl, {
    redirect: "follow",
    headers: requestHeaders(request, accept, userAgent),
  });
}

async function rawFetchPath(request, sourcePath, accept, userAgent) {
  const rawUrl = new URL(sourcePath, request.url);
  rawUrl.searchParams.set(RAW_QUERY, "1");
  return fetch(rawUrl, {
    redirect: "follow",
    headers: requestHeaders(request, accept, userAgent),
  });
}

async function patchWatchBundleRequest(request) {
  let upstream;
  try {
    upstream = await rawFetch(request, "text/javascript,application/javascript,*/*;q=0.8", "DigitalX-Watch-Media-Recovery/1.0");
  } catch (error) {
    console.error("Watch bundle fetch failed", error);
    return next();
  }
  if (!upstream.ok) return upstream;

  const source = await upstream.text();
  const patched = source.replaceAll(WATCH_MEDIA_OLD, WATCH_MEDIA_NEW);
  const headers = new Headers(upstream.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.set("content-type", "text/javascript; charset=utf-8");
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("x-digital-x-watch-media", "recovered-v1");
  return new Response(patched, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

async function patchPenthouseBundleRequest(request) {
  let upstream;
  try {
    upstream = await rawFetch(request, "text/javascript,application/javascript,*/*;q=0.8", "DigitalX-Penthouse-Media-Recovery/1.0");
  } catch (error) {
    console.error("Penthouse bundle fetch failed", error);
    return next();
  }
  if (!upstream.ok) return upstream;

  const source = await upstream.text();
  const patched = source.replaceAll(PENTHOUSE_MEDIA_OLD, PENTHOUSE_MEDIA_NEW);
  const headers = new Headers(upstream.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.set("content-type", "text/javascript; charset=utf-8");
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("x-digital-x-penthouse-media", "recovered-v1");
  return new Response(patched, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

async function enhanceCinematicRequest(request, slug) {
  let upstream;
  try {
    upstream = await rawFetch(request, "text/html,application/xhtml+xml", "DigitalX-Cinematic-Proxy/1.0");
  } catch (error) {
    console.error("Cinematic upstream fetch failed", slug, error);
    return new Response("Cinematic experience is temporarily unavailable.", {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const contentType = upstream.headers.get("content-type") || "";
  if (!upstream.ok || !contentType.includes("text/html")) return upstream;

  let cinematicHtml = enhanceCinematicHtml(await upstream.text(), slug);
  if (slug === "cinematic-watch") {
    cinematicHtml = cinematicHtml.replaceAll(
      'src="./assets/index-DKmP0uHv-perf.js"',
      `src="./assets/index-DKmP0uHv-perf.js?v=${WATCH_BUNDLE_VERSION}"`,
    );
  }
  if (slug === "cinematic-penthouse") {
    cinematicHtml = cinematicHtml
      .replaceAll(PENTHOUSE_MEDIA_OLD, PENTHOUSE_MEDIA_NEW)
      .replaceAll(
        'src="./assets/index-CGSoINYS-perf.js"',
        `src="./assets/index-CGSoINYS-perf.js?v=${PENTHOUSE_BUNDLE_VERSION}"`,
      );
  }
  const enhanced = finalizeHtml(cinematicHtml, new URL(request.url).pathname);
  const response = htmlResponse(upstream, enhanced, "x-digital-x-cinematic-seo", "enhanced-v3");
  return slug === "cinematic-penthouse" ? allowRawGithubMedia(response) : response;
}

async function enhanceServiceRequest(request, pathname) {
  const sourcePath = sourcePathForService(pathname);
  if (!sourcePath) return next();
  let upstream;
  try {
    upstream = await rawFetchPath(request, sourcePath, "text/html,application/xhtml+xml", "DigitalX-Service-SEO/1.0");
  } catch (error) {
    console.error("Service SEO source fetch failed", pathname, sourcePath, error);
    return next();
  }
  const contentType = upstream.headers.get("content-type") || "";
  if (!upstream.ok || !contentType.includes("text/html")) return upstream;
  const enhanced = finalizeHtml(enhanceServiceHtml(await upstream.text(), pathname), pathname);
  return htmlResponse(upstream, enhanced, "x-digital-x-service-seo", "enhanced-v1");
}

async function enhanceStaticRequest(request, pathname) {
  let upstream;
  try {
    upstream = await rawFetch(request, "text/html,application/xhtml+xml", "DigitalX-Site-SEO/6.0");
  } catch (error) {
    console.error("Static SEO source fetch failed", pathname, error);
    return next();
  }

  const contentType = upstream.headers.get("content-type") || "";
  if (!upstream.ok || !contentType.includes("text/html")) return upstream;

  let enhanced = await upstream.text();
  if (shouldEnhanceSitePath(pathname)) enhanced = enhanceSiteHtml(enhanced, pathname);
  if (isGscIndexingPath(pathname)) enhanced = enhanceGscIndexingHtml(enhanced, pathname);
  if (shouldEnhanceSecondLayerPath(pathname)) enhanced = enhanceSecondLayerHtml(enhanced, pathname);
  if (shouldPolishPath(pathname)) enhanced = enhanceFinalPolishHtml(enhanced, pathname);
  enhanced = finalizeHtml(enhanced, pathname);
  return htmlResponse(upstream, enhanced, "x-digital-x-site-seo", "enhanced-v6");
}

async function enhanceSitemapRequest(request) {
  let upstream;
  try {
    upstream = await rawFetch(request, "application/xml,text/xml;q=0.9,*/*;q=0.8", "DigitalX-GSC-Sitemap/2.0");
  } catch (error) {
    console.error("Sitemap source fetch failed", error);
    return next();
  }
  if (!upstream.ok) return upstream;
  return xmlResponse(upstream, filterGscSitemap(await upstream.text()));
}

export default async function middleware(request) {
  const requestUrl = new URL(request.url);
  const pathname = requestUrl.pathname;

  // Internal source request: continue to the deployment's original static/rewrite handler.
  if (requestUrl.searchParams.get(RAW_QUERY) === "1") return next();

  const canonicalTarget = canonicalHostTarget(requestUrl);
  if (canonicalTarget) return redirect301(canonicalTarget);

  const serviceTarget = legacyServiceTarget(requestUrl);
  if (serviceTarget) return redirect301(serviceTarget);

  // The homepage is the prebuilt 3D homepage (concierge/build.mjs); the classic-homepage enhancements don't apply.
  const pagePath = pathname.replace(/^\/(?:en|de)(?=\/|$)/, '') || '/';
  if (conciergeRoutes.some(path => path.replace(/\/$/, '') === pagePath.replace(/\/$/, ''))) return next();

  if (pathname === WATCH_BUNDLE_PATH) return patchWatchBundleRequest(request);
  if (pathname === PENTHOUSE_BUNDLE_PATH) return patchPenthouseBundleRequest(request);
  if (isRetiredLegacyPath(pathname)) return retired410();
  if (pathname === "/sitemap.xml") return next();
  if (isServicePath(pathname)) return enhanceServiceRequest(request, pathname);

  const slug = pathname.split("/").filter(Boolean)[0];
  if (CINEMATIC_PAGES[slug]) return enhanceCinematicRequest(request, slug);

  if (
    pathname.startsWith("/blog/") ||
    shouldEnhanceSitePath(pathname) ||
    isGscIndexingPath(pathname) ||
    shouldEnhanceSecondLayerPath(pathname) ||
    shouldPolishPath(pathname)
  ) {
    return enhanceStaticRequest(request, pathname);
  }
  return next();
}
