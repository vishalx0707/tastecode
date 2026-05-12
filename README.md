# TasteCode

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
- [60-second tour](#60-second-tour)
- [Commands](#commands)
- [Configure any tool — `tastecode.config.json`](#configure-any-tool--tastecodeconfigjson)
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
| `tastecode doctor` | Show provider + pointer status |
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
    "codex":    { "command": "codex",    "args": ["exec", "-"], "stdin": true },
    "aider":    { "command": "aider",    "args": ["--no-pretty", "--message", "{prompt}"] },
    "opencode": { "command": "opencode", "args": ["run", "{prompt}"] },
    "ollama":   { "command": "ollama",   "args": ["run", "qwen2.5-coder"], "stdin": true },
    "gemini":   { "command": "gemini",   "args": ["-p", "{prompt}"] }
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

**v0.3 — current**

- `tastecode.md` generation
- Claude Code provider (built-in)
- Universal `tastecode.config.json` for any other CLI tool
- Pointer-file installs for 6 agents

**Planned**

- `tastecode shell-init` — generates a shell alias so `claude "..."` always routes through TasteCode
- `tastecode scan` — infer taste rules from your repo
- Accept / reject diff learning
- MCP integration

---

## License

MIT
