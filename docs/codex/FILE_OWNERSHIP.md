# File Ownership

Objetivo: abrir el area minima correcta.

| Responsabilidad | Dueno principal |
| --- | --- |
| Rutas publicas | `app/page.tsx`, `app/catalogo/`, `app/auth/` |
| Home mobile (`/`, <1024) | `app/components/home/`, `app/lib/home-dashboard.ts`; reglas en `DESIGN.md` §10 |
| Semana activa mobile (`/rutinas`, <1024) | `app/rutinas/page.tsx`, `app/components/rutinas/`, `app/lib/routine-week.ts` (lógica pura + `tests/unit/`); reglas en `DESIGN.md` §12. Desktop: `app/rutinas/RutinasOverview.tsx`, `WeekDaysList.tsx` |
| Alimentos mobile (`/alimentos`, <1024) | `app/alimentos/page.tsx`, `app/components/alimentos/`, `app/lib/food-catalog.ts` (lógica pura + `tests/unit/`); reglas en `DESIGN.md` §13. Desktop: `app/alimentos/NutritionCatalogClient.tsx` |
| Rutas de dashboard | `app/dashboard/` |
| Registro de entrenamiento y progresión | `app/rutinas/dia/` (desktop: cards), `app/components/workout/` (mobile <1024), `app/lib/day-workout.ts` y `app/lib/workout-progression.ts` (lógica pura + `tests/unit/`), `app/lib/workout-tracking.ts` (lecturas); reglas en `DESIGN.md` §11 |
| Sync offline del registro | contrato `app/lib/workout-sync-contract.ts` (versionado), `app/api/workouts/sync/`, `app/lib/workout-sync.ts`, `app/lib/workout-sync-queue.ts`; modelo en `docs/DATABASE.md` (F1) |
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
