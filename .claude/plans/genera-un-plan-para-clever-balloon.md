# Plan: UI fixes + login redesign + home cards (gymcontrol)

## Context

Lote de ~15 tareas de UI/bug sobre la app Next.js `gymcontrol`. Mezcla de bugs reales
(completar dia bugeado, borrar rutina roto, toasts duplicados), ajustes de layout
(searchbar/filtros, cards full-width, alineacion de tablas), mejoras de formularios
(crear/editar ejercicio y rutina) y features nuevas en el home (calendario tipo Claude +
card de asistencia semanal motivacional). Ademas rediseno de login segun `Login.html`.

Validacion: skill Playwright para verificar cada cambio visual y de pixeles (gaps, hover,
alineacion) y los flujos de bug (completar/descompletar, borrar).

Restriccion clave: la app usa **email OTP + Google OAuth** (passwordless). El diseno de
login muestra email+password mock → se adapta lo visual conservando el flujo OTP real.

---

## Tareas

### 1. Catalogo: searchbar/filtros no deben bajar en "sin resultados"
**Archivo:** `app/catalogo/RoutineCatalogClient.tsx`
- El grid de filtros (lineas ~108-170) esta dentro de la misma `<section grid gap-5>` que
  el estado vacio (`grid min-h-[32rem] place-items-center`). Cuando no hay resultados, el
  contenedor de resultados cambia de altura y reacomoda.
- Fix: mantener filtros en bloque fijo arriba; el area de resultados (lista o empty-state)
  debe ocupar su propia caja de altura estable (mover `min-h` al wrapper de resultados, no
  al empty-state) para que filtros queden en la misma posicion con o sin resultados.
- Verify Playwright: buscar termino sin match → confirmar que el top de la searchbar no se
  mueve (comparar bounding box antes/despues).

### 2. Catalogo: searchbar/filtros casi pegados al subtitulo
**Archivos:** `app/catalogo/page.tsx`, `app/catalogo/RoutineCatalogClient.tsx`
- Reducir el gap entre el subtitulo ("Explora rutinas disponibles...") y el bloque de
  filtros (ajustar gap del page-frame / margin-top del primer bloque del client).
- Verify Playwright: medir distancia vertical subtitulo→searchbar (target: ~8-12px).

### 3. Rediseno login segun Login.html (adaptado a OTP)
**Archivos:** `app/auth/login/page.tsx`, `app/auth/login/OtpLoginFlow.tsx`
- Layout dos paneles (de `Login.html`):
  - **Izq (hero):** glows violeta + grid pattern, logo "GC"+wordmark, eyebrow
    "Plataforma de entrenamiento", heading "Tu mejor version empieza hoy." (ultima palabra
    violeta), subcopy, 3 stat-chips, quote italic abajo. Oculto < 820px.
  - **Der (form-shell, 460px, bg workspace):** eyebrow "Bienvenido de vuelta", titulo,
    sub, campos con icono (mail/lock), boton primario violeta con flecha + spinner,
    divider "o continua con", boton Google ghost, link registro.
- **Adaptacion OTP:** conservar `OtpLoginFlow` (paso email → paso codigo). Estilar inputs
  segun diseno (`padding 11px 14px 11px 40px`, bg `--gc-card-alt`, border `--gc-border`,
  radius 10px, focus border accent + ring `rgba(124,58,237,0.18)`), iconos lucide
  (`Mail`, `KeyRound`), boton primario con flecha + estado loading. NO agregar password.
  Mantener boton Google (`/auth/google/start`) en lugar del divider del mock.
- Conservar manejo de `searchParams` (error/status/reason) como badges del panel derecho.
- Verify Playwright: render login desktop (dos paneles) + mobile (<820, solo form);
  focus en input muestra ring violeta; flujo paso1→paso2 visible.

### 4. Toasts duplicados
**Archivo:** `app/components/shared/StatusToast.tsx`
- `useEffect` deps `[message]` dispara dos veces bajo StrictMode → toast duplicado.
- Fix: pasar `id` estable a `toast.success/error` (`toast.success(msg, { id })`) para
  deduplicar, o guardar con ref el ultimo message disparado.
- Verify Playwright: accion que dispara toast (renombrar/activar) → contar 1 solo toast.

### 5. Bug completar dia (modelo fecha vs semana) — "una sesion por semana"
**Archivos:** `app/lib/workout-tracking.ts`, `app/dashboard/rutinas/dia/page.tsx`
- Causa raiz: `getWorkoutSessionForToday`/`saveWorkoutSessionForToday` keyean por
  `training_date = hoy`. El display semanal (`listWorkoutWeeklySummaries`) agrupa por
  `routine_day_id` en la semana. Al reabrir otro dia se crea sesion nueva y no se puede
  descompletar la previa.
- Fix (confirmado por usuario): **una sesion por semana por (saved_routine, routine_day)**.
  - Nuevas helpers `getWorkoutSessionForWeek` / `saveWorkoutSessionForWeek` que resuelven
    la sesion existente de la semana (buscar por rango `weekStart..weekEnd` con
    `getCurrentWeekRange()`) en vez de `training_date` exacto; al crear, usar `today` como
    `training_date` pero al cargar/guardar reutilizar la fila de la semana.
  - `dia/page.tsx` (linea ~37) carga la sesion de la semana; el autosave de
    `dia/actions.ts` guarda sobre esa fila → completar/descompletar consistente con
    `WeekDaysList` (`isCompleted`).
- Verify Playwright: completar dia 2 (todos los items) → aparece completado en lista;
  destildar items → dia 2 vuelve a no-completado; recargar mantiene estado.

### 6. Dashboard: filtros centrados + placeholder
**Archivo:** `app/dashboard/DashboardRoutinesClient.tsx`
- `DashboardSelect` (lineas ~213-230) usa `<SelectValue />` sin placeholder y trigger con
  centrado parcial. Agregar `placeholder` (ej "Dificultad", "Objetivo") y arreglar
  centrado del grid de filtros (search + 2 selects) para que quede centrado en el ancho.
- Reusar `Select`/`SelectValue` de `app/components/ui/Select.tsx` (ya soporta placeholder).
- Verify Playwright: filtros centrados; selects sin valor muestran placeholder.

### 7-9. Admin: contenido de cards full-width + hover en bordes
**Archivos:** `app/admin/page.tsx`, `app/admin/ejercicios/ExerciseAdminClient.tsx`,
`app/admin/rutinas/RoutineAdminClient.tsx`, `app/components/ui/Table.tsx`,
`app/components/ui/Card.tsx`
- `bug-espacios.png`: contenido (tablas) dentro de cards tiene padding lateral → el hover
  de fila (`hover:bg-[var(--card-alt)]`) no llega a los bordes.
- Fix: tablas dentro de `CardContent` deben ir a ancho completo (card con
  `overflow-hidden`, `CardContent p-0`, padding horizontal movido a celdas via `px-6` ya
  presente). Verificar que no quede padding extra en el wrapper de la card que recorte el
  hover. Aplicar mismo patron en las 3 superficies (admin home "Actividad reciente",
  ejercicios, rutinas).
- Verify Playwright: hover sobre fila → bg llega borde a borde (medir que el highlight
  cubra todo el ancho de la card, comparando con `public/bugs/bug-espacios.png`).

### 10. Admin: alineacion tabla ejercicios y rutinas
**Archivos:** `app/admin/ejercicios/ExerciseAdminClient.tsx`,
`app/admin/rutinas/RoutineAdminClient.tsx`, `app/components/ui/Table.tsx`
- `bug-alineacion.png`: titulo de columna no alineado con el contenido de las filas
  (la primera celda tiene icono `size-10` + texto → corre el nombre respecto al header;
  en rutinas la tabla es `<table>` cruda con paddings mixtos `px-5/px-6/px-3`).
- Fix: unificar paddings header/celda por columna. Ejercicios: usar shared `Table` y
  alinear la celda con icono para que el texto arranque igual que el header (o alinear el
  header al inicio del bloque texto+icono). Rutinas: pasar la `<table>` cruda al patron de
  padding consistente (idealmente shared `Table` o igualar `px` por columna head/cell).
- Verify Playwright: medir x-left del header vs x-left del texto de filas por columna →
  deben coincidir.

### 11. Mejorar UI crear/editar ejercicio
**Archivo:** `app/admin/ejercicios/ExerciseAdminClient.tsx` (`ExerciseFormSheet`, ~563-909)
- Mejorar jerarquia visual del Sheet: agrupar campos (imagen / datos basicos / metadata),
  spacing consistente, labels claros, estados de upload, botones primario/secundario.
- Usar componentes existentes (`Sheet`, `Input`, `Select`, `Button`, `Card`) — sin crear
  desde cero (regla shadcn del CLAUDE.md). Mobile-first.
- Verify Playwright: abrir sheet crear/editar → layout ordenado, sin overflow en mobile.

### 12. Mejorar UI crear/editar rutina
**Archivo:** `app/admin/rutinas/RoutineAdminClient.tsx` (`RoutineFormSheet`, ~568-1063)
- Mejorar el builder dinamico de dias/items: secciones claras por dia, botones
  add/remove visibles, spacing, selects de dificultad/objetivo consistentes.
- Reusar helpers existentes (`createEmptyDay`, `createEmptyItem`, handlers) — solo capa
  visual. Mobile-first.
- Verify Playwright: abrir sheet, agregar dia + item → UI legible, sin romper layout.

### 13. Dashboard: boton borrar roto
**Archivos:** `app/dashboard/DashboardRoutinesClient.tsx` (~361-369),
`app/components/ui/DropdownMenu.tsx`
- Causa: `<DropdownMenuItem asChild><button type=submit>` dentro de form en un Radix
  DropdownMenu que cierra al seleccionar → el portal se desmonta antes de completar el
  submit del server action.
- Fix: evitar que el `onSelect` cierre antes del submit. Opciones (elegir la minima):
  (a) `onSelect={(e) => e.preventDefault()}` en el item y disparar submit manual, o
  (b) sacar el form del item del menu y usar un dialog/confirm de borrado, o
  (c) `requestSubmit()` programatico antes de cerrar.
- Reusar `deleteSavedRoutineAction` (`app/dashboard/actions.ts`) sin cambios.
- Verify Playwright: abrir menu → Borrar → rutina desaparece + toast "Rutina borrada".

### 14. Home: card calendario minimalista (cuadrados tipo Claude)
**Archivos:** `app/page.tsx` (+ nuevo componente client de calendario)
- Grid de cuadrados (heatmap simple) mostrando dias entrenados. Datos desde
  `listWorkoutWeeklySummaries` / sesiones completadas (reusar `workout-tracking.ts`,
  fechas `completedDates`). Mobile-first, paleta violeta/verde existente.
- Crear `app/components/shared/TrainingCalendarCard.tsx` (o similar) reusando `Card`.
- Verify Playwright: card renderiza grid; dias con sesion completada resaltados.

### 15. Home: card asistencia semanal + frase motivacional
**Archivos:** `app/page.tsx` (+ nuevo componente)
- "Esta semana fuiste X veces". Si fue todos los dias planeados → "venis bien". Si habia
  un dia planeado y no fue → frase motivadora.
- Datos: `weeklySummary.completedTrainingDatesCount`, dias planeados de la rutina activa,
  `nextPendingDay`/`completedRoutineDayIds` (ya computados en `app/page.tsx`).
- Reusar `Card`; logica de mensaje simple en el server component.
- Verify Playwright: card muestra conteo correcto + mensaje segun estado.

---

## Orden sugerido
1. Bugs primero (5 completar dia, 13 borrar, 4 toasts) — mayor impacto.
2. Layout catalogo (1, 2) y dashboard filtros (6).
3. Admin cards/alineacion (7-10).
4. Forms admin (11, 12).
5. Login redesign (3).
6. Home cards nuevas (14, 15).

## Verificacion global (Playwright skill)
Por cada tarea, correr el flujo descripto en su "Verify". Smoke final: login → dashboard →
completar/descompletar dia → borrar rutina → home (calendario + asistencia) → catalogo
(buscar sin resultados) → admin (hover filas + alineacion). Capturas antes/despues para los
fixes de pixeles (gaps, hover, alineacion) contra `public/bugs/*.png`.

## Riesgos
- Cambio de modelo a "una sesion por semana" puede afectar `listWorkoutWeeklySummaries`,
  streak y metrics del dashboard (revisar consistencia training_date).
- Fix de DropdownMenu borrar no debe romper renombrar/activar (mismo menu).
- Login: no romper flujo OTP/Google real al adaptar el mock visual.
- Tablas full-width/alineacion: no afectar responsive ni otras vistas que usan shared Table.
