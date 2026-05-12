import { join } from "node:path";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

const CANDIDATES = ["tastecode.md", ".tastecode/taste.md", ".tastecode/taste.json"];

export interface FoundTaste {
  path: string;
  content: string;
}

export function findTasteFile(cwd: string): string | null {
  for (const rel of CANDIDATES) {
    const full = join(cwd, rel);
    if (existsSync(full)) return full;
  }
  return null;
}

export async function readTasteFile(cwd: string): Promise<FoundTaste | null> {
  const path = findTasteFile(cwd);
  if (!path) return null;
  const content = await readFile(path, "utf8");
  return { path, content };
}

const SECRET_PATTERNS = [
  /\b(SECRET|API[_-]?KEY|ACCESS[_-]?TOKEN|PRIVATE[_-]?KEY|PASSWORD)\b\s*[:=]/i,
];

export function looksLikeSecrets(text: string): boolean {
  return SECRET_PATTERNS.some((re) => re.test(text));
}
