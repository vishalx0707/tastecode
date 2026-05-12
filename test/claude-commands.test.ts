import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";

import { claudeCode } from "../src/adapters/claude-code.js";
import {
  CLAUDE_SLASH_COMMANDS,
  renderSlashCommand,
} from "../src/templates/claude-commands.js";

async function makeTmp(): Promise<string> {
  return mkdtemp(join(tmpdir(), "tastecode-slash-"));
}

test("renderSlashCommand produces valid frontmatter + body", () => {
  const rendered = renderSlashCommand({
    name: "x",
    description: "desc",
    argumentHint: "<arg>",
    body: "!echo hi",
  });
  assert.ok(rendered.startsWith("---\n"));
  assert.ok(rendered.includes("description: desc"));
  assert.ok(rendered.includes("argument-hint: <arg>"));
  assert.ok(rendered.endsWith("!echo hi\n"));
});

test("claude-code adapter writes .claude/commands/tastecode-*.md files", async () => {
  const dir = await makeTmp();
  try {
    const results = await claudeCode.install(dir);
    for (const cmd of CLAUDE_SLASH_COMMANDS) {
      const file = join(dir, ".claude", "commands", `${cmd.name}.md`);
      assert.ok(existsSync(file), `${cmd.name}.md should be written`);
      const content = await readFile(file, "utf8");
      assert.ok(content.includes(cmd.description));
      assert.ok(content.includes(cmd.body));
    }
    assert.ok(results.some((r) => r.file.endsWith("CLAUDE.md")));
    assert.ok(
      results.some((r) => r.file.includes("tastecode-reject.md")),
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("claude-code adapter is idempotent across two runs", async () => {
  const dir = await makeTmp();
  try {
    await claudeCode.install(dir);
    const second = await claudeCode.install(dir);
    for (const r of second) {
      assert.equal(r.result, "unchanged", `${r.file} should be unchanged`);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("every shipped slash command has a tastecode- prefix", () => {
  for (const c of CLAUDE_SLASH_COMMANDS) {
    assert.ok(
      c.name.startsWith("tastecode-"),
      `${c.name} should start with tastecode-`,
    );
  }
});
