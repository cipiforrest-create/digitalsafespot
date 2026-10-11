import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { startTrace, setTraceSink, sessionHash } from '../server/core/trace';
import { sign, type Request, type Response } from '../server/http';
import session from '../server/session';

test('trace serializes only whitelisted fields and drops everything else', () => {
  const lines: string[] = [];
  const restore = setTraceSink((line) => lines.push(line));
  try {
    const trace = startTrace('chat');
    trace.setSession('sid-123');
    trace.span('tool', { tool: 'select_goal', email: 'visitor@example.com', message: 'secret words' } as never);
    trace.end('ok', { status: 'ok', apiKey: 'AIzaSECRET' } as never);
  } finally { restore(); }
  assert.equal(lines.length, 1);
  const payload = lines[0];
  assert.ok(!payload.includes('visitor@example.com'));
  assert.ok(!payload.includes('secret words'));
  assert.ok(!payload.includes('AIzaSECRET'));
  assert.ok(!payload.includes('sid-123'));
  assert.ok(payload.includes(sessionHash('sid-123')));
  assert.ok(payload.includes('"tool":"select_goal"'));
});

test('end is idempotent — exactly one trace line per request', () => {
  const lines: string[] = [];
  const restore = setTraceSink((line) => lines.push(line));
  try { const trace = startTrace('lead'); trace.end('ok'); trace.end('error'); } finally { restore(); }
  assert.equal(lines.length, 1);
  assert.ok(lines[0].includes('"status":"ok"'));
});

test('a handler emits exactly one trace and puts a requestId in error bodies', async () => {
  process.env.CONCIERGE_SESSION_SECRET = 'test-only-secret-'.repeat(4);
  const lines: string[] = [];
  const restore = setTraceSink((line) => lines.push(line));
  let output = '';
  try {
    // Missing origin/host -> guard throws -> error path.
    const req = { method: 'POST', headers: { 'content-type': 'application/json' }, body: { mode: 'text' }, socket: { remoteAddress: '127.0.0.1' } } as unknown as Request;
    const res = Object.assign(new EventEmitter(), { headersSent: false, statusCode: 200, setHeader: () => undefined, end: (value: string) => { output = value; } }) as unknown as Response;
    await session(req, res);
  } finally { restore(); }
  assert.equal(lines.length, 1);
  assert.ok(lines[0].includes('"status":"error"'));
  const parsed = JSON.parse(output);
  assert.equal(typeof parsed.requestId, 'string');
  assert.ok(parsed.requestId.length > 0);
  void sign; // referenced to keep import parity with other suites
});