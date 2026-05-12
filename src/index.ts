#!/usr/bin/env node
import { parseArgs } from "node:util";
import { cwd as getCwd } from "node:process";
import { runInit } from "./commands/init.js";
import { runUse } from "./commands/use.js";
import { runInstall } from "./commands/install.js";
import { runDoctor } from "./commands/doctor.js";
import { runProviders } from "./commands/providers.js";
import { runShellInit } from "./commands/shell-init.js";
import { runReject } from "./commands/reject.js";
import { runAccept } from "./commands/accept.js";
import { runLearn } from "./commands/learn.js";
import { listProviders } from "./providers/index.js";

const HELP = `tastecode — portable coding-taste layer for AI coding agents

Usage:
  tastecode init [--force]
  tastecode use <provider> "<task>"
  tastecode <provider> "<task>"                 (alias for: use <provider>)
  tastecode providers
  tastecode install [--all] [--yes]
  tastecode doctor
  tastecode shell-init [--shell pwsh|bash|zsh] [--providers <a,b,c>]
  tastecode reject "<reason>" [--provider <name>] [--task <text>] [--yes]
  tastecode accept "<note>"   [--provider <name>] [--task <text>] [--yes]
  tastecode learn [--yes] [--select <spec>]
  tastecode help

Examples:
  tastecode init
  tastecode use claude "add a login page"
  tastecode codex "fix the failing test"
  tastecode install --all --yes
  tastecode shell-init                          # print shell shim snippet
  tastecode reject "no inline styles, use the tokens"
  tastecode learn                               # batch promote pending feedback

Define custom providers in tastecode.config.json:
  {
    "providers": {
      "codex":  { "command": "codex",  "args": ["exec", "-"], "stdin": true },
      "aider":  { "command": "aider",  "args": ["--no-pretty", "--message", "{prompt}"] }
    }
  }

Use any AI coding agent. Keep your coding taste.
`;

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      force: { type: "boolean", default: false },
      yes: { type: "boolean", short: "y", default: false },
      all: { type: "boolean", default: false },
      cwd: { type: "string" },
      help: { type: "boolean", short: "h", default: false },
      shell: { type: "string" },
      providers: { type: "string" },
      provider: { type: "string" },
      task: { type: "string" },
      select: { type: "string" },
    },
  });

  const cwd = values.cwd ?? getCwd();
  const command = positionals[0] ?? "help";

  if (values.help || command === "help") {
    process.stdout.write(HELP);
    return 0;
  }

  switch (command) {
    case "init":
      return runInit({ cwd, force: values.force });
    case "use": {
      const provider = positionals[1];
      const task = positionals.slice(2).join(" ");
      if (!provider) {
        process.stderr.write('Usage: tastecode use <provider> "<task>"\n');
        return 1;
      }
      return runUse({ cwd, provider, task });
    }
    case "providers":
      return runProviders(cwd);
    case "install":
      return runInstall({ cwd, yes: values.yes, all: values.all });
    case "doctor":
      return runDoctor(cwd);
    case "shell-init":
      return runShellInit({ shell: values.shell, providers: values.providers });
    case "reject":
      return runReject({
        cwd,
        text: positionals.slice(1).join(" "),
        provider: values.provider,
        task: values.task,
        yes: values.yes,
      });
    case "accept":
      return runAccept({
        cwd,
        text: positionals.slice(1).join(" "),
        provider: values.provider,
        task: values.task,
        yes: values.yes,
      });
    case "learn":
      return runLearn({ cwd, yes: values.yes, select: values.select });
    default: {
      const providers = await listProviders(cwd);
      if (providers.some((p) => p.name === command)) {
        const task = positionals.slice(1).join(" ");
        return runUse({ cwd, provider: command, task });
      }
      process.stderr.write(`Unknown command: ${command}\n\n`);
      process.stdout.write(HELP);
      return 1;
    }
  }
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err) => {
    process.stderr.write(
      `tastecode: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exitCode = 1;
  });
