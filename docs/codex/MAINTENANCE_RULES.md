# Codex context layer maintenance rules

## Purpose

`docs/codex/` exists to reduce future Codex token usage.

These files should help agents quickly answer:
- what should I read?
- what should I edit?
- what should I avoid?
- what command should I run?
- what output format should I use?

## Non-goals

Do not use `docs/codex/` for:
- full architecture explanations
- tutorials
- speculative roadmap
- duplicated documentation
- long prose
- implementation details already documented elsewhere

## Allowed changes

Update `docs/codex/` only when:
- a new feature adds new files/routes/actions
- a new env var is introduced
- a new command is added to `package.json`
- a new validation/test path exists
- ownership of a folder changes
- a repeated prompt becomes useful enough to reuse
- a relevant skill or subagent enters or leaves the repo

## Required checks before editing

Before editing this layer:
1. Search existing docs first.
2. Reuse source-of-truth docs by reference.
3. Do not copy long sections.
4. Prefer one-line entries.
5. Leave TODOs only if they are specific and short.
6. Keep installed skill/subagent names exact.
7. If routing detail lives in `SKILL_ROUTING.md`, do not duplicate it in full elsewhere.

## Size budget

Recommended maximums:
- `AGENTS.md`: 120 lines
- `ROUTING_GRAPH.md`: 80 lines
- `COMMANDS.md`: 60 lines
- `ENV_INDEX.md`: 80 lines
- `TEST_MATRIX.md`: 60 lines
- `FILE_OWNERSHIP.md`: 80 lines
- `PROMPT_TEMPLATES.md`: 160 lines

If a file exceeds the budget, compact before adding more.
