import "server-only";

import { addDaysToDateKey, getTodayDateKey } from "@/app/lib/local-date";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";
import { getLocalTrainingDate } from "@/app/lib/workout-tracking";
import { insertAfter, moveInOrder } from "@/app/lib/meal-order";
import {
  buildRecipeSnapshot,
  isRecipeSnapshot,
  nutritionFromSnapshot,
  recipeGramsFor,
  type RecipeSnapshot,
} from "@/app/lib/recipe-nutrition";
import {
  MEAL_TYPE_IMAGES,
  MEAL_TYPES,
  type FoodCategory,
  type FoodMeasure,
  type FrequentItem,
  type Macros,
  type MealItemInput,
  type MealType,
} from "@/app/lib/nutrition-types";

export type MealLogItem = {
  id: string;
  kind: "food" | "recipe";
  foodId: string | null;
  recipeId: string | null;
  name: string;
  /** Categoría del alimento; null en recetas. */
  category: FoodCategory | null;
  /** En recetas "unit" = porciones. */
  measure: FoodMeasure;
  /** Solo recetas: gramos de una porción congelados al registrar (para convertir g ⇄ porciones). */
  servingG: number | null;
  quantity: number;
  grams: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type MealGroup = {
  id: string;
  name: string;
  type: MealType;
  imageUrl: string;
  position: number;
  items: MealLogItem[];
  kcal: number;
  macros: Macros;
};

export type MealLog = {
  id: string;
  logDate: string;
  meals: MealGroup[];
  totalKcal: number;
  totalMacros: Macros;
};

type One<T> = T | T[] | null;

type NutritionRow = {
  serving_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

type FoodRow = NutritionRow & {
  id: string;
  name: string;
  category: FoodCategory;
};

type RecipeRow = {
  id: string;
  name: string;
  serving_g: number | null;
  total_weight_g: number | null;
  archived_at?: string | null;
  recipe_items: Array<{ grams: number; food: One<NutritionRow> }> | null;
};

type MealLogItemRow = {
  id: string;
  food_id: string | null;
  recipe_id: string | null;
  grams: number;
  measure: FoodMeasure;
  quantity: number;
  recipe_snapshot: unknown;
  created_at: string;
  food: One<FoodRow>;
  recipe: One<RecipeRow>;
};

type MealLogMealRow = {
  id: string;
  name: string;
  type: MealType | null;
  position: number;
  meal_log_items: MealLogItemRow[] | null;
};

type MealLogRow = {
  id: string;
  log_date: string;
  meal_log_meals: MealLogMealRow[] | null;
};

type ItemNutrition = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

type ItemValues = {
  food_id: string | null;
  recipe_id: string | null;
  grams: number;
  measure: FoodMeasure;
  quantity: number;
  recipe_snapshot: RecipeSnapshot | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const NUTRITION_COLUMNS = "serving_g, calories, protein_g, carbs_g, fat_g";

const MEAL_LOG_SELECT = `
  id,
  log_date,
  meal_log_meals (
    id,
    name,
    type,
    position,
    meal_log_items (
      id,
      food_id,
      recipe_id,
      grams,
      measure,
      quantity,
      recipe_snapshot,
      created_at,
      food:foods!meal_log_items_food_id_fkey (
        id,
        name,
        category,
        ${NUTRITION_COLUMNS}
      ),
      recipe:recipes!meal_log_items_recipe_id_fkey (
        id,
        name,
        serving_g,
        total_weight_g,
        recipe_items (
          grams,
          food:foods!recipe_items_food_id_fkey (${NUTRITION_COLUMNS})
        )
      )
    )
  )
`;

const UNIQUE_VIOLATION = "23505";
/** numeric(7,1) en meal_log_items.grams; tope sano para una sola carga. */
const MAX_ITEM_GRAMS = 50_000;

export { getLocalTrainingDate };

export function emptyMealLog(logDate: string): MealLog {
  return {
    id: "",
    logDate,
    meals: [],
    totalKcal: 0,
    totalMacros: { proteinG: 0, carbsG: 0, fatG: 0 },
  };
}

export async function getMealLogForDate(args: { userId: string; logDate: string }): Promise<MealLog | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("meal_logs")
    .select(MEAL_LOG_SELECT)
    .eq("user_id", args.userId)
    .eq("log_date", args.logDate)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer el registro de comidas: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapMealLog(data as unknown as MealLogRow);
}

async function getMealLogOrEmpty(args: { userId: string; logDate: string }): Promise<MealLog> {
  return (await getMealLogForDate(args)) ?? emptyMealLog(args.logDate);
}

async function findMealLogId(supabase: SupabaseServerClient, args: { userId: string; logDate: string }) {
  const { data, error } = await supabase
    .from("meal_logs")
    .select("id")
    .eq("user_id", args.userId)
    .eq("log_date", args.logDate)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo buscar el registro del dia: ${error.message}`);
  }

  return (data?.id as string | undefined) ?? null;
}

async function ensureMealLogId(supabase: SupabaseServerClient, args: { userId: string; logDate: string }): Promise<string> {
  const existingId = await findMealLogId(supabase, args);

  if (existingId) {
    return existingId;
  }

  const { data, error } = await supabase
    .from("meal_logs")
    .insert({ user_id: args.userId, log_date: args.logDate })
    .select("id")
    .single();

  if (error?.code === UNIQUE_VIOLATION) {
    // Otro request creó el registro del día en paralelo.
    const concurrentId = await findMealLogId(supabase, args);

    if (concurrentId) {
      return concurrentId;
    }
  }

  if (error || !data) {
    throw new Error(`No se pudo crear el registro del dia: ${error?.message ?? "sin id"}`);
  }

  return data.id;
}

/** Calcula gramos de cada item con los datos actuales de alimentos/recetas. Valida todo antes de escribir. */
async function buildItemValues(supabase: SupabaseServerClient, items: MealItemInput[]): Promise<ItemValues[]> {
  const foodIds = [...new Set(items.flatMap((item) => (item.kind === "food" ? [item.foodId] : [])))];
  const recipeIds = [...new Set(items.flatMap((item) => (item.kind === "recipe" ? [item.recipeId] : [])))];
  const foodsById = new Map<string, { serving_g: number; grams_per_unit: number | null }>();
  const recipeSnapshots = new Map<string, RecipeSnapshot>();

  if (foodIds.length > 0) {
    const { data, error } = await supabase.from("foods").select("id, serving_g, grams_per_unit").in("id", foodIds);

    if (error) {
      throw new Error(`No se pudieron leer los alimentos: ${error.message}`);
    }

    for (const row of (data ?? []) as Array<{ id: string; serving_g: number; grams_per_unit: number | null }>) {
      foodsById.set(row.id, row);
    }
  }

  if (recipeIds.length > 0) {
    const { data, error } = await supabase
      .from("recipes")
      .select(
        `id, name, serving_g, total_weight_g, archived_at, recipe_items(grams, food:foods!recipe_items_food_id_fkey(${NUTRITION_COLUMNS}))`,
      )
      .in("id", recipeIds)
      .is("archived_at", null);

    if (error) {
      throw new Error(`No se pudieron leer las recetas: ${error.message}`);
    }

    for (const row of (data ?? []) as unknown as RecipeRow[]) {
      const snapshot = buildRecipeSnapshot(toRecipeNutritionInput(row));

      if (snapshot) {
        recipeSnapshots.set(row.id, snapshot);
      }
    }
  }

  return items.map((item) => {
    let values: ItemValues;

    if (item.kind === "recipe") {
      const snapshot = recipeSnapshots.get(item.recipeId);

      if (!snapshot) {
        throw new Error("La receta ya no está disponible.");
      }

      values = {
        food_id: null,
        recipe_id: item.recipeId,
        grams: roundOneDecimal(recipeGramsFor(snapshot.servingG, item.measure, item.quantity)),
        measure: item.measure,
        quantity: item.quantity,
        recipe_snapshot: snapshot,
      };
    } else {
      const food = foodsById.get(item.foodId);

      if (!food) {
        throw new Error("El alimento ya no está disponible.");
      }

      const grams = item.measure === "unit" ? item.quantity * (food.grams_per_unit ?? food.serving_g) : item.quantity;

      values = {
        food_id: item.foodId,
        recipe_id: null,
        grams: roundOneDecimal(grams),
        measure: item.measure,
        quantity: item.quantity,
        recipe_snapshot: null,
      };
    }

    if (values.grams <= 0 || values.grams > MAX_ITEM_GRAMS) {
      throw new Error("Revisá la cantidad: es demasiado chica o demasiado grande.");
    }

    return values;
  });
}

async function getNextMealPosition(supabase: SupabaseServerClient, mealLogId: string) {
  const { data, error } = await supabase
    .from("meal_log_meals")
    .select("position")
    .eq("meal_log_id", mealLogId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo preparar la comida: ${error.message}`);
  }

  return ((data?.position as number | undefined) ?? 0) + 1;
}

/** Comida del registro del día indicado (RLS garantiza que sea del usuario). */
async function getMealInLog(supabase: SupabaseServerClient, args: { mealId: string; logDate: string }) {
  const { data, error } = await supabase
    .from("meal_log_meals")
    .select("id, meal_log_id, meal_log:meal_logs!inner(log_date)")
    .eq("id", args.mealId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer la comida: ${error.message}`);
  }

  const mealLog = one(data?.meal_log as One<{ log_date: string }> | undefined);

  if (!data || mealLog?.log_date !== args.logDate) {
    throw new Error("La comida ya no existe en este día.");
  }

  return { id: data.id as string, mealLogId: data.meal_log_id as string };
}

async function listMealIdsInOrder(supabase: SupabaseServerClient, mealLogId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("meal_log_meals")
    .select("id")
    .eq("meal_log_id", mealLogId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`No se pudo leer el orden de las comidas: ${error.message}`);
  }

  return (data ?? []).map((row) => row.id as string);
}

async function saveMealOrder(supabase: SupabaseServerClient, mealLogId: string, mealIds: string[]) {
  const { error } = await supabase.rpc("reorder_meals", { p_meal_log_id: mealLogId, p_meal_ids: mealIds });

  if (error) {
    throw new Error(error.code === "40001" ? error.message : `No se pudo ordenar las comidas: ${error.message}`);
  }
}

export async function createMealWithItems(args: {
  userId: string;
  logDate: string;
  name: string;
  type: MealType;
  /** Comida después de la cual se ubica; null = al principio; undefined = al final. */
  afterMealId?: string | null;
  items: MealItemInput[];
}): Promise<MealLog> {
  const supabase = await createSupabaseServerClient();
  const values = await buildItemValues(supabase, args.items);
  const mealLogId = await ensureMealLogId(supabase, args);
  const position = await getNextMealPosition(supabase, mealLogId);

  const { data: meal, error: mealError } = await supabase
    .from("meal_log_meals")
    .insert({ meal_log_id: mealLogId, name: args.name, type: args.type, position })
    .select("id")
    .single();

  if (mealError || !meal) {
    throw new Error(`No se pudo crear la comida: ${mealError?.message ?? "sin id"}`);
  }

  const { error: itemsError } = await supabase
    .from("meal_log_items")
    .insert(values.map((value) => ({ ...value, meal_log_id: mealLogId, meal_id: meal.id })));

  if (itemsError) {
    // Sin comidas a medias: si fallan los items, se descarta la comida.
    await supabase.from("meal_log_meals").delete().eq("id", meal.id);
    throw new Error(`No se pudieron guardar los alimentos de la comida: ${itemsError.message}`);
  }

  if (args.afterMealId !== undefined) {
    const order = await listMealIdsInOrder(supabase, mealLogId);
    const nextOrder = insertAfter(order, meal.id, args.afterMealId);

    if (nextOrder.join() !== order.join()) {
      try {
        await saveMealOrder(supabase, mealLogId, nextOrder);
      } catch {
        // La comida ya está guardada al final; el usuario puede moverla.
      }
    }
  }

  return getMealLogOrEmpty(args);
}

export async function moveMeal(args: {
  userId: string;
  logDate: string;
  mealId: string;
  direction: "up" | "down";
}): Promise<MealLog> {
  const supabase = await createSupabaseServerClient();
  const meal = await getMealInLog(supabase, args);
  const order = await listMealIdsInOrder(supabase, meal.mealLogId);
  const nextOrder = moveInOrder(order, meal.id, args.direction);

  if (nextOrder.join() !== order.join()) {
    await saveMealOrder(supabase, meal.mealLogId, nextOrder);
  }

  return getMealLogOrEmpty(args);
}

export async function updateMeal(args: {
  userId: string;
  logDate: string;
  mealId: string;
  name?: string;
  type?: MealType;
}): Promise<MealLog> {
  const supabase = await createSupabaseServerClient();
  const values: { name?: string; type?: MealType } = {};

  if (args.name !== undefined) {
    values.name = args.name;
  }

  if (args.type !== undefined) {
    values.type = args.type;
  }

  const { data, error } = await supabase.from("meal_log_meals").update(values).eq("id", args.mealId).select("id");

  if (error) {
    throw new Error(`No se pudo actualizar la comida: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("La comida ya no existe.");
  }

  return getMealLogOrEmpty(args);
}

export async function deleteMeal(args: { userId: string; logDate: string; mealId: string }): Promise<MealLog> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("meal_log_meals").delete().eq("id", args.mealId);

  if (error) {
    throw new Error(`No se pudo borrar la comida: ${error.message}`);
  }

  return getMealLogOrEmpty(args);
}

export async function addMealItems(args: {
  userId: string;
  logDate: string;
  mealId: string;
  items: MealItemInput[];
}): Promise<MealLog> {
  const supabase = await createSupabaseServerClient();
  const meal = await getMealInLog(supabase, args);
  const values = await buildItemValues(supabase, args.items);

  const { error } = await supabase
    .from("meal_log_items")
    .insert(values.map((value) => ({ ...value, meal_log_id: meal.mealLogId, meal_id: meal.id })));

  if (error) {
    throw new Error(`No se pudo agregar a la comida: ${error.message}`);
  }

  return getMealLogOrEmpty(args);
}

export async function updateMealItem(args: {
  userId: string;
  logDate: string;
  itemId: string;
  measure: FoodMeasure;
  quantity: number;
}): Promise<MealLog> {
  const supabase = await createSupabaseServerClient();
  const { data: item, error: itemError } = await supabase
    .from("meal_log_items")
    .select("id, food_id, recipe_id, recipe_snapshot")
    .eq("id", args.itemId)
    .maybeSingle();

  if (itemError) {
    throw new Error(`No se pudo leer el item de la comida: ${itemError.message}`);
  }

  if (!item) {
    throw new Error("Ese alimento ya no está en la comida.");
  }

  let values: Pick<ItemValues, "grams" | "measure" | "quantity">;

  if (item.recipe_id && isRecipeSnapshot(item.recipe_snapshot)) {
    // Receta congelada al registrarla: cambiar la cantidad no toma la versión nueva de la receta.
    values = {
      grams: roundOneDecimal(recipeGramsFor(item.recipe_snapshot.servingG, args.measure, args.quantity)),
      measure: args.measure,
      quantity: args.quantity,
    };

    if (values.grams <= 0 || values.grams > MAX_ITEM_GRAMS) {
      throw new Error("Revisá la cantidad: es demasiado chica o demasiado grande.");
    }
  } else {
    const input: MealItemInput = item.recipe_id
      ? { kind: "recipe", recipeId: item.recipe_id, measure: args.measure, quantity: args.quantity }
      : { kind: "food", foodId: item.food_id, measure: args.measure, quantity: args.quantity };
    const [built] = await buildItemValues(supabase, [input]);
    values = built;
  }

  const { error: updateError } = await supabase
    .from("meal_log_items")
    .update({
      grams: values.grams,
      measure: values.measure,
      quantity: values.quantity,
      ...("recipe_snapshot" in values && values.recipe_snapshot ? { recipe_snapshot: values.recipe_snapshot } : {}),
    })
    .eq("id", args.itemId);

  if (updateError) {
    throw new Error(`No se pudo actualizar el item de la comida: ${updateError.message}`);
  }

  return getMealLogOrEmpty(args);
}

export async function deleteMealItem(args: { userId: string; logDate: string; itemId: string }): Promise<MealLog> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("meal_log_items").delete().eq("id", args.itemId);

  if (error) {
    throw new Error(`No se pudo borrar el item de la comida: ${error.message}`);
  }

  return getMealLogOrEmpty(args);
}

export async function getLoggedDatesForUser(args: { userId: string; days: number }): Promise<Set<string>> {
  const today = getTodayDateKey();
  const rangeStart = addDaysToDateKey(today, -(args.days - 1));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("meal_logs")
    .select("log_date, meal_log_meals(meal_log_items(id))")
    .eq("user_id", args.userId)
    .gte("log_date", rangeStart)
    .lte("log_date", today);

  if (error) {
    throw new Error(`No se pudo leer el historial de comidas: ${error.message}`);
  }

  const dates = new Set<string>();

  for (const row of (data ?? []) as Array<{ log_date: string; meal_log_meals: Array<{ meal_log_items: unknown[] | null }> | null }>) {
    const hasItems = (row.meal_log_meals ?? []).some((meal) => (meal.meal_log_items?.length ?? 0) > 0);
    if (hasItems) {
      dates.add(row.log_date);
    }
  }

  return dates;
}

/** Alimentos y recetas más registrados en los últimos días, con la última cantidad usada. */
export async function listFrequentItems(args: { userId: string; days?: number; limit?: number }): Promise<FrequentItem[]> {
  const today = getTodayDateKey();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("meal_logs")
    .select(
      "log_date, meal_log_meals(meal_log_items(food_id, recipe_id, measure, quantity, created_at, recipe:recipes!meal_log_items_recipe_id_fkey(archived_at)))",
    )
    .eq("user_id", args.userId)
    .gte("log_date", addDaysToDateKey(today, -((args.days ?? 60) - 1)))
    .lte("log_date", today);

  if (error) {
    throw new Error(`No se pudieron leer tus alimentos frecuentes: ${error.message}`);
  }

  type UsageRow = {
    food_id: string | null;
    recipe_id: string | null;
    measure: FoodMeasure;
    quantity: number;
    created_at: string;
    recipe: One<{ archived_at: string | null }>;
  };

  const usage = new Map<string, { item: FrequentItem; lastUsedAt: string }>();

  for (const row of (data ?? []) as Array<{ meal_log_meals: Array<{ meal_log_items: UsageRow[] | null }> | null }>) {
    for (const meal of row.meal_log_meals ?? []) {
      for (const logItem of meal.meal_log_items ?? []) {
        const kind = logItem.recipe_id ? "recipe" : "food";
        const id = logItem.recipe_id ?? logItem.food_id;

        if (!id || one(logItem.recipe)?.archived_at) {
          continue;
        }

        const key = `${kind}:${id}`;
        const entry = usage.get(key);

        if (!entry) {
          usage.set(key, {
            item: { kind, id, uses: 1, lastMeasure: logItem.measure, lastQuantity: logItem.quantity },
            lastUsedAt: logItem.created_at,
          });
          continue;
        }

        entry.item.uses += 1;

        if (logItem.created_at > entry.lastUsedAt) {
          entry.lastUsedAt = logItem.created_at;
          entry.item.lastMeasure = logItem.measure;
          entry.item.lastQuantity = logItem.quantity;
        }
      }
    }
  }

  return [...usage.values()]
    .sort((left, right) => right.item.uses - left.item.uses || right.lastUsedAt.localeCompare(left.lastUsedAt))
    .slice(0, args.limit ?? 8)
    .map((entry) => entry.item);
}

function mapMealLog(row: MealLogRow): MealLog {
  const meals = (row.meal_log_meals ?? [])
    .map(mapMealGroup)
    .sort((left, right) => left.position - right.position);

  return {
    id: row.id,
    logDate: row.log_date,
    meals,
    totalKcal: meals.reduce((total, meal) => total + meal.kcal, 0),
    totalMacros: sumMacros(meals.map((meal) => meal.macros)),
  };
}

function mapMealGroup(row: MealLogMealRow): MealGroup {
  const items = [...(row.meal_log_items ?? [])]
    .sort((left, right) => left.created_at.localeCompare(right.created_at))
    .map(mapMealLogItem);
  const type = normalizeMealType(row.type);

  return {
    id: row.id,
    name: row.name,
    type,
    imageUrl: MEAL_TYPE_IMAGES[type],
    position: row.position,
    items,
    kcal: items.reduce((total, item) => total + item.kcal, 0),
    macros: sumMacros(items),
  };
}

function normalizeMealType(value: string | null | undefined): MealType {
  return MEAL_TYPES.includes(value as MealType) ? (value as MealType) : "snack";
}

function mapMealLogItem(row: MealLogItemRow): MealLogItem {
  const base = {
    id: row.id,
    quantity: row.quantity,
    grams: row.grams,
  };

  if (row.recipe_id) {
    const recipe = one(row.recipe);

    if (!recipe) {
      throw new Error(`El item de registro ${row.id} referencia una receta inexistente o inaccesible.`);
    }

    // Congelada al registrar; sin snapshot (items previos al cambio) se usa la receta actual.
    const snapshot = isRecipeSnapshot(row.recipe_snapshot)
      ? row.recipe_snapshot
      : buildRecipeSnapshot(toRecipeNutritionInput(recipe));

    return {
      ...base,
      kind: "recipe",
      foodId: null,
      recipeId: row.recipe_id,
      name: recipe.name,
      category: null,
      measure: row.measure,
      servingG: snapshot?.servingG ?? null,
      ...roundNutrition(snapshot ? nutritionFromSnapshot(snapshot, row.grams) : { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }),
    };
  }

  const food = one(row.food);

  if (!food) {
    throw new Error(`El item de registro ${row.id} referencia un alimento inexistente o inaccesible.`);
  }

  return {
    ...base,
    kind: "food",
    foodId: row.food_id,
    recipeId: null,
    name: food.name,
    category: food.category,
    measure: row.measure,
    servingG: null,
    ...roundNutrition(nutritionForGrams(food, row.grams)),
  };
}

function nutritionForGrams(food: NutritionRow, grams: number): ItemNutrition {
  const ratio = food.serving_g > 0 ? grams / food.serving_g : 0;

  return {
    kcal: food.calories * ratio,
    proteinG: food.protein_g * ratio,
    carbsG: food.carbs_g * ratio,
    fatG: food.fat_g * ratio,
  };
}

function toRecipeNutritionInput(recipe: RecipeRow) {
  const ingredients = (recipe.recipe_items ?? []).map((recipeItem) => {
    const food = one(recipeItem.food);

    return {
      grams: Number(recipeItem.grams),
      food: food
        ? {
            servingG: Number(food.serving_g),
            calories: Number(food.calories),
            proteinG: Number(food.protein_g),
            carbsG: Number(food.carbs_g),
            fatG: Number(food.fat_g),
          }
        : null,
    };
  });
  const rawGrams = ingredients.reduce((sum, ingredient) => sum + ingredient.grams, 0);

  return {
    servingG: recipe.serving_g != null ? Number(recipe.serving_g) : rawGrams,
    totalWeightG: recipe.total_weight_g != null ? Number(recipe.total_weight_g) : null,
    ingredients,
  };
}

function roundNutrition(value: ItemNutrition): ItemNutrition {
  return {
    kcal: Math.round(value.kcal),
    proteinG: roundOneDecimal(value.proteinG),
    carbsG: roundOneDecimal(value.carbsG),
    fatG: roundOneDecimal(value.fatG),
  };
}

function sumMacros(values: Macros[]): Macros {
  const total = values.reduce<Macros>(
    (sum, value) => ({
      proteinG: sum.proteinG + value.proteinG,
      carbsG: sum.carbsG + value.carbsG,
      fatG: sum.fatG + value.fatG,
    }),
    { proteinG: 0, carbsG: 0, fatG: 0 },
  );

  return {
    proteinG: roundOneDecimal(total.proteinG),
    carbsG: roundOneDecimal(total.carbsG),
    fatG: roundOneDecimal(total.fatG),
  };
}

function roundOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function one<T>(value: One<T> | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
