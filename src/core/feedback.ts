import { join, dirname } from "node:path";
import { existsSync } from "node:fs";
import { readFile, writeFile, mkdir } from "node:fs/promises";

export const FEEDBACK_DIR = ".tastecode";
export const FEEDBACK_FILE = "feedback.md";

const FEEDBACK_HEADER = `# TasteCode feedback log

Append-only. Each entry captures one acceptance or rejection.
Promote reusable preferences to tastecode.md with \`tastecode learn\`.

---
`;

export type FeedbackKind = "reject" | "accept";

export interface FeedbackEntry {
  timestamp: string;
  kind: FeedbackKind;
  provider?: string;
  task?: string;
  text: string;
  promotedAt?: string;
}

export interface NewFeedback {
  kind: FeedbackKind;
  provider?: string;
  task?: string;
  text: string;
}

export function getFeedbackPath(cwd: string): string {
  return join(cwd, FEEDBACK_DIR, FEEDBACK_FILE);
}

export async function appendFeedback(
  cwd: string,
  fb: NewFeedback,
): Promise<FeedbackEntry> {
  const entry: FeedbackEntry = {
    timestamp: new Date().toISOString(),
    kind: fb.kind,
    provider: fb.provider,
    task: fb.task,
    text: fb.text,
  };
  const file = getFeedbackPath(cwd);
  await mkdir(dirname(file), { recursive: true });
  const block = formatEntry(entry);
  if (!existsSync(file)) {
    await writeFile(file, FEEDBACK_HEADER + "\n" + block, "utf8");
  } else {
    const current = await readFile(file, "utf8");
    const sep = current.endsWith("\n") ? "" : "\n";
    await writeFile(file, current + sep + "\n" + block, "utf8");
  }
  return entry;
}

function formatEntry(e: FeedbackEntry): string {
  const marker = e.promotedAt ? ` [promoted ${e.promotedAt}]` : "";
  const lines = [`## ${e.timestamp} ${e.kind}${marker}`];
  if (e.provider) lines.push(`provider: ${e.provider}`);
  if (e.task) lines.push(`task: ${e.task}`);
  const label = e.kind === "reject" ? "reason" : "note";
  lines.push(`${label}: ${e.text}`);
  return lines.join("\n") + "\n";
}

const HEADING_RE =
  /^## (\S+)\s+(reject|accept)(?:\s+\[promoted\s+(\S+)\])?\s*$/;

export function parseFeedback(text: string): FeedbackEntry[] {
  const lines = text.split(/\r?\n/);
  const entries: FeedbackEntry[] = [];
  let current: Partial<FeedbackEntry> | null = null;

  const flush = (): void => {
    if (current && current.timestamp && current.kind && current.text) {
      entries.push(current as FeedbackEntry);
    }
    current = null;
  };

  for (const line of lines) {
    const m = HEADING_RE.exec(line);
    if (m) {
      flush();
      current = {
        timestamp: m[1],
        kind: m[2] as FeedbackKind,
        text: "",
      };
      if (m[3]) current.promotedAt = m[3];
      continue;
    }
    if (!current) continue;
    const provM = /^provider:\s*(.*)$/.exec(line);
    if (provM) {
      current.provider = provM[1].trim();
      continue;
    }
    const taskM = /^task:\s*(.*)$/.exec(line);
    if (taskM) {
      current.task = taskM[1].trim();
      continue;
    }
    const reasonM = /^(?:reason|note):\s*(.*)$/.exec(line);
    if (reasonM) {
      current.text = reasonM[1].trim();
      continue;
    }
  }
  flush();
  return entries;
}

export async function readFeedback(cwd: string): Promise<FeedbackEntry[]> {
  const file = getFeedbackPath(cwd);
  if (!existsSync(file)) return [];
  const text = await readFile(file, "utf8");
  return parseFeedback(text);
}

export async function markPromoted(
  cwd: string,
  timestamp: string,
): Promise<boolean> {
  const file = getFeedbackPath(cwd);
  if (!existsSync(file)) return false;
  const current = await readFile(file, "utf8");
  const ts = escapeRegex(timestamp);
  const headingRe = new RegExp(`^## ${ts} (reject|accept)\\s*$`, "m");
  if (!headingRe.test(current)) return false;
  const promotedAt = new Date().toISOString();
  const next = current.replace(
    headingRe,
    `## ${timestamp} $1 [promoted ${promotedAt}]`,
  );
  await writeFile(file, next, "utf8");
  return true;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface FeedbackStatus {
  exists: boolean;
  total: number;
  promoted: number;
  pending: number;
}

export async function feedbackStatus(cwd: string): Promise<FeedbackStatus> {
  const file = getFeedbackPath(cwd);
  if (!existsSync(file)) {
    return { exists: false, total: 0, promoted: 0, pending: 0 };
  }
  const entries = await readFeedback(cwd);
  const promoted = entries.filter((e) => e.promotedAt).length;
  return {
    exists: true,
    total: entries.length,
    promoted,
    pending: entries.length - promoted,
  };
}
