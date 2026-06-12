import { notFound } from "next/navigation";

import { DayWorkoutClient } from "@/app/dashboard/rutinas/dia/DayWorkoutClient";
import { requireUser } from "@/app/lib/auth";
import { ROUTINE_DIFFICULTY_LABELS } from "@/app/lib/routine-metadata";
import { getSavedRoutineByIdForUser } from "@/app/lib/saved-routines";
import { getWorkoutSessionForToday } from "@/app/lib/workout-tracking";

type DayPageProps = {
  searchParams: Promise<{
    savedRoutineId?: string;
    day?: string;
  }>;
};

export default async function DayRoutinePage({ searchParams }: DayPageProps) {
  const [params, auth] = await Promise.all([searchParams, requireUser()]);
  const savedRoutineId = params.savedRoutineId?.trim();
  const dayOrder = Number.parseInt(params.day ?? "", 10);

  if (!savedRoutineId || Number.isNaN(dayOrder)) {
    notFound();
  }

  const routine = await getSavedRoutineByIdForUser({ savedRoutineId, userId: auth.user.id });

  if (!routine) {
    notFound();
  }

  const selectedDay = routine.days.find((day) => day.dayOrder === dayOrder);

  if (!selectedDay) {
    notFound();
  }

  const session = await getWorkoutSessionForToday({
    savedRoutineId,
    routineDayId: selectedDay.id,
    userId: auth.user.id,
  });

  return (
    <DayWorkoutClient
      savedRoutineId={routine.id}
      routineDayId={selectedDay.id}
      routineName={routine.displayName}
      difficultyLabel={ROUTINE_DIFFICULTY_LABELS[routine.difficulty]}
      dayOrder={selectedDay.dayOrder}
      dayName={selectedDay.dayName}
      rows={selectedDay.items.map((item, index) => ({
        id: item.id,
        number: index + 1,
        exercise: item.exercise,
        series: item.series,
        repsTarget: item.repetitions,
        rir: String(item.rir),
        rest: item.rest,
        performedReps: session?.itemsByRoutineItemId[item.id]?.performedReps ?? null,
        usedWeight: session?.itemsByRoutineItemId[item.id]?.usedWeight ?? null,
        isCompleted: session?.itemsByRoutineItemId[item.id]?.isCompleted ?? false,
      }))}
      sessionStatus={session?.status ?? null}
    />
  );
}
