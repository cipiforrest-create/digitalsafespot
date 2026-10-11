// Derived from Jarvis voiceState.ts: transport events own the visible state.
export type VoiceState = 'idle' | 'connecting' | 'recovering' | 'listening' | 'thinking' | 'speaking' | 'muted' | 'error';
export const voiceLabels: Record<VoiceState, string> = { idle: 'Spreman za razgovor', connecting: 'Povezivanje…', recovering: 'Veza se oporavlja…', listening: 'Slušam…', thinking: 'Razmišljam…', speaking: 'Govorim…', muted: 'Mikrofon isključen', error: 'Pokušajte ponovo ili pišite' };
export function voiceLabel(state:VoiceState):string{
 const lang=document.documentElement.lang;
 const en:Record<VoiceState,string>={idle:'Ready to talk',connecting:'Connecting…',recovering:'Reconnecting…',listening:'Listening…',thinking:'Thinking…',speaking:'Speaking…',muted:'Microphone off',error:'Try again or type'};
 const de:Record<VoiceState,string>={idle:'Bereit für ein Gespräch',connecting:'Verbindung wird hergestellt…',recovering:'Verbindung wird wiederhergestellt…',listening:'Ich höre zu…',thinking:'Ich denke nach…',speaking:'Ich spreche…',muted:'Mikrofon aus',error:'Erneut versuchen oder schreiben'};
 return lang==='en'?en[state]:lang==='de'?de[state]:voiceLabels[state];
}
export function rms(samples: Float32Array): number { let sum = 0; for (const sample of samples) sum += sample * sample; return Math.sqrt(sum / Math.max(1, samples.length)); }
