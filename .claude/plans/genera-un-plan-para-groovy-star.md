# Plan: unidades de alimentos, comidas con nombre, figura grasa, layout /configuración

## Context

Cuatro cambios sobre el módulo de nutrición:

1. **Alimentos por unidades.** Hoy todo alimento se cuantifica solo en gramos (`foods.serving_g`). Se quiere poder definir alimentos medidos en **unidades** (ej. huevo, pan) además de gramos.
2. **Registro diario con comidas nombradas.** Hoy el registro usa slots fijos `meal_order` 1..6 con nombres hardcodeados (`RegistroClient.tsx:24-32`). Nuevo flujo: el usuario **crea una comida, le pone nombre** (ej. "Desayuno") y le **agrega varios alimentos** (2 huevos, 1 pan, 200ml leche). Cada comida nombrada aparece en "Comidas de hoy".
3. **/configuración: figura del % graso.** El card de % graso solo tiene botones de rango. Agregar una **silueta SVG ilustrativa** que cambia según el rango elegido.
4. **/configuración: layout.** Quitar el card placeholder "Completá tus datos y calculá" y hacer que los cards (hoy limitados a la izquierda por el grid 2-col) ocupen el **ancho completo**.

Decisiones tomadas con el usuario: medidas = **gramos + unidades** (sin ml); modelo de comidas = **reemplazar slots fijos por nombre libre**; figura = **silueta SVG generada** (sin assets externos).

Skills obligatorias: **frontend-design** para la silueta SVG y el rediseño de layout; **playwright-cli** para validar en navegador. Componentes base existentes (shadcn `Card/Button/Input/Select`) se reutilizan, no se crean desde cero.

---

## Parte 1 — Alimentos: gramos o unidades

Modelo: cada alimento tiene un `measure` ('g' | 'unit'). Las macros se siguen guardando "por porción de referencia":
- `measure='g'`: `serving_g` = gramos de referencia (ej. 100), macros por esos gramos. (comportamiento actual)
- `measure='unit'`: `serving_g` = **gramos de 1 unidad**, macros **por 1 unidad**. UI muestra "1 unidad ≈ {serving_g} g".

Los `meal_log_items` siguen guardando solo `grams` (numérico). Para alimentos por unidad: `grams = unidades × serving_g`; las unidades para mostrar se derivan como `grams / serving_g`. **No cambia el schema de items por esta parte** — el escalado de macros (`ratio = grams / serving_g` en `meal-logs.ts:215`) sigue igual.

### Migración (nueva, vía `apply_migration`)
- `alter table public.foods add column measure text not null default 'g' check (measure in ('g','unit'));`

### Archivos
- `app/lib/nutrition-types.ts`: nuevo `FOOD_MEASURES = ['g','unit']`, type `FoodMeasure`, `FOOD_MEASURE_LABELS`; agregar `measure: FoodMeasure` a `Food`.
- `app/lib/foods.ts`: `FOOD_SELECT` + `FoodRow` + `mapFood` + `FoodInput` + insert/update agregan `measure`.
- `app/lib/foods-form.ts`: agregar `measure` a `FoodFormPayload` (string) y `ParsedFoodPayload`; agregar `'measure'` a `FoodFormField`.
- `app/lib/foods-validation.ts`: validar `measure` contra `FOOD_MEASURES` (igual patrón que `category`, líneas 33-42).
- `app/admin/alimentos/actions.ts`: pasar `measure` en create/update.
- `app/admin/alimentos/FoodAdminClient.tsx`: en el form, toggle `measure` (reusar `ToggleOption`/Select existente); el label del campo porción se adapta: "Porción (g)" vs "Peso por unidad (g)"; macros "por porción" vs "por unidad". En la tabla (col Porción, ~`:211`) mostrar `1 u (≈{servingG} g)` para unit.
- Revisar `app/lib/nutrition-mock.ts` y `diet-templates.ts`: si construyen objetos `Food` literales, agregar `measure: 'g'` (grep `servingG:` / `serving_g`).

---

## Parte 2 — Registro diario: comidas con nombre

Nueva entidad "comida" (contenedor nombrado) como tabla propia, reemplazando `meal_order`.

### Migración (nueva, vía `apply_migration`)
```sql
create table public.meal_log_meals (
  id uuid primary key default gen_random_uuid(),
  meal_log_id uuid not null references public.meal_logs(id) on delete cascade,
  name text not null,
  position integer not null default 1,
  created_at timestamptz not null default now()
);
create index on public.meal_log_meals(meal_log_id);

-- datos dev mínimos (1 fila en meal_log_items): limpiar antes de cambiar la FK
delete from public.meal_log_items;
alter table public.meal_log_items drop column meal_order;
alter table public.meal_log_items add column meal_id uuid not null
  references public.meal_log_meals(id) on delete cascade;
create index on public.meal_log_items(meal_id);
```
- **RLS**: habilitar RLS en `meal_log_meals` y replicar las policies de `meal_log_items` de la migración `supabase/migrations/20260613_g21_nutrition_fase3.sql` (ownership vía `meal_log_id → meal_logs.user_id`). Verificar nombres de policies existentes antes de escribir.

### `app/lib/meal-logs.ts` (reescritura del modelo)
- `MealLog = { id, logDate, meals: MealGroup[], totalKcal, totalMacros }`.
- `MealGroup = { id, name, position, items: MealLogItem[], kcal, macros }`.
- `MealLogItem`: reemplazar `mealOrder` por `mealId`; agregar `measure: FoodMeasure` y `quantity` (gramos o unidades para mostrar) derivados del food. Mantener `grams` para cálculo.
- `MEAL_LOG_SELECT`: anidar `meal_log_meals (id, name, position, meal_log_items (... food ...))`; el join de `foods` agrega `measure`.
- Funciones: `getMealLogForDate`; `createMeal({userId, logDate, name})` (upsert de `meal_logs` igual que el `addMealLogItem` actual, líneas 105-130, luego insert en `meal_log_meals`); `deleteMeal({mealId})`; `addMealLogItem({mealId, foodId, quantity})` (convierte quantity→grams según `food.measure`/`serving_g`); `deleteMealLogItem` (igual). `mapMealLogItem` calcula `measure`/`quantity` además de las macros.

### `app/nutricion/registro/actions.ts`
- `createMealAction({logDate, name})`, `deleteMealAction(mealId)`, `addMealLogItemAction({mealId, foodId, quantity})`, `deleteMealLogItemAction` (igual). Todas con `requireUser()` + `revalidatePath`.

### `app/nutricion/registro/page.tsx`
- Pasar `meals={mealLog?.meals ?? []}` a `RegistroClient` en vez de `initialItems`.

### `app/nutricion/registro/RegistroClient.tsx` (reescritura UI)
- Eliminar `MEAL_SLOTS` / `MEAL_NAMES` y el select de slot.
- Card **"Agregar comida"**: `Input` nombre + `Button` → `createMealAction`, agrega la comida al estado.
- "Comidas de hoy": por cada `MealGroup`, card con nombre + kcal de la comida, lista de items, y **form inline de alimento** (Select alimento + Input cantidad + Button). El label de cantidad se adapta: food `measure='unit'` → "Unidades", si no "Gramos". Botón borrar comida.
- Display item: unit → `{quantity} u · {kcal} kcal`; gramos → `{grams} g · {kcal} kcal`.
- Conservar panel "Objetivo del día" (`TargetBar`) y `TrainingCalendarCard` (totales se recalculan sobre todos los items de todas las comidas).
- Usar `frontend-design` para mantener coherencia visual (mismos tokens/Cards).

---

## Parte 3 — /configuración: silueta SVG del % graso

- Nuevo componente `app/components/shared/BodyFatFigure.tsx` (client): SVG inline de silueta corporal cuyo **ancho/sombreado de contorno escala** con el `value` del rango (12/17/22/27/33) y respeta `gender` ('male'|'female'). Sin archivos externos. Diseñar con **frontend-design**.
- `app/configuracion/ConfiguracionClient.tsx`: en el card "Porcentaje de grasa corporal" (`:102-127`), pasar el `CardContent` a 2 columnas (`sm:grid-cols-2`): a un lado los `ToggleOption` de rango, al otro `<BodyFatFigure gender={gender} value={bodyFatPct} />`. Cuando `bodyFatPct === null` mostrar silueta neutra/placeholder.

## Parte 4 — /configuración: quitar placeholder y ancho completo

En `app/configuracion/ConfiguracionClient.tsx`:
- **Quitar** el card placeholder del branch `else` (`:217-229`, "Completá tus datos y calculá").
- Cambiar el contenedor raíz (`:64`) de grid 2-col (`lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]`) a **una sola columna full-width**. Los cards de input ocupan el ancho completo (se puede usar grid responsive interno para compactar Datos básicos / Actividad / Objetivo, pero sin la columna lateral estrecha).
- El card "Tu plan estimado" se renderiza **full-width debajo del botón "Calcular mi plan"**, solo cuando `plan !== null`. Quitar el wrapper `lg:sticky` de columna derecha.
- Eliminar imports que queden huérfanos por el cambio.

---

## Archivos a tocar (resumen)
- Migraciones nuevas (MCP `apply_migration`): `foods.measure`; `meal_log_meals` + reemplazo `meal_order`→`meal_id` + RLS.
- `app/lib/nutrition-types.ts`, `app/lib/foods.ts`, `app/lib/foods-form.ts`, `app/lib/foods-validation.ts`, `app/lib/meal-logs.ts`.
- `app/admin/alimentos/actions.ts`, `app/admin/alimentos/FoodAdminClient.tsx`.
- `app/nutricion/registro/actions.ts`, `app/nutricion/registro/page.tsx`, `app/nutricion/registro/RegistroClient.tsx`.
- `app/configuracion/ConfiguracionClient.tsx`, nuevo `app/components/shared/BodyFatFigure.tsx`.
- Posible: `app/lib/nutrition-mock.ts` / `diet-templates.ts` (campo `measure`).
- Al final: `graphify update .`.

## Verificación (playwright-cli)
1. `pnpm dev`, login.
2. **/admin/alimentos**: crear alimento `measure='unit'` (ej. "Huevo", 1 u ≈ 50g, macros por unidad) → aparece en tabla como "1 u (≈50 g)". Crear/editar uno en gramos sigue OK.
3. **/nutricion/registro**: crear comida "Desayuno"; agregar 2 huevos (unidades), 1 pan, 200 (gramos) leche; verificar que el item de huevo muestra "2 u", que kcal/macros escalan correctamente, y que "Objetivo del día" suma todos los items. Borrar item y comida.
4. **/configuración**: confirmar que NO está el card placeholder, que los cards ocupan ancho completo, que la silueta cambia al elegir cada rango graso, y que "Calcular mi plan" muestra el plan full-width.
5. `pnpm lint` / `pnpm build` para asegurar tipos (cambios de `mealOrder`→`mealId`, `measure`).

## Riesgos
- Migración destructiva: borra la única fila dev de `meal_log_items`. Aceptable (datos de desarrollo).
- RLS de `meal_log_meals`: si las policies no se replican bien, el registro falla en runtime. Verificar contra g21 antes de aplicar.
- Consumidores de `Food`/`MealLog` fuera de nutrición (mock, diet-templates): el cambio de tipo puede romper el build; grep antes de cerrar.
