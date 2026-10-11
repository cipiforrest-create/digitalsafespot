import { geminiModel, reasoningModel, reasoningThinking } from '../core/config';
import type { RouteName } from './provider';
// Route table (§6). Model ids come from env; timeouts/output caps are deterministic per route.
export type RouteConfig = { model: () => string; timeoutMs: number; repairMs: number; maxOutputTokens: number; thinkingBudget: number; tools: false };
export const ROUTES: Record<RouteName, RouteConfig> = {
  respond: { model: geminiModel, timeoutMs: 12_000, repairMs: 8_000, maxOutputTokens: 900, thinkingBudget: 0, tools: false },
  interpretAudit: { model: reasoningModel, timeoutMs: 25_000, repairMs: 8_000, maxOutputTokens: 1400, thinkingBudget: reasoningThinking(), tools: false },
  buildSolutionMap: { model: reasoningModel, timeoutMs: 25_000, repairMs: 8_000, maxOutputTokens: 1600, thinkingBudget: reasoningThinking(), tools: false },
};
export function routeSignal(route: RouteName, external: AbortSignal, repair = false): AbortSignal {
  const config = ROUTES[route];
  return AbortSignal.any([external, AbortSignal.timeout(repair ? config.repairMs : config.timeoutMs)]);
}