# Plan: imágenes de ejercicios por convención de nombre

## Context

El objetivo original era extraer un frame estático de los GIF de ExerciseDB y
guardarlo por ejercicio. La auditoría descartó ese camino:

- La tabla `exercises` (62 filas) **ya tiene `image_url` en todas**, apuntando al
  bucket `exercise-images`, pero son subidas viejas de admin (uuid-prefijadas) que
  el usuario considera **obsoletas**.
- `exercisedb_id` está **null en las 62**.
- **ExerciseDB ya no sirve media**: el plan de RapidAPI devuelve solo metadata
  (sin `gifUrl`); `/image` y `/gifs` dan 404; los CDN públicos están muertos o
  detrás de paywall (401/402). No hay key de generación de imágenes en `.env.local`.
- El pipeline `media:*` del repo renderiza **placeholders geométricos falsos**
  (`scripts/render-generated-images.ps1`), no fotos reales — de ahí las imágenes obsoletas.
- Bug real de display: el hero del modal (`ExerciseDetailModal.tsx:190-226`) solo
  pinta imagen en la pestaña "Demostracion" con GIF; **nunca usa `imageUrl`**, por
  eso se ve el degradado.

**Decisión del usuario:** sin fuente externa ni IA. Convención por nombre: el usuario
sube manualmente PNGs al bucket `exercise-images` con el nombre del ejercicio en
minúsculas, sin espacios ni guiones (ej: `pressbancaplano.png`), y la app **deriva
la URL del nombre del ejercicio** para linkear automáticamente.

Resultado esperado: dropear un PNG con el nombre correcto basta para que aparezca en
el catálogo y en el hero del modal; si no hay archivo aún, se muestra el degradado.

## Convención

- Slug: `name` → NFD, sin diacríticos, minúsculas, eliminar **todo** lo no
  alfanumérico (espacios y guiones incluidos). `"Press banca plano"` → `pressbancaplano`;
  `"Abducción de cadera"` → `abducciondecadera`.
- URL: `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/exercise-images/{slug}.png`
- Extensión fija: **`.png`** (confirmado por el usuario).

## Cambios

### 1. Helper de URL por nombre — `app/lib/exercise-image.ts` (nuevo)
Módulo plano (sin `server-only`, lo usan server y cliente):
- `exerciseImageSlug(name: string): string` — normalización de arriba.
- `exerciseImageUrl(name: string): string` — arma la URL pública con
  `process.env.NEXT_PUBLIC_SUPABASE_URL`.

Reusar la lógica de normalización ya presente en `normalizeText`
(`app/lib/exercise-demo.ts:318`) pero sin el espacio entre tokens (acá se eliminan).

### 2. Derivar `imageUrl` del nombre — `app/lib/exercises.ts`
En `mapExerciseCatalogItem` (`app/lib/exercises.ts:189-220`) reemplazar
`imageUrl: exercise.image_url` por `imageUrl: exerciseImageUrl(exercise.name)`.
Esto convierte el nombre en **única fuente de verdad** para display: catálogo,
modal, tablas admin y previews quedan alineados desde un solo punto. El `image_url`
guardado en DB pasa a ser irrelevante para mostrar (la subida manual del admin queda
superada por la convención; no se rompe nada, solo se ignora para render).

### 3. Hero del modal con imagen + fallback — `app/components/shared/ExerciseDetailModal.tsx`
- En el bloque hero (`:190-226`), cuando NO es la pestaña demostración-GIF, si
  `displayExercise.imageUrl` carga bien, pintar un `<img className="h-full w-full
  object-cover">` con overlay degradado inferior (igual estilo que el branch GIF).
- Estado local `heroImgFailed` con `onError` → si el PNG no existe (404, archivo aún
  no subido), caer al bloque de degradado/grid actual. No tocar el branch GIF de
  demostración.

### 4. Fallback en cards del catálogo (graceful)
Donde se renderiza la imagen del ejercicio con la URL derivada (componente de card
del catálogo de ejercicios + `RecentExercisesTable.tsx`), agregar `onError` que
oculte la imagen rota y muestre el placeholder existente, para los ejercicios sin
PNG subido todavía. (Localizar el card del catálogo en `app/catalogo/` durante la
implementación; patrón idéntico al del modal.)

### 5. Borrar filas de test — Supabase (`execute_sql`)
Borrar los ejercicios cuyo `name` contiene "test" (`espalda test`, `test ejercicio`,
y cualquier otro que matchee, igual criterio que `isTestExercise` en
`media-manifest.mjs:238`). Antes de borrar, verificar que no estén referenciados en
`routine_items.exercise_id`; si lo están, abortar y reportar.

### 6. Limpiar imágenes obsoletas del bucket (one-off)
Script Node con service role (patrón de `scripts/upload-generated-images.mjs`):
`supabase.storage.from('exercise-images').list()` + `.remove()` de todos los objetos
viejos. El usuario subirá los nuevos PNGs con la convención de nombre.

## Archivos
- `app/lib/exercise-image.ts` (nuevo)
- `app/lib/exercises.ts` (mapExerciseCatalogItem)
- `app/components/shared/ExerciseDetailModal.tsx` (hero + fallback)
- card del catálogo de ejercicios + `app/admin/RecentExercisesTable.tsx` (onError)
- Supabase: borrar filas test (SQL)
- script one-off de limpieza de storage (no se commitea como feature)

## No se toca
- Flujo de demostración (pestaña + hero GIF).
- Navbar/PWA.
- `exercisedb_id`, `exercise-demo.ts`, ruta `demo-image` (quedan sin uso para esto
  pero fuera de alcance borrarlos).

## Verificación
1. `pnpm lint && pnpm build` ok.
2. Subir manualmente 2 PNGs al bucket: `pressbancaplano.png` y `abducciondecadera.png`.
3. Abrir el catálogo → esos 2 muestran imagen; el resto, placeholder (sin imagen rota).
4. Abrir el modal de "Press banca plano" → hero muestra el PNG en todas las pestañas;
   pestaña "Demostracion" sigue intentando el GIF como hoy.
5. Abrir el modal de un ejercicio sin PNG → hero cae al degradado.
6. Confirmar en DB que las filas test ya no existen y que el bucket no tiene objetos viejos.
7. (Opcional) Playwright: screenshot desktop+mobile del modal con y sin imagen.
