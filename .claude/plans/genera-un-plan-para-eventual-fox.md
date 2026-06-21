# Plan: imagen + GIF de ExerciseDB en el detalle de ejercicio

## Context

En el modal de detalle de ejercicio (`ExerciseDetailModal.tsx`):

- **Imagen superior (hero):** muestra una imagen genérica/vieja (la columna DB `image_url`)
  en lugar de la imagen real de ExerciseDB. Causa raíz: la imagen real
  (`demo.imageUrl`, una imagen estática de ExerciseDB) solo se descarga cuando el
  usuario abre la pestaña "Demostración". Al abrir el modal, `demoState` está en
  `idle` y el hero cae al fallback `displayExercise.imageUrl` (placeholder genérico).
- **Demostración:** ya muestra el GIF de ExerciseDB (`demo.mediaUrl`, type=gif) y debe
  seguir igual. No se mezcla con la imagen.

El endpoint `GET /api/exercises/[id]/demo` ya devuelve **ambas** URLs para `source: "exercisedb"`:
`imageUrl` (estática, `type=image`) y `mediaUrl` (GIF, `type=gif`). Solo falta cargar la
metadata al abrir el modal para que el hero use la imagen real desde el inicio.

Objetivo: hero = imagen estática de ExerciseDB; pestaña Demostración = GIF. Cada uno en su
lugar, sin mezclar. Si ExerciseDB no tiene imagen → placeholder gradiente (NO la imagen
genérica de la DB).

## Cambios

### `app/components/shared/ExerciseDetailModal.tsx` (único archivo a tocar)

1. **Cargar la metadata del demo al abrir el modal** (no solo al tocar la pestaña).
   - Disparar `loadDemo(displayExercise)` cuando el modal pasa a `open` (en el
     `onOpenChange` cuando `nextOpen === true`, junto al `setTab("descripcion")`, o vía
     un `useEffect` sobre `open`/`exercise`).
   - El fetch al endpoint JSON es liviano (devuelve URLs, no bytes); la imagen estática y
     el GIF se descargan recién cuando el `<Image>`/`<img>` se renderizan.
   - `loadDemo` ya cubre el caso `videoUrl` (manual, sin `imageUrl`) y el caso
     `exercisedb` (con `imageUrl` + `mediaUrl`). No requiere cambios de lógica de fetch.

2. **Hero usa la imagen de ExerciseDB y cae a gradiente** (líneas 184-222).
   - `src` del `<Image>`: usar `demoState.status === "ready" && demoState.demo.imageUrl`.
   - **Quitar** el fallback a `displayExercise.imageUrl` (imagen genérica de la DB) tanto
     en la condición del ternario como en `src`. Cuando no hay `demo.imageUrl`, renderizar
     el bloque del placeholder gradiente (ramas existentes, líneas 197-221).
   - `unoptimized`: mantener `true` para la imagen de ExerciseDB (viene del proxy).
   - Mientras `demoState` está en `loading`/`idle` inicial, mostrar el gradiente (evita
     flash de imagen vieja). Opcional: skeleton/gradiente durante `loading`.

3. La pestaña **Demostración** queda intacta (`DemoMedia`, líneas ~482-526): sigue usando
   `demo.mediaUrl` (GIF). No se modifica.

### No tocar

- `app/api/exercises/[id]/demo/route.ts`, `app/api/exercises/demo-image/route.ts`,
  `app/lib/exercise-demo.ts` — ya devuelven `imageUrl` (estática) y `mediaUrl` (GIF)
  correctamente.

## Verificación (end-to-end)

1. `npm run dev` y loguear con la cuenta admin (`.env.local` EMAIL / EMAIL_PASSWORD).
2. Abrir un ejercicio con `exercisedb_id` poblado:
   - Hero muestra **inmediatamente** la imagen estática de ExerciseDB (no la genérica).
   - Pestaña "Demostración" muestra el **GIF** animado.
   - Confirmar que imagen (hero) y GIF (demo) son distintos y no se mezclan.
3. Abrir un ejercicio **sin** demo de ExerciseDB (sin `exercisedb_id` / no encontrado):
   - Hero muestra el **placeholder gradiente** con el grupo muscular (no imagen genérica).
4. Ejercicio con `videoUrl` manual: hero = gradiente; demo = video. (Aceptado.)
5. Network tab: al abrir el modal se hace 1 request a `/api/exercises/[id]/demo`; los bytes
   del GIF (`/api/exercises/demo-image?...type=gif`) recién al abrir la pestaña demo.
6. `npm run lint` / typecheck para confirmar tipos del ternario del hero.
7. (Opcional) `playwright-cli` para inspeccionar hero en desktop y mobile.
8. Tras los cambios: `graphify update .`.

## Riesgos

- 1 request extra a `/api/exercises/[id]/demo` al abrir cada modal (antes solo al tocar
  la pestaña). Aceptable: es JSON liviano y necesario para el hero.
- Ejercicios manuales (videoUrl) o sin match en ExerciseDB pierden la imagen genérica de la
  DB en el hero → pasan a gradiente (comportamiento pedido).
