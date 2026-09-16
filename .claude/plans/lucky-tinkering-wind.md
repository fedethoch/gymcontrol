# Rediseño mobile de `/rutinas/dia` — dirección A "Foco"

## Context

`/rutinas/dia` es la pantalla donde se registran las series. Es la ruta 3 de 15 del rediseño en curso (`docs/REDESIGN_DIRECTION.md` §7); `/` y `/rutinas` ya se rediseñaron con la misma dirección: un protagonista por pantalla, secciones sin cajas, un CTA emerald, desktop sin tocar.

Hoy mobile es la versión desktop apilada: `MobileHeader` + botón volver (dos cabeceras, ~110px de cromo), siete cards iguales de 64px y una tabla de 5 columnas (`Serie · Anterior · kg · reps · ✓`) dentro de la card abierta. El número más grande de la pantalla es el contador "0 de 18 series"; la tarea real (hacer la próxima serie) queda enterrada.

Resultado buscado: el usuario abre la pantalla en el gimnasio y ve **qué serie tiene que hacer y con cuánto peso**, sin leer y sin teclado, con el CTA en la zona del pulgar.

Mock aprobado (v2): https://claude.ai/artifact/A9wFreDnAKE6UJexN7Yd4H
Referencias (`/app-store-refs`, categorías `logging` + `exercise-detail`): Ladder (entreno en curso), Fitbod (pantalla de ejercicio y lista), Hevy (fila hecha teñida), Strong (descanso como anillo).

### Decisiones cerradas (2026-09-16)

| ID | Decisión |
|---|---|
| D-D1 | Dirección **A · Foco**: un ejercicio por pantalla, pager horizontal, lista del día en sheet |
| D-D2 | Ilustración **invertida a dark** por filtro CSS (`invert(1) hue-rotate(180deg)`), sin tocar assets |
| D-D3 | kg y reps con **−/+** (salto por equipo) y número tocable que abre teclado |
| D-D4 | Descanso: el **dock se transforma en anillo** con el número grande, +15 s / Saltar y próxima serie |
| D-D5 | "Terminar" **neutro en el sheet de ejercicios y en ✕**; emerald en el dock solo al completar todas las series |
| D-D6 | Sin `MobileHeader` en la ruta · desktop ≥1024 sin tocar · `ExerciseDetailModal` e `ExerciseHistorySheet` se abren tal cual (su rediseño es otra vuelta) |
| — | Resumen final: solo **series y ejercicios** (nada calculado de más) |

## Alcance

Solo mobile (<1024). No se toca: bottom nav, `app/rutinas/dia/page.tsx` (los datos que ya manda alcanzan), la cola offline (`app/lib/workout-sync-queue.ts`), ni el árbol desktop.

## Arquitectura

Mismo patrón que `/rutinas`: lógica pura en `app/lib/`, componentes en una carpeta por ruta, dos árboles que conviven.

- `DayWorkoutClient.tsx` conserva **todo el estado y la sincronización** (`commit`, `enqueueItem`, `enqueueFinish`, `flushNow`, suscripción a eventos `stale`, `buildInitialState`, timer de descanso contra hora de fin) y pasa los mismos handlers a los dos árboles.
- Árbol mobile/desktop con el helper `Responsive` de `app/rutinas/page.tsx:40-54` (`h-full lg:hidden` envolviendo `.page-frame` — `.page-frame` es CSS sin capa, así que `lg:hidden` va en un div externo — y `hidden lg:contents` para el desktop actual, que sigue usando `ExerciseCard`).
- El `.page-frame` de esta ruta necesita su variante sin header, como `.rutinas-frame` (`app/globals.css:547-552`) más la franja `.home-safe-top` (`app/globals.css:555-561`).

## Fases

### F0 · `DESIGN.md` §11

Reescribir §11 ("Registro de entrenamiento") como sección mobile con el mismo formato que §10 y §12: zonas Z1–Z5, tabla de estados y reglas (un CTA emerald, dato ≠ acento, ilustración invertida). Anotar en §6.1 la excepción del header para `/rutinas/dia`.

**Verificar:** el doc responde, para cada estado, qué elemento es N1, dónde está el CTA y qué secciones se ocultan.

### F1 · Lógica pura + tests

Nuevo `app/lib/day-workout.ts` (sin imports de React), moviendo desde `DayWorkoutClient.tsx` sin cambiar comportamiento: `toLoggedSet`, `countValidDrafts`, `padSets`, `toDraftSet`, `timeFactor`, `sanitizeNumber`, `formatNumber`, `formatCompactSet`, `buildPlaceholder`, `describeSuggestion`. Se suman:

- `resolveDayState(...)` → `empty | ready | active | resting | all_done`
- `currentPosition(drafts, exercises)` → `{ exerciseIndex, setIndex }` (primer ejercicio con series pendientes y su primera serie libre)
- `exerciseFractions(drafts, exercises)` → `number[]` para los segmentos de la barra
- `stepValue(value, kind, field, dir)` → string, usando `getLoadStep(equipment)` de `app/lib/workout-progression.ts` para kg, ±1 para reps y ±5 s (o ±0,5 min) para tiempo

Reusar sin duplicar: `parsePlanTarget`, `parseRestSeconds`, `suggestNextTarget`, `isValidSet`, `formatKg`, `formatSeconds` (`app/lib/workout-progression.ts`).

Tests en `tests/unit/day-workout.test.mjs` con el estilo de `tests/unit/routine-week.test.mjs` (`node:test` + `node:assert/strict`, import directo del `.ts`): estados, posición actual, fracciones, steps por tipo de ejercicio (peso / peso corporal / tiempo en segundos y en minutos) y placeholders.

**Verificar:** `pnpm test:unit` verde; desktop idéntico (F1 es refactor puro).

### F2 · Shell mobile

Nueva carpeta `app/components/workout/`:

- `WorkoutTopBar.tsx` — ✕ (44px) · barra segmentada, un segmento por ejercicio con su fracción · contador `4/18` en mono · `SyncIndicator` (se mueve acá tal cual, incluidos los estados Sin conexión / Reintentar).
- `ExercisePager.tsx` — scroll-snap horizontal con el patrón de `RoutineWeekView.tsx:44-72` (`scrollLeft` inicial en `useLayoutEffect`, `setTimeout` de 90 ms para asentar el índice, `prefers-reduced-motion` en `goTo`), flechas ←/→ con teclado. Cada panel `relative` (gotcha de `/rutinas`: `sr-only` absoluto dentro del pager provocaba overflow).
- `ExerciseStage.tsx` — ilustración con el filtro de D-D2, chip "2 de 7" y chip "Técnica" que abre `ExerciseDetailModal`.

Ocultar el header sumando la ruta a la condición de `app/components/shared/MobileHeader.tsx:113`, y agregar la clase de frame en `app/globals.css` junto a `.rutinas-frame`.

**Verificar:** 375 / 390 / 430px sin overflow horizontal; el pager arranca en el ejercicio pendiente.

### F3 · Serie actual y dock

- `SetFocus.tsx` — "SERIE N DE M", steppers −/+ con el número en Metric L (`AnimatedNumber` de `app/components/ui/motion.tsx`), "Anterior" en mono y la línea de sugerencia con el ícono de tendencia.
- `SetList.tsx` — filas de 40px (hecha con check emerald / actual / pendiente en `--foreground-subtle`); tocar una fila la vuelve la serie actual.
- `WorkoutDock.tsx` — offset y degradado del sticky copiados de `app/components/rutinas/StartDock.tsx` (`sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))]`). Tres formas con `AnimatePresence`: CTA "Serie N hecha" → anillo de descanso (+15 s / Saltar / próxima serie) → confirmación inline de terminar parcial. Botón ≡ a la izquierda que abre la lista.

**Verificar:** marcar una serie guarda, arranca el descanso y al completar el ejercicio avanza al siguiente pendiente; la vibración al terminar el descanso sigue funcionando; la cola offline queda intacta (probar con red cortada).

### F4 · Sheet, resumen y vacíos

- `ExerciseListSheet.tsx` — `Drawer` (vaul) como `app/rutinas/dia/ExerciseHistorySheet.tsx:41-46`: filas con miniatura, "Ahora" en el actual, fracción hechas/plan, y "Terminar con X de N" neutro al pie (D-D5). Tocar una fila salta a ese ejercicio en el pager.
- `WorkoutSummary.tsx` — "Entreno completo" en Display XXL + dos stats (series, ejercicios) reusando `WeekStats` de `app/components/rutinas/DayPanel.tsx:153`; el dock pasa a "Terminar entrenamiento" emerald.
- Día sin ejercicios y aviso "Ya registraste este día esta semana" con el diseño nuevo.

**Verificar:** cada estado del mock abierto en Playwright con la cuenta admin.

### F5 · Verificación y cierre

- Playwright a 375 / 390 / 430 / 1280px, cada estado, `prefers-reduced-motion`, 0 errores de consola. A 1280 la pantalla tiene que quedar igual que hoy.
- Sumar `/rutinas/dia` a `scripts/validate-mobile.mjs` derivando el link desde `/rutinas` (mismo truco que `/catalogo/rutinas/` en `validateRoutes`, línea 129), porque la ruta necesita query params.
- `pnpm test:unit`, `pnpm check`, `VALIDATE_BASE_URL=http://localhost:3001 pnpm validate:mobile`.
- Si cambia CSS global, comparar contra build de producción (`pnpm exec next start -p 3002`): el dev sirve CSS viejo.
- Actualizar `docs/codex/FILE_OWNERSHIP.md` (fila "Registro de entrenamiento": sumar `app/components/workout/` y `app/lib/day-workout.ts`), `docs/codex/TEST_MATRIX.md`, marcar la ruta 3 y sus subpartes en `docs/REDESIGN_DIRECTION.md` §7, y correr `graphify update .`.
- Sin commit salvo pedido explícito.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Foco de input dentro de un pager con scroll-snap desplaza el panel en iOS | El número solo abre teclado al tocarlo; paneles `relative`; probar en WebKit |
| El teclado tapa el dock al escribir 42,5 | El valor se confirma con "Listo" del teclado; el CTA se usa después |
| Dos árboles con un solo estado (ambos montados, uno oculto por CSS) | Handlers compartidos, sin estado local duplicado, `id`/`aria-label` únicos por árbol |
| `invert` raro en ilustraciones con máquinas grises | Revisar los ejercicios del día en F2; fallback a lámina clara si alguna falla |
| Mover helpers rompe el guardado offline | F1 es refactor puro con tests antes de tocar la UI |
