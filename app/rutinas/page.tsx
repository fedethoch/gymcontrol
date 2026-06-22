import Link from "next/link";
import { notFound } from "next/navigation";
import { Dumbbell } from "lucide-react";

import { MobileHeaderBadgeSync } from "@/app/components/shared/MobileHeader";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { requireUser } from "@/app/lib/auth";
import { ROUTINE_OBJECTIVE_LABELS, ROUTINE_DIFFICULTY_LABELS } from "@/app/lib/routine-metadata";
import { listSavedRoutinesForUser, getSavedRoutineByIdForUser } from "@/app/lib/saved-routines";
import { listWorkoutWeeklySummaries } from "@/app/lib/workout-tracking";
import { RutinasOverview } from "@/app/rutinas/RutinasOverview";
import { WeekDaysList } from "@/app/rutinas/WeekDaysList";

export default async function RutinasPage() {
  const auth = await requireUser();
  const routines = await listSavedRoutinesForUser(auth.user.id);
  const activeRoutineListItem = routines.find((routine) => routine.isActive) ?? null;

  if (!activeRoutineListItem) {
    return (
      <section className="page-frame dashboard-page-frame bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.12),transparent_32%),linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b985ff]">Rutinas</p>
        </header>

        <Card className="overflow-hidden bg-[#0e131e]">
          <CardContent className="grid min-h-80 place-items-center p-8 text-center">
            <div className="max-w-md">
              <span className="mx-auto grid size-16 place-items-center rounded-full border border-[#5b2ab3] bg-[#241341] text-[#b995ff] shadow-[0_0_0_8px_rgba(91,42,179,0.08)]">
                <Dumbbell className="size-8" />
              </span>
              <p className="font-display mt-5 text-2xl font-semibold text-white">
                {routines.length > 0
                  ? "No tienes una rutina activa"
                  : "Aun no hay una rutina guardada en tu cuenta"}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                {routines.length > 0
                  ? "Marca una de tus rutinas guardadas como activa para ver su progreso semanal."
                  : "Cuando guardes una rutina desde el catalogo, esta pantalla mostrara tu progreso semanal y los dias disponibles."}
              </p>
              <Button asChild className="mt-5">
                <Link href={routines.length > 0 ? "/" : "/catalogo"}>
                  {routines.length > 0 ? "Ir a mis rutinas" : "Ir al catalogo"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  const [activeRoutine, weeklySummaries] = await Promise.all([
    getSavedRoutineByIdForUser({
      savedRoutineId: activeRoutineListItem.id,
      userId: auth.user.id,
    }),
    listWorkoutWeeklySummaries({
      userId: auth.user.id,
      savedRoutineIds: routines.map((routine) => routine.id),
      plannedDaysBySavedRoutineId: Object.fromEntries(
        routines.map((routine) => [routine.id, routine.dayCount]),
      ),
    }),
  ]);

  if (!activeRoutine) {
    notFound();
  }

  const totalDays = activeRoutine.days.length;
  const weeklySummary = weeklySummaries[activeRoutine.id];
  const completedDayCount = weeklySummary?.completedDayCount ?? 0;
  const weeklyProgressPercent =
    totalDays > 0 ? Math.min(100, Math.round((completedDayCount / totalDays) * 100)) : 0;
  const completedDayIds = new Set(weeklySummary?.completedRoutineDayIds ?? []);
  const nextPendingDay = activeRoutine.days.find((day) => !completedDayIds.has(day.id)) ?? null;
  const remaining = totalDays - completedDayCount;
  const currentStreak = weeklySummary?.currentStreak ?? 0;
  const hasRealData = weeklySummary?.hasRealData ?? false;

  const objectiveLabel = ROUTINE_OBJECTIVE_LABELS[activeRoutineListItem.objective];
  const difficultyLabel = ROUTINE_DIFFICULTY_LABELS[activeRoutineListItem.difficulty];

  const startHref =
    nextPendingDay != null
      ? `/rutinas/dia?savedRoutineId=${activeRoutine.id}&day=${nextPendingDay.dayOrder}`
      : null;

  return (
    <section className="page-frame dashboard-page-frame bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.12),transparent_32%),linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">
      <MobileHeaderBadgeSync
        badge={
          weeklySummary?.hasRealData
            ? {
                label: String(weeklySummary.currentStreak),
                ariaLabel: `${weeklySummary.currentStreak} días de racha de entrenamiento`,
                tone: "warm",
              }
            : null
        }
      />

      <RutinasOverview
        displayName={activeRoutine.displayName}
        imageUrl={activeRoutine.imageUrl}
        objectiveLabel={objectiveLabel}
        difficultyLabel={difficultyLabel}
        totalDays={totalDays}
        completedDayCount={completedDayCount}
        weeklyProgressPercent={weeklyProgressPercent}
        currentStreak={currentStreak}
        hasRealData={hasRealData}
        nextPendingDayOrder={nextPendingDay?.dayOrder ?? null}
        nextPendingDayName={nextPendingDay?.dayName ?? null}
        startHref={startHref}
        remaining={remaining}
      />

      {/* Row 4: Days list */}
      {activeRoutine.days.length > 0 ? (
        <WeekDaysList
          days={activeRoutine.days.map((day) => ({
            id: day.id,
            dayOrder: day.dayOrder,
            dayName: day.dayName,
            itemsCount: day.items.length,
          }))}
          completedDayIds={Array.from(completedDayIds)}
          currentDayId={nextPendingDay?.id ?? activeRoutine.days[0]?.id ?? null}
          activeRoutineId={activeRoutine.id}
          animationDelay={0.32}
        />
      ) : (
        <Card className="bg-[#0e131e]">
          <CardContent className="p-8 text-center">
            <p className="font-display text-xl font-semibold text-white">
              Esta rutina todavia no tiene dias cargados
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              El resumen semanal queda disponible, pero la semana se mostrara cuando existan dias
              configurados en la plantilla.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}


