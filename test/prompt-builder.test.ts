import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTastePrompt } from "../src/core/prompt-builder.js";
import { looksLikeSecrets } from "../src/core/taste-file.js";

test("buildTastePrompt includes taste content and task verbatim", () => {
  const taste = "# TasteCode\n- Keep it simple.";
  const task = "add a login page";
  const out = buildTastePrompt(task, taste);
  assert.ok(out.includes(taste));
  assert.ok(out.includes(task));
  assert.ok(out.includes("Rules:"));
  assert.ok(out.includes("TasteCode"));
});

test("buildTastePrompt trims oversized taste files", () => {
  const huge = "x".repeat(40_000);
  const out = buildTastePrompt("do thing", huge);
  assert.ok(out.length < 35_000, `prompt should be trimmed (got ${out.length})`);
  assert.ok(out.includes("trimmed"));
});

test("looksLikeSecrets detects common secret patterns", () => {
  assert.equal(looksLikeSecrets("API_KEY=sk_live_abc"), true);
  assert.equal(looksLikeSecrets("password: hunter2"), true);
  assert.equal(looksLikeSecrets("# TasteCode\nKeep it simple."), false);
});
