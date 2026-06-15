import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  Dumbbell,
  Flame,
} from "lucide-react";

import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { AnimatedProgressRing } from "@/app/components/ui/ProgressRing";
import { requireUser } from "@/app/lib/auth";
import { listSavedRoutinesForUser, getSavedRoutineByIdForUser } from "@/app/lib/saved-routines";
import { cn } from "@/app/lib/utils";
import { listWorkoutWeeklySummaries } from "@/app/lib/workout-tracking";
import { WeekDaysList } from "@/app/dashboard/rutinas/WeekDaysList";

export default async function DashboardRoutinesPage() {
  const auth = await requireUser();
  const routines = await listSavedRoutinesForUser(auth.user.id);
  const activeRoutineListItem = routines.find((routine) => routine.isActive) ?? null;

  if (!activeRoutineListItem) {
    return (
      <section className="page-frame dashboard-page-frame bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.12),transparent_32%),linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">
        <header className="flex flex-col gap-2">
          <div>
            <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Sin rutina activa
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)] sm:text-base">
              Activa una rutina para ver tu semana y navegar sus entrenamientos.
            </p>
          </div>
        </header>

        <Card className="overflow-hidden border-[#27304a] bg-[linear-gradient(145deg,#0b101a_0%,#080c15_100%)]">
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
                <Link href={routines.length > 0 ? "/dashboard" : "/catalogo"}>
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
  const totalExercises = activeRoutine.days.reduce((total, day) => total + day.items.length, 0);
  const averageExercises =
    totalDays > 0 ? Math.round((totalExercises / totalDays) * 10) / 10 : 0;
  const averageExercisesLabel = Number.isInteger(averageExercises)
    ? averageExercises.toFixed(0)
    : averageExercises.toFixed(1);
  const weeklySummary = weeklySummaries[activeRoutine.id];
  const completedDayCount = weeklySummary?.completedDayCount ?? 0;
  const weeklyProgressLabel = `${completedDayCount} / ${totalDays}`;
  const weeklyProgressPercent =
    totalDays > 0 ? Math.min(100, Math.round((completedDayCount / totalDays) * 100)) : 0;
  const completedDayIds = new Set(weeklySummary?.completedRoutineDayIds ?? []);
  const nextPendingDay = activeRoutine.days.find((day) => !completedDayIds.has(day.id)) ?? null;

  return (
    <section className="page-frame dashboard-page-frame bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.12),transparent_32%),linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">
      <div className="grid gap-1.5">
        <header className="flex flex-col gap-2">
          <div>
            <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Semana activa
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)] sm:text-base">
              Seguimiento de tu rutina activa
            </p>
          </div>
        </header>

        <Card className="flex overflow-hidden rounded-[1.4rem] border-[#263044] bg-[linear-gradient(145deg,rgba(13,19,34,0.9),rgba(7,11,19,0.96))] shadow-[0_18px_55px_rgba(0,0,0,0.28)] lg:items-center">
          <CardContent className="flex w-full !py-3 px-4 sm:!py-4 sm:px-5">
            <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] sm:items-center sm:gap-5">
              <div className="flex flex-col justify-center gap-2 sm:gap-3 sm:border-r sm:border-[#1d2434] sm:pr-5">
                <div className="grid gap-1">
                  <p className="text-xs font-medium text-[#b7bfce] sm:text-sm">Rutina activa</p>
                  <h2 className="font-display text-lg font-semibold leading-tight text-white sm:text-[1.6rem] lg:text-3xl">
                    {activeRoutine.displayName}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#d2d8e4]">
                  <SummaryPill icon={CalendarDays}>{totalDays} dias por semana</SummaryPill>
                  <span className="hidden h-5 w-px bg-[#293247] sm:block" />
                  <SummaryPill icon={Dumbbell}>
                    {averageExercisesLabel} ejercicios por dia
                  </SummaryPill>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-2 sm:gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c25cff]">
                  Resumen semanal
                </p>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-[1.35fr_repeat(3,minmax(0,1fr))] xl:items-center">
                  <div className="col-span-2 flex items-center gap-3 sm:gap-4 xl:col-span-1">
                    <AnimatedProgressRing
                      value={weeklyProgressPercent}
                      size={56}
                      strokeWidth={6}
                      progressColor="#7c3aed"
                    >
                      <div className="grid size-11 place-items-center rounded-full bg-[#0a0f19] text-xs font-semibold text-[#cbb6ff] sm:size-[3.25rem] sm:text-sm">
                        {weeklyProgressPercent}%
                      </div>
                    </AnimatedProgressRing>
                    <div>
                      <p className="text-xs text-[#b7bfce] sm:text-sm">Progreso semanal</p>
                      <p className="font-display mt-0.5 text-base font-semibold text-white sm:mt-1 sm:text-xl">
                        {weeklyProgressLabel.replace("/", "de")} dias
                      </p>
                    </div>
                  </div>

                  <MetricItem
                    icon={Check}
                    label="Dias completados"
                    value={
                      weeklySummary?.hasRealData ? String(weeklySummary.completedDayCount) : "0"
                    }
                    accent="success"
                  />
                  <MetricItem
                    icon={Clock3}
                    label="Tiempo estimado"
                    value={totalDays > 0 ? "60 min" : "Sin dias"}
                  />
                  <MetricItem
                    icon={Flame}
                    label="Racha actual"
                    value={
                      weeklySummary?.hasRealData
                        ? `${weeklySummary.currentStreak} dias`
                        : "0 dias"
                    }
                    accent="warm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-1.5">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">
            Tu semana
          </h2>
        </div>

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
          />
        ) : (
          <Card className="border-dashed border-[#27304a] bg-[linear-gradient(145deg,#0b101a_0%,#080c15_100%)]">
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
    </section>
  );
}

function SummaryPill({
  icon: Icon,
  children,
}: {
  icon: typeof CalendarDays;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-[#d2d8e4]">
      <Icon className="size-4 text-[#b9c9ef]" />
      {children}
    </span>
  );
}

function MetricItem({
  icon: Icon,
  label,
  value,
  accent = "default",
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  accent?: "default" | "success" | "warm";
}) {
  const toneClass =
    accent === "success"
      ? "border-[#214433] bg-[#102117] text-[#87efac]"
      : accent === "warm"
        ? "border-[#5a3022] bg-[#21140f] text-[#ff9a75]"
        : "border-[#253047] bg-[#0c111d] text-[#9db5ff]";

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-full border-4 sm:size-11", toneClass)}>
        <Icon className="size-4 sm:size-5" />
      </span>
      <div>
        <p className="text-xs text-[#b7bfce] sm:text-sm">{label}</p>
        <p className="font-display mt-0.5 text-base font-semibold text-white sm:mt-1 sm:text-lg">
          {value}
        </p>
      </div>
    </div>
  );
}

