import type { ProviderSpec } from "./types.js";

export const CLAUDE_SPEC: ProviderSpec = {
  command: "claude",
  args: ["-p"],
  stdin: true,
};

export const NOT_INSTALLED_MESSAGE =
  "Claude Code CLI was not found on PATH.\n" +
  "Install it (https://docs.claude.com/claude-code) and log in, then try again.\n" +
  "Or define another provider in tastecode.config.json — see README.";
