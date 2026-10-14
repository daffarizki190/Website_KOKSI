# AGENTS.md - Engineering & Design Guidelines

> Workspace instructions for AI coding assistants. Adheres to strict anti-slop engineering, modern UI aesthetics, clean code, and concise communication standards.

---

## 1. UI & Design Craft (Taste-Skill & Impeccable)

- **Banned AI Tropes**:
  - **No AI Purple Slop**: Do not use cliché violet/purple gradients (`from-purple-500 to-indigo-600`), neon blurred glow rings, or generic centered 3-column feature cards with floating rounded icons.
  - **Intentional Palettes**: Use cohesive, purpose-driven colors tailored to the brand identity. Favor clean neutrals, rich dark modes, or muted, sophisticated accents.
- **Typography & Hierarchy**:
  - Establish a disciplined typographic scale. Avoid oversized headings paired with weak body copy.
  - Maintain clear contrast ratios that meet WCAG AA standards.
- **Layout & Spacing Rhythm**:
  - Follow an 8pt/4pt grid system (`gap-2`, `gap-4`, `gap-6`, `p-4`, `p-6`). Never mix arbitrary padding values (`p-[13px]`).
  - Layouts must be dense, purposeful, and responsive across mobile, tablet, and desktop viewports.
- **Accessibility & Component Quality**:
  - Always use semantic HTML (`<main>`, `<nav>`, `<section>`, `<article>`, `<button>`). Never use `<div onClick=...>` without proper role and keyboard handlers.
  - Ensure interactive elements have visible `:focus-visible` styles, valid labels (`aria-label` on icon buttons), and proper button types (`type="button"` vs `type="submit"`).
  - Micro-interactions must feel snappy and understated (`transition-colors duration-150`), avoiding excessive bouncy motion that hinders usability.

---

## 2. Clean Code Standards (Anti-Slop)

- **Zero Trivial Comments**:
  - Ban obvious comments that narrate what the code already says (e.g., `// state for loading`, `// handle click event`, `// return JSX`).
  - Only write comments to explain non-obvious business logic, workarounds for browser/library quirks, or complex algorithmic choices (*the "why", never the "what"*).
- **TypeScript & Architecture**:
  - Maintain strict typing: eliminate `any` in favor of precise interfaces, union types, or generics.
  - Keep components modular, focused, and single-responsibility.
  - Do not introduce unnecessary abstractions, premature design patterns, or bloated helper wrappers.
- **Hygiene & Dead Code**:
  - Remove unused imports, dead variables, deprecated commented-out code, and temporary `console.log` statements before completing tasks.

---

## 3. Communication & Tone (Stop-Slop & Humanizer)

- **Cut Throat-Clearing**:
  - Eliminate filler pleasantries and opening rhetoric (e.g., *"Certainly! I'd be delighted to help you with that"*, *"In this section, we will delve into..."*).
  - Begin responses immediately with the solution, action, or code diff.
- **Natural, Direct Prose**:
  - Avoid AI cliché vocabulary: *"seamless"*, *"delve"*, *"testament"*, *"tapestry"*, *"revolutionize"*, *"crucial"*, *"game-changer"*, *"in conclusion"*.
  - Write with a natural, grounded human engineering tone.
- **Controlled Formatting**:
  - Do not turn every response into an endless list of bullet points. Write concise paragraphs for explanations, and use code blocks or tables where structured comparison is required.
  - Maximize information density while minimizing token waste.

---

## 4. Documentation & Commits (Avoid-AI-Writing)

- **Git Commits**:
  - Follow the Conventional Commits specification: `feat:`, `fix:`, `refactor:`, `perf:`, `chore:`, `test:`.
  - Write concise, active-voice imperative commit messages (e.g., `feat(chat): implement realtime typing indicator`).
  - Never write fluffy multi-paragraph commit bodies filled with AI marketing speak.
- **README & PR Descriptions**:
  - Focus purely on what changed, why it changed, and how to verify/test it.
  - Stick to factual, reproducible technical details.
