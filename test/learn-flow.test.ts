import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runLearn, parseSelection } from "../src/commands/learn.js";
import { appendFeedback, readFeedback } from "../src/core/feedback.js";
import { DEFAULT_TASTECODE_MD } from "../src/templates/default-tastecode.js";

async function makeProject(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "tastecode-learn-"));
  await writeFile(join(dir, "tastecode.md"), DEFAULT_TASTECODE_MD, "utf8");
  return dir;
}

test("learn --select 1,3 --yes promotes selected pending entries", async () => {
  const dir = await makeProject();
  try {
    await appendFeedback(dir, { kind: "reject", text: "no inline styles" });
    await appendFeedback(dir, { kind: "reject", text: "skip me" });
    await appendFeedback(dir, { kind: "accept", text: "prefer named exports" });

    const code = await runLearn({ cwd: dir, select: "1,3", yes: true });
    assert.equal(code, 0);

    const md = await readFile(join(dir, "tastecode.md"), "utf8");
    assert.ok(md.includes("- no inline styles"));
    assert.ok(md.includes("- prefer named exports"));
    assert.ok(!md.includes("- skip me"));

    const entries = await readFeedback(dir);
    const promoted = entries.filter((e) => e.promotedAt);
    assert.equal(promoted.length, 2);
    const pendingTexts = entries.filter((e) => !e.promotedAt).map((e) => e.text);
    assert.deepEqual(pendingTexts, ["skip me"]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("learn with no pending entries returns 0 without changes", async () => {
  const dir = await makeProject();
  try {
    const code = await runLearn({ cwd: dir, yes: true });
    assert.equal(code, 0);
    const md = await readFile(join(dir, "tastecode.md"), "utf8");
    assert.equal(md, DEFAULT_TASTECODE_MD);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("learn --select all --yes promotes every pending entry", async () => {
  const dir = await makeProject();
  try {
    await appendFeedback(dir, { kind: "reject", text: "use tokens" });
    await appendFeedback(dir, { kind: "accept", text: "prefer composition" });

    const code = await runLearn({ cwd: dir, select: "all", yes: true });
    assert.equal(code, 0);

    const md = await readFile(join(dir, "tastecode.md"), "utf8");
    assert.ok(md.includes("- use tokens"));
    assert.ok(md.includes("- prefer composition"));

    const entries = await readFeedback(dir);
    assert.equal(entries.filter((e) => e.promotedAt).length, 2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("parseSelection accepts ranges, lists, and 'all'", () => {
  const fakes = [1, 2, 3, 4, 5].map((n) => ({
    timestamp: `t${n}`,
    kind: "reject" as const,
    text: `r${n}`,
  }));
  assert.deepEqual(
    parseSelection("1,3", fakes).map((e) => e.text),
    ["r1", "r3"],
  );
  assert.deepEqual(
    parseSelection("2-4", fakes).map((e) => e.text),
    ["r2", "r3", "r4"],
  );
  assert.deepEqual(
    parseSelection("all", fakes).map((e) => e.text),
    ["r1", "r2", "r3", "r4", "r5"],
  );
  assert.deepEqual(parseSelection("99", fakes), []);
  assert.deepEqual(parseSelection("", fakes), []);
});
