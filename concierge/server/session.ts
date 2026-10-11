import { z } from 'zod';
import { contextSchema, toolDeclarations } from '../shared/contracts';
import { systemPrompt } from '../shared/knowledge';
import { mailConfigured } from './mail';
import { guard, createSession, apiKey, HttpError, json, fail, getSession, clearSession, type Request, type Response } from './http';
import { liveModel, n8nWebhookUrl, voiceEnabled } from './core/config';
import { startTrace } from './core/trace';
import { enforce } from './state/ratelimit';
import { endSession } from './state/session-state';
const inputSchema = z.object({ mode: z.enum(['text', 'voice', 'audit', 'end']), context: contextSchema.optional() }).strict();
export default async function handler(req: Request, res: Response) {
  const trace = startTrace('session');
  try {
    guard(req); await enforce(req, 'session'); const input = inputSchema.parse(req.body);
    // Explicit end: delete the durable state and clear the cookie.
    if (input.mode === 'end') { try { const existing = getSession(req); trace.setSession(existing.sid); await endSession(existing.sid); } catch { /* No valid session to end. */ } clearSession(res); json(res, 200, { status: 'ended' }); trace.end('ok', { mode: 'end' }); return; }
    const session = createSession(req, res);
    trace.setSession(session.sid);
    if (input.mode !== 'voice') { json(res, 200, { expiresAt: session.exp, leadConfigured: Boolean(n8nWebhookUrl()) || mailConfigured() }); trace.end('ok', { mode: input.mode }); return; }
    // T09: voice is off in P0. Reject before any microphone permission or Live token can occur.
    if (!voiceEnabled()) throw new HttpError(403, 'Voice is unavailable right now. You can continue in text.');
    const key = apiKey(); await enforce(req, 'voice', session.sid);
    if (!input.context) throw new HttpError(400, 'Please send your message again.');
    const model = liveModel();
    const config = {
      model: `models/${model}`,
      generationConfig: { responseModalities: ['AUDIO'], maxOutputTokens: 1000, speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } },
      systemInstruction: { parts: [{ text: systemPrompt(input.context) }] },
      tools: [{ functionDeclarations: toolDeclarations }],
      inputAudioTranscription: {}, outputAudioTranscription: {},
      historyConfig: { initialHistoryInClientContent: true },
    };
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/auth_tokens', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ uses: 1, expireTime: new Date(Math.min(session.exp, Date.now() + 10 * 60_000)).toISOString(), newSessionExpireTime: new Date(Math.min(session.exp,Date.now() + 60000)).toISOString(), bidiGenerateContentSetup: config }),
    });
    if (!response.ok) { console.warn('concierge_voice_token_http', response.status); throw new HttpError(503, 'Voice is unavailable right now. You can continue in text.'); }
    const data = await response.json() as { name?: string };
    if (!data.name) throw new HttpError(503, 'Voice could not connect. Please try text mode.');
    json(res, 200, { token: data.name, model, expiresAt: session.exp });
    trace.end('ok', { mode: 'voice' });
  } catch (error) { fail(res, error, trace.requestId); trace.end('error', { code: error instanceof Error ? error.name : 'unknown' }); }
}
