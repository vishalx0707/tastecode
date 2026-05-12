import { platform, env } from "node:process";
import {
  buildSnippet,
  profilePath,
  reloadCommand,
  DEFAULT_SHIM_PROVIDERS,
  type ShellName,
} from "../templates/shell-snippets.js";

interface ShellInitOptions {
  shell?: string;
  providers?: string;
}

const VALID_SHELLS: ShellName[] = ["pwsh", "bash", "zsh"];

export async function runShellInit(opts: ShellInitOptions): Promise<number> {
  const requested = opts.shell?.toLowerCase();
  const providers = opts.providers
    ? opts.providers
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : DEFAULT_SHIM_PROVIDERS;

  if (requested) {
    if (!VALID_SHELLS.includes(requested as ShellName)) {
      console.error(`Unknown shell: ${requested}`);
      console.error(`Valid: ${VALID_SHELLS.join(", ")}`);
      return 1;
    }
    printSnippet(requested as ShellName, providers);
    return 0;
  }

  const detected = detectShell();
  if (detected) {
    printSnippet(detected, providers);
    return 0;
  }

  console.log("# Shell could not be auto-detected — emitting all variants.");
  console.log("# Re-run with --shell pwsh|bash|zsh to get just one.");
  for (const s of VALID_SHELLS) {
    console.log("");
    console.log(`# === ${s} ===`);
    printSnippet(s, providers);
  }
  return 0;
}

function printSnippet(shell: ShellName, providers: string[]): void {
  const snippet = buildSnippet(shell, { providers });
  console.log(`# TasteCode shell shim — paste into ${profilePath(shell)}`);
  console.log(`# Then reload with: ${reloadCommand(shell)}`);
  console.log(
    `# Routes \`${providers.join("`, `")}\` through \`tastecode use\` so taste is`,
  );
  console.log(`# injected on every direct call. Use \`<cli> --raw ...\` to bypass.`);
  console.log("");
  process.stdout.write(snippet);
}

function detectShell(): ShellName | null {
  if (platform === "win32" && env.PSModulePath) return "pwsh";
  const shell = env.SHELL ?? "";
  if (shell.includes("zsh")) return "zsh";
  if (shell.includes("bash")) return "bash";
  if (env.PSModulePath) return "pwsh";
  return null;
}
