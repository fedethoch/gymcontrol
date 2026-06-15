# Plan — Pulido visual: nutrición/registro, configuración, admin/alimentos

## Context

Tres pantallas tienen problemas de proporción, jerarquía y un bug de layout:

- **`/nutricion/registro`** — cards de altura desigual, campos de porción que aparecen/desaparecen según input, cards de comida que se ocultan cuando están vacías, Resumen con donut centrado poco protagonista, lista "Comidas de hoy" sin contenedor, y zona inferior con calendario a ancho completo sin card complementaria.
- **`/configuracion`** — card "Tu plan estimado" apila kcal-objetivo, mantenimiento, barra de macros y 3 donuts en bloques verticales; se pide reordenar a círculo grande a la izquierda + macros como barras con círculo de % a la derecha.
- **`/admin/alimentos`** — la searchbar cambia ~8px de ancho entre páginas (732↔740px) por el scrollbar gutter de `.shell-main`.

Objetivo: mejorar proporción/jerarquía/alineación manteniendo el lenguaje visual existente (cards, tokens CSS, `AnimatedProgressRing`, `MACRO_COLORS`), sin rediseño genérico.

Mantener el modo de trabajo pedido: fases pequeñas, validación con Playwright (screenshots antes/después + medición de ancho), y auditoría final con `/impeccable`.

---

## Phase 0 — Baseline (antes de tocar nada)

1. Levantar dev server (`pnpm dev`), login con credenciales de `.env.local` (`EMAIL`/`EMAIL_PASSWORD`).
2. Playwright: screenshots actuales de `/nutricion/registro`, `/configuracion`, `/admin/alimentos` (página 1, 2 y **3**).
3. Medir ancho real del `input[type=search]` en admin/alimentos en páginas 1/2/3 (`getBoundingClientRect().width`) → confirmar el shift ~732↔740.

---

## Phase 1 — `/nutricion/registro`

Archivo principal: `app/nutricion/registro/RegistroClient.tsx`. Reusar: `AnimatedProgressRing`, `MacroBar` (`app/components/shared/MacroBar.tsx`), `TrainingCalendarCard`, `MACRO_COLORS`/`MACRO_LABELS` (`app/lib/nutrition-style.ts`), sub-componentes locales `TargetBar`/`SummaryStat`/`MacroChip`/`FoodPickerRow`/`MealCard`.

### 1a. Igualar altura "Nueva comida" ↔ "Resumen"
- Top grid (L180): añadir `lg:items-stretch` y `className="h-full"` a ambas `<Card>` para que la columna izquierda iguale la altura de la derecha. La card de "Nueva comida" estira su contenido (la zona del preview de items pasa a ser el área flexible).

### 1b. `FoodPickerRow` — campos siempre visibles (`app/nutricion/registro/RegistroClient.tsx`, comp. local ~L633)
- **Porción/medida (`<Select>`) y cantidad/gramos (`<Input>`) deben renderizarse siempre**, no condicionados a `foodId` ni a `canChooseUnit`.
  - Cuando no hay alimento seleccionado: mostrar los 3 campos (buscar alimento / porción / gramos·unidad) en estado deshabilitado o con placeholder, no ocultos.
  - El `<Select>` de porción se muestra siempre; si el alimento no admite unidades, queda fijo en "Gramos" (deshabilitado) en vez de desaparecer.
- Mantener el grid de 3 columnas + botón (`lg:grid-cols-[...1.6fr_1fr_1fr_auto]`) estable entre estados.

### 1c. Card de alimento (draft) siempre presente como estado vacío
- El bloque `draftItems.length > 0 && (...)` (L208) pasa a renderizarse **siempre**: con items muestra la tabla; sin items muestra un estado vacío intencional ("Agregá alimentos a esta comida", icono atenuado), no colapsa.

### 1d. Rediseño card "Resumen nutricional del día" (L258-332)
- Reordenar el bloque donut+barras a **fila horizontal**: `flex flex-col sm:flex-row sm:items-center gap-6`.
  - **Izquierda**: `AnimatedProgressRing` más grande y protagonista (`size={200}`, stroke ~16), centro con `Flame` + kcal + "de N kcal".
  - **Derecha (`flex-1`)**: las 4 `TargetBar` (Calorías, Proteína, Carbo, Grasa) apiladas.
- Zona inferior `SummaryStat`: cambiar a **Comidas hoy / Promedio diario / Racha actual**.
  - "Promedio diario" = promedio de kcal por día registrado. Datos disponibles client-side sólo cubren hoy; calcular `Math.round(totalKcal de hoy)` no es promedio real. **Resolver**: derivar promedio simple = `totalKcal` cuando sólo hay datos de hoy, o si hace falta histórico, agregar en el server page un cálculo de promedio sobre `loggedDates`. Decisión de implementación: usar promedio de kcal de los días con registro si el dato existe en `meal-logs`; si no, mostrar el kcal de hoy como aproximación con label claro. (Verificar en `app/lib/meal-logs.ts` qué agregados hay; preferir reusar antes que crear query nueva.)

### 1e. "Comidas de hoy" como card contenedora
- Envolver la sección (L336) en una `<Card>` contenedora con header propio.
- Grid interno de `MealCard`: `grid gap-3 sm:grid-cols-2` (máx 2 col → hasta **4 cards visibles** en 2×2). Si hay >4, scroll/overflow dentro del contenedor o paginado simple; mantener altura contenida.
- Estado vacío dentro de la card contenedora (no una card aparte).

### 1f. Rediseño `MealCard` (comp. local ~L379)
Estructura pedida por card de comida:
- **Top**: nombre de la comida (izq) + `{kcal} kcal` (der).
- **Medio**: listado de alimentos como ítems, cada uno con gramos (`{quantity u | grams g}`).
- **Bottom-izquierda (mayoría del ancho)**: listado de macros aportados (reusar `MacroChip` P/C/G o `MacroBar`).
- **Bottom-derecha**: dos botones pequeños **solo íconos**: editar (`Pencil`) y borrar (`Trash2`), tamaño `size="icon"` chico, consistentes.
- Editar → modo inline existente que ya permite editar gramos de cualquier alimento (reusar `handleStartEditItem`/`onUpdateItem` actuales). Conservar esa funcionalidad tras el rediseño.

### 1g. Zona inferior: Constancia + card extra (2 columnas)
- Grid `lg:grid-cols-2 gap-6`.
- **Izquierda — "Constancia nutricional"** (media): a la izquierda racha actual + días registrados **este mes** (derivar de `loggedDates` filtrando al mes actual); a la derecha el `TrainingCalendarCard` (heatmap). Componer dentro de una `<Card>` con layout `flex` interno.
- **Derecha — card extra "Tip + próxima comida"** (elección del usuario): mensaje según progreso (`totalKcal/targetKcal`) — p.ej. "🔥 Vas 78% de tu objetivo / Te falta una comida para cerrar el día equilibrado". Lógica simple basada en % y `meals.length`; sin dependencias nuevas. Reusar patrón de `WeeklyAttendanceCard`/`getMotivationalMessage` si encaja (`app/components/shared/WeeklyAttendanceCard.tsx`).

**Validación 1**: screenshots de la pantalla completa + estados (sin comidas / con 1 comida / editando gramos), desktop y ~768px. Confirmar alturas iguales, campos siempre visibles, card draft vacía intencional, sin saltos.

---

## Phase 2 — `/configuracion` card "Tu plan estimado"

Archivo: `app/configuracion/ConfiguracionClient.tsx` (L255-328). Reusar `AnimatedProgressRing`, `MacroBar`, `MACRO_COLORS`/`MACRO_LABELS`, `plan` (`calculateNutritionPlan`).

Nuevo layout de la card: `flex flex-col lg:flex-row gap-6`:
- **Izquierda (protagonista)**: `AnimatedProgressRing` grande (size ~200) con `plan.targetKcal` + "kcal objetivo". **Debajo, pequeño y secundario**: "Mantenimiento estimado · {plan.maintenanceKcal} kcal" (texto chico/muted, no el pill grande actual).
- **Derecha (`flex-1`)**: los 3 macros como **barras**, cada uno con su **círculo de %**. Por macro: fila con `AnimatedProgressRing` chico (size ~56) mostrando `{pct}%` + barra de progreso/`TargetBar`-style con label, gramos y color `MACRO_COLORS[key]`. Mantener orden protein/carbs/fat.
- Quitar la `MacroBar` segmentada y el grid de 3 donuts sueltos actuales (quedan reemplazados por las barras+círculos de la derecha). Eliminar imports que queden huérfanos.

**Validación 2**: screenshot de `/configuracion`, desktop y móvil (stack en columna). Confirmar jerarquía: círculo kcal domina, mantenimiento secundario, macros legibles.

---

## Phase 3 — `/admin/alimentos` searchbar width fix

Causa raíz (confirmada en exploración): la searchbar es una fracción (`minmax(0,1.4fr)`) del ancho de la página, y `.shell-main` (`app/globals.css` L85-91) usa `overflow-y: auto` **sin `scrollbar-gutter`**. Páginas con 8 filas desbordan → scrollbar visible → contenido ~8px más angosto (732px); última página con menos filas no desborda → sin scrollbar → ~740px.

Fix (mínimo, global, correcto): añadir a `.shell-main` en `app/globals.css`:
```css
scrollbar-gutter: stable;
```
Esto reserva el gutter siempre, el ancho de contenido deja de cambiar entre páginas. Es la solución estándar y no toca `FoodAdminClient.tsx`.

- Verificar que no rompa otras pantallas que usan `.shell-main` (todas comparten el shell → beneficio uniforme; revisar visualmente dashboard/catalogo no muestren doble gutter).

**Validación 3**: medir `input[type=search]` width en admin/alimentos página 1/2/3 con Playwright → **debe ser idéntico** en las tres. Confirmar sin salto de layout al cambiar de página.

---

## Phase 4 — Auditoría final

1. `pnpm lint` y `pnpm build` (si fallan por estos cambios, corregir). Tests si existen (`pnpm test`).
2. Playwright: las 3 rutas cargan sin errores de consola; screenshots finales desktop + móvil/tablet.
3. `/impeccable audit` sobre las pantallas modificadas → resolver hallazgos relevantes.
4. `/impeccable polish` aplicado/considerado.
5. `graphify update .` para mantener el grafo.

---

## Archivos a modificar

- `app/nutricion/registro/RegistroClient.tsx` (Fase 1 — el grueso: layout top, `FoodPickerRow`, draft card, `Resumen`, `MealCard`, contenedor "Comidas de hoy", zona inferior + card extra).
- Posible toque menor en `app/nutricion/registro/page.tsx` o `app/lib/meal-logs.ts` sólo si "promedio diario" requiere un agregado server (evaluar; preferir reusar).
- `app/configuracion/ConfiguracionClient.tsx` (Fase 2 — card "Tu plan estimado").
- `app/globals.css` (Fase 3 — `scrollbar-gutter: stable` en `.shell-main`).

## Verificación end-to-end (criterios de aceptación)

- Sin saltos de layout; ancho de searchbar **idéntico** en páginas 1/2/3 (medido con Playwright).
- Cards "Nueva comida" y "Resumen" de igual altura.
- Campos buscar/porción/gramos siempre visibles; card de alimento siempre presente (vacía = estado intencional).
- Resumen: círculo grande a la izq, barras a la der, métricas Comidas hoy / Promedio diario / Racha actual.
- "Comidas de hoy" = card contenedora con hasta 4 sub-cards 2×2; cada una con top nombre+kcal, ítems con gramos, macros abajo-izq, editar+borrar (solo íconos) abajo-der; editar gramos funciona.
- Constancia nutricional a media anchura (racha + días del mes + calendario) con card "Tip + próxima comida" a la derecha.
- Config: círculo kcal objetivo protagonista, mantenimiento secundario debajo, macros como barras con círculo de %.
- lint/build/tests verdes; consola sin errores; `/impeccable audit` sin issues relevantes.
