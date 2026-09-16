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
  category: FoodCategory;
  measure: FoodMeasure;
  serving_g: number;
  grams_per_unit: number | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  owner_user_id: string | null;
  created_at: string;
};

const FOOD_SELECT =
  "id, name, category, measure, serving_g, grams_per_unit, calories, protein_g, carbs_g, fat_g, owner_user_id, created_at";

const FOREIGN_KEY_VIOLATION = "23503";

function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/** Catálogo global (sin alimentos privados). Cacheado: se invalida con el tag "foods". */
export const listFoodCatalogItems = unstable_cache(
  async (): Promise<Food[]> => {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("foods")
      .select(FOOD_SELECT)
      .is("owner_user_id", null)
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

export async function listOwnFoods(userId: string): Promise<Food[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("foods")
    .select(FOOD_SELECT)
    .eq("owner_user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron leer tus alimentos: ${error.message}`);
  }

  return ((data ?? []) as FoodRow[]).map(mapFood);
}

/** Alimentos propios del usuario primero, después el catálogo global. */
export async function listFoodsForUser(userId: string): Promise<Food[]> {
  const [ownFoods, catalog] = await Promise.all([listOwnFoods(userId), listFoodCatalogItems()]);

  return [...ownFoods, ...catalog];
}

export async function listAdminFoods(): Promise<AdminFoodListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("foods")
    .select(FOOD_SELECT)
    .is("owner_user_id", null)
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

/** Busca un alimento del catálogo global (`ownerUserId` null) o uno privado de ese usuario. */
export async function getFoodById(id: string, ownerUserId: string | null = null): Promise<Food | null> {
  const supabase = await createSupabaseServerClient();
  const query = supabase.from("foods").select(FOOD_SELECT).eq("id", id);
  const { data, error } = await (ownerUserId ? query.eq("owner_user_id", ownerUserId) : query.is("owner_user_id", null)).maybeSingle();

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

export async function createFood(
  input: FoodInput & { createdBy: string; ownerUserId?: string | null },
): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("foods")
    .insert({
      name: input.name,
      category: input.category,
      measure: input.measure,
      serving_g: input.servingG,
      grams_per_unit: input.gramsPerUnit,
      calories: input.calories,
      protein_g: input.proteinG,
      carbs_g: input.carbsG,
      fat_g: input.fatG,
      created_by: input.createdBy,
      owner_user_id: input.ownerUserId ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`No se pudo crear el alimento: ${error?.message ?? "sin id"}`);
  }

  return data.id;
}

export async function updateFood(input: FoodInput & { id: string; ownerUserId?: string | null }) {
  const supabase = await createSupabaseServerClient();
  const query = supabase
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
  const { data, error } = await (input.ownerUserId ? query.eq("owner_user_id", input.ownerUserId) : query.is("owner_user_id", null)).select("id");

  if (error) {
    throw new Error(`No se pudo actualizar el alimento: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("El alimento que intentas editar ya no existe.");
  }
}

export async function deleteFood(id: string, ownerUserId: string | null = null) {
  const supabase = await createSupabaseServerClient();
  const query = supabase.from("foods").delete().eq("id", id);
  const { error } = await (ownerUserId ? query.eq("owner_user_id", ownerUserId) : query.is("owner_user_id", null));

  if (error?.code === FOREIGN_KEY_VIOLATION) {
    throw new Error("Este alimento está usado en comidas registradas o recetas, por eso no se puede eliminar.");
  }

  if (error) {
    throw new Error(`No se pudo eliminar el alimento: ${error.message}`);
  }
}

function mapFood(row: FoodRow): Food {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    measure: row.measure,
    servingG: row.serving_g,
    gramsPerUnit: row.grams_per_unit,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    ownerUserId: row.owner_user_id,
  };
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
