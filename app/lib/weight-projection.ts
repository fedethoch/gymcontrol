import { calculateBmr } from "@/app/lib/nutrition-calc";
import { effectiveTargetWeight } from "@/app/lib/nutrition-plan-options";
import { ACTIVITY_LEVEL_INFO, type Goal, type NutritionProfileInput } from "@/app/lib/nutrition-types";

/**
 * Proyección del peso si se cumple el objetivo diario (/configuracion, DESIGN.md §15.4).
 * Balance energético día a día con un mantenimiento que se recalcula con el peso:
 * la curva se aplana sola. Con % de grasa en el perfil, cada kg se reparte entre grasa y magra
 * (Forbes). Se testea con `node --test` (tests/unit/weight-projection.test.mjs).
 */

export const PROJECTION_HORIZONS = [4, 12, 24] as const;
export type ProjectionHorizon = (typeof PROJECTION_HORIZONS)[number];

export type ProjectionPoint = { week: number; kg: number; low: number; high: number };
/** `pct` con su banda; `fatKg` y `leanKg` son la grasa y la masa magra de esa semana. */
export type FatPoint = { week: number; pct: number; low: number; high: number; fatKg: number; leanKg: number };
export type ProjectionPace = "slow" | "steady" | "fast";
export type ProjectionDirection = "down" | "up" | "flat";

export type WeightProjection = {
  points: ProjectionPoint[];
  /** Cambio de la primera semana, en kg (negativo = baja). */
  weeklyKg: number;
  /** El mismo cambio como % del peso actual, sin signo. */
  weeklyPct: number;
  direction: ProjectionDirection;
  pace: ProjectionPace;
  /** La curva tocó el peso de IMC 18,5 y se detuvo ahí. */
  floorReached: boolean;
  /** % de grasa semana a semana; null si el perfil no tiene % de grasa. */
  fat: FatPoint[] | null;
  /** Peso objetivo válido para el objetivo (null si no hay o va al revés). */
  targetKg: number | null;
  /** Semanas hasta el peso objetivo; null si no se llega en 3 años. */
  weeksToTarget: number | null;
};

const KCAL_PER_KG = 7700;
const BAND_SHARE = 0.25;
const MIN_BMI = 18.5;
// Menos de 0,3 kg en 12 semanas: el peso se mantiene.
const FLAT_WEEKLY_KG = 0.3 / 12;
// % del peso por semana: [suave hasta, sostenible hasta].
const PACE_LIMITS: Record<Exclude<ProjectionDirection, "flat">, [number, number]> = {
  down: [0.5, 1],
  up: [0.25, 0.5],
};
// Forbes: la parte magra de cada kg que cambia es 10,4 / (10,4 + kg de grasa).
const FORBES_KG = 10.4;
// Al bajar, entrenar con la proteína del plan protege el músculo: la parte magra se reduce a la mitad.
const CUT_LEAN_FACTOR = 0.5;

function leanShare(fatKg: number, changeKg: number): number {
  const share = FORBES_KG / (FORBES_KG + fatKg);
  return changeKg < 0 ? share * CUT_LEAN_FACTOR : share;
}

export function showsProjection(goal: Goal): boolean {
  return goal !== "maintenance";
}

// Hasta dónde se busca cuándo se llega al peso objetivo.
const TARGET_SEARCH_WEEKS = 156;

export function projectWeight(input: NutritionProfileInput, targetKcal: number, weeks: number): WeightProjection {
  const factor = ACTIVITY_LEVEL_INFO[input.activityLevel].factor;
  const calculated = (weightKg: number) => calculateBmr({ ...input, weightKg }) * factor;
  const start = input.weightKg;
  // Con un mantenimiento real cargado, se mantiene su diferencia con el calculado a medida que cambia el peso.
  const offset = input.maintenanceOverrideKcal == null ? 0 : input.maintenanceOverrideKcal - calculated(start);
  const maintenance = (weightKg: number) => calculated(weightKg) + offset;
  const floorKg = MIN_BMI * (input.heightCm / 100) ** 2;
  const target = effectiveTargetWeight(input);
  const crossed = (value: number) => target != null && (value - target) * (start - target) <= 0;

  let weight = start;
  let fatKg = input.bodyFatPct == null ? null : (start * input.bodyFatPct) / 100;
  let floorReached = false;
  let targetDay: number | null = null;
  const weights = [start];
  const fats = [fatKg];

  for (let day = 1; day <= weeks * 7; day += 1) {
    const previous = weight;
    const next = targetDay != null ? weight : weight + (targetKcal - maintenance(weight)) / KCAL_PER_KG;

    if (next < floorKg && next < weight) {
      weight = Math.min(weight, floorKg);
      floorReached = true;
    } else if (targetDay == null && crossed(next)) {
      weight = target as number;
      targetDay = day;
    } else {
      weight = next;
    }

    const change = weight - previous;
    if (fatKg != null) fatKg += change * (1 - leanShare(fatKg, change));

    if (day % 7 === 0) {
      weights.push(weight);
      fats.push(fatKg);
    }
  }

  const points = weights.map((kg, week) => {
    const spread = Math.abs(kg - start) * BAND_SHARE;
    return { week, kg, low: kg - spread, high: kg + spread };
  });
  // Ritmo con la primera semana completa, aunque el peso objetivo se alcance antes.
  const weeklyKg =
    targetDay != null && targetDay <= 7
      ? ((targetKcal - maintenance(start)) * 7) / KCAL_PER_KG
      : (weights[1] ?? start) - start;
  const weeklyPct = (Math.abs(weeklyKg) / start) * 100;
  const direction: ProjectionDirection =
    Math.abs(weeklyKg) < FLAT_WEEKLY_KG ? "flat" : weeklyKg < 0 ? "down" : "up";

  // Si no se llegó dentro del horizonte, se sigue simulando solo para saber cuándo.
  if (target != null && targetDay == null && !floorReached) {
    for (let day = weeks * 7 + 1; day <= TARGET_SEARCH_WEEKS * 7; day += 1) {
      const next = weight + (targetKcal - maintenance(weight)) / KCAL_PER_KG;
      if (next < floorKg || Math.abs(next - weight) < 1e-6) break;
      if (crossed(next)) {
        targetDay = day;
        break;
      }
      weight = next;
    }
  }

  return {
    points,
    weeklyKg,
    weeklyPct,
    direction,
    pace: projectionPace(direction, weeklyPct),
    floorReached,
    fat: input.bodyFatPct == null ? null : fatPoints(weights, fats as number[]),
    targetKg: target,
    weeksToTarget: targetDay == null ? null : Math.ceil(targetDay / 7),
  };
}

function fatPoints(weights: number[], fats: number[]): FatPoint[] {
  const startPct = (fats[0] / weights[0]) * 100;

  return weights.map((kg, week) => {
    const pct = (fats[week] / kg) * 100;
    const spread = Math.abs(pct - startPct) * BAND_SHARE;
    return { week, pct, low: pct - spread, high: pct + spread, fatKg: fats[week], leanKg: kg - fats[week] };
  });
}

export function projectionPace(direction: ProjectionDirection, weeklyPct: number): ProjectionPace {
  if (direction === "flat") return "slow";
  const [slow, steady] = PACE_LIMITS[direction];
  return weeklyPct < slow ? "slow" : weeklyPct <= steady ? "steady" : "fast";
}

/** El objetivo fijado a mano lleva el peso al revés de lo que busca el objetivo elegido. */
export function contradictsGoal(goal: Goal, direction: ProjectionDirection): boolean {
  return (goal === "cut" && direction === "up") || (goal === "bulk" && direction === "down");
}

export const PACE_COPY: Record<ProjectionPace, string> = {
  slow: "Ritmo suave",
  steady: "Ritmo sostenible",
  fast: "Ritmo alto",
};

/** Por qué el ritmo alto es un problema, según hacia dónde va el peso. */
export function fastPaceNote(direction: ProjectionDirection): string {
  return direction === "up"
    ? "Más de 0,5% por semana: vas a sumar más grasa."
    : "Más de 1% por semana: puede costar músculo.";
}

/** 73.512 → "73,5". */
export function formatKg(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

/** Con signo tipográfico: −5,0 · +2,8 · 0,0. */
export function formatKgDelta(value: number, decimals = 1): string {
  const text = Math.abs(value).toFixed(decimals).replace(".", ",");
  if (Number(text.replace(",", ".")) === 0) return text;
  return `${value < 0 ? "−" : "+"}${text}`;
}
