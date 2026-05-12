import type { Provider } from "./types.js";

export const opencode: Provider = {
  name: "opencode",
  binary: "opencode",
  async installed() {
    return false;
  },
  async run() {
    process.stderr.write(
      "OpenCode provider is planned but not implemented yet.\n",
    );
    return 1;
  },
};
