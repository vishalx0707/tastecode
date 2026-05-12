import { join } from "node:path";
import { existsSync } from "node:fs";
import { ADAPTERS, detect, type Adapter } from "../adapters/index.js";
import { writeNew } from "../lib/fence.js";
import { DEFAULT_TASTECODE_MD } from "../templates/default-tastecode.js";
import { confirm, multiSelect } from "../lib/prompts.js";

interface InstallOptions {
  yes: boolean;
  all: boolean;
  cwd: string;
}

export async function runInstall(opts: InstallOptions): Promise<number> {
  const { yes, all, cwd } = opts;

  const tasteFile = join(cwd, "tastecode.md");
  const tasteExists = existsSync(tasteFile);

  let targets: Adapter[];
  if (all) {
    targets = ADAPTERS;
  } else {
    const detected = detect(cwd);
    if (yes) {
      targets = detected.length > 0 ? detected : ADAPTERS;
    } else {
      console.log("");
      console.log("Install TasteCode pointer files");
      console.log("-------------------------------");
      console.log(`Project: ${cwd}`);
      console.log(
        detected.length > 0
          ? `Detected: ${detected.map((a) => a.label).join(", ")}`
          : "No agents detected. Choose which to wire up below.",
      );
      console.log("");

      const choices = ADAPTERS.map((a) => ({
        value: a.id,
        label: `${a.label}  (${a.files.join(", ")})`,
        selected: detected.includes(a) || detected.length === 0,
      }));
      const picked = await multiSelect("Pick agents to install pointers for:", choices);
      targets = ADAPTERS.filter((a) => picked.includes(a.id));
    }
  }

  if (targets.length === 0) {
    console.log("No agents selected. Nothing to do.");
    return 0;
  }

  const plan: string[] = [];
  if (!tasteExists) plan.push(`  create  tastecode.md`);
  else plan.push(`  keep    tastecode.md`);
  for (const t of targets) {
    for (const f of t.files) plan.push(`  write   ${f}  (${t.label})`);
  }

  if (!yes) {
    console.log("");
    console.log("Will write:");
    for (const line of plan) console.log(line);
    console.log("");
    const ok = await confirm("Proceed?", true);
    if (!ok) {
      console.log("Aborted.");
      return 0;
    }
  }

  if (!tasteExists) {
    const r = await writeNew(tasteFile, DEFAULT_TASTECODE_MD);
    console.log(`  ${r.padEnd(8)} tastecode.md`);
  } else {
    console.log(`  kept     tastecode.md`);
  }

  for (const t of targets) {
    const results = await t.install(cwd);
    for (const r of results) {
      const rel = r.file.startsWith(cwd) ? r.file.slice(cwd.length + 1) : r.file;
      console.log(`  ${r.result.padEnd(8)} ${rel}  (${t.label})`);
    }
  }

  console.log("");
  console.log("Done. Your AI coding agents will now read tastecode.md on their own.");
  console.log('Or run: tastecode use claude "<task>" to wrap a single call.');
  return 0;
}
