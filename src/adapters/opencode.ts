import { join } from "node:path";
import { existsSync } from "node:fs";
import { upsertFenced, type UpsertResult } from "../lib/fence.js";
import { POINTER_BLOCK } from "../templates/pointer.js";

export const opencode = {
  id: "opencode",
  label: "OpenCode",
  files: ["AGENTS.md"],
  fenced: true,
  detect(cwd: string): boolean {
    return existsSync(join(cwd, "AGENTS.md")) || existsSync(join(cwd, ".opencode"));
  },
  async install(cwd: string): Promise<{ file: string; result: UpsertResult }[]> {
    const file = join(cwd, "AGENTS.md");
    const result = await upsertFenced(file, POINTER_BLOCK);
    return [{ file, result }];
  },
};
