import { validateTool, type Context, type ToolCall, type ToolResult } from '../shared/contracts';
import type { VoiceState } from './voice-state';
import { InputFlow } from './input-flow';
import { decodePcm } from './pcm';
import { publicError } from '../shared/public-error';
type Events = { state: (state: VoiceState) => void; error: (message: string) => void; notice: (message: string) => void; interrupted?:()=>void; transcript: (role: 'user' | 'assistant', text: string, done?: boolean) => void; tool: (call: ToolCall) => Promise<ToolResult>; analysers: (input: AnalyserNode | null, output: AnalyserNode | null) => void };
type ServerEvent = {
  setupComplete?: object; error?: unknown; goAway?: object;
  serverContent?: { interrupted?: boolean; turnComplete?: boolean; inputTranscription?: { text: string }; outputTranscription?: { text: string }; modelTurn?: { parts?: { inlineData?: { data: string; mimeType: string } }[] } };
  toolCall?: { functionCalls: { id: string; name: string; args: Record<string, unknown> }[] };
  toolCallCancellation?: { ids: string[] };
};
export class VoiceSession {
  private socket: WebSocket | null = null; private media: MediaStream | null = null; private audio: AudioContext | null = null;
  private worklet: AudioWorkletNode | null = null; private input: MediaStreamAudioSourceNode | null = null; private output: AnalyserNode | null = null;
  private sources = new Set<AudioBufferSourceNode>(); private nextPlay = 0; private muted = false; private ending = false; private timeout: ReturnType<typeof setTimeout> | undefined;
  private generation = 0; private calls = 0; private cancelled = new Set<string>(); private pendingTasks: ReturnType<typeof setTimeout>[] = [];
  private flow = new InputFlow();
  private ready = false;
  private gains = new Map<AudioBufferSourceNode, GainNode>();
  constructor(private events: Events) {}
  private emitState(state: VoiceState) { this.events.state(this.flow.paused && !this.muted && !['idle','error','connecting'].includes(state) ? 'recovering' : state); }
  get active() { return Boolean(this.socket && this.socket.readyState <= WebSocket.OPEN); }
  get connected() { return this.ready && this.socket?.readyState === WebSocket.OPEN; }
  async start(context: Context) {
    this.stop(); this.ending = false; const run = ++this.generation; this.emitState('connecting');
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.AudioWorkletNode) throw new Error('This browser cannot start voice. Text mode is ready.');
      const media = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
      if (run !== this.generation) { media.getTracks().forEach(t => t.stop()); return; } this.media = media;
      this.audio = new AudioContext(); await this.audio.resume();
      const response = await fetch('/api/concierge/session', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'voice', context }), signal: AbortSignal.timeout(20000) });
      const token = await response.json() as { token?: string; model?: string; expiresAt?: number; message?: string };
      if (!response.ok || !token.token || !token.model) throw new Error(token.message || 'Voice could not connect. Please try text mode.');
      if (run !== this.generation) return;
      await this.audio.audioWorklet.addModule('/ai-concierge-preview/pcm-worklet.js');
      if (run !== this.generation || !this.audio) return;
      this.input = this.audio.createMediaStreamSource(media); const analyser = this.audio.createAnalyser(); analyser.fftSize = 512;
      this.output = this.audio.createAnalyser(); this.output.fftSize = 512; this.output.connect(this.audio.destination);
      this.input.connect(analyser); this.worklet = new AudioWorkletNode(this.audio, 'concierge-pcm');
      const silent = this.audio.createGain(); silent.gain.value = 0; this.input.connect(this.worklet); this.worklet.connect(silent); silent.connect(this.audio.destination);
      this.events.analysers(analyser, this.output);
      const socket = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token.token)}`);
      this.socket = socket; this.calls = 0; this.cancelled.clear();
      let ready = false; const connectTimer = setTimeout(() => { if (!ready && run === this.generation) this.failure('Voice connection timed out. Text mode is ready.'); }, 15000); this.pendingTasks.push(connectTimer);
      socket.onopen = () => { if (run === this.generation) socket.send(JSON.stringify({ setup: { model: `models/${token.model}` } })); };
      this.worklet.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        if (!ready || run !== this.generation || socket.readyState !== WebSocket.OPEN) return;
        const wasPaused = this.flow.paused;
        const action = this.flow.next(socket.bufferedAmount, performance.now());
        if (action === 'timeout') { this.failure('The connection has not recovered. Reconnect voice or continue in text. Your transcript is still here.'); return; }
        if (action === 'pause') { if (!wasPaused) this.emitState('recovering'); return; }
        if (action === 'resume') {
          socket.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
          this.emitState(this.muted ? 'muted' : this.sources.size ? 'speaking' : 'listening');
          this.events.notice('Veza je obnovljena. Ponovite riječi izgovorene tokom prekida.');
        }
        if (this.muted) return;
        const bytes = new Uint8Array(event.data); let raw = ''; for (const byte of bytes) raw += String.fromCharCode(byte);
        socket.send(JSON.stringify({ realtimeInput: { audio: { data: btoa(raw), mimeType: 'audio/pcm;rate=16000' } } }));
      };
      let chain = Promise.resolve();
      socket.onmessage = event => {
        chain = chain.then(async () => {
          if (run !== this.generation) return;
          const data = JSON.parse(typeof event.data === 'string' ? event.data : await (event.data as Blob).text()) as ServerEvent;
          if (data.setupComplete) {
            clearTimeout(connectTimer); ready = true; this.ready = true;
            socket.send(JSON.stringify({ clientContent: { turns: context.messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })), turnComplete: true } }));
            this.emitState('listening');
          }
          if (data.error) { this.failure('Voice encountered a connection problem. Please continue in text.'); return; }
          if (data.goAway) { this.failure('This voice session is ending. Select Use voice to reconnect with your conversation.'); return; }
          for (const id of data.toolCallCancellation?.ids || []) this.cancelled.add(id);
          const content = data.serverContent;
          if (content?.interrupted) { this.clearPlayback(); this.events.transcript('assistant', '', true); this.emitState(this.muted ? 'muted' : 'listening'); this.events.interrupted?.(); }
          if (content?.inputTranscription?.text) { this.events.transcript('user', content.inputTranscription.text); if (!this.sources.size) this.emitState('thinking'); }
          if (content?.outputTranscription?.text) { this.events.transcript('user', '', true); this.events.transcript('assistant', content.outputTranscription.text); }
          for (const part of content?.modelTurn?.parts || []) if (part.inlineData?.data) this.play(part.inlineData.data, part.inlineData.mimeType);
          if (data.toolCall) {
            for (const raw of data.toolCall.functionCalls) {
              if (this.cancelled.has(raw.id)) continue;
              let result: ToolResult; let call: ToolCall | undefined;
              try { if (++this.calls > 30) throw new Error('limit'); call = validateTool(raw); result = await this.events.tool(call); }
              catch { result = { id: raw.id, status: 'rejected', detail: 'This action is not available.' }; }
              if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: raw.id, name: raw.name, response: result }] } }));
              // Give the acknowledgement a chance to leave before closing the connection.
              if (call && ['end_voice_session','start_text_mode'].includes(call.name)) { const task = setTimeout(() => this.stop(), 50); this.pendingTasks.push(task); }
            }
          }
          if (content?.turnComplete) { this.events.transcript('user', '', true); this.events.transcript('assistant', '', true); if (!this.sources.size) this.emitState(this.muted ? 'muted' : 'listening'); }
        }).catch(() => this.failure('Voice was interrupted. Please reconnect or use text.'));
      };
      socket.onerror = () => { if (run === this.generation) this.failure('Voice could not connect. Please continue in text.'); };
      socket.onclose = () => { if (!this.ending && run === this.generation) this.failure('Voice disconnected. Your transcript is still here.'); };
      this.timeout = setTimeout(() => this.failure('The voice session ended. Select Use voice to continue.'), Math.max(1000, (token.expiresAt || Date.now() + 600000) - Date.now() - 1000));
    } catch (error) {
      if (run !== this.generation) return;
      const denied = error instanceof DOMException && ['NotAllowedError','PermissionDeniedError'].includes(error.name);
      this.failure(denied ? 'Microphone access was not granted. You can type your message below.' : error instanceof Error ? error.message : 'Voice is unavailable. Text mode is ready.');
    }
  }
  sendText(text: string): boolean { if (!this.connected || !this.socket) return false; this.socket.send(JSON.stringify({ realtimeInput: { text } })); this.emitState('thinking'); return true; }
  setMuted(muted: boolean) { this.muted = muted; this.media?.getAudioTracks().forEach(track => track.enabled = !muted); if (muted && this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } })); this.emitState(muted ? 'muted' : 'listening'); }
  private play(base64: string, mime: string) {
    if (!this.audio || !this.output) return;
    const raw = atob(base64); const bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
    const {samples,rate} = decodePcm(bytes,mime);
    const buffer = this.audio.createBuffer(1, samples.length, rate); buffer.getChannelData(0).set(samples);
    const source = this.audio.createBufferSource(); source.buffer = buffer;
    const gain = this.audio.createGain(); source.connect(gain); gain.connect(this.output); this.gains.set(source,gain);
    const restarting = this.nextPlay < this.audio.currentTime + 0.005;
    const at = restarting ? this.audio.currentTime + 0.08 : this.nextPlay; this.nextPlay = at + buffer.duration;
    if(restarting){gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(1,at+0.005);}
    if (this.nextPlay - this.audio.currentTime > 60) { this.failure('The spoken reply was too long. Please continue in text.'); return; }
    this.sources.add(source); this.emitState('speaking'); source.start(at);
    source.onended = () => { this.sources.delete(source); this.gains.delete(source); source.disconnect(); gain.disconnect(); if (!this.sources.size && !this.ending) this.emitState(this.muted ? 'muted' : 'listening'); };
  }
  private clearPlayback() { for (const source of this.sources) { const gain=this.gains.get(source);const now=this.audio?.currentTime||0;source.onended=()=>{source.disconnect();gain?.disconnect();};try { if(!this.ending&&gain){gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(gain.gain.value,now);gain.gain.linearRampToValueAtTime(0,now+0.008);source.stop(now+0.009);}else{source.stop();source.disconnect();gain?.disconnect();} } catch { source.disconnect();gain?.disconnect(); } } this.gains.clear();this.sources.clear(); this.nextPlay = 0; }
  private failure(message: string) { this.stop(); this.emitState('error'); this.events.error(publicError(message)); }
  stop() {
    this.ending = true; this.ready = false; this.generation++; clearTimeout(this.timeout); this.pendingTasks.forEach(clearTimeout); this.pendingTasks = [];
    if (this.socket) { this.socket.onclose = null; this.socket.onerror = null; this.socket.onmessage = null; this.socket.close(); this.socket = null; }
    this.clearPlayback(); this.worklet?.disconnect(); if (this.worklet) this.worklet.port.onmessage = null; this.worklet = null;
    this.input?.disconnect(); this.input = null; this.output?.disconnect(); this.output = null; this.flow = new InputFlow();
    this.media?.getTracks().forEach(t => t.stop()); this.media = null;
    if (this.audio) void this.audio.close().catch(() => undefined); this.audio = null; this.muted = false;
    this.events.analysers(null,null); this.emitState('idle');
  }
}
