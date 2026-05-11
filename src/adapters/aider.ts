import { join } from "node:path";
import { existsSync } from "node:fs";
import { upsertFenced, type UpsertResult } from "../lib/fence.js";
import { POINTER_BLOCK } from "../templates/pointer.js";

export const aider = {
  id: "aider",
  label: "Aider",
  files: ["CONVENTIONS.md"],
  fenced: true,
  detect(cwd: string): boolean {
    return (
      existsSync(join(cwd, "CONVENTIONS.md")) ||
      existsSync(join(cwd, ".aider.conf.yml")) ||
      existsSync(join(cwd, ".aider.input.history"))
    );
  },
  async install(cwd: string): Promise<{ file: string; result: UpsertResult }[]> {
    const file = join(cwd, "CONVENTIONS.md");
    const result = await upsertFenced(file, POINTER_BLOCK);
    return [{ file, result }];
  },
};
