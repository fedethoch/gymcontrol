import "server-only";

import { createSupabaseServerClient } from "@/app/lib/supabase/server";
import type { Recipe, RecipeCategory, RecipeIngredient } from "@/app/lib/nutrition-types";
import { buildRecipeSnapshot, nutritionFromSnapshot, recipeRawGrams } from "@/app/lib/recipe-nutrition";

export type AdminRecipeListItem = Recipe & {
  createdAt: string;
  createdAtLabel: string;
  authorName: string | null;
};

/** Snapshot del alimento en el ingrediente: los alimentos privados no se leen desde otras cuentas. */
type RecipeItemRow = {
  food_id: string;
  grams: number;
  food_name: string;
  serving_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

type RecipeRow = {
  id: string;
  name: string;
  description: string | null;
  category: RecipeCategory;
  serving_g: number | null;
  total_weight_g: number | null;
  created_by: string | null;
  created_at: string;
  recipe_items: RecipeItemRow[] | null;
  author?: { display_name: string | null } | { display_name: string | null }[] | null;
};

const RECIPE_SELECT =
  "id, name, description, category, serving_g, total_weight_g, created_by, created_at, recipe_items(food_id, grams, food_name, serving_g, calories, protein_g, carbs_g, fat_g)";

export type RecipeInput = {
  name: string;
  description: string;
  category: RecipeCategory;
  servingG: number;
  totalWeightG: number | null;
  ingredients: { foodId: string; grams: number }[];
};

/** Recetas públicas visibles en catálogo y buscador (sin archivadas). */
export async function listRecipeCatalogItems(): Promise<Recipe[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(RECIPE_SELECT)
    .is("archived_at", null)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`No se pudo leer el catalogo de recetas: ${error.message}`);
  }

  return (data ?? []).map((recipe) => mapRecipe(recipe as RecipeRow));
}

export async function listAdminRecipes(): Promise<AdminRecipeListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(`${RECIPE_SELECT}, author:profiles!recipes_created_by_fkey(display_name)`)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron listar las recetas: ${error.message}`);
  }

  return ((data ?? []) as unknown as RecipeRow[]).map((recipe) => {
    const author = Array.isArray(recipe.author) ? recipe.author[0] : recipe.author;

    return {
      ...mapRecipe(recipe),
      createdAt: recipe.created_at,
      createdAtLabel: formatDateLabel(recipe.created_at),
      authorName: author?.display_name ?? null,
    };
  });
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(RECIPE_SELECT)
    .eq("id", id)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer la receta: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapRecipe(data as RecipeRow);
}

/** Crea o edita en una transacción (RPC `save_recipe`: valida dueño/admin, ingredientes del catálogo o propios y guarda su snapshot). */
export async function saveRecipe(input: RecipeInput & { id: string | null }): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("save_recipe", {
    p_recipe_id: input.id,
    p_name: input.name,
    p_description: input.description,
    p_category: input.category,
    p_serving_g: input.servingG,
    p_total_weight_g: input.totalWeightG,
    p_items: input.ingredients.map((ingredient) => ({ food_id: ingredient.foodId, grams: ingredient.grams })),
  });

  if (error || !data) {
    // Los mensajes de validación de la RPC ya están pensados para el usuario.
    const isValidation = error?.code === "22023" || error?.code === "P0002" || error?.code === "42501";
    throw new Error(isValidation ? error.message : `No se pudo guardar la receta: ${error?.message ?? "sin id"}`);
  }

  return data as string;
}

/** Archiva: deja de verse en catálogo y buscador; las comidas que la usaron quedan intactas. */
export async function archiveRecipe(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recipes")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .is("archived_at", null)
    .select("id");

  if (error) {
    throw new Error(`No se pudo eliminar la receta: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("La receta no existe o no podés eliminarla.");
  }
}

function mapRecipe(row: RecipeRow): Recipe {
  const ingredients: RecipeIngredient[] = [];
  const nutritionInput = { servingG: 0, totalWeightG: row.total_weight_g != null ? Number(row.total_weight_g) : null, ingredients: [] as Array<{ grams: number; food: { servingG: number; calories: number; proteinG: number; carbsG: number; fatG: number } | null }> };

  for (const item of row.recipe_items ?? []) {
    const food = {
      servingG: Number(item.serving_g),
      calories: Number(item.calories),
      proteinG: Number(item.protein_g),
      carbsG: Number(item.carbs_g),
      fatG: Number(item.fat_g),
    };
    ingredients.push({
      foodId: item.food_id,
      foodName: item.food_name,
      grams: Number(item.grams),
      kcal: food.servingG > 0 ? (food.calories * Number(item.grams)) / food.servingG : 0,
      food,
    });
    nutritionInput.ingredients.push({ grams: Number(item.grams), food });
  }

  nutritionInput.servingG = row.serving_g != null ? Number(row.serving_g) : recipeRawGrams(nutritionInput);

  const snapshot = buildRecipeSnapshot(nutritionInput);
  const portion = snapshot ? nutritionFromSnapshot(snapshot, nutritionInput.servingG) : { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    category: row.category,
    servingG: nutritionInput.servingG,
    totalWeightG: nutritionInput.totalWeightG,
    ingredients,
    createdBy: row.created_by,
    calories: Math.round(portion.kcal),
    proteinG: Math.round(portion.proteinG),
    carbsG: Math.round(portion.carbsG),
    fatG: Math.round(portion.fatG),
    kcalPerG: snapshot?.kcalPerG ?? 0,
    macrosPerG: {
      proteinG: snapshot?.proteinPerG ?? 0,
      carbsG: snapshot?.carbsPerG ?? 0,
      fatG: snapshot?.fatPerG ?? 0,
    },
  };
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
