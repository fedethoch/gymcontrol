import { calculateBmr } from "@/app/lib/nutrition-calc";
import { ACTIVITY_LEVEL_INFO, type Goal, type NutritionProfileInput } from "@/app/lib/nutrition-types";

/**
 * Proyección del peso si se cumple el objetivo diario (/configuracion, DESIGN.md §15.4).
 * Balance energético día a día con un mantenimiento que se recalcula con el peso:
 * la curva se aplana sola. Se testea con `node --test` (tests/unit/weight-projection.test.mjs).
 */

export const PROJECTION_HORIZONS = [4, 12, 24] as const;
export type ProjectionHorizon = (typeof PROJECTION_HORIZONS)[number];

export type ProjectionPoint = { week: number; kg: number; low: number; high: number };
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

export function showsProjection(goal: Goal): boolean {
  return goal !== "recomposition";
}

export function projectWeight(input: NutritionProfileInput, targetKcal: number, weeks: number): WeightProjection {
  const factor = ACTIVITY_LEVEL_INFO[input.activityLevel].factor;
  const maintenance = (weightKg: number) => calculateBmr({ ...input, weightKg }) * factor;
  const floorKg = MIN_BMI * (input.heightCm / 100) ** 2;
  const start = input.weightKg;

  let weight = start;
  let floorReached = false;
  const weights = [start];

  for (let day = 1; day <= weeks * 7; day += 1) {
    const next = weight + (targetKcal - maintenance(weight)) / KCAL_PER_KG;

    if (next < floorKg && next < weight) {
      weight = Math.min(weight, floorKg);
      floorReached = true;
    } else {
      weight = next;
    }

    if (day % 7 === 0) weights.push(weight);
  }

  const points = weights.map((kg, week) => {
    const spread = Math.abs(kg - start) * BAND_SHARE;
    return { week, kg, low: kg - spread, high: kg + spread };
  });
  const weeklyKg = (weights[1] ?? start) - start;
  const weeklyPct = (Math.abs(weeklyKg) / start) * 100;
  const direction: ProjectionDirection =
    Math.abs(weeklyKg) < FLAT_WEEKLY_KG ? "flat" : weeklyKg < 0 ? "down" : "up";

  return { points, weeklyKg, weeklyPct, direction, pace: projectionPace(direction, weeklyPct), floorReached };
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
