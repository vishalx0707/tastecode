import { join } from "node:path";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { ADAPTERS } from "../adapters/index.js";
import { FENCE_START, FENCE_END } from "../lib/fence.js";
import { listProviders } from "../providers/index.js";
import { feedbackStatus, getFeedbackPath } from "../core/feedback.js";

export async function runDoctor(cwd: string): Promise<number> {
  console.log("");
  console.log("TasteCode doctor");
  console.log("----------------");
  console.log(`Project: ${cwd}`);
  console.log("");

  const tasteFile = join(cwd, "tastecode.md");
  console.log(`tastecode.md            ${existsSync(tasteFile) ? "found" : "MISSING"}`);
  console.log("");
  console.log("Providers (local CLIs):");
  const providers = await listProviders(cwd);
  for (const p of providers) {
    const ok = await p.installed();
    console.log(
      `  ${p.name.padEnd(10)} ${p.source.padEnd(8)} ${ok ? "available" : "not installed"}`,
    );
  }
  console.log("");
  console.log("Agent pointer files (from `tastecode install`):");

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
      console.log(`  ${a.label.padEnd(12)} ${f.padEnd(28)} ${status}`);
    }
  }
  console.log("");
  console.log("Feedback log:");
  const fb = await feedbackStatus(cwd);
  const fbPath = getFeedbackPath(cwd).replace(cwd + "\\", "").replace(cwd + "/", "");
  if (!fb.exists) {
    console.log(`  ${fbPath.padEnd(28)} not yet created`);
  } else {
    console.log(
      `  ${fbPath.padEnd(28)} ${fb.total} entries (${fb.promoted} promoted, ${fb.pending} pending)`,
    );
  }
  console.log("");
  return 0;
}
