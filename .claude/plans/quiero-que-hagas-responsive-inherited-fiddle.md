# Plan: Responsive audit + fixes (desktop / tablet / mobile)

## Context

La app (Next.js app-router + Tailwind) debe verse bien y ser usable en mobile (375px),
tablet (768px) y desktop (1440px) sin romper el diseño actual. La exploración muestra que
**la base ya es responsive**: el shell global (`globals.css` + `PrimaryNavigation`) pivotea a
`lg` (1024px) con drawer móvil; los modales/sheets usan `w-full ... sm:max-w-[...]`; el `Table`
compartido envuelve en `overflow-x-auto`; los grids de listas colapsan a 1 columna en mobile.

Los problemas reales están **concentrados**, sobre todo en tablas de admin que no usan el
patrón compartido, más unos pocos grids sin fallback y cards de catálogo con altura fija.
Objetivo: corregir esas roturas y pulir spacing / alturas / touch-targets para que mobile se
vea *pensado*, manteniendo desktop igual o mejor. **Sin rediseño.**

Decisiones del usuario:
- Tablas anchas en mobile → **cards apiladas** (tabla en tablet/desktop, tarjetas verticales <768px).
- Alcance → **arreglar roturas + pulir** (spacing, altura de cards, touch-targets), sin rediseño.

## Estrategia

Primero global/compartido, después fixes por página (regla del usuario). Reusar componentes
existentes (`Card`, `CardContent`, `Badge`, `Table`, `Sheet`) — no crear nada desde cero.

### Patrón reutilizable para tablas → cards (las 3 tablas anchas)

Patrón consistente, sin abstracción nueva innecesaria: cada tabla renderiza dos vistas sobre
la **misma data ya mapeada**:
- `<div className="hidden md:block">` → la tabla actual (en `Table` con `overflow-x-auto`).
- `<div className="md:hidden space-y-3">` → lista de cards verticales (label: valor) reusando `Card`/`Badge`.

Las acciones (editar / menú) van en cada card con touch-target ≥ 44px.

## Archivos a modificar

### 1. Tablas → responsive (prioridad alta)
- **`app/admin/rutinas/RoutineAdminClient.tsx`** — `<table>` crudo de 8 columnas (línea ~317),
  NO envuelto en scroll. Migrar a: `Table` compartido (`hidden md:block`) + lista de cards
  (`md:hidden`). **El peor caso, primero.**
- **`app/admin/alimentos/FoodAdminClient.tsx`** — `Table` con `table-fixed` + anchos `%` que
  aprietan contenido. Misma estrategia tabla/cards; quitar `table-fixed` o limitarlo a `md:`.
- **`app/catalogo/rutinas/[id]/RoutineDetailClient.tsx`** — `<Table className="min-w-[44rem]">`.
  Tabla (`hidden md:block`, conservar `min-w` con scroll) + cards de ejercicios en mobile.
- **`app/admin/recetas/RecipeAdminClient.tsx`** — 6 columnas; aplicar mismo patrón por consistencia.

### 2. Grids sin fallback mobile (pulir)
- **`app/configuracion/ConfiguracionClient.tsx`** — `grid grid-cols-3` de Edad/Altura/Peso sin
  fallback <sm: asegurar `min-w-0` en inputs y reducir gap en mobile (o `grid-cols-3` con `gap-2`).
- **`app/dashboard/rutinas/dia/DayWorkoutClient.tsx`** — `SeriesInputsGroup` grid de 3 tracks
  sin guard: `min-w-0` en inputs para evitar apretado en 375px.
- Inputs de macros (`grid-cols-3`) en exercise/food admin: ya están dentro de Sheet, solo `min-w-0`.

### 3. Cards de catálogo y tarjetas (pulir)
- **`app/catalogo/RoutineCatalogClient.tsx`** — imagen `h-[22rem]` y `min-h-[32rem]` fijas →
  altura fluida en mobile (`h-56 sm:h-[22rem]`, soltar `min-h` en mobile).
- **`app/components/shared/TrainingCalendarCard.tsx`** — grid `w-fit` no-scrollable → envolver
  en `overflow-x-auto` por seguridad ante overflow del card.

### 4. Touch-targets
- Botones icon-only y acciones de fila (editar/menú/sort) → garantizar `≥ 44px` (`h-11`/`size-11`
  o `p-` adecuado) en las vistas mobile creadas.

### Se mantiene intencionalmente (no romper desktop)
- Shell con único breakpoint `lg` (drawer hasta 1024px): patrón válido, tablet usa drawer. No tocar.
- `body { overflow: hidden }` + scroll en `.shell-main`: correcto, mitiga overflow horizontal.
- Sidebar `w-[320px]`, `BodyFatFigure w-[140px]`, `StatTile h-36`: seguros, sin cambio.

## Proceso de ejecución (con skills + Playwright)

1. `frontend-design` + `ui-ux-pro-max` → guiar patrón mobile-first de cards/tablas y spacing.
2. Implementar globales/patrón compartido primero, luego por página (orden de prioridad arriba).
3. Playwright a **375 / 768 / 1440** en cada ruta principal:
   `/`, `/auth/login`, `/dashboard`, `/dashboard/rutinas`, `/dashboard/rutinas/dia`,
   `/catalogo`, `/catalogo/rutinas/[id]`, `/alimentos`, `/recetas`, `/nutricion/registro`,
   `/configuracion`, `/admin`, `/admin/ejercicios`, `/admin/rutinas`, `/admin/alimentos`,
   `/admin/recetas`. (Login admin con credenciales de `.env.local`.)
4. Detectar overflow horizontal, tablas/forms/cards rotos, nav, legibilidad, touch-targets.
5. Corregir; re-verificar con Playwright.
6. `impeccable` → auditoría final de UI; `web-design-guidelines` como apoyo.
7. Corregir hallazgos; repetir hasta estar limpio.
8. `graphify update .` al terminar (regla del repo).

## Verificación / criterios de done

- Sin scroll horizontal accidental en 375 / 768 / 1440 (chequear `document.scrollingElement.scrollWidth` vs `clientWidth` con Playwright en cada ruta).
- Nav mobile (drawer) abre/cierra y navega bien.
- Las 4 tablas: cards legibles en mobile, tabla intacta en tablet/desktop.
- Forms cómodos (inputs no apretados), modales/sheets full-width en mobile.
- Cards de catálogo con altura fluida, sin huecos enormes en mobile.
- Touch-targets ≥ 44px en acciones.
- Desktop 1440 idéntico o mejor (comparación visual antes/después).

## Entregable final al usuario

Reporte con: rutas revisadas · cambios hechos · qué se validó con Playwright · hallazgos de
`impeccable` · confirmación de que no quedan problemas responsive importantes.
