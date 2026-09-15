import type { MealGroup } from "@/app/lib/meal-logs";
import { buildDayMealRows } from "@/app/lib/meal-order";
import { MEAL_TYPE_LABELS, type MealType } from "@/app/lib/nutrition-types";
import type { RoutineItem } from "@/app/lib/routines";
import { isValidSet } from "@/app/lib/workout-progression";
import type { OpenWorkoutSession } from "@/app/lib/workout-tracking";

export type HeroState = "ready" | "in_progress" | "done_today" | "week_done" | "no_routine";

const MUSCLE_GROUP_LABELS: Record<string, string> = { Biceps: "Bíceps", Triceps: "Tríceps" };

/** `muscle_group` de la base ("Biceps") → texto de UI ("Bíceps"). */
export function formatMuscleGroup(group: string) {
  return MUSCLE_GROUP_LABELS[group] ?? group;
}

/** Estado del hero del home mobile (DESIGN.md §10.2). */
export function resolveHeroState(args: {
  hasActiveRoutine: boolean;
  hasPendingDay: boolean;
  trainedToday: boolean;
  hasOpenSession: boolean;
}): HeroState {
  if (!args.hasActiveRoutine) return "no_routine";
  if (args.hasOpenSession) return "in_progress";
  if (!args.hasPendingDay) return "week_done";
  if (args.trainedToday) return "done_today";
  return "ready";
}

export type SessionProgress = {
  done: number;
  total: number;
  nextExerciseName: string | null;
};

/** Ejercicio hecho = todas sus series del plan marcadas como hechas. */
export function getSessionProgress(items: RoutineItem[], session: OpenWorkoutSession): SessionProgress {
  const isDone = (item: RoutineItem) => {
    const sets = session.itemsByRoutineItemId[item.id]?.sets ?? [];
    return sets.filter(isValidSet).length >= item.series;
  };

  return {
    done: items.filter(isDone).length,
    total: items.length,
    nextExerciseName: items.find((item) => !isDone(item))?.exercise.name ?? null,
  };
}

export type MealRow = {
  key: string;
  type: MealType;
  label: string;
  kcal: number | null;
  /** A dónde lleva el "+": la comida registrada o una nueva de ese tipo. */
  href: string;
};

/** Comidas registradas en el orden del usuario + Desayuno → Cena vacíos en su lugar (meal-order.ts). */
export function buildMealRows(meals: MealGroup[]): MealRow[] {
  return buildDayMealRows(meals).map((row) =>
    row.kind === "meal"
      ? {
          key: row.key,
          type: row.meal.type,
          label: row.meal.name,
          kcal: Math.round(row.meal.kcal),
          href: `/nutricion/registro?comida=${row.meal.id}`,
        }
      : {
          key: row.key,
          type: row.type as MealType,
          label: MEAL_TYPE_LABELS[row.type as MealType],
          kcal: null,
          href: `/nutricion/registro?tipo=${row.type}`,
        },
  );
}
