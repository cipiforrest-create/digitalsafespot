import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { orchestrate } from '../server/orchestrator/orchestrate';
import { classifyIntent } from '../server/orchestrator/intents';
import { resetIndex } from '../server/knowledge/retriever';
import { FakeProvider } from '../server/ai/fake-provider';
import { chatV2RequestSchema, respondSchema } from '../shared/chat-v2';
import type { Context } from '../shared/contracts';

resetIndex();
const ctx = (over: Partial<Context> = {}): Context => ({ goal: null, messages: [], ...over } as Context);
const userMsg = (content: string): Context => ctx({ messages: [{ role: 'user', content }] });
function collect() { const events: { event: string; data: unknown }[] = []; return { emit: (event: string, data: unknown) => events.push({ event, data }), events }; }

test('deterministic intents are classified without a model call', () => {
  assert.equal(classifyIntent('Pozdrav!').kind, 'greeting');
  assert.equal(classifyIntent('Provedi me kroz ponudu').kind, 'tour');
  assert.equal(classifyIntent('Pokreni analizu mog sajta').kind, 'audit');
  const nav = classifyIntent('Pokaži mi SEO');
  assert.equal(nav.kind, 'navigate');
});

test('audit intent does not fire on a pricing question (false-positive guard)', () => {
  assert.equal(classifyIntent('Koliko košta analiza?').kind, 'model');
  assert.equal(classifyIntent('Šta je AI analiza sadržaja?').kind, 'model');
});

test('greeting turn emits a warm line and no action, no model call', async () => {
  const { emit, events } = collect();
  const provider = new FakeProvider(); // no scripted responses: a model call would throw
  const result = await orchestrate({ context: userMsg('Pozdrav!'), sid: randomUUID(), provider, signal: AbortSignal.timeout(1000) }, emit);
  assert.equal(result.usedModel, false);
  assert.equal(result.action, null);
  assert.deepEqual(events.map(e => e.event), ['delta', 'done']);
  assert.match((events[0].data as { text: string }).text, /Pozdrav/);
});

test('audit turn emits an open_audit action deterministically', async () => {
  const { emit, events } = collect();
  const result = await orchestrate({ context: userMsg('Pokreni analizu stranice'), sid: randomUUID(), provider: new FakeProvider(), signal: AbortSignal.timeout(1000) }, emit);
  assert.equal(result.usedModel, false);
  assert.deepEqual(result.action, { type: 'open_audit' });
  assert.ok(events.some(e => e.event === 'action' && (e.data as { type: string }).type === 'open_audit'));
});

test('explicit navigation emits a navigate_section action for a valid section', async () => {
  const { emit } = collect();
  const result = await orchestrate({ context: userMsg('Pokaži mi SEO'), sid: randomUUID(), provider: new FakeProvider(), signal: AbortSignal.timeout(1000) }, emit);
  assert.equal(result.action?.type, 'navigate_section');
  assert.equal((result.action as { section: string }).section, 'aeo');
});

test('an open question uses one bounded model call and maps a recommendation', async () => {
  const { emit, events } = collect();
  const provider = new FakeProvider().enqueue('respond', JSON.stringify({ reply: 'Cijene ovise o obimu; rado objasnim opcije.', recommend: 'pricing' }));
  const result = await orchestrate({ context: userMsg('Koliko košta web stranica i šta dobijam?'), sid: randomUUID(), provider, signal: AbortSignal.timeout(1000) }, emit);
  assert.equal(result.usedModel, true);
  assert.equal(result.action?.type, 'recommend');
  assert.equal((result.action as { section: string }).section, 'pricing');
  assert.deepEqual(events.map(e => e.event), ['delta', 'action', 'done']);
});

test('tour narration is deterministic application state, never a model call', async () => {
  const { emit, events } = collect();
  const result = await orchestrate({ context: ctx({ tourStep: 'visibility', messages: [] }), sid: randomUUID(), provider: new FakeProvider(), signal: AbortSignal.timeout(1000) }, emit);
  assert.equal(result.usedModel, false);
  assert.equal(result.action, null);
  assert.ok((events[0].data as { text: string }).text.length > 0);
});

test('degraded mode answers without a model call', async () => {
  const { emit } = collect();
  const provider = new FakeProvider(); // no scripted responses; must not be called
  const result = await orchestrate({ context: userMsg('Koliko košta web stranica?'), sid: randomUUID(), provider, signal: AbortSignal.timeout(1000), degraded: true }, emit);
  assert.equal(result.usedModel, false);
  assert.ok(result.reply.length > 0);
});

test('the v2 request schema is closed and requires v:2', () => {
  assert.equal(chatV2RequestSchema.safeParse({ v: 2, context: { goal: null, messages: [] } }).success, true);
  assert.equal(chatV2RequestSchema.safeParse({ context: { goal: null, messages: [] } }).success, false);
  assert.equal(chatV2RequestSchema.safeParse({ v: 2, context: { goal: null, messages: [] }, extra: 1 }).success, false);
  // The model reply schema rejects extra keys and oversize output.
  assert.equal(respondSchema.safeParse({ reply: 'ok', recommend: 'pricing' }).success, true);
  assert.equal(respondSchema.safeParse({ reply: 'ok', recommend: 'not-a-section' }).success, false);
});