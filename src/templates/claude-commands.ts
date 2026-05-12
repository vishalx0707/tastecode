export interface ClaudeSlashCommand {
  name: string;
  description: string;
  argumentHint?: string;
  body: string;
}

export const CLAUDE_SLASH_COMMANDS: ClaudeSlashCommand[] = [
  {
    name: "tastecode-reject",
    description:
      "TasteCode: log a rejection and offer to promote it to tastecode.md",
    argumentHint: "<reason>",
    body: `!tastecode reject "$ARGUMENTS"`,
  },
  {
    name: "tastecode-accept",
    description:
      "TasteCode: log a positive note and offer to promote it to tastecode.md",
    argumentHint: "<note>",
    body: `!tastecode accept "$ARGUMENTS"`,
  },
  {
    name: "tastecode-learn",
    description:
      "TasteCode: batch-promote pending feedback entries into tastecode.md",
    argumentHint: "[--select 1,3 | all]",
    body: `!tastecode learn $ARGUMENTS`,
  },
  {
    name: "tastecode-init",
    description: "TasteCode: create tastecode.md from the default template",
    body: `!tastecode init`,
  },
  {
    name: "tastecode-doctor",
    description:
      "TasteCode: show provider, pointer, and feedback-log status",
    body: `!tastecode doctor`,
  },
  {
    name: "tastecode-providers",
    description: "TasteCode: list available providers (built-in + custom)",
    body: `!tastecode providers`,
  },
];

export function renderSlashCommand(cmd: ClaudeSlashCommand): string {
  const fm: string[] = ["---", `description: ${cmd.description}`];
  if (cmd.argumentHint) fm.push(`argument-hint: ${cmd.argumentHint}`);
  fm.push("---", "");
  return `${fm.join("\n")}\n${cmd.body}\n`;
}
