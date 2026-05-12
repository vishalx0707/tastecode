import { join } from "node:path";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

export const LEARNED_HEADING = "## Learned Rules";

const LEARNED_SECTION_BODY = `${LEARNED_HEADING}

<!--
  TasteCode appends rules here when you run \`tastecode reject "..."\` or
  \`tastecode accept "..."\` and confirm the promotion prompt. Plain
  markdown — no hidden state. Edit or delete entries freely.
-->
`;

export function isReusableReason(text: string): boolean {
  const r = text.trim();
  if (r.length < 5 || r.length > 120) return false;
  if (/[/\\]/.test(r)) return false;
  if (/\.[a-zA-Z]{1,4}\b/.test(r)) return false;
  if (/\w+\([^)]*\)/.test(r)) return false;
  if (
    /\b(get|set|is|has|create|find|update|delete|fetch|render|handle|on|with)[A-Z]\w+/.test(
      r,
    )
  ) {
    return false;
  }
  if (/\b[a-z]+_[a-z]+_[a-z]+\b/i.test(r)) return false;
  if (/`/.test(r)) return false;
  return true;
}

export interface PromotionResult {
  next: string;
  sectionPreview: string;
  addedBullets: string[];
}

export function appendLearnedRules(
  currentMd: string,
  rules: string[],
): PromotionResult {
  const bullets = rules.map((r) => `- ${r.trim()}`);
  let next = currentMd;
  const headIdx = next.indexOf(LEARNED_HEADING);

  if (headIdx === -1) {
    const sep = next.endsWith("\n") ? "" : "\n";
    next = `${next}${sep}\n${LEARNED_SECTION_BODY}\n${bullets.join("\n")}\n`;
  } else {
    const afterHead = headIdx + LEARNED_HEADING.length;
    const nextSectionRel = next.slice(afterHead).search(/\n## /);
    const sectionEnd =
      nextSectionRel === -1 ? next.length : afterHead + nextSectionRel + 1;
    const before = next.slice(0, sectionEnd).replace(/\s+$/, "");
    const after = next.slice(sectionEnd).replace(/^\s+/, "");
    next = `${before}\n${bullets.join("\n")}\n${after ? "\n" + after : ""}`;
  }

  return {
    next,
    sectionPreview: previewLearnedSection(next, bullets),
    addedBullets: bullets,
  };
}

function previewLearnedSection(md: string, addedBullets: string[]): string {
  const lines = md.split(/\r?\n/);
  const headIdx = lines.findIndex((l) => l === LEARNED_HEADING);
  if (headIdx === -1) return addedBullets.map((b) => `+ ${b}`).join("\n");

  let endIdx = lines.length;
  for (let i = headIdx + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      endIdx = i;
      break;
    }
  }
  const added = new Set(addedBullets);
  const out: string[] = [];
  for (let i = headIdx; i < endIdx; i++) {
    const prefix = added.has(lines[i]) ? "+ " : "  ";
    out.push(prefix + lines[i]);
  }
  while (out.length > 1 && out[out.length - 1].trim() === "") out.pop();
  return out.join("\n");
}

export async function readTastecodeMd(cwd: string): Promise<string | null> {
  const file = join(cwd, "tastecode.md");
  if (!existsSync(file)) return null;
  return readFile(file, "utf8");
}

export async function writeTastecodeMd(
  cwd: string,
  content: string,
): Promise<void> {
  const file = join(cwd, "tastecode.md");
  await writeFile(file, content, "utf8");
}
