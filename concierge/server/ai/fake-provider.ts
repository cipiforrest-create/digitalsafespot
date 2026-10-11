import { parseStrict } from './structured';
import { ModelError, type AIProvider, type GenerateRequest, type GenerateResult, type Usage } from './provider';
// Scripted provider for tests and offline/local preflight. Enqueue either raw JSON strings or ModelError instances per route.
type Scripted = string | ModelError;
const ZERO_USAGE: Usage = { promptTokens: 0, candidateTokens: 0, thoughtTokens: 0 };
export class FakeProvider implements AIProvider {
  private queues = new Map<string, Scripted[]>();
  private usage: Usage = ZERO_USAGE;
  enqueue(route: GenerateRequest<unknown>['route'], ...responses: Scripted[]): this {
    const queue = this.queues.get(route) ?? [];
    queue.push(...responses);
    this.queues.set(route, queue);
    return this;
  }
  withUsage(usage: Usage): this { this.usage = usage; return this; }
  async generateObject<T>(req: GenerateRequest<T>): Promise<GenerateResult<T>> {
    const queue = this.queues.get(req.route) ?? [];
    const first = queue.shift();
    if (first === undefined) throw new ModelError('provider_unavailable');
    if (first instanceof ModelError) throw first;
    // If the first scripted output is invalid, a repair consumes the next queued response (mirrors the real provider).
    try { return { value: parseStrict(req.schema, first), usage: this.usage, repaired: false }; }
    catch (error) {
      const repair = queue.shift();
      if (repair === undefined || repair instanceof ModelError) throw error;
      return { value: parseStrict(req.schema, repair), usage: this.usage, repaired: true };
    }
  }
}