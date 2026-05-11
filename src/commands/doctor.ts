import { join } from "node:path";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { ADAPTERS } from "../adapters/index.js";
import { FENCE_START, FENCE_END } from "../lib/fence.js";

export async function runDoctor(cwd: string): Promise<void> {
  console.log("");
  console.log("TasteCode plugin doctor");
  console.log("-----------------------");
  console.log(`Project: ${cwd}`);
  console.log("");

  const tasteFile = join(cwd, "tastecode.md");
  console.log(`tastecode.md            ${existsSync(tasteFile) ? "found" : "MISSING"}`);
  console.log("");

  for (const a of ADAPTERS) {
    for (const f of a.files) {
      const full = join(cwd, f);
      let status: string;
      if (!existsSync(full)) {
        status = "not installed";
      } else {
        const content = await readFile(full, "utf8").catch(() => "");
        const hasFence =
          content.includes(FENCE_START) && content.includes(FENCE_END);
        const hasPointer = content.includes("TasteCode");
        if (a.fenced) {
          status = hasFence
            ? "installed"
            : hasPointer
              ? "present (no fence)"
              : "exists, no tastecode block";
        } else {
          status = hasPointer ? "installed" : "exists, no tastecode block";
        }
      }
      console.log(`${a.label.padEnd(14)} ${f.padEnd(28)} ${status}`);
    }
  }
  console.log("");
}
