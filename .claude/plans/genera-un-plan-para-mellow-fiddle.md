# Plan — Mejoras UI/UX y lógica GymControl

## Context

Lote de 8 ajustes pedidos por el usuario sobre el home, login, tablas admin, modales de
ejercicio y la pantalla de día de entrenamiento. Mezcla de fixes visuales chicos, dos
rediseños guiados por refs HTML (`desing-refs/`), y dos cambios de lógica/datos (racha
semanal y reps/peso por serie). Objetivo: dejar la UI más pulida y alinear el tracking
de series con cómo entrena el usuario.

Decisiones confirmadas con el usuario:
- **Racha (#3):** suma +1 por día de rutina completado; al empezar la semana siguiente
  vuelve a 0 si la semana anterior no completó **todos** los días de la rutina.
- **Reps/peso por serie (#8):** guardar string tipo `"12/10/8"` cambiando las columnas
  `performed_reps` / `used_weight` a **texto** (migración mínima).
- **Validación:** Playwright sobre `pnpm dev` local con datos reales de Supabase.

Skills a usar (exigido por el usuario):
- Front visual (login, modal detalle, form): skill `impeccable` (o `frontend-design`) para
  las decisiones de jerarquía/estética; respetar tokens existentes (`var(--accent)`, etc.).
- Validación browser: skill `playwright-cli`.
- Respetar `CLAUDE.md`: mobile-first, lucide-react, sin estilos inline salvo justificado,
  reusar componentes existentes (`Table`, `Badge`, `Dialog`, `Input`, `Select`).

---

## Tareas

### 1. Tooltip del calendario sigue al mouse — `app/components/shared/TrainingCalendarCard.tsx`
Hoy el tooltip está fijo en `-top-8 left-0` (esquina sup-izq del grid, líneas ~53-58).
- Trackear posición del cursor: en `onMouseEnter`/`onMouseMove` de cada celda guardar
  coords relativas (`{ x, y }`) además de `hoveredKey`.
- Posicionar el tooltip con `style={{ left, top }}` + `transform: translate(-50%, -100%)`
  para que quede centrado **arriba del cursor** (lógica tipo Claude Code), con un pequeño
  offset (`top - 8`). Mantener `pointer-events-none` y el contenedor `relative`.
- Conservar `formatDateLabel` y estilos actuales del tooltip.

### 2. Espacio texto rutina activa — `app/page.tsx`
Card "Rutina activa" (`ActiveRoutineCard`, ~309-349) y helper `MetricTitle` (~351-371,
`flex items-center gap-4`). El nombre largo (`displayName`, ~323-326) está muy pegado.
- Reducir el ancho máximo que ocupa el texto y/o ajustar el gap. Concretamente: revisar
  `max-w-[23rem]` del displayName y el `gap-4` del título; bajar a un gap menor / acotar
  ancho para que respire respecto del icono. Cambio quirúrgico, solo este card.

### 3. Racha semanal por días con reset semanal — `app/lib/workout-tracking.ts` (+ `app/page.tsx`)
Reemplazar `calculateCurrentStreak` (~557-567, hoy cuenta días calendario consecutivos)
por lógica de racha basada en cumplimiento semanal:
- Recorrer semanas (Monday-based, reusar `getCurrentWeekRange` / `addDays`) hacia atrás
  desde la actual usando los `training_date` completados (ya disponibles en la query de
  ventana de streak, ~352-379) y el set de `routine_day_ids` de la rutina.
- Regla: por cada **día de rutina** completado sumar +1 a la racha. Al cruzar a una semana
  nueva, si la semana **anterior** no tiene todos los `plannedDays` completados → cortar
  (racha de las semanas previas no cuenta). La semana en curso siempre suma sus días
  completados aunque esté incompleta (todavía no “venció”).
- Necesita conocer `plannedDays` (cantidad de días de la rutina) dentro del cálculo:
  pasar ese dato a `listWorkoutWeeklySummaries` / al helper (ya se tiene la rutina con
  `days` en `app/page.tsx`).
- `WeeklyAttendanceCard` ya recibe `completedThisWeek`/`plannedDays`; evaluar exponer
  `currentStreak` al card si el usuario quiere verlo (hoy se calcula pero no se muestra).
  Mantener el contrato salvo que se pida mostrarlo.

### 4. Login idéntico a `desing-refs/Login.html` — `app/auth/login/page.tsx` + `OtpLoginFlow.tsx`
La ref usa el mismo layout de 2 columnas que ya existe; ajustar detalles para que matchee:
- Panel izquierdo: gradientes/grid overlay, brand `GC`, eyebrow con dot, heading
  "Tu mejor / versión empieza / **hoy.**", subtítulo, **stat-chips** (128+ Ejercicios /
  24 Rutinas / 156 Usuarios) y quote inferior. Reusar tokens y estructura actual.
- Panel derecho: eyebrow "Bienvenido de vuelta", título "Iniciá sesión", inputs con icono
  a la izquierda, foco con ring `rgba(124,58,237,.18)`, botón primario full-width con
  flecha, divisor "o continuá con", botón Google ghost. Mantener el **flujo OTP real**
  (`OtpLoginFlow`) — la ref es password pero NO cambiar el backend: adaptar estilos, no la
  lógica de auth. El input de password de la ref no aplica (seguimos con OTP por email).
- Match de espaciados/tipografías/colores con la ref; mobile-first (panel izq oculto en
  `<lg`, ya contemplado).

### 5. Alinear tablas admin (excepto Acciones) — `app/admin/ejercicios/ExerciseAdminClient.tsx` y `app/admin/rutinas/RoutineAdminClient.tsx`
Hoy solo la columna "Grupo muscular" está centrada (header + body con `text-center`).
Replicar ese centrado en **todas** las columnas menos Acciones.
- **Ejercicios** (usa `<Table>` compartida): agregar `text-center` a cada `<TableHead>` y
  `<TableCell>` de Ejercicio, Equipamiento, Agregado (igual que muscle group, ~326-412).
  La columna del nombre tiene contenido con icono+texto: centrar el contenido del cell
  (ajustar el `flex` interno a `justify-center`) o, si se ve mal, dejar nombre alineado y
  centrar el resto — confirmar visualmente. Acciones queda `text-right`/`justify-end`.
- **Rutinas** (`RoutineAdminClient.tsx` usa `<table>` HTML crudo, ~317-419): agregar
  `text-center` a los `<th>`/`<td>` correspondientes salvo Acciones. Mantener mismo padding.

### 6. Rediseño modal detalle ejercicio — `app/components/shared/ExerciseDetailModal.tsx`
Aplicar las bases de `desing-refs/Ejercicio Detalle.html` adaptadas a nuestro stack
(Dialog/shadcn, datos reales). La ref es un drawer derecho con: línea de acento, hero con
gradiente por grupo muscular + watermark, badges (grupo/equipo/tipo), **tabs**
(Descripción / Técnica / Historial), specs en chips, barras de activación muscular, pasos,
tips, y log de historial con mini-chart.
- Adoptar lo que tenga datos disponibles en nuestro modelo: hero con badge+título, chips de
  stats (Series/Reps/RIR/Descanso/Rango — ya existen en `ExerciseStat`), descripción.
- Las tabs Técnica/Historial dependen de datos que **hoy no existen** (pasos, tips,
  histórico de carga). No inventar datos: implementar el rediseño visual (hero, chips,
  layout, jerarquía) y dejar Técnica/Historial **fuera de alcance** salvo que existan
  campos; documentarlo. Mantener accesibilidad del `Dialog` (aria-describedby, footer Cerrar).
- Mantenerlo como modal centrado (no migrar a drawer) salvo pedido — adaptar estética, no
  el patrón de overlay.

### 7. Rediseño form crear/editar ejercicio — `app/admin/ejercicios/ExerciseAdminClient.tsx` (`ExerciseFormSheet`, ~566-949)
Aplicar bases de `desing-refs/Ejercicio Form.html`:
- **Vista previa en vivo**: card arriba con thumb (gradiente por grupo), nombre y badges
  (grupo+equipo) que se actualiza con el form.
- **Grupo muscular y Equipamiento como pills** seleccionables (`pill-grid`) en vez de
  `<Select>`, usando `EXERCISE_MUSCLE_GROUPS` / `EXERCISE_EQUIPMENT_OPTIONS`.
- Secciones con label uppercase (Información básica / Grupo muscular / Equipamiento /
  Multimedia), inputs con icono, textarea con contador de caracteres, badge "URL válida".
- Conservar: subida de imagen a Supabase (`handleFileChange`), validaciones server
  (`saveExerciseAction`, `fieldErrors`), footer Cancelar/Guardar, requisito de imagen al
  crear. Mantener el patrón `<Sheet>` lateral (la ref es drawer derecho, coincide).

### 8. Reps/peso por serie — migración + `dia`
Permitir registrar por serie, p.ej. reps `"12/10/8"` y peso `"40/40/35"`.
- **DB (migración Supabase, vía `apply_migration`):** cambiar `workout_session_items.performed_reps`
  de `integer` → `text` y `used_weight` de `numeric(8,2)` → `text`. Mantener nullable y el
  unique `(workout_session_id, routine_item_id)`. Actualizar `docs/DATABASE.md`.
- **Lib** `app/lib/workout-tracking.ts`: tipos `WorkoutSessionItemInput`/`WorkoutSessionItem`
  pasar `performedReps`/`usedWeight` a `string | null`; quitar mapeos numéricos.
- **Action** `app/dashboard/rutinas/dia/actions.ts`: reemplazar `parsePositiveInteger`/
  `parsePositiveNumber` por validación de formato "valores separados por `/`" (cada token
  entero/decimal positivo; cantidad de tokens ≤ `series`). Mensajes de error claros.
- **UI** `app/dashboard/rutinas/dia/DayWorkoutClient.tsx`: inputs de "Reps realizadas" y
  "Peso utilizado" aceptan el string por serie (placeholder `"12/10/8"`, helper con la
  cantidad de series esperada). Ajustar el hint "tope del rango ideal" (~400-407) que hoy
  hace `Number(draft.performedReps)` para que tome la última/serie máxima o se desactive.
  `DraftState` ya es string, así que el cambio es de validación/parse y placeholders.

---

## Archivos a modificar (resumen)
- `app/components/shared/TrainingCalendarCard.tsx` (1)
- `app/page.tsx` (2, y wiring de 3)
- `app/lib/workout-tracking.ts` (3, 8)
- `app/auth/login/page.tsx`, `app/auth/login/OtpLoginFlow.tsx` (4)
- `app/admin/ejercicios/ExerciseAdminClient.tsx` (5 tabla, 7 form)
- `app/admin/rutinas/RoutineAdminClient.tsx` (5 tabla)
- `app/components/shared/ExerciseDetailModal.tsx` (6)
- `app/dashboard/rutinas/dia/DayWorkoutClient.tsx`, `app/dashboard/rutinas/dia/actions.ts` (8)
- Migración Supabase + `docs/DATABASE.md` (8)

## Orden sugerido
1. Cambios chicos sin riesgo: #1, #2, #5.
2. Lógica: #3 (racha), luego #8 (migración → lib → action → UI).
3. Rediseños visuales con skill front: #4 (login), #6 (modal), #7 (form).
4. Tras tocar código: `graphify update .`.

## Verificación (Playwright sobre `pnpm dev` local)
- **#1** Home: hover sobre celdas del calendario → tooltip aparece centrado arriba del
  cursor y lo sigue; no en la esquina.
- **#2** Home: nombre de rutina activa con separación correcta del icono (capturas mobile + desktop).
- **#3** Racha: con sesiones de prueba en Supabase, validar que suma por día y que al
  cruzar semana incompleta resetea (revisar valor `currentStreak` / card).
- **#4** `/login`: comparar contra `Login.html` (layout 2 col, chips, divisor, Google);
  el flujo OTP sigue funcionando (enviar código → verificar) — smoke sin romper auth.
- **#5** `/admin/ejercicios` y `/admin/rutinas`: todas las columnas centradas salvo Acciones.
- **#6** Abrir un ejercicio → modal con hero/chips/jerarquía nueva, accesible, cierra bien.
- **#7** Crear/editar ejercicio → preview en vivo, pills de grupo/equipo, subida de imagen
  y guardado server siguen funcionando.
- **#8** `/dashboard/rutinas/dia`: cargar reps `"12/10/8"` y peso `"40/40/35"`, autosave OK,
  recargar y ver persistido; validación rechaza formatos inválidos.
- Build/types: `pnpm lint` / `pnpm build` o `tsc` según `docs/codex/COMMANDS.md`.

## Riesgos
- **#8 migración** es irreversible sobre datos existentes (int→text). Confirmar que no hay
  consumidores que asuman numérico (gráficos/PR) antes de migrar; hoy no existen.
- **#3** cambia el significado de `currentStreak`; revisar si algo más lo consume.
- **#4/#6/#7** las refs traen datos/mock (chips fijos, historial, activación muscular) que
  no existen en el backend: no inventar datos, adaptar solo lo visual con datos reales.
