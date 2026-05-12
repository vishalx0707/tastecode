import type { Provider } from "./types.js";
import { claude } from "./claude.js";
import { codex } from "./codex.js";
import { opencode } from "./opencode.js";

export const PROVIDERS: Provider[] = [claude, codex, opencode];

export function getProvider(name: string): Provider | undefined {
  return PROVIDERS.find((p) => p.name === name);
}
