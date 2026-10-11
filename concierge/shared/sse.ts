// Recovered from Jarvis sseParsing.ts; now handles split CRLF and multi-line data safely.
export async function readSse(body: ReadableStream<Uint8Array>, onEvent: (name: string, data: unknown) => void | Promise<void>): Promise<void> {
  const reader = body.getReader(); const decoder = new TextDecoder(); let buffer = '';
  async function frame(text: string) {
    const lines = text.split(/\r?\n/); const name = lines.find(l => l.startsWith('event:'))?.slice(6).trim() || 'message';
    const data = lines.filter(l => l.startsWith('data:')).map(l => l.slice(5).trimStart()).join('\n');
    if (!data || data === '[DONE]') return;
    await onEvent(name, JSON.parse(data));
  }
  try {
    while (true) {
      const { done, value } = await reader.read(); buffer += value ? decoder.decode(value, { stream: true }) : decoder.decode();
      if (buffer.length > 1_000_000) throw new Error('Stream frame too large');
      let match: RegExpExecArray | null;
      while ((match = /\r?\n\r?\n/.exec(buffer))) { const part = buffer.slice(0, match.index); buffer = buffer.slice(match.index + match[0].length); await frame(part); }
      if (done) { if (buffer.trim()) await frame(buffer); break; }
    }
  } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
}
