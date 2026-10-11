import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { GeminiProvider } from '../server/ai/gemini-provider';
import { FakeProvider } from '../server/ai/fake-provider';
import { ModelError, ModelOutputError } from '../server/ai/provider';
import { parseStrict } from '../server/ai/structured';
import { publicError } from '../shared/public-error';

const schema = z.object({ intent: z.enum(['book', 'ask']), note: z.string().max(20) }).strict();
function geminiResponse(text: string, extra: Record<string, unknown> = {}) {
  return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 11, candidatesTokenCount: 7, thoughtsTokenCount: 3 }, ...extra }) } as Response;
}
function withFetch(handler: () => Response | Promise<Response> | never, fn: () => Promise<void>) {
  return async () => { const original = globalThis.fetch; globalThis.fetch = (async () => handler()) as typeof fetch; try { await fn(); } finally { globalThis.fetch = original; } };
}

test('parseStrict rejects truncated JSON, extra keys and bad enums', () => {
  assert.throws(() => parseStrict(schema, '{"intent":"book"'), (e) => e instanceof ModelOutputError);
  assert.throws(() => parseStrict(schema, '{"intent":"book","note":"x","extra":1}'), (e) => e instanceof ModelOutputError);
  assert.throws(() => parseStrict(schema, '{"intent":"maybe","note":"x"}'), (e) => e instanceof ModelOutputError);
  assert.deepEqual(parseStrict(schema, '{"intent":"book","note":"ok"}'), { intent: 'book', note: 'ok' });
});

test('gemini provider parses usage and valid output', withFetch(() => geminiResponse('{"intent":"ask","note":"hi"}'), async () => {
  process.env.GEMINI_API_KEY = 'unit-test';
  const result = await new GeminiProvider().generateObject({ route: 'respond', system: 's', contents: [{ role: 'user', text: 'q' }], schema, signal: AbortSignal.timeout(1000) });
  assert.deepEqual(result.value, { intent: 'ask', note: 'hi' });
  assert.deepEqual(result.usage, { promptTokens: 11, candidateTokens: 7, thoughtTokens: 3 });
  assert.equal(result.repaired, false);
}));

test('gemini provider repairs once then succeeds', async () => {
  process.env.GEMINI_API_KEY = 'unit-test';
  const bodies = ['{"intent":"book"', '{"intent":"book","note":"ok"}'];
  const original = globalThis.fetch;
  let call = 0;
  globalThis.fetch = (async () => geminiResponse(bodies[call++])) as typeof fetch;
  try {
    const result = await new GeminiProvider().generateObject({ route: 'respond', system: 's', contents: [{ role: 'user', text: 'q' }], schema, signal: AbortSignal.timeout(1000) });
    assert.equal(result.repaired, true);
    assert.equal(result.value.note, 'ok');
    assert.equal(call, 2);
  } finally { globalThis.fetch = original; }
});

test('an empty answer becomes a ModelOutputError', withFetch(() => geminiResponse(''), async () => {
  process.env.GEMINI_API_KEY = 'unit-test';
  // Empty first + empty repair -> the original output error propagates.
  await assert.rejects(new GeminiProvider().generateObject({ route: 'respond', system: 's', contents: [{ role: 'user', text: 'q' }], schema, signal: AbortSignal.timeout(1000) }), (e) => e instanceof ModelError);
}));

test('a safety-blocked finish maps to model_blocked', withFetch(() => ({ ok: true, json: async () => ({ promptFeedback: { blockReason: 'SAFETY' } }) } as Response), async () => {
  process.env.GEMINI_API_KEY = 'unit-test';
  await assert.rejects(new GeminiProvider().generateObject({ route: 'respond', system: 's', contents: [{ role: 'user', text: 'q' }], schema, signal: AbortSignal.timeout(1000) }), (e) => e instanceof ModelError && (e as ModelError).modelCode === 'model_blocked');
}));

test('a 429 maps to provider_busy and a timeout maps to model_timeout', async () => {
  process.env.GEMINI_API_KEY = 'unit-test';
  const original = globalThis.fetch;
  globalThis.fetch = (async () => ({ ok: false, status: 429, body: null } as Response)) as typeof fetch;
  try { await assert.rejects(new GeminiProvider().generateObject({ route: 'respond', system: 's', contents: [{ role: 'user', text: 'q' }], schema, signal: AbortSignal.timeout(1000) }), (e) => e instanceof ModelError && (e as ModelError).modelCode === 'provider_busy'); }
  finally { globalThis.fetch = original; }
  globalThis.fetch = (async () => { throw new DOMException('t', 'TimeoutError'); }) as typeof fetch;
  try { await assert.rejects(new GeminiProvider().generateObject({ route: 'respond', system: 's', contents: [{ role: 'user', text: 'q' }], schema, signal: AbortSignal.timeout(1000) }), (e) => e instanceof ModelError && (e as ModelError).modelCode === 'model_timeout'); }
  finally { globalThis.fetch = original; }
});

test('the provider or model name never reaches visitor text', () => {
  // Model error codes map to neutral visitor copy — never "Gemini", model ids, or raw provider text.
  for (const message of ['ai_unavailable', 'upstream_unavailable']) {
    for (const locale of ['bs', 'en', 'de']) {
      const text = publicError(message, locale);
      assert.ok(!/gemini|google|flash|pro|generativelanguage/i.test(text), `${locale}:${message} leaked a provider name`);
    }
  }
});

test('fake provider scripts outputs and errors per route', async () => {
  const fake = new FakeProvider().enqueue('respond', '{"intent":"ask","note":"hi"}').enqueue('interpretAudit', new ModelError('provider_busy'));
  const ok = await fake.generateObject({ route: 'respond', system: 's', contents: [], schema, signal: AbortSignal.timeout(1000) });
  assert.equal(ok.value.intent, 'ask');
  await assert.rejects(fake.generateObject({ route: 'interpretAudit', system: 's', contents: [], schema, signal: AbortSignal.timeout(1000) }), (e) => e instanceof ModelError);
});