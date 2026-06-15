# Plan: nutrición — imagen grasa, alimentos por unidad, baja de dietas, card de registro

## Context

Cuatro cambios en el módulo de nutrición:

1. **/configuración** — el apartado "Porcentaje de grasa corporal (opcional)" hoy dibuja figuras SVG que se deforman (`BodyFatFigure.tsx`). Debe mostrar una **imagen de referencia fija** por rango.
2. **Alimentos** — hoy un alimento es *o* gramos *o* unidades (`measure` exclusivo). Debe poder cuantificarse en **gramos Y unidades/porciones**, definiendo **gramos por unidad/porción**. Aplica a admin y a registro de comidas.
3. **Dietas de "N comidas"** — quedan obsoletas por el "registro diario". Se eliminan código, nav y tablas.
4. **/nutrición/registro** — dentro de la card de comida se configura nombre + alimentos + gramos o unidades (ya existe `MealCard`; se integra el punto 2).

Decisiones confirmadas por el usuario: imágenes de referencia fijas (no foto subida); ambos modos (g y unidad) siempre disponibles por alimento; baja de tablas vía migración drop.

Skills obligatorias: una skill de front para la UI (`impeccable` o `frontend-design`) y `playwright-cli` para validar en navegador.

---

## Tarea 1 — Imagen de grasa corporal

**Archivos:** `app/components/shared/BodyFatFigure.tsx`, `app/configuracion/ConfiguracionClient.tsx:129`, assets en `public/references/body-fat/`.

- Reemplazar el SVG de `BodyFatFigure.tsx` por `next/image` (patrón ya usado en `ExerciseDetailModal.tsx:108`, `dashboard/page.tsx:123`).
- Una imagen por valor de `BODY_FAT_REFERENCES` (12/17/22/27/33) y por `gender`. Mapa `value -> ruta` dentro del componente (reemplaza `SILHOUETTE_PROFILES`).
- Nombres sugeridos: `public/references/body-fat/{male|female}-{12|17|22|27|33}.png`. **El usuario debe proveer los 10 assets** (o un set único si no se distingue por género — confirmar al implementar). Sin imagen seleccionada (`value === null`) → placeholder "Referencia ilustrativa".
- Mantener firma `BodyFatFigure({ gender, value, className })` y el caption `"{value}% graso aprox."`. No tocar el data-flow de `bodyFatPct` (sigue siendo número en `nutrition_profiles.body_fat_pct`).

## Tarea 2 — Alimentos en gramos y unidades

**DB (migración nueva, no editar migraciones históricas):**
- `foods`: agregar `grams_per_unit numeric (null o > 0)`. `serving_g` sigue siendo la porción base sobre la que se expresan las macros. `measure` pasa a ser **medida por defecto** (hint de UI), no exclusiva.
- `meal_log_items`: agregar `measure text not null default 'g' check in ('g','unit')` y `quantity numeric not null`. `grams` sigue siendo autoritativo para macros; `measure`+`quantity` guardan lo que el usuario ingresó (evita reconstruir por división y soporta ambos modos por ítem).
- Backfill: ítems existentes → `measure='g'`, `quantity=grams`.

**Tipos / validación:**
- `app/lib/nutrition-types.ts:26-37` — agregar `gramsPerUnit: number | null` a `Food`.
- `app/lib/foods.ts` — mapear/escribir `grams_per_unit` en list/CRUD (`:12-21`, `:86-140`, `:149`).
- `app/lib/foods-validation.ts` — validar `gramsPerUnit > 0` cuando se habilita unidad (`:16-98`).
- `app/lib/foods-form.ts` — campo en el form type (`:3-38`).

**Admin (`app/admin/alimentos/FoodAdminClient.tsx`):**
- Reemplazar el toggle exclusivo `measure` (`:429-447`) por: macros siempre por `serving_g` + input separado **"Gramos por unidad/porción"** (siempre disponible, opcional). `measure` queda como selector de medida por defecto.
- Ajustar celda de la tabla "porción" (`:219-221`) para mostrar `serving_g` y, si hay `grams_per_unit`, `"1 u ≈ X g"`.
- `app/admin/alimentos/actions.ts:13-63` — pasar el nuevo campo.

**Conversión (`app/lib/meal-logs.ts`):**
- `addMealLogItem` (`:192-230`): recibir `measure` elegido + `quantity`; `grams = measure==='unit' ? quantity * grams_per_unit : quantity`; persistir `grams`, `measure`, `quantity`.
- Read-back (`:313-335`): usar `measure`/`quantity` guardados en vez de reconstruir por `serving_g`.

## Tarea 3 — Baja de dietas

**Borrar dirs/archivos:** `app/admin/dietas/`, `app/nutricion/dietas/`, `app/lib/diet-templates.ts`, `app/lib/saved-diets.ts`, `app/lib/nutrition-suggest.ts` (solo lo usaba `DietDetailClient`).
**Editar:**
- `app/components/shared/navigation-config.ts` — quitar bloque `/admin/dietas` (`:120-127`) y corregir descripción "...y dietas sugeridas." (`:63`).
- `app/lib/nutrition-types.ts:119-133` — quitar `DietMeal`/`DietTemplate` (y `MealSuggestion`/`DietSuggestions` si quedan huérfanos tras borrar nutrition-suggest).
- `app/lib/nutrition-mock.ts:199-` — quitar `MOCK_DIET_TEMPLATES` (resto del archivo se mantiene).
**DB:** migración drop de `saved_diets`, `diet_template_meals`, `diet_templates` (en ese orden por FKs) + sus políticas/índices/triggers.
**Verificar:** `rg "dietas|diet-templates|saved-diets|DietTemplate|generateDietSuggestions"` sin resultados fuera de migraciones históricas.

## Tarea 4 — Card de registro

**Archivo:** `app/nutricion/registro/RegistroClient.tsx` (`MealCard` `:203-327`) + `app/nutricion/registro/actions.ts:8-51`.
- En `MealCard`, junto al selector de alimento y cantidad (`:301-318`), agregar selector de **medida (g / unidad)** cuando el alimento tenga `gramsPerUnit`. Default = `food.measure`.
- `handleAddItem`/`addMealLogItemAction` (`:90-93`, `:235`) pasan `measure` además de `quantity`.
- Display de ítem (`:284`) ya distingue `u`/`g` por `item.measure` — se mantiene, ahora alimentado por el `measure` guardado.
- El nombre de la comida ya se configura en la card "Nueva comida" (`:107-128`) — sin cambios estructurales.

---

## Orden de ejecución

1. Migración DB tarea 2 (foods + meal_log_items) → `mcp__supabase_gymcontrol__apply_migration`.
2. Migración DB tarea 3 (drop dietas).
3. Backend tarea 2 (tipos, foods, validation, meal-logs).
4. Admin alimentos (tarea 2) — con skill de front.
5. RegistroClient (tarea 4) — con skill de front.
6. BodyFatFigure (tarea 1) — con skill de front + assets.
7. Baja de código dietas (tarea 3) + limpieza de imports/tipos huérfanos.

## Verificación

- `pnpm build` / typecheck sin errores; `rg` de dietas limpio.
- Contrastar esquema con `mcp__supabase_gymcontrol__list_tables` y actualizar `docs/DATABASE.md` (hoy desactualizado: no documenta `measure` ni `meal_log_meals`).
- `graphify update .` tras los cambios.
- **playwright-cli** (validación end-to-end en navegador):
  - /configuración: seleccionar cada rango de grasa → se muestra la imagen correcta; "No lo sé" → placeholder; guardar y recargar persiste `bodyFatPct`.
  - /admin/alimentos: crear alimento con `serving_g` + gramos por unidad; editar; ver tabla "1 u ≈ X g".
  - /nutrición/registro: crear comida, agregar mismo alimento en g y en unidades; verificar kcal/macros y barras de objetivo; eliminar ítem/comida.
  - Confirmar que no quedan enlaces ni rutas a /dietas (404 esperado / nav sin entrada).

## Riesgos

- **Assets de imagen faltantes** (tarea 1): bloquea hasta que el usuario provea los archivos; definir fallback si falta uno.
- **Backfill meal_log_items**: ítems viejos deben quedar `measure='g'`, `quantity=grams` o se rompe el read-back.
- **Drop de tablas irreversible**: confirmar que no hay datos de producción a conservar antes de correr la migración.
- `docs/DATABASE.md` ya está desfasado respecto a migraciones g22/g23 — actualizar para no arrastrar deuda.
