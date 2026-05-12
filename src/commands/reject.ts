import {
  appendFeedback,
  markPromoted,
  type FeedbackEntry,
} from "../core/feedback.js";
import {
  appendLearnedRules,
  isReusableReason,
  readTastecodeMd,
  writeTastecodeMd,
} from "../core/learn-rules.js";
import { promptYN } from "../lib/prompt-yn.js";

export interface FeedbackCommandOptions {
  cwd: string;
  text: string;
  provider?: string;
  task?: string;
  yes?: boolean;
}

export async function runReject(opts: FeedbackCommandOptions): Promise<number> {
  return runFeedback({ ...opts, kind: "reject" });
}

export async function runAccept(opts: FeedbackCommandOptions): Promise<number> {
  return runFeedback({ ...opts, kind: "accept" });
}

async function runFeedback(
  opts: FeedbackCommandOptions & { kind: "reject" | "accept" },
): Promise<number> {
  const text = opts.text.trim();
  if (!text) {
    console.error(`Usage: tastecode ${opts.kind} "<reason>"`);
    return 1;
  }

  const entry = await appendFeedback(opts.cwd, {
    kind: opts.kind,
    provider: opts.provider,
    task: opts.task,
    text,
  });
  console.log(
    `Logged ${opts.kind} to .tastecode/feedback.md (${entry.timestamp}).`,
  );

  if (!isReusableReason(text)) {
    console.log(
      "Heuristic skipped the promote offer (looks task-specific). Use `tastecode learn` to promote it manually later.",
    );
    return 0;
  }

  return offerPromotion(opts.cwd, entry, opts.yes ?? false);
}

async function offerPromotion(
  cwd: string,
  entry: FeedbackEntry,
  autoYes: boolean,
): Promise<number> {
  const current = await readTastecodeMd(cwd);
  if (current === null) {
    console.error("tastecode.md not found — run `tastecode init` first.");
    console.error("Feedback is logged; re-run promotion later via `tastecode learn`.");
    return 0;
  }

  const promotion = appendLearnedRules(current, [entry.text]);
  console.log("");
  console.log("Proposed addition to tastecode.md under `## Learned Rules`:");
  console.log("");
  console.log(promotion.sectionPreview);
  console.log("");

  const ok = autoYes
    ? true
    : await promptYN("Apply this change?", false);
  if (!ok) {
    console.log("Skipped. Feedback stays in .tastecode/feedback.md.");
    return 0;
  }

  await writeTastecodeMd(cwd, promotion.next);
  await markPromoted(cwd, entry.timestamp);
  console.log("Updated tastecode.md and marked the feedback entry promoted.");
  return 0;
}
