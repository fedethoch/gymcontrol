# Plan: Admin dashboard + Ejercicios + Rutinas (design impl) + lupita fix

## Context

A Claude Design handoff bundle (`gymcontrol-design-system`) ships three admin screens —
**Admin Dashboard.html**, **Admin Ejercicios.html**, **Admin Rutinas.html** — plus a README
defining the GymControl dark/violet design language. Two of the three share-URLs were dead
(404); all three HTMLs were recovered from the third URL's `.tar.gz` bundle and read locally.

The app already has the routes (`app/admin`, `app/admin/ejercicios`, `app/admin/rutinas`)
with working create/edit clients, the shared sidebar (`PrimaryNavigation`), and `:root` design
tokens in `app/globals.css`. So this is **augmenting real pages to match the designs with REAL
data**, not greenfield. The designs' own sidebars are redundant (global shell already provides one).

User decisions (confirmed):
1. Ejercicios → **add DB columns** `muscle_group`, `equipment`, `video_url` for full design fidelity.
2. Rutinas → **keep the rich per-exercise builder** for create/edit; wrap it in the design's
   table + sort/filter/pagination + detail drawer + delete shell.
3. **Add** `deleteExercise`/`deleteRoutine` actions, **real** Actividad reciente (merge recent rows,
   no audit table), and **usersCount** on routines.

Goal: the three admin screens look and behave like the designs, backed entirely by real Supabase data.

---

## Design tokens (mapping)

Designs use `--gc-*`; the app uses `:root` vars in `app/globals.css` (L3-18). Reuse existing ones —
do **not** introduce `--gc-*`. Map: `--gc-card`→`--card`, `--gc-card-alt`→`--card-alt`,
`--gc-border`→`--border`, `--gc-border-strong`→`--border-strong`, `--gc-accent`→`--accent`,
`--gc-accent-bright`→`--accent-bright`, `--gc-foreground-muted`→`--foreground-muted`,
`--gc-foreground-subtle`→ use `#7d8697` (already used in admin/page.tsx). Radii/shadows: match
existing admin styling (`rounded-xl`, `border-[var(--border)]`, the dashboard's tile pattern).
Icons: `lucide-react` only (project rule). Pages wrap content in `.page-frame` like `app/admin/page.tsx:63`.

---

## Part A — DB migration (Supabase)

Use the `supabase_gymcontrol` MCP; update `docs/DATABASE.md` (source of truth) to match.

`exercises` table — add three nullable columns:
- `muscle_group text` — CHECK in (`Pecho,Espalda,Piernas,Hombros,Biceps,Triceps,Core`) or NULL.
- `equipment text` — CHECK in (`Barra,Mancuernas,Maquina,Polea,Peso corporal,Kettlebell`) or NULL.
- `video_url text` — nullable.

(Keep accents out of stored enum values to avoid encoding issues; map to accented labels in UI.)
Migration is additive/backward-compatible. After applying, run `graphify update .`.

---

## Part B — Data layer changes

**`app/lib/exercises.ts`**
- Extend `ExerciseRow`, `ExerciseCatalogItem`, `AdminExerciseListItem` with `muscleGroup`,
  `equipment`, `videoUrl` (camelCase; map from snake_case columns).
- Add to `listAdminExercises` SELECT + mapper.
- Add `deleteExercise(id)` (admin-gated mutation; row delete).

**`app/lib/exercise-form.ts` / `exercise-validation.ts`**
- Add `muscleGroup`, `equipment`, `videoUrl` to `ExerciseFormPayload`; validate enum membership
  (nullable) + URL shape (optional) in `parseExercisePayload`.

**`app/admin/ejercicios/actions.ts`**
- Persist the three new fields in create/update branch of `saveExerciseAction`.
- Add `deleteExerciseAction(id)` (`"use server"`, `requireAdmin`, `revalidatePath("/admin/ejercicios")`).

**`app/lib/routines.ts`**
- Add `usersCount` to `AdminRoutineListItem`: count `saved_routines` grouped by
  `routine_template_id` (single grouped query, joined into `listAdminRoutines`). Falls back to 0.
- Add `deleteRoutine(id)` (admin-gated; delete template — children cascade via existing
  child-delete helpers / FK).

**`app/admin/rutinas/actions.ts`**
- Add `deleteRoutineAction(id)` (`requireAdmin`, revalidate `/admin/rutinas`, `/catalogo`,
  `/catalogo/rutinas/[id]`).

**`app/lib/admin-stats.ts`** — add two real aggregators:
- `getManagementSummary()` → `{ activeRoutines, newExercisesThisWeek, usersWithRoutinePct }`:
  - `activeRoutines` = count `saved_routines` where `is_active = true`.
  - `newExercisesThisWeek` = count `exercises` where `created_at >= now()-7d`.
  - `usersWithRoutinePct` = round(100 × distinct `saved_routines.user_id` ÷ count `profiles`
    where `type_rol='user'`); guard divide-by-zero → 0.
- `getRecentActivity(limit=6)` → merged real feed, no new table. Query the most recent N rows
  from: `exercises` (created_at), `routine_templates` (created_at = "creada", updated_at >
  created_at = "actualizada"), `profiles` user role (created_at = "Usuario nuevo"),
  `saved_routines` (saved_at = "Rutina guardada"). Normalize to
  `{ kind, action, detail, at }`, sort by `at` desc, slice to `limit`. Map `kind`→lucide icon +
  relative date label (`Hoy`/`Ayer`/`es-AR` date) in the component.

---

## Part C — Admin Dashboard (`app/admin/page.tsx`)

Add the two missing design cards; keep existing tiles/tables. Target layout from
`Admin Dashboard.html`: stat tiles row → **two-col [Actividad reciente | (Acciones rápidas +
Resumen de gestión)]** → two-col [Últimos ejercicios | Últimas rutinas].

- **Actividad reciente** card (new): `CardHeader`/`CardTitle` + a `Table` (Acción / Detalle /
  Fecha). Rows from `getRecentActivity()`. Each Acción cell = icon chip (lucide per `kind`:
  `Plus` rutina nueva, `Dumbbell` ejercicio, `Pencil` actualizada, `UserPlus` usuario nuevo,
  `Bookmark` guardada) + label. Footer link "Ver toda la actividad" (static for now).
- **Resumen de gestión** card (new): sits under "Acciones rápidas" in the right column. Three
  rows (label left, accent value right) from `getManagementSummary()`: "Rutinas activas",
  "Ejercicios nuevos esta semana", "Usuarios con rutina asignada" (`%`). Match
  `.resumen-row`/`.resumen-value` styling with existing token classes.
- Fetch both new aggregators in the page's `Promise.all` (alongside `getAdminStats` etc.).
- Reuse existing `Card`, `Table`, `Badge`, `SectionEyebrow`. Copy uses Rioplatense voseo
  ("Supervisá…", already present).

---

## Part D — Admin Ejercicios (`app/admin/ejercicios/`)

Rebuild the page to the design's table-centric UX, **reusing the existing create/edit flow**.

- **`page.tsx`** — also fetch nothing new beyond `listAdminExercises()` (now carries the 3 fields).
- **`ExerciseAdminClient.tsx`** — restructure to match `Admin Ejercicios.html`:
  - Header: eyebrow "Gestión / Ejercicios", title, "Nuevo ejercicio" primary button.
  - **Stats strip** (3 tiles): Total de ejercicios, Agregados esta semana (`created_at` ≥ 7d),
    Grupos musculares (distinct non-null `muscleGroup`). Computed client-side from the list.
  - **Filter bar**: search input (lupita centered — see Part F pattern), Grupo muscular select,
    Equipamiento select, result count.
  - **Table**: sortable headers (Ejercicio / Grupo muscular / Equipamiento / Agregado / Acciones),
    muscle/equipment badges (color map from design's `MBADGE`), gradient thumb by muscle
    (`MGRAD`), per-row Editar/Eliminar buttons, empty state, **pagination** (8/page).
  - **Create/Edit drawer**: reuse the existing form logic + `saveExerciseAction`; add the new
    fields — Grupo muscular `<select>`, Equipamiento `<select>`, URL de video input (link icon).
    Use existing `app/components/ui/*` (Input, Select, Textarea, Button, Dialog/Sheet) styled to
    the design's drawer; keep `ExerciseFormState`/error handling.
  - **Delete confirm modal** → `deleteExerciseAction`; success toast.
- Convert design's inline-CSS classes to Tailwind + existing tokens (no `<style>` blocks, no
  `--gc-*`). Mobile-first.

---

## Part E — Admin Rutinas (`app/admin/rutinas/`)

Same shell strategy; **preserve the rich builder**.

- **`page.tsx`** — keep fetching `listAdminRoutines()` (now with `usersCount`) +
  `listExerciseCatalogItems()`.
- **`RoutineAdminClient.tsx`** — wrap existing builder in the design's shell from
  `Admin Rutinas.html`:
  - Header (eyebrow "Gestión / Rutinas", title, "Nueva rutina" button).
  - **Stats strip**: Total de rutinas, Promedio de días (`avg dayCount`), Usuarios activos
    (`sum usersCount`).
  - **Filter bar**: search, Dificultad select (`ROUTINE_DIFFICULTY_LABELS`), Objetivo select
    (`ROUTINE_OBJECTIVE_LABELS`), count.
  - **Table**: sortable (Rutina / Dificultad / Objetivo / Días [day-dots] / Ej./día / Usuarios /
    Creada / Acciones) with difficulty+objective badges (map design `DIFF`/`OBJ` to the real
    `principiante|intermedio|avanzado` × `hipertrofia|fuerza|mantenimiento` enums — note design's
    "Definición/General" don't exist; use the real 3 objectives), Usuarios = `usersCount`,
    Ver/Editar/Eliminar actions, empty state, **pagination** (6/page).
  - **Detail drawer** (Ver): read-only — badges, stats row (Días / Ejercicios total / Usuarios),
    per-day cards listing exercise tags from the real `days[].items[].exercise`.
  - **Create/Edit**: open the **existing** multi-day builder (per-exercise series/reps/rir/rest) →
    `saveRoutineAction`. Do NOT replace with the design's day-name-only form.
  - **Delete confirm** → `deleteRoutineAction`; toast.
- Tailwind + existing tokens; lucide icons; mobile-first.

---

## Part F — Catalogo lupita fix (`app/catalogo/RoutineCatalogClient.tsx`)

Bug (`:109-119`): `<Search className="... absolute left-3 inset-y-0 my-auto size-4 ...">` centers
against the `<label>` box (which also wraps an `sr-only` span), not the `h-12` input → icon sits
low. Fix: anchor the icon to the input's vertical center reliably. Change icon classes to
`absolute left-3 top-1/2 -translate-y-1/2 size-4` (and ensure the `<label>` height equals the
input — the `top-1/2/-translate-y-1/2` pattern removes dependence on box stretching). Keep
`pointer-events-none`, `left-3`, `pl-9` on the input. Apply the same centered pattern to the new
Ejercicios/Rutinas search inputs (Parts D/E) so the bug isn't reintroduced.

---

## Files touched (summary)

- Migration + `docs/DATABASE.md` (exercises columns).
- `app/lib/admin-stats.ts` (getManagementSummary, getRecentActivity).
- `app/lib/exercises.ts`, `app/lib/exercise-form.ts`, `app/lib/exercise-validation.ts`,
  `app/admin/ejercicios/actions.ts` (fields + delete).
- `app/lib/routines.ts`, `app/admin/rutinas/actions.ts` (usersCount + delete).
- `app/admin/page.tsx` (2 new cards).
- `app/admin/ejercicios/ExerciseAdminClient.tsx` (design shell).
- `app/admin/rutinas/RoutineAdminClient.tsx` (design shell, keep builder).
- `app/catalogo/RoutineCatalogClient.tsx` (lupita).
- `graphify update .` after code/schema changes.

## Verification

1. `npm run build` (or `next build`) + `npm run lint` — type/lint clean.
2. Migration applied via `supabase_gymcontrol` MCP; confirm columns exist; `docs/DATABASE.md` updated.
3. Run app (`/run` or `next dev`):
   - `/admin` — Actividad reciente shows real recent rows; Resumen de gestión shows real
     active-routines / new-exercises-this-week / % users-with-routine numbers (cross-check by
     inserting a row and reloading).
   - `/admin/ejercicios` — create with muscle/equipment/video persists & shows badges; filters &
     sort & pagination work; delete removes row + toast.
   - `/admin/rutinas` — table with usersCount, sort/filter/pagination; detail drawer lists real
     per-day exercises; create/edit via builder still writes series/reps/rir/rest; delete works.
   - `/catalogo` — lupita vertically centered in the search field (compare against
     `public/bugs/bug_lupita.png`).
4. Confirm no `--gc-*` tokens leaked; only `lucide-react` icons; pages are mobile-first.

## Risks

- Migration is live-DB; additive columns are low-risk but irreversible-ish — verify on the
  intended project before applying.
- Delete actions are destructive (routine delete cascades days/items); gate behind `requireAdmin`
  + confirm modal.
- Design objectives ("Definición/General") and muscle-accent enums differ from real enums — UI
  must map to the real `routine-metadata` values, not the design's literals.
- `getRecentActivity` merges multiple queries; keep N small (limit 6) to bound cost.
