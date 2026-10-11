import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseConfig, envSchema } from '../server/core/config';
import { errorCodes } from '../server/core/errors';
import { locales, messages, resolveLocale, t } from '../shared/i18n';
import { publicError } from '../shared/public-error';

test('config parses aliases and a production-like profile', () => {
  const base = parseConfig({});
  assert.equal(base.fastModel, 'gemini-2.5-flash');
  assert.equal(base.store, 'memory');
  assert.equal(base.visitorCopy, false);
  const upstash = parseConfig({ UPSTASH_REDIS_REST_URL: 'https://x', UPSTASH_REDIS_REST_TOKEN: 't', DX_GEMINI_MODEL: 'gemini-fast' });
  assert.equal(upstash.kvUrl, 'https://x');
  assert.equal(upstash.kvToken, 't');
  assert.equal(upstash.fastModel, 'gemini-fast');
  const vercel = parseConfig({ KV_REST_API_URL: 'https://kv', KV_REST_API_TOKEN: 'kt', VERCEL: '1', VERCEL_ENV: 'production', DX_CONCIERGE_API: 'on', DX_VISITOR_COPY: 'on' });
  assert.equal(vercel.kvUrl, 'https://kv');
  assert.equal(vercel.isVercel, true);
  assert.equal(vercel.vercelEnv, 'production');
  assert.equal(vercel.visitorCopy, true);
  assert.throws(() => envSchema.parse({ CONCIERGE_SESSION_SECRET: 'too-short' }));
});

test('every locale defines exactly the same message keys (i18n parity)', () => {
  const reference = Object.keys(messages.bs).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(messages[locale]).sort(), reference, locale);
});

test('every error code maps to non-empty copy in every locale', () => {
  for (const code of errorCodes) for (const locale of locales) {
    const message = t(code, locale);
    assert.equal(typeof message, 'string');
    assert.ok(message.length > 0, `${locale}:${code}`);
  }
});

test('publicError resolves typed codes by locale and keeps legacy pattern fallback', () => {
  assert.equal(publicError('rate_limited', 'en'), messages.en.rate_limited);
  assert.equal(publicError('rate_limited', 'de'), messages.de.rate_limited);
  assert.equal(publicError('rate_limited'), messages.bs.rate_limited);
  assert.equal(resolveLocale('en-US'), 'en');
  assert.equal(resolveLocale('xx'), 'bs');
  // Legacy free-text messages still map to stable bs copy.
  assert.equal(publicError('The session expired, please reconnect'), messages.bs.session_unavailable);
});

test('no server or shared source reads process.env directly (config/build/dev excepted)', () => {
  const allowed = new Set(['config.ts']);
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!entry.endsWith('.ts') || entry.endsWith('.test.ts') || entry.endsWith('.spec.ts')) continue;
      if (allowed.has(entry)) continue;
      if (/process\.env/.test(readFileSync(full, 'utf8'))) offenders.push(full);
    }
  };
  walk(join(process.cwd(), 'concierge', 'server'));
  walk(join(process.cwd(), 'concierge', 'shared'));
  assert.deepEqual(offenders, [], `process.env used outside config: ${offenders.join(', ')}`);
});