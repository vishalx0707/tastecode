# TasteCode

[![npm version](https://img.shields.io/npm/v/@tastecode/plugin?color=brightgreen&label=npm)](https://www.npmjs.com/package/@tastecode/plugin)
[![license](https://img.shields.io/npm/l/@tastecode/plugin)](./LICENSE)
[![node](https://img.shields.io/node/v/@tastecode/plugin)](https://nodejs.org)

> **Use any AI coding agent. Keep your coding taste.**

TasteCode stops AI coding agents from overcoding your project. It's a small
CLI plugin that lives between you and any local AI coding tool (Claude Code,
Codex, Aider, Ollama, anything with a CLI). It reads a single `tastecode.md`
file, injects your coding rules into every prompt, and runs the underlying
tool for you.

No accounts. No cloud. No new agent — TasteCode wraps the tools you already use.

---

## Table of contents

- [Install](#install)
- [Updating](#updating)
- [60-second tour](#60-second-tour)
- [Commands](#commands)
- [Configure any tool — `tastecode.config.json`](#configure-any-tool--tastecodeconfigjson)
- [Always-on shell shim](#always-on-shell-shim)
- [Reject-to-learn feedback loop](#reject-to-learn-feedback-loop)
- [How it works](#how-it-works)
- [Pointer-file mode (`install`)](#pointer-file-mode-install)
- [Safety](#safety)
- [Status & roadmap](#status--roadmap)
- [License](#license)

---

## Install

You don't need to install anything globally. Use `npx` from any project:

```bash
npx @tastecode/plugin init
```

Or install globally if you prefer:

```bash
npm i -g @tastecode/plugin
tastecode init
```

**Requirements:** Node 20+, plus whatever AI coding CLI you want to wrap
(Claude Code, Codex, Aider, etc.) on your `PATH`.

---

## Updating

**If you use `npx`:** pin to the latest version on next call —

```bash
npx @tastecode/plugin@latest <command>
```

**If you installed globally:**

```bash
npm update -g @tastecode/plugin
# or force the latest:
npm i -g @tastecode/plugin@latest
```

After updating, re-run `tastecode install` in each project so the fenced
`## TasteCode` block in `CLAUDE.md` / `AGENTS.md` / `.cursor/rules/…` /
`CONVENTIONS.md` picks up any improvements. The fence guard makes this
idempotent — no duplicate sections.

---

## 60-second tour

```bash
# 1. Create your taste file
npx @tastecode/plugin init

# 2. Edit tastecode.md to match how you actually like to code
#    (or accept the conservative defaults)

# 3. Run your AI coding tool through TasteCode
tastecode use claude "add a login page"
#    └─ wraps `claude -p` with your taste rules prepended
```

That's it. Every time you go through `tastecode use ...`, your `tastecode.md`
rules are injected into the prompt before the AI ever sees your task.

---

## Commands

| Command | What it does |
|---|---|
| `tastecode init` | Create `tastecode.md` from the default template |
| `tastecode init --force` | Overwrite an existing `tastecode.md` |
| `tastecode use <provider> "<task>"` | Inject taste, run the provider's CLI |
| `tastecode <provider> "<task>"` | Short alias for `use` |
| `tastecode providers` | List available providers (built-in + custom) |
| `tastecode install [--all] [--yes]` | Drop pointer files so agents read `tastecode.md` natively |
| `tastecode shell-init [--shell …]` | Print a shell snippet that routes agent CLIs through `tastecode use` |
| `tastecode reject "<reason>"` | Log a rejection; offer to promote reusable reasons to `tastecode.md` |
| `tastecode accept "<note>"` | Log a positive note; same promote flow |
| `tastecode learn` | Batch-promote pending feedback entries to `tastecode.md` |
| `tastecode doctor` | Show provider, pointer, and feedback-log status |
| `tastecode help` | Print usage |

---

## Configure any tool — `tastecode.config.json`

**Claude Code is the only built-in provider.** Anything else, you wire up with
a single line in `tastecode.config.json` at your project root.

### Schema

```json
{
  "providers": {
    "<name>": {
      "command": "<binary on PATH>",
      "args": ["<arg>", "..."],
      "stdin": false
    }
  }
}
```

| Field | Required | Description |
|---|---|---|
| `command` | yes | The CLI binary. Must be on your `PATH`. |
| `args` | no | Array of arguments. Use `"{prompt}"` to mark where the taste-injected prompt goes. |
| `stdin` | no (default `false`) | If `true`, the prompt is piped to the tool's stdin (no `{prompt}` substitution). |

If `stdin` is `false` and no arg contains `{prompt}`, the prompt is appended
as the last argument automatically.

### Ready-to-paste recipes

```json
{
  "providers": {
    "codex":        { "command": "codex",        "args": ["exec", "-"], "stdin": true },
    "aider":        { "command": "aider",        "args": ["--no-pretty", "--message", "{prompt}"] },
    "opencode":     { "command": "opencode",     "args": ["run", "{prompt}"] },
    "cursor-agent": { "command": "cursor-agent", "args": ["chat", "-m", "{prompt}"] },
    "continue":     { "command": "continue",     "args": ["chat", "-m", "{prompt}"] },
    "ollama":       { "command": "ollama",       "args": ["run", "qwen2.5-coder"], "stdin": true },
    "gemini":       { "command": "gemini",       "args": ["-p", "{prompt}"] }
  }
}
```

After saving that, run:

```bash
tastecode use codex "add a login page"
tastecode use aider "fix the failing test"
tastecode use ollama "explain this function"
```

You can also **override built-in providers** by giving them the same name —
useful if `claude` on your `PATH` points somewhere unusual.

---

## Always-on shell shim

`tastecode use codex "..."` works, but you have to remember to type it. If you
want **every** call to `claude`, `codex`, `cursor-agent`, `opencode`, or
`aider` to route through TasteCode automatically, paste a one-time shell
snippet:

```bash
tastecode shell-init                  # auto-detects your shell
tastecode shell-init --shell pwsh     # force PowerShell
tastecode shell-init --shell bash
tastecode shell-init --shell zsh
tastecode shell-init --providers claude,codex   # only shim these
```

The command **prints** the snippet — it never edits your `$PROFILE` for you.
Paste it into your profile, reload, and from then on:

```bash
codex "add a login page"        # taste injected automatically
claude "fix the failing test"   # taste injected automatically
codex --raw --help              # `--raw` bypasses TasteCode
codex --help                    # any leading flag also bypasses
```

The shim only intercepts plain-task invocations. Flag-leading calls (`--help`,
`--version`, etc.) pass through to the real binary untouched. Use `--raw`
explicitly when you want a bare-task invocation to bypass.

---

## Reject-to-learn feedback loop

When the agent's output doesn't match how you actually like to code, capture
it:

```bash
tastecode reject "no inline styles, use the tokens"
tastecode reject "too many files for what should be one component"
tastecode accept "prefer single bundled PR for refactors"
```

Each call:

1. Appends a timestamped entry to `.tastecode/feedback.md` (committed, plain
   markdown — no hidden memory).
2. Runs a reusable-reason heuristic. If the reason looks like a generic style
   preference (not task-specific), TasteCode shows a preview of the change it
   would make to `tastecode.md` under a new `## Learned Rules` section and
   asks `apply? [y/N]`.
3. On `y`: writes `tastecode.md` and marks the feedback entry as promoted.

Optional flags:

| Flag | Effect |
|---|---|
| `--provider <name>` | Tag the entry with the agent that produced the rejected output |
| `--task "<text>"` | Tag the entry with what you were trying to do |
| `--yes` | Skip the `apply? [y/N]` prompt — auto-apply |

### Batch-promote later with `tastecode learn`

If you skipped the promote offer (or the heuristic deemed a reason
task-specific), pending entries stay in `.tastecode/feedback.md`. Promote
several at once:

```bash
tastecode learn
# Pending feedback entries:
#   1. ✗ no inline styles
#   2. ✗ rename to getUserById in src/login.ts
#   3. ✓ prefer named exports
#
# Promote which? (e.g. "1,3" or "all", blank to cancel):
```

Or non-interactive: `tastecode learn --select 1,3 --yes`.

The feedback log is plain markdown. Edit, delete, or git-ignore it as you
like — TasteCode never reads it without your asking.

---

## How it works

```
┌──────────────┐       ┌────────────────────────┐       ┌────────────────┐
│ your task    │──────▶│ tastecode              │──────▶│ provider CLI   │
│ (CLI arg)    │       │  reads tastecode.md    │       │  (claude/codex/│
│              │       │  builds enhanced prompt│       │   aider/...)   │
└──────────────┘       │  spawns provider       │       │                │
                       └────────────────────────┘       └────────────────┘
```

When you run `tastecode use claude "add a login page"`:

1. **Read** `tastecode.md` (falls back to `.tastecode/taste.md` or `.tastecode/taste.json`).
2. **Build** an enhanced prompt:
   - TasteCode preamble
   - Full taste-file contents
   - Your task
   - Strict rules: minimal edits, no overcoding, match project style
3. **Spawn** the local provider CLI (e.g. `claude -p` with prompt via stdin)
   and stream its output back to your terminal.

TasteCode itself does not contact any model. All network calls happen inside
the wrapped tool, with its own auth and permission settings.

---

## Pointer-file mode (`install`)

If you'd rather have each agent read `tastecode.md` on its own — without
going through `tastecode use` every time — run:

```bash
tastecode install --all
```

This drops a small pointer file into each agent's native config format,
telling that agent to read `tastecode.md` before coding:

| Agent | File written |
|---|---|
| Claude Code | `CLAUDE.md` |
| Cursor | `.cursor/rules/tastecode.mdc` |
| Cline | `.clinerules/tastecode.md` |
| Codex CLI | `AGENTS.md` |
| OpenCode | `AGENTS.md` (shared with Codex) |
| Aider | `CONVENTIONS.md` |

Each pointer is wrapped in fence comments
(`<!-- tastecode:start --> ... <!-- tastecode:end -->`) so re-running
`install` updates in place — never duplicates.

---

## Safety

TasteCode:

- ✅ Reads only `tastecode.md` and its fallbacks. Never `.env`, `.git`, or `node_modules`.
- ✅ Refuses to send the taste file to a model if it looks like it contains secrets (API keys, tokens, passwords).
- ✅ Does not modify source files itself — the wrapped agent does, under its own permissions.
- ✅ Does not contact any service. Network calls come from the provider CLI, not from TasteCode.

---

## Status & roadmap

**v0.4 — current**

- `tastecode.md` generation with `## Learned Rules` section
- Claude Code provider (built-in)
- Universal `tastecode.config.json` for any other CLI tool
- Pointer-file installs for 6 agents
- `tastecode shell-init` — always-on shim for `claude`/`codex`/`cursor-agent`/`opencode`/`aider`
- `tastecode reject` / `tastecode accept` / `tastecode learn` — transparent reject-to-learn loop

**Planned**

- `tastecode scan` — infer taste rules from your repo
- Project-local Claude Code skill file once Claude Code supports project-local skills
- MCP integration

---

## License

MIT
