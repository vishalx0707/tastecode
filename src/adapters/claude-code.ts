import { join } from "node:path";
import { existsSync } from "node:fs";
import { upsertFenced, writeNew, type UpsertResult } from "../lib/fence.js";
import { POINTER_BLOCK } from "../templates/pointer.js";
import {
  CLAUDE_SLASH_COMMANDS,
  renderSlashCommand,
} from "../templates/claude-commands.js";

const SLASH_FILES = CLAUDE_SLASH_COMMANDS.map(
  (c) => `.claude/commands/${c.name}.md`,
);

export const claudeCode = {
  id: "claude-code",
  label: "Claude Code",
  files: ["CLAUDE.md", ...SLASH_FILES],
  fenced: true,
  detect(cwd: string): boolean {
    return existsSync(join(cwd, "CLAUDE.md")) || existsSync(join(cwd, ".claude"));
  },
  async install(cwd: string): Promise<{ file: string; result: UpsertResult }[]> {
    const out: { file: string; result: UpsertResult }[] = [];

    const pointer = join(cwd, "CLAUDE.md");
    out.push({ file: pointer, result: await upsertFenced(pointer, POINTER_BLOCK) });

    for (const cmd of CLAUDE_SLASH_COMMANDS) {
      const file = join(cwd, ".claude", "commands", `${cmd.name}.md`);
      out.push({ file, result: await writeNew(file, renderSlashCommand(cmd)) });
    }

    return out;
  },
};
