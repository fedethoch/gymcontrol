/**
 * Lógica pura del catálogo de recetas (`/recetas`, DESIGN.md §18): chips, búsqueda por nombre e
 * ingredientes, orden, grupos, porciones, ingredientes escalados y el link "Registrar" al registro.
 * Solo importa libs puras (`nutrition-types`, `food-search`, `food-catalog`): se testea con
 * `node --test` (tests/unit/recipe-catalog.test.mjs).
 */
import { formatDecimal, formatQuantity, MAX_LOG_QUANTITY } from "@/app/lib/food-catalog";
import { normalizeSearchText, searchByName } from "@/app/lib/food-search";
import {
  FOOD_MEASURES,
  MEAL_TYPE_LABELS,
  MEAL_TYPES,
  RECIPE_CATEGORIES,
  RECIPE_CATEGORY_LABELS,
  type FoodMeasure,
  type MealItemInput,
  type MealType,
  type Recipe,
  type RecipeCategory,
} from "@/app/lib/nutrition-types";

export type RecipeChip = "all" | "own" | RecipeCategory;
export type RecipeSort = "relevance" | "protein" | "kcal";
export type RecipeQuery = { query: string; chip: RecipeChip; sort: RecipeSort };
export type RecipeChipCounts = Record<RecipeChip, number>;
export type RecipeChipOption = { value: RecipeChip; label: string; count: number | null };
export type RecipeGroup = { category: RecipeCategory; label: string; total: number; recipes: Recipe[] };
export type RecipePortion = { grams: number; kcal: number; proteinG: number; carbsG: number; fatG: number };
export type RecipeIngredientRow = { foodId: string; name: string; grams: number; kcal: number; share: number };
export type RegistroRecipeItem = Extract<MealItemInput, { kind: "recipe" }>;
export type RegistroRecipeParams = {
  receta?: string | string[];
  medida?: string | string[];
  cantidad?: string | string[];
};
/** "next" = la comida que sigue (la resuelve el registro). */
export type RecipeMealChoice = "next" | MealType;

export const RECIPE_SORTS: readonly RecipeSort[] = ["relevance", "protein", "kcal"];
export const RECIPE_SORT_LABELS: Record<RecipeSort, string> = {
  relevance: "Relevancia",
  protein: "Más proteína",
  kcal: "Menos calorías",
};
export const RECIPE_MEAL_CHOICES: readonly RecipeMealChoice[] = ["next", ...MEAL_TYPES];
export const PORTION_STEP = 0.5;
export const MIN_PORTIONS = 0.5;
export const MAX_PORTIONS = 20;

const QUANTITY_PATTERN = /^\d+(?:[.,]\d+)?$/;

export function isOwnRecipe(recipe: Pick<Recipe, "createdBy">, profileId: string | null) {
  return profileId !== null && recipe.createdBy === profileId;
}

export function countRecipesByChip(recipes: readonly Recipe[], profileId: string | null): RecipeChipCounts {
  const counts = { all: recipes.length, own: 0 } as RecipeChipCounts;

  for (const category of RECIPE_CATEGORIES) {
    counts[category] = 0;
  }

  for (const recipe of recipes) {
    counts[recipe.category] += 1;

    if (isOwnRecipe(recipe, profileId)) {
      counts.own += 1;
    }
  }

  return counts;
}

/** Chips: Todas, Tuyas (con sesión, aunque esté vacío) y las categorías que tienen recetas. */
export function recipeChipOptions(counts: RecipeChipCounts, signedIn: boolean): RecipeChipOption[] {
  const options: RecipeChipOption[] = [{ value: "all", label: "Todas", count: counts.all }];

  if (signedIn) {
    options.push({ value: "own", label: "Tuyas", count: counts.own });
  }

  for (const category of RECIPE_CATEGORIES) {
    if (counts[category] > 0) {
      options.push({ value: category, label: RECIPE_CATEGORY_LABELS[category], count: counts[category] });
    }
  }

  return options;
}

/** "25 recetas · 2 tuyas". */
export function formatRecipesMeta(counts: RecipeChipCounts, signedIn: boolean) {
  const total = formatRecipeCount(counts.all);

  return signedIn && counts.own > 0 ? `${total} · ${counts.own} ${counts.own === 1 ? "tuya" : "tuyas"}` : total;
}

export function formatRecipeCount(count: number) {
  return `${count} ${count === 1 ? "receta" : "recetas"}`;
}

export function filterRecipesByChip(recipes: readonly Recipe[], chip: RecipeChip, profileId: string | null): Recipe[] {
  if (chip === "all") return [...recipes];
  if (chip === "own") return recipes.filter((recipe) => isOwnRecipe(recipe, profileId));
  return recipes.filter((recipe) => recipe.category === chip);
}

/** Ingredientes de más a menos gramos: "Pan integral, Pechuga de pavo, Queso". */
export function ingredientLine(recipe: Pick<Recipe, "ingredients">) {
  return [...recipe.ingredients]
    .sort((left, right) => right.grams - left.grams)
    .map((ingredient) => ingredient.foodName)
    .join(", ");
}

function matchesIngredient(recipe: Recipe, normalizedQuery: string) {
  return recipe.ingredients.some((ingredient) => normalizeSearchText(ingredient.foodName).includes(normalizedQuery));
}

/** Orden estable: "protein" de más a menos proteína y "kcal" de menos a más calorías, por porción. */
export function sortRecipes(recipes: readonly Recipe[], sort: RecipeSort): Recipe[] {
  if (sort === "relevance") {
    return [...recipes];
  }

  return recipes
    .map((recipe, index) => ({ recipe, index, key: sort === "protein" ? -recipe.proteinG : recipe.calories }))
    .sort((left, right) => left.key - right.key || left.index - right.index)
    .map((entry) => entry.recipe);
}

function orderByCategory(recipes: readonly Recipe[]): Recipe[] {
  const rank = new Map(RECIPE_CATEGORIES.map((category, index) => [category, index]));

  return recipes
    .map((recipe, index) => ({ recipe, index }))
    .sort(
      (left, right) =>
        (rank.get(left.recipe.category) ?? 0) - (rank.get(right.recipe.category) ?? 0) || left.index - right.index,
    )
    .map((entry) => entry.recipe);
}

export function isGroupedRecipes(query: RecipeQuery) {
  return !query.query.trim() && query.chip === "all" && query.sort === "relevance";
}

/**
 * Chip → búsqueda → orden. La búsqueda ordena primero lo que coincide en el nombre (por relevancia)
 * y después lo que solo coincide en un ingrediente. Sin búsqueda conserva el orden del servidor.
 */
export function searchRecipes(recipes: readonly Recipe[], query: RecipeQuery, profileId: string | null): Recipe[] {
  const inChip = filterRecipesByChip(recipes, query.chip, profileId);
  const normalized = normalizeSearchText(query.query);

  if (normalized) {
    const byName = searchByName(inChip, normalized, { boost: (recipe) => (isOwnRecipe(recipe, profileId) ? 10 : 0) });
    const named = new Set(byName.map((recipe) => recipe.id));
    const byIngredient = inChip.filter((recipe) => !named.has(recipe.id) && matchesIngredient(recipe, normalized));
    return sortRecipes([...byName, ...byIngredient], query.sort);
  }

  if (query.sort !== "relevance") {
    return sortRecipes(inChip, query.sort);
  }

  return isGroupedRecipes(query) ? orderByCategory(inChip) : inChip;
}

export function groupRecipesByCategory(visible: readonly Recipe[], counts: RecipeChipCounts): RecipeGroup[] {
  return RECIPE_CATEGORIES.map((category) => ({
    category,
    label: RECIPE_CATEGORY_LABELS[category],
    total: counts[category],
    recipes: visible.filter((recipe) => recipe.category === category),
  })).filter((group) => group.recipes.length > 0);
}

/**
 * Tramo del texto que coincide con la búsqueda (sin tildes ni mayúsculas), en índices del texto
 * original, para subrayarlo. null si no coincide.
 */
export function findMatchRange(text: string, query: string): [number, number] | null {
  const needle = normalizeSearchText(query);

  if (!needle) return null;

  // Cada carácter original puede normalizarse a 0 o más caracteres: se arma el mapa de índices.
  let normalized = "";
  const origin: number[] = [];

  for (let index = 0; index < text.length; index += 1) {
    const piece = text[index].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    for (let offset = 0; offset < piece.length; offset += 1) {
      origin.push(index);
    }

    normalized += piece;
  }

  const start = normalized.indexOf(needle);

  if (start < 0) return null;

  return [origin[start], origin[start + needle.length - 1] + 1];
}

/** "1 porción", "1,5 porciones". */
export function formatPortions(portions: number) {
  return `${formatDecimal(portions)} ${portions === 1 ? "porción" : "porciones"}`;
}

/** Valores de `portions` porciones, redondeados como el preview del registro. */
export function recipePortion(recipe: Pick<Recipe, "servingG" | "kcalPerG" | "macrosPerG">, portions: number): RecipePortion {
  const grams = recipe.servingG * portions;

  return {
    grams: Math.round(grams),
    kcal: Math.round(recipe.kcalPerG * grams),
    proteinG: Math.round(recipe.macrosPerG.proteinG * grams),
    carbsG: Math.round(recipe.macrosPerG.carbsG * grams),
    fatG: Math.round(recipe.macrosPerG.fatG * grams),
  };
}

/**
 * Ingredientes para `portions` porciones: los gramos guardados son de la receta entera, así que se
 * escalan por `servingG / peso base` (peso final si existe; si no, la suma de ingredientes).
 * `share` es la parte de las kcal que aporta cada uno (0–1).
 */
export function recipeIngredientRows(
  recipe: Pick<Recipe, "servingG" | "totalWeightG" | "ingredients">,
  portions: number,
): RecipeIngredientRow[] {
  const rawGrams = recipe.ingredients.reduce((sum, ingredient) => sum + ingredient.grams, 0);
  const baseGrams = recipe.totalWeightG != null && recipe.totalWeightG > 0 ? recipe.totalWeightG : rawGrams;
  const factor = baseGrams > 0 ? (recipe.servingG / baseGrams) * portions : 0;
  const totalKcal = recipe.ingredients.reduce((sum, ingredient) => sum + ingredient.kcal, 0);

  return [...recipe.ingredients]
    .sort((left, right) => right.grams - left.grams)
    .map((ingredient) => ({
      foodId: ingredient.foodId,
      name: ingredient.foodName,
      grams: Math.round(ingredient.grams * factor),
      kcal: Math.round(ingredient.kcal * factor),
      share: totalKcal > 0 ? ingredient.kcal / totalKcal : 0,
    }));
}

/** "Registrar 1 porción" · "Registrar 1,5 porciones en cena". */
export function registerRecipeLabel(portions: number, meal: RecipeMealChoice) {
  const base = `Registrar ${formatPortions(portions)}`;
  return meal === "next" ? base : `${base} en ${MEAL_TYPE_LABELS[meal].toLowerCase()}`;
}

export function mealChoiceLabel(meal: RecipeMealChoice) {
  return meal === "next" ? "La que sigue" : MEAL_TYPE_LABELS[meal];
}

/** Link "Registrar": `/nutricion/registro?receta=<id>&medida=unit&cantidad=<n>[&tipo=<comida>]`. */
export function registroRecipeHref(item: { recipeId: string; portions: number; meal: RecipeMealChoice }) {
  const params = new URLSearchParams({
    receta: item.recipeId,
    medida: "unit",
    cantidad: formatQuantity(item.portions),
  });

  if (item.meal !== "next") {
    params.set("tipo", item.meal);
  }

  return `/nutricion/registro?${params.toString()}`;
}

function firstParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/** Lee el link "Registrar" de una receta. null si falta algo, si la receta no existe o si la cantidad no es válida. */
export function parseRegistroRecipeParams(
  params: RegistroRecipeParams,
  recipes: readonly Pick<Recipe, "id">[],
): RegistroRecipeItem | null {
  const recipeId = firstParam(params.receta);
  const measure = firstParam(params.medida);
  const rawQuantity = firstParam(params.cantidad);

  if (!recipeId || !QUANTITY_PATTERN.test(rawQuantity)) return null;
  if (!(FOOD_MEASURES as readonly string[]).includes(measure)) return null;
  if (!recipes.some((recipe) => recipe.id === recipeId)) return null;

  const quantity = Number(rawQuantity.replace(",", "."));
  if (!(quantity > 0) || quantity > MAX_LOG_QUANTITY) return null;

  return { kind: "recipe", recipeId, measure: measure as FoodMeasure, quantity };
}
