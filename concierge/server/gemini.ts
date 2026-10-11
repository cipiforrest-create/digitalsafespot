import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { contextSchema, toolDeclarations, toolResultSchema, validateTool, type Context, type ToolCall } from '../shared/contracts';
import { systemPrompt } from '../shared/knowledge';
import { readSse } from '../shared/sse';
import { apiKey, HttpError, sign, verify } from './http';
import { geminiModel } from './core/config';

type Part = { text?: string; thought?: boolean; thoughtSignature?: string; functionCall?: { id?: string; name: string; args: Record<string, unknown> }; functionResponse?: { id?: string; name: string; response: unknown } };
type Content = { role: 'user' | 'model'; parts: Part[] };
type Continuation = { sid: string; exp: number; hash: string; contents: Content[]; calls: ToolCall[]; rounds: number };
export const chatInputSchema = z.object({ context: contextSchema, continuation: z.string().max(45000).optional(), results: z.array(toolResultSchema).max(8).optional() }).strict();
function historyHash(context: Context) { return createHash('sha256').update(JSON.stringify(context)).digest('hex'); }
export async function chat(input: z.infer<typeof chatInputSchema>, sid: string, signal: AbortSignal, emit: (event: string, value: unknown) => void) {
  const key = apiKey(); const model = geminiModel();
  if (!/^[a-zA-Z0-9.-]+$/.test(model)) throw new HttpError(503, 'The AI connection needs attention.');
  let contents: Content[] = input.context.messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  if(input.context.tourStep)contents.push({role:'user',parts:[{text:`Website tour event: the requested tour reached ${input.context.tourStep}. This is application state, not new visitor speech. Briefly explain this stop using the verified tour context. Do not advance or restart the tour.`}]});
  let rounds = 0;
  if (input.continuation) {
    const pending = verify<Continuation>(input.continuation);
    if (pending.sid !== sid || pending.exp < Date.now() || pending.hash !== historyHash(input.context) || pending.rounds > 3) throw new HttpError(400, 'Please send your message again.');
    const results = input.results || [];
    if (results.length !== pending.calls.length || new Set(results.map(r => r.id)).size !== results.length || results.some(r => !pending.calls.some(c => c.id === r.id))) throw new HttpError(400, 'Invalid action acknowledgement.');
    contents = [...pending.contents, { role: 'user', parts: pending.calls.map(call => ({ functionResponse: { id: call.id, name: call.name, response: results.find(r => r.id === call.id) } })) }];
    rounds = pending.rounds;
  } else if (input.results?.length) throw new HttpError(400, 'Unexpected action acknowledgement.');
  if (!contents.length) throw new HttpError(400, 'Please enter a message.');
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`, {
    method: 'POST', signal, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt(input.context) }] }, contents, tools: [{ functionDeclarations: toolDeclarations }], generationConfig: { temperature: 0.5, maxOutputTokens: 1100, thinkingConfig: { thinkingBudget: 0 } } }),
  });
  if (!response.ok || !response.body) {
    console.warn('concierge_provider_http', response.status);
    throw new HttpError(response.status === 429 ? 429 : 502, response.status === 429 ? 'The concierge is busy right now. Please try again shortly.' : 'The AI connection could not respond. Please try again.');
  }
  const parts: Part[] = []; const calls: ToolCall[] = []; let text = '';
  await readSse(response.body, (_name, value) => {
    const data = value as { candidates?: { content?: { parts?: Part[] } }[]; error?: unknown };
    if (data.error) throw new HttpError(502, 'The response was interrupted. Please try again.');
    for (const part of data.candidates?.[0]?.content?.parts || []) {
      if (part.thought) continue;
      if (part.text) { text += part.text; if (text.length > 10000) throw new HttpError(502, 'The response was too long. Please try a shorter question.'); emit('delta', { text: part.text }); }
      if (part.functionCall) {
        if (calls.length >= 6 || rounds >= 3) throw new HttpError(502, 'Please choose the section you would like to explore.');
        const call = validateTool({ id: part.functionCall.id || randomUUID(), name: part.functionCall.name, args: part.functionCall.args || {} });
        part.functionCall.id = call.id; calls.push(call); emit('tool', call);
      }
      parts.push(part);
    }
  });
  if (!text && !calls.length) throw new HttpError(502, 'No response came through. Please try again.');
  if (calls.length) {
    const continuation = sign({ sid, exp: Date.now() + 90_000, hash: historyHash(input.context), contents: [...contents, { role: 'model', parts }], calls, rounds: rounds + 1 } satisfies Continuation);
    emit('done', { continuation });
  } else emit('done', {});
}
