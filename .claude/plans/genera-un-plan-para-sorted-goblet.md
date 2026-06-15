# Plan: 3 mejoras de UI (configuración, admin/alimentos, nutrición/registro)

## Context

Tres tareas de frontend independientes sobre la app GymControl (Next.js 16, React 19, Tailwind 4, tema oscuro violeta):

1. **/configuracion** — la card "Tu plan estimado" se ve poco ordenada; rediseñarla más estética usando `ui-ux-pro-max`.
2. **/admin/alimentos** — bug: el searchbar cambia de ancho al llegar a una página incompleta (menos filas). Fijar ancho.
3. **/nutricion/registro** — rediseño completo basado en un mockup de Claude Design (handoff bundle ya descargado y leído). Usar `ui-ux-pro-max`.

**Decisiones del usuario:**
- Íconos: **lucide-react** + colores de macro existentes (`MACRO_COLORS`: proteína `#f4717f`, carbos `#fbbf65`, grasas `#5ec8f8`). No emojis (la guía de marca prohíbe emojis).
- **Sin navegación de fecha** en registro (queda today-only, no se toca el fetch).

Validación visual con la skill `playwright-cli` corriendo la app local.

---

## Tarea 2 — Fix searchbar /admin/alimentos (la más simple, hacer primero)

**Archivo:** `app/admin/alimentos/FoodAdminClient.tsx`

**Causa raíz:** la grilla del searchbar (línea ~166) usa tracks flexibles `sm:grid-cols-[1.4fr_1fr]`. Los `fr` se resuelven contra el ancho disponible *después* del min-content de los hijos, y el ancho del `<section>` padre depende del ancho intrínseco de la `<Table>` hermana (`Table.tsx`: `table-container` es `w-full overflow-x-auto`, `<table>` es `w-full`). En la última página con menos filas, el contenido más ancho desaparece → la tabla encoge → el padre encoge → el grid `fr` recalcula y el searchbar cambia de ancho.

**Fix:**
- Cambiar `sm:grid-cols-[1.4fr_1fr]` → `sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]`. `minmax(0,…)` evita que el min-content infle los tracks.
- Agregar `min-w-0` al `<label>` del searchbar y al `<Select>` de categoría.
- Si persiste: envolver la `<Card>` de la tabla en un contenedor `w-full min-w-0` para que su `overflow-x-auto` no propague ancho intrínseco al `<section>` padre.

**Verificar:** revisar `app/globals.css` clases `.page-frame` / `.dashboard-page-frame` (confirmar que no fijan ancho) antes de cerrar; con `minmax(0,…)` debería bastar.

---

## Tarea 1 — Rediseño "Tu plan estimado" /configuracion

**Archivo:** `app/configuracion/ConfiguracionClient.tsx` (bloque JSX líneas ~255–311).

**Datos (reusar, no tocar lógica):** objeto `plan` derivado vía `calculateNutritionPlan` (`app/lib/nutrition-calc.ts`) → `{ targetKcal, maintenanceKcal, macros:{proteinG,carbsG,fatG} }`. Componentes existentes: `AnimatedProgressRing` (`app/components/ui/ProgressRing.tsx`), `MacroBar` (`app/components/shared/MacroBar.tsx`), `Card/CardHeader/CardTitle/CardContent`, `MACRO_COLORS`/`MACRO_LABELS` (`app/lib/nutrition-style.ts`).

**Rediseño (usar `ui-ux-pro-max` para dirección visual):**
- Mejor jerarquía: anillo de kcal objetivo como héroe, con "mantenimiento estimado" como dato secundario claramente subordinado (no a la par).
- Reordenar: anillo héroe → divisor → `MacroBar` con leyenda → fila de 3 macros (gramos + % + mini-anillo) en una grilla pareja y alineada.
- Reusar tokens del proyecto (`var(--card)`, `var(--border)`, `var(--foreground-muted)`, `font-display`, eyebrows `text-[10px] uppercase tracking-[0.18em]`).
- Mantener `AnimatedProgressRing` y `MacroBar`; solo reorganizar layout/spacing/etiquetas. **No** cambiar cálculos ni el `useMemo`.
- Mobile-first (stack en mobile, fila en `sm:`).

**Alcance:** solo el JSX de esa card; no tocar el formulario ni `actions.ts`.

---

## Tarea 3 — Rediseño /nutricion/registro

**Archivos:**
- `app/nutricion/registro/RegistroClient.tsx` (reescritura del render principal + sub-componentes internos).
- `app/nutricion/registro/page.tsx` (sin cambios de fetch; ajustar solo header/props si hace falta).
- Server actions y libs **se reusan tal cual** (`actions.ts`, `app/lib/meal-logs.ts`, `app/lib/foods.ts`, `nutrition-calc/profile/style/types`).

**Fuente del diseño:** mockup leído del handoff bundle (`nutricion/registro/index.html`). Estructura objetivo:

1. **Header:** título `font-display` "Registro diario de comidas" + subtítulo. (Sin nav de fecha.)
2. **Grid 2-col** `lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,1fr)]`:
   - **Izquierda — "Nueva comida":** card redondeada (20px) con: chip de ícono (lucide, no emoji) + título/desc; input "Nombre de la comida"; fila inline `1fr 110px 110px auto` = buscar alimento (typeahead con dropdown, reusar lógica de `FoodPickerRow`) + Select unidad + cantidad + botón Agregar; tabla de "alimentos agregados" (columnas Alimento / Cantidad / Calorías / P / C / G / borrar); botón full-width "Guardar comida" (activo solo con items). Reusar `handleSaveMeal` actual.
   - **Derecha — "Resumen nutricional del día":** `AnimatedProgressRing` (kcal vs target) como donut + 4 barras de progreso (Calorías, Proteína, Carbos, Grasas) reusando `MacroBar`/`TargetBar` con `MACRO_COLORS`; pie con 3 stats (Días registrados, Promedio/Racha). Botón "Editar objetivos" → link a `/configuracion`.
3. **"Comidas de hoy":** grid `repeat(auto-fill,minmax(220px,1fr))` de `MealCard`s colapsables (chevron, lista de alimentos, chips P/C/G con `MACRO_COLORS`, acciones editar/borrar). Reusar el `MealCard` actual reestilizado.
4. **"Constancia nutricional":** reusar `TrainingCalendarCard` (`app/components/shared/TrainingCalendarCard.tsx`) como heatmap; layout `auto 1fr auto` = stats (racha / registrados mes) | heatmap | leyenda.

**Reglas de implementación:**
- Convertir los estilos inline del mockup a clases Tailwind + tokens `var(--*)` del proyecto.
- Reemplazar todos los emojis del mockup por íconos `lucide-react` (Flame, Drumstick/Beef, Wheat, Droplet, UtensilsCrossed, Plus, Save, Pencil, Trash2, ChevronDown, Search) y los colores de macro por `MACRO_COLORS`.
- Reusar componentes compartidos en vez de recrearlos; mantener cálculo de totales/streak client-side ya existente.
- Mobile-first: en mobile la grilla 2-col colapsa a 1 columna.

---

## Orden de ejecución

1. Tarea 2 (fix rápido grid) → verificar.
2. Tarea 1 (card configuracion) → verificar.
3. Tarea 3 (rediseño registro, la más grande) → verificar.
4. `graphify update .` al final para mantener el grafo.

## Verificación (playwright-cli, app local)

```
pnpm dev    # o el script del proyecto
playwright-cli open http://localhost:3000
```
- **/admin/alimentos:** navegar a la última página (incompleta) y comparar ancho del searchbar entre página llena y página incompleta — debe quedar idéntico. Screenshot antes/después.
- **/configuracion:** ver la card "Tu plan estimado" en desktop y mobile (resize 390px); confirmar jerarquía y alineación de macros.
- **/nutricion/registro:** agregar alimento → guardar comida → colapsar/expandir MealCard → ver resumen actualizar; revisar responsive (mobile 1-col).
- Login requerido: usar OTP/Google según `app/auth/login`. Confirmar credenciales de prueba con el usuario si es necesario.

## Riesgos

- Tarea 2: si `.page-frame` fija ancho de otra forma, el `minmax` solo podría no bastar; tener listo el wrap `min-w-0` de la Card.
- Tarea 3: reescritura grande de `RegistroClient.tsx`; riesgo de romper handlers de save/edit/delete. Mitigar reusando los handlers existentes sin tocar su firma.
- Macro colors del mockup (violeta) difieren de los de la app (rojo/ámbar/azul): se usan los de la app por decisión del usuario — verificar contraste sobre fondo oscuro.
