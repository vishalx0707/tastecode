import type { UpsertResult } from "../lib/fence.js";
import { claudeCode } from "./claude-code.js";
import { cursor } from "./cursor.js";
import { cline } from "./cline.js";
import { codex } from "./codex.js";
import { opencode } from "./opencode.js";
import { aider } from "./aider.js";

export interface Adapter {
  id: string;
  label: string;
  files: string[];
  fenced: boolean;
  detect(cwd: string): boolean;
  install(cwd: string): Promise<{ file: string; result: UpsertResult }[]>;
}

export const ADAPTERS: Adapter[] = [claudeCode, cursor, cline, codex, opencode, aider];

export function detect(cwd: string): Adapter[] {
  return ADAPTERS.filter((a) => a.detect(cwd));
}

export function byId(id: string): Adapter | undefined {
  return ADAPTERS.find((a) => a.id === id);
}
