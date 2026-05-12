import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runReject, runAccept } from "../src/commands/reject.js";
import { readFeedback } from "../src/core/feedback.js";
import { DEFAULT_TASTECODE_MD } from "../src/templates/default-tastecode.js";

async function makeProject(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "tastecode-reject-"));
  await writeFile(join(dir, "tastecode.md"), DEFAULT_TASTECODE_MD, "utf8");
  return dir;
}

test("reject with reusable reason and --yes promotes to tastecode.md", async () => {
  const dir = await makeProject();
  try {
    const code = await runReject({
      cwd: dir,
      text: "no inline styles, use the tokens",
      yes: true,
    });
    assert.equal(code, 0);

    const md = await readFile(join(dir, "tastecode.md"), "utf8");
    assert.ok(
      md.includes("- no inline styles, use the tokens"),
      "promoted bullet should be in tastecode.md",
    );

    const entries = await readFeedback(dir);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].kind, "reject");
    assert.ok(entries[0].promotedAt, "entry should be marked promoted");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("reject with task-specific reason logs only and skips promote offer", async () => {
  const dir = await makeProject();
  try {
    const code = await runReject({
      cwd: dir,
      text: "rename to getUserById in src/auth/login.ts",
      yes: true,
    });
    assert.equal(code, 0);

    const md = await readFile(join(dir, "tastecode.md"), "utf8");
    assert.ok(
      !md.includes("getUserById"),
      "task-specific reason must not be promoted",
    );

    const entries = await readFeedback(dir);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].promotedAt, undefined);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("accept with reusable note promotes symmetrically", async () => {
  const dir = await makeProject();
  try {
    const code = await runAccept({
      cwd: dir,
      text: "prefer single bundled PR for refactors",
      yes: true,
    });
    assert.equal(code, 0);

    const md = await readFile(join(dir, "tastecode.md"), "utf8");
    assert.ok(md.includes("- prefer single bundled PR for refactors"));

    const entries = await readFeedback(dir);
    assert.equal(entries[0].kind, "accept");
    assert.ok(entries[0].promotedAt);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("reject without tastecode.md logs feedback but cannot promote", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tastecode-reject-bare-"));
  try {
    const code = await runReject({
      cwd: dir,
      text: "use semicolons",
      yes: true,
    });
    assert.equal(code, 0);
    const entries = await readFeedback(dir);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].promotedAt, undefined);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("empty reject text errors out", async () => {
  const dir = await makeProject();
  try {
    const code = await runReject({ cwd: dir, text: "  ", yes: true });
    assert.equal(code, 1);
    const entries = await readFeedback(dir);
    assert.equal(entries.length, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
