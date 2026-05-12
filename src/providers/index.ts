import type { Provider, ProviderSpec } from "./types.js";
import { fromSpec } from "./runtime.js";
import { CLAUDE_SPEC } from "./claude.js";
import { loadConfig } from "../core/config.js";

const BUILTINS: Record<string, ProviderSpec> = {
  claude: CLAUDE_SPEC,
};

export async function listProviders(cwd: string): Promise<Provider[]> {
  const config = await loadConfig(cwd);
  const merged: { name: string; spec: ProviderSpec; source: "builtin" | "config" }[] = [];

  for (const [name, spec] of Object.entries(BUILTINS)) {
    const override = config.providers?.[name];
    merged.push({ name, spec: override ?? spec, source: override ? "config" : "builtin" });
  }
  for (const [name, spec] of Object.entries(config.providers ?? {})) {
    if (name in BUILTINS) continue;
    merged.push({ name, spec, source: "config" });
  }

  return merged.map((m) => fromSpec(m.name, m.spec, m.source));
}

export async function getProvider(cwd: string, name: string): Promise<Provider | undefined> {
  const all = await listProviders(cwd);
  return all.find((p) => p.name === name);
}
