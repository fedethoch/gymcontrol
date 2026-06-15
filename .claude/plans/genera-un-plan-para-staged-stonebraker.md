# Plan: Lote de fixes UI/UX + comportamiento (admin, catálogo, dashboard, auth)

## Context

Tanda de 24 ajustes de UI/UX y comportamiento reportados por el usuario sobre gymcontrol (Next.js App Router + Tailwind v4 + primitivos Radix custom en `app/components/ui/`). Objetivo: pulir alineación de cards/tablas en `/admin`, corregir flujos de borrado con mensajes claros, unificar el sistema de toasts (hoy fragmentado entre banner-por-URL y toasts hand-rolled), arreglar filtros (borde violeta persistente y placeholder no reseleccionable), menú de 3 puntitos sin outside-click, redirección post-login, racha funcional y reset semanal, y varios detalles de estética.

### Decisiones tomadas con el usuario
- **Toasts**: introducir **sonner** global (`<Toaster/>` en layout). Reemplaza el banner `?status=` del dashboard (causa de que sobrevivan al refresh) y los toasts hand-rolled de admin. → fix #11, #12, #15.
- **3 puntitos**: agregar primitivo **Radix DropdownMenu** (shadcn). → fix #10.
- **Racha**: **cruza semanas** (días consecutivos reales hacia atrás, sin tope de semana). El reset semanal aplica solo al estado de días completados. → fix #16.

### Hallazgos clave (fuente de verdad)
- Padding de cards: `app/components/ui/Card.tsx` (`CardContent` `px-5 pb-5 sm:px-6`); admin lo anula con `p-0` y re-mete inset por celda (`pl-5/pr-5`).
- Tablas: `app/components/ui/Table.tsx` (`TableHead` `text-left px-4 h-12`, `TableCell` `p-4`). `/admin/rutinas` usa `<table>` crudo (no el primitivo).
- Select violeta: `app/components/ui/Select.tsx:36` `focus:border-[var(--accent)]` persiste tras cerrar (Radix devuelve foco al trigger).
- Login redirect: única fuente `app/lib/auth.ts:62` (`getPostLoginRedirectPath`).
- Status banner dashboard: `app/dashboard/page.tsx` lee `params.status`; seteado por `app/dashboard/actions.ts` vía `redirect("/dashboard?status=...")`.
- Racha/reset: `app/lib/workout-tracking.ts` — `listWorkoutWeeklySummaries` (query acotada a la semana) + `calculateCurrentStreak` (capado a `weekStart`).

---

## Trabajo previo (infra compartida)

### A. Sonner global
1. Instalar `sonner`.
2. Montar `<Toaster richColors position="top-center" />` en el root layout (`app/layout.tsx`).
3. Crear helper de toasts client (`app/lib/toast.ts` o usar `toast` de sonner directo) con variantes success/error.
4. Reemplazar:
   - Toasts hand-rolled de admin (`ExerciseAdminClient.tsx` ~135-140/502-506, `RoutineAdminClient.tsx` ~114-119/520-524) por `toast.success/error`.
   - Banner `?status=` del dashboard: en `app/dashboard/actions.ts` seguir usando `redirect` pero el destino limpio (sin `?status=`). El feedback de éxito/error de las acciones de servidor que hoy van por URL pasa a manejarse client-side: los botones/forms que disparan estas acciones muestran `toast` tras la navegación. Para acciones server-action puras (form post → redirect) la vía simple: mantener `?status=` pero en `app/dashboard/page.tsx` leerlo en un pequeño client component que llame `toast(...)` en `useEffect` y luego `router.replace('/dashboard')` para borrar el param (resuelve persistencia al refresh + centrado, ya que sonner centra).
5. Eliminar el render del banner Card de status en `app/dashboard/page.tsx` (líneas ~116-122) y el mapeo `statusMessage` queda alimentando el toast client.

### B. Radix DropdownMenu
1. Instalar `@radix-ui/react-dropdown-menu`.
2. Crear `app/components/ui/DropdownMenu.tsx` (patrón shadcn, mismo estilo que `Select.tsx`/`Dialog.tsx`, `data-slot`, `cn()`).

### C. Fix borde violeta persistente en filtros (global)
- En `app/components/ui/Select.tsx:36`: cambiar el feedback de foco para que **no quede** un borde violeta permanente tras cerrar. Opción: usar `focus-visible:` en vez de `focus:` para el borde de acento, o resetear el estado visual al cerrar. Esto afecta todos los filtros (dashboard y catálogo) → fix #7.

---

## Fixes por área

### /admin (`app/admin/page.tsx`) — #1
- Cards con filas (acciones rápidas, últimas rutinas, tablas): hacer que el contenido ocupe ancho completo y el hover de fila llegue a los bordes redondeados.
- Patrón: en filas tipo link, quitar inset asimétrico; aplicar padding uniforme dentro de un contenedor con `overflow-hidden` para que `hover:bg` cubra borde a borde. Asegurar `CardContent p-0` + filas con padding propio horizontal consistente (no `pl-5`/`pr-5` desbalanceado).

### /admin/ejercicios (`ExerciseAdminClient.tsx`, `actions.ts`, `app/lib/exercises.ts`)
- **#2 card contenedora**: mismo fix de ancho/hover (card `overflow-hidden`, `CardContent p-0`, filas full-bleed).
- **#4 alineación tabla**: títulos de columna y contenido deben compartir el mismo centro por columna. Unificar padding header/celda (hoy `TableHead h-12 px-4` vs `TableCell p-4`) y alineación (text-left consistente; la columna "Acciones" `text-right` en header y celda — ya alineada, verificar). Igualar `px` y vertical align en `app/components/ui/Table.tsx` o sobrescribir por columna de forma consistente.
- **#5 borrado con FK**: en `app/lib/exercises.ts` `deleteExercise` (~144) detectar error Postgres code `23503` (FK violation) y lanzar mensaje claro: "No se puede eliminar: el ejercicio está en uso en una o más rutinas." En `actions.ts` `deleteExerciseAction` propagar `message`. Toast de error vía sonner. Revisar otros flujos de la página para mensajes explícitos.
- **#6 UI crear/editar ejercicio**: mejorar `ExerciseFormSheet` (~574). Pulir espaciado, jerarquía, estados de error. (Apoyarse en skill `frontend-design`/`impeccable` si hace falta.)

### /admin/rutinas (`RoutineAdminClient.tsx`, `actions.ts`)
- **#3 card contenedora**: mismo fix ancho/hover. Considerar migrar el `<table>` crudo (~321) al primitivo `Table` para consistencia con ejercicios.
- **#4 alineación tabla**: igualar centros header/celda; unificar padding (`py-3` header vs `py-4` celda).
- **#9 quitar botón del ojo**: eliminar `<Button ... Eye>` (~395-403). Limpiar orphans propios: import `Eye` (11), state `detailTarget` (112), render `<RoutineDetailSheet>` (477) y componente `RoutineDetailSheet` (583-660) si nada más los usa.
- **#7 UI crear/editar rutina**: mejorar `RoutineFormSheet` (~671). Pulir el builder de días/ítems.

### Auth — #8
- `app/lib/auth.ts:62`: cambiar destino no-admin de `/dashboard` a `/`. Verificar que rutas OTP (`verify-otp/route.ts`) y OAuth (`auth/callback/route.ts`) consumen este helper (sí). No tocar `requireAdmin` ni middleware.

### /catalogo (`app/catalogo/page.tsx`, `RoutineCatalogClient.tsx`)
- **#13 quitar "Ver mis rutinas"**: eliminar `<Button asChild><Link href="/dashboard">` en `page.tsx` (~24-26).
- **#7 borde violeta filtros**: cubierto por fix C.
- **#20 searchbar desalineada + cards de distinto tamaño**: alinear el input de búsqueda con los selects (mismo `h-12`, mismo eje vertical en el grid `lg:grid-cols-[...]`). Cards: forzar tamaño consistente — fijar altura de imagen, normalizar meta row (evitar wrap a 2 líneas), `line-clamp` de descripción constante, botón anclado con `mt-auto`.
- **#18 empty-state no debe saltar**: cuando no hay resultados, mantener searchbar/filtros en su lugar y renderizar el bloque "no hay rutinas" dentro del mismo contenedor con altura reservada (no colapsar el grid). Mantener filtros montados.

### /dashboard (`page.tsx`, `DashboardRoutinesClient.tsx`, `actions.ts`)
- **#21 stat cards centradas verticalmente**: en "rutinas guardadas / semana actual / días entrenados / objetivo actual" el contenido está top-anchored (espacio superior < inferior). Centrar el bloque de texto en el alto de la card (igualar con `items-center` real del contenido, no solo del row). `CardContent` `p-3.5` + inner div centrado.
- **#19 filtros**: centrar texto del trigger (hoy `justify-between`). Comportamiento placeholder: una vez elegida una opción, **no** poder volver a seleccionar el placeholder ("Objetivo"/"Días") como valor; debe existir item **"Todos"** para resetear. (En dashboard ya hay item `all` con label "Objetivo" — renombrar su label visible a "Todos" y dejar el placeholder solo como estado inicial no seleccionable.)
- **#10 menú 3 puntitos**: reemplazar el `<div>` hand-rolled (~318-388) por `DropdownMenu` (fix B) → cierra con click afuera y Escape.
- **#14 botón desactivar en activas**: hoy el botón en activas es "Activa" disabled. Agregar acción `setInactiveSavedRoutineAction` en `app/dashboard/actions.ts` (clear active) + función en `app/lib/saved-routines.ts` para desactivar. En `DashboardRoutinesClient.tsx` (~305-316) mostrar "Desactivar" (no disabled) cuando `isActive`.
- **#11/#12/#15 toasts**: cubierto por fix A (centrado por `position="top-center"`, efímero, se va al refrescar porque limpiamos el param).

### /dashboard/rutinas (`page.tsx`, `WeekDaysList.tsx`, `app/lib/workout-tracking.ts`)
- **#17 difficulty badge al lado del nombre**: quitar el `<Badge>` de dificultad (~124-130) en `page.tsx`.
- **#22 "completado" a la derecha de "semana activa"**: quitar el indicador actual y reemplazar por algo minimalista (p.ej. progreso sutil / check discreto). Pulir pill "Completado" por día en `WeekDaysList.tsx` (~78-82) a algo más estético.
- **#16 racha funcional + reset semanal (cruza semanas)**:
  - Reset semanal de días completados: ya es automático (query acotada a `weekStart..weekEnd`). Verificar que el estado de días/ejercicios arranca incompleto cada semana — confirmar que no hay persistencia fuera de `workout_sessions`.
  - Racha cruza semanas: en `workout-tracking.ts` agregar query separada (sin tope de semana) que traiga las `training_date` completadas hacia atrás (p.ej. últimos N días) y reescribir `calculateCurrentStreak` para contar consecutivos desde `today` **sin** el `while (cursor >= weekStart)` cap. Mantener el resto de `WorkoutWeeklySummary` acotado a la semana.

### /catalogo/rutinas/[id] + modal ejercicio
- **#23 mejorar detalle de ejercicio al tocar** (`app/components/shared/ExerciseDetailModal.tsx`): mejorar layout (header imagen, badges, grid de stats, descripción). Aplica también al detalle tocado en `RoutineDetailClient.tsx`.

---

## Orden de ejecución sugerido
1. Infra: A (sonner), B (DropdownMenu), C (Select focus) — desbloquean varios fixes.
2. Auth #8 (trivial, alto impacto).
3. Admin: cards/tablas #1-#4, borrado #5, quitar ojo #9.
4. Dashboard: filtros #19, menú #10, desactivar #14, stat cards #21, racha #16.
5. Catálogo: #13, #20, #18.
6. Detalle rutina/ejercicio: #17, #22, #23.
7. UI forms #6/#7 (pulido, al final).

## Verificación
- **Build/lint**: `npm run build` y lint del proyecto sin errores.
- **Auth #8**: login OTP y Google → redirige a `/` (no admin) y `/admin` (admin).
- **Borrado FK #5**: intentar borrar ejercicio usado en rutina → toast claro, sin error crudo de Postgres. Usar `supabase_gymcontrol` (`execute_sql`) para confirmar el ejercicio sigue existiendo y la FK.
- **Toasts #11/#12/#15**: ejecutar acción → toast efímero centrado; refrescar → no reaparece; URL sin `?status=`.
- **Filtros #7/#19**: seleccionar/cerrar → sin borde violeta persistente; placeholder no reseleccionable, "Todos" resetea; texto centrado.
- **Menú #10**: abrir 3 puntitos → click afuera/Escape cierra.
- **Desactivar #14**: rutina activa muestra "Desactivar" y funciona (verificar en DB `saved_routines.is_active`).
- **Racha #16**: con sesiones completadas en días consecutivos cruzando lunes, racha cuenta correcto; nueva semana reinicia días completados.
- **Visual**: revisar mobile-first cada pantalla (admin tablas, catálogo cards uniformes, empty-state sin salto, stat cards centradas). Apoyar con skill `webapp-testing` si se quiere validación browser.
- **Graph**: tras editar, `graphify update .`.

## Riesgos
- Sonner + limpieza de `?status=` cambia el patrón de feedback server-action → revisar que ninguna acción dependa del param para otra lógica.
- Migrar `<table>` crudo de rutinas al primitivo `Table` puede alterar estilos — hacerlo con cuidado o limitar a igualar padding sin migrar si el riesgo es alto.
- Racha cruza-semanas agrega una query nueva → coste extra mínimo; acotar a una ventana (p.ej. 90 días) para no traer historial completo.
- Quitar `RoutineDetailSheet` (ojo): confirmar que no se referencia en otro lado antes de borrar el componente.
- Dos nuevas dependencias (sonner, radix-dropdown-menu).
