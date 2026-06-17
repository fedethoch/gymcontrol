# Plan: Rediseño responsive mobile (GymControl)

## Context

El usuario quiere mejorar **únicamente el responsive mobile** de varias páginas. Hoy hay
problemas de jerarquía, scroll excesivo y patrones de filtro inconsistentes. Objetivo:
cada pantalla clave debe entrar (o casi) sin scroll en mobile, con cards alineadas y
jerarquía visual clara. Cambios mobile-first; **no romper desktop** (`lg:` se mantiene).

Skills a usar durante implementación: `frontend-design` (dirección visual), `playwright-cli`
(iterar y verificar en viewport mobile 375px), `ui-ux-pro-max` (checklist de calidad).

Todas las previews ASCII fueron confirmadas por el usuario (batch 1, 2, 3).

Breakpoint del proyecto: mobile-first, desktop a `lg:` (1024px). Verificar a **375px**.

---

## 1. Quitar header (top bar) en mobile

**Confirmado:** quitar solo la barra superior; el bottom nav (`MobileTabBar`) se queda.

- `app/components/shared/PrimaryNavigation.tsx` L242-291: el bloque mobile top bar
  (`lg:hidden` con logo + ruta + Sheet hamburguesa). Quitar ese render en mobile.
- La navegación mobile queda 100% por `MobileTabBar` (incluye Sheet "Más" → mismo
  `NavigationPanel`). Verificar que el hamburguesa no era el único acceso a algún link;
  si algún link de `shellNavigationGroups` no está en los tabs, agregarlo al sheet "Más".
- Ajustar padding-top del contenido: `.page-frame` / `.shell-main` en `app/globals.css`
  (L104-131) ya no necesita reservar alto para top bar en mobile → recuperar ese espacio.
- Desktop (sidebar `lg:flex`) intacto.

## 2. Home (`app/page.tsx`)

**Confirmado:** card principal rutina de hoy; luego 3 filas de 2 cards. Todo en ~1 pantalla.
Nutrición lleva círculo kcal + restantes + barras de macros **dentro** de la misma card.

Layout mobile (grid 2-col para las filas de pares):
```
[ HOY TOCA: Día N - nombre + Ver entrenamiento ]   (full width)
[ NUTRICIÓN (círculo+restantes+macros) ] [ CARGA MUSCULAR ]
[ COMIDAS HOY ]                          [ HIDRATACIÓN ]
[ CONSTANCIA (heatmap) ]                 [ ESTA SEMANA (frase) ]
```

- El home hoy es training-only. **Cards nuevas a construir**: Nutrición, Carga muscular,
  Comidas hoy, Hidratación. Reusar lo existente:
  - Nutrición: círculo `AnimatedProgressRing` (`app/components/ui/ProgressRing.tsx`) +
    `MacroBar` (`app/components/shared/MacroBar.tsx`). Datos kcal/macros desde el mismo
    fetch que usa `app/nutricion/registro/page.tsx` (meal-logs del día) — extraer a un
    helper si hace falta. Mostrar círculo (kcal consumidas) + texto "restantes" a la
    derecha + barras de macros debajo/al lado.
  - Comidas hoy: lista corta de `meal_log_meals` del día (reusar query de registro).
  - Hidratación: card nueva simple (vasos/objetivo + barra). Confirmar fuente de datos
    durante implementación; si no existe modelo de hidratación, usar objetivo fijo + estado
    local/placeholder y marcarlo como TODO (no inventar tabla sin pedir).
  - Constancia: `TrainingCalendarCard` (ya en home).
  - Esta semana: `WeeklyAttendanceCard` (ya en home, frase motivadora).
- **Carga muscular** = card NUEVA según `public/references/body_compontent.png`
  ("Carga por músculo"): figura cuerpo frente/espalda con músculos coloreados por carga,
  leyenda (Piernas/Espalda/Pecho/Hombros/Bíceps) + barra de escala "Pesos bajos→altos".
  Existe `app/components/shared/BodyFatFigure.tsx` como punto de partida de figura SVG;
  evaluar reusar/extender o crear `MuscleLoadCard`. Datos: carga por grupo muscular
  derivada de la rutina activa (sets/ejercicios por grupo) — definir cálculo simple.
- Mobile: `grid-cols-2` para las 3 filas de pares; cada card compacta. Desktop mantiene
  `lg:grid-cols-3` / reorder actuales (no degradar).

## 3. `/dashboard/rutinas` (`app/dashboard/rutinas/page.tsx` + `WeekDaysList.tsx`)

**Confirmado:**
- Card principal: título **full-width**; subtítulo chico abajo-izq (días/sem · ejerc
  promedio/día). Hoy título y pills están en columna izq del grid (L117-133) → pasar
  título a ancho completo arriba y pills como subtítulo pequeño.
- Resumen semanal: círculo de progreso **grande** a la izq; las 3 métricas
  (Días completados, Racha actual, Tiempo estimado) **apiladas a la derecha** ocupando el
  mismo alto que el círculo. Reordenar `MetricItem` (L242-273) en columna.
- Cards de día (`WeekDaysList.tsx` L103-126 `DayMarker`): círculo ocupa **todo el alto**
  de la card (un poco más grande), a la derecha texto mismo tamaño + botón
  "Ver entrenamiento" casi mismo ancho, recortando solo lo justo para el círculo.
- Objetivo: ver hasta ~día 3 sin scroll en mobile.

## 4. Filtros (patrón global, reemplazar dropdowns)

**Confirmado:** botón filtro **a la derecha del search, sin bordes**; al abrir, panel con
**todas las opciones como chips seleccionables** (no dropdown/Select).

- Crear componente reutilizable (ej. `app/components/shared/FilterPanel.tsx`) que:
  - Renderiza botón filtro sin borde (icono) a la derecha del `Input search` (misma fila).
  - Abre panel (Sheet bottom en mobile / popover en desktop) con secciones; cada sección
    muestra todas sus opciones como chips toggle. Badge con conteo activo.
- Reemplazar el patrón actual `Select` + `FilterSheet` en los 8 sitios:
  - `app/catalogo/RoutineCatalogClient.tsx` (dificultad/objetivo/días/orden)
  - `app/dashboard/DashboardRoutinesClient.tsx`
  - `app/admin/rutinas/RoutineAdminClient.tsx`
  - `app/admin/ejercicios/ExerciseAdminClient.tsx`
  - `app/recetas/RecipeCatalogClient.tsx` (meal-type, ver punto 11)
  - `app/alimentos/NutritionCatalogClient.tsx`, `app/admin/recetas/RecipeAdminClient.tsx`,
    `app/admin/alimentos/FoodAdminClient.tsx` (los que hoy usan Select inline).
- Deprecar/retirar `FilterSheet.tsx` y los wrappers `CatalogSelect`/Select duplicados una
  vez migrados. Mantener la lógica de filtrado existente (solo cambia la UI de selección).

## 5. `/catalogo` (`app/catalogo/RoutineCatalogClient.tsx`)

**Confirmado:** todas las cards mismo alto, componentes alineados; **más espacio a la
imagen**, menos a la descripción; descripción a **1 renglón** con `...`.

- `RoutineCatalogCard` (L295-350): subir alto de imagen (`h-28 sm:h-40` → más alto), bajar
  peso de la descripción.
- Descripción L333-335: `line-clamp-2` → `line-clamp-1` (truncado 1 línea con ellipsis).
- Forzar alto uniforme: card `h-full` + cuerpo `flex flex-col`, botón `mt-auto` (ya está)
  y meta/título con altura/líneas fijas para alinear.

## 6. `/dashboard` (`app/dashboard/DashboardRoutinesClient.tsx`)

**Confirmado (variante overlay):**
- Chips de **días / nivel / mantenimiento** como **overlay encima de la imagen**.
- Imagen más grande (más peso visual). **Quitar "guardada el:"**.
- Fila de acciones: `[Abrir] [Activar/Desactivar] [...]`. El botón 3-puntitos en la **misma
  fila**, **más chico** que los otros dos y **sin borde**. Hoy el `DropdownMenu` de
  acciones está en L322-396 → mover el trigger a la fila inline y reducir tamaño/quitar
  borde.
- Objetivo: ver 1ra fila de rutinas sin scroll.

## 7. `/nutricion/registro` (`app/nutricion/registro/RegistroClient.tsx`)

**Confirmado:**
- Círculo kcal **más grande**, ocupa todo el alto disponible; **quitar espacio a las barras**
  de calorías/macros (más compactas a la derecha). Card "Resumen nutricional" L292-364:
  subir `size` de `AnimatedProgressRing` (hoy 104) y comprimir `TargetBar` (L967-1004).
- Form "Nueva comida" (Drawer, `newMealIntro` L262-274 + `newMealBody` L195-260):
  título **"Nueva comida" + subtítulo centrados** (hoy left con icono). Campos **2 por
  fila** cuando entren (`grid sm:grid-cols-2`), no full-width obligatorio.
- Card "Constancia nutricional" (L408-432): **título más grande** (hoy `text-sm sm:text-base`
  L415) y **calendario centrado** (`TrainingCalendarCard bare` L429 → contenedor centrado).

## 8. `/admin` (`app/admin/page.tsx`)

**Confirmado:**
- Tabla "Actividad reciente" (L112-162): mostrar **4 filas** + botón **"Ver más"** que la
  agranda a **8 con scroll**, manteniendo el formato; estando agrandada, botón "Ver menos".
  Cambiar `getRecentActivity(6)` (L68) a 8 y renderizar 4 con expand (estado client →
  extraer la tabla a un client component, ej. `RecentActivityTable.tsx`, o usar el patrón
  de `RecentExercisesTable.tsx`).
- "Acciones rápidas" (L165-184) + "Resumen de gestión" (L186-214) en la **misma fila**
  (ya comparten `sm:grid-cols-2`; asegurar que en mobile también vayan lado a lado si entra,
  o stack mínimo).
- "Últimos ejercicios" (4→**3**, L71) + "Últimas rutinas" (**3**, ya L72) en otra fila.
- Objetivo: con 4 filas de actividad, todo entra sin scroll de página.

## 9. `/admin/ejercicios` + replicar a rutinas/alimentos/recetas

**Confirmado:**
- Stat-cards: completar **grid 2x2** agregando 4ta card = **Tipos de equipamiento**
  (count de equipamientos distintos). `ExerciseAdminClient.tsx` L256-260 (`StatTile`).
- Botón **"Nuevo ejercicio" a la derecha del search, luego del filtro** (misma fila:
  `[search] [Filtro] [+ Nuevo]`). Hoy está full-width arriba (L262-272) → moverlo a la fila
  de búsqueda (integra con el nuevo `FilterPanel` del punto 4).
- Objetivo: ver hasta 4 ejercicios sin scroll.
- **Replicar este layout** (grid 2x2 stats + fila search/filtro/nuevo) a:
  - `app/admin/rutinas/RoutineAdminClient.tsx` (ya tiene stats; adaptar 4ta card, ej.
    dificultad/objetivo más común o rutinas activas).
  - `app/admin/alimentos/FoodAdminClient.tsx` (hoy sin stats → agregar 4 stat-cards
    adaptadas: total, agregados semana, categorías macro, etc.).
  - `app/admin/recetas/RecipeAdminClient.tsx` (hoy sin stats → agregar 4 stat-cards
    adaptadas: total, agregadas semana, por meal-type, etc.).
  - Cada uno con su botón "Nuevo X" a la derecha del search tras el filtro.

## 10. `/admin/recetas` nombre+icono centrado

**Confirmado:** solo en el **header del form** ("Nueva receta"). `RecipeAdminClient.tsx`
preview-header L483-497: centrar horizontalmente icono + nombre (`justify-center`,
`text-center`). La lista/cards quedan igual (alineadas a la izq).

## 11. Categoría de recetas: macro → meal-type

**Confirmado:** cambiar `category` de receta de macro (protein/carb/fat/vegetable/mixed) a
**meal-type: Desayuno / Comida / Snack** (3 valores). Foods siguen con macro (sin cambio).
Icono+color **por meal-type**: Desayuno = sol (amarillo), Comida = plato/cubiertos
(naranja), Snack = manzana (verde). lucide-react.

Touch-points (desacoplar recipe category de `FoodCategory`):
- `app/lib/nutrition-types.ts`: crear `RECIPE_CATEGORIES = ["desayuno","comida","snack"]`
  + `RecipeCategory` type + `RECIPE_CATEGORY_LABELS`. Cambiar `Recipe.category` (L51) de
  `FoodCategory` a `RecipeCategory`.
- DB (Supabase): alterar constraint CHECK de `recipes.category` (docs/DATABASE.md L701) a
  los nuevos valores. Migración via `supabase_gymcontrol` (`apply_migration`); contrastar
  con `docs/DATABASE.md` y actualizar ese doc. Definir migración de datos para filas
  existentes (mapear macro→meal-type por defecto, ej. todo a "comida", o pedir al usuario).
- `app/lib/recipes.ts` (L29/36/43/89/103/125/201), `app/lib/recipes-form.ts` (L14/34),
  `app/lib/recipes-validation.ts` (L40-49): cambiar tipo/validación a `RECIPE_CATEGORIES`.
- `app/lib/nutrition-style.ts`: agregar maps `RECIPE_CATEGORY_ICONS/GRADIENTS/ACCENT`
  (sol/plato/manzana + colores) para recetas, separados de los de foods.
- `app/admin/recetas/RecipeAdminClient.tsx`: picker de categoría (L514-532), preview header
  (L484/493), filtro (L62/74/152-170), render lista/cards → usar meal-type.
- `app/recetas/RecipeCatalogClient.tsx`: filtro (L36/45/51-65) y detail sheet
  (L193/207/211/219) → meal-type.
- Verificar que ningún lugar de foods/diario use estos maps de receta por error.

---

## Archivos críticos (resumen)

- Shell/nav: `app/components/shared/PrimaryNavigation.tsx`, `app/globals.css`
- Home: `app/page.tsx`, nuevo `MuscleLoadCard`, reuso `MacroBar`/`ProgressRing`/
  `TrainingCalendarCard`/`WeeklyAttendanceCard`/`BodyFatFigure`
- Rutinas: `app/dashboard/rutinas/page.tsx`, `app/dashboard/rutinas/WeekDaysList.tsx`
- Filtros: nuevo `app/components/shared/FilterPanel.tsx` + 8 clients
- Catálogo: `app/catalogo/RoutineCatalogClient.tsx`
- Dashboard: `app/dashboard/DashboardRoutinesClient.tsx`
- Nutrición: `app/nutricion/registro/RegistroClient.tsx`
- Admin: `app/admin/page.tsx` (+ nuevo `RecentActivityTable`), `app/admin/*/`*AdminClient.tsx`
- Recetas categoría: `app/lib/nutrition-types.ts`, `nutrition-style.ts`, `recipes*.ts`,
  `RecipeAdminClient.tsx`, `RecipeCatalogClient.tsx`, migración Supabase

## Verificación (playwright-cli, viewport mobile 375px)

Login con credenciales `EMAIL`/`EMAIL_PASSWORD` de `.env.local`. Para cada página, screenshot
a 375px y validar:
1. Header top bar ausente; bottom nav presente y navegable.
2. Home: 4 filas de cards entran (o casi) sin scroll; nutrición muestra círculo+restantes+
   macros; carga muscular renderiza figura+leyenda.
3. `/dashboard/rutinas`: título full-width, círculo grande + 3 métricas apiladas, días con
   círculo full-alto, ~3 días visibles sin scroll.
4. Filtros: botón a la derecha del search sin borde; panel abre con chips; filtrar funciona.
5. `/catalogo`: cards mismo alto, imagen grande, descripción 1 línea con `...`.
6. `/dashboard`: chips overlay sobre imagen, sin "guardada el", 3-puntitos chico sin borde
   en la fila de acciones, 1ra fila sin scroll.
7. `/nutricion/registro`: círculo grande, form título centrado + campos 2 por fila,
   constancia título grande + calendario centrado, sin scroll.
8. `/admin`: tabla 4 filas + expandir a 8; acciones+resumen misma fila; ejercicios+rutinas
   (3) otra fila; sin scroll con 4 filas.
9. `/admin/ejercicios` (+rutinas/alimentos/recetas): grid 2x2 stats (4ta=equipamiento),
   botón Nuevo a la derecha tras filtro, 4 items sin scroll.
10. `/admin/recetas`: header del form con icono+nombre centrados.
11. Recetas: categoría = Desayuno/Comida/Snack en form/filtro/lista; macro fuera; foods
    intactos. Probar crear/editar receta y filtrar por meal-type.

Iterar con playwright hasta que cada criterio pase. Correr `graphify update .` al terminar.

## Riesgos

- Home: faltan fuentes de datos para Hidratación y posiblemente Carga muscular → definir/
  confirmar antes de codear esas cards (no inventar tablas).
- Migración `recipes.category`: filas existentes necesitan mapeo macro→meal-type (definir
  default o consultar). Cambio de constraint es irreversible sin backup → verificar primero.
- "Todo sin scroll" depende del alto real del dispositivo; objetivo es minimizar scroll, no
  garantía absoluta en todos los tamaños.
- Migrar filtros en 8 archivos: riesgo de regresión en lógica de filtrado; verificar cada uno.
