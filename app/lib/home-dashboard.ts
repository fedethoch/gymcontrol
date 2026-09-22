import type { MealGroup } from "@/app/lib/meal-logs";
import { buildDayMealRows } from "@/app/lib/meal-order";
import { MEAL_TYPE_LABELS, type MealType } from "@/app/lib/nutrition-types";
import type { RoutineItem } from "@/app/lib/routines";
import { planWeek, resolveSchedule, scheduleNeedsChoice, summarizeWeek } from "@/app/lib/training-schedule";
import { isValidSet } from "@/app/lib/workout-progression";
import type { OpenWorkoutSession } from "@/app/lib/workout-tracking";

export type HeroState =
  | "ready"
  | "in_progress"
  | "done_today"
  | "week_done"
  | "no_routine"
  | "needs_schedule"
  | "rest";

const MUSCLE_GROUP_LABELS: Record<string, string> = { Biceps: "Bíceps", Triceps: "Tríceps" };

/** `muscle_group` de la base ("Biceps") → texto de UI ("Bíceps"). */
export function formatMuscleGroup(group: string) {
  return MUSCLE_GROUP_LABELS[group] ?? group;
}

/** Nombre corto de un día para el selector de días: "Pecho & Tríceps"; sin grupos, `fallback`. */
export function formatDayGroups(groups: readonly string[], fallback: string) {
  const labels = groups.slice(0, 2).map(formatMuscleGroup);
  return labels.length > 0 ? labels.join(" & ") : fallback;
}

/**
 * Estado del hero del home mobile (DESIGN.md §10.2). El orden importa: un entreno de hoy (en curso o hecho)
 * gana siempre, así "Entrenar igual" nunca vuelve a "Hoy toca descanso".
 */
export function resolveHeroState(args: {
  hasActiveRoutine: boolean;
  hasPendingDay: boolean;
  trainedToday: boolean;
  hasOpenSession: boolean;
  /** La rutina pide elegir días y no tiene un calendario válido. */
  needsSchedule: boolean;
  /** Hay calendario y hoy no toca ningún día pendiente. */
  restDay: boolean;
}): HeroState {
  if (!args.hasActiveRoutine) return "no_routine";
  if (args.hasOpenSession) return "in_progress";
  if (!args.hasPendingDay) return "week_done";
  if (args.trainedToday) return "done_today";
  if (args.needsSchedule) return "needs_schedule";
  if (args.restDay) return "rest";
  return "ready";
}

/**
 * Qué toca hoy con la rutina activa (DESIGN.md §10.2): el estado del hero y los días que lo explican.
 * La usan el home y el aviso "Hoy toca entrenar" (§6.4), que sale solo con `ready` y un día planificado hoy.
 */
export function resolveTodayTraining<D extends { id: string; dayOrder: number }>(args: {
  routine: { trainingWeekdays: readonly number[] | null; days: readonly D[] } | null;
  completedRoutineDayIds: readonly string[];
  trainedToday: boolean;
  /** Día de la rutina con un entreno sin terminar de hoy. */
  openRoutineDayId: string | null;
  todayKey: string;
}) {
  const { routine } = args;
  const completedDayIds = new Set(args.completedRoutineDayIds);
  const nextPendingDay = routine?.days.find((day) => !completedDayIds.has(day.id)) ?? null;
  // Un entreno en curso manda sobre el próximo día pendiente.
  const openDay = args.openRoutineDayId
    ? (routine?.days.find((day) => day.id === args.openRoutineDayId) ?? null)
    : null;
  // Con días elegidos, hoy toca el día fijo de hoy (o ninguno).
  const dayCount = routine?.days.length ?? 0;
  const trainingWeekdays = routine ? resolveSchedule(routine.trainingWeekdays, dayCount) : null;
  const needsSchedule = Boolean(routine) && !trainingWeekdays && scheduleNeedsChoice(dayCount);
  const weekPlan =
    routine && trainingWeekdays
      ? planWeek({
          weekdays: trainingWeekdays,
          days: routine.days,
          completedDayIds: args.completedRoutineDayIds,
          todayKey: args.todayKey,
        })
      : null;
  const todayPlanned = weekPlan ? summarizeWeek(weekPlan).today : null;
  const todayPlannedDay = todayPlanned ? (routine?.days.find((day) => day.id === todayPlanned.id) ?? null) : null;

  return {
    heroState: resolveHeroState({
      hasActiveRoutine: Boolean(routine),
      hasPendingDay: Boolean(nextPendingDay),
      trainedToday: args.trainedToday,
      hasOpenSession: Boolean(openDay),
      needsSchedule,
      restDay: weekPlan !== null && todayPlanned === null,
    }),
    needsSchedule,
    weekPlan,
    nextPendingDay,
    openDay,
    todayPlannedDay,
    heroDay: openDay ?? todayPlannedDay ?? nextPendingDay,
  };
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
