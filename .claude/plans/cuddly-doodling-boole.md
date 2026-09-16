# Plan — Rediseño mobile de `/rutinas` (C + portada P1)

## Context
`/rutinas` mobile hoy es una columna de 5 cajas violetas del mismo peso, con el próximo día repetido 3 veces y un header genérico. El usuario cerró el diseño en el artifact https://claude.ai/artifact/53cupB98h4cLZAxbBcLGrg (v3):
- **C**: pestañas Día 1–4 + panel deslizable por día (chip, título XXL con grupos, figura muscular neutra, stats, filas de ejercicios) y CTA en dock.
- **P1**: portada de la plantilla a sangre, en gris, detrás del header, pestañas y título (recorte del 27% superior; sirve para las 7 portadas).
- Sin "Anterior" en filas · `MobileHeader` oculto en `/rutinas` · CTA neutro si ya entrenó hoy · **desktop ≥1024 sin tocar**.

Resultado: mobile nuevo con todos los estados; desktop idéntico píxel a píxel.

## Enfoque
Server `page.tsx` calcula todo; un único client component `RoutineWeekView` maneja pestañas, pager, dock y detalle. Lógica de estado pura y testeable en `app/lib/routine-week.ts` **sin imports** (patrón de `workout-progression.ts`, se testea con `node --test --experimental-strip-types`).

### Reutilizar (no crear)
- `resolveHeroState`, `getSessionProgress`, `formatMuscleGroup` — `app/lib/home-dashboard.ts`
- `getOpenSessionForRoutine`, `getTrainingOverview` — `app/lib/workout-tracking.ts`
- `estimateDayMinutes`, `isValidSet` — `app/lib/workout-progression.ts`
- `MuscleBodyView` (prop `width`, `fills` por grupo) — `app/components/shared/BodyMuscleFigure.tsx` → figura compacta **sin modificar** el componente
- `ExerciseDetailModal` (controlado: `exercise/open/onOpenChange`) — patrón de `DayWorkoutClient.tsx:422`
- `Drawer*` (vaul) — `app/components/ui/Drawer.tsx`; `AnimatedNumber` — `app/components/ui/motion.tsx`; `.pressable`
- `MyRoutinesList` + server actions de `app/rutinas/actions.ts` (incl. `renameSavedRoutineAction`)
- Dock sticky: mismo offset que `/rutinas/dia` → `bottom-[calc(5.5rem+env(safe-area-inset-bottom))]`
- `.home-frame` / `.home-safe-top` (globals.css L547/L553) — se extienden a `.rutinas-frame`

## Fases

### F0 · Docs (fuente de verdad primero)
- `DESIGN.md`: nueva **§12 Semana activa mobile (`/rutinas`, <1024px)** — zonas (Z1 portada + switcher + racha, Z2 pestañas, Z3 panel, Z4 dock), tabla de estados/CTA, regla de portada (gris, recorte 27%, fallback), filas sin "Anterior". §6.1: la excepción del header suma `/rutinas`.
- `docs/REDESIGN_DIRECTION.md` §7: decisiones R-D1…R-D6 + R-P y link del artifact (checkbox se marca en F6).
- `docs/codex/FILE_OWNERSHIP.md`: fila "Semana activa mobile" → `app/components/rutinas/`, `app/lib/routine-week.ts`, §12. `docs/codex/TEST_MATRIX.md`: fila `routine-week.ts` → `pnpm test:unit`.

### F1 · Lógica pura + datos
- **Nuevo `app/lib/routine-week.ts`** (sin imports, tipos estructurales):
  - `dayMuscleGroups(items)` — movido desde `app/page.tsx:70-82` (home importa desde acá; sin cambio visual).
  - `buildDayTabs({ days, completedDayIds, completedDayDates, openDayId, trainedToday, todayKey })` → por día `{ state: "done" | "in_progress" | "next" | "pending", small }` (`small`: "Lun"/"Hoy" si hecho, "En curso", "Hoy"/"Próximo" para el siguiente, grupo principal para pendientes). Día de semana desde date key con `Date.UTC`, sin libs.
  - `initialPanel({ tabs, weekDone })` → índice del día en curso, si no el siguiente; semana cerrada → panel resumen.
  - `resolveDockAction(tab, { trainedToday, hasOpenSession, dayOrder })` → `{ label, tone: "primary" | "neutral", note? }`: en curso → "Continuar" primary; siguiente sin entrenar hoy → "Empezar" primary; siguiente con entreno hoy → "Empezar día N" neutral + nota "Hoy ya entrenaste"; otros pendientes → neutral; hechos → "Ver entreno" neutral. Nunca dos primary.
- **`app/lib/workout-tracking.ts`**: `TrainingOverview` suma `completedDayDates: Record<string, string>` (ya lee `routine_day_id` y `training_date`; se completa en el mismo loop).
- **Nuevo `tests/unit/routine-week.test.mjs`**: cada estado (listo, en curso, hecho hoy, semana cerrada, sin días), etiquetas, día inicial, dock sin dos primary, `dayMuscleGroups` orden/top.

### F2 · Shell mobile
- `app/components/shared/MobileHeader.tsx:112`: `pathname === "/" || pathname === "/rutinas"` (comentario actualizado).
- `app/globals.css`: `.rutinas-frame` junto a `.home-frame` (mismo padding-top mobile); reusar la franja `.home-safe-top`.
- `app/rutinas/page.tsx`: cada rama actual (sin guardadas / sin activa / activa) se conserva **tal cual** envuelta en `<div className="hidden lg:contents">`; al lado `<section className="page-frame rutinas-frame lg:hidden">` con el árbol nuevo. Fetch extra solo para mobile: `getOpenSessionForRoutine`. Se arma un DTO serializable por día (título, grupos, fills, min, ejercicios, series, href, ejercicios con `ExerciseDetail`, ids hechos vía `isValidSet`).
- **Nuevo `app/components/rutinas/RoutineCover.tsx`** (client): wrapper `absolute` a sangre (`-mx-4`, sube bajo la safe area), `overflow-hidden`, `next/image fill` en caja `h-[137%]` anclada abajo (tapa el 27% con el título horneado), `object-cover grayscale brightness-[1.05] contrast-[1.15]`, degradé a `--background`. Fallback `/images/dashboard/hoy-toca-fallback.png` si `imageUrl` vacío. Parallax suave en F5.
- **Nuevo `app/components/rutinas/RoutineSwitcher.tsx`** (client): botón título ("Tu rutina · X de N esta semana" + nombre + chevron) → `Drawer` con `MyRoutinesList withMenu` + "Explorar catálogo"; pill de racha solo si `weeklyStreak > 0`.
- **`app/rutinas/MyRoutinesList.tsx`**: prop opcional `withMenu` (default `false` → desktop/rama actual idénticos). Con menú: radio de activa, tocar fila activa la rutina, "…" expande inline Renombrar (input 16px, Enter/Esc, `renameSavedRoutineAction`) / Activar-Desactivar / Eliminar (confirmación inline existente).

### F3 · Pestañas, pager y panel
- **Nuevo `app/components/rutinas/RoutineWeekView.tsx`** (client, dueño del índice seleccionado): monta `DayTabs`, pager, `DayPanel`s, `StartDock` y `ExerciseDetailModal`.
- **`DayTabs.tsx`**: `role="tablist"`, 4 botones 64px, flechas ←/→, `aria-selected`, check emerald en hechos; sobre portada fondo `rgba(5,7,11,.62)`.
- **Pager**: `flex overflow-x-auto snap-x snap-mandatory overscroll-x-contain`, panel `w-full shrink-0 snap-start`; tap → `scrollTo`; fin de scroll (debounce/`scrollend`) → índice. Sin librería.
- **`DayPanel.tsx`**: chip · título `font-display font-extrabold uppercase` `clamp(2.25rem,10.5vw,2.75rem)` (máx. 2 grupos, `&` emerald) · figura `MuscleBodyView` front+back `width={40}` (grupos del día `var(--foreground)`, resto del día `var(--foreground-muted)`) · stats en fila con `border-y` (patrón `HomeWeekStats`) · "Ejercicios" + filas 72px (orden mono, thumb 52px `imageUrl`/ícono `Dumbbell`, nombre, `series × reps · RIR · descanso`, chevron) → abre `ExerciseDetailModal`. En curso: barra de progreso + "X de N ejercicios · sigue …" y check en filas hechas.
- **`StartDock.tsx`**: sticky con offset de `/rutinas/dia`, degradé a fondo; usa `resolveDockAction` del panel visible (`Button` primary o neutro `bg-white/10`), nota encima si corresponde.

### F4 · Estados restantes
- **Semana cerrada**: panel resumen inicial ("Semana cerrada" XXL, stats entrenos/racha/series del plan, filas por día con fecha); tocar pestaña va al panel del día; sin dock en resumen.
- **Sin rutina activa con guardadas**: sin portada, "Elegí tu rutina" XXL + `MyRoutinesList` (sin menú) + link catálogo. **Sin guardadas**: CTA emerald "Explorar catálogo". **Rutina sin días**: portada + "Rutina vacía" + botón neutro catálogo; sin pestañas ni dock.

### F5 · Motion (todo off con reduced-motion)
- Marco de pestaña activa con Framer `layoutId` (≈220ms, `premiumEase`); crossfade corto de título/figura al cambiar panel; `AnimatedNumber` en stats; parallax de portada (rAF sobre scroll de `.shell-main`, solo `transform`); `.pressable` en pestañas/filas.

### F6 · Verificación y cierre
- Antes de F2: capturas Playwright de `/rutinas` a **1280px** (baseline desktop).
- Ruta temporal `app/dev-rutinas-preview/page.tsx` que renderiza `RoutineWeekView`/estados con fixtures (`?state=ready|in_progress|done_today|week_done|no_active|no_saved|no_days`) — **sin escribir en la base**; se borra al final.
- Playwright (login admin por OTP de `.env.local`) a 375/390/430 en `/rutinas` real + cada estado del preview: overflow horizontal 0, taps ≥44px, título largo "Espalda & Tríceps" a 375 sin desborde, sheet Mis rutinas (renombrar/cancelar sin guardar), swipe y flechas de teclado, detalle de ejercicio, reduced-motion, 0 errores de consola. 1280 comparado con baseline.
- `scripts/validate-mobile.mjs`: sumar `"/rutinas"` a la lista de rutas.
- Comandos: `pnpm test:unit` · `pnpm lint` · `pnpm build` · `VALIDATE_BASE_URL=http://localhost:3001 pnpm validate:mobile`. Cambia CSS global → comparar en build de prod (`pnpm exec next start -p 3002`) por el gotcha de CSS viejo en dev.
- Cierre: borrar ruta preview y huérfanos, `graphify update .`, marcar ruta 2 en §7 de `REDESIGN_DIRECTION.md`, actualizar memoria. **Sin commit** salvo pedido.

## Archivos
- Cambian: `app/rutinas/page.tsx`, `app/rutinas/MyRoutinesList.tsx`, `app/components/shared/MobileHeader.tsx`, `app/lib/workout-tracking.ts`, `app/page.tsx` (solo import de `dayMuscleGroups`), `app/globals.css`, `scripts/validate-mobile.mjs`, `DESIGN.md`, `docs/REDESIGN_DIRECTION.md`, `docs/codex/FILE_OWNERSHIP.md`, `docs/codex/TEST_MATRIX.md`
- Nuevos: `app/lib/routine-week.ts`, `tests/unit/routine-week.test.mjs`, `app/components/rutinas/{RoutineCover,RoutineSwitcher,RoutineWeekView,DayTabs,DayPanel,StartDock}.tsx`
- Sin tocar: `RutinasOverview.tsx`, `WeekDaysList.tsx`, `BodyMuscleFigure.tsx`, `MobileTabBar`

## Riesgos
- Swipe vs gesto atrás iOS / drag del Drawer → `overscroll-x-contain`, probar en standalone.
- Dock en browser vs standalone (tab bar de alto distinto) → mismo offset que `/rutinas/dia`, validar ambos.
- Figura a 40px sobre portada → si no se lee, 48px.
- `pnpm build` con `next dev` del usuario en :3001 → CSS viejo en dev; avisar reinicio.
