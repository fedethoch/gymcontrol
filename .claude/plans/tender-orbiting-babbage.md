# Plan: Optimización de rendimiento de GymControl

## Context

La app carga más lento que apps comparables. Auditoría del código real (no supuestos) encontró varias causas. Objetivo: cerrar todas las brechas detectadas (alcance completo elegido por el usuario), priorizando ganancias de bajo riesgo primero.

**Corrección importante vs. auditoría inicial:**
- `getOptionalAuthContext` **ya usa React `cache()`** (`app/lib/auth.ts:107`) → la sesión se deduplica por request. **No requiere fix.**
- El root layout lee cookies (auth) en cada ruta → Next renderiza dinámico de todas formas. Quitar `force-dynamic` solo no vuelve estática `/catalogo`. La ganancia real está en **cachear los queries de datos** (funciona aun bajo render dinámico) + imágenes.

**Decisiones del usuario:**
- Imágenes: **proxy + cache a Supabase** (descargar GIFs externos una vez, servir desde dominio propio).
- Alcance: **todo lo detectado**.

---

## Causas confirmadas (file:line)

| # | Problema | Evidencia | Impacto |
|---|----------|-----------|---------|
| 1 | Queries de datos sin cache | `app/lib/routines.ts:180` (join profundo 4 niveles), foods/exercises/recipes/etc. todos plain | Alto |
| 2 | Imágenes externas crudas | `ExerciseDetailModal.tsx:84` `<img>` desde fitnessprogramer.com (.gif) o Supabase (.png) | Alto |
| 3 | GIFs pesados de tercero sin cache | `public/sw.js` no cachea cross-origin; remotePatterns solo whitelist Supabase | Alto |
| 4 | framer-motion en critical path | `AppShell.tsx:4` (MotionConfig) + `MobileTabBar.tsx:6` en layout → todas las rutas | Medio |
| 5 | `force-dynamic` en root layout | `app/layout.tsx:67` | Bajo-medio (ver nota) |

---

## Cambios propuestos

### Fase 1 — Cache de queries (mayor ganancia, bajo riesgo)

Envolver los lectores públicos/estables con `unstable_cache` (`next/cache`). Mantiene render dinámico pero evita golpear Supabase en cada request.

- `app/lib/routines.ts` — `listRoutineTemplates` (`:180`), `getRoutineById` (`:194`), `listAdminRoutines` (`:138`).
  ```ts
  import { unstable_cache } from "next/cache";
  export const listRoutineTemplates = unstable_cache(
    async () => { /* query actual */ },
    ["routine-templates"],
    { revalidate: 3600, tags: ["routines"] }
  );
  ```
- Mismo patrón para lectores estables: `app/lib/foods.ts`, `app/lib/exercises.ts`, `app/lib/recipes.ts`.
- **NO cachear** datos por-usuario que cambian seguido: `saved-routines.ts`, `meal-logs.ts`, `workout-tracking.ts`, `nutrition-profile.ts`, `admin-stats.ts`.
- **Invalidación:** en server actions de admin que escriben (`app/admin/rutinas/actions.ts`, `app/admin/ejercicios/actions.ts`, `app/admin/alimentos/actions.ts`), llamar `revalidateTag("routines")` / `"exercises"` / `"foods"` tras escribir.

**Verify:** abrir `/catalogo` dos veces; segundo request no debe disparar query en logs de Supabase. Editar rutina en admin → `/catalogo` refleja el cambio (tag invalidado).

### Fase 2 — Proxy de imágenes a Supabase

Unificar TODAS las imágenes de ejercicio en Supabase Storage (ya whitelisted en `remotePatterns`), eliminando dependencia de fitnessprogramer.com en runtime.

- Extender `scripts/sync-fitnessprogramer-images.mjs`: tras `extractGifUrl()` (`:198`), **descargar el GIF y subirlo** al bucket `exercise-images` (reusar patrón de `scripts/upload-generated-images.mjs`), y guardar la **URL de Supabase** en `image_url` en vez de la URL externa (`:176`).
- Script idempotente: saltear ejercicios cuyo `image_url` ya apunta a Supabase.
- Correr una vez (`--apply`) para migrar el catálogo existente.

**Verify:** `select image_url from exercises` → ninguna fila apunta a fitnessprogramer.com. Modal abre imagen desde dominio Supabase.

### Fase 3 — next/image en el modal

Con todas las imágenes en Supabase, reemplazar `<img>` cruda por `next/image`.

- `app/components/shared/ExerciseDetailModal.tsx:84-90`:
  ```tsx
  import Image from "next/image";
  <Image src={displayExercise.imageUrl} alt={displayExercise.name}
    fill sizes="(max-width:640px) 72vw, 34rem"
    className="object-contain"
    onError={() => setHeroImgFailed(true)}
    unoptimized={displayExercise.imageUrl.endsWith(".gif")} />
  ```
  (`unoptimized` para GIFs: Next no los recodifica; igual se sirven con cache de Supabase.)
- Quitar el `eslint-disable @next/next/no-img-element`.

**Verify:** `pnpm build` sin warning de img; modal renderiza; Network muestra `/_next/image` para PNG.

### Fase 4 — Service Worker cachea imágenes de Supabase

- `public/sw.js`: agregar runtime caching **stale-while-revalidate** para imágenes del host Supabase Storage (hoy `:45` descarta cross-origin). Cache name nuevo o versión bump (`gymcontrol-shell-v3`).

**Verify:** segunda apertura de un modal de ejercicio sirve la imagen desde SW cache (offline-capable).

### Fase 5 — framer-motion fuera del critical path

`AppShell` y `MobileTabBar` están en el layout → framer-motion entra al bundle de todas las rutas.

- `app/components/ui/AppShell.tsx:4`: `MotionConfig` envuelve toda la app. Evaluar reemplazar por CSS (`prefers-reduced-motion` ya manejable con media query) o `next/dynamic` con `ssr:false`.
- `app/components/shared/MobileTabBar.tsx:6`: `motion` para microinteracciones del tab bar. **No tocar tamaño/posición/comportamiento del navbar** (regla del proyecto) — solo migrar la animación a CSS transitions si es trivial, o lazy-load.
- Componentes más profundos (`WeekDaysList`, `DayWorkoutClient`, `OtpLoginFlow`) ya están code-split por ruta; dejar como están.

**Verify:** `pnpm build` → comparar tamaño del First Load JS compartido antes/después; framer-motion no debe estar en el chunk compartido del layout.

### Fase 6 — `force-dynamic` (revisión final)

- `app/layout.tsx:67`: quitar `export const dynamic = "force-dynamic"`. El layout seguirá dinámico por leer cookies, pero deja que rutas sin auth (si las hay) puedan optimizarse.
- **No** tocar `force-dynamic` en las API routes (`demo-image`, `[id]/demo`) — son correctas ahí.

**Verify:** `pnpm build` muestra el reporte de rutas; confirmar que ninguna ruta autenticada rompió.

---

## Archivos a modificar (resumen)

- `app/lib/routines.ts`, `foods.ts`, `exercises.ts`, `recipes.ts` — `unstable_cache`
- `app/admin/{rutinas,ejercicios,alimentos}/actions.ts` — `revalidateTag`
- `scripts/sync-fitnessprogramer-images.mjs` — descargar+subir a Supabase
- `app/components/shared/ExerciseDetailModal.tsx` — `next/image`
- `public/sw.js` — runtime cache de imágenes Supabase
- `app/components/ui/AppShell.tsx`, `app/components/shared/MobileTabBar.tsx` — reducir framer-motion (cuidando navbar)
- `app/layout.tsx` — quitar `force-dynamic`

## Verificación end-to-end

1. `pnpm build` limpio (sin warnings de img, rutas OK).
2. `pnpm validate:mobile` pasa.
3. Lighthouse antes/después en `/catalogo` y `/rutarias/dia`: comparar LCP, Total Blocking Time, peso transferido.
4. Logs de Supabase: requests repetidos a páginas públicas no re-disparan queries.
5. Modal de ejercicio: imagen desde Supabase, cacheada por SW en segunda apertura.
6. Editar entidad en admin → invalidación de cache refleja cambio.

## Riesgos

- `unstable_cache` puede servir datos viejos hasta `revalidate`/invalidación → mitigado con `revalidateTag` en writes.
- Migración de imágenes es one-shot destructiva sobre `image_url` → correr primero en dry-run, backup de la columna.
- Tocar framer-motion en `MobileTabBar` arriesga la regla de no alterar el navbar → limitar a animación, no layout.
