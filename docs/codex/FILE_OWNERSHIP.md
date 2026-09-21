# File Ownership

Objetivo: abrir el area minima correcta.

| Responsabilidad | Dueno principal |
| --- | --- |
| Rutas publicas | `app/page.tsx`, `app/catalogo/`, `app/auth/` |
| Home mobile (`/`, <1024) | `app/components/home/`, `app/lib/home-dashboard.ts`, `app/lib/home-hero.ts` (vistas del hero, puro + `tests/unit/`); reglas en `DESIGN.md` §10 |
| Días de entreno (elegir, editar, qué toca hoy) | `app/lib/training-schedule.ts` (lógica pura + `tests/unit/`), `app/components/rutinas/TrainingDaysPicker.tsx`, `TrainingDaysSheet.tsx`, `TrainingDaysEditButton.tsx`; guardado en `app/lib/saved-routines.ts`; columna `saved_routines.training_weekdays`; reglas en `DESIGN.md` §12.3 |
| Semana activa mobile (`/rutinas`, <1024) | `app/rutinas/page.tsx`, `app/components/rutinas/`, `app/lib/routine-week.ts` (lógica pura + `tests/unit/`); reglas en `DESIGN.md` §12. Desktop: `app/rutinas/RutinasOverview.tsx`, `WeekDaysList.tsx` |
| Alimentos mobile (`/alimentos`, <1024) | `app/alimentos/page.tsx`, `app/components/alimentos/`, `app/lib/food-catalog.ts` (lógica pura + `tests/unit/`); reglas en `DESIGN.md` §13. Desktop: `app/alimentos/NutritionCatalogClient.tsx` |
| Recetas mobile (`/recetas`, <1024) | `app/recetas/page.tsx` (árbol mobile + desktop `hidden lg:contents`), `app/components/recetas/`, `app/lib/recipe-catalog.ts` (lógica pura + `tests/unit/`); reglas en `DESIGN.md` §18. Desktop: `app/recetas/RecipeCatalogClient.tsx`. Reusa `FoodSearchBar`, `FoodChips` y `MacroRing` de `app/components/alimentos/` y `RecipeForm` de `app/components/shared/`. El link `?receta=` lo lee `app/nutricion/registro/page.tsx` |
| Registro de comidas mobile (`/nutricion/registro`, <1024) | `app/components/registro/` (árbol mobile, sheets, `useDiaryActions`, `useDiaryPager`), `app/lib/meal-diary.ts` y `app/lib/meal-amounts.ts` (lógica pura + `tests/unit/`); reglas en `DESIGN.md` §14. Desktop: `app/nutricion/registro/RegistroClient.tsx` (dueño del estado, árbol `hidden lg:contents`) y `FoodPicker.tsx`. Compartidos: `app/components/ui/NumberStepper.tsx` + `app/lib/number-input.ts`, `app/components/ui/SegmentedControl.tsx`, `app/components/ui/ArcGauge.tsx`, `app/components/ui/use-media-query.ts`, `app/components/shared/GoalSetupStep.tsx` (home y registro) |
| Catálogo mobile (`/catalogo`, <1024) | `app/catalogo/page.tsx` (árbol mobile), `app/components/catalogo/`, `app/lib/routine-catalog.ts` (lógica pura + `tests/unit/`); reglas en `DESIGN.md` §16. Desktop: `app/catalogo/RoutineCatalogClient.tsx`. Compartidos: `app/components/shared/FilterPanel.tsx` (sheet de filtros de 4, 7, 8 y admin), `app/components/shared/RoutineCoverImage.tsx` (recorte de portadas) |
| Detalle de rutina mobile (`/catalogo/rutinas/[id]`, <1024) | `app/catalogo/rutinas/[id]/page.tsx` (árbol mobile + desktop `hidden lg:contents`, server actions en `actions.ts`), `app/components/rutina-detalle/`, `app/lib/routine-detail.ts` (lógica pura + `tests/unit/`); reglas en `DESIGN.md` §19. Desktop: el resto de `page.tsx` y `RoutineDetailClient.tsx`. Reusa `RoutineCover`, `DayTabs` y `WeekStats` de `app/components/rutinas/` |
| Configuración mobile (`/configuracion`, <1024) | `app/configuracion/` (`page.tsx`, `ConfiguracionClient.tsx` con los dos árboles, `useProfileForm.ts` con estado y autosave compartidos), `app/components/configuracion/`, `app/lib/profile-plan.ts` (lógica pura + `tests/unit/`); reglas en `DESIGN.md` §15. Desktop: árbol `hidden lg:grid` de `ConfiguracionClient.tsx`. Usa `NumberStepper` y `SegmentedControl` de `app/components/ui/` |
| Acceso mobile (`/auth/login`, <1024) | `app/auth/login/page.tsx` (árbol mobile + card desktop `hidden lg:grid`), `app/components/auth/` (`LoginWelcome`, `EmailLoginSheet`, `GoogleButton`, `LoginNotice`, `useOtpFlow` compartido con `app/auth/login/OtpLoginFlow.tsx`), `app/lib/auth-otp.ts` (textos, validación y pedidos + `tests/unit/`), `InputOtp variant="display"`; reglas en `DESIGN.md` §17. API: `app/api/auth/` |
| Rutas de dashboard | `app/dashboard/` |
| Registro de entrenamiento y progresión | `app/rutinas/dia/` (desktop: cards), `app/components/workout/` (mobile <1024), `app/lib/day-workout.ts` y `app/lib/workout-progression.ts` (lógica pura + `tests/unit/`), `app/lib/workout-tracking.ts` (lecturas); reglas en `DESIGN.md` §11 |
| Sheet del ejercicio (mobile <1024) | `app/components/exercise/` (ficha, plan, gráfico, historial; lo abre `app/components/shared/ExerciseDetailModal.tsx`, que en ≥1024 conserva el sheet lateral), `app/lib/exercise-history.ts` (lógica pura + `tests/unit/`); reglas en `DESIGN.md` §11.4 |
| Sheets con teclado (todas las rutas, mobile) | `app/components/ui/Drawer.tsx` (vaul) y `Sheet.tsx` (Radix) enganchan `app/components/ui/use-sheet-viewport.ts` (apoyo sobre el teclado, campo con foco visible, tocar afuera cierra el teclado); lógica pura en `app/lib/sheet-keyboard.ts` (+ `tests/unit/`); CSS en `app/globals.css`; reglas en `DESIGN.md` §4 |
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
