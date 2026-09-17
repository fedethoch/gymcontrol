import {
  VARIANTS_BY_GOAL,
  type Goal,
  type GoalVariant,
  type MacroPreset,
  type Macros,
  type NutritionProfileInput,
} from "@/app/lib/nutrition-types";

/**
 * Variantes de objetivo, tipos de dieta y sus límites (/configuracion, DESIGN.md §15.2 S4).
 * Lógica pura: se testea con `node --test` (tests/unit/nutrition-plan-options.test.mjs).
 */

export type VariantInfo = { label: string; hint: string; adjustment: number };

const VARIANT_INFO: Record<Goal, Partial<Record<GoalVariant, VariantInfo>>> = {
  cut: {
    gentle: { label: "Suave", hint: "Poca grasa por perder o cuidar el rendimiento", adjustment: -0.1 },
    moderate: { label: "Moderado", hint: "Lo más habitual", adjustment: -0.2 },
    aggressive: { label: "Agresivo", hint: "Solo fases cortas, 2–6 semanas", adjustment: -0.25 },
  },
  maintenance: {
    recomposition: { label: "Recomposición", hint: "Mismo peso, más músculo", adjustment: 0 },
    maintain: { label: "Mantener peso", hint: "Sostener lo logrado", adjustment: 0 },
  },
  bulk: {
    lean: { label: "Limpia", hint: "Lo más habitual, poca grasa ganada", adjustment: 0.1 },
    standard: { label: "Estándar", hint: "Principiantes o muy delgados", adjustment: 0.15 },
    aggressive: { label: "Agresiva", hint: "Si te cuesta mucho subir", adjustment: 0.2 },
  },
};

const RECOMMENDED_VARIANT: Record<Goal, GoalVariant> = {
  cut: "moderate",
  maintenance: "recomposition",
  bulk: "lean",
};

/** Rango del ajuste fino por objetivo (paso 1%). */
export const ADJUSTMENT_RANGE: Record<Goal, readonly [number, number]> = {
  cut: [-0.3, -0.05],
  maintenance: [-0.05, 0.05],
  bulk: [0.05, 0.25],
};

export function recommendedVariant(goal: Goal): GoalVariant {
  return RECOMMENDED_VARIANT[goal];
}

export function isVariantOf(goal: Goal, variant: GoalVariant): boolean {
  return (VARIANTS_BY_GOAL[goal] as readonly GoalVariant[]).includes(variant);
}

/** La variante si pertenece al objetivo; si no, la recomendada. */
export function resolveVariant(goal: Goal, variant: GoalVariant | undefined): GoalVariant {
  return variant && isVariantOf(goal, variant) ? variant : RECOMMENDED_VARIANT[goal];
}

export function variantInfo(goal: Goal, variant: GoalVariant | undefined): VariantInfo {
  return VARIANT_INFO[goal][resolveVariant(goal, variant)] as VariantInfo;
}

export function goalVariantOptions(goal: Goal): { value: GoalVariant; info: VariantInfo; recommended: boolean }[] {
  return VARIANTS_BY_GOAL[goal].map((value) => ({
    value,
    info: VARIANT_INFO[goal][value] as VariantInfo,
    recommended: value === RECOMMENDED_VARIANT[goal],
  }));
}

/** Redondea a 1% para que el ajuste guardado no arrastre decimales de coma flotante. */
function roundPct(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Ajuste efectivo: el fino (acotado al rango del objetivo) o el de la variante. */
export function resolveAdjustment(
  input: Pick<NutritionProfileInput, "goal" | "goalVariant" | "kcalAdjustment">,
): number {
  if (input.kcalAdjustment == null) return variantInfo(input.goal, input.goalVariant).adjustment;
  const [min, max] = ADJUSTMENT_RANGE[input.goal];
  return roundPct(Math.min(max, Math.max(min, input.kcalAdjustment)));
}

// ── Tipos de dieta ────────────────────────────────────────────────────────────

export const MACRO_PRESET_COPY: Record<MacroPreset, { label: string; hint: string }> = {
  balanced: { label: "Equilibrada", hint: "De todo un poco" },
  high_protein: { label: "Alta en proteína", hint: "Cuidar el músculo en déficit" },
  high_carb: { label: "Alta en carbos", hint: "Rendimiento y mucho volumen" },
  high_fat: { label: "Alta en grasas", hint: "Menos carbos, más saciedad" },
  keto: { label: "Keto", hint: "Carbos casi cero" },
  custom: { label: "Personalizada", hint: "La armás vos" },
};

export const RECOMMENDED_PRESET: MacroPreset = "balanced";

/** Sugerencia según el objetivo (solo una etiqueta, no bloquea nada). */
export function suggestedPreset(goal: Goal, variant: GoalVariant | undefined): MacroPreset {
  const resolved = resolveVariant(goal, variant);
  if (goal === "cut" && resolved === "aggressive") return "high_protein";
  if (goal === "maintenance" && resolved === "recomposition") return "high_protein";
  return "balanced";
}

export type MacroKey = "protein" | "carbs" | "fat";
export type MacroGrams = Record<MacroKey, number>;
export type MacroBounds = Record<MacroKey, readonly [number, number]>;

const KCAL_PER_G: Record<MacroKey, number> = { protein: 4, carbs: 4, fat: 9 };
const KETO_CARBS_G = 30;
// Con mucha grasa corporal, la proteína se calcula sobre la masa magra / 0,8.
const HIGH_FAT_PCT = { male: 25, female: 32 } as const;

/** Peso sobre el que se calcula la proteína por kg. */
export function referenceWeightKg(input: Pick<NutritionProfileInput, "weightKg" | "bodyFatPct" | "gender">): number {
  const { weightKg, bodyFatPct, gender } = input;
  if (bodyFatPct == null || bodyFatPct <= HIGH_FAT_PCT[gender]) return weightKg;
  return (weightKg * (1 - bodyFatPct / 100)) / 0.8;
}

/** Mínimos y máximos en gramos para unas kcal y un peso de referencia. */
export function macroBounds(kcal: number, weightKg: number, preset: MacroPreset = "custom"): MacroBounds {
  const keto = preset === "keto";
  const proteinMax = Math.min(3 * weightKg, (kcal * 0.4) / 4);
  const proteinMin = Math.min(1.6 * weightKg, proteinMax);
  return {
    protein: [proteinMin, proteinMax],
    fat: [Math.max((kcal * 0.2) / 9, 0.5 * weightKg), (kcal * (keto ? 0.85 : 0.6)) / 9],
    carbs: [keto ? 0 : (kcal * 0.1) / 4, (kcal * 0.65) / 4],
  };
}

/** Franja recomendada de cada slider (en gramos). */
export function recommendedBands(kcal: number, weightKg: number): MacroBounds {
  return {
    protein: [1.8 * weightKg, 2.4 * weightKg],
    fat: [(kcal * 0.25) / 9, (kcal * 0.35) / 9],
    carbs: [(kcal * 0.4) / 4, (kcal * 0.55) / 4],
  };
}

function clamp(value: number, [min, max]: readonly [number, number]): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Acota los macros fijos y calcula `rest` para que la suma dé las kcal.
 * Si `rest` sale de su rango, los `absorbers` (en orden) ceden o toman la diferencia dentro de sus límites.
 */
export function settleMacros(
  kcal: number,
  grams: MacroGrams,
  bounds: MacroBounds,
  rest: MacroKey,
  absorbers: MacroKey[],
): MacroGrams {
  const next = { ...grams };
  const keys: MacroKey[] = ["protein", "carbs", "fat"];
  const fillRest = () => {
    const used = keys.filter((key) => key !== rest).reduce((sum, key) => sum + next[key] * KCAL_PER_G[key], 0);
    next[rest] = (kcal - used) / KCAL_PER_G[rest];
  };

  for (const key of keys) if (key !== rest) next[key] = clamp(next[key], bounds[key]);
  fillRest();

  for (const absorber of absorbers) {
    const [low, high] = bounds[rest];
    const [absorberLow, absorberHigh] = bounds[absorber];
    if (next[rest] < low) {
      const needed = (low - next[rest]) * KCAL_PER_G[rest];
      const available = Math.max(0, (next[absorber] - absorberLow) * KCAL_PER_G[absorber]);
      next[absorber] -= Math.min(needed, available) / KCAL_PER_G[absorber];
    } else if (next[rest] > high) {
      const excess = (next[rest] - high) * KCAL_PER_G[rest];
      const room = Math.max(0, (absorberHigh - next[absorber]) * KCAL_PER_G[absorber]);
      next[absorber] += Math.min(excess, room) / KCAL_PER_G[absorber];
    } else {
      break;
    }
    fillRest();
  }

  next[rest] = Math.max(0, next[rest]);
  return next;
}

/** Macros de un tipo de dieta, ya acotados, sin redondear. */
export function presetMacroGrams(targetKcal: number, input: NutritionProfileInput): MacroGrams {
  const preset = input.macroPreset ?? RECOMMENDED_PRESET;
  const weight = referenceWeightKg(input);
  const bounds = macroBounds(targetKcal, weight, preset);
  const fatFromPct = (pct: number) => (targetKcal * pct) / 9;
  const settle = (grams: Omit<MacroGrams, "carbs" | "fat"> & Partial<MacroGrams>, rest: MacroKey) =>
    settleMacros(targetKcal, { carbs: 0, fat: 0, ...grams }, bounds, rest, rest === "carbs" ? ["fat", "protein"] : ["carbs", "protein"]);

  switch (preset) {
    case "high_protein":
      return settle({ protein: 2.6 * weight, fat: fatFromPct(0.25) }, "carbs");
    case "high_carb":
      return settle({ protein: 1.8 * weight, fat: fatFromPct(0.2) }, "carbs");
    case "high_fat":
      return settle({ protein: 2.2 * weight, carbs: (targetKcal * 0.2) / 4 }, "fat");
    case "keto":
      return settle({ protein: 1.8 * weight, carbs: KETO_CARBS_G }, "fat");
    case "custom":
      return settle(
        {
          protein: (input.customProteinGPerKg ?? 2.2) * weight,
          fat: fatFromPct((input.customFatPct ?? 30) / 100),
        },
        "carbs",
      );
    case "balanced":
    default:
      return settle(
        {
          protein: (input.goal === "bulk" ? 2 : 2.2) * weight,
          fat: Math.max(0.9 * input.weightKg, fatFromPct(0.2)),
        },
        "carbs",
      );
  }
}

export function roundMacros(grams: MacroGrams): Macros {
  return { proteinG: Math.round(grams.protein), carbsG: Math.round(grams.carbs), fatG: Math.round(grams.fat) };
}

export function toMacroGrams(macros: Macros): MacroGrams {
  return { protein: macros.proteinG, carbs: macros.carbsG, fat: macros.fatG };
}

/**
 * Sliders enlazados de la dieta Personalizada: mueve un macro y reacomoda los otros dos
 * para que la suma siga dando las kcal. Si no queda margen, el macro movido se frena.
 */
export function adjustCustomMacros(
  kcal: number,
  current: MacroGrams,
  changed: MacroKey,
  value: number,
  bounds: MacroBounds,
): MacroGrams {
  const next = { ...current, [changed]: clamp(value, bounds[changed]) };
  if (changed === "carbs") return settleMacros(kcal, next, bounds, "fat", ["carbs"]);
  const other: MacroKey = changed === "protein" ? "fat" : "protein";
  return settleMacros(kcal, next, bounds, "carbs", [other, changed]);
}

// Rangos que acepta la base (nutrition_profiles.custom_*): los macroBounds casi nunca llegan a los bordes.
export const CUSTOM_PROTEIN_RANGE = [1, 4] as const;
export const CUSTOM_FAT_PCT_RANGE = [10, 90] as const;

/** Lo que se guarda de la Personalizada: proteína por kg y % de grasa (los carbos se recalculan). */
export function customParamsFrom(
  kcal: number,
  weightKg: number,
  grams: MacroGrams,
): { customProteinGPerKg: number; customFatPct: number } {
  return {
    customProteinGPerKg: clamp(Math.round((grams.protein / weightKg) * 100) / 100, CUSTOM_PROTEIN_RANGE),
    customFatPct: clamp(Math.round(((grams.fat * 9) / kcal) * 1000) / 10, CUSTOM_FAT_PCT_RANGE),
  };
}

/** Los carbos quedaron en su mínimo: conviene sugerir Keto. */
export function suggestsKeto(grams: MacroGrams, bounds: MacroBounds): boolean {
  return grams.carbs <= bounds.carbs[0] + 0.5;
}

// ── Avanzado ──────────────────────────────────────────────────────────────────

export const MAINTENANCE_OVERRIDE_RANGE = [1000, 6000] as const;

/** Peso objetivo solo si va en la dirección del objetivo; si no, se ignora. */
export function effectiveTargetWeight(
  input: Pick<NutritionProfileInput, "goal" | "weightKg" | "targetWeightKg">,
): number | null {
  const target = input.targetWeightKg;
  if (target == null) return null;
  if (input.goal === "cut" && target < input.weightKg) return target;
  if (input.goal === "bulk" && target > input.weightKg) return target;
  return null;
}
