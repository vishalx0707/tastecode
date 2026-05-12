# TasteCode

Stop AI coding agents from overcoding your project.

TasteCode is a plugin-style taste layer for AI coding agents. It creates a
`tastecode.md` file and injects your coding preferences into any CLI-based AI
coding tool — Claude Code out of the box, plus anything else you define in
`tastecode.config.json`.

**Use any AI coding agent. Keep your coding taste.**

## Quickstart

```bash
npx @tastecode/plugin init
```

Then:

```bash
tastecode use claude "add a login page"
```

That wraps the local Claude Code CLI with a prompt that prepends your
`tastecode.md` rules.

## Commands

| Command                                    | Purpose |
|--------------------------------------------|---------|
| `tastecode init`                           | Create `tastecode.md` from a template |
| `tastecode init --force`                   | Overwrite an existing `tastecode.md` |
| `tastecode use <provider> "<task>"`        | Inject taste, run via the provider's CLI |
| `tastecode <provider> "<task>"`            | Short alias for `use` |
| `tastecode providers`                      | List built-in + custom providers |
| `tastecode install [--all] [--yes]`        | Drop pointer files so agents read `tastecode.md` natively |
| `tastecode doctor`                         | Show provider + pointer status |

## Use any tool — `tastecode.config.json`

Claude is built in. Any other CLI tool that takes a prompt either via stdin or
argv works out of the box — just add it to `tastecode.config.json` at the
project root:

```json
{
  "providers": {
    "codex":    { "command": "codex",    "args": ["exec", "-"], "stdin": true },
    "aider":    { "command": "aider",    "args": ["--no-pretty", "--message", "{prompt}"] },
    "opencode": { "command": "opencode", "args": ["run", "{prompt}"] },
    "ollama":   { "command": "ollama",   "args": ["run", "qwen2.5-coder"], "stdin": true }
  }
}
```

Then:

```bash
tastecode use codex "add a login page"
tastecode use aider "fix the failing test"
tastecode use ollama "explain this function"
```

**Spec fields:**

- `command` (required) — the binary to invoke. Must be on `PATH`.
- `args` (optional) — array of arguments. Use `"{prompt}"` as a placeholder
  for the assembled taste prompt.
- `stdin` (optional, default `false`) — when `true`, the prompt is piped to
  the tool's stdin and `{prompt}` is not substituted.

If `stdin` is `false` and no arg contains `{prompt}`, the prompt is appended
as the last argument.

You can override built-in providers (e.g. point `claude` at a different
binary) by giving them the same name in `providers`.

## How `tastecode use` works

1. Read `tastecode.md` (or `.tastecode/taste.md` as fallback).
2. Build an enhanced prompt:
   - TasteCode preamble
   - Full taste file contents
   - Your task
   - Strict rules: minimal edits, no overcoding, match project style
3. Spawn the provider's local CLI and stream its output back to you.

TasteCode does not send anything to a model directly. It only wraps the local
CLI you already have installed.

## How `tastecode install` works (optional)

If you'd rather have each agent read `tastecode.md` on its own — without going
through `tastecode use` — run `tastecode install`. It drops a small pointer
file into each detected agent's native config:

| Agent       | File                                  |
|-------------|---------------------------------------|
| Claude Code | `CLAUDE.md`                           |
| Cursor      | `.cursor/rules/tastecode.mdc`         |
| Cline       | `.clinerules/tastecode.md`            |
| Codex CLI   | `AGENTS.md`                           |
| OpenCode    | `AGENTS.md` (shared with Codex)       |
| Aider       | `CONVENTIONS.md`                      |

Each pointer is fenced (`<!-- tastecode:start --> ... <!-- tastecode:end -->`)
so re-running `install` updates in place instead of duplicating content.

## Status

Experimental v0.3.

**Works today:**
- `tastecode.md` generation
- Claude Code provider (built in)
- Any other CLI via `tastecode.config.json`
- Pointer-file installs for 6 agents

**Planned:**
- Accept / reject diff learning loop
- `tastecode scan` to infer taste rules from repo
- MCP integration
- Shell alias generator (`tastecode shell-init`)

## Safety

TasteCode:

- Reads only `tastecode.md` and its fallbacks. Never `.env`, `.git`, or
  `node_modules`.
- Refuses to send `tastecode.md` to a model if it looks like it contains
  secrets (API keys, tokens).
- Does not modify any source files itself. The wrapped agent does, under its
  own permission settings.
- Does not contact any service. The only network calls are made by the
  underlying provider CLI.

## License

MIT
