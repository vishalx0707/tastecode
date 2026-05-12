import { listProviders } from "../providers/index.js";

export async function runProviders(cwd: string): Promise<number> {
  const providers = await listProviders(cwd);
  console.log("");
  console.log("Providers");
  console.log("---------");
  if (providers.length === 0) {
    console.log("(none)");
    console.log("");
    return 0;
  }
  for (const p of providers) {
    const ok = await p.installed();
    const args = (p.spec.args ?? []).join(" ");
    const mode = p.spec.stdin ? "stdin" : "argv";
    console.log(
      `  ${p.name.padEnd(12)} ${p.source.padEnd(8)} ${ok ? "available" : "missing  "}  ` +
        `${p.spec.command}${args ? " " + args : ""}  [${mode}]`,
    );
  }
  console.log("");
  console.log("Add custom providers in tastecode.config.json — see README.");
  console.log("");
  return 0;
}
