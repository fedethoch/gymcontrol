# Plan: Rediseño UI + mejoras de tracking (GymControl)

## Context

El usuario quiere acercar varias pantallas a mockups de referencia en `desing-refs/`
(`Login.html`, `Ejercicio Detalle.html`, `Ejercicio Form.html`) y mejorar dos pantallas
del flujo de entrenamiento. Objetivos confirmados con el usuario:

1. **Login** (`/auth/login`): aplicar el look visual de `Login.html` PERO mantener el flujo
   real **OTP-por-email + Google** (la app no tiene login por contraseña; no se agrega
   password ni "recordarme").
2. **Tablas admin** (`/admin/ejercicios`, `/admin/rutinas`): centrar de verdad los textos de
   los headers para que queden centrados respecto a la columna, igual que su contenido.
3. **Detalle de ejercicio**: rediseñar como drawer estilo `Ejercicio Detalle.html` con
   **3 tabs funcionales** (Descripción, Técnica, Historial). Esto requiere **agregar datos de
   pasos/claves (steps/tips) al modelo** (decisión "Full" del usuario).
4. **Form crear/editar ejercicio y rutina**: rediseñar siguiendo `Ejercicio Form.html`.
5. **`/dashboard/rutinas/dia`**: poder tocar el ejercicio para abrir su detalle, y
   reestructurar reps realizadas / peso utilizado en **un campo por serie** (tantos como
   `series` tenga el ejercicio).

Stack: Next.js (App Router, RSC) + React + Tailwind (CSS variables) + componentes propios en
`app/components/ui/` (sobre Radix) + `lucide-react` + `framer-motion` + `sonner`. shadcn está
configurado pero los primitivos viven en `app/components/ui/`.

Skills a usar durante la ejecución: **frontend-design / impeccable** para el trabajo visual,
**playwright-cli** para validar cada pantalla contra su referencia.

---

## Decisiones de diseño / alcance

- **Persistencia de sets**: NO se cambia el esquema de tracking. `workout_session_items`
  sigue con `performed_reps` / `used_weight` como texto slash-separado (`"12/10/8"`),
  ya tope-ado a `series` en `actions.ts:86-109`. Los N inputs por serie solo serializan/
  parsean ese string. Cero migración para tracking.
- **Detalle de ejercicio – datos nuevos**: se agregan SOLO `steps` y `tips` (arrays de texto)
  a `exercises`. Tab Técnica se llena con eso.
  - Tab **Historial**: se arma con datos reales de `workout_session_items` del usuario cuando
    existan (en `/dashboard/rutinas/dia` hay contexto de usuario); estado vacío elegante
    cuando no haya historial o no haya usuario (catálogo público).
  - Chips "Clasificación" y barras "Activación muscular" del ref se **mapean a datos
    existentes** (muscleGroup como primario, equipment, rango de reps). No se agregan
    columnas de tipo/patrón/activación para no inflar el modelo.

---

## Cambios por área

### 1. DB: agregar steps/tips a `exercises`
- Migración Supabase (vía `mcp__supabase_gymcontrol__apply_migration`): `ALTER TABLE exercises
  ADD COLUMN steps text[] NOT NULL DEFAULT '{}', ADD COLUMN tips text[] NOT NULL DEFAULT '{}';`
- Contrastar antes con `docs/DATABASE.md` y `list_tables`; actualizar `docs/DATABASE.md` después.
- Hilo de tipos:
  - `app/lib/exercises.ts`: agregar `steps: string[]` y `tips: string[]` a `ExerciseCatalogItem`,
    `ExerciseRow`, selects (`listAdminExercises`, `listExerciseCatalogItems`, `getExerciseById`),
    `mapExerciseCatalogItem`, `CreateExerciseInput`/`UpdateExerciseInput`, insert/update.
  - `app/lib/exercise-form.ts`: agregar `steps`/`tips` a `ExerciseFormPayload`.
  - `app/lib/exercise-validation.ts`: parsear arrays en `parseExercisePayload` (cada item con
    largo máximo razonable; arrays opcionales).

### 2. Login — `/auth/login` (restyle, mantener OTP)
- `app/auth/login/page.tsx`: reestructurar layout a 2 columnas estilo `Login.html`:
  panel izquierdo (hero: marca, eyebrow con dot, heading grande con palabra acento, subtítulo,
  stat chips, quote al pie, grid/gradiente decorativos) oculto en mobile; panel derecho con
  eyebrow + título + sub, el `OtpLoginFlow`, divisor "o continuá con", botón Google.
- `app/auth/login/OtpLoginFlow.tsx`: aplicar estilos de campos del ref (input con icono a la
  izquierda, focus ring violeta, botón primario full-width con flecha/spinner). Mantener la
  máquina de estados `email → token` intacta y los endpoints `/api/auth/request-otp`,
  `/api/auth/verify-otp`. Sin password ni checkbox "recordarme".
- Stat chips: usar datos reales si están a mano; si no, dejar las del estado actual.
- Mobile-first: stack del panel hero oculto, formulario a ancho completo (`@media` del ref →
  `hidden lg:flex` ya en uso).

### 3. Centrado de headers en tablas admin
Causa raíz (de la exploración): los `<th>` ya tienen `text-center` pero el `SortHeader` es un
`<button class="flex items-center gap-1">` que se pega a la izquierda, así que el texto no
queda centrado.
- `app/admin/ejercicios/ExerciseAdminClient.tsx` (`SortHeader` ~L494): agregar `justify-center`
  (y `w-full`) al botón flex para centrar label+chevron en columnas Grupo muscular,
  Equipamiento, Agregado.
- `app/admin/rutinas/RoutineAdminClient.tsx` (`SortHeader` ~L548): mismo fix para Dificultad,
  Objetivo, Días, Usuarios, Creada.
- Verificar que las celdas debajo ya están `text-center` (lo están) para que header y contenido
  queden alineados. Cambio quirúrgico, solo clases.

### 4. Detalle de ejercicio — drawer con 3 tabs
- Reescribir `app/components/shared/ExerciseDetailModal.tsx` para que visualmente siga
  `Ejercicio Detalle.html`: drawer lateral derecho (usar `Sheet` de `app/components/ui/Sheet.tsx`
  con `side="right"`, ~540px), accent line, hero con gradiente por grupo muscular + watermark +
  badges, tabs Descripción / Técnica / Historial, footer.
  - Mantener la API actual del componente (`{ exercise, open, onOpenChange }`) y el tipo
    `ExerciseDetail`; **extender** `ExerciseDetail` con `steps?: string[]`, `tips?: string[]`,
    y datos opcionales de historial.
  - **Descripción**: descripción + chips de clasificación (mapeados: grupo muscular, equipo,
    rango de reps) + barra de activación del músculo primario.
  - **Técnica**: lista numerada de `steps` + lista de `tips` (estado vacío si faltan).
  - **Historial**: mini-chart + log de sesiones desde datos reales; estado vacío si no hay.
- Pasar `steps`/`tips` desde los 3 call-sites existentes (`DayWorkoutClient.tsx`,
  `RoutineTablePreview.tsx`, `catalogo/rutinas/[id]/RoutineDetailClient.tsx`) — la data ya viene
  de `exercise`/`row.exercise`; sumar los campos nuevos al armar el objeto.
- Historial: nueva función en `app/lib/workout-tracking.ts` para listar el histórico
  (`performed_reps`/`used_weight` por sesión) de un `routineItem`/ejercicio del usuario; pasarlo
  al modal solo desde `/dashboard/rutinas/dia` (donde hay sesión). En catálogo: sin historial →
  estado vacío.

### 5. Form crear/editar ejercicio — restyle
- `app/admin/ejercicios/ExerciseAdminClient.tsx` (`ExerciseFormSheet` ~L533): ajustar el drawer
  al look de `Ejercicio Form.html`: accent line, header con icono de modo (lápiz/plus),
  card de vista previa en vivo, secciones con label en mayúsculas espaciadas, inputs con icono,
  pills para grupo muscular y equipamiento (ya son button-grid; alinear estilo a `.pill`/
  `.pill-active`), badge de URL válida, footer con Cancelar + primario.
- **Agregar campos** Pasos de ejecución y Claves de técnica (listas editables de strings:
  agregar/quitar/editar items) que escriben `steps`/`tips` en el payload.

### 6. Form crear/editar rutina — restyle
- `app/admin/rutinas/RoutineAdminClient.tsx` (`RoutineFormSheet` ~L571): aplicar el mismo
  lenguaje visual del ref de form (accent line, header con icono, secciones, inputs con icono,
  pills para Dificultad/Objetivo en lugar de `Select` si mejora la coherencia, builder de días/
  filas con el estilo de cards del ref). Mantener la lógica del builder y `saveRoutineAction`.
- Opcional de coherencia: migrar la tabla de `/admin/rutinas` (raw `<table>`) al primitivo
  `Table` que ya usa ejercicios — solo si no agranda el diff de forma riesgosa; si no, dejar.

### 7. `/dashboard/rutinas/dia` — click detalle + campos por serie
Archivo: `app/dashboard/rutinas/dia/DayWorkoutClient.tsx`.
- **Click en ejercicio → detalle**: hacer clickable el nombre/article reutilizando
  `setSelectedExercise(row.exercise)` (estado y `ExerciseDetailModal` ya existen, L91 / L442).
  Mantener o reemplazar el botón "Ver detalle" actual. Pasar `steps`/`tips` + historial al modal.
- **Campos por serie**:
  - `DraftState` pasa de `{ performedReps: string; usedWeight: string }` a arrays por serie
    (o se sigue guardando el string slash pero la UI renderiza `row.series` pares de inputs
    reps/peso). Prefill: split de `performed_reps`/`used_weight` por `/`.
  - On change: re-join con `/` y autosave igual que hoy vía
    `autosaveWorkoutSessionItemAction` (sin tocar `actions.ts`/esquema; el cap a `series` ya
    existe en `parseSeriesValues`).
  - Mobile-first: pares de inputs apilados/etiquetados por número de serie.

---

## Archivos críticos
- DB/datos: migración Supabase; `app/lib/exercises.ts`, `app/lib/exercise-form.ts`,
  `app/lib/exercise-validation.ts`, `docs/DATABASE.md`.
- Login: `app/auth/login/page.tsx`, `app/auth/login/OtpLoginFlow.tsx`.
- Tablas: `app/admin/ejercicios/ExerciseAdminClient.tsx`,
  `app/admin/rutinas/RoutineAdminClient.tsx` (ambos `SortHeader`).
- Detalle: `app/components/shared/ExerciseDetailModal.tsx`, `app/lib/workout-tracking.ts`,
  + 3 call-sites (`DayWorkoutClient.tsx`, `RoutineTablePreview.tsx`,
  `app/catalogo/rutinas/[id]/RoutineDetailClient.tsx`).
- Forms: `ExerciseAdminClient.tsx` (FormSheet), `RoutineAdminClient.tsx` (FormSheet).
- Día: `app/dashboard/rutinas/dia/DayWorkoutClient.tsx`.

## Reutilizar (ya existe)
- `Sheet` (`app/components/ui/Sheet.tsx`) para drawers; `Badge`, `Button`, `Input`, `Textarea`,
  `Select`, `Table`.
- `MUSCLE_BADGE_STYLES`, `MUSCLE_GRADIENTS`, `muscleLabel`, `equipmentLabel`
  (`app/lib/exercise-form.ts`).
- `parseSeriesValues` / cap a `series` en `app/dashboard/rutinas/dia/actions.ts`.
- `setSelectedExercise` + `ExerciseDetailModal` ya cableados en `DayWorkoutClient.tsx`.

---

## Verificación (end-to-end)
1. `graphify update .` tras los cambios de código (mantener el grafo).
2. Migración: aplicar y confirmar columnas con `list_tables`; smoke de CRUD de ejercicio
   (crear con steps/tips, editar, leer).
3. Lint/build: `pnpm lint` y `pnpm build` (ver `docs/codex/COMMANDS.md`).
4. **playwright-cli** (skill) para validar visualmente contra cada referencia:
   - `/auth/login` vs `Login.html` (hero izq. + form OTP der., divisor, Google).
   - `/admin/ejercicios` y `/admin/rutinas`: headers centrados sobre su contenido.
   - Abrir detalle de un ejercicio → drawer con 3 tabs (steps/tips visibles, historial real o
     estado vacío) vs `Ejercicio Detalle.html`.
   - Crear/editar ejercicio y rutina → drawer estilo `Ejercicio Form.html`.
   - `/dashboard/rutinas/dia`: click en ejercicio abre detalle; un ejercicio con N series
     muestra N pares de inputs reps/peso; cargar valores y verificar autosave + persistencia.
5. Revisar mobile (viewport angosto): hero login oculto, inputs por serie apilados.

## Riesgos
- Reescritura del detalle (componente compartido por 3 pantallas): regresión si no se pasan
  bien los props nuevos. Mitigar manteniendo la firma `{ exercise, open, onOpenChange }`.
- Migración DB irreversible en prod: confirmar `docs/DATABASE.md` y usar defaults seguros
  (`'{}'`), sin tocar datos existentes.
- Historial real exige una query nueva sobre `workout_session_items`; si se complica, degradar
  a estado vacío sin bloquear el resto del rediseño.
- Cambio de `DraftState` a por-serie: cuidar prefill/round-trip del string slash para no romper
  el autosave existente.
