import "server-only";

import { calculateNutritionPlan } from "@/app/lib/nutrition-calc";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";
import type { NutritionPlan, NutritionProfileInput } from "@/app/lib/nutrition-types";

export type NutritionProfile = NutritionProfileInput & {
  plan: NutritionPlan;
};

type NutritionProfileRow = {
  gender: NutritionProfileInput["gender"];
  age: number;
  height_cm: number;
  weight_kg: number;
  body_fat_pct: number | null;
  activity_level: NutritionProfileInput["activityLevel"];
  goal: NutritionProfileInput["goal"];
  bmr_kcal: number;
  maintenance_kcal: number;
  target_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export async function getNutritionProfile(userId: string): Promise<NutritionProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("nutrition_profiles")
    .select(
      "gender, age, height_cm, weight_kg, body_fat_pct, activity_level, goal, bmr_kcal, maintenance_kcal, target_kcal, protein_g, carbs_g, fat_g",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer el perfil nutricional: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapNutritionProfile(data as NutritionProfileRow);
}

export async function saveNutritionProfile(
  userId: string,
  input: NutritionProfileInput,
): Promise<NutritionProfile> {
  const plan = calculateNutritionPlan(input);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("nutrition_profiles").upsert(
    {
      user_id: userId,
      gender: input.gender,
      age: input.age,
      height_cm: input.heightCm,
      weight_kg: input.weightKg,
      body_fat_pct: input.bodyFatPct,
      activity_level: input.activityLevel,
      goal: input.goal,
      bmr_kcal: plan.bmr,
      maintenance_kcal: plan.maintenanceKcal,
      target_kcal: plan.targetKcal,
      protein_g: plan.macros.proteinG,
      carbs_g: plan.macros.carbsG,
      fat_g: plan.macros.fatG,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(`No se pudo guardar el perfil nutricional: ${error.message}`);
  }

  return { ...input, plan };
}

function mapNutritionProfile(row: NutritionProfileRow): NutritionProfile {
  return {
    gender: row.gender,
    age: row.age,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    bodyFatPct: row.body_fat_pct,
    activityLevel: row.activity_level,
    goal: row.goal,
    plan: {
      bmr: row.bmr_kcal,
      maintenanceKcal: row.maintenance_kcal,
      targetKcal: row.target_kcal,
      macros: {
        proteinG: row.protein_g,
        carbsG: row.carbs_g,
        fatG: row.fat_g,
      },
    },
  };
}
