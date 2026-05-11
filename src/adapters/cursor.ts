import { join } from "node:path";
import { existsSync } from "node:fs";
import { writeNew, type UpsertResult } from "../lib/fence.js";
import { POINTER_BLOCK } from "../templates/pointer.js";

const MDC = `---
description: TasteCode taste layer. Always apply.
alwaysApply: true
---

${POINTER_BLOCK}`;

export const cursor = {
  id: "cursor",
  label: "Cursor",
  files: [".cursor/rules/tastecode.mdc"],
  fenced: false,
  detect(cwd: string): boolean {
    return existsSync(join(cwd, ".cursor"));
  },
  async install(cwd: string): Promise<{ file: string; result: UpsertResult }[]> {
    const file = join(cwd, ".cursor", "rules", "tastecode.mdc");
    const result = await writeNew(file, MDC);
    return [{ file, result }];
  },
};
