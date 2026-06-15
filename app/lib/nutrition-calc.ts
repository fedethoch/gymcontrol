import {
  ACTIVITY_LEVEL_INFO,
  GOAL_INFO,
  type Macros,
  type NutritionPlan,
  type NutritionProfileInput,
} from "@/app/lib/nutrition-types";

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

/**
 * Calcula plan nutricional completo: BMR, mantenimiento, objetivo y macros.
 */
export function calculateNutritionPlan(input: NutritionProfileInput): NutritionPlan {
  const bmr = calculateBmr(input);
  const maintenanceKcal = bmr * ACTIVITY_LEVEL_INFO[input.activityLevel].factor;
  const targetKcal = maintenanceKcal * (1 + GOAL_INFO[input.goal].kcalAdjustment);

  const macros = calculateMacros(targetKcal, input.weightKg, input.goal);

  return {
    bmr: Math.round(bmr),
    maintenanceKcal: Math.round(maintenanceKcal),
    targetKcal: Math.round(targetKcal),
    macros,
  };
}

/**
 * Distribuye las calorías objetivo en macronutrientes (gramos).
 * Proteína y grasa se fijan por kg de peso corporal; el resto va a carbohidratos.
 */
export function calculateMacros(targetKcal: number, weightKg: number, goal: NutritionProfileInput["goal"]): Macros {
  const proteinPerKg = goal === "bulk" ? 2 : 2.2;
  const fatPerKg = 0.9;

  let proteinG = proteinPerKg * weightKg;
  let fatG = fatPerKg * weightKg;

  let carbsKcal = targetKcal - proteinG * 4 - fatG * 9;

  // Piso de seguridad: grasa minima 20% de kcal totales
  const minFatKcal = targetKcal * 0.2;
  if (fatG * 9 < minFatKcal) {
    fatG = minFatKcal / 9;
    carbsKcal = targetKcal - proteinG * 4 - fatG * 9;
  }

  // Si los carbohidratos quedaran negativos, recortar proteína al minimo razonable
  if (carbsKcal < 0) {
    proteinG = Math.max(weightKg * 1.6, (targetKcal - fatG * 9) / 4 * 0.01);
    carbsKcal = Math.max(0, targetKcal - proteinG * 4 - fatG * 9);
  }

  const carbsG = carbsKcal / 4;

  return {
    proteinG: Math.round(proteinG),
    carbsG: Math.round(carbsG),
    fatG: Math.round(fatG),
  };
}
