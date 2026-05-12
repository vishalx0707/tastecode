import { join } from "node:path";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

export interface ProviderSpec {
  command: string;
  args?: string[];
  stdin?: boolean;
}

export interface TastecodeConfig {
  providers?: Record<string, ProviderSpec>;
}

const CONFIG_FILES = ["tastecode.config.json", ".tastecode/config.json"];

export async function loadConfig(cwd: string): Promise<TastecodeConfig> {
  for (const rel of CONFIG_FILES) {
    const full = join(cwd, rel);
    if (!existsSync(full)) continue;
    const raw = await readFile(full, "utf8");
    try {
      const parsed = JSON.parse(raw);
      return validate(parsed, full);
    } catch (err) {
      throw new Error(
        `Failed to parse ${full}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  return {};
}

function validate(input: unknown, path: string): TastecodeConfig {
  if (input === null || typeof input !== "object") {
    throw new Error(`${path}: top-level must be an object`);
  }
  const obj = input as Record<string, unknown>;
  if (obj.providers === undefined) return {};
  if (typeof obj.providers !== "object" || obj.providers === null) {
    throw new Error(`${path}: "providers" must be an object`);
  }
  const providers: Record<string, ProviderSpec> = {};
  for (const [name, raw] of Object.entries(obj.providers as Record<string, unknown>)) {
    if (typeof raw !== "object" || raw === null) {
      throw new Error(`${path}: providers.${name} must be an object`);
    }
    const spec = raw as Record<string, unknown>;
    if (typeof spec.command !== "string" || !spec.command) {
      throw new Error(`${path}: providers.${name}.command must be a non-empty string`);
    }
    const args =
      spec.args === undefined
        ? undefined
        : Array.isArray(spec.args) && spec.args.every((a) => typeof a === "string")
          ? (spec.args as string[])
          : (() => {
              throw new Error(`${path}: providers.${name}.args must be an array of strings`);
            })();
    if (spec.stdin !== undefined && typeof spec.stdin !== "boolean") {
      throw new Error(`${path}: providers.${name}.stdin must be a boolean`);
    }
    providers[name] = {
      command: spec.command,
      ...(args !== undefined ? { args } : {}),
      ...(spec.stdin !== undefined ? { stdin: spec.stdin } : {}),
    };
  }
  return { providers };
}
