# Plan: Hero estático + popup GIF en detalle de ejercicio

## Context

Hoy cada ejercicio tiene un solo campo de medio: `exercises.image_url`, que apunta a un **GIF** (subido por `scripts/sync-fitnessprogramer-images.mjs` a `exercise-images/exercises/{id}.gif`). El `ExerciseDetailModal` renderiza ese GIF animado en el hero (`unoptimized` cuando termina en `.gif`).

Se quiere que el hero del detalle muestre **siempre una imagen estática** (frame 0 del GIF) y que el GIF animado solo aparezca en un popup centrado al presionar un botón. Para esto cada ejercicio debe tener **dos campos persistidos**: `image_url` (frame 0 estático) y `gif_url` (GIF completo).

Decisiones tomadas con el usuario:
- Esquema: `image_url` pasa a ser el frame 0 estático; nueva columna `gif_url` guarda el GIF. Ambas en DB.
- Botón: **icono circular con Play** sobre la imagen del hero.

## 1. DB — agregar columna `gif_url`

Nueva migración en `supabase/migrations/` (vía `mcp__supabase_gymcontrol__apply_migration`):

```sql
alter table public.exercises add column gif_url text;
```

Actualizar fuente de verdad `docs/DATABASE.md` (sección tabla `exercises`, ~líneas 510-525 y notas de medios ~431-433): documentar que `image_url` = frame estático y `gif_url` = GIF animado.

El bucket `exercise-images` ya tiene `png` en `allowed_mime_types`, así que la subida del frame estático no requiere cambios de bucket. El GIF ya está subido (`exercises/{id}.gif`); no se re-sube.

## 2. Script de backfill — frame 0 → image_url, GIF → gif_url

Nuevo script `scripts/backfill-exercise-static-frames.mjs` (mismo patrón que `sync-fitnessprogramer-images.mjs`: carga `.env.local`, dry-run por defecto, `--apply`, service role key). Reusa `sharp` (ya en `package.json`, usado en `scripts/sync-exercise-images.mjs`).

Por cada ejercicio donde `gif_url is null` y `image_url` termina en `.gif`:
1. `gif_url = image_url` (el GIF actual ya está en Supabase; no se re-sube).
2. Descargar el GIF (`fetch`), extraer frame 0: `await sharp(buf).png().toBuffer()` (sharp lee el primer frame por defecto sin `{ animated: true }`).
3. Subir a `exercise-images/exercises/{id}.png` (`contentType: "image/png"`, `upsert: true`) — reusar el patrón `uploadGifToSupabase` (`sync-fitnessprogramer-images.mjs:202-219`).
4. `update exercises set image_url = <png publicUrl>, gif_url = <gif original>` (un solo update por ejercicio).

Verificación del script: dry-run primero (lista cambios), luego `--apply`.

## 3. Capa de datos — exponer `gif_url` como `gifUrl`

- `app/lib/exercises.ts`: agregar `gif_url: string | null` al type de fila; añadir `gif_url` a los `select` (~líneas 57, 77, 95); en el mapeo a `ExerciseDetail` (~línea 225) agregar `gifUrl: exercise.gif_url`.
- `app/lib/routines.ts` (~línea 360) y `app/lib/saved-routines.ts` (~líneas 555-556, 630): agregar `gif_url` a los select y mapear `gifUrl: x.gif_url` donde ya mapean `imageUrl: x.image_url`.

## 4. Tipo `ExerciseDetail`

`app/components/shared/ExerciseDetailModal.tsx` (línea 22-37): agregar
```ts
gifUrl?: string | null;
```

## 5. Modal — hero estático + botón Play + popup Dialog

`app/components/shared/ExerciseDetailModal.tsx`:

- **Hero (líneas 82-96):** sigue usando `imageUrl` (ahora estático). Como el frame es `.png`, `unoptimized` ya no aplica; dejar `unoptimized={displayExercise.imageUrl.endsWith(".gif")}` es inofensivo (será `false`). El hero **nunca** muestra el GIF.
- **Botón Play:** botón circular solo-icono (`Play` de `lucide-react`) posicionado `absolute` en el hero (esquina sup-derecha), visible solo si `displayExercise.gifUrl`. Estilo premium minimal: fondo translúcido oscuro, blur sutil, radius full, microinteracción hover/press con Framer Motion (acorde a CLAUDE.md). `aria-label="Ver animación"`.
- **Popup:** estado nuevo `const [gifOpen, setGifOpen] = useState(false)`. Reusar `app/components/ui/Dialog.tsx` (`Dialog`, `DialogContent` con prop `open`, `DialogTitle` sr-only). Dentro, `<Image>` con `src={gifUrl}`, `unoptimized`, el GIF a tamaño contenido (cuadrado/contain) sobre el card centrado existente. Cerrar con la X integrada del `DialogContent` y overlay.
- Resetear `gifOpen` al cerrar el Sheet (junto al reset de `heroImgFailed`, líneas 67-72).

## Archivos a tocar

- `supabase/migrations/<nueva>.sql` (add column) + `docs/DATABASE.md`
- `scripts/backfill-exercise-static-frames.mjs` (nuevo)
- `app/lib/exercises.ts`, `app/lib/routines.ts`, `app/lib/saved-routines.ts`
- `app/components/shared/ExerciseDetailModal.tsx`

## Verificación end-to-end

1. Migración aplicada: `list_tables` muestra `gif_url` en `exercises`.
2. Script dry-run sin errores; con `--apply`, `execute_sql`: `select count(*) from exercises where gif_url is not null and image_url like '%.png'` ≈ total de ejercicios con GIF.
3. App (`npm run dev`, login admin de `.env.local`): abrir detalle de un ejercicio → hero muestra imagen estática (no anima). Tocar botón Play → popup centrado con GIF animado. Cerrar con X/overlay. Verificar en desktop y mobile con Playwright (hero estático, popup abre/cierra, sin overflow).
4. Listas/cards que ya usan `imageUrl` ahora muestran el frame estático (más liviano) — confirmar que no rompió ninguna vista.

## Riesgos

- Frame 0 de algún GIF puede ser poco representativo (primer fotograma). Aceptable; se puede reextraer otro frame si hace falta.
- `gif_url` queda `null` para ejercicios sin GIF o nuevos altas de admin → el botón Play simplemente no aparece (degradación correcta). Altas nuevas vía admin no generan `gif_url` automáticamente; fuera de alcance.
