import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname } from "node:path";

export const FENCE_START = "<!-- tastecode:start -->";
export const FENCE_END = "<!-- tastecode:end -->";

export type UpsertResult = "created" | "inserted" | "updated" | "unchanged";

export async function upsertFenced(
  filePath: string,
  block: string,
): Promise<UpsertResult> {
  const fenced = `${FENCE_START}\n${block.trim()}\n${FENCE_END}\n`;
  await mkdir(dirname(filePath), { recursive: true });

  if (!existsSync(filePath)) {
    await writeFile(filePath, fenced, "utf8");
    return "created";
  }

  const current = await readFile(filePath, "utf8");
  const startIdx = current.indexOf(FENCE_START);
  const endIdx = current.indexOf(FENCE_END);

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    const separator = current.endsWith("\n") ? "\n" : "\n\n";
    const next = current + separator + fenced;
    await writeFile(filePath, next, "utf8");
    return "inserted";
  }

  const before = current.slice(0, startIdx);
  const after = current.slice(endIdx + FENCE_END.length);
  const next = `${before}${fenced.trimEnd()}${after}`;

  if (next === current) return "unchanged";
  await writeFile(filePath, next, "utf8");
  return "updated";
}

export async function writeNew(
  filePath: string,
  content: string,
): Promise<UpsertResult> {
  await mkdir(dirname(filePath), { recursive: true });
  if (existsSync(filePath)) {
    const current = await readFile(filePath, "utf8");
    if (current === content) return "unchanged";
    await writeFile(filePath, content, "utf8");
    return "updated";
  }
  await writeFile(filePath, content, "utf8");
  return "created";
}
