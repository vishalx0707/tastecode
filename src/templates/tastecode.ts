export const DEFAULT_TASTECODE_MD = `# TasteCode

## Project Style
- Follow the existing project structure.
- Keep code simple and readable.
- Do not over-engineer.
- Do not create unnecessary files or folders.
- Reuse existing components before creating new ones.
- Avoid changing unrelated parts of the project.

## Tech Preferences
- Use the package manager already used by the project.
- Use TypeScript when the project uses TypeScript.
- Use Tailwind CSS for styling if already present.
- Use existing UI components before adding new ones.
- Use the existing validation library when validation is needed.
- Use the existing test framework when tests are needed.

## UI Taste
- Keep UI clean, modern, and minimal.
- Use good spacing.
- Avoid clutter.
- Keep screens mobile responsive.
- Follow the current design style of the project.

## Syntax Taste
- Use the simplest syntax that solves the problem.
- Avoid advanced TypeScript unless it is actually needed.
- Do not create interfaces, types, generics, enums, utility types, or abstractions for simple components.
- Prefer plain functions and simple props.
- Do not overuse useMemo, useCallback, custom hooks, classes, factories, or design patterns.
- Do not make reusable components unless the same pattern appears at least 2-3 times.
- Avoid deeply nested code.
- Avoid clever one-liners.
- Prefer readable code over smart code.
- Only add complex syntax when it improves safety, readability, or maintainability.

## Avoid AI Overcoding
Do not add:
- unnecessary interfaces
- unnecessary generic types
- unnecessary helper functions
- unnecessary wrappers
- unnecessary config files
- unnecessary abstraction layers
- unnecessary state management
- unnecessary comments for obvious code
- unnecessary dependencies
- unnecessary folders

## Simplicity Rule
Before writing code, ask:

Can this be done with less syntax?

If yes, use the simpler version.

## Coding Rules
- Match the current code style.
- Keep components small.
- Make minimal changes.
- Explain major changes briefly.
- Do not break existing features.
- Show a diff or summary before finalizing changes.

## Things I Dislike
- Too many files.
- Random libraries.
- Overcomplicated architecture.
- Ugly UI.
- Code that looks fancy but is hard to understand.
- AI-generated boilerplate that is not needed.
`;
