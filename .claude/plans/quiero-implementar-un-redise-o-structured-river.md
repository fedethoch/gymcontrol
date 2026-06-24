# Rediseño visual — Dashboard principal (PWA)

## Context

El dashboard principal (`app/page.tsx`, server component en ruta `/`) ya tiene
todas las features y datos reales: hero del día, nutrición, carga muscular,
comidas, constancia y calendario nutricional. Pero la dirección visual actual es
condensada (cards de medio ancho, sin stats en el hero, sin fila de resumen
diario). El mockup `docs/design-references/dashboard-principal-redesign-v1.png`
pide una versión **dark fitness premium** más accionable y con jerarquía clara:
hero con stats y grupos musculares, fila de 3 cards de resumen, y cards de
nutrición / carga muscular más grandes con CTAs.

Objetivo: replicar fielmente el mockup **sin tocar lógica, rutas, datos, auth ni
DB**. Solo capa visual. Reutilizar componentes existentes; crear sub-componentes
presentacionales nuevos solo donde mejora consistencia.

Alcance estricto: solo `app/page.tsx` (+ ajustes CSS menores en `globals.css` si
hacen falta). **No** tocar el navbar inferior (`MobileTabBar`), header
(`MobileHeader`), ni otras secciones.

## Decisiones tomadas (confirmadas con el usuario)

- **Duración estimada del hero**: no existe en DB → derivar de `series` + `rest`
  de los ejercicios del día (estimación real, no hardcode).
- **CTA "Ver detalle muscular"**: no existe ruta dedicada → **se omite** el CTA.
  La card de carga muscular queda sin link.

## Datos: todo derivable de lo que ya se fetchea (sin nuevas queries)

`app/page.tsx` ya carga `activeRoutine`, `nextPendingDay`, `weeklySummary`,
`mealLog`, `plan`, `muscleStrengthSummaries`, `completedTrainingDates`, `streak`,
`nutritionLoggedDates`. Derivar lo nuevo en el server component:

- **Grupos musculares del día** (título hero, ej. "Pierna · Bíceps · Abs"):
  de `nextPendingDay.items[].exercise.muscleGroup` → dedupe + ordenar por
  frecuencia, tomar top ~3. Fallback: `nextPendingDay.dayName`.
- **Subtítulo hero** ("Día N de tu rutina semanal"): `nextPendingDay.dayOrder` +
  `activeRoutine.days.length`.
- **N ejercicios** (hero stat + card Entrenamiento): `nextPendingDay.items.length`.
- **Duración estimada** (hero stat): helper `estimateDayMinutes(items)` →
  `Σ series * (~tiempo_serie + rest_segundos)` redondeado a 5 min. Label "~X min".
- **Completados** (hero stat): `completedDayIds.size` de días de la rutina
  (`weeklySummary.completedRoutineDayIds`). Real.
- **Card Entrenamiento** (resumen): "0/N ejercicios · Pendiente" si el día está
  pendiente (no trackeamos por-ejercicio en dashboard → 0 cuando pendiente);
  CTA → `primaryHref` (ya calculado).
- **Card Nutrición** (resumen): `totalKcal` agregadas / `plan.targetKcal` objetivo.
- **Card Constancia** (resumen): `streak` + label "racha actual".

## Estructura objetivo (mobile-first, top → bottom)

1. **Hero** (rediseño de bloque existente, líneas ~168-230):
   - eyebrow "HOY TOCA"
   - título = grupos musculares del día (acento violeta en separadores)
   - subtítulo "Día N de tu rutina semanal"
   - **fila de stats** (nueva): `~X min` · `N ejercicios` · `X completados`,
     cada uno con icono lucide (`Clock`, `Dumbbell`/`ListChecks`, `CircleCheck`)
   - CTAs: "Comenzar entrenamiento" (`primaryHref`) + "Ver rutina" (`/rutinas`)
   - imagen `/images/hero.png` con gradiente oscuro + glow violeta (ya existe)
2. **Fila 3 cards de resumen** (nueva): Entrenamiento / Nutrición / Constancia.
   `grid grid-cols-3 gap-2`. Sub-componente nuevo `<SummaryStatCard>` (icono,
   valor grande, label, sublabel/estado).
3. **Card Nutrición de hoy** (ancho completo): reusar lógica de `NutricionCard`
   pero layout horizontal: ring kcal a la izquierda, macros a la derecha, CTA
   "Agregar comida" → `/nutricion/registro`. `col-span-2` / full width.
4. **Card Carga muscular** (ancho completo): reusar `CargaMuscularCard` +
   `BodyMuscleFigure` (ya renderiza front+back). Sin CTA. Leyenda de intensidad.
5. **Card Comidas de hoy** (existente `ComidasHoyCard`): mantener; empty state ya
   coincide con el mockup ("Todavía no registraste comidas" + "Agregar comida").
6. **Fila inferior** (existente): Constancia semanal (`TrainingCalendarCard`) +
   Registro nutricional (`NutritionCalendarCard`), grid 2-col.

Layout: pasar de `grid-cols-2` compacto a una secuencia más vertical/espaciada
con cards full-width para nutrición y carga muscular, manteniendo el grid 2-col
solo en la fila inferior de calendarios. Respetar `lg:` para desktop.

## Archivos a modificar

- **`app/page.tsx`** (principal): reescribir el JSX del `return` y agregar
  sub-componentes presentacionales nuevos en el mismo archivo:
  - `HeroStat` (icono + valor + label)
  - `SummaryStatCard` (las 3 cards de resumen)
  - helper `estimateDayMinutes(items)` y `dayMuscleGroups(items)`
  - adaptar `NutricionCard` a variante horizontal con CTA (o nueva
    `NutricionTodayCard` reutilizando los cálculos de macros existentes)
  - quitar CTA/route inexistente en `CargaMuscularCard`
  Mantener intactos: data fetching (líneas 70-153), imports de datos, lógica.
- **`app/globals.css`** (solo si necesario): ajustes mínimos de spacing del
  `page-frame` / clases auxiliares. Evitar tocar reglas del `mobile-tab-bar`.

Reutilizar (sin modificar): `Button`, `AnimatedProgressRing`, `AnimatedMacroBar`,
`GlowPulseWrapper`, motion helpers (`fadeUp`, `MotionDiv`, `MotionSection`,
`staggerContainer`, `tapFeedback`), `BodyMuscleFigure`, `TrainingCalendarCard`,
`NutritionCalendarCard`, `MobileHeaderBadgeSync`. Iconos: solo `lucide-react`.
Acento violeta vía vars existentes (`--accent`, `--accent-bright`).

## No hacer

- No tocar `MobileTabBar`, `MobileHeader` (greeting "Hola, Fede" + bell + racha
  ya existen y coinciden con el mockup), ni layout/AppShell.
- No nuevas rutas, queries, migraciones, ni cambios de auth.
- No hardcodear kcal/objetivo/ejercicios — todo derivado de datos reales.
- No agregar libs nuevas (framer-motion ya instalado; usar microinteracciones
  sutiles existentes: tap feedback, fadeUp/stagger).

## Verificación

1. `npm run dev` (o el script equivalente del proyecto).
2. Login con credenciales de `.env.local` (EMAIL / EMAIL_PASSWORD).
3. **Playwright MCP**: abrir `/`, viewport mobile (~390px) y desktop, screenshot.
4. Comparar contra `docs/design-references/dashboard-principal-redesign-v1.png`:
   layout, jerarquía, spacing, contraste, tamaños de texto, estados vacíos,
   responsive (sin overflow, navbar inferior intacto).
5. **≥1 ronda de corrección visual** tras la comparación.
6. Checks del proyecto: `npm run lint` y typecheck (`tsc --noEmit` / script
   `typecheck` si existe). No modificar config del linter para pasar.
7. Confirmar que con usuario sin datos (kcal 0, sin comidas, sin racha) los
   empty states se ven limpios como en el mockup.

## Riesgos

- Estimación de duración puede verse arbitraria → mantener label "~X min" y
  redondeo a 5 min para que lea como aproximación.
- Cards full-width cambian densidad → revisar que no rompa el scroll ni el
  padding inferior del `page-frame` (safe-area + navbar).
- `BodyMuscleFigure` tiene tamaño SVG fijo (90×180) → validar que escale bien en
  card full-width sin recortes.
