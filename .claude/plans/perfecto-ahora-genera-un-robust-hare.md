# Plan — Huecos de la auditoría (Ejercitación + Alimentación)

## Context
Auditoría 2026-09-15 sección por sección. **Ejercitación: 0 huecos** (catálogo → rutina activa → días → ejercicios con reps/RIR fijos → series kg/reps persistentes, precarga "Anterior" + placeholder aceptada por el usuario). Nada que implementar ahí.
**Alimentación: 3 huecos**, con decisiones del usuario ya tomadas:
1. Orden de comidas: hoy toda comida nueva va al final y no se mueve; el home agrupa por tipo con snack al final.
2. Recetas: hoy solo admin escribe (RLS `recipes_admin_write`).
3. Porción de receta: hoy `servings` int y se registra solo en porciones; los macros de logs viejos se recalculan en lectura con la receta actual.

Decisiones: insertar "después de…" al crear + mover arriba/abajo; home muestra comidas reales en orden con tipos vacíos en su lugar; recetas públicas al instante, solo creador edita/archiva, admin puede archivar/editar cualquiera, ingredientes solo del catálogo global, sin foto; porción en gramos obligatoria + peso final cocido opcional (fallback = suma ingredientes crudos); registrar receta por porciones o gramos; la edición cambia la receta para todos pero lo ya registrado queda congelado; borrar = archivar.

Única DB = producción con usuarios reales → migraciones expand/contract (patrón ya usado en nutrición y entreno).

## F0 — Migración expand (no rompe código viejo en prod)
Archivo `supabase/migrations/20260916_nutrition_meal_order_user_recipes.sql`:
- `recipes`: `serving_g numeric(7,1) null check (>0)`, `total_weight_g numeric(8,1) null check (>0)`, `archived_at timestamptz null`. Backfill `serving_g = round(sum(recipe_items.grams)/servings, 1)` → logs existentes (`grams = gramsPerServing*quantity`) quedan idénticos.
- `meal_log_items`: `recipe_snapshot jsonb null` = `{servingG, kcalPerG, proteinPerG, carbsPerG, fatPerG}`. Backfill de todos los ítems con `recipe_id` desde la receta actual (congela historia hoy).
- RLS recetas (patrón de `20260915_nutrition_user_foods_recipes_targets.sql`, helpers `private.current_profile_id()` / `private.is_current_user_admin()`): drop `recipes_admin_write`, `recipe_items_admin_write`; select público se mantiene; insert `to authenticated` con `created_by = current_profile_id()`; update `created_by = current_profile_id() or admin`; delete solo admin; `recipe_items` all vía exists(recipe con mismo criterio).
- RPC `public.save_recipe(p_recipe_id uuid, p_name, p_description, p_category, p_serving_g, p_total_weight_g, p_items jsonb) returns uuid` — copiar forma de `admin_save_routine` (`20260915_training_history_integrity.sql:95-229`): plpgsql, security invoker, `search_path=''`, valida dueño/admin (42501), valida items y que cada `food_id` tenga `owner_user_id is null`, upsert receta + replace items en una transacción. `revoke from public, anon; grant to authenticated`.
- RPC `public.reorder_meals(p_meal_log_id uuid, p_meal_ids uuid[])` security invoker: verifica que el array sea exactamente el set de comidas del log, `position = ordinality`.
→ verificar: `list_migrations`; SQL en transacción con rollback simulando `request.jwt.claims` de usuario común: insertar/editar receta propia ✅, ajena ❌, ingrediente privado ❌, reorder de log ajeno ❌.

## F1 — Orden de comidas
- `app/lib/meal-logs.ts`: `createMealWithItems` acepta `afterMealId?: string | null` (null = primera); tras insertar llama `reorder_meals` con el orden deseado. Nueva `moveMeal({mealId, direction})` → calcula orden y llama RPC. Ambas devuelven `getMealLogOrEmpty`.
- `app/nutricion/registro/actions.ts`: `afterMealId` en `createMealSchema`; `moveMealAction` vía `runMealLogAction`.
- `RegistroClient.tsx`: en el drawer de nueva comida (`newMealBody`, ~L322) Select "Ubicar después de" (default: última; opción "Al principio"); si viene `?tipo=` sugerir posición por rango de tipo. En `MealCard` botones mover ↑/↓ (lucide `ChevronUp/Down`, tap ≥44px) junto a `actionButtons`/`compactActionButtons`, deshabilitados en extremos (props `isFirst/isLast`).
- Home: `buildMealRows` (`app/lib/home-dashboard.ts:59`) pasa a devolver una fila por comida registrada en orden de `position` + filas vacías para desayuno/almuerzo/merienda/cena no registrados insertadas tras la última comida de rango menor. `MealRow` gana `mealId?`/`label` = nombre de la comida. `HomeNutrition.tsx:111-138` renderiza igual (el "+" de vacíos sigue a `?tipo=`). No tocar navbar.
→ verificar: unit test de `buildMealRows` (orden, snack intermedio, vacíos) en `tests/unit/`.

## F2 — Porción en gramos + registrar por g o porción + congelado
- Helper puro nuevo `app/lib/recipe-nutrition.ts`: `recipeBaseGrams(recipe)` (= `total_weight_g ?? suma crudos`), `recipePerGram(recipe)`, `buildRecipeSnapshot(recipe)`, `nutritionFromSnapshot(snapshot, grams)`. Reusar en `recipes.ts` (`mapRecipe`), `meal-logs.ts`, `nutricion/registro/page.tsx`, `FoodPicker.tsx` y catálogo. Unit tests.
- `meal-logs.ts`: `buildItemValues` (L242-314) recipe acepta `measure: "g" | "unit"`; `grams = unit ? quantity*serving_g : quantity`; guarda `recipe_snapshot`. `updateMealItem` recalcula grams pero **conserva** el snapshot existente. `mapMealLogItem` (L627-676) usa `recipe_snapshot` + `grams`; fallback a receta viva si snapshot null (ítems insertados por código viejo en la ventana de deploy). Select de recetas incluye archivadas (join por id).
- `actions.ts`: `itemSchema` recipe con `measure: z.enum(FOOD_MEASURES)`; límite en gramos vía `MAX_ITEM_GRAMS`.
- `RecipeOption` (`nutrition-types.ts:85`): `servingG`, `kcalPerG`, `macrosPerG`; `page.tsx:32-48` lo arma con el helper.
- `FoodPicker.tsx`: recetas usan el mismo Select g/porción que alimentos (`handleMeasureChange` L185 con `servingG` como grams-per-unit), `previewNutrition` por gramos, texto "1 porción = X g". `RegistroClient.tsx` edición de ítem (L939-979, `handleSaveItem` L886, `formatItemAmount`) habilita el Select para recetas.
- `listFrequentItems`: excluye recetas archivadas; conserva `lastMeasure`.

## F3 — Recetas creadas por usuarios
- `app/lib/recipes.ts`: `saveRecipe` vía `.rpc("save_recipe")` (reemplaza `createRecipe`/`updateRecipe`/`replaceRecipeItems` no atómicos); `archiveRecipe(id)` (update `archived_at`); `listRecipeCatalogItems` filtra `archived_at is null` e incluye `created_by`; select con `serving_g, total_weight_g`. `Recipe` gana `servingG`, `totalWeightG`, `createdBy`.
- Validación `recipes-validation.ts` / `recipes-form.ts`: `servings` → `servingG` (obligatorio >0) + `totalWeightG` opcional (>= porción).
- Extraer `RecipeFormSheet` de `app/admin/recetas/RecipeAdminClient.tsx:383-620` a `app/components/shared/RecipeForm.tsx` con `onSave` por prop (patrón `FoodForm`), variante Drawer mobile / Sheet desktop. Ingredientes desde `listFoodCatalogItems()` (solo globales).
- `app/recetas/actions.ts` nuevo: `saveOwnRecipeAction` (`requireUser`, RPC valida dueño), `archiveOwnRecipeAction`; revalidar `/recetas`, `/admin/recetas`, `/nutricion/registro`.
- `app/recetas/page.tsx` + `RecipeCatalogClient.tsx`: pasar auth opcional (patrón `app/alimentos/page.tsx`), botón "Crear receta", filtro "Mis recetas", en `RecipeDetailSheet` editar/archivar si `createdBy === profile.id`; badge "N g/porción" en vez de porciones; macros por porción.
- Admin `/admin/recetas`: usa el form compartido, borrar → archivar, lista muestra autor y g/porción.
- Sin foto: placeholder por categoría existente.

## F4 — Contract (después del deploy de F1–F3 en prod, con confirmación)
`20260916_nutrition_recipes_contract.sql`: re-backfill `recipe_snapshot` nulos, `serving_g not null`, drop `recipes.servings`, `recipe_snapshot not null` cuando `recipe_id is not null` (check). Código deja de leer el fallback.

## Docs
`docs/DATABASE.md` (Recetas L754-782, `meal_log_items` L736-747, `meal_log_meals` orden), `docs/codex/ROUTING_GRAPH.md` fila Nutrición (`app/recetas/actions.ts`, `RecipeForm`, `recipe-nutrition.ts`), `docs/codex/TEST_MATRIX.md` fila nutrición. `graphify update .` al final.

## Verificación
1. `pnpm test:unit` (nuevos: `recipe-nutrition`, `buildMealRows`) + `pnpm lint` + `pnpm build`.
2. SQL RLS/RPC con rollback (F0).
3. Playwright en dev :3001 con cuenta admin ([[admin_account]]) y mobile 390px:
   - Registro: crear Desayuno, Almuerzo, luego Snack "después de Desayuno" → aparece 2º; mover ↑/↓; home refleja orden y vacíos.
   - Crear receta (porción 250 g, peso final 800 g) desde `/recetas`; aparece pública; registrarla por 1 porción y por 180 g → macros esperados.
   - Editar receta → registro previo no cambia, registro nuevo sí. Archivar → desaparece de catálogo/buscador, log viejo intacto.
   - Usuario no dueño (segundo usuario de prueba vía service role o RLS SQL) no ve botones editar/archivar y RPC rechaza.
   - `pnpm validate:mobile`, 0 errores de consola.
4. Limpieza de datos de prueba (comidas/recetas por fecha ART) vía service role.
5. Deploy/commit solo si el usuario lo pide; F4 contract con confirmación aparte.

## Riesgos
- Prod-only DB: F0 debe ser expand puro; código viejo sigue escribiendo `servings` y logs sin snapshot → fallback cubre la ventana.
- Recetas públicas sin moderación: admin puede archivar cualquiera.
- `reorder_meals` con requests concurrentes (dos pestañas): la validación de set exacto rechaza órdenes desactualizados → cliente refresca.
