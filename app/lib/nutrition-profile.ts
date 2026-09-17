import "server-only";

import { calculateNutritionPlan } from "@/app/lib/nutrition-calc";
import { resolveAdjustment } from "@/app/lib/nutrition-plan-options";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";
import type {
  GoalVariant,
  MacroPreset,
  ManualTarget,
  NutritionPlan,
  NutritionProfileInput,
  TargetMode,
} from "@/app/lib/nutrition-types";

export type NutritionProfile = NutritionProfileInput & {
  /** Objetivo vigente: el calculado o, en modo manual, el fijado por el usuario. */
  plan: NutritionPlan;
  targetMode: TargetMode;
};

type NutritionProfileRow = {
  gender: NutritionProfileInput["gender"];
  age: number;
  height_cm: number;
  weight_kg: number;
  body_fat_pct: number | null;
  activity_level: NutritionProfileInput["activityLevel"];
  // 'recomposition' es el valor viejo de Mantenimiento (ver 20260917_nutrition_plan_options.sql).
  goal: NutritionProfileInput["goal"] | "recomposition";
  goal_variant: GoalVariant | null;
  kcal_adjustment: number | string | null;
  macro_preset: MacroPreset;
  custom_protein_g_per_kg: number | string | null;
  custom_fat_pct: number | string | null;
  maintenance_override_kcal: number | null;
  target_weight_kg: number | string | null;
  target_mode: TargetMode;
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
      "gender, age, height_cm, weight_kg, body_fat_pct, activity_level, goal, goal_variant, kcal_adjustment, macro_preset, custom_protein_g_per_kg, custom_fat_pct, maintenance_override_kcal, target_weight_kg, target_mode, bmr_kcal, maintenance_kcal, target_kcal, protein_g, carbs_g, fat_g",
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

/** Guarda datos y objetivo. Con `manualTarget` el objetivo queda fijo; sin él se usa el cálculo. */
export async function saveNutritionProfile(
  userId: string,
  input: NutritionProfileInput,
  manualTarget: ManualTarget | null = null,
): Promise<NutritionProfile> {
  const calculated = calculateNutritionPlan(input);
  const plan: NutritionPlan = manualTarget
    ? { ...calculated, targetKcal: manualTarget.targetKcal, macros: manualTarget.macros }
    : calculated;
  const targetMode: TargetMode = manualTarget ? "manual" : "auto";
  const custom = input.macroPreset === "custom";
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
      goal_variant: input.goalVariant ?? null,
      kcal_adjustment: input.kcalAdjustment ?? null,
      macro_preset: input.macroPreset ?? "balanced",
      custom_protein_g_per_kg: custom ? (input.customProteinGPerKg ?? null) : null,
      custom_fat_pct: custom ? (input.customFatPct ?? null) : null,
      maintenance_override_kcal: input.maintenanceOverrideKcal ?? null,
      target_weight_kg: input.targetWeightKg ?? null,
      target_mode: targetMode,
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

  return { ...input, plan, targetMode };
}

function toNumber(value: number | string | null): number | null {
  return value == null ? null : Number(value);
}

function mapNutritionProfile(row: NutritionProfileRow): NutritionProfile {
  const legacyRecomposition = row.goal === "recomposition";
  const input: NutritionProfileInput = {
    gender: row.gender,
    age: row.age,
    heightCm: Number(row.height_cm),
    weightKg: Number(row.weight_kg),
    bodyFatPct: toNumber(row.body_fat_pct),
    activityLevel: row.activity_level,
    goal: legacyRecomposition ? "maintenance" : (row.goal as NutritionProfileInput["goal"]),
    goalVariant: row.goal_variant ?? (legacyRecomposition ? "recomposition" : undefined),
    kcalAdjustment: toNumber(row.kcal_adjustment),
    macroPreset: row.macro_preset,
    customProteinGPerKg: toNumber(row.custom_protein_g_per_kg),
    customFatPct: toNumber(row.custom_fat_pct),
    maintenanceOverrideKcal: row.maintenance_override_kcal,
    targetWeightKg: toNumber(row.target_weight_kg),
  };

  return {
    ...input,
    targetMode: row.target_mode,
    plan: {
      bmr: row.bmr_kcal,
      maintenanceKcal: row.maintenance_kcal,
      targetKcal: row.target_kcal,
      macros: {
        proteinG: row.protein_g,
        carbsG: row.carbs_g,
        fatG: row.fat_g,
      },
      adjustment: resolveAdjustment(input),
      clampedToBmr: calculateNutritionPlan(input).clampedToBmr,
    },
  };
}
