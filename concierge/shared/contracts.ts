import { z } from 'zod';
import { pageIds } from './catalogue';
import {tourStopIds} from './tour';

export const goalSchema = z.enum(['customers', 'visibility', 'website', 'response']);
export type Goal = z.infer<typeof goalSchema>;
export const goalLabels: Record<Goal, string> = { customers: 'Želim više klijenata', visibility: 'AI ne preporučuje moju firmu', website: 'Web stranici treba novi izgled', response: 'Presporo odgovaramo na upite' };
export const sectionSchema = z.enum(['growth', 'receptionist', 'aeo', 'storefront', 'process', 'strategy','cinematic','examples','services','launch','value','work','pricing','shop','blog','transformations']);
export type Section = z.infer<typeof sectionSchema>;
export const goalSections: Record<Goal, Section> = { customers: 'growth', visibility: 'aeo', website: 'storefront', response: 'receptionist' };
export const messageSchema = z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(4000) }).strict();
export type Message = z.infer<typeof messageSchema>;
export const contextSchema = z.object({ goal: goalSchema.nullable().default(null), messages: z.array(messageSchema).max(20).default([]),pageId:z.enum(pageIds).optional(),section:sectionSchema.optional(),locale:z.enum(['bs','hr','sr','en','de']).optional(),tourStep:z.enum(tourStopIds).optional() }).strict().refine(v => v.messages.reduce((n, m) => n + m.content.length, 0) <= 14000, 'Conversation is too long');
export type Context = z.infer<typeof contextSchema>;

// Adapted from GrowthOS AssistantToolRegistry: strict input boundaries and a closed registry.
const empty = z.object({}).strict();
const sectionArgs = z.object({ section: sectionSchema }).strict();
export const toolSchemas = {
  select_goal: z.object({ goal: goalSchema }).strict(),
  navigate_to_section: sectionArgs,
  navigate_to_page: z.object({pageId:z.enum(pageIds)}).strict(),
  guide_website:z.object({action:z.enum(['start','next','pause','resume','stop'])}).strict(),
  explore_cinematic:z.object({chapter:z.enum(['signal','web','visibility','automation','knowledge','system'])}).strict(),
  select_cinematic_example:z.object({example:z.enum(['hotel','watch','penthouse','clothes','perfume','sneakers','dentist','deepsea','vanta'])}).strict(),
  highlight_solution: sectionArgs,
  show_recommendation: z.object({ section: sectionSchema, reason: z.string().min(1).max(400) }).strict(),
  open_ai_audit: empty,
  show_lead_response_demo: empty,
  start_text_mode: empty,
  end_voice_session: empty,
};
export type ToolName = keyof typeof toolSchemas;
export type ToolCall = { id: string; name: ToolName; args: Record<string, string> };
export function validateTool(raw: unknown): ToolCall {
  const input = z.object({ id: z.string().min(1).max(150), name: z.string(), args: z.record(z.string(), z.unknown()) }).strict().parse(raw);
  if (!Object.hasOwn(toolSchemas, input.name)) throw new Error('tool_not_allowed');
  const name = input.name as ToolName;
  return { id: input.id, name, args: toolSchemas[name].parse(input.args) };
}
const description: Record<ToolName, string> = {
  select_goal: 'Select the visitor’s business objective. It may be changed at any time.',
  navigate_to_section: 'Scroll to a relevant section of this website.',
  navigate_to_page: 'Open a registered service or project page when requested. The conversation stays active. Use a pageId from the catalogue.',
  guide_website:'Start the guided website tour ONLY when the visitor asks to be guided or shown the offers. It navigates through the film, nine examples and services with controls. Pause, resume, next or stop on request. Narrate the current stop after an applied result. Do not call next during automatic narration.',
  explore_cinematic:'Move the existing film to an allowed chapter. Open the cinematic page first if necessary.',
  select_cinematic_example:'Select an example in the gallery. Open examples first if necessary. No arbitrary external links.',
  highlight_solution: 'Highlight a relevant section of this website.',
  show_recommendation: 'Reveal a relevant website section and explain why it fits the visitor.',
  open_ai_audit: 'Open the audit form. The visitor enters and submits the URL themselves.',
  show_lead_response_demo: 'Open the labelled receptionist workflow demonstration; no actual SMS, calls or bookings are sent.',
  start_text_mode: 'Switch from voice to text while retaining the transcript.',
  end_voice_session: 'End the active voice connection at the visitor’s request.',
};
export const toolDeclarations = Object.entries(toolSchemas).map(([name, schema]) => {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  const { $schema: _schema, additionalProperties: _additional, ...parametersJsonSchema } = json;
  return { name, description: description[name as ToolName], parametersJsonSchema };
});

export const toolResultSchema = z.object({ id: z.string().max(150), status: z.enum(['applied', 'deferred', 'rejected']), detail: z.string().max(250).optional() }).strict();
export type ToolResult = z.infer<typeof toolResultSchema>;
// severity drives the traffic-light report (good / warning / critical); info checks are shown but never scored.
export type Severity = 'good' | 'warning' | 'critical' | 'info';
export type AuditCategory = 'Put do upita' | 'Vidljivost u pretrazi i AI' | 'Sadržaj i poruka' | 'Tehnička osnova';
export type AuditCheck = { id: string; title: string; status: 'found' | 'attention' | 'unavailable'; severity: Severity; weight: number; category: AuditCategory; evidence: string; recommendation: string; url: string };
export type AuditResult = { url: string; finalUrl: string; checkedAt: string; checks: AuditCheck[]; limitations: string[]; signature?: string };
const auditCheckSchema = z.object({ id: z.string().max(40), title: z.string().max(120), status: z.enum(['found', 'attention', 'unavailable']), severity: z.enum(['good', 'warning', 'critical', 'info']), weight: z.number().min(0).max(20), category: z.enum(['Put do upita', 'Vidljivost u pretrazi i AI', 'Sadržaj i poruka', 'Tehnička osnova']), evidence: z.string().max(1400), recommendation: z.string().max(600), url: z.string().max(2048) }).strict();
export const auditResultSchema = z.object({ url: z.string().max(2048), finalUrl: z.string().max(2048), checkedAt: z.string().max(40), checks: z.array(auditCheckSchema).max(40), limitations: z.array(z.string().max(300)).max(8) }).strict();
export const auditInputSchema = z.object({ url: z.string().trim().min(3).max(2048), industry: z.string().trim().min(2).max(120), market: z.string().trim().min(2).max(120), objective: z.enum(['More leads', 'AI visibility', 'Website redesign', 'Lead response automation', 'Other']),businessName:z.string().trim().max(160).optional(),city:z.string().trim().max(120).optional() }).strict();
// T17 audit v2 request. Only `url` is required now; the legacy industry/market/objective/businessName/city fields
// remain accepted (optional) for one release so the current client keeps working. An `auditId` may be supplied
// instead of a `url` to look up a previously persisted, owner-bound record without refetching.
export const auditRequestSchema = z.object({
  url: z.string().trim().min(3).max(2048).optional(),
  auditId: z.string().uuid().optional(),
  interpret: z.boolean().optional(),
  industry: z.string().trim().max(120).optional(),
  market: z.string().trim().max(120).optional(),
  objective: z.enum(['More leads', 'AI visibility', 'Website redesign', 'Lead response automation', 'Other']).optional(),
  businessName: z.string().trim().max(160).optional(),
  city: z.string().trim().max(120).optional(),
}).strict().refine(v => Boolean(v.url) || Boolean(v.auditId), 'Provide a website URL or an auditId');
export type AuditRequest = z.infer<typeof auditRequestSchema>;
export const leadInputSchema = z.object({ source: z.literal('AI Concierge'), submissionId: z.string().uuid(), company: z.string().trim().max(160), businessWebsite: z.union([z.url().max(2048), z.literal('')]), name: z.string().trim().min(1).max(120), email: z.email().max(254), goal: goalSchema.nullable(), summary: z.string().trim().min(1).max(4000), recommendedService: z.string().max(160), auditStatus: z.enum(['not_started', 'completed', 'partial', 'failed']), audit: z.object({ result: auditResultSchema, signature: z.string().max(600) }).strict().optional(), consent: z.literal(true), website: z.string().max(200).default('') }).strict();
