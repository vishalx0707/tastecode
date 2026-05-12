import { hasBinary, runStreaming } from "../core/command-runner.js";
import type { Provider } from "./types.js";

export const claude: Provider = {
  name: "claude",
  binary: "claude",
  async installed() {
    return hasBinary("claude");
  },
  async run(prompt: string) {
    return runStreaming("claude", ["-p"], { stdin: prompt });
  },
};

export const NOT_INSTALLED_MESSAGE =
  "Claude Code CLI was not found on PATH.\n" +
  "Install it (https://docs.claude.com/claude-code) and log in, then try again.\n" +
  "Or use another provider (codex, opencode — coming soon).";
