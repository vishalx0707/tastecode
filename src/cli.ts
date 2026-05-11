#!/usr/bin/env node
import { parseArgs } from "node:util";
import { cwd as getCwd } from "node:process";
import { runInit } from "./commands/init.js";
import { runDoctor } from "./commands/doctor.js";

const HELP = `tastecode-plugin — portable coding-taste layer for AI coding agents

Usage:
  npx @tastecode/plugin <command> [options]

Commands:
  init        Create tastecode.md and wire it into your AI coding agents
  doctor      Show which agents are wired up
  help        Show this help

Options for init:
  --yes       Non-interactive; accept defaults
  --all       Install pointers for all supported agents
  --cwd PATH  Run against a different directory (default: current)

Supported agents:
  Claude Code, Cursor, Cline, Codex CLI, OpenCode, Aider
`;

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      yes: { type: "boolean", short: "y", default: false },
      all: { type: "boolean", default: false },
      cwd: { type: "string" },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  const command = positionals[0] ?? "help";
  const cwd = values.cwd ?? getCwd();

  if (values.help || command === "help") {
    process.stdout.write(HELP);
    return;
  }

  switch (command) {
    case "init":
      await runInit({ yes: values.yes, all: values.all, cwd });
      return;
    case "doctor":
      await runDoctor(cwd);
      return;
    default:
      process.stderr.write(`Unknown command: ${command}\n\n`);
      process.stdout.write(HELP);
      process.exitCode = 1;
  }
}

main().catch((err) => {
  process.stderr.write(`tastecode-plugin: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
