import { readTasteFile, looksLikeSecrets } from "../core/taste-file.js";
import { buildTastePrompt } from "../core/prompt-builder.js";
import { getProvider, listProviders } from "../providers/index.js";
import { NOT_INSTALLED_MESSAGE } from "../providers/claude.js";

interface UseOptions {
  cwd: string;
  provider: string;
  task: string;
}

export async function runUse(opts: UseOptions): Promise<number> {
  const provider = await getProvider(opts.cwd, opts.provider);
  if (!provider) {
    const all = await listProviders(opts.cwd);
    const known = all.map((p) => p.name).join(", ") || "(none)";
    console.error(`Unknown provider: ${opts.provider}`);
    console.error(`Known providers: ${known}`);
    console.error("Add a custom one via tastecode.config.json — see README.");
    return 1;
  }

  if (!opts.task.trim()) {
    console.error('Task is empty. Pass it as a quoted string:');
    console.error('  tastecode use claude "add a login page"');
    return 1;
  }

  const taste = await readTasteFile(opts.cwd);
  if (!taste) {
    console.error("tastecode.md not found in this project.");
    console.error("Run `tastecode init` first.");
    return 1;
  }

  if (looksLikeSecrets(taste.content)) {
    console.error(
      `Refusing to send: ${taste.path} looks like it contains a secret (API key / token).\n` +
        "Remove the secret from the taste file before running `use`.",
    );
    return 1;
  }

  const prompt = buildTastePrompt(opts.task, taste.content);

  const installed = await provider.installed();
  if (!installed) {
    if (provider.name === "claude") {
      console.error(NOT_INSTALLED_MESSAGE);
    } else {
      console.error(
        `${provider.binary} was not found on PATH.\n` +
          `Install it, or check the "command" in your tastecode.config.json.`,
      );
    }
    return 1;
  }

  console.log(`> tastecode use ${provider.name} (${taste.path}, ${prompt.length} chars)`);
  console.log("");
  return provider.run(prompt);
}
