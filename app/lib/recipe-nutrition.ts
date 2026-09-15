/**
 * Lógica pura de macros de recetas.
 * Sin imports a propósito: se testea con `node --test` (tests/unit/recipe-nutrition.test.mjs).
 *
 * Una receta se mide en gramos: los macros por gramo salen de los ingredientes divididos por el
 * peso base (peso final cocido si el creador lo cargó; si no, la suma de ingredientes crudos).
 */

export type RecipeFoodNutrition = {
  servingG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type RecipeNutritionInput = {
  servingG: number;
  totalWeightG: number | null;
  ingredients: Array<{ grams: number; food: RecipeFoodNutrition | null }>;
};

export type NutritionAmount = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

/** Se guarda en `meal_log_items.recipe_snapshot` al registrar: congela la receta de ese momento. */
export type RecipeSnapshot = {
  servingG: number;
  kcalPerG: number;
  proteinPerG: number;
  carbsPerG: number;
  fatPerG: number;
};

export function recipeRawGrams(input: RecipeNutritionInput): number {
  return input.ingredients.reduce((sum, ingredient) => sum + ingredient.grams, 0);
}

export function recipeBaseGrams(input: RecipeNutritionInput): number {
  return input.totalWeightG != null && input.totalWeightG > 0 ? input.totalWeightG : recipeRawGrams(input);
}

export function recipeTotals(input: RecipeNutritionInput): NutritionAmount {
  return input.ingredients.reduce<NutritionAmount>(
    (sum, { grams, food }) => {
      if (!food || food.servingG <= 0) {
        return sum;
      }

      const ratio = grams / food.servingG;

      return {
        kcal: sum.kcal + food.calories * ratio,
        proteinG: sum.proteinG + food.proteinG * ratio,
        carbsG: sum.carbsG + food.carbsG * ratio,
        fatG: sum.fatG + food.fatG * ratio,
      };
    },
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

export function buildRecipeSnapshot(input: RecipeNutritionInput): RecipeSnapshot | null {
  const baseGrams = recipeBaseGrams(input);

  if (baseGrams <= 0 || input.servingG <= 0) {
    return null;
  }

  const totals = recipeTotals(input);

  return {
    servingG: input.servingG,
    kcalPerG: totals.kcal / baseGrams,
    proteinPerG: totals.proteinG / baseGrams,
    carbsPerG: totals.carbsG / baseGrams,
    fatPerG: totals.fatG / baseGrams,
  };
}

export function nutritionFromSnapshot(snapshot: RecipeSnapshot, grams: number): NutritionAmount {
  return {
    kcal: snapshot.kcalPerG * grams,
    proteinG: snapshot.proteinPerG * grams,
    carbsG: snapshot.carbsPerG * grams,
    fatG: snapshot.fatPerG * grams,
  };
}

/** `unit` = porciones del creador; `g` = gramos directos. */
export function recipeGramsFor(servingG: number, measure: "g" | "unit", quantity: number): number {
  return measure === "unit" ? quantity * servingG : quantity;
}

export function isRecipeSnapshot(value: unknown): value is RecipeSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as Record<string, unknown>;

  return ["servingG", "kcalPerG", "proteinPerG", "carbsPerG", "fatPerG"].every(
    (key) => typeof snapshot[key] === "number" && Number.isFinite(snapshot[key]),
  );
}
