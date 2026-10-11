import { getKv, StoreError } from './kv';
import { conciergeMode, budgets } from '../core/config';
// Global daily spend budgets. When a budget is exhausted the concierge enters 'degraded' mode:
// REASONING falls back to rules, answers become grounded snippets, and audits pause.
export type Mode = 'on' | 'degraded' | 'off';
export type BudgetName = 'fast' | 'reasoning' | 'tokens' | 'audits';
function limitFor(name: BudgetName): number { return budgets()[name]; }
function dayKey(name: BudgetName): string { return `dx:budget:${name}:${Math.floor(Date.now() / 86_400_000)}`; }
/** Charge a budget by an amount (default 1). Returns false when the budget is exhausted. 429s should not charge. */
export async function charge(name: BudgetName, amount = 1): Promise<boolean> {
  const cap = limitFor(name);
  if (cap === Infinity) return true;
  try {
    const kv = getKv();
    const key = dayKey(name);
    const current = Number(await kv.get(key)) || 0;
    if (current >= cap) return false;
    await kv.set(key, String(current + amount), 86_400);
    return true;
  } catch (error) { if (error instanceof StoreError) return true; throw error; }
}
/** Whether a budget still has headroom, without charging it. */
export async function available(name: BudgetName): Promise<boolean> {
  const cap = limitFor(name);
  if (cap === Infinity) return true;
  try { return (Number(await getKv().get(dayKey(name))) || 0) < cap; }
  catch (error) { if (error instanceof StoreError) return true; throw error; }
}
/** Resolve the effective concierge mode: the DX_CONCIERGE_MODE kill switch first, then budgets. */
export async function mode(): Promise<Mode> {
  const configured = conciergeMode();
  if (configured === 'off') return 'off';
  if (configured === 'degraded') return 'degraded';
  if (!(await available('fast')) || !(await available('reasoning')) || !(await available('tokens'))) return 'degraded';
  return 'on';
}