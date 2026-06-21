import "server-only";

import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/app/lib/supabase/server";
import type { Food, FoodCategory, FoodMeasure } from "@/app/lib/nutrition-types";

export type AdminFoodListItem = Food & {
  createdAt: string;
  createdAtLabel: string;
};

type FoodRow = {
  id: string;
  name: string;
  image_url: string;
  category: FoodCategory;
  measure: FoodMeasure;
  serving_g: number;
  grams_per_unit: number | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  created_at: string;
};

const FOOD_SELECT = "id, name, image_url, category, measure, serving_g, grams_per_unit, calories, protein_g, carbs_g, fat_g, created_at";

function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export const listFoodCatalogItems = unstable_cache(
  async (): Promise<Food[]> => {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("foods")
      .select(FOOD_SELECT)
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`No se pudo leer el catalogo de alimentos: ${error.message}`);
    }

    return (data ?? []).map((food) => mapFood(food as FoodRow));
  },
  ["food-catalog"],
  { revalidate: 3600, tags: ["foods"] },
);

export async function listAdminFoods(): Promise<AdminFoodListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("foods")
    .select(FOOD_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron listar los alimentos: ${error.message}`);
  }

  return ((data ?? []) as FoodRow[]).map((food) => ({
    ...mapFood(food),
    createdAt: food.created_at,
    createdAtLabel: formatDateLabel(food.created_at),
  }));
}

export async function getFoodById(id: string): Promise<Food | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("foods").select(FOOD_SELECT).eq("id", id).maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer el alimento: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapFood(data as FoodRow);
}

type FoodInput = {
  name: string;
  category: FoodCategory;
  measure: FoodMeasure;
  servingG: number;
  gramsPerUnit: number | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export async function createFood(input: FoodInput & { createdBy: string }): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("foods")
    .insert({
      name: input.name,
      image_url: "",
      category: input.category,
      measure: input.measure,
      serving_g: input.servingG,
      grams_per_unit: input.gramsPerUnit,
      calories: input.calories,
      protein_g: input.proteinG,
      carbs_g: input.carbsG,
      fat_g: input.fatG,
      created_by: input.createdBy,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`No se pudo crear el alimento: ${error?.message ?? "sin id"}`);
  }

  return data.id;
}

export async function updateFood(input: FoodInput & { id: string }) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("foods")
    .update({
      name: input.name,
      category: input.category,
      measure: input.measure,
      serving_g: input.servingG,
      grams_per_unit: input.gramsPerUnit,
      calories: input.calories,
      protein_g: input.proteinG,
      carbs_g: input.carbsG,
      fat_g: input.fatG,
    })
    .eq("id", input.id);

  if (error) {
    throw new Error(`No se pudo actualizar el alimento: ${error.message}`);
  }
}

export async function deleteFood(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("foods").delete().eq("id", id);

  if (error) {
    throw new Error(`No se pudo eliminar el alimento: ${error.message}`);
  }
}

function mapFood(row: FoodRow): Food {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.image_url,
    category: row.category,
    measure: row.measure,
    servingG: row.serving_g,
    gramsPerUnit: row.grams_per_unit,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
  };
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
