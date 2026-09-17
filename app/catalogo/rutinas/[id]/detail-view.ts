import type { RoutineDetailView } from "@/app/components/rutina-detalle/RoutineDetailMobile";
import { equipmentLabel } from "@/app/lib/exercise-form";
import { formatMuscleGroup } from "@/app/lib/home-dashboard";
import { displayRoutineName } from "@/app/lib/routine-catalog";
import {
  averageMinutes,
  balanceFills,
  countSeries,
  equipmentList,
  formatReps,
  formatRest,
  titleWithoutDays,
  weeklySeriesByGroup,
} from "@/app/lib/routine-detail";
import { ROUTINE_DIFFICULTY_LABELS, ROUTINE_OBJECTIVE_LABELS } from "@/app/lib/routine-metadata";
import { dayMuscleGroups } from "@/app/lib/routine-week";
import type { RoutineTemplate } from "@/app/lib/routines";
import { estimateDayMinutes } from "@/app/lib/workout-progression";

/** `?dias=N` para volver al catálogo en la cantidad de días de la rutina (DESIGN.md §19). */
export function catalogDaysHref(dayCount: number) {
  return dayCount > 0 ? `/catalogo?dias=${dayCount}` : "/catalogo";
}

/** Datos del árbol mobile del detalle (DESIGN.md §19), ya formateados para la UI. */
export function buildRoutineDetailView(routine: RoutineTemplate): RoutineDetailView {
  const fullName = displayRoutineName(routine.name);
  const dayCount = routine.days.length;
  const minutesByDay = routine.days.map((day) => estimateDayMinutes(day.items));
  const volume = weeklySeriesByGroup(routine.days);

  return {
    title: titleWithoutDays(fullName, dayCount),
    fullName,
    description: routine.description,
    imageUrl: routine.imageUrl,
    difficultyLabel: ROUTINE_DIFFICULTY_LABELS[routine.difficulty],
    objectiveLabel: ROUTINE_OBJECTIVE_LABELS[routine.objective],
    dayCount,
    averageMinutes: averageMinutes(minutesByDay),
    seriesCount: countSeries(routine.days),
    backHref: catalogDaysHref(dayCount),
    volume: volume.map(({ group, series }) => ({ group, series, label: formatMuscleGroup(group) })),
    fills: balanceFills(volume),
    equipment: equipmentList(routine.days).map((equipment) => equipmentLabel(equipment) ?? equipment),
    days: routine.days.map((day, index) => {
      const groups = dayMuscleGroups(day.items).map(formatMuscleGroup);
      return {
        id: day.id,
        dayOrder: day.dayOrder,
        dayName: day.dayName,
        groups: groups.slice(0, 2),
        mainGroup: groups[0] ?? null,
        minutes: minutesByDay[index],
        seriesCount: day.items.reduce((sum, item) => sum + item.series, 0),
        exercises: day.items.map((item) => ({
          id: item.id,
          name: item.exercise.name,
          imageUrl: item.exercise.imageUrl,
          series: item.series,
          meta: `${formatReps(item.repetitions)} reps · RIR ${item.rir} · ${formatRest(item.rest)}`,
          detail: {
            ...item.exercise,
            series: item.series,
            repsTarget: item.repetitions,
            rir: item.rir,
            rest: item.rest,
          },
        })),
      };
    }),
  };
}
