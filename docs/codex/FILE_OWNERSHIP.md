# File Ownership

Objetivo: abrir el area minima correcta.

| Responsabilidad | Dueno principal |
| --- | --- |
| Rutas publicas | `app/page.tsx`, `app/catalogo/`, `app/auth/` |
| Rutas de dashboard | `app/dashboard/` |
| Rutas admin | `app/admin/` |
| Shell y navegacion | `app/layout.tsx`, `app/globals.css`, `app/components/ui/AppShell.tsx`, `app/components/shared/PrimaryNavigation.tsx`, `app/components/shared/navigation-config.ts` |
| Supabase y env | `app/lib/supabase/` |
| Documentacion fuente | `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/SKILLS_AND_AGENTS.md` |
| Specs | `PLAN.md`, `specs/` |
| Capa tactica Codex | `AGENTS.md`, `docs/codex/` |

Reglas rapidas:

- si el cambio es de ruta, empezar por la carpeta de esa ruta
- si el cambio toca shell, abrir primero `layout.tsx` y navegacion
- si el cambio toca datos o auth, abrir primero `app/lib/supabase/`
- no mover responsabilidades entre areas sin pedido explicito

Escalacion riesgosa:

- UI/shared components -> `frontend-developer` o `ui-designer`
- routes/layout/env Next -> `nextjs-developer`
- Supabase/schema/RLS -> `database-administrator`, `postgres-pro` o `security-auditor`
- deploy/config/env -> `deployment-engineer`
- review final -> `code-reviewer`
