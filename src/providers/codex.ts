import type { Provider } from "./types.js";

export const codex: Provider = {
  name: "codex",
  binary: "codex",
  async installed() {
    return false;
  },
  async run() {
    process.stderr.write(
      "Codex CLI provider is planned but not implemented yet.\n",
    );
    return 1;
  },
};
