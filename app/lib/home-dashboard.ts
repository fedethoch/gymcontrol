import type { MealGroup } from "@/app/lib/meal-logs";
import { MEAL_TYPE_LABELS, type MealType } from "@/app/lib/nutrition-types";
import type { RoutineItem } from "@/app/lib/routines";
import type { WorkoutSession } from "@/app/lib/workout-tracking";

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
  todaySessionStatus: WorkoutSession["status"] | null;
}): HeroState {
  if (!args.hasActiveRoutine) return "no_routine";
  if (!args.hasPendingDay) return "week_done";
  if (args.todaySessionStatus === "in_progress") return "in_progress";
  if (args.trainedToday) return "done_today";
  return "ready";
}

export type SessionProgress = {
  done: number;
  total: number;
  nextExerciseName: string | null;
};

export function getSessionProgress(items: RoutineItem[], session: WorkoutSession): SessionProgress {
  const isDone = (item: RoutineItem) => session.itemsByRoutineItemId[item.id]?.isCompleted === true;
  return {
    done: items.filter(isDone).length,
    total: items.length,
    nextExerciseName: items.find((item) => !isDone(item))?.exercise.name ?? null,
  };
}

export type MealRow = {
  type: MealType;
  label: string;
  kcal: number | null;
};

const HOME_MEAL_TYPES: MealType[] = ["desayuno", "almuerzo", "merienda", "cena"];

/** Desayuno → Cena siempre; Snack solo si se registró alguno. */
export function buildMealRows(meals: MealGroup[]): MealRow[] {
  const kcalByType = new Map<MealType, number>();
  for (const meal of meals) {
    kcalByType.set(meal.type, (kcalByType.get(meal.type) ?? 0) + meal.kcal);
  }

  const types = kcalByType.has("snack") ? [...HOME_MEAL_TYPES, "snack" as const] : HOME_MEAL_TYPES;
  return types.map((type) => ({
    type,
    label: MEAL_TYPE_LABELS[type],
    kcal: kcalByType.has(type) ? Math.round(kcalByType.get(type) ?? 0) : null,
  }));
}
