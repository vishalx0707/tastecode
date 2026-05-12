# TasteCode

Stop AI coding agents from overcoding your project.

TasteCode is a plugin-style taste layer for AI coding agents. It creates a
`tastecode.md` file and injects your coding preferences into tools like Claude
Code, Codex CLI, OpenCode, Aider, and other AI coding workflows.

**Use any AI coding agent. Keep your coding taste.**

## Quickstart

```bash
npx @tastecode/plugin init
```

This creates `tastecode.md` in your project. Edit it to match how you actually
like to code, then:

```bash
tastecode use claude "add a login page"
```

That wraps the local Claude Code CLI with a prompt that prepends your
`tastecode.md` rules. You can also use the short alias:

```bash
tastecode claude "fix the failing test"
```

## Commands

| Command                                    | Purpose |
|--------------------------------------------|---------|
| `tastecode init`                           | Create `tastecode.md` from a template |
| `tastecode init --force`                   | Overwrite an existing `tastecode.md` |
| `tastecode use <provider> "<task>"`        | Inject taste, run via the provider's CLI |
| `tastecode <provider> "<task>"`            | Short alias for `use` |
| `tastecode install [--all] [--yes]`        | Drop pointer files so agents read `tastecode.md` natively |
| `tastecode doctor`                         | Show installed providers and pointer status |

## How `tastecode use` works

1. Read `tastecode.md` (or `.tastecode/taste.md` as fallback).
2. Build an enhanced prompt:
   - TasteCode preamble
   - Full taste file contents
   - Your task
   - Strict rules: minimal edits, no overcoding, match project style
3. Spawn the provider's local CLI (`claude -p "<prompt>"` for Claude) and
   stream its output back to you.

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

Experimental v0.2.

**Currently supports:**
- `tastecode.md` generation
- Claude Code CLI wrapper (`tastecode use claude`)
- Pointer-file installs for 6 agents

**Planned:**
- Codex CLI provider
- OpenCode provider
- Aider provider
- OpenRouter / Ollama / direct-API providers
- MCP integration
- accepted / rejected diff learning

## Safety

TasteCode:

- Reads only `tastecode.md` and its fallbacks. Never `.env`, `.git`, or
  `node_modules`.
- Refuses to send `tastecode.md` to a model if it looks like it contains
  secrets (API keys, tokens).
- Does not modify any source files itself. The wrapped agent does, under its
  own permission settings.
- Does not contact any service. The only network calls are made by the
  underlying provider CLI (Claude Code, etc.).

## License

MIT
