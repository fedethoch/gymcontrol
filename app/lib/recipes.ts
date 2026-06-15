import "server-only";

import { createSupabaseServerClient } from "@/app/lib/supabase/server";
import type { FoodCategory, Recipe, RecipeIngredient } from "@/app/lib/nutrition-types";

export type AdminRecipeListItem = Recipe & {
  createdAt: string;
  createdAtLabel: string;
};

type RecipeItemRow = {
  food_id: string;
  grams: number;
  foods: {
    name: string;
    serving_g: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  } | { name: string; serving_g: number; calories: number; protein_g: number; carbs_g: number; fat_g: number }[] | null;
};

type RecipeRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: FoodCategory;
  servings: number;
  created_at: string;
  recipe_items: RecipeItemRow[] | null;
};

const RECIPE_SELECT =
  "id, name, description, image_url, category, servings, created_at, recipe_items(food_id, grams, foods(name, serving_g, calories, protein_g, carbs_g, fat_g))";

export async function listRecipeCatalogItems(): Promise<Recipe[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(RECIPE_SELECT)
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
    .select(RECIPE_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron listar las recetas: ${error.message}`);
  }

  return ((data ?? []) as RecipeRow[]).map((recipe) => ({
    ...mapRecipe(recipe),
    createdAt: recipe.created_at,
    createdAtLabel: formatDateLabel(recipe.created_at),
  }));
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("recipes").select(RECIPE_SELECT).eq("id", id).maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer la receta: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapRecipe(data as RecipeRow);
}

type RecipeInput = {
  name: string;
  description: string;
  category: FoodCategory;
  servings: number;
  ingredients: { foodId: string; grams: number }[];
};

export async function createRecipe(input: RecipeInput & { createdBy: string }): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recipes")
    .insert({
      name: input.name,
      description: input.description,
      image_url: "",
      category: input.category,
      servings: input.servings,
      created_by: input.createdBy,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`No se pudo crear la receta: ${error?.message ?? "sin id"}`);
  }

  await replaceRecipeItems(data.id, input.ingredients);

  return data.id;
}

export async function updateRecipe(input: RecipeInput & { id: string }) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("recipes")
    .update({
      name: input.name,
      description: input.description,
      category: input.category,
      servings: input.servings,
    })
    .eq("id", input.id);

  if (error) {
    throw new Error(`No se pudo actualizar la receta: ${error.message}`);
  }

  await replaceRecipeItems(input.id, input.ingredients);
}

export async function deleteRecipe(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("recipes").delete().eq("id", id);

  if (error) {
    throw new Error(`No se pudo eliminar la receta: ${error.message}`);
  }
}

async function replaceRecipeItems(recipeId: string, ingredients: { foodId: string; grams: number }[]) {
  const supabase = await createSupabaseServerClient();

  const { error: deleteError } = await supabase.from("recipe_items").delete().eq("recipe_id", recipeId);

  if (deleteError) {
    throw new Error(`No se pudieron actualizar los ingredientes: ${deleteError.message}`);
  }

  const { error: insertError } = await supabase.from("recipe_items").insert(
    ingredients.map((ingredient) => ({
      recipe_id: recipeId,
      food_id: ingredient.foodId,
      grams: ingredient.grams,
    })),
  );

  if (insertError) {
    throw new Error(`No se pudieron guardar los ingredientes: ${insertError.message}`);
  }
}

function mapRecipe(row: RecipeRow): Recipe {
  const ingredients: RecipeIngredient[] = [];
  let calories = 0;
  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;

  for (const item of row.recipe_items ?? []) {
    const food = Array.isArray(item.foods) ? item.foods[0] : item.foods;

    if (!food) {
      continue;
    }

    const ratio = item.grams / food.serving_g;

    ingredients.push({
      foodId: item.food_id,
      foodName: food.name,
      grams: item.grams,
    });

    calories += food.calories * ratio;
    proteinG += food.protein_g * ratio;
    carbsG += food.carbs_g * ratio;
    fatG += food.fat_g * ratio;
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    imageUrl: row.image_url ?? "",
    category: row.category,
    servings: row.servings,
    ingredients,
    calories: Math.round(calories),
    proteinG: Math.round(proteinG),
    carbsG: Math.round(carbsG),
    fatG: Math.round(fatG),
  };
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
