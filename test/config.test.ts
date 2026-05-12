import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadConfig } from "../src/core/config.js";
import { listProviders, getProvider } from "../src/providers/index.js";

async function makeTmp(): Promise<string> {
  return mkdtemp(join(tmpdir(), "tastecode-config-"));
}

test("loadConfig returns {} when no config file present", async () => {
  const dir = await makeTmp();
  try {
    const cfg = await loadConfig(dir);
    assert.deepEqual(cfg, {});
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("loadConfig parses a valid tastecode.config.json", async () => {
  const dir = await makeTmp();
  try {
    await writeFile(
      join(dir, "tastecode.config.json"),
      JSON.stringify({
        providers: {
          codex: { command: "codex", args: ["exec", "-"], stdin: true },
        },
      }),
    );
    const cfg = await loadConfig(dir);
    assert.equal(cfg.providers?.codex.command, "codex");
    assert.deepEqual(cfg.providers?.codex.args, ["exec", "-"]);
    assert.equal(cfg.providers?.codex.stdin, true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("loadConfig rejects bad shapes", async () => {
  const dir = await makeTmp();
  try {
    await writeFile(
      join(dir, "tastecode.config.json"),
      JSON.stringify({ providers: { broken: { args: ["x"] } } }),
    );
    await assert.rejects(() => loadConfig(dir), /command must be a non-empty string/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("listProviders includes builtin claude when no config", async () => {
  const dir = await makeTmp();
  try {
    const providers = await listProviders(dir);
    const names = providers.map((p) => p.name);
    assert.ok(names.includes("claude"));
    const claude = providers.find((p) => p.name === "claude")!;
    assert.equal(claude.source, "builtin");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("listProviders adds custom providers from config", async () => {
  const dir = await makeTmp();
  try {
    await writeFile(
      join(dir, "tastecode.config.json"),
      JSON.stringify({
        providers: {
          mytool: { command: "mytool", args: ["{prompt}"] },
        },
      }),
    );
    const providers = await listProviders(dir);
    const mytool = providers.find((p) => p.name === "mytool");
    assert.ok(mytool);
    assert.equal(mytool!.source, "config");
    assert.equal(mytool!.binary, "mytool");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("config overrides built-in provider spec", async () => {
  const dir = await makeTmp();
  try {
    await writeFile(
      join(dir, "tastecode.config.json"),
      JSON.stringify({
        providers: {
          claude: { command: "my-claude", args: ["--print"], stdin: true },
        },
      }),
    );
    const claude = await getProvider(dir, "claude");
    assert.ok(claude);
    assert.equal(claude!.binary, "my-claude");
    assert.equal(claude!.source, "config");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
