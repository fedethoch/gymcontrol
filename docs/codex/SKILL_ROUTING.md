# SKILL_ROUTING

Use this file to choose skills and subagents without overloading context.

## Rule of thumb

| Task size | Use |
| --- | --- |
| Small single-file edit | Normal Codex only |
| Medium specialized task | One skill |
| Unknown bug | `debugger` |
| Risky DB/auth/deploy/security task | One relevant subagent |
| Large cross-cutting feature | 2-3 subagents max |

## Skills

| Task | Skill | Use when | Do not use when |
| --- | --- | --- | --- |
| Frontend/UI design | `frontend-design` | visual work on screens or components | pure DB/auth task |
| Local web testing | `webapp-testing` | validating flows or browser behavior | no runnable app |
| Next.js patterns | `next-best-practices` | routing, rendering, env, app-router patterns | non-Next code |
| Next.js cache/PPR | `next-cache-components` | cache components or PPR are involved | generic UI tweak |
| Next.js upgrade | `next-upgrade` | framework upgrade or migration work | ordinary feature work |
| Supabase/Postgres/RLS | `supabase-postgres-best-practices` | schema, RLS, queries, policies | pure UI styling |
| Web performance | `core-web-vitals` | CWV, layout shifts, responsiveness | early small UI change |
| Web quality audit | `web-quality-audit` | broad site quality review | single narrow bug |
| Accessibility | `accessibility` | WCAG, keyboard, screen reader, a11y review | pure backend task |
| Better Auth general | `better-auth-best-practices` | Better Auth setup or patterns | auth provider not in use |
| Better Auth email/password | `better-auth-emailAndPassword` | email/password auth flows | non-auth task |

## Subagents

| Task | Primary subagent | Optional support | Use only if |
| --- | --- | --- | --- |
| Unknown bug | `debugger` | relevant specialist | cause is unclear |
| UI implementation | `frontend-developer` | `ui-designer` | medium/large UI work |
| Visual quality | `ui-designer` | `ui-ux-tester` | aesthetics matter |
| User-flow testing | `ui-ux-tester` | none | flow behavior matters |
| Next.js issue | `nextjs-developer` | `deployment-engineer` | routing, rendering, env involved |
| TypeScript issue | `typescript-pro` | `frontend-developer` | types block progress |
| Backend implementation | `backend-developer` | `typescript-pro` | server logic is the main risk |
| Supabase data/schema | `database-administrator` | `postgres-pro` | DB structure is involved |
| SQL/RLS/policies | `postgres-pro` | `security-auditor` | SQL or policy logic is involved |
| Deploy/env/build | `deployment-engineer` | `nextjs-developer` | prod/local mismatch exists |
| Security/auth/RLS | `security-auditor` | `postgres-pro` | secrets, auth, permissions involved |
| Diff review | `code-reviewer` | `security-auditor` | reviewing larger or riskier changes |
| Context optimization | `context-manager` | none | `AGENTS.md` or `docs/codex/` drift |

## Hard limits

- Do not use subagents for copy changes, minor CSS, imports, renames, or single-file edits.
- Do not use more than 3 subagents unless explicitly approved.
- Prefer one primary subagent plus one optional support.
- Subagents should return compact findings, not long essays.
- If a skill and subagent overlap, use the skill first unless risk is high.
