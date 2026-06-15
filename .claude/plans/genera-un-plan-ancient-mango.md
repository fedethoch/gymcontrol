# Plan: rediseño login + ejercicios clickeables + reestructura day-workout

## Context

Tres mejoras de UX/UI en gymcontrol (Next 15, Tailwind v4 CSS-config, tokens en `app/globals.css`, fuentes Sora/IBM Plex). El usuario quiere:

1. **Login** (`/auth/login`) más moderno/minimalista a pantalla completa, manteniendo la estética purpura/dark. Hoy es una card de dos columnas con panel hero recargado (stat chips, cita, etc.). → **Split full-screen minimal** (izq gradiente+marca minimal, der form, sin card contenedora ni stat chips).
2. **Ejercicios clickeables** en todos lados → abrir el `ExerciseDetailModal` ya existente. Casi todas las zonas cliente ya están cableadas; faltan las tablas **admin**. El usuario confirmó: admin también.
3. **Day-workout** (`/dashboard/rutinas/dia`): la lógica per-set (reps/peso por serie) está bien, pero el front es una card gigante en grid horizontal `xl`. → **Acordeón por ejercicio**: lista compacta, tap expande inputs de series.

Validar cambios visuales con la skill **playwright-cli**. Front con **impeccable** / **frontend-design** + **shadcn-ui** para primitivas.

Estética a respetar (de `globals.css`): dark `#05070b`, accent `#7c3aed`→`#b995ff`, `font-display` (Sora), radios grandes, mobile-first. Nota: `body { overflow:hidden }` y el shell ocupan viewport fijo; el login se renderiza dentro de `.shell-main` (scrolleable).

---

## Tarea 1 — Rediseño login (split full-screen minimal)

**Archivo:** `app/auth/login/page.tsx` (server). `OtpLoginFlow.tsx` se reutiliza tal cual (no tocar lógica).

Cambios:
- Reemplazar el `<section className="page-frame content-start">` + card `rounded-[1.75rem]` por un contenedor full-screen: `min-h-[100svh] w-full grid lg:grid-cols-[1fr_minmax(420px,520px)]` (o `[0.9fr_1.1fr]`), sin border/card externa.
- **Panel izquierdo** (`hidden lg:flex`): mantener SOLO el gradiente purpura+grid+diagonal que ya existe (`backgroundImage` inline L63-66), logo "GC" + "GymControl" arriba, y un titular corto abajo (`Tu mejor version empieza hoy.`). **Eliminar**: `statChips` (const L29-33 + render L96-108) y la cita italic (L111-113). Más aire (`justify-between`, `p-12`).
- **Panel derecho** (`bg-[var(--workspace)]`, `grid place-items-center`, `p-6 sm:p-10`): bloque `max-w-[380px]` con eyebrow + título `Iniciar sesion`, los `Badge` de mensajes (status/error/reason — mantener), `<OtpLoginFlow>`, divider "o continua con", form Google. **Eliminar** los dos badges footer (`Autoregistro activo` / `Supabase Auth`, L151-154) para minimalismo, o dejar uno discreto.
- En mobile (`<lg`): solo panel derecho centrado a pantalla completa; el izquierdo oculto. Asegurar `min-h-[100svh]` para que ocupe todo.

Verify: navegar a `/auth/login` con playwright-cli en viewport desktop (1440) y mobile (390), screenshot, confirmar full-screen sin scroll raro, flujo OTP visible.

---

## Tarea 2 — Ejercicios clickeables (faltantes admin)

El modal `ExerciseDetailModal` (`app/components/shared/ExerciseDetailModal.tsx`) ya existe; patrón: estado local `selectedExercise`, `open={selectedExercise!==null}`, `onOpenChange`. Ya cableado en `RoutineDetailClient.tsx`, `DayWorkoutClient.tsx`. Zonas cliente sin nombre de ejercicio individual (catálogo/dashboard cards) no aplican.

Faltan (admin, confirmado por usuario):
- **`app/admin/ejercicios/ExerciseAdminClient.tsx`** (nombre como `<p>` en L329): envolver nombre en `<button>` que setea `selectedExercise` y montar `<ExerciseDetailModal>`. Mapear la fila admin al tipo `ExerciseDetail` (id, name, description, imageUrl, muscleGroup, equipment...). Importar el modal + agregar estado local. No romper acciones Editar/Eliminar (que el click al nombre no dispare esas).
- **`app/admin/page.tsx`** (nombre como `<span>` en L248, server component): para hacerlo clickeable hace falta un wrapper client. Opción mínima: extraer la tabla "recent exercises" a un pequeño client component que monte el modal, o (más simple) dejar el nombre como link a `/admin/ejercicios`. **Recomendado:** componente client chico `RecentExercisesTable` que reutilice el modal. Confirmar si vale la pena vs. solo `ExerciseAdminClient`.

Verify: en `/admin/ejercicios` click al nombre abre el drawer de detalle; Editar/Eliminar siguen funcionando.

---

## Tarea 3 — Day-workout acordeón

**Archivo:** `app/dashboard/rutinas/dia/DayWorkoutClient.tsx`. NO tocar lógica de estado/autosave (`drafts`, `scheduleAutosave`, `handleDraftChange`, helpers `splitSeriesValues`/`joinSeriesValues`, server action). Solo reestructurar el render de la lista (L334-426) y los sub-componentes de layout.

Cambios:
- Eliminar el header grid de 8 columnas (L336-345) y el grid horizontal `xl:grid-cols-[...]` de la card (L363).
- Cada ejercicio = **fila acordeón** (`motion.article` compacta):
  - **Header (siempre visible, clickeable para expandir):** toggle de completado (`WorkoutStatusToggle`, reusar), número + nombre, resumen meta inline (`{series}×{repsTarget} · RIR {rir} · {rest}`), chevron rotatorio (`ChevronRight`→down al abrir), y `RowSaveIndicator`. Estado nuevo `expandedId` (un solo abierto a la vez; o set). El nombre sigue abriendo el modal vía `setSelectedExercise` — separar zona "expandir" (header) de zona "nombre→modal": usar botón nombre con `stopPropagation`, o un botón "detalle" dentro del panel expandido. **Recomendado:** click en header expande; nombre tiene su propio botón que abre modal (stopPropagation).
  - **Panel expandido (`AnimatePresence` + `motion.div` height):** los inputs de series — reusar `SeriesInputsGroup`/`SeriesCell` (filas verticales `#n [reps] [kg]`), el hint de "tope de rango" (L415-422) y el botón "Ver detalle".
- Mantener accesibilidad: header como `<button>` con `aria-expanded`, panel con id.
- Mobile-first: el acordeón ya colapsa natural; quitar la complejidad `xl` de columnas.

Verify: playwright-cli en `/dashboard/rutinas/dia?...` — expandir/colapsar, escribir reps/peso (autosave dispara), marcar completado, abrir modal desde nombre. Confirmar que no quedó la "card gigante" horizontal. Screenshot desktop + mobile.

---

## Archivos a modificar (resumen)

| Archivo | Cambio |
|---|---|
| `app/auth/login/page.tsx` | Layout split full-screen minimal; quitar statChips/cita/badges footer |
| `app/admin/ejercicios/ExerciseAdminClient.tsx` | Nombre clickeable → modal; montar `ExerciseDetailModal` + estado |
| `app/admin/page.tsx` (+ posible nuevo `RecentExercisesTable` client) | Nombre clickeable → modal (a confirmar alcance) |
| `app/dashboard/rutinas/dia/DayWorkoutClient.tsx` | Reestructura render lista a acordeón; reusar sub-componentes, no tocar lógica |

Sin cambios de schema/Supabase. Sin tocar `OtpLoginFlow.tsx` ni `actions.ts`/`workout-tracking.ts`.

## Verificación end-to-end

1. `pnpm dev`, abrir con **playwright-cli**.
2. `/auth/login` desktop 1440 + mobile 390 → screenshots, full-screen ok.
3. `/admin/ejercicios` → click nombre abre detalle; editar/eliminar intactos.
4. `/dashboard/rutinas/dia` → acordeón expande/colapsa, inputs autosave, completar, modal desde nombre; screenshots desktop+mobile.
5. `pnpm lint` / typecheck. `graphify update .` al final.

## Riesgos

- Login `min-h-[100svh]` dentro de `.shell-main` (overflow-y:auto) — verificar que no genere doble scroll/cortes.
- En day-workout, separar "click header = expandir" de "click nombre = modal" sin que se pisen (stopPropagation / zonas distintas).
- `admin/page.tsx` es server component: hacer clickeable exige extraer client; si no se quiere el costo, fallback a link a `/admin/ejercicios`.
