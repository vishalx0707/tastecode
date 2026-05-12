import {
  readFeedback,
  markPromoted,
  type FeedbackEntry,
} from "../core/feedback.js";
import {
  appendLearnedRules,
  readTastecodeMd,
  writeTastecodeMd,
} from "../core/learn-rules.js";
import { promptLine, promptYN } from "../lib/prompt-yn.js";

interface LearnOptions {
  cwd: string;
  yes?: boolean;
  select?: string;
}

export async function runLearn(opts: LearnOptions): Promise<number> {
  const all = await readFeedback(opts.cwd);
  const pending = all.filter((e) => !e.promotedAt);

  if (pending.length === 0) {
    console.log("No pending feedback entries. Nothing to promote.");
    return 0;
  }

  console.log("");
  console.log("Pending feedback entries:");
  console.log("");
  pending.forEach((e, i) => {
    const tag = e.kind === "reject" ? "✗" : "✓";
    const meta = [e.provider, e.task].filter(Boolean).join(" — ");
    const metaLine = meta ? `      (${meta})` : "";
    console.log(`  ${String(i + 1).padStart(2)}. ${tag} ${e.text}`);
    if (metaLine) console.log(metaLine);
  });
  console.log("");

  const raw = opts.select ?? (await promptLine(
    `Promote which? (e.g. "1,3" or "all", blank to cancel): `,
  ));
  if (!raw) {
    console.log("Cancelled.");
    return 0;
  }
  const picked = parseSelection(raw, pending);
  if (picked.length === 0) {
    console.error("No valid selections.");
    return 1;
  }

  const current = await readTastecodeMd(opts.cwd);
  if (current === null) {
    console.error("tastecode.md not found — run `tastecode init` first.");
    return 1;
  }

  const promotion = appendLearnedRules(
    current,
    picked.map((e) => e.text),
  );
  console.log("");
  console.log("Proposed addition to tastecode.md under `## Learned Rules`:");
  console.log("");
  console.log(promotion.sectionPreview);
  console.log("");

  const ok = opts.yes ? true : await promptYN("Apply this change?", false);
  if (!ok) {
    console.log("Skipped. Feedback log untouched.");
    return 0;
  }

  await writeTastecodeMd(opts.cwd, promotion.next);
  for (const entry of picked) await markPromoted(opts.cwd, entry.timestamp);
  console.log(
    `Updated tastecode.md (+${picked.length}). Marked ${picked.length} feedback entries promoted.`,
  );
  return 0;
}

export function parseSelection(
  raw: string,
  pending: FeedbackEntry[],
): FeedbackEntry[] {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === "all") return [...pending];
  const nums = new Set<number>();
  for (const part of trimmed.split(/[,\s]+/)) {
    if (!part) continue;
    const rangeM = /^(\d+)-(\d+)$/.exec(part);
    if (rangeM) {
      const start = Number(rangeM[1]);
      const end = Number(rangeM[2]);
      for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
        nums.add(i);
      }
      continue;
    }
    const n = Number(part);
    if (Number.isInteger(n) && n >= 1) nums.add(n);
  }
  const out: FeedbackEntry[] = [];
  for (const n of [...nums].sort((a, b) => a - b)) {
    const e = pending[n - 1];
    if (e) out.push(e);
  }
  return out;
}
