import {
  ACTIVITY_LEVEL_INFO,
  type Macros,
  type NutritionPlan,
  type NutritionProfileInput,
} from "@/app/lib/nutrition-types";
import { presetMacroGrams, resolveAdjustment, roundMacros } from "@/app/lib/nutrition-plan-options";

/**
 * Calcula el metabolismo basal (BMR).
 * Si hay % de grasa corporal usa Katch-McArdle (más preciso, basado en masa magra).
 * Si no, usa Mifflin-St Jeor (basado en peso/altura/edad/género).
 */
export function calculateBmr(input: NutritionProfileInput): number {
  const { weightKg, heightCm, age, gender, bodyFatPct } = input;

  if (bodyFatPct != null) {
    const leanMassKg = weightKg * (1 - bodyFatPct / 100);
    return 370 + 21.6 * leanMassKg;
  }

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

/** Mantenimiento calculado con la actividad (sin el valor real que pueda cargar el usuario). */
export function calculateMaintenance(input: NutritionProfileInput): number {
  return calculateBmr(input) * ACTIVITY_LEVEL_INFO[input.activityLevel].factor;
}

/**
 * Calcula plan nutricional completo: BMR, mantenimiento, objetivo y macros.
 * En déficit, el objetivo nunca queda por debajo del metabolismo basal.
 */
export function calculateNutritionPlan(input: NutritionProfileInput): NutritionPlan {
  const bmr = calculateBmr(input);
  const maintenanceKcal = input.maintenanceOverrideKcal ?? calculateMaintenance(input);
  const adjustment = resolveAdjustment(input);
  let targetKcal = maintenanceKcal * (1 + adjustment);

  const clampedToBmr = adjustment < 0 && targetKcal < bmr && maintenanceKcal > bmr;
  if (clampedToBmr) targetKcal = bmr;

  return {
    bmr: Math.round(bmr),
    maintenanceKcal: Math.round(maintenanceKcal),
    targetKcal: Math.round(targetKcal),
    macros: calculateMacros(targetKcal, input),
    adjustment,
    clampedToBmr,
  };
}

/**
 * Distribuye las calorías objetivo en macronutrientes (gramos) según el tipo de dieta.
 * Proteína y grasa (o carbos) se fijan por el tipo; el resto completa las kcal dentro de límites seguros.
 */
export function calculateMacros(targetKcal: number, input: NutritionProfileInput): Macros {
  return roundMacros(presetMacroGrams(targetKcal, input));
}
