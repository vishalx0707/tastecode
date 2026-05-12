const MAX_TASTE_CHARS = 30_000;

export function buildTastePrompt(task: string, taste: string): string {
  const safeTaste = taste.length > MAX_TASTE_CHARS
    ? taste.slice(0, MAX_TASTE_CHARS) + "\n\n[...trimmed for prompt size]"
    : taste;

  return `You are working inside a project that uses TasteCode.

Before coding, follow this project taste:

---
${safeTaste.trim()}
---

User task:
${task.trim()}

Rules:
- Follow the TasteCode file strictly.
- Match the existing project style.
- Make minimal useful edits.
- Avoid unrelated changes.
- Avoid unnecessary syntax.
- Avoid unnecessary abstractions.
- Avoid unnecessary files.
- Avoid unnecessary dependencies.
- Prefer readable, simple code.
- Show a concise summary or diff of changes.
`;
}
