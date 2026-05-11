# TasteCode Plugin

> Use any AI coding agent. Keep your coding taste.

TasteCode is a portable taste layer for AI coding agents. It drops a single
`tastecode.md` file into your project and wires it into whichever agents you
use — Claude Code, Cursor, Cline, Codex CLI, OpenCode, Aider — so they all
follow the same coding-taste rules.

No runtime. No service to install. Just a file the agents read.

## Quickstart

```bash
npx @tastecode/plugin init
```

This will:

1. Create `tastecode.md` at your project root (from a sensible default template).
2. Detect which AI coding agents you use.
3. Write a small pointer file in each agent's native config format so the agent
   reads `tastecode.md` before coding.

To install pointers for all supported agents regardless of what's detected:

```bash
npx @tastecode/plugin init --all
```

To skip the interactive prompt:

```bash
npx @tastecode/plugin init --yes
```

## What gets written

| Agent       | File                                  |
|-------------|---------------------------------------|
| Claude Code | `CLAUDE.md`                           |
| Cursor      | `.cursor/rules/tastecode.mdc`         |
| Cline       | `.clinerules/tastecode.md`            |
| Codex CLI   | `AGENTS.md`                           |
| OpenCode    | `AGENTS.md` (shared with Codex)       |
| Aider       | `CONVENTIONS.md`                      |

Each pointer is wrapped in fence comments
(`<!-- tastecode:start -->` / `<!-- tastecode:end -->`) so re-running `init`
updates in place instead of duplicating content.

## Status

```bash
npx @tastecode/plugin doctor
```

Lists which agents are wired up and which files exist.

## Editing your taste

The only file you need to edit is `tastecode.md`. Rewrite it to match how you
actually like to code — language, frameworks, formatting, what to avoid. The
default template is conservative: keep things simple, avoid overcoding, match
the existing project style.

## License

MIT
