import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { sign, type Request, type Response } from '../server/http';
import session from '../server/session';

function voiceRequest(): Request {
  const sid = 'voice-off-test';
  return { method: 'POST', headers: { host: 'qa.example', origin: 'https://qa.example', 'content-type': 'application/json', cookie: `dx_concierge=${sign({ sid, issuedAt: Date.now(), exp: Date.now() + 60000, audience: 'qa.example' })}` }, body: { mode: 'voice', context: { goal: null, messages: [] } }, socket: { remoteAddress: '127.0.0.1' } } as unknown as Request;
}
async function invoke(req: Request) {
  let output = '';
  const res = Object.assign(new EventEmitter(), { headersSent: false, statusCode: 200, setHeader: () => undefined, end: (value: string) => { output = value; } }) as unknown as Response;
  await session(req, res);
  return { status: res.statusCode, body: output ? JSON.parse(output) : {} };
}

test('voice is rejected when the voice flag is off (no Live token can be minted)', async () => {
  process.env.CONCIERGE_SESSION_SECRET = 'unit-test-session-secret-'.repeat(3);
  process.env.GEMINI_API_KEY = 'unit-test';
  delete process.env.DX_CONCIERGE_VOICE;
  let fetched = false;
  const original = globalThis.fetch;
  globalThis.fetch = (async () => { fetched = true; return new globalThis.Response('{}', { status: 200 }); }) as typeof fetch;
  try {
    const response = await invoke(voiceRequest());
    assert.equal(response.status, 403);
    assert.equal(fetched, false, 'no token request may reach the provider when voice is off');
  } finally { globalThis.fetch = original; }
});
