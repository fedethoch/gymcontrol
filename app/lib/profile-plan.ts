import { formatDecimal } from "@/app/lib/number-input";
import {
  ACTIVITY_LEVELS,
  type ActivityLevel,
  type Goal,
  type Macros,
  type ManualTarget,
  type NutritionProfileInput,
} from "@/app/lib/nutrition-types";

/** Copy corta de /configuracion mobile (DESIGN.md §15). Desktop sigue con ACTIVITY_LEVEL_INFO / GOAL_INFO. */
export const ACTIVITY_COPY: Record<ActivityLevel, { label: string; hint: string }> = {
  sedentary: { label: "Sedentaria", hint: "Poco o nada de ejercicio" },
  light: { label: "Ligera", hint: "Ejercicio leve 1–3 días" },
  moderate: { label: "Moderada", hint: "Ejercicio moderado 3–5 días" },
  high: { label: "Alta", hint: "Ejercicio intenso 6–7 días" },
  very_high: { label: "Muy alta", hint: "Trabajo físico o doble sesión" },
};

export const GOAL_COPY: Record<Goal, { label: string; hint: string }> = {
  cut: { label: "Déficit", hint: "Bajar grasa cuidando el músculo" },
  maintenance: { label: "Mantenimiento", hint: "Mismo peso, mejor composición" },
  bulk: { label: "Ganancia", hint: "Sumar masa muscular" },
};

// Mismos límites que `manualTargetSchema` en app/configuracion/actions.ts.
const MANUAL_KCAL_MIN = 800;
const MANUAL_KCAL_MAX = 10_000;
const MANUAL_MACRO_MAX = 1500;
const MANUAL_TOLERANCE = 0.1;

export type ManualTargetFields = {
  kcal: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
};

/** Ajuste del objetivo como texto: −20% (signo menos tipográfico), 0%, +10%. */
export function formatAdjustment(adjustment: number): string {
  const pct = Math.round(Math.abs(adjustment) * 100);
  if (pct === 0) return "0%";
  return `${adjustment < 0 ? "−" : "+"}${pct}%`;
}

/** "28 a · 178 cm · 78,5 kg · 22%" para la fila Tu cuerpo. */
export function bodySummary(input: Pick<NutritionProfileInput, "age" | "heightCm" | "weightKg" | "bodyFatPct">): string {
  const fat = input.bodyFatPct === null ? "grasa sin dato" : `${input.bodyFatPct}%`;
  return `${input.age} a · ${formatDecimal(input.heightCm, 1)} cm · ${formatDecimal(input.weightKg, 1)} kg · ${fat}`;
}

export function macroKcal(macros: Macros): number {
  return macros.proteinG * 4 + macros.carbsG * 4 + macros.fatG * 9;
}

/** % de las kcal de los macros que aporta cada uno. Suman 100 (resto mayor); sin kcal, todo 0. */
export function macroSplit(macros: Macros): { protein: number; carbs: number; fat: number } {
  const parts = [macros.proteinG * 4, macros.carbsG * 4, macros.fatG * 9];
  const total = parts[0] + parts[1] + parts[2];

  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 };

  const exact = parts.map((part) => (part / total) * 100);
  const floors = exact.map(Math.floor);
  let remaining = 100 - (floors[0] + floors[1] + floors[2]);

  const byRemainder = [0, 1, 2].sort((a, b) => exact[b] - floors[b] - (exact[a] - floors[a]));
  for (const index of byRemainder) {
    if (remaining <= 0) break;
    floors[index] += 1;
    remaining -= 1;
  }

  return { protein: floors[0], carbs: floors[1], fat: floors[2] };
}

function parseAmount(value: string): number {
  return Math.round(Number(value.trim().replace(",", ".")));
}

/** Objetivo manual solo si es coherente (mismos límites que el servidor); si no, `null`. */
export function parseManualTarget(fields: ManualTargetFields): ManualTarget | null {
  if (!fields.kcal.trim()) return null;

  const kcal = parseAmount(fields.kcal);
  const macros = [fields.proteinG, fields.carbsG, fields.fatG].map(parseAmount);

  if (!Number.isFinite(kcal) || kcal < MANUAL_KCAL_MIN || kcal > MANUAL_KCAL_MAX) return null;
  if (macros.some((value) => !Number.isFinite(value) || value < 0 || value > MANUAL_MACRO_MAX)) return null;

  return { targetKcal: kcal, macros: { proteinG: macros[0], carbsG: macros[1], fatG: macros[2] } };
}

/** ¿Los macros suman lo mismo que las kcal fijadas (±10%)? */
export function checkManualTarget(target: ManualTarget): { macroKcal: number; matches: boolean } {
  const total = macroKcal(target.macros);
  return { macroKcal: total, matches: Math.abs(total - target.targetKcal) <= target.targetKcal * MANUAL_TOLERANCE };
}

/** 0 (sedentaria) … 4 (muy alta), para el medidor de actividad. */
export function activityLevelIndex(level: ActivityLevel): number {
  return ACTIVITY_LEVELS.indexOf(level);
}
