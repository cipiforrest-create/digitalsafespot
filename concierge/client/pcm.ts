/** Decode only the mono, little-endian PCM16 format requested from the voice service. */
export function decodePcm(bytes: Uint8Array, mime: string): { samples: Float32Array; rate: number } {
  const match = /^audio\/pcm(?:;\s*rate=(\d+))?$/.exec(mime);
  const rate = Number(match?.[1] || 24000);
  if (!match || ![16000,22050,24000,44100,48000].includes(rate) || !bytes.length || bytes.length % 2 || bytes.length > 2_000_000) throw new Error('Invalid audio frame');
  const view = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const samples = new Float32Array(bytes.length/2);
  for(let i=0;i<samples.length;i++) samples[i]=view.getInt16(i*2,true)/32768;
  return {samples,rate};
}
