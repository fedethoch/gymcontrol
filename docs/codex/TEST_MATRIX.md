# Test Matrix

| Cambio | Validacion minima |
| --- | --- |
| UI / componentes | `pnpm lint` |
| Rutas / paginas | `pnpm check` |
| Mobile/PWA visual | `pnpm check:ui` con `pnpm dev` activo |
| Auth con Supabase Auth | `pnpm check` + `pnpm validate:mobile` + validacion manual minima de Google OAuth, logout, redirecciones y rol si aplica |
| Supabase / migraciones | revisar SQL afectado y contrastar con `docs/DATABASE.md`; usar MCP si aplica |
| RLS / policies | revisar SQL y policies contra `docs/DATABASE.md`; validar escenarios `anon`, `authenticated`, `admin` y propietario si aplica |
| Env / deploy | `pnpm build` y revisar `docs/codex/ENV_INDEX.md` |
| Integracion ExerciseDB / demostraciones | `pnpm check` + `pnpm exercisedb:audit` con API key disponible + validar que `EXERCISEDB_API_KEY` no aparece en cliente + prueba manual/Playwright del modal en desktop/mobile |
| Docs | no correr tests |

Fallback actual: `pnpm lint`, `pnpm build`, `pnpm validate:mobile` o validacion manual minima.

## Skill/subagent validation

| Skill/subagent | Validation |
| --- | --- |
| `frontend-design` | `pnpm build` + chequeo manual UI |
| `webapp-testing` | flujo local/manual si hay app corrible; si no, fallback manual |
| `next-best-practices` | `pnpm build` + route/render check |
| `next-cache-components` | `pnpm build` + route/render check |
| `next-upgrade` | `pnpm build` + route/render check |
| `supabase-postgres-best-practices` | contraste manual con `docs/DATABASE.md` y chequeos Supabase si aplica |
| `core-web-vitals` | `pnpm build` + notas de performance |
| `web-quality-audit` | auditoria manual breve + fallback manual |
| `accessibility` | chequeo manual de a11y + fallback manual |
| `better-auth-best-practices` | no aplica en GymControl mientras el proyecto use Supabase Auth |
| `better-auth-emailAndPassword` | no aplica en GymControl mientras el proyecto use Supabase Auth |
| `debugger` | reproducir o aislar causa |
| `frontend-developer` | `pnpm build` + chequeo manual UI |
| `ui-designer` | `pnpm build` + chequeo visual manual |
| `ui-ux-tester` | flujo local/manual si la app corre; si no, fallback manual |
| `nextjs-developer` | `pnpm build` + route/render/env check |
| `typescript-pro` | `pnpm build` |
| `backend-developer` | `pnpm build` |
| `database-administrator` | contraste manual con `docs/DATABASE.md` y chequeos Supabase si aplica |
| `postgres-pro` | contraste manual con `docs/DATABASE.md` y chequeos Supabase si aplica |
| `deployment-engineer` | `pnpm build` + env/deploy check |
| `security-auditor` | revisar auth/RLS/secrets sin tests inventados |
| `code-reviewer` | review sobre diff o archivos cambiados |
| `context-manager` | verificar consistencia entre `AGENTS.md` y `docs/codex/` |

Si entra una nueva integracion, agregar caso especifico.
