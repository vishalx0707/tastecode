import { join } from "node:path";
import { existsSync, statSync } from "node:fs";
import { writeNew, type UpsertResult } from "../lib/fence.js";
import { POINTER_BLOCK } from "../templates/pointer.js";

export const cline = {
  id: "cline",
  label: "Cline",
  files: [".clinerules/tastecode.md"],
  fenced: false,
  detect(cwd: string): boolean {
    const p = join(cwd, ".clinerules");
    if (!existsSync(p)) return false;
    try {
      return statSync(p).isDirectory();
    } catch {
      return false;
    }
  },
  async install(cwd: string): Promise<{ file: string; result: UpsertResult }[]> {
    const file = join(cwd, ".clinerules", "tastecode.md");
    const result = await writeNew(file, POINTER_BLOCK);
    return [{ file, result }];
  },
};
