# Mobile responsive redesign — gymcontrol

## Context

Mobile (`responsive mobile`) only. Six surfaces need layout/visual fixes so each fits its viewport **without scrolling** at the stated content limits. Desktop (`sm:`/`lg:`/`xl:`) layouts must stay intact — only the mobile/base branch changes. Confirmed previews with user (all "match it"):

- Home macro grams = `consumed/remaining` (`40/40G`), full macro names, faint card surface tint, bigger bodies + bar at card bottom.
- Rutinas "próximo entrenamiento" = `Hoy` / `Mañana` / `En X días`.
- Registro macros = 3 across, ring+icon / name / bar+grams / % below.
- Catalogo detail = accordion expand per day, tiny back btn top-left, short horizontal card, full-width activar.

Iterate each surface with playwright at a mobile viewport (e.g. `playwright-cli resize 390 844`), logged in as admin (`EMAIL`/`EMAIL_PASSWORD` in `.env.local`).

---

## 1. Home — `app/page.tsx`

All target cards are local components inside `app/page.tsx`. Plus `BodyMuscleFigure.tsx`, `NutritionCalendarCard.tsx`.

- **Faint card surface:** wrap each home card body (currently `flex h-full flex-col gap-2 p-2`, no bg) in a subtle surface — add `rounded-2xl bg-[#0d1322]/70 border border-[#1a2235]` (or similar token) so cards read as contained vs the page gradient. Apply uniformly to `NutricionCard`, `CargaMuscularCard`, `ComidasHoyCard`, calendar/training cards in the grid.
- **Nutrition calendar no red:** `app/components/shared/NutritionCalendarCard.tsx` — drop the `isPast && !logged → bg-[#7f1d1d]/60` red branch. Missed past days render neutral (`bg-[#1c2333]`), same as future. (Matches `TrainingCalendarCard` behavior.)
- **Muscular card** (`CargaMuscularCard` + `BodyMuscleFigure.tsx`): enlarge the two SVG bodies (currently hardcoded `width=70 height=140`) so they fill more of the card; push the intensity bar (`Baja … Alta`) to the card bottom (e.g. body row `flex-1`, bar pinned via `mt-auto`). "Looks almost perfect" — minimal other change.
- **Nutrition macro bars** (`NutricionCard`, page.tsx ~262-279): each macro row shows the **full name** (`Proteína` / `Carbohidratos` / `Grasas`) in small text (e.g. `text-[10px]`) on the left, and **`{consumed}/{remaining}G`** top-right above the bar. Compute remaining = `max(0, target - value)`. Keep bar track + fill. Must fit no-scroll in the 2-col grid cell — keep rows tight (`gap-1`, `h-1.5` bars).

## 2. `/dashboard/rutinas` — `app/dashboard/rutinas/page.tsx` (+ `WeekDaysList.tsx`)

Restructure the active-routine view into 4 stacked rows; reuse existing data (`activeRoutine`, `weeklySummary`, `ROUTINE_OBJECTIVE_LABELS`/`ROUTINE_DIFFICULTY_LABELS`):

1. **Routine header card** — `displayName`, objetivo (`objective` label), nivel (`difficulty` label), `{totalDays} días/semana`, over a **placeholder background** (solid/gradient block now; future image). objetivo+nivel are not shown today — add them.
2. **Weekly summary card** — left `X/Y` (`completed`/`total` from `weeklySummary`), right a **progress bar ~60% width, centered** (replace the existing `AnimatedProgressRing` here with a horizontal bar).
3. **Row of 3 small cards** — racha (`weeklySummary.currentStreak`, Flame), tiempo estimado/entreno (the existing "60 min"), próximo entrenamiento as **`Hoy` / `Mañana` / `En X días`** (compute next incomplete day vs today).
4. **Days list card** — keep `WeekDaysList` style (like today).

Fits no-scroll at 5 days. Remove the now-unused ring/metric layout it replaces.

## 3. `/nutricion/registro` — `app/nutricion/registro/RegistroClient.tsx`

Rebuild into 5 rows. Reuse `AnimatedProgressRing` (`ProgressRing.tsx`), `MACRO_COLORS`/`MACRO_LABELS` (`nutrition-style.ts`), `MealCard`, `calculateStreak`.

1. **Calorías card** — icon+title top-left; body split in 3: left counter `kcal consumidas`, middle `AnimatedProgressRing` (kcal vs target), right counter `kcal restantes`.
2. **Macros card** — small icon+title top-left; body split in 3, one column per macro: left `AnimatedProgressRing` with the macro icon inside, right = name (top) / progress bar with `{g}/{totalG}` (middle) / centered `%` (below). Compact text to fit 3-across on narrow phones (confirmed).
3. **Comidas de hoy** — keep existing meals section (`MealCard` grid + Drawer). Must fit ≤2 meals no-scroll.
4. **Constancia (redesign)** — replace the `TrainingCalendarCard` grid with: Flame icon left; right = `{streak} días seguidos` (top) + the **7 weekdays** as initial letters with a fill/empty circle each (filled = that day logged). Use `loggedDates` + `calculateStreak`.
5. **Frase motivadora** — static phrase over a **placeholder background** block (future image). Replaces `NutritionTipCard` in this layout.

## 4. Remove "Mis rutinas" from dashboard — `app/dashboard/page.tsx`

Delete the `DashboardRoutinesClient` block (lines ~179-184). Remove the now-unused import. Leave `DashboardRoutinesClient.tsx` file in place (orphaned) unless deletion requested. Adjust header copy if it referenced the list.

## 5. `/catalogo` — shrink "Ver rutina" — `app/catalogo/RoutineCatalogClient.tsx` (~298-307)

Add a small text-size class to the button text for mobile (e.g. `text-[11px] sm:text-sm`) so it fits the 2-col mobile card grid comfortably. No layout change.

## 6. `/catalogo/rutinas/[id]` — `page.tsx` + `RoutineDetailClient.tsx`

Mobile branch (`xl:hidden`) only:

- **Back button:** move into the header eyebrow row (at the "Catálogo / Detalle de rutina" line height, above current position), make it a small `size="sm"`/`icon`+label button top-left.
- **Routine card:** reduce hero `min-h` on mobile so it reads as a clear **horizontal rectangle** (image + name + chips días/objetivo/nivel in a low-height row).
- **Buttons:** remove "Ir a mis rutinas" (mobile block); make "Activar/Desactivar rutina" **full width** (`w-full`).
- **Days list:** replace the expanded `<Table>` per day with an **`Accordion`** (`app/components/ui/Accordion.tsx`) — collapsed rows show only `dayName` (+ maybe row count); expanding a day reveals its exercise table. 5 collapsed days fit no-scroll; exercises via optional expand.

---

## Files to modify

- `app/page.tsx` (home cards, macro bars, surface tint)
- `app/components/shared/NutritionCalendarCard.tsx` (drop red)
- `app/components/shared/BodyMuscleFigure.tsx` (bigger bodies, bar bottom)
- `app/dashboard/rutinas/page.tsx` (4-row restructure) + maybe `WeekDaysList.tsx`
- `app/nutricion/registro/RegistroClient.tsx` (5-row restructure, constancia, frase)
- `app/dashboard/page.tsx` (remove mis rutinas block)
- `app/catalogo/RoutineCatalogClient.tsx` (button text size)
- `app/catalogo/rutinas/[id]/page.tsx` + `RoutineDetailClient.tsx` (back btn, card height, full-width activar, accordion days)

Reuse: `AnimatedProgressRing`, `Accordion`, `MACRO_COLORS`/`MACRO_LABELS`, `calculateStreak`, `ROUTINE_*_LABELS`, `Card`/`Button`/`Badge`, `lucide-react` icons. No new component unless a row truly repeats (e.g. a small `MacroColumn` for registro macros / a `WeekStreakStrip` for constancia — extract only if reused).

## Verification (per surface, iterate)

1. `npm run dev` (confirm in `docs/codex/COMMANDS.md`).
2. `playwright-cli open`, log in (admin creds from `.env.local`), `playwright-cli resize 390 844`.
3. Navigate each route; `playwright-cli snapshot` + screenshot. Assert: **no vertical scroll** at stated limits (5 days / ≤2 meals), elements match the confirmed previews, desktop layout unbroken (resize to e.g. 1280 to spot-check).
4. Fix deviations, re-check. Run `graphify update .` after code changes.

## Risks

- No-scroll constraint is tight on small phones; macros 3-across and registro 5 rows may need aggressive text/padding compaction.
- `BodyMuscleFigure` SVGs are hardcoded px (CSS-only sizing collapses them) — resize via the width/height attrs, not classes.
- Home macro colors diverge from canonical `MACRO_COLORS`; keep current home colors unless asked (surgical).
- Removing dashboard block leaves an orphan component + possibly unused imports — clean only what the change orphans.
