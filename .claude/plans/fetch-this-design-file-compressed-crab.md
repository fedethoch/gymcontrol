# Plan: Admin Dashboard en `/admin`

## Context

El diseño de Claude Design (`Admin Dashboard.html`, bundle `gymcontrol-design-system`)
define un dashboard admin más rico que la página actual `app/admin/page.tsx`. El actual
solo muestra 2 module-cards + tabla de últimos ejercicios. El diseño agrega:

- 4 **stat tiles** con icono (Ejercicios, Rutinas, Usuarios, Rutinas guardadas)
- **Últimos ejercicios agregados** (tabla con thumbnail)
- **Últimas rutinas** (lista con thumbnail + badge de dificultad + días)
- **Acciones rápidas** (nav: crear ejercicio / crear rutina / ver catálogo)
- ~~Actividad reciente~~ y ~~Resumen de gestión~~ → **OMITIDOS** (sin tabla/fuente en Supabase)

Objetivo: reimplementar `/admin` siguiendo el diseño, con datos reales de Supabase donde
existe fuente. **No** se copia el HTML del diseño (usa React UMD + CSS `--gc-*` propios);
se reimplementa con las idioms del repo: Server Component + Tailwind v4 + componentes
`app/components/ui/*` + tokens existentes (`--card`, `--border`, `--accent-bright`, etc.),
mobile-first.

## Decisiones (confirmadas con el usuario)

1. "Actividad reciente" y "Resumen de gestión": **omitir** hasta tener tabla de eventos. Layout se reacomoda.
2. Counts de las stat tiles: **helper nuevo** `app/lib/admin-stats.ts`.

## Mapeo diseño → repo

| Diseño (`--gc-*` / clase) | Repo |
| --- | --- |
| `--gc-card`, `--gc-border`, `--gc-foreground-muted`, `--gc-accent-bright` | `--card`, `--border`, `--foreground-muted`, `--accent-bright` (ya en `globals.css`) |
| `.gc-card` + `.card-header` | `Card` / `CardHeader` / `CardTitle` (`app/components/ui/Card.tsx`) |
| `.act-table` / `.ex-*` | `Table*` (`app/components/ui/Table.tsx`) — ya usado en page actual |
| `.badge-intermedio/avanzado/principiante` | `Badge` variants: intermedio→`accent`, avanzado→`neutral`, principiante→`success` |
| `.stat-icon`, `.qa-plus`, `.act-row-icon` (chip accent) | `div` Tailwind: `grid place-items-center rounded-md border border-[#5b2ab3] bg-[#281a45] text-[var(--accent-bright)]` |
| `.thumb` gradientes | clase existente `.thumb-fitness` / `.fitness-photo` en `globals.css` |
| Iconos (svg inline) | `lucide-react`: `Dumbbell, ClipboardList, Users, Bookmark, Plus, LayoutGrid, ChevronRight` |

Dificultad: usar `ROUTINE_DIFFICULTY_LABELS` de `app/lib/routine-metadata.ts`.

## Cambios

### 1. NUEVO `app/lib/admin-stats.ts`
- `"server-only"` + `createSupabaseServerClient` (patrón igual a `app/lib/exercises.ts`).
- `getAdminStats(): Promise<{ exercises; routines; users; savedRoutines }>`.
- Cada count: `.from(<tabla>).select("*", { count: "exact", head: true })` y leer `count`.
  Tablas: `exercises`, `routine_templates`, `profiles`, `saved_routines`.
- Counts en paralelo con `Promise.all`. Si algún count falla, lanzar Error descriptivo (mismo estilo que el resto del lib).

### 2. REESCRIBIR `app/admin/page.tsx`
Server Component `async`. Fetch en paralelo:
```ts
const [stats, latestExercises, latestRoutines] = await Promise.all([
  getAdminStats(),
  listAdminExercises(),   // existente — .slice(0,4)
  listAdminRoutines(),    // existente — .slice(0,3)
]);
```
Estructura (reusa `page-frame`):
1. **Header**: `SectionEyebrow` "Dashboard Admin" + `h1` (font-display) + subtítulo
   "Supervisá el estado general de la plataforma y gestioná el contenido."
2. **Stat grid** `grid gap-3 grid-cols-2 lg:grid-cols-4` (mobile-first): 4 tiles
   `{ icon, value, label }`. Tile = `Card` con icon-chip + valor display + label.
   Valores reales de `stats`. Hover: `hover:border-[#6d40ef]` (como diseño).
3. **two-col** `grid gap-4 lg:grid-cols-[1.15fr_1fr]`:
   - Izq: **Últimos ejercicios agregados** — `Card` + `Table` (reusar el bloque ya
     presente en la page actual: thumbnail `.thumb-fitness` + nombre + descripción +
     `createdAtLabel`). Footer link "Ver todos los ejercicios" → `/admin/ejercicios`.
     Mantener empty-state existente.
   - Der: **Acciones rápidas** — `Card`; filas link a `/admin/ejercicios`,
     `/admin/rutinas`, `/catalogo` (chip `+` / icono + label + chevron).
4. **Últimas rutinas** (full width, `Card`): filas con thumb (`.thumb-fitness` /
   `.fitness-photo`), nombre, `{dayCount} días`, `Badge` de dificultad. Footer link
   "Ver todas las rutinas" → `/admin/rutinas`. Empty-state si no hay.

Reutilizar imports existentes (`Badge`, `Button`, `Card*`, `SectionEyebrow`, `Table*`,
`Link`, lucide). Quitar `adminModules` y los bloques que ya no se usan.

### 3. `app/globals.css` (solo si hace falta)
Tokens y `.thumb-*` ya existen. Agregar **solo** un helper de gradiente extra para la 3ª
rutina si se quiere variar el thumb (opcional). No tocar nada más.

## Archivos
- NUEVO: `app/lib/admin-stats.ts`
- MODIFICADO: `app/admin/page.tsx` (reescritura)
- (opcional) `app/globals.css` — 1 clase thumb extra

No tocar: componentes `ui/*`, libs de datos existentes, navegación, otras rutas.

## Verificación
1. `npm run lint` → sin errores.
2. `npm run dev` → abrir `/admin`:
   - 4 stat tiles muestran counts reales (no NaN/undefined).
   - Tabla de ejercicios y lista de rutinas con datos reales; badges de dificultad correctos.
   - Acciones rápidas navegan a `/admin/ejercicios`, `/admin/rutinas`, `/catalogo`.
   - Responsive: en mobile las tiles caen a 2 columnas y las two-col a 1 columna.
   - Empty-states cuando no hay ejercicios/rutinas.
3. `npm run build` → compila.

## Riesgos
- Tabla `profiles` / `saved_routines`: confirmar nombres exactos contra `docs/DATABASE.md`
  (RLS puede limitar count si la sesión admin no tiene policy de lectura → contrastar con
  `supabase_gymcontrol`). Si `profiles` no es contable por RLS, mostrar el count disponible
  y dejar TODO.
- `lucide-react@1.17.0`: verificar que los íconos importados existan en esa versión.
