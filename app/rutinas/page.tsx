import Link from "next/link";
import { notFound } from "next/navigation";
import { Dumbbell } from "lucide-react";

import { MobileHeaderBadgeSync } from "@/app/components/shared/MobileHeader";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { requireUser } from "@/app/lib/auth";
import { ROUTINE_OBJECTIVE_LABELS, ROUTINE_DIFFICULTY_LABELS } from "@/app/lib/routine-metadata";
import {
  findActiveSavedRoutine,
  getSavedRoutineByIdForUser,
  listSavedRoutinesForUser,
} from "@/app/lib/saved-routines";
import { estimateDayMinutes } from "@/app/lib/workout-progression";
import { getTrainingOverview } from "@/app/lib/workout-tracking";
import { MyRoutinesList, MyRoutinesSheet, type MyRoutineRow } from "@/app/rutinas/MyRoutinesList";
import { RutinasOverview } from "@/app/rutinas/RutinasOverview";
import { WeekDaysList } from "@/app/rutinas/WeekDaysList";

export default async function RutinasPage() {
  const auth = await requireUser();
  const routines = await listSavedRoutinesForUser(auth.user.id);
  const activeRoutineListItem = findActiveSavedRoutine(routines);
  const myRoutineRows: MyRoutineRow[] = routines.map((routine) => ({
    id: routine.id,
    displayName: routine.displayName,
    meta: `${routine.dayCount} ${routine.dayCount === 1 ? "día" : "días"} · ${ROUTINE_OBJECTIVE_LABELS[routine.objective]}`,
    isActive: routine.isActive,
  }));

  if (!activeRoutineListItem && routines.length > 0) {
    return (
      <section className="page-frame dashboard-page-frame bg-[var(--background)]">
        <header className="grid gap-1">
          <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-[var(--foreground)]">
            Elegí tu rutina activa
          </h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            Activá una de tus rutinas guardadas para ver tu semana y empezar a entrenar.
          </p>
        </header>

        <MyRoutinesList routines={myRoutineRows} />

        <Button asChild variant="outline" className="h-12 w-full sm:w-fit">
          <Link href="/catalogo">Explorar catálogo</Link>
        </Button>
      </section>
    );
  }

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
                Aun no hay una rutina guardada en tu cuenta
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                Cuando elijas una rutina desde el catalogo, esta pantalla mostrara tu semana y los dias disponibles.
              </p>
              <Button asChild className="mt-5">
                <Link href="/catalogo">Ir al catalogo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  const [activeRoutine, overview] = await Promise.all([
    getSavedRoutineByIdForUser({
      savedRoutineId: activeRoutineListItem.id,
      userId: auth.user.id,
    }),
    getTrainingOverview({
      userId: auth.user.id,
      savedRoutineId: activeRoutineListItem.id,
      plannedDays: activeRoutineListItem.dayCount,
    }),
  ]);

  if (!activeRoutine) {
    notFound();
  }

  const totalDays = activeRoutine.days.length;
  const completedDayIds = new Set(overview.completedRoutineDayIds);
  const completedDayCount = activeRoutine.days.filter((day) => completedDayIds.has(day.id)).length;
  const weeklyProgressPercent =
    totalDays > 0 ? Math.min(100, Math.round((completedDayCount / totalDays) * 100)) : 0;
  const nextPendingDay = activeRoutine.days.find((day) => !completedDayIds.has(day.id)) ?? null;
  const remaining = totalDays - completedDayCount;
  const currentStreak = overview.weeklyStreak;
  const hasRealData = overview.hasHistory;

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
          hasRealData
            ? {
                label: String(currentStreak),
                ariaLabel: `${currentStreak} ${currentStreak === 1 ? "semana seguida" : "semanas seguidas"} cumpliendo tu rutina`,
                tone: "warm",
              }
            : null
        }
      />

      <RutinasOverview
        savedRoutineId={activeRoutine.id}
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
        nextPendingDayMinutes={nextPendingDay ? estimateDayMinutes(nextPendingDay.items) : null}
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
            estimatedMinutes: estimateDayMinutes(day.items),
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

      <MyRoutinesSheet routines={myRoutineRows} />
    </section>
  );
}


