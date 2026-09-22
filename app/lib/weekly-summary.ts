// Resumen semanal de los avisos (DESIGN.md §6.4): los últimos 7 días hasta hoy, así sirve con cualquier día elegido.
// Sin servidor: se testea con `node --test`.
import { addDaysToDateKey } from "@/app/lib/local-date";
import { resolveBudget } from "@/app/lib/meal-diary";
import type { WeeklySummary } from "@/app/lib/notifications";

export const WEEKLY_WINDOW_DAYS = 7;

const NO_MACROS = { proteinG: 0, carbsG: 0, fatG: 0 };

export function buildWeeklySummary(input: {
  todayKey: string;
  /** `null`: sin rutina activa. `plannedPerWeek` null: la rutina no tiene días fijos. */
  training: { trainedDates: readonly string[]; plannedPerWeek: number | null } | null;
  /** `null`: sin perfil de nutrición. `targetKcal` null en un día: se usa el objetivo actual. */
  nutrition: {
    loggedDates: readonly string[];
    days: ReadonlyArray<{ logDate: string; totalKcal: number; targetKcal: number | null }>;
    currentTargetKcal: number;
  } | null;
}): WeeklySummary {
  const from = addDaysToDateKey(input.todayKey, -(WEEKLY_WINDOW_DAYS - 1));
  const inWindow = (dateKey: string) => dateKey >= from && dateKey <= input.todayKey;

  const training = input.training
    ? { done: new Set(input.training.trainedDates.filter(inWindow)).size, planned: input.training.plannedPerWeek }
    : null;

  if (!input.nutrition) {
    return { training, nutrition: null };
  }

  const logged = new Set(input.nutrition.loggedDates.filter(inWindow));
  const currentTarget = input.nutrition.currentTargetKcal;
  // "En objetivo" es la misma regla que el registro (resolveBudget): hasta 5% por debajo, nunca por encima.
  const onTargetDays = input.nutrition.days.filter(
    (day) =>
      logged.has(day.logDate) &&
      resolveBudget(
        { kcal: day.targetKcal ?? currentTarget, macros: NO_MACROS },
        { kcal: day.totalKcal, macros: NO_MACROS },
      ).state === "on_target",
  ).length;

  return { training, nutrition: { loggedDays: logged.size, onTargetDays } };
}
