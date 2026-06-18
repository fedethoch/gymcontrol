import "server-only";

import { getLocalTrainingDate } from "@/app/lib/workout-tracking";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";
import {
  MEAL_TYPE_IMAGES,
  MEAL_TYPES,
  type FoodMeasure,
  type Macros,
  type MealType,
} from "@/app/lib/nutrition-types";

export type MealLogItem = {
  id: string;
  foodId: string;
  foodName: string;
  foodImageUrl: string;
  measure: FoodMeasure;
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

type FoodRow = {
  id: string;
  name: string;
  image_url: string;
  measure: FoodMeasure;
  serving_g: number;
  grams_per_unit: number | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

type MealLogItemRow = {
  id: string;
  food_id: string;
  meal_id: string;
  grams: number;
  measure: FoodMeasure;
  quantity: number;
  food: FoodRow | FoodRow[] | null;
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
      meal_id,
      grams,
      measure,
      quantity,
      food:foods!meal_log_items_food_id_fkey (
        id,
        name,
        image_url,
        measure,
        serving_g,
        grams_per_unit,
        calories,
        protein_g,
        carbs_g,
        fat_g
      )
    )
  )
`;

export { getLocalTrainingDate };

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

async function ensureMealLogId(args: { userId: string; logDate: string }): Promise<string> {
  const supabase = await createSupabaseServerClient();

  const { data: existingLog, error: existingLogError } = await supabase
    .from("meal_logs")
    .select("id")
    .eq("user_id", args.userId)
    .eq("log_date", args.logDate)
    .maybeSingle();

  if (existingLogError) {
    throw new Error(`No se pudo buscar el registro del dia: ${existingLogError.message}`);
  }

  if (existingLog?.id) {
    return existingLog.id;
  }

  const { data: insertedLog, error: insertLogError } = await supabase
    .from("meal_logs")
    .insert({ user_id: args.userId, log_date: args.logDate })
    .select("id")
    .single();

  if (insertLogError || !insertedLog) {
    throw new Error(`No se pudo crear el registro del dia: ${insertLogError?.message ?? "sin id"}`);
  }

  return insertedLog.id;
}

export async function createMeal(args: { userId: string; logDate: string; name: string; type: MealType }): Promise<MealLog> {
  const supabase = await createSupabaseServerClient();
  const mealLogId = await ensureMealLogId(args);

  const { count, error: countError } = await supabase
    .from("meal_log_meals")
    .select("id", { count: "exact", head: true })
    .eq("meal_log_id", mealLogId);

  if (countError) {
    throw new Error(`No se pudo preparar la comida: ${countError.message}`);
  }

  const { error: insertMealError } = await supabase.from("meal_log_meals").insert({
    meal_log_id: mealLogId,
    name: args.name,
    type: args.type,
    position: (count ?? 0) + 1,
  });

  if (insertMealError) {
    throw new Error(`No se pudo crear la comida: ${insertMealError.message}`);
  }

  const log = await getMealLogForDate({ userId: args.userId, logDate: args.logDate });

  if (!log) {
    throw new Error("No se pudo leer el registro recien creado.");
  }

  return log;
}

export async function updateMeal(args: { mealId: string; name?: string; type?: MealType }): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const values: { name?: string; type?: MealType } = {};

  if (args.name !== undefined) {
    values.name = args.name;
  }

  if (args.type !== undefined) {
    values.type = args.type;
  }

  const { error } = await supabase.from("meal_log_meals").update(values).eq("id", args.mealId);

  if (error) {
    throw new Error(`No se pudo actualizar la comida: ${error.message}`);
  }
}

export async function deleteMeal(args: { mealId: string }): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("meal_log_meals").delete().eq("id", args.mealId);

  if (error) {
    throw new Error(`No se pudo borrar la comida: ${error.message}`);
  }
}

export async function addMealLogItem(args: {
  userId: string;
  logDate: string;
  mealId: string;
  foodId: string;
  measure: FoodMeasure;
  quantity: number;
}): Promise<MealLog> {
  const supabase = await createSupabaseServerClient();
  const mealLogId = await ensureMealLogId({ userId: args.userId, logDate: args.logDate });

  const { data: food, error: foodError } = await supabase
    .from("foods")
    .select("serving_g, grams_per_unit")
    .eq("id", args.foodId)
    .single();

  if (foodError || !food) {
    throw new Error(`No se pudo leer el alimento: ${foodError?.message ?? "sin datos"}`);
  }

  const gramsPerUnit = food.grams_per_unit ?? food.serving_g;
  const grams = args.measure === "unit" ? args.quantity * gramsPerUnit : args.quantity;

  const { error: insertItemError } = await supabase.from("meal_log_items").insert({
    meal_log_id: mealLogId,
    meal_id: args.mealId,
    food_id: args.foodId,
    grams,
    measure: args.measure,
    quantity: args.quantity,
  });

  if (insertItemError) {
    throw new Error(`No se pudo agregar el alimento a la comida: ${insertItemError.message}`);
  }

  const log = await getMealLogForDate({ userId: args.userId, logDate: args.logDate });

  if (!log) {
    throw new Error("No se pudo leer el registro recien creado.");
  }

  return log;
}

export async function updateMealLogItem(args: {
  userId: string;
  logDate: string;
  itemId: string;
  measure: FoodMeasure;
  quantity: number;
}): Promise<MealLog> {
  const supabase = await createSupabaseServerClient();

  const { data: item, error: itemError } = await supabase
    .from("meal_log_items")
    .select("food_id, foods(serving_g, grams_per_unit)")
    .eq("id", args.itemId)
    .single();

  if (itemError || !item) {
    throw new Error(`No se pudo leer el alimento del registro: ${itemError?.message ?? "sin datos"}`);
  }

  const food = Array.isArray(item.foods) ? item.foods[0] : item.foods;

  if (!food) {
    throw new Error("No se pudo leer el alimento asociado.");
  }

  const gramsPerUnit = food.grams_per_unit ?? food.serving_g;
  const grams = args.measure === "unit" ? args.quantity * gramsPerUnit : args.quantity;

  const { error: updateError } = await supabase
    .from("meal_log_items")
    .update({ grams, measure: args.measure, quantity: args.quantity })
    .eq("id", args.itemId);

  if (updateError) {
    throw new Error(`No se pudo actualizar el alimento del registro: ${updateError.message}`);
  }

  const log = await getMealLogForDate({ userId: args.userId, logDate: args.logDate });

  if (!log) {
    throw new Error("No se pudo leer el registro actualizado.");
  }

  return log;
}

export async function deleteMealLogItem(args: { itemId: string }): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("meal_log_items").delete().eq("id", args.itemId);

  if (error) {
    throw new Error(`No se pudo borrar el alimento del registro: ${error.message}`);
  }
}

export async function getLoggedDatesForUser(args: { userId: string; days: number }): Promise<Set<string>> {
  const today = getLocalTrainingDate();
  const rangeStart = formatDateOnly(addDays(new Date(`${today}T00:00:00`), -(args.days - 1)));
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

export async function getDailyKcalAverage(args: { userId: string; days: number }): Promise<number> {
  const today = getLocalTrainingDate();
  const rangeStart = formatDateOnly(addDays(new Date(`${today}T00:00:00`), -(args.days - 1)));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("meal_logs")
    .select(
      "log_date, meal_log_meals(meal_log_items(grams, food:foods!meal_log_items_food_id_fkey(calories, serving_g)))",
    )
    .eq("user_id", args.userId)
    .gte("log_date", rangeStart)
    .lte("log_date", today);

  if (error) {
    throw new Error(`No se pudo leer el historial de calorías: ${error.message}`);
  }

  type Row = {
    log_date: string;
    meal_log_meals: Array<{
      meal_log_items: Array<{ grams: number; food: { calories: number; serving_g: number } | { calories: number; serving_g: number }[] | null }> | null;
    }> | null;
  };

  const kcalByDate = new Map<string, number>();

  for (const row of (data ?? []) as Row[]) {
    let kcal = 0;

    for (const meal of row.meal_log_meals ?? []) {
      for (const item of meal.meal_log_items ?? []) {
        const food = Array.isArray(item.food) ? item.food[0] : item.food;
        if (!food || food.serving_g <= 0) continue;
        kcal += Math.round(food.calories * (item.grams / food.serving_g));
      }
    }

    if (kcal > 0) {
      kcalByDate.set(row.log_date, kcal);
    }
  }

  if (kcalByDate.size === 0) {
    return 0;
  }

  const total = [...kcalByDate.values()].reduce((sum, value) => sum + value, 0);
  return Math.round(total / kcalByDate.size);
}

function mapMealLog(row: MealLogRow): MealLog {
  const meals = (row.meal_log_meals ?? [])
    .map(mapMealGroup)
    .sort((left, right) => left.position - right.position);

  const totalMacros = meals.reduce<Macros>(
    (totals, meal) => ({
      proteinG: totals.proteinG + meal.macros.proteinG,
      carbsG: totals.carbsG + meal.macros.carbsG,
      fatG: totals.fatG + meal.macros.fatG,
    }),
    { proteinG: 0, carbsG: 0, fatG: 0 },
  );

  return {
    id: row.id,
    logDate: row.log_date,
    meals,
    totalKcal: meals.reduce((total, meal) => total + meal.kcal, 0),
    totalMacros,
  };
}

function mapMealGroup(row: MealLogMealRow): MealGroup {
  const items = (row.meal_log_items ?? []).map(mapMealLogItem);
  const type = normalizeMealType(row.type);

  const macros = items.reduce<Macros>(
    (totals, item) => ({
      proteinG: totals.proteinG + item.proteinG,
      carbsG: totals.carbsG + item.carbsG,
      fatG: totals.fatG + item.fatG,
    }),
    { proteinG: 0, carbsG: 0, fatG: 0 },
  );

  return {
    id: row.id,
    name: row.name,
    type,
    imageUrl: MEAL_TYPE_IMAGES[type],
    position: row.position,
    items,
    kcal: items.reduce((total, item) => total + item.kcal, 0),
    macros,
  };
}

function normalizeMealType(value: string | null | undefined): MealType {
  return MEAL_TYPES.includes(value as MealType) ? (value as MealType) : "snack";
}

function mapMealLogItem(row: MealLogItemRow): MealLogItem {
  const food = Array.isArray(row.food) ? row.food[0] : row.food;

  if (!food) {
    throw new Error(`El item de registro ${row.id} referencia un alimento inexistente o inaccesible.`);
  }

  const ratio = row.grams / food.serving_g;

  return {
    id: row.id,
    foodId: row.food_id,
    foodName: food.name,
    foodImageUrl: food.image_url,
    measure: row.measure,
    quantity: row.quantity,
    grams: row.grams,
    kcal: Math.round(food.calories * ratio),
    proteinG: Math.round(food.protein_g * ratio),
    carbsG: Math.round(food.carbs_g * ratio),
    fatG: Math.round(food.fat_g * ratio),
  };
}

function addDays(value: Date, amount: number) {
  const result = new Date(value);
  result.setDate(result.getDate() + amount);

  return result;
}

function formatDateOnly(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
