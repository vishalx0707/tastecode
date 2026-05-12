import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  appendFeedback,
  readFeedback,
  markPromoted,
  feedbackStatus,
  parseFeedback,
  getFeedbackPath,
} from "../src/core/feedback.js";
import {
  isReusableReason,
  appendLearnedRules,
  LEARNED_HEADING,
} from "../src/core/learn-rules.js";

async function makeTmp(): Promise<string> {
  return mkdtemp(join(tmpdir(), "tastecode-feedback-"));
}

test("appendFeedback creates .tastecode/feedback.md with header on first write", async () => {
  const dir = await makeTmp();
  try {
    const entry = await appendFeedback(dir, {
      kind: "reject",
      text: "no inline styles",
    });
    assert.ok(existsSync(getFeedbackPath(dir)));
    const text = await readFile(getFeedbackPath(dir), "utf8");
    assert.ok(text.startsWith("# TasteCode feedback log"));
    assert.ok(text.includes(`## ${entry.timestamp} reject`));
    assert.ok(text.includes("reason: no inline styles"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("appendFeedback round-trips through readFeedback", async () => {
  const dir = await makeTmp();
  try {
    await appendFeedback(dir, {
      kind: "reject",
      provider: "codex",
      task: "add login",
      text: "too many files",
    });
    await appendFeedback(dir, { kind: "accept", text: "clean diff" });
    const entries = await readFeedback(dir);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].kind, "reject");
    assert.equal(entries[0].provider, "codex");
    assert.equal(entries[0].task, "add login");
    assert.equal(entries[0].text, "too many files");
    assert.equal(entries[1].kind, "accept");
    assert.equal(entries[1].text, "clean diff");
    assert.equal(entries[0].promotedAt, undefined);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("markPromoted adds [promoted ...] marker on the matched entry", async () => {
  const dir = await makeTmp();
  try {
    const e1 = await appendFeedback(dir, { kind: "reject", text: "first" });
    const e2 = await appendFeedback(dir, { kind: "reject", text: "second" });
    const ok = await markPromoted(dir, e1.timestamp);
    assert.equal(ok, true);
    const entries = await readFeedback(dir);
    const a = entries.find((e) => e.timestamp === e1.timestamp)!;
    const b = entries.find((e) => e.timestamp === e2.timestamp)!;
    assert.ok(a.promotedAt, "first entry should be promoted");
    assert.equal(b.promotedAt, undefined);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("feedbackStatus reports counts", async () => {
  const dir = await makeTmp();
  try {
    const empty = await feedbackStatus(dir);
    assert.equal(empty.exists, false);

    const e1 = await appendFeedback(dir, { kind: "reject", text: "a" });
    await appendFeedback(dir, { kind: "reject", text: "b" });
    await markPromoted(dir, e1.timestamp);

    const status = await feedbackStatus(dir);
    assert.equal(status.exists, true);
    assert.equal(status.total, 2);
    assert.equal(status.promoted, 1);
    assert.equal(status.pending, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("parseFeedback handles entries with and without optional fields", () => {
  const text = `# header

---

## 2026-05-12T10:00:00.000Z reject
provider: codex
task: t1
reason: r1

## 2026-05-12T11:00:00.000Z accept [promoted 2026-05-12T11:01:00.000Z]
note: n1
`;
  const entries = parseFeedback(text);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].provider, "codex");
  assert.equal(entries[0].task, "t1");
  assert.equal(entries[1].provider, undefined);
  assert.equal(entries[1].promotedAt, "2026-05-12T11:01:00.000Z");
});

test("isReusableReason accepts prescriptive short rules", () => {
  assert.equal(isReusableReason("no inline styles, use the tokens"), true);
  assert.equal(isReusableReason("use semicolons"), true);
  assert.equal(isReusableReason("prefer named exports"), true);
  assert.equal(isReusableReason("avoid useEffect for this kind of state"), true);
});

test("isReusableReason rejects task-specific or code-laden reasons", () => {
  assert.equal(isReusableReason("hi"), false);
  assert.equal(isReusableReason("x".repeat(200)), false);
  assert.equal(isReusableReason("rename to getUserById"), false);
  assert.equal(isReusableReason("fix src/auth/login.ts"), false);
  assert.equal(isReusableReason("change get_user_id callsite"), false);
  assert.equal(isReusableReason("update doSomething() return"), false);
  assert.equal(isReusableReason("use `Button` from ui"), false);
});

test("appendLearnedRules adds a bullet under existing section", () => {
  const md = `# TasteCode\n\n## Project Style\n- be simple\n\n## Learned Rules\n\n- existing rule\n`;
  const { next, addedBullets, sectionPreview } = appendLearnedRules(md, [
    "no inline styles",
  ]);
  assert.equal(addedBullets.length, 1);
  assert.ok(next.includes("- existing rule"));
  assert.ok(next.includes("- no inline styles"));
  assert.ok(sectionPreview.includes(LEARNED_HEADING));
  assert.ok(sectionPreview.includes("+ - no inline styles"));
  const occurrences = next.split(LEARNED_HEADING).length - 1;
  assert.equal(occurrences, 1, "section heading should appear once");
});

test("appendLearnedRules creates the section if absent", () => {
  const md = `# TasteCode\n\n## Project Style\n- a\n`;
  const { next, addedBullets } = appendLearnedRules(md, ["use kebab-case"]);
  assert.equal(addedBullets.length, 1);
  assert.ok(next.includes(LEARNED_HEADING));
  assert.ok(next.includes("- use kebab-case"));
});

test("appendLearnedRules inserts before a following section", () => {
  const md = `# T\n\n## Learned Rules\n\n- a\n\n## Things I Dislike\n- bad\n`;
  const { next } = appendLearnedRules(md, ["no any types"]);
  const learnedIdx = next.indexOf("## Learned Rules");
  const dislikeIdx = next.indexOf("## Things I Dislike");
  const newRuleIdx = next.indexOf("- no any types");
  assert.ok(learnedIdx < newRuleIdx);
  assert.ok(newRuleIdx < dislikeIdx);
});
