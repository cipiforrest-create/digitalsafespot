import type { AIProvider } from './provider';
import { GeminiProvider } from './gemini-provider';
// A single lazily-created provider instance. A test hook can substitute a FakeProvider without env or network.
let override: AIProvider | null = null;
let cached: AIProvider | null = null;
export function getProvider(): AIProvider { return override ?? (cached ??= new GeminiProvider()); }
export function setProvider(provider: AIProvider | null): void { override = provider; }