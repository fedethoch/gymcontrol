# Routing Graph

Usar este indice para decidir rapido que abrir. Para detalle funcional, ir a las fuentes de verdad.

| Feature | Frontend | Backend / lib | Datos |
| --- | --- | --- | --- |
| Home | `app/page.tsx` | Ninguno | Ninguno |
| Shell y navegacion | `app/layout.tsx`, `app/globals.css`, `app/components/ui/AppShell.tsx`, `app/components/shared/PrimaryNavigation.tsx`, `app/components/shared/navigation-config.ts` | Ninguno | Ninguno |
| Login y sesion | `app/auth/login/page.tsx`, `app/auth/login/OtpLoginFlow.tsx`, `app/auth/google/start/route.ts`, `app/auth/callback/route.ts` | `app/api/auth/request-otp/route.ts`, `app/api/auth/verify-otp/route.ts`, `app/lib/auth.ts`, `app/lib/auth-input.ts`, `app/lib/otp-rate-limit.ts`, `app/lib/supabase/server.ts` | `auth.users`, `profiles` |
| Auth, roles y guards | rutas protegidas de `app/dashboard/` y `app/admin/` | `app/lib/supabase/`, middleware o guards server-side segun el paso activo | `auth.users`, `profiles` |
| RLS y policies | revisar `supabase/migrations/`, `specs/G5.5-rls-and-policies/` | consultas SQL y validacion Supabase | `profiles`, `exercises`, `routine_templates`, `routine_days`, `routine_items`, `saved_routines` |
| Catalogo | `app/catalogo/page.tsx`, `app/catalogo/rutinas/page.tsx`, `app/components/shared/RoutineTablePreview.tsx`, `app/components/shared/WeekSchedulePreview.tsx` | `app/lib/supabase/` | `routine_templates`, `routine_days`, `routine_items`, `exercises` |
| Dashboard usuario | `app/dashboard/page.tsx`, `app/dashboard/rutinas/page.tsx`, `app/dashboard/rutinas/dia/page.tsx`, `app/dashboard/rutinas/dia/DayWorkoutClient.tsx` | `app/lib/supabase/`, `app/lib/saved-routines.ts`, `app/lib/workout-tracking.ts` | `saved_routines`, `routine_templates`, `routine_days`, `routine_items`, `exercises`, `workout_sessions`, `workout_session_items` |
| Admin | `app/admin/page.tsx`, `app/admin/ejercicios/page.tsx`, `app/admin/rutinas/page.tsx`, `app/admin/alimentos/page.tsx`, `app/admin/dietas/page.tsx` | `app/lib/supabase/` | `profiles`, `exercises`, `routine_templates`, `routine_days`, `routine_items`, `foods`, `diet_templates`, `diet_template_meals` |
| Nutricion | `app/nutricion/page.tsx`, `app/nutricion/perfil/page.tsx`, `app/nutricion/dietas/page.tsx`, `app/nutricion/dietas/[id]/page.tsx`, `app/nutricion/registro/page.tsx`, `app/admin/alimentos/`, `app/admin/dietas/` | `app/lib/foods.ts`, `app/lib/diet-templates.ts`, `app/lib/nutrition-profile.ts`, `app/lib/nutrition-calc.ts`, `app/lib/nutrition-suggest.ts`, `app/lib/saved-diets.ts`, `app/lib/meal-logs.ts` | `foods`, `diet_templates`, `diet_template_meals`, `nutrition_profiles`, `saved_diets`, `meal_logs`, `meal_log_items` |
| Continuidad post-MVP | auth dual ya implementada y siguientes frentes funcionales | revisar `PLAN.md`, `README.md` y `docs/architecture/` | revisar `docs/DATABASE.md` |

Fuentes: `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `specs/`
