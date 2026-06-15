# Plan: Rediseño responsive mobile v2 — densidad y horizontal-first

## Context

El feedback visual de la v1 muestra que en mobile las cards ocupan demasiado alto y todo el
ancho, por lo que entra muy poco contenido por pantalla y el scroll es largo. La regla nueva es
**horizontal-first, denso, menos altura**: más información visible en la primera pantalla, cards
más bajas, grids de 2 columnas donde hoy hay 1, y los filtros colapsados en un botón que abre
una hoja a pantalla completa en mobile.

Sistema de diseño existente (no se cambia): tema oscuro, acento púrpura `#7c3aed` /
`--accent-bright`, Tailwind v4 (tokens en `app/globals.css`), componentes en `app/components/ui`
y `app/components/shared`. Íconos `lucide-react`. Se reutilizan primitivos existentes
(`Card`, `Sheet`, `Select`, `Button`, `ProgressRing`); no se crean componentes desde cero salvo
el wrapper de filtros.

Decisiones confirmadas con el usuario:
- **Filtro**: en mobile pasa a ser un botón "Filtros" que abre una hoja a pantalla completa con
  todos los `Select`. En desktop (`lg+`) se mantiene la fila inline actual. El input de búsqueda
  queda siempre visible (no entra al sheet).
- **/admin**: se conserva "Actividad reciente" (solo más baja). Dos filas nuevas: fila 1 =
  Acciones rápidas + Resumen de gestión; fila 2 = Últimos ejercicios + Últimas rutinas. Achicar
  el contenido de todas las cards.
- **Home**: el header se mantiene (quitarlo no aporta).

## Componente nuevo

### `app/components/shared/FilterSheet.tsx`
Wrapper de filtros mobile-first. Props: `activeCount: number`, `onClear: () => void`,
`children` (los `Select` existentes de cada página).
- **Mobile (`<lg`)**: renderiza un `Button` variant `outline` "Filtros" (ícono
  `SlidersHorizontal`) con badge de `activeCount` cuando > 0. Al tocarlo abre un `Sheet`
  (`side="bottom"`, alto ~`h-[88dvh]`) con título "Filtros", los `children` apilados, y footer
  con "Limpiar" (`onClear`) + "Ver resultados" (cierra). Reusa `app/components/ui/Sheet.tsx`.
- **Desktop (`lg+`)**: el botón y el sheet quedan ocultos (`lg:hidden`); cada página sigue
  renderizando su fila inline de `Select` como hoy (`hidden lg:grid`).

Para evitar duplicar los `Select`, el patrón por página es:
```
<div className="flex gap-3">
  <SearchInput ... />
  <div className="hidden lg:grid lg:grid-cols-[...]">{selects}</div>   // desktop inline
  <FilterSheet activeCount={n} onClear={reset}>{selects}</FilterSheet>  // mobile (lg:hidden interno)
</div>
```
Los `selects` se definen una vez como variable JSX y se pasan a ambos contenedores.

## Cambios por página

### Home — `app/page.tsx`
- Mantener `<header>`.
- Hero card (línea ~97): reducir altura. Bajar el `h2` de `lg:text-[3.8rem]` a algo tipo
  `sm:text-3xl lg:text-4xl`, recortar paddings (`p-5` → `p-4`), acortar el bloque de copy.
  Es la **única** card full-width permitida.
- Cards de métricas `WeeklyProgressCard` / `WeeklyStreakCard` / `ActiveRoutineCard`
  (`min-h-[14rem] sm:min-h-[17rem]`): quitar los `min-h`, reducir tamaños de ring/número y
  paddings para que sean bajas.
- Grid de las 3 métricas: en mobile poner `WeeklyStreakCard` + `ActiveRoutineCard` en
  `grid-cols-2` (son simples) y dejar `WeeklyProgressCard` full-width pero baja; mantener
  `lg:grid-cols-3`. Objetivo: que las 3 métricas + el calendario entren con poco scroll.

### /catalogo — `app/catalogo/RoutineCatalogClient.tsx`
- Grid de cards (línea ~190): `grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4`
  (mínimo 2 por fila en mobile).
- `RoutineCatalogCard` (línea ~279): quitar `sm:min-h-[32rem]`; imagen `h-48 sm:h-[22rem]` →
  `h-28 sm:h-40`; reducir `p-4`/gaps, `text-lg` → `text-base`, `line-clamp-4` → `line-clamp-2`.
- Filtros: extraer los 4 `CatalogSelect` a la variable JSX y envolverlos con `FilterSheet`
  (desktop inline + sheet mobile). `activeCount` = nº de filtros ≠ "all"/"recent".

### /dashboard (rutinas guardadas) — `app/dashboard/DashboardRoutinesClient.tsx`
- Grid (línea ~164): `grid-cols-1 lg:grid-cols-2` (2 por fila antes de 2xl).
- `DashboardRoutineCard` (línea ~244): reducir altura de la imagen
  (`min-h-28 sm:min-h-40` → `min-h-24 sm:min-h-28`), apretar paddings y reducir tipografías para
  que sean menos altas.
- Filtros: los 2 `DashboardSelect` → variable JSX + `FilterSheet` (desktop inline se mantiene).

### /dashboard/rutinas — `app/dashboard/rutinas/page.tsx` + `WeekDaysList.tsx`
- Panel resumen (Card línea ~115): hacerlo más horizontal y compacto. Mantener las dos mitades
  lado a lado antes (bajar el breakpoint de `lg:` a `sm:` donde sea posible), reducir tamaños de
  ring/textos para que todo entre sin apilar. Achicar el `MetricItem` (size del círculo,
  tipografías) para reducir altura.
- `WeekDaysList` day card (línea ~56): rediseñar a **círculo número a la izquierda + info a la
  derecha + botón abajo**. Estructura: contenedor `flex items-center gap-3` con `DayMarker`
  (reducir `size-16` → `size-12`) a la izquierda e info a la derecha (Día N, nombre, nº
  ejercicios, "60 min"); debajo, en una segunda fila, el botón/estado "Ver entrenamiento"
  full-width (o chip "Completado"). Quitar el grid de 4 columnas. Reducir `px-5 py-5` para menos
  altura.

### /recetas — `app/recetas/RecipeCatalogClient.tsx`
- Grid (línea ~96): `grid-cols-2 sm:grid-cols-2 lg:grid-cols-3` (2 por fila en mobile).
- `RecipeCard` (línea ~115): reducir altura — apretar paddings (`p-4 pt-0` → `p-3 pt-0`), gaps
  más chicos, mantener `aspect-[16/10]` o bajar a `aspect-[16/9]`.
- Filtro: el `Select` de categoría → `FilterSheet` (search inline + botón Filtros en mobile,
  inline en desktop).

### /nutricion/registro — `app/nutricion/registro/RegistroClient.tsx`
Reestructurar el layout (función principal, return línea ~276) para densidad:
1. **Resumen nutricional del día** primero y full-width (lo más importante). Dentro
   (línea ~319): forzar **círculo a la izquierda + barras a la derecha** también en mobile
   (`flex-row` en vez de `flex-col sm:flex-row`), reduciendo el `size={200}` del ring a algo
   tipo `140` para que entre al lado de las barras.
2. **Comidas de hoy**: mover el botón "Nueva comida" al `CardHeader` de esta card (abre el
   `Drawer` existente `newMealOpen`). Eliminar el botón suelto superior `lg:hidden` (línea ~279)
   y la card desktop "Nueva comida" (líneas ~298-302); usar el `Drawer` con `newMealBody` en
   todos los tamaños (quitar `lg:hidden` del DrawerContent). Grid de meals: mantener
   `sm:grid-cols-2`, achicar `MealCard`.
3. **Constancia nutricional + Empezá tu día (NutritionTipCard)**: en una misma fila también en
   mobile → `grid grid-cols-2` (hoy `lg:grid-cols-2`), achicando el contenido de ambas
   (tipografías, paddings, ring/calendario más chicos) para que entren.

### /admin — `app/admin/page.tsx`
- Stat tiles (línea ~93): rediseñar la card. Hoy es `flex items-center gap-4` (ícono | número+label).
  Nuevo: fila superior con **ícono y número alineados** (`flex items-center gap-3`), y **label
  abajo en un solo renglón** (`truncate`/`whitespace-nowrap`). Reducir `p-5`, `size-14` del ícono
  y `text-[2.4rem]` del número para que las cards sean más bajas. Mantener `grid-cols-2 lg:grid-cols-4`.
- Reorganizar el cuerpo en bloques más bajos:
  - **Actividad reciente**: se conserva, pero más baja (reducir `min-h-56`, paddings de filas de
    la `Table`, alturas). Queda full-width.
  - **Fila 1**: Acciones rápidas + Resumen de gestión → `grid gap-4 lg:grid-cols-2`. Hoy están
    apiladas en la columna derecha; separarlas a su propia fila de 2 columnas. Achicar contenido
    (padding de los `Link`/filas, tipografías) para menos altura.
  - **Fila 2**: Últimos ejercicios + Últimas rutinas → `grid gap-4 lg:grid-cols-2`. Achicar
    contenido (reducir `min-h-56`, paddings de filas/tabla).

### /admin/ejercicios — `app/admin/ejercicios/ExerciseAdminClient.tsx`
- Las stat tiles iniciales (línea ~233) en **grid 2x2**: `grid grid-cols-2` (hoy
  `grid-cols-1 sm:grid-cols-3`). Aplicar el mismo rediseño de `StatTile` (línea ~580) que en
  /admin: ícono+número alineados arriba, label abajo en un renglón, card más baja (reducir
  `h-36 p-7`, `size-16`, `text-4xl`).
- Mover el botón **"Nuevo ejercicio"** del header (línea ~221) a **debajo** del grid 2x2
  (full-width). Header queda solo con título/descripción.
- Filtros (línea ~239): los 2 `Select` (grupo muscular, equipamiento) → `FilterSheet`
  (search inline + botón en mobile, inline en desktop).

### /admin/rutinas — `app/admin/rutinas/RoutineAdminClient.tsx`
Mismos cambios que /admin/ejercicios:
- Stat tiles (línea ~243) → `grid grid-cols-2` (2x2) con el `StatTile` rediseñado (línea ~600).
- Botón **"Nueva rutina"** (línea ~231) movido a debajo del grid, full-width.
- Filtros (línea ~249): `Select` de dificultad + objetivo → `FilterSheet`.

## Patrón compartido de StatTile (admin)
`app/admin/page.tsx` (inline), `ExerciseAdminClient` y `RoutineAdminClient` tienen su propio
`StatTile`/tile. Aplicar el mismo layout a los tres: contenedor con fila superior
`flex items-center gap-3` (ícono + número) y `<p>` label debajo con `truncate`. Mantener cada
definición local (no se extrae a compartido para no aumentar el alcance), pero con clases
equivalentes.

## Verificación

1. `pnpm build` limpio (sin errores de tipos ni de lint).
2. Playwright / inspección visual en dos viewports:
   - Mobile **390×844**: catálogo, recetas y rutinas guardadas muestran ≥2 cards por fila;
     cards más bajas; botón "Filtros" abre hoja full-screen con los selects; resumen nutricional
     con círculo izq + barras der; /admin con stat tiles (ícono+número alineados, label 1 renglón)
     y las dos filas de cards; /admin/ejercicios y /admin/rutinas con grid 2x2 y botón "Nuevo…"
     debajo. Confirmar que entra **más contenido en la primera pantalla** que en v1.
   - Desktop **1440×900**: los filtros siguen inline (no aparece el botón), sin regresiones de
     layout.
3. Login con la cuenta admin (`.env.local`: `EMAIL` / `EMAIL_PASSWORD`) para acceder a /admin,
   /dashboard y /nutricion/registro.
4. `graphify update .` tras los cambios para mantener el grafo al día.

## Riesgos
- Densificar a `grid-cols-2` en mobile puede apretar texto en cards con nombres largos: usar
  `truncate`/`line-clamp` y verificar en 390px.
- El nuevo layout de `WeekDaysList` (botón abajo) y de /nutricion/registro tocan estructura, no
  solo clases: revisar que el `Drawer` de "Nueva comida" siga funcionando desde el header de
  "Comidas de hoy".
- `FilterSheet` debe mantener el estado de filtros en el componente padre (no resetear al
  abrir/cerrar). Verificar `activeCount` y "Limpiar".
