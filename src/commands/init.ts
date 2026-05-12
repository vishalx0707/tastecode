import { join } from "node:path";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { DEFAULT_TASTECODE_MD } from "../templates/default-tastecode.js";

interface InitOptions {
  cwd: string;
  force: boolean;
}

export async function runInit(opts: InitOptions): Promise<number> {
  const file = join(opts.cwd, "tastecode.md");

  if (existsSync(file) && !opts.force) {
    console.log("tastecode.md already exists. Pass --force to overwrite.");
    return 0;
  }

  await writeFile(file, DEFAULT_TASTECODE_MD, "utf8");
  const verb = opts.force && existsSync(file) ? "Overwrote" : "Created";
  console.log(`${verb} tastecode.md`);
  console.log("");
  console.log("Edit this file to match your coding taste, then run:");
  console.log('  tastecode use claude "your task"');
  return 0;
}
