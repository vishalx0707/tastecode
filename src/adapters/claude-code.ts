import { join } from "node:path";
import { upsertFenced, type UpsertResult } from "../lib/fence.js";
import { POINTER_BLOCK } from "../templates/pointer.js";
import { existsSync } from "node:fs";

export const claudeCode = {
  id: "claude-code",
  label: "Claude Code",
  files: ["CLAUDE.md"],
  fenced: true,
  detect(cwd: string): boolean {
    return existsSync(join(cwd, "CLAUDE.md")) || existsSync(join(cwd, ".claude"));
  },
  async install(cwd: string): Promise<{ file: string; result: UpsertResult }[]> {
    const file = join(cwd, "CLAUDE.md");
    const result = await upsertFenced(file, POINTER_BLOCK);
    return [{ file, result }];
  },
};
