import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ADAPTERS } from "../src/adapters/index.js";
import { upsertFenced, writeNew, FENCE_START, FENCE_END } from "../src/lib/fence.js";
import { POINTER_BLOCK } from "../src/templates/pointer.js";

async function makeTmp(): Promise<string> {
  return mkdtemp(join(tmpdir(), "tastecode-test-"));
}

test("upsertFenced creates a new file with fences", async () => {
  const dir = await makeTmp();
  try {
    const file = join(dir, "CLAUDE.md");
    const result = await upsertFenced(file, POINTER_BLOCK);
    assert.equal(result, "created");
    const content = await readFile(file, "utf8");
    assert.ok(content.includes(FENCE_START));
    assert.ok(content.includes(FENCE_END));
    assert.ok(content.includes("TasteCode"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("upsertFenced appends to existing file without fences", async () => {
  const dir = await makeTmp();
  try {
    const file = join(dir, "AGENTS.md");
    const original = "# Existing\n\nSome project notes.\n";
    await writeNew(file, original);
    const result = await upsertFenced(file, POINTER_BLOCK);
    assert.equal(result, "inserted");
    const content = await readFile(file, "utf8");
    assert.ok(content.startsWith("# Existing"));
    assert.ok(content.includes(FENCE_START));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("upsertFenced is idempotent — second run yields unchanged", async () => {
  const dir = await makeTmp();
  try {
    const file = join(dir, "CLAUDE.md");
    await upsertFenced(file, POINTER_BLOCK);
    const second = await upsertFenced(file, POINTER_BLOCK);
    assert.equal(second, "unchanged");
    const content = await readFile(file, "utf8");
    const occurrences = content.split(FENCE_START).length - 1;
    assert.equal(occurrences, 1, "fence should appear exactly once");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("upsertFenced replaces between fences when block changes", async () => {
  const dir = await makeTmp();
  try {
    const file = join(dir, "CLAUDE.md");
    await upsertFenced(file, POINTER_BLOCK);
    const updated = await upsertFenced(file, "## TasteCode\n\nUpdated body.\n");
    assert.equal(updated, "updated");
    const content = await readFile(file, "utf8");
    assert.ok(content.includes("Updated body."));
    assert.ok(!content.includes("smallest useful change"));
    const occurrences = content.split(FENCE_START).length - 1;
    assert.equal(occurrences, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

for (const a of ADAPTERS) {
  test(`adapter ${a.id} installs expected file and is idempotent`, async () => {
    const dir = await makeTmp();
    try {
      const first = await a.install(dir);
      assert.ok(first.length > 0);
      for (const r of first) {
        assert.ok(existsSync(r.file), `${r.file} should exist after install`);
        const content = await readFile(r.file, "utf8");
        assert.ok(content.includes("TasteCode"));
      }
      const second = await a.install(dir);
      for (const r of second) {
        assert.equal(r.result, "unchanged");
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
}
