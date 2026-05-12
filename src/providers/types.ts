import type { ProviderSpec } from "../core/config.js";

export type { ProviderSpec };

export interface Provider {
  name: string;
  binary: string;
  source: "builtin" | "config";
  spec: ProviderSpec;
  installed(): Promise<boolean>;
  run(prompt: string): Promise<number>;
}
