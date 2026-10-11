import { z, type ZodType } from 'zod';
import { ModelOutputError } from './provider';
// Validate model JSON against a schema. On failure make one repair attempt carrying the validation error; then throw.
export function parseStrict<T>(schema: ZodType<T>, raw: string): T {
  let data: unknown;
  try { data = JSON.parse(raw); } catch { throw new ModelOutputError('not_json'); }
  const result = schema.safeParse(data);
  if (!result.success) throw new ModelOutputError(z.prettifyError(result.error).slice(0, 300));
  return result.data;
}
export type RepairContext = { schemaJson: unknown; previous: string; error: string };
export function repairInstruction(context: RepairContext): string {
  return `Your previous response did not match the required JSON schema. Error: ${context.error}. Return only valid JSON matching this schema: ${JSON.stringify(context.schemaJson)}. Do not include any prose.`;
}