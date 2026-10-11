import type { Context } from '../../shared/contracts';
import { sectionSchema } from '../../shared/contracts';
import { respondSchema, type ChatV2Action } from '../../shared/chat-v2';
import { tourStops } from '../../shared/tour';
import { resolvePageContext } from '../../shared/page-registry';
import { systemPrompt } from '../../shared/knowledge';
import { classifyIntent } from './intents';
import { handleActionTurn } from './lead-action-flow';
import type { ExecutionActor } from '../../shared/execution-run';
import { selectCapabilities } from './signals';
import { buildSolutionMap, toSolutionCard } from './solution-architect';
import { guardReply, GUARD_FALLBACK } from './guards';
import { groundingText } from '../knowledge/retriever';
import type { AIProvider, Turn } from '../ai/provider';
import { ModelError } from '../ai/provider';
import { HttpError } from '../http';
import type { Locale } from '../../shared/i18n';
import { resolveLocale } from '../../shared/i18n';

// T13 orchestrator: own each turn deterministically. Rules handle greetings, tours, audits and explicit
// navigation without a model call; only an open question reaches ONE bounded FAST call, grounded by the
// retriever (never the whole catalogue). Emits the closed v2 event set via `emit`.
export type Emit = (event: string, data: unknown) => void;

// Short, source-free localized lines for deterministic (non-model) paths. Facts still come from the corpus/model.
const LINES: Record<'greeting' | 'tour' | 'audit' | 'navigate', Record<Locale, string>> = {
  greeting: {
    bs: 'Pozdrav! Tu sam i spreman pomoći. Kako vam mogu pomoći danas?',
    en: 'Hello! I’m here and happy to help. What can I do for you today?',
    de: 'Hallo! Ich bin da und helfe gerne. Wie kann ich Ihnen heute helfen?',
  },
  tour: {
    bs: 'Rado! Provest ću vas kroz ponudu Digital X-a.',
    en: 'Gladly! I’ll walk you through what Digital X offers.',
    de: 'Gerne! Ich führe Sie durch das Angebot von Digital X.',
  },
  audit: {
    bs: 'Otvaram besplatnu analizu vaše stranice — unesite adresu.',
    en: 'Opening the free website analysis — enter your address.',
    de: 'Ich öffne die kostenlose Website-Analyse — geben Sie Ihre Adresse ein.',
  },
  navigate: {
    bs: 'Evo relevantnog dijela stranice.',
    en: 'Here’s the relevant part of the site.',
    de: 'Hier ist der passende Bereich der Seite.',
  },
};

function latestUserMessage(context: Context): string {
  return context.messages.filter(m => m.role === 'user').at(-1)?.content ?? '';
}
function localeOf(context: Context): Locale { return resolveLocale(context.locale) as Locale; }

// Deterministic tour narration: when the app reports a reached tour stop, narrate it from verified tour context.
function tourNarration(context: Context): string | null {
  if (!context.tourStep) return null;
  const stop = tourStops.find(s => s.id === context.tourStep);
  return stop ? stop.focus : null;
}

export type OrchestrateInput = {
  context: Context; sid: string; provider: AIProvider; signal: AbortSignal; degraded?: boolean;
  // P3d: the trusted server-resolved execution actor (null when the session is not an owner) and an optional explicit
  // action-card command. Both are assembled server-side in chat.ts; the orchestrator never derives authz itself.
  actor?: ExecutionActor | null;
  actionCommand?: 'confirm' | 'edit' | 'cancel';
};
export type OrchestrateResult = { reply: string; action: ChatV2Action | null; usedModel: boolean; memoryNote: string };

/** Run one deterministic turn. Emits v2 events and returns a summary for state/memory commit. */
export async function orchestrate(input: OrchestrateInput, emit: Emit): Promise<OrchestrateResult> {
  const { context } = input;
  const message = latestUserMessage(context);
  const locale = localeOf(context);

  // Tour narration is application state, not a new question: narrate the reached stop, no action, no model call.
  const narration = tourNarration(context);
  if (narration) {
    const grounded = groundingText(narration, { pageId: context.pageId });
    const reply = grounded ? `${narration}` : narration;
    emit('delta', { text: reply });
    emit('done', {});
    return { reply, action: null, usedModel: false, memoryNote: '' };
  }

  // P3d chat → action loop. This runs BEFORE ordinary intent classification so high-priority action control
  // (confirm/edit/cancel from the card, interrupt language, "did you save it?") and lead-intent collection are
  // handled deterministically by the single action flow — never improvised by the model. The flow returns
  // handled:false for a non-action turn, and we then fall through to the normal answer path. An explicit
  // actionCommand (a card button) is honoured even when the message is empty (a Confirm click sends no text).
  if (input.actionCommand || message) {
    const action = await handleActionTurn(
      { sid: input.sid, message, locale, actor: input.actor ?? null, command: input.actionCommand },
      emit,
    );
    if (action.handled) { emit('delta', { text: action.reply }); emit('done', {}); return { reply: action.reply, action: null, usedModel: false, memoryNote: action.memoryNote }; }
  }

  if (!message) throw new HttpError(400, 'Please enter a message.');

  const intent = classifyIntent(message);
  // Deterministic action intents: one line + one closed UI action, no model call.
  if (intent.kind === 'greeting') return finishDeterministic(emit, LINES.greeting[locale], null);
  if (intent.kind === 'tour') return finishDeterministic(emit, LINES.tour[locale], { type: 'start_tour' });
  if (intent.kind === 'audit') return finishDeterministic(emit, LINES.audit[locale], { type: 'open_audit' });
  if (intent.kind === 'navigate') {
    const section = sectionSchema.safeParse(intent.section).success ? intent.section : null;
    if (section) return finishDeterministic(emit, LINES.navigate[locale], { type: 'navigate_section', section });
  }

  // T20 Flow C: when the visitor states a business problem that deterministically maps to approved T19
  // capabilities, build ONE evidence-linked, bounded SolutionMap and present its card. This runs before the
  // generic FAST answer so a problem statement gets a grounded plan rather than free prose. Non-problem asks
  // (pricing, small talk, unmatched text) produce no candidates and fall through to the grounded model path.
  if (!input.degraded) {
    const candidates = selectCapabilities({ message });
    if (candidates.length > 0) {
      const map = await buildSolutionMap({ input: { message, goal: context.goal ?? null }, provider: input.provider, signal: input.signal, locale });
      const card = toSolutionCard(map);
      const reply = `${card.diagnosis}\n${card.nextAction}`.trim();
      emit('delta', { text: reply });
      emit('build_solution', card);
      emit('done', {});
      return { reply, action: null, usedModel: map.mode === 'REASONING', memoryNote: message.slice(0, 200) };
    }
  }

  // Open question → grounded FAST call. Retrieval bounds the prompt; nothing below threshold is sent as fact.
  const grounding = groundingText(message, { pageId: context.pageId });
  const pageLine = resolvePageContext({ pageId: context.pageId, section: context.section })?.line ?? '';
  const system = `${systemPrompt(context)}\n${pageLine}\n${grounding ? `Grounded facts (use only these; do not invent prices or claims):\n${grounding}` : 'No grounded facts were retrieved; answer generally and invite a specific question. Do not invent prices, numbers or claims.'}`;
  const contents: Turn[] = context.messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', text: m.content }));

  // Degraded mode (budget exhausted): skip the model, return grounded snippet or a safe fallback.
  if (input.degraded) {
    const reply = grounding ? grounding.replace(/^\[[^\]]+\]\s?/gm, '') : LINES.greeting[locale];
    return finishDeterministic(emit, reply.split('\n')[0], null);
  }

  let output;
  try {
    const result = await input.provider.generateObject({ route: 'respond', system, contents, schema: respondSchema, signal: input.signal });
    output = result.value;
  } catch (error) {
    if (error instanceof ModelError) throw new HttpError(error.modelCode === 'provider_busy' ? 429 : 502, error.modelCode === 'provider_busy' ? 'The concierge is busy right now. Please try again shortly.' : 'The AI connection could not respond. Please try again.');
    throw error;
  }
  // T14: guard the model reply before it reaches the visitor. Unsupported numbers/prices, provider disclosure and
  // false action claims are dropped; a safe fallback covers a fully-removed reply.
  const guarded = guardReply(output.reply, { grounding });
  const safeReply = guarded.text || GUARD_FALLBACK[locale === 'en' || locale === 'de' ? locale : 'bs'];
  emit('delta', { text: safeReply });
  let action: ChatV2Action | null = null;
  if (output.recommend) { action = { type: 'recommend', section: output.recommend, reason: safeReply.slice(0, 200) }; emit('action', action); }
  emit('done', {});
  return { reply: safeReply, action, usedModel: true, memoryNote: message.slice(0, 200) };
}

function finishDeterministic(emit: Emit, reply: string, action: ChatV2Action | null): OrchestrateResult {
  emit('delta', { text: reply });
  if (action) emit('action', action);
  emit('done', {});
  return { reply, action, usedModel: false, memoryNote: '' };
}