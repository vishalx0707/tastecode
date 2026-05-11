import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export async function confirm(question: string, defaultYes = true): Promise<boolean> {
  const rl = createInterface({ input, output });
  try {
    const suffix = defaultYes ? "[Y/n]" : "[y/N]";
    const answer = (await rl.question(`${question} ${suffix} `)).trim().toLowerCase();
    if (!answer) return defaultYes;
    return answer === "y" || answer === "yes";
  } finally {
    rl.close();
  }
}

export async function multiSelect<T extends string>(
  question: string,
  choices: { value: T; label: string; selected: boolean }[],
): Promise<T[]> {
  const rl = createInterface({ input, output });
  try {
    output.write(`${question}\n`);
    choices.forEach((c, i) => {
      const mark = c.selected ? "x" : " ";
      output.write(`  ${i + 1}. [${mark}] ${c.label}\n`);
    });
    const raw = await rl.question(
      "Enter comma-separated numbers to toggle, or press Enter to accept: ",
    );
    const trimmed = raw.trim();
    if (trimmed) {
      const toggles = trimmed
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n) && n >= 1 && n <= choices.length);
      for (const n of toggles) {
        choices[n - 1].selected = !choices[n - 1].selected;
      }
    }
    return choices.filter((c) => c.selected).map((c) => c.value);
  } finally {
    rl.close();
  }
}
