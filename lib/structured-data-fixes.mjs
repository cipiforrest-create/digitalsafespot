const SITE_ORIGIN = 'https://www.digital-x-marketing.com';
const LOGO_URL = `${SITE_ORIGIN}/assets/icon-512.png`;
const FALLBACK_ARTICLE_IMAGE = `${SITE_ORIGIN}/media/poster/journey-core.jpg`;
const ARTICLE_TYPES = new Set(['Article', 'BlogPosting', 'NewsArticle', 'TechArticle']);

function typesOf(node) {
  const type = node?.['@type'];
  return Array.isArray(type) ? type : type ? [type] : [];
}

function ogImage(html) {
  return html.match(/<meta\b(?=[^>]*\bproperty=["']og:image["'])[^>]*\bcontent=["']([^"']+)["'][^>]*>/i)?.[1] || FALLBACK_ARTICLE_IMAGE;
}

function patchNode(node, articleImage) {
  if (!node || typeof node !== 'object') return;
  const types = typesOf(node);
  if (types.includes('Organization') && !node.logo) {
    node.logo = { '@type': 'ImageObject', url: LOGO_URL };
    if (!node.image) node.image = LOGO_URL;
  }
  if (types.some((type) => ARTICLE_TYPES.has(type)) && !node.image) {
    node.image = articleImage;
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((item) => patchNode(item, articleImage));
    else if (value && typeof value === 'object') patchNode(value, articleImage);
  }
}

export function enhanceStructuredDataHtml(source, _pathname = '/') {
  if (typeof source !== 'string') return source;
  const image = ogImage(source);
  return source.replace(/<script\b([^>]*\btype=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi, (full, attrs, body) => {
    try {
      const data = JSON.parse(body.trim());
      patchNode(data, image);
      const safe = JSON.stringify(data).replaceAll('<', '\\u003c');
      return `<script${attrs}>${safe}</script>`;
    } catch {
      return full;
    }
  });
}
