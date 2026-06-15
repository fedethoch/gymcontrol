# Plan — Tanda de mejoras UI + feature reps

## Context

El usuario pide un lote de ajustes UI en home, login, dashboard y admin, más una feature
nueva de "rango de reps ideales" por ejercicio con sugerencia de subir peso. Objetivos:
pulir jerarquía visual, arreglar bugs de espaciado/alineación en las tablas admin, replicar
3 design files de Anthropic, y agregar lógica de progresión de peso.

**Decisiones del usuario (ya confirmadas):**
- Design files (login / detalle / form): **el usuario los descarga como HTML y los pega en el repo** (carpeta `design-refs/`). Yo los leo y replico fiel. → Tareas C, G, H, I quedan **bloqueadas hasta que los archivos existan**.
- "Rango de reps ideales" → se guarda **en el ejercicio (global)**: columnas nuevas en tabla `exercises`. Requiere migración Supabase.
- Sugerencia de peso → **inline en la fila de `/dashboard/rutinas/dia`** cuando `reps realizadas >= tope del rango`.

**Skills a usar:** `frontend-design` / `impeccable` para rediseños; `shadcn-ui` para componentes; `playwright-cli` para validar cada cambio en navegador. `supabase-postgres-best-practices` para la migración.

---

## Grupo 1 — Home (sin bloqueo)

### A. Calendario: ver el día al hacer hover
- `app/components/shared/TrainingCalendarCard.tsx:57-69`
- Hoy cada celda usa solo `title={day.key}` (formato crudo `YYYY-MM-DD`).
- Cambiar a tooltip legible: formatear la fecha (`"lun 12 jun"`, `Intl.DateTimeFormat es-AR`) y mostrarla en hover. Implementar tooltip custom ligero (estado `hoveredKey` + `<span>` absoluto sobre la grilla) en vez del `title` nativo, para que se vea inmediato. Las celdas pad (línea 69) quedan sin tooltip.

### B. Card "Esta semana": frase motivadora como protagonista
- `app/components/shared/WeeklyAttendanceCard.tsx`
- Hoy jerarquía: count `text-4xl` (líneas 31-33) > sub-line `text-sm` > frase `text-base text-[#9b87f0]` (línea 40, lo más chico).
- Invertir: la **frase (`message`) pasa a ser el elemento principal** (`font-display`, ~`text-2xl/3xl`, color claro), y el count "X veces" + "Entrenaste X de Y" pasan a secundarios/de apoyo debajo. Mantener el header con icono `Sparkles`. Usar skill `frontend-design` para la jerarquía.

---

## Grupo 2 — Dashboard filtros (sin bloqueo)

### D. Filtros más anchos, search más angosto, centrar icono+label en Y
- `app/dashboard/DashboardRoutinesClient.tsx:110` grid: `lg:grid-cols-[minmax(0,1fr)_10.5rem_10.5rem]`.
  - Achicar la columna del search y agrandar las dos de selects para que **"Todos los objetivos" y "Todos los días" entren en una línea** (ej. `minmax(0,1fr)_13rem_12rem` — ajustar midiendo en Playwright).
- Centrado vertical: el `DashboardSelect` (líneas 213-230) y los `SelectItem value="all"` (líneas 124-129, 138-143) usan `inline-flex items-center justify-center gap-2`. El icono+label del valor seleccionado no queda centrado en Y respecto al trigger por el `pl-8` del item. Ajustar el span del valor para `items-center` real y quitar el offset, validando alineación con Playwright.

---

## Grupo 3 — Admin: espaciado y alineación de tablas (sin bloqueo)

Fuente del inset: `app/components/ui/Card.tsx:54-62` (`CardContent px-5 sm:px-6`) y `app/components/ui/Table.tsx:50-71` (`TableHead`/`TableCell px-5 sm:px-6`). Filas con hover limitado: las basadas en `Link` con padding propio.

### E. Contenido full-width + hover hasta los bordes
Patrón a aplicar (revisar `public/bugs/bug-espacios.png`):
- Asegurar `CardContent className="p-0"` donde hay tabla (ya está en varias).
- Para filas tipo `Link` con padding propio (hover limitado): `app/admin/page.tsx:172` ("Acciones rápidas") y `:289` ("Últimas rutinas"). Mover el padding a un wrapper interno y poner el `hover:bg` en el `<Link>`/fila exterior full-width, para que el fondo del hover llegue a los bordes de la card.
- Cards contenedoras a verificar full-width: `app/admin/page.tsx` (actividad reciente, últimos ejercicios), `app/admin/ejercicios/ExerciseAdminClient.tsx:309-310`, `app/admin/rutinas/RoutineAdminClient.tsx:301-302`.
- Decisión de inset de texto: mantener un padding interno chico para legibilidad, pero el fondo del hover y los separadores deben abarcar todo el ancho.

### F. Alinear columna "Grupo muscular" (centrar)
- Ver `public/bugs/bug-alineacion.png`. Header centrado pero badge a la izquierda.
- `ExerciseAdminClient.tsx`: header `TableHead` (líneas 331-333) y `TableCell` (366-376) de grupo muscular → agregar `text-center` y centrar el badge (`justify-center`).
- `RoutineAdminClient.tsx` (tabla raw, líneas 317-342): auditar columnas y unificar alineación de la(s) columna(s) desalineada(s) igual que el resto. (Rutinas no tiene "grupo muscular"; aplicar el mismo criterio de centrado a la columna equivalente que esté fuera de eje.)

---

## Grupo 4 — Rediseños desde design files (BLOQUEADO hasta tener los HTML)

Prerrequisito: el usuario coloca los archivos en `design-refs/`:
- `design-refs/login.html`
- `design-refs/ejercicio-detalle.html`
- `design-refs/ejercicio-form.html`  *(este cubre **form de ejercicio Y de rutina**)*

Para cada uno: leer el HTML + su readme, extraer layout/colores/tipografía/espaciados y replicar adaptando a los tokens del proyecto (`var(--border)`, `var(--card)`, etc.) y a shadcn/ui. Validar con Playwright contra el HTML de referencia.

### C. Login idéntico al design
- `app/auth/login/page.tsx` (layout 2 paneles) + `app/auth/login/OtpLoginFlow.tsx` (flujo OTP email→token + Google).
- Mantener la lógica de auth intacta; solo reestructurar markup/estilos para igualar el diseño.

### G. Modal detalle de ejercicio
- `app/components/shared/ExerciseDetailModal.tsx`. Replicar header de imagen, tiles de stats (Series/Reps/RIR/Descanso), caja de descripción. **Sumar el nuevo rango de reps ideales** (ver Grupo 5) como stat/sección.

### H. Form crear/editar ejercicio
- `app/admin/ejercicios/ExerciseAdminClient.tsx` (sección form). Replicar inputs/labels/upload de imagen/selects. **Incluir inputs del rango de reps** (Grupo 5).

### I. Form crear/editar rutina
- `app/admin/rutinas/RoutineAdminClient.tsx`. Mismo lenguaje visual del `ejercicio-form.html` adaptado a la estructura rutina→días→items.

---

## Grupo 5 — Feature: rango de reps ideales + sugerencia de peso

### J. Modelo de datos (migración Supabase)
- Migración: `ALTER TABLE exercises ADD COLUMN min_reps integer, ADD COLUMN max_reps integer;` (nullable; check opcional `min_reps <= max_reps`). Aplicar con `mcp__supabase_gymcontrol__apply_migration`. Actualizar `docs/DATABASE.md` (tabla `exercises`).
- `app/lib/exercises.ts`: agregar `minReps`/`maxReps` a `ExerciseCatalogItem`, `ExerciseRow`, `mapExerciseCatalogItem`, todos los `select(...)`, y a `createExercise`/`updateExercise` (insert/update).
- `app/lib/exercise-form.ts`: agregar `minReps`/`maxReps` a `ExerciseFormField` y `ExerciseFormPayload`.
- `app/lib/exercise-validation.ts`: parsear ambos como enteros ≥1, opcionales, con `min <= max`.
- `app/admin/ejercicios/actions.ts`: pasar los campos nuevos a create/update.
- UI: inputs en el form (tarea H) + display en el modal detalle (tarea G).

### K. Sugerencia de subir peso (inline en día de entrenamiento)
- Necesita el rango del ejercicio en la vista de día. Hoy `item.exercise` llega vía `getSavedRoutineByIdForUser` (`app/lib/saved-routines.ts`) → asegurar que el `select` del ejercicio incluya `min_reps`/`max_reps` y se mapee en `item.exercise`.
- `app/dashboard/rutinas/dia/page.tsx:51-62`: pasar `maxReps` (del ejercicio) en cada row.
- `app/dashboard/rutinas/dia/DayWorkoutClient.tsx`: cuando `performedReps != null && maxReps != null && performedReps >= maxReps`, mostrar **sugerencia inline en la fila** ("Llegaste al tope: probá subir el peso"). Usar icono lucide (`TrendingUp`) + estilo sutil acorde al proyecto. No bloquea el autosave existente.

---

## Archivos clave a tocar (resumen)

| Área | Archivos |
|---|---|
| Home | `TrainingCalendarCard.tsx`, `WeeklyAttendanceCard.tsx` |
| Dashboard | `DashboardRoutinesClient.tsx`, `ui/Select.tsx` |
| Admin spacing/align | `admin/page.tsx`, `ExerciseAdminClient.tsx`, `RoutineAdminClient.tsx`, `ui/Card.tsx`, `ui/Table.tsx` |
| Rediseños (bloqueado) | `auth/login/page.tsx`, `OtpLoginFlow.tsx`, `ExerciseDetailModal.tsx`, `ExerciseAdminClient.tsx`, `RoutineAdminClient.tsx` |
| Reps feature | migración + `exercises.ts`, `exercise-form.ts`, `exercise-validation.ts`, `ejercicios/actions.ts`, `saved-routines.ts`, `dia/page.tsx`, `DayWorkoutClient.tsx`, `ExerciseDetailModal.tsx`, `docs/DATABASE.md` |

## Orden sugerido
1. Grupos 1, 2, 3 (sin bloqueo, bajo riesgo) — pulido visual.
2. Grupo 5 (feature reps: migración → libs → UI → sugerencia).
3. Grupo 4 (rediseños) en cuanto estén los HTML en `design-refs/`.

## Verificación
- **Playwright** (`playwright-cli`) en cada cambio visual: home (hover calendario muestra fecha; frase protagonista), dashboard (filtros en una línea + centrado), admin (full-width + hover a bordes + columna centrada), login/detalle/form vs HTML de referencia.
- **Reps:** migración aplicada (`list_tables` confirma columnas); crear ejercicio con rango → ver en modal; en `/dashboard/rutinas/dia` cargar reps >= tope → aparece sugerencia.
- `pnpm build` / typecheck para validar tipos nuevos.
- `graphify update .` al terminar.

## Riesgos
- Design files aún no en el repo → Grupo 4 no arranca hasta tenerlos.
- Migración toca tabla en uso (`exercises`): columnas nullable, sin backfill destructivo. Discrepancia ya existente DB-vs-app en `repetitions` (int en DB, string en app) — no la tocamos.
- `repetitions` de routine_items sigue siendo el target por-rutina; el rango ideal es propiedad separada del ejercicio (no se mezclan).
