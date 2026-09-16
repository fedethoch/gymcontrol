import Link from "next/link";
import { notFound } from "next/navigation";
import { Dumbbell } from "lucide-react";
import type { ReactNode } from "react";

import type { WeekDay } from "@/app/components/rutinas/DayPanel";
import { RoutineCover } from "@/app/components/rutinas/RoutineCover";
import { ChooseRoutineMobile, EmptyRoutineMobile } from "@/app/components/rutinas/RoutineEmptyStates";
import { RoutineSwitcher } from "@/app/components/rutinas/RoutineSwitcher";
import { RoutineWeekView } from "@/app/components/rutinas/RoutineWeekView";
import { MobileHeaderBadgeSync } from "@/app/components/shared/MobileHeader";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { requireUser } from "@/app/lib/auth";
import { formatMuscleGroup, getSessionProgress } from "@/app/lib/home-dashboard";
import { ROUTINE_OBJECTIVE_LABELS, ROUTINE_DIFFICULTY_LABELS } from "@/app/lib/routine-metadata";
import { buildDayTabs, dayMuscleGroups, initialDayIndex } from "@/app/lib/routine-week";
import {
  findActiveSavedRoutine,
  getSavedRoutineByIdForUser,
  listSavedRoutinesForUser,
} from "@/app/lib/saved-routines";
import { estimateDayMinutes, isValidSet } from "@/app/lib/workout-progression";
import { getLocalTrainingDate, getOpenSessionForRoutine, getTrainingOverview } from "@/app/lib/workout-tracking";
import { MyRoutinesList, MyRoutinesSheet, type MyRoutineRow } from "@/app/rutinas/MyRoutinesList";
import { RutinasOverview } from "@/app/rutinas/RutinasOverview";
import { WeekDaysList } from "@/app/rutinas/WeekDaysList";

/** "2026-09-14" → "Lunes 14" (la fecha es un día calendario: se formatea en UTC). */
function formatDayDate(dateKey: string, withDay = true) {
  const label = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    ...(withDay ? { day: "numeric" } : {}),
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T12:00:00Z`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Árbol mobile (<1024, DESIGN.md §12) y desktop (sin cambios) conviven: cada uno se oculta en el otro ancho. */
function Responsive({ mobile, desktop }: { mobile: ReactNode; desktop: ReactNode }) {
  return (
    <>
      <div className="h-full lg:hidden">
        <section className="page-frame rutinas-frame relative isolate auto-rows-max content-start bg-[var(--background)]">
          <div className="flex flex-col">
            <div aria-hidden="true" className="home-safe-top" />
            {mobile}
          </div>
        </section>
      </div>
      <div className="hidden lg:contents">{desktop}</div>
    </>
  );
}

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
      <Responsive
        mobile={<ChooseRoutineMobile routines={myRoutineRows} />}
        desktop={
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
        }
      />
    );
  }

  if (!activeRoutineListItem) {
    return (
      <Responsive
        mobile={<ChooseRoutineMobile routines={myRoutineRows} />}
        desktop={
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
        }
      />
    );
  }

  const [activeRoutine, overview, openSession] = await Promise.all([
    getSavedRoutineByIdForUser({
      savedRoutineId: activeRoutineListItem.id,
      userId: auth.user.id,
    }),
    getTrainingOverview({
      userId: auth.user.id,
      savedRoutineId: activeRoutineListItem.id,
      plannedDays: activeRoutineListItem.dayCount,
    }),
    getOpenSessionForRoutine({ userId: auth.user.id, savedRoutineId: activeRoutineListItem.id }),
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

  // ── Mobile (DESIGN.md §12) ──
  const todayKey = getLocalTrainingDate();
  const openDay = openSession
    ? (activeRoutine.days.find((day) => day.id === openSession.routineDayId) ?? null)
    : null;
  const tabs = buildDayTabs({
    days: activeRoutine.days.map((day) => {
      const mainGroup = dayMuscleGroups(day.items)[0];
      return { id: day.id, dayOrder: day.dayOrder, mainGroup: mainGroup ? formatMuscleGroup(mainGroup) : null };
    }),
    completedDayIds: overview.completedRoutineDayIds,
    completedDayDates: overview.completedDayDates,
    openDayId: openDay?.id ?? null,
    trainedToday: overview.trainedToday,
    todayKey,
  });
  const weekDays: WeekDay[] = activeRoutine.days.map((day, index) => {
    const groups = dayMuscleGroups(day.items);
    const session = openSession && openDay?.id === day.id ? openSession : null;
    const isItemDone = (itemId: string, series: number) =>
      session !== null && (session.itemsByRoutineItemId[itemId]?.sets ?? []).filter(isValidSet).length >= series;
    const tab = tabs[index];

    return {
      id: day.id,
      dayOrder: day.dayOrder,
      href: `/rutinas/dia?savedRoutineId=${activeRoutine.id}&day=${day.dayOrder}`,
      titleGroups: groups.slice(0, 2).map(formatMuscleGroup),
      dayName: day.dayName,
      fills: Object.fromEntries(
        groups.map((group, groupIndex) => [group, groupIndex < 2 ? "var(--foreground)" : "var(--foreground-muted)"]),
      ),
      minutes: estimateDayMinutes(day.items),
      seriesCount: day.items.reduce((sum, item) => sum + item.series, 0),
      exercises: day.items.map((item) => ({
        id: item.id,
        name: item.exercise.name,
        imageUrl: item.exercise.imageUrl,
        meta: `${item.series} × ${item.repetitions} · RIR ${item.rir} · ${item.rest}`,
        done: isItemDone(item.id, item.series),
        detail: {
          ...item.exercise,
          series: item.series,
          repsTarget: item.repetitions,
          rir: item.rir,
          rest: item.rest,
        },
      })),
      progress: session ? getSessionProgress(day.items, session) : null,
      tab,
      doneLabel: tab.doneDate ? formatDayDate(tab.doneDate) : null,
    };
  });

  const mobile = (
    <>
      <h1 className="sr-only">Semana activa</h1>
      <RoutineCover imageUrl={activeRoutine.imageUrl} />
      <RoutineSwitcher
        displayName={activeRoutine.displayName}
        caption={totalDays > 0 ? `Tu rutina · ${completedDayCount} de ${totalDays} esta semana` : "Tu rutina"}
        streak={currentStreak}
        routines={myRoutineRows}
      />
      {totalDays > 0 ? (
        <div className="mt-2 grid gap-0">
          <RoutineWeekView
            days={weekDays}
            initialIndex={initialDayIndex(tabs)}
            trainedToday={overview.trainedToday}
            todayDoneOrder={tabs.find((tab) => tab.doneDate === todayKey)?.dayOrder ?? null}
            weekdayLabel={formatDayDate(todayKey, false)}
            summary={{
              completed: completedDayCount,
              total: totalDays,
              streak: currentStreak,
              series: weekDays.reduce((sum, day) => sum + day.seriesCount, 0),
            }}
          />
        </div>
      ) : (
        <EmptyRoutineMobile />
      )}
    </>
  );

  return (
    <Responsive
      mobile={mobile}
      desktop={
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
      }
    />
  );
}
