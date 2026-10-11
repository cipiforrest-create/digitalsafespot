import { z } from 'zod';
import { apiKey } from '../http';
import { ROUTES, routeSignal } from './routes';
import { parseStrict, repairInstruction } from './structured';
import { ModelError, ModelOutputError, type AIProvider, type GenerateRequest, type GenerateResult, type Turn, type Usage } from './provider';
type GeminiPart = { text?: string };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
  error?: { code?: number };
};
function usageOf(response: GeminiResponse): Usage {
  const u = response.usageMetadata || {};
  return { promptTokens: u.promptTokenCount || 0, candidateTokens: u.candidatesTokenCount || 0, thoughtTokens: u.thoughtsTokenCount || 0 };
}
function contentsOf(turns: Turn[]) { return turns.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })); }
// Gemini transport with structured (JSON-mode) output and typed error mapping. No SDK.
export class GeminiProvider implements AIProvider {
  async generateObject<T>(req: GenerateRequest<T>): Promise<GenerateResult<T>> {
    const config = ROUTES[req.route];
    const model = config.model();
    if (!/^[a-zA-Z0-9.-]+$/.test(model)) throw new ModelError('provider_unavailable');
    const schemaJson = z.toJSONSchema(req.schema);
    const first = await this.call(model, req.system, contentsOf(req.contents), schemaJson, config, routeSignal(req.route, req.signal, false));
    try { return { value: parseStrict(req.schema, first.text), usage: first.usage, repaired: false }; }
    catch (error) {
      if (!(error instanceof ModelOutputError)) throw error;
      // One repair attempt: replay the turns, add the model's bad output and a correction instruction.
      const repairContents = [
        ...contentsOf(req.contents),
        { role: 'model', parts: [{ text: first.text }] },
        { role: 'user', parts: [{ text: repairInstruction({ schemaJson, previous: first.text, error: error.detail }) }] },
      ];
      const repaired = await this.call(model, req.system, repairContents, schemaJson, config, routeSignal(req.route, req.signal, true));
      return { value: parseStrict(req.schema, repaired.text), usage: repaired.usage, repaired: true };
    }
  }
  private async call(model: string, system: string, contents: { role: string; parts: { text: string }[] }[], schemaJson: unknown, config: typeof ROUTES[keyof typeof ROUTES], signal: AbortSignal): Promise<{ text: string; usage: Usage }> {
    const key = apiKey();
    let response: Response;
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', signal, redirect: 'error',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: config.maxOutputTokens, responseMimeType: 'application/json', responseJsonSchema: schemaJson, thinkingConfig: { thinkingBudget: config.thinkingBudget } },
        }),
      });
    } catch (cause) {
      if (cause instanceof Error && (cause.name === 'TimeoutError' || cause.name === 'AbortError')) throw new ModelError('model_timeout');
      throw new ModelError('provider_unavailable');
    }
    if (!response.ok) { await response.body?.cancel(); throw new ModelError(response.status === 429 ? 'provider_busy' : 'provider_unavailable'); }
    const data = await response.json().catch(() => { throw new ModelError('provider_unavailable'); }) as GeminiResponse;
    if (data.error) throw new ModelError(data.error.code === 429 ? 'provider_busy' : 'provider_unavailable');
    if (data.promptFeedback?.blockReason) throw new ModelError('model_blocked');
    const candidate = data.candidates?.[0];
    const finish = candidate?.finishReason;
    if (finish && !['STOP', 'MAX_TOKENS'].includes(finish)) throw new ModelError('model_blocked');
    const text = (candidate?.content?.parts || []).map((part) => part.text || '').join('');
    if (!text) throw new ModelOutputError('empty');
    return { text, usage: usageOf(data) };
  }
}