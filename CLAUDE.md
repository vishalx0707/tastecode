# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@tastecode/plugin` — a portable taste-injection layer for AI coding CLIs. Published to npm. Positioning: *"Use any AI coding agent. Keep your coding taste."* See `README.md` for the user-facing pitch.

## Commands

```bash
npm run build          # tsc -> dist/
npm run typecheck      # tsc --noEmit
npm test               # runs the explicit test file list in package.json
npm run dev -- <args>  # tsx src/index.ts -- runs the CLI from sources
```

**Running a single test file:**

```bash
node --test --import tsx test/feedback.test.ts
```

`node --test` does **not** auto-glob `test/` — the `test` script in `package.json` lists every test file explicitly. When you add a new test file, add it to that list, otherwise `npm test` will skip it.

**Running a single test by name within a file:**

```bash
node --test --import tsx --test-name-pattern="reusable reason" test/feedback.test.ts
```

## Architecture

Two coexisting always-on mechanisms inject taste into every coding action:

1. **Pointer-file path** — `tastecode install` drops a fenced `## TasteCode` block into each agent's native rule file (`CLAUDE.md`, `AGENTS.md`, `.cursor/rules/tastecode.mdc`, `.clinerules/tastecode.md`, `CONVENTIONS.md`). The agent reads it on its own; TasteCode is not running at agent time.
2. **Wrapper path** — `tastecode use <provider> "<task>"` reads `tastecode.md`, builds an enhanced prompt (preamble + taste rules + task + strict rules), and spawns the provider CLI. `tastecode shell-init` emits a shell snippet that aliases `claude`/`codex`/`cursor-agent`/`opencode`/`aider` as functions routing through `tastecode use` — making the wrapper feel always-on.

**Provider abstraction** is config-driven. Only `claude` is a built-in (`src/providers/claude.ts`). Everything else is user-configured via `tastecode.config.json` at the project root. The provider model (`src/providers/types.ts`):

```ts
interface ProviderSpec {
  command: string;        // CLI binary on PATH
  args?: string[];        // {prompt} substitution OR append-prompt-as-last-arg
  stdin?: boolean;        // pipe prompt to stdin instead of argv
}
```

`fromSpec()` in `src/providers/runtime.ts` turns a spec into a runnable `Provider`. Built-in `claude` and user configs both flow through it; users can also **override** a built-in by giving it the same name in their config.

**Reject-to-learn feedback loop** (v0.4):

- `tastecode reject "<reason>"` appends a timestamped entry to `.tastecode/feedback.md` (committed plain markdown, not hidden state).
- A reusable-reason heuristic in `src/core/learn-rules.ts` decides whether to *offer* immediate promotion to `## Learned Rules` in `tastecode.md`. False positives are fine — the user has a final `y/N` veto.
- `tastecode learn` batch-promotes pending entries selected by `1,3` / `2-4` / `all`.
- **Invariant: no hidden memory.** All learned rules live in `tastecode.md`. The wrapper (`tastecode use`) stays silent — no post-run prompt — so feedback is captured only by explicit `reject`/`accept`/`learn` calls.

## Critical files

| Concern | File |
|---|---|
| CLI entry / arg parsing / dispatch | `src/index.ts` |
| Cross-platform binary spawn | `src/core/command-runner.ts` |
| Prompt assembly | `src/core/prompt-builder.ts` |
| Taste file lookup + secret check | `src/core/taste-file.ts` |
| Feedback log read/append/mark | `src/core/feedback.ts` |
| Promote heuristic + section editor | `src/core/learn-rules.ts` |
| Idempotent fenced inserts | `src/lib/fence.ts` |
| Shell shim snippets per shell | `src/templates/shell-snippets.ts` |
| Default `tastecode.md` content | `src/templates/default-tastecode.ts` |
| Adapter registry | `src/adapters/index.ts` |
| Provider registry / overrides | `src/providers/index.ts` |

## Conventions to keep

- **Zero runtime dependencies.** Only `node:*` builtins (`parseArgs`, `readline/promises`, `fs/promises`, `child_process`). Dev deps: `typescript`, `tsx`, `@types/node`. This is a hard invariant — the plugin's own `tastecode.md` preaches "avoid random libraries," so the package must embody it.
- **ESM + NodeNext.** Every relative import inside `src/` uses a `.js` extension even though the source is `.ts`. Don't drop it.
- **Idempotency via fences.** Anything that writes to a user-owned config file (`CLAUDE.md`, `AGENTS.md`, etc.) goes through `upsertFenced()` so re-running `install` updates in place. Never raw-append.
- **Safety rails** (from `prompt.md` §15): never read `.env`, `.git`, or `node_modules`. `looksLikeSecrets()` in `src/core/taste-file.ts` refuses to send `tastecode.md` to a model if it looks like it contains an API key / token / password.

## Windows quirks worth knowing

`src/core/command-runner.ts` handles three Node-on-Windows pitfalls:

1. `where.exe` returns multiple entries for npm shims — `pickExecutable()` prefers `.exe > .cmd > .bat > .com` over the extensionless name (which Node can't spawn).
2. Node 20+ refuses to directly `spawn` a `.cmd` / `.bat` (security change). `isCmdScript()` detects these and wraps via `cmd.exe ["/c", resolvedPath, ...args]`.
3. `shell: true` triggers `DEP0190` and mangles multi-line prompts on Windows. Always use explicit `cmd.exe ["/c", ...]` with `shell: false`, and pipe long prompts to stdin instead of putting them in argv.

When editing `command-runner.ts`, preserve `shell: false` everywhere.

## Test organization

Tests live in `test/` (excluded from `tsc` build via `tsconfig.json`). `tsx` loads them as ESM at runtime. They follow a `mkdtemp` → run → `rm -rf` pattern per `node --test` test case so they can run in parallel without colliding.

For commands with interactive prompts (`reject`, `accept`, `learn`), pass `--yes` and `--select <spec>` to bypass `readline` calls in tests. The pure functions (`appendLearnedRules`, `isReusableReason`, `parseFeedback`, `buildSnippet`) are tested directly without going through the command layer.

## Publishing

`prepublishOnly` runs `npm run build && npm test`. Don't bypass with `--ignore-scripts` — that gate is the only thing preventing broken publishes. Version bumps go in `package.json`; tag with `git tag v0.X.0 && git push origin v0.X.0`.

## What `prompt.md` mandates

The repo's gitignored `prompt.md` is the original spec. Two invariants you should know about even though the file isn't visible:

- §14: **No hidden memory.** All learned preferences must be saved as plain markdown in `tastecode.md` (or `.tastecode/feedback.md` as a staging area). Never opaque state, sqlite, JSON-with-confidence-scores, or anything Command-Code-style retrospective-learning.
- §12: When a developer rejects code, **ask why**, and if the reason is a reusable preference, **offer to add it to `tastecode.md`** — never silently. This is implemented by `tastecode reject` + the `apply? [y/N]` prompt in `src/commands/reject.ts`.

When extending v0.4+, preserve both.
