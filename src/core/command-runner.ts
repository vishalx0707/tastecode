import { spawn } from "node:child_process";
import { platform } from "node:process";

const WIN_EXEC_EXTS = [".exe", ".cmd", ".bat", ".com"];

function pickExecutable(lines: string[]): string | null {
  if (lines.length === 0) return null;
  if (platform !== "win32") return lines[0];
  const preferred = lines.find((l) =>
    WIN_EXEC_EXTS.some((ext) => l.toLowerCase().endsWith(ext)),
  );
  return preferred ?? lines[0];
}

function resolveBinary(name: string): Promise<string | null> {
  const isWin = platform === "win32";
  const command = isWin ? "cmd.exe" : "which";
  const args = isWin ? ["/c", "where", name] : [name];
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    const proc = spawn(command, args, { stdio: ["ignore", "pipe", "ignore"], shell: false });
    proc.stdout.on("data", (c: Buffer) => chunks.push(c));
    proc.on("error", () => resolve(null));
    proc.on("close", (code) => {
      if (code !== 0) return resolve(null);
      const out = Buffer.concat(chunks).toString("utf8").trim();
      const lines = out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      resolve(pickExecutable(lines));
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

function isCmdScript(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.endsWith(".cmd") || lower.endsWith(".bat");
}

export async function runStreaming(
  command: string,
  args: string[],
  opts: RunOptions = {},
): Promise<number> {
  const resolved = (await resolveBinary(command)) ?? command;
  const useCmdWrapper = platform === "win32" && isCmdScript(resolved);
  const spawnCommand = useCmdWrapper ? "cmd.exe" : resolved;
  const spawnArgs = useCmdWrapper ? ["/c", resolved, ...args] : args;

  return new Promise((resolve, reject) => {
    const usingStdin = typeof opts.stdin === "string";
    const proc = spawn(spawnCommand, spawnArgs, {
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
