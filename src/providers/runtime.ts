import { hasBinary, runStreaming } from "../core/command-runner.js";
import type { Provider, ProviderSpec } from "./types.js";

const PROMPT_PLACEHOLDER = "{prompt}";

export function fromSpec(
  name: string,
  spec: ProviderSpec,
  source: "builtin" | "config",
): Provider {
  return {
    name,
    binary: spec.command,
    source,
    spec,
    installed() {
      return hasBinary(spec.command);
    },
    run(prompt) {
      const args = spec.args ?? [];
      if (spec.stdin) {
        return runStreaming(spec.command, args, { stdin: prompt });
      }
      const substituted = args.map((a) =>
        a.includes(PROMPT_PLACEHOLDER) ? a.split(PROMPT_PLACEHOLDER).join(prompt) : a,
      );
      const hadPlaceholder = args.some((a) => a.includes(PROMPT_PLACEHOLDER));
      const finalArgs = hadPlaceholder ? substituted : [...substituted, prompt];
      return runStreaming(spec.command, finalArgs);
    },
  };
}
