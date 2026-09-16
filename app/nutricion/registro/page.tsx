import { RegistroClient } from "@/app/nutricion/registro/RegistroClient";
import { requireUser } from "@/app/lib/auth";
import { parseRegistroFoodParams } from "@/app/lib/food-catalog";
import { parseRegistroRecipeParams } from "@/app/lib/recipe-catalog";
import { listFoodsForUser } from "@/app/lib/foods";
import { addDaysToDateKey, getTodayDateKey, isDateKey } from "@/app/lib/local-date";
import { getLoggedDatesForUser, getMealLogForDate, listFrequentItems } from "@/app/lib/meal-logs";
import { getNutritionProfile } from "@/app/lib/nutrition-profile";
import { MEAL_LOG_MAX_PAST_DAYS, MEAL_TYPES, type MealType, type RecipeOption } from "@/app/lib/nutrition-types";
import { listRecipeCatalogItems } from "@/app/lib/recipes";

export default async function RegistroNutricionPage({
  searchParams,
}: {
  searchParams: Promise<{
    tipo?: string | string[];
    fecha?: string | string[];
    comida?: string | string[];
    alimento?: string | string[];
    receta?: string | string[];
    medida?: string | string[];
    cantidad?: string | string[];
  }>;
}) {
  const auth = await requireUser();
  const todayKey = getTodayDateKey();
  const { tipo, fecha, comida, alimento, receta, medida, cantidad } = await searchParams;
  const logDate = resolveLogDate(fecha, todayKey);
  // Fila del home con una comida ya registrada: /nutricion/registro?comida=<id> (siempre hoy)
  const initialMealId = logDate === todayKey && typeof comida === "string" ? comida : undefined;
  // "+" de cada comida en el home: /nutricion/registro?tipo=almuerzo (siempre hoy)
  const initialMealType =
    logDate === todayKey ? (MEAL_TYPES.find((type) => type === tipo) as MealType | undefined) : undefined;

  const [foods, recipes, mealLog, profile, loggedDates, frequentItems] = await Promise.all([
    listFoodsForUser(auth.user.id),
    listRecipeCatalogItems(),
    getMealLogForDate({ userId: auth.user.id, logDate }),
    getNutritionProfile(auth.user.id),
    getLoggedDatesForUser({ userId: auth.user.id, days: 70 }),
    listFrequentItems({ userId: auth.user.id }),
  ]);

  const recipeOptions: RecipeOption[] = recipes.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    servingG: recipe.servingG,
    kcalPerG: recipe.kcalPerG,
    macrosPerG: recipe.macrosPerG,
  }));

  // "Registrar" desde /alimentos o /recetas (siempre hoy): /nutricion/registro?alimento=… o ?receta=…&medida=…&cantidad=…
  const linkable = logDate === todayKey && !initialMealId;
  const initialFoodItem = linkable ? parseRegistroFoodParams({ alimento, medida, cantidad }, foods) : null;
  const initialRecipeItem =
    linkable && !initialFoodItem ? parseRegistroRecipeParams({ receta, medida, cantidad }, recipes) : null;

  // RegistroClient arma sus dos árboles: mobile (<1024) y desktop.
  return (
    <RegistroClient
      key={logDate}
      foods={foods}
      recipes={recipeOptions}
      frequentItems={frequentItems}
      logDate={logDate}
      todayKey={todayKey}
      initialMeals={mealLog?.meals ?? []}
      target={profile ? { kcal: profile.plan.targetKcal, macros: profile.plan.macros } : null}
      loggedDates={[...loggedDates]}
      initialMealType={initialMealType}
      initialMealId={initialMealId}
      initialFoodItem={initialFoodItem}
      initialRecipeItem={initialRecipeItem}
    />
  );
}

function resolveLogDate(value: string | string[] | undefined, todayKey: string) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate || !isDateKey(candidate) || candidate > todayKey) {
    return todayKey;
  }

  return candidate < addDaysToDateKey(todayKey, -MEAL_LOG_MAX_PAST_DAYS) ? todayKey : candidate;
}
