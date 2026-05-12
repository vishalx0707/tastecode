import { spawn } from "node:child_process";
import { platform } from "node:process";

function resolveBinary(name: string): Promise<string | null> {
  const lookup = platform === "win32" ? "where" : "which";
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    const proc = spawn(lookup, [name], { stdio: ["ignore", "pipe", "ignore"] });
    proc.stdout.on("data", (c: Buffer) => chunks.push(c));
    proc.on("error", () => resolve(null));
    proc.on("close", (code) => {
      if (code !== 0) return resolve(null);
      const out = Buffer.concat(chunks).toString("utf8").trim();
      const first = out.split(/\r?\n/)[0]?.trim();
      resolve(first || null);
    });
  });
}

export async function hasBinary(name: string): Promise<boolean> {
  return (await resolveBinary(name)) !== null;
}

export interface RunOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  stdin?: string;
}

export async function runStreaming(
  command: string,
  args: string[],
  opts: RunOptions = {},
): Promise<number> {
  const resolved = (await resolveBinary(command)) ?? command;
  return new Promise((resolve, reject) => {
    const usingStdin = typeof opts.stdin === "string";
    const proc = spawn(resolved, args, {
      stdio: [usingStdin ? "pipe" : "inherit", "inherit", "inherit"],
      cwd: opts.cwd,
      env: opts.env ?? process.env,
      shell: false,
    });
    proc.on("error", reject);
    proc.on("close", (code) => resolve(code ?? 0));
    if (usingStdin && proc.stdin) {
      proc.stdin.write(opts.stdin!);
      proc.stdin.end();
    }
  });
}
