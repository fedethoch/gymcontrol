import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import {
  CalendarDays,
  Clock3,
  Dumbbell,
  Flame,
} from "lucide-react";

import { MobileHeaderBadgeSync } from "@/app/components/shared/MobileHeader";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { requireUser } from "@/app/lib/auth";
import { ROUTINE_OBJECTIVE_LABELS, ROUTINE_DIFFICULTY_LABELS } from "@/app/lib/routine-metadata";
import { listSavedRoutinesForUser, getSavedRoutineByIdForUser } from "@/app/lib/saved-routines";
import { listWorkoutWeeklySummaries } from "@/app/lib/workout-tracking";
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

  const objectiveLabel = ROUTINE_OBJECTIVE_LABELS[activeRoutineListItem.objective];
  const difficultyLabel = ROUTINE_DIFFICULTY_LABELS[activeRoutineListItem.difficulty];
  const nextTrainingLabel = (() => {
    if (!totalDays) return "—";
    if (completedDayCount >= totalDays) return "Semana completa";
    const dayOfWeek = (new Date().getDay() + 6) % 7; // Mon=0, Sun=6
    if (dayOfWeek < totalDays && completedDayCount <= dayOfWeek) return "Hoy";
    if (dayOfWeek + 1 < totalDays && completedDayCount <= dayOfWeek + 1) return "Mañana";
    const remaining = totalDays - completedDayCount;
    return remaining === 1 ? "En 1 día" : `En ${remaining} días`;
  })();

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

      {/* Row 1: Routine header card with placeholder bg */}
      <div className="relative overflow-hidden rounded-2xl bg-[#15102a] p-3.5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(124,58,237,0.2),transparent_65%)]" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b985ff]">Rutina activa</p>
          <h2 className="font-display mt-0.5 text-lg font-semibold leading-tight text-white sm:text-xl">
            {activeRoutine.displayName}
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[objectiveLabel, difficultyLabel, `${totalDays} días/sem`].map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center rounded-md border border-[rgba(139,92,246,0.35)] bg-[rgba(20,15,36,0.6)] px-2 py-0.5 text-[10px] font-semibold text-[#d4c6ff]"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Weekly summary */}
      <div className="flex items-center gap-4 rounded-2xl bg-[#0e131e] px-4 py-3">
        <div className="shrink-0 text-center">
          <div className="font-display text-2xl font-bold leading-none">
            <span className="text-white">{completedDayCount}</span>
            <span className="text-[#9a63ff]">/{totalDays}</span>
          </div>
          <p className="mt-0.5 text-[9px] text-[#7887a6]">días</p>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c25cff]">Resumen semanal</p>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#151c2d]">
            <div
              className="h-full rounded-full bg-[#7c3aed] transition-all duration-700"
              style={{ width: `${weeklyProgressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-[#7887a6]">{weeklyProgressPercent}% completado</p>
        </div>
      </div>

      {/* Row 3: 3 mini stat cards */}
      <div className="grid grid-cols-3 gap-2">
        <MiniCard
          icon={Flame}
          label="Racha"
          value={weeklySummary?.hasRealData ? `${weeklySummary.currentStreak} días` : "0 días"}
          accent="warm"
        />
        <MiniCard icon={Clock3} label="Tiempo" value={totalDays > 0 ? "60 min" : "—"} />
        <MiniCard icon={CalendarDays} label="Próximo" value={nextTrainingLabel} />
      </div>

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

function MiniCard({
  icon: Icon,
  label,
  value,
  accent = "default",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: "default" | "warm";
}) {
  const iconClass =
    accent === "warm"
      ? "text-[#ff9a75]"
      : "text-[#9db5ff]";

  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-[#0e131e] px-2 py-3 text-center">
      <Icon className={`size-4 shrink-0 ${iconClass}`} />
      <div>
        <p className="font-display text-sm font-semibold leading-tight text-white">{value}</p>
        <p className="mt-0.5 text-[10px] text-[#7887a6]">{label}</p>
      </div>
    </div>
  );
}

