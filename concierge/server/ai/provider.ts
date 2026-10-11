import type { ZodType } from 'zod';
// Typed AI provider abstraction. P0 uses structured (JSON-mode) output everywhere; streaming is reserved for P1 voice UX.
export type RouteName = 'respond' | 'interpretAudit' | 'buildSolutionMap';
export type Turn = { role: 'user' | 'model'; text: string };
export type Usage = { promptTokens: number; candidateTokens: number; thoughtTokens: number };
export type GenerateRequest<T> = { route: RouteName; system: string; contents: Turn[]; schema: ZodType<T>; signal: AbortSignal };
export type GenerateResult<T> = { value: T; usage: Usage; repaired: boolean };
export interface AIProvider {
  generateObject<T>(req: GenerateRequest<T>): Promise<GenerateResult<T>>;
}
// Typed model errors. Public text is derived from codes elsewhere; these never reach the visitor verbatim.
export type ModelErrorCode = 'provider_busy' | 'provider_unavailable' | 'model_blocked' | 'model_invalid_output' | 'model_timeout';
export class ModelError extends Error {
  constructor(public readonly modelCode: ModelErrorCode) { super(modelCode); this.name = 'ModelError'; }
}
export class ModelOutputError extends ModelError {
  constructor(public readonly detail: string) { super('model_invalid_output'); this.name = 'ModelOutputError'; }
}