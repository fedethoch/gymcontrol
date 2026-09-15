import { notFound } from "next/navigation";

import { DayWorkoutClient, type DayExercise } from "@/app/rutinas/dia/DayWorkoutClient";
import { requireUser } from "@/app/lib/auth";
import { getSavedRoutineByIdForUser } from "@/app/lib/saved-routines";
import {
  estimateDayMinutes,
  parsePlanTarget,
  resolveExerciseKind,
} from "@/app/lib/workout-progression";
import {
  getOpenSessionForDay,
  getTrainingOverview,
  listExerciseHistory,
} from "@/app/lib/workout-tracking";

type DayPageProps = {
  searchParams: Promise<{
    savedRoutineId?: string;
    day?: string;
  }>;
};

export default async function RutinaDiaPage({ searchParams }: DayPageProps) {
  const [params, auth] = await Promise.all([searchParams, requireUser()]);
  const savedRoutineId = params.savedRoutineId?.trim();
  const dayOrder = Number.parseInt(params.day ?? "", 10);

  if (!savedRoutineId || Number.isNaN(dayOrder)) {
    notFound();
  }

  const routine = await getSavedRoutineByIdForUser({ savedRoutineId, userId: auth.user.id });
  const selectedDay = routine?.days.find((day) => day.dayOrder === dayOrder);

  if (!routine || !selectedDay) {
    notFound();
  }

  const openSession = await getOpenSessionForDay({
    userId: auth.user.id,
    savedRoutineId,
    routineDayId: selectedDay.id,
  });

  const [historyByExerciseId, overview] = await Promise.all([
    listExerciseHistory({
      userId: auth.user.id,
      exerciseIds: selectedDay.items.map((item) => item.exerciseId),
      excludeSessionId: openSession?.id ?? null,
    }),
    getTrainingOverview({
      userId: auth.user.id,
      savedRoutineId,
      plannedDays: routine.days.length,
    }),
  ]);

  const exercises: DayExercise[] = selectedDay.items.map((item, index) => {
    const saved = openSession?.itemsByRoutineItemId[item.id] ?? null;

    return {
      routineItemId: item.id,
      number: index + 1,
      exercise: {
        ...item.exercise,
        series: item.series,
        repsTarget: item.repetitions,
        rir: item.rir,
        rest: item.rest,
      },
      equipment: item.exercise.equipment,
      series: item.series,
      target: item.repetitions,
      rir: item.rir,
      rest: item.rest,
      kind: saved?.kind ?? resolveExerciseKind(parsePlanTarget(item.repetitions), item.exercise.equipment),
      saved: saved ? { id: saved.id, sets: saved.sets, rev: saved.rev } : null,
      history: historyByExerciseId[item.exerciseId] ?? [],
    };
  });

  return (
    <DayWorkoutClient
      userId={auth.user.id}
      savedRoutineId={routine.id}
      routineDayId={selectedDay.id}
      routineName={routine.displayName}
      dayOrder={selectedDay.dayOrder}
      dayName={selectedDay.dayName}
      openSessionId={openSession?.id ?? null}
      completedThisWeek={overview.completedRoutineDayIds.includes(selectedDay.id)}
      estimatedMinutes={estimateDayMinutes(selectedDay.items)}
      exercises={exercises}
    />
  );
}
