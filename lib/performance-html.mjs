function attr(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i'))?.[1] || '';
}

function addAttr(tag, name, value) {
  if (new RegExp(`\\b${name}\\s*=`, 'i').test(tag)) return tag;
  return tag.replace(/\s*\/?>$/, (ending) => ` ${name}="${value}"${ending}`);
}

function dedupePreloads(html) {
  const seen = new Set();
  return String(html).replace(/\s*<link\b(?=[^>]*\brel=["']preload["'])[^>]*>/gi, (tag) => {
    const href = attr(tag, 'href');
    const as = attr(tag, 'as');
    if (!href) return tag;
    const key = `${as}|${href}`;
    if (seen.has(key)) return '';
    seen.add(key);
    return tag;
  });
}

function optimizeImages(html) {
  return String(html).replace(/<img\b[^>]*>/gi, (original) => {
    let tag = original;
    const highPriority = /\bfetchpriority\s*=\s*["']high["']/i.test(tag) || /\bclass\s*=\s*["'][^"']*\bhero(?:__|-|\s)[^"']*["']/i.test(tag);
    if (!/\bloading\s*=/i.test(tag)) tag = addAttr(tag, 'loading', highPriority ? 'eager' : 'lazy');
    if (!/\bdecoding\s*=/i.test(tag)) tag = addAttr(tag, 'decoding', 'async');
    if (highPriority && /\bloading\s*=\s*["']lazy["']/i.test(tag)) {
      tag = tag.replace(/\bloading\s*=\s*["']lazy["']/i, 'loading="eager"');
    }
    return tag;
  });
}

export function enhancePerformanceHtml(source) {
  if (typeof source !== 'string') return source;
  return optimizeImages(dedupePreloads(source));
}
