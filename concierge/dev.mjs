import http from 'node:http';
import { readFile, stat, open } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = process.cwd();
const staticRoot = resolve(root,'public');
try { process.loadEnvFile('.env.concierge.local'); } catch { /* Optional local configuration. */ }
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname.startsWith('/api/concierge/') || pathname === '/api/lead') {
      const name = pathname.split('/').pop();
      if (!['session', 'chat', 'audit', 'lead'].includes(name)) { res.writeHead(404).end(); return; }
      const chunks = []; let length = 0;
      for await (const c of req) { length += c.length; if (length > 65536) { res.writeHead(413).end(); return; } chunks.push(c); }
      try { req.body = JSON.parse(Buffer.concat(chunks).toString() || '{}'); } catch { res.writeHead(400).end(); return; }
      res.status = (code) => { res.statusCode = code; return res; };
      res.json = (body) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); return res; };
      const handler = require(resolve(root, pathname === '/api/lead' ? 'api/lead.js' : `api/concierge/${name}.js`));
      await (handler.default || handler)(req, res); return;
    }
    let file = resolve(staticRoot, '.' + decodeURIComponent(pathname));
    if (file !== staticRoot && !file.startsWith(staticRoot + '/') && !file.startsWith(staticRoot + '\\')) { res.writeHead(403).end(); return; }
    const info = await stat(file).catch(() => null);
    if (info?.isDirectory()) file = resolve(file, 'index.html');
    const range = req.headers.range;
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    if (range && extname(file) === '.mp4') {
      const size = (await stat(file)).size;
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match) { res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end(); return; }
      const start = match[1] ? Number(match[1]) : 0;
      const end = Math.min(match[2] ? Number(match[2]) : size - 1, size - 1);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start > end || start >= size) { res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end(); return; }
      const handle = await open(file, 'r');
      try { const body = Buffer.alloc(end - start + 1); await handle.read(body, 0, body.length, start); res.writeHead(206, { 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': body.length }); res.end(body); } finally { await handle.close(); }
      return;
    }
    const body = await readFile(file);
    if (extname(file) === '.mp4') res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
    res.setHeader('Cache-Control', 'no-store'); res.end(body);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(Number(process.env.PORT || 4317), '127.0.0.1', () => console.log(`Preview: http://localhost:${process.env.PORT || 4317}/ai-concierge-preview`));
