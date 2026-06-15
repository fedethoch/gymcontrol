import Link from "next/link";
import {
  CalendarDays,
  Dumbbell,
  Flame,
  Repeat2,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { fadeUp, MotionDiv, MotionSection, staggerContainer } from "@/app/components/ui/motion";
import { AnimatedProgressRing } from "@/app/components/ui/ProgressRing";
import { TrainingCalendarCard } from "@/app/components/shared/TrainingCalendarCard";
import { WeeklyAttendanceCard } from "@/app/components/shared/WeeklyAttendanceCard";
import { requireUser } from "@/app/lib/auth";
import { ROUTINE_DIFFICULTY_LABELS } from "@/app/lib/routine-metadata";
import {
  getSavedRoutineByIdForUser,
  listSavedRoutinesForUser,
} from "@/app/lib/saved-routines";
import {
  getCompletedTrainingDates,
  listWorkoutWeeklySummaries,
} from "@/app/lib/workout-tracking";

export default async function Home() {
  const auth = await requireUser();
  const savedRoutines = await listSavedRoutinesForUser(auth.user.id);
  const activeRoutineListItem =
    savedRoutines.find((routine) => routine.isActive) ?? savedRoutines[0] ?? null;

  const [activeRoutine, weeklySummaries] = activeRoutineListItem
    ? await Promise.all([
        getSavedRoutineByIdForUser({
          savedRoutineId: activeRoutineListItem.id,
          userId: auth.user.id,
        }),
        listWorkoutWeeklySummaries({
          userId: auth.user.id,
          savedRoutineIds: [activeRoutineListItem.id],
          plannedDaysBySavedRoutineId: { [activeRoutineListItem.id]: activeRoutineListItem.dayCount },
        }),
      ])
    : [null, {}];

  const totalDays = activeRoutine?.days.length ?? 0;
  const weeklySummary = activeRoutine ? weeklySummaries[activeRoutine.id] : null;
  const completedDayIds = new Set(weeklySummary?.completedRoutineDayIds ?? []);
  const completedDayCount = weeklySummary?.completedDayCount ?? 0;
  const currentStreak = weeklySummary?.currentStreak ?? 0;
  const weeklyProgressPercent =
    totalDays > 0 ? Math.min(100, Math.round((completedDayCount / totalDays) * 100)) : 0;
  const nextPendingDay =
    activeRoutine?.days.find((day) => !completedDayIds.has(day.id)) ?? null;
  const primaryHref =
    activeRoutine && nextPendingDay
      ? `/dashboard/rutinas/dia?savedRoutineId=${activeRoutine.id}&day=${nextPendingDay.dayOrder}`
      : activeRoutine
        ? "/dashboard/rutinas"
        : "/dashboard";
  const primaryCtaLabel = activeRoutine
    ? nextPendingDay
      ? "Ver entrenamiento"
      : "Ver semana activa"
    : "Ir a Mis rutinas";
  const activeRoutineStatus = "Activa";
  const firstRoutineDay = activeRoutine?.days[0] ?? null;
  const lastRoutineDay =
    activeRoutine && activeRoutine.days.length > 0
      ? activeRoutine.days[activeRoutine.days.length - 1]
      : null;
  const activeDifficultyLabel = activeRoutineListItem
    ? ROUTINE_DIFFICULTY_LABELS[activeRoutineListItem.difficulty]
    : null;
  const completedTrainingDates = activeRoutine
    ? await getCompletedTrainingDates({
        userId: auth.user.id,
        savedRoutineId: activeRoutine.id,
        days: 70,
      })
    : new Set<string>();
  const completedThisWeek = weeklySummary?.completedTrainingDatesCount ?? 0;

  return (
    <section className="page-frame auto-rows-max content-start bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.12),transparent_32%),linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">
      <header>
        <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
          Inicio
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--foreground-muted)] sm:text-base">
          Continua tu semana desde el proximo entrenamiento pendiente.
        </p>
      </header>

      <Card className="relative h-fit self-start overflow-hidden border-[#27304a] bg-[#080b14] shadow-[0_22px_70px_rgba(0,0,0,0.34)]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,10,18,0.99)_0%,rgba(8,10,18,0.96)_38%,rgba(8,10,18,0.76)_63%,rgba(8,10,18,0.9)_100%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-[58%] overflow-hidden lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,10,18,0.32)_0%,rgba(30,16,56,0.42)_46%,rgba(6,8,14,0.86)_100%),linear-gradient(165deg,#151126_0%,#111827_46%,#05070b_100%)]" />
          <div className="absolute left-10 top-0 h-full w-1 bg-[#7d45ff]/55 blur-[1px]" />
          <div className="absolute right-16 top-0 h-full w-1 bg-white/10" />
          <div className="absolute right-40 top-10 h-24 w-40 rounded-t-[2rem] border-t-[10px] border-[#070913] opacity-80" />
          <div className="absolute bottom-[3.1rem] right-32 h-4 w-72 rounded-full bg-[#141824] shadow-[0_0_0_18px_rgba(3,5,10,0.72),0_26px_36px_rgba(0,0,0,0.65)]" />
          <div className="absolute bottom-[2.8rem] right-[19rem] size-20 rounded-full border-[16px] border-[#080a10] bg-[#151827] shadow-[0_0_32px_rgba(126,62,255,0.26)]" />
          <div className="absolute bottom-[2.8rem] right-24 size-20 rounded-full border-[16px] border-[#080a10] bg-[#151827] shadow-[0_0_32px_rgba(126,62,255,0.2)]" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.055)_0_1px,transparent_1px_10px)] opacity-35" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#080b14_0%,rgba(8,11,20,0.1)_34%,rgba(8,11,20,0.34)_100%)]" />
        </div>

        <CardContent className="relative flex flex-col p-4 sm:px-6 sm:py-5">
          <div className="max-w-[50rem]">
            <Badge variant="accent" className="gap-2 bg-[#1a1230]/90">
              <span className="size-1.5 rounded-full bg-[#8b5cff]" />
              Semana activa
            </Badge>

            <div className="mt-3">
              <p className="text-sm font-medium text-white">Hoy toca:</p>
              <h2 className="font-display mt-1.5 text-2xl font-semibold leading-[1.05] text-white sm:text-3xl lg:text-4xl">
                {activeRoutine && nextPendingDay ? (
                  <>
                    <span className="text-[#8b4dff]">Dia {nextPendingDay.dayOrder}</span>
                    <span className="text-[#d8dbe7]"> - </span>
                    {nextPendingDay.dayName}
                  </>
                ) : activeRoutine ? (
                  "Semana completa"
                ) : (
                  "Sin rutina activa"
                )}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#c5cad8] sm:text-base sm:leading-7">
                {activeRoutine
                  ? "Enfocate en tu fuerza y progresion. Cada repeticion te acerca a tu mejor version."
                  : "Elegi o activa una rutina desde Mis rutinas para ver tu proximo entrenamiento aca."}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
            <Button
              asChild
              size="lg"
              className="min-w-0 px-6 shadow-[0_16px_34px_rgba(124,58,237,0.34)]"
            >
              <Link href={primaryHref}>
                <Dumbbell className="size-4" />
                {primaryCtaLabel}
              </Link>
            </Button>

            {activeRoutine ? (
              <>
                <Button asChild variant="outline" size="lg" className="px-5">
                  <Link href="/dashboard">
                    <Repeat2 className="size-4" />
                    Cambiar rutina activa
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="px-5">
                  <Link href="/dashboard/rutinas">
                    <CalendarDays className="size-4" />
                    Ver semana completa
                  </Link>
                </Button>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <MotionSection
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="grid auto-rows-max gap-4 lg:grid-cols-3"
      >
        <MotionDiv variants={fadeUp} className="h-full lg:order-1">
          <WeeklyProgressCard
            completedDayCount={completedDayCount}
            firstDayLabel={firstRoutineDay ? `Dia ${firstRoutineDay.dayOrder}` : "Dia 1"}
            lastDayLabel={lastRoutineDay ? `Dia ${lastRoutineDay.dayOrder}` : "Dia 1"}
            progressPercent={weeklyProgressPercent}
            totalDays={totalDays}
          />
        </MotionDiv>

        <div className="grid grid-cols-2 gap-4 lg:order-2 lg:col-span-2 lg:grid-cols-2">
          <MotionDiv variants={fadeUp} className="h-full">
            <WeeklyStreakCard currentStreak={currentStreak} />
          </MotionDiv>

          <MotionDiv variants={fadeUp} className="h-full">
            <ActiveRoutineCard
              difficultyLabel={activeDifficultyLabel}
              displayName={activeRoutine?.displayName ?? "Sin rutina activa"}
              status={activeRoutineListItem ? activeRoutineStatus : "Pendiente"}
            />
          </MotionDiv>
        </div>
      </MotionSection>

      <MotionSection
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="grid auto-rows-max gap-4 lg:grid-cols-2"
      >
        <MotionDiv variants={fadeUp} className="h-full">
          <TrainingCalendarCard completedDates={completedTrainingDates} />
        </MotionDiv>

        <MotionDiv variants={fadeUp} className="h-full">
          <WeeklyAttendanceCard completedThisWeek={completedThisWeek} plannedDays={totalDays} />
        </MotionDiv>
      </MotionSection>
    </section>
  );
}

function WeeklyProgressCard({
  completedDayCount,
  firstDayLabel,
  lastDayLabel,
  progressPercent,
  totalDays,
}: {
  completedDayCount: number;
  firstDayLabel: string;
  lastDayLabel: string;
  progressPercent: number;
  totalDays: number;
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden border-[#27304a] bg-[linear-gradient(145deg,rgba(14,19,32,0.96)_0%,rgba(8,12,22,0.98)_100%)] shadow-[0_18px_48px_rgba(73,34,146,0.16)] transition-[color,background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[#6d40ef]">
      <CardContent className="flex-1 p-4 sm:p-6">
        <MetricTitle icon={TrendingUp} title="Progreso semanal" />

        <div className="mt-4 grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center sm:gap-6">
          <AnimatedProgressRing value={progressPercent} progressColor="#7c3aed" size={88}>
            <div className="grid size-[4.4rem] place-items-center rounded-full bg-[#0a0f19] text-xl font-semibold text-white shadow-[inset_0_0_28px_rgba(0,0,0,0.36)] sm:size-28 sm:text-3xl">
              {progressPercent}%
            </div>
          </AnimatedProgressRing>

          <div className="min-w-0">
            <p className="font-display text-2xl font-semibold leading-none text-white sm:text-4xl">
              {progressPercent}%
            </p>
            <p className="mt-2 text-sm leading-6 text-[#c6cede] sm:mt-3 sm:text-base">
              {completedDayCount} de {totalDays} dias
            </p>

            <div className="mt-3 sm:mt-6">
              <div className="relative h-2 rounded-full bg-[#252c43]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#7c3aed,#9d6cff)]"
                  style={{ width: `${progressPercent}%` }}
                />
                <span className="absolute left-0 top-1/2 size-4 -translate-y-1/2 rounded-full border-4 border-[#49317e] bg-[#15101f]" />
                <span className="absolute right-0 top-1/2 size-4 -translate-y-1/2 rounded-full border-4 border-[#49317e] bg-[#15101f]" />
              </div>
              <div className="mt-3 flex justify-between text-sm text-[#9da8bf]">
                <span>{firstDayLabel}</span>
                <span>{lastDayLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyStreakCard({ currentStreak }: { currentStreak: number }) {
  return (
    <Card className="relative flex h-full flex-col overflow-hidden border-[#27304a] bg-[linear-gradient(145deg,rgba(13,19,34,0.96)_0%,rgba(8,12,20,0.98)_100%)] shadow-[0_18px_48px_rgba(0,0,0,0.24)] transition-[color,background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[#6d40ef]">
      <CardContent className="relative flex-1 p-4 sm:p-6">
        <MetricTitle icon={Flame} title="Racha semanal" />

        <div className="mt-4 max-w-[13rem] sm:mt-12">
          <p className="font-display text-3xl font-semibold leading-none text-white sm:text-7xl">
            {currentStreak}
            <span className="ml-2 align-baseline text-base font-semibold text-[#9b4dff] sm:text-2xl">
              dias
            </span>
          </p>
          <p className="mt-3 text-sm leading-6 text-[#c6cede] sm:mt-5 sm:text-base sm:leading-7">
            Segun entrenamientos completados esta semana
          </p>
        </div>

        <span
          aria-hidden="true"
          className="absolute bottom-2 right-2 grid size-16 place-items-center rounded-full border border-[#303a55] bg-[radial-gradient(circle,rgba(124,58,237,0.18),rgba(8,12,20,0.08)_62%,transparent_100%)] text-[#8c7af6] shadow-[0_0_42px_rgba(124,58,237,0.18)] sm:bottom-14 sm:right-8 sm:size-32"
        >
          <Flame className="size-8 sm:size-14" />
        </span>
      </CardContent>
    </Card>
  );
}

function ActiveRoutineCard({
  difficultyLabel,
  displayName,
  status,
}: {
  difficultyLabel: string | null;
  displayName: string;
  status: string;
}) {
  return (
    <Card className="relative flex h-full flex-col overflow-hidden border-[#27304a] bg-[linear-gradient(145deg,rgba(13,19,34,0.96)_0%,rgba(8,12,20,0.98)_100%)] shadow-[0_18px_48px_rgba(0,0,0,0.24)] transition-[color,background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[#6d40ef]">
      <CardContent className="relative flex-1 p-4 sm:p-6">
        <MetricTitle icon={CalendarDays} title="Rutina activa" />

        <div className="mt-4 max-w-[16rem] sm:mt-16">
          <p className="font-display line-clamp-2 break-words text-lg font-semibold leading-tight text-white sm:text-4xl">
            {displayName}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
            {difficultyLabel ? (
              <Badge variant="accent" className="normal-case tracking-normal">
                {difficultyLabel} - {status}
              </Badge>
            ) : (
              <Badge variant="neutral" className="normal-case tracking-normal">
                {status}
              </Badge>
            )}
          </div>
        </div>

        <span
          aria-hidden="true"
          className="absolute bottom-2 right-2 grid size-16 place-items-center rounded-full border border-[#303a55] bg-[radial-gradient(circle,rgba(124,58,237,0.18),rgba(8,12,20,0.08)_62%,transparent_100%)] text-[#b995ff] shadow-[0_0_42px_rgba(124,58,237,0.18)] sm:bottom-14 sm:right-10 sm:size-32"
        >
          <CalendarDays className="size-8 sm:size-14" />
        </span>
      </CardContent>
    </Card>
  );
}

function MetricTitle({
  icon: Icon,
  title,
}: {
  icon: typeof CalendarDays;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#34245b] bg-[#251640] text-[#b987ff] sm:size-12"
      >
        <Icon className="size-4 sm:size-6" />
      </span>
      <h2 className="font-display text-base font-semibold leading-tight text-white sm:text-xl">
        {title}
      </h2>
    </div>
  );
}
