import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildSnippet,
  profilePath,
  reloadCommand,
  FENCE_START,
  FENCE_END,
  DEFAULT_SHIM_PROVIDERS,
} from "../src/templates/shell-snippets.js";

test("pwsh snippet contains all default providers and tastecode_wrap", () => {
  const out = buildSnippet("pwsh");
  assert.ok(out.includes(FENCE_START));
  assert.ok(out.includes(FENCE_END));
  assert.ok(out.includes("function global:tastecode_wrap"));
  for (const p of DEFAULT_SHIM_PROVIDERS) {
    assert.ok(out.includes(`tastecode_wrap ${p} @args`), `pwsh shim missing for ${p}`);
  }
  assert.ok(out.includes("--raw"));
  assert.ok(out.includes("Get-Command -Name $Provider -CommandType Application"));
});

test("bash snippet has tastecode_wrap function and per-provider shims", () => {
  const out = buildSnippet("bash");
  assert.ok(out.includes(FENCE_START));
  assert.ok(out.includes(FENCE_END));
  assert.ok(out.includes("tastecode_wrap()"));
  assert.ok(out.includes("for cli in claude codex cursor-agent opencode aider"));
  assert.ok(out.includes("tastecode use"));
  assert.ok(out.includes("--raw"));
  assert.ok(out.includes(`command "$p"`));
});

test("zsh snippet matches bash variant", () => {
  const bash = buildSnippet("bash");
  const zsh = buildSnippet("zsh");
  assert.equal(bash, zsh);
});

test("custom providers list overrides default", () => {
  const out = buildSnippet("bash", { providers: ["mytool", "other"] });
  assert.ok(out.includes("for cli in mytool other"));
  assert.ok(!out.includes("claude codex"));
});

test("profilePath returns the right rc per shell", () => {
  assert.equal(profilePath("pwsh"), "$PROFILE");
  assert.equal(profilePath("bash"), "~/.bashrc");
  assert.equal(profilePath("zsh"), "~/.zshrc");
});

test("reloadCommand returns sensible sourcing instruction per shell", () => {
  assert.equal(reloadCommand("pwsh"), ". $PROFILE");
  assert.equal(reloadCommand("bash"), "source ~/.bashrc");
  assert.equal(reloadCommand("zsh"), "source ~/.zshrc");
});
