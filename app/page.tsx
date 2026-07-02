import Link from "next/link";
import Image from "next/image";
import {
  CalendarRange,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  ListChecks,
  Play,
  Plus,
  TrendingUp,
  UtensilsCrossed,
  Zap,
} from "lucide-react";

import { BodyMuscleFigure } from "@/app/components/shared/BodyMuscleFigure";
import { MobileHeaderBadgeSync } from "@/app/components/shared/MobileHeader";
import { NutritionCalendarCard } from "@/app/components/shared/NutritionCalendarCard";
import { TrainingCalendarCard } from "@/app/components/shared/TrainingCalendarCard";
import { WeekStripCard } from "@/app/components/shared/WeekStripCard";
import { Button } from "@/app/components/ui/Button";
import {
  AnimatedMacroBar,
  fadeUp,
  listItemHover,
  MotionDiv,
  MotionSection,
  staggerContainer,
  tapFeedback,
} from "@/app/components/ui/motion";
import { AnimatedProgressRing } from "@/app/components/ui/ProgressRing";
import { requireUser } from "@/app/lib/auth";
import {
  getLoggedDatesForUser,
  getMealLogForDate,
  getLocalTrainingDate,
  type MealGroup,
} from "@/app/lib/meal-logs";
import { calculateNutritionPlan } from "@/app/lib/nutrition-calc";
import { MOCK_PROFILE_DEFAULTS } from "@/app/lib/nutrition-mock";
import { getNutritionProfile } from "@/app/lib/nutrition-profile";
import { MACRO_COLORS } from "@/app/lib/nutrition-style";
import { MEAL_TYPE_LABELS, type Macros } from "@/app/lib/nutrition-types";
import type { RoutineItem } from "@/app/lib/routines";
import {
  getSavedRoutineByIdForUser,
  listSavedRoutinesForUser,
} from "@/app/lib/saved-routines";
import {
  getCompletedTrainingDates,
  listMuscleStrengthSummariesForSavedRoutine,
  listWorkoutWeeklySummaries,
  type MuscleStrengthSummary,
} from "@/app/lib/workout-tracking";

const STRENGTH_LEGEND_GRADIENT =
  "linear-gradient(90deg,#22c55e 0%,#eab308 33%,#f97316 66%,#ef4444 100%)";

/** Días de entrenamiento consecutivos hasta hoy (o ayer si hoy aún no entrenó). */
function computeStreak(completedDates: Set<string>, today: string): number {
  if (completedDates.size === 0) return 0;
  const [y, m, d] = today.split("-").map(Number);
  const cur = new Date(y, m - 1, d);
  if (!completedDates.has(today)) cur.setDate(cur.getDate() - 1);
  let streak = 0;
  while (true) {
    const pad = (n: number) => String(n).padStart(2, "0");
    const s = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`;
    if (!completedDates.has(s)) break;
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

/** Parsea string de descanso a segundos. Soporta "90", "90s", "2 min", "2:30". */
function parseRestSeconds(rest: string): number {
  const s = rest.trim().toLowerCase();
  const colonMatch = s.match(/^(\d+):(\d{2})$/);
  if (colonMatch) return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2]);
  const minMatch = s.match(/(\d+\.?\d*)\s*(min|m\b)/);
  if (minMatch) return Math.round(parseFloat(minMatch[1]) * 60);
  const numMatch = s.match(/(\d+)/);
  if (numMatch) return parseInt(numMatch[1], 10);
  return 90;
}

/** Estima la duración del día en minutos basándose en series + descanso. */
function estimateDayMinutes(items: RoutineItem[]): number {
  if (items.length === 0) return 0;
  const totalSec = items.reduce((sum, item) => {
    const restSec = parseRestSeconds(item.rest);
    return sum + item.series * (30 + restSec);
  }, 0);
  const raw = Math.max(15, Math.round(totalSec / 60));
  return Math.round(raw / 5) * 5;
}

/** Grupos musculares únicos del día, ordenados por frecuencia (top 3). */
function dayMuscleGroups(items: RoutineItem[]): string[] {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const g = item.exercise.muscleGroup;
    if (!g) continue;
    counts[g] = (counts[g] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([g]) => g);
}

/** Cuenta cuántas fechas del set caen en la ventana de N días hasta hoy. */
function countDatesInWindow(dates: Set<string>, days: number): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let count = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (dates.has(key)) count++;
  }
  return count;
}

export default async function Home() {
  const auth = await requireUser();
  const logDate = getLocalTrainingDate();

  const [savedRoutines, mealLog, nutritionProfile, nutritionLoggedDates] = await Promise.all([
    listSavedRoutinesForUser(auth.user.id),
    getMealLogForDate({ userId: auth.user.id, logDate }),
    getNutritionProfile(auth.user.id),
    getLoggedDatesForUser({ userId: auth.user.id, days: 70 }),
  ]);

  const activeRoutineListItem =
    savedRoutines.find((routine) => routine.isActive) ?? savedRoutines[0] ?? null;

  const [activeRoutine, weeklySummaries, completedTrainingDates, muscleStrengthSummaries] =
    activeRoutineListItem
      ? await Promise.all([
          getSavedRoutineByIdForUser({
            savedRoutineId: activeRoutineListItem.id,
            userId: auth.user.id,
          }),
          listWorkoutWeeklySummaries({
            userId: auth.user.id,
            savedRoutineIds: [activeRoutineListItem.id],
            plannedDaysBySavedRoutineId: {
              [activeRoutineListItem.id]: activeRoutineListItem.dayCount,
            },
          }),
          getCompletedTrainingDates({
            userId: auth.user.id,
            savedRoutineId: activeRoutineListItem.id,
            days: 70,
          }),
          listMuscleStrengthSummariesForSavedRoutine({
            userId: auth.user.id,
            savedRoutineId: activeRoutineListItem.id,
          }),
        ])
      : [null, {}, new Set<string>(), []];

  const plan = nutritionProfile?.plan ?? calculateNutritionPlan(MOCK_PROFILE_DEFAULTS);

  const weeklySummary = activeRoutine ? weeklySummaries[activeRoutine.id] : null;
  const completedDayIds = new Set(weeklySummary?.completedRoutineDayIds ?? []);
  const nextPendingDay =
    activeRoutine?.days.find((day) => !completedDayIds.has(day.id)) ?? null;

  const primaryHref =
    activeRoutine && nextPendingDay
      ? `/rutinas/dia?savedRoutineId=${activeRoutine.id}&day=${nextPendingDay.dayOrder}`
      : "/rutinas";

  const meals = mealLog?.meals ?? [];
  const totalKcal = meals.reduce((sum, m) => sum + m.kcal, 0);
  const totalMacros: Macros = meals.reduce<Macros>(
    (acc, m) => ({
      proteinG: acc.proteinG + m.macros.proteinG,
      carbsG: acc.carbsG + m.macros.carbsG,
      fatG: acc.fatG + m.macros.fatG,
    }),
    { proteinG: 0, carbsG: 0, fatG: 0 },
  );
  const kcalPercent =
    plan.targetKcal > 0
      ? Math.min(100, Math.round((totalKcal / plan.targetKcal) * 100))
      : 0;
  const kcalRemaining = Math.max(0, plan.targetKcal - totalKcal);

  const muscleLoad = activeRoutine
    ? activeRoutine.days
        .flatMap((d) => d.items.map((i) => i.exercise.muscleGroup))
        .filter((g): g is string => Boolean(g))
        .reduce<Record<string, number>>((acc, g) => {
          acc[g] = (acc[g] ?? 0) + 1;
          return acc;
        }, {})
    : {};
  const muscleEntries = Object.entries(muscleLoad)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);
  const maxMuscleCount = muscleEntries[0]?.[1] ?? 1;

  const streak = computeStreak(completedTrainingDates, logDate);

  // ── Derived for hero ──
  const dayItems = nextPendingDay?.items ?? [];
  const estimatedMinutes = estimateDayMinutes(dayItems);
  const exerciseCount = dayItems.length;
  const muscleGroups = dayMuscleGroups(dayItems);
  const completedDaysCount = completedDayIds.size;
  const totalDaysCount = activeRoutine?.days.length ?? 0;

  // ── Derived for weekly counters ──
  const nutritionDatesSet = new Set(nutritionLoggedDates);
  const weeklyTrainingCount = countDatesInWindow(completedTrainingDates, 7);
  const weeklyNutritionCount = countDatesInWindow(nutritionDatesSet, 7);

  return (
    <section className="page-frame auto-rows-max content-start bg-[linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">
      <MobileHeaderBadgeSync
        badge={{
          label: streak > 0 ? `${streak} día${streak === 1 ? "" : "s"}` : "Sin racha",
          ariaLabel:
            streak > 0
              ? `Racha: ${streak} día${streak === 1 ? "" : "s"} consecutivos`
              : "Sin racha activa",
          tone: streak > 0 ? "warm" : "default",
        }}
      />

      <h1 className="sr-only">Panel principal</h1>

      {/* ── Hero ── */}
      <MotionDiv
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >

        <div className="relative min-h-[167px] overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--card)] sm:min-h-[196px]">
          {/* Fixed hero image */}
          <Image
            alt="Entrenamiento de hoy"
            className="object-cover grayscale-[0.9] brightness-90 contrast-105"
            fill
            priority
            sizes="100vw"
            src="/images/hero.png"
          />
          {/* Dark gradient from bottom — lighter at top so photo shows */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/92 via-black/40 to-transparent" />

          {/* "Hoy toca" badge — inside image, top-left */}
          <span className="absolute left-3 top-3 z-10 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--accent-bright)]">
            Hoy toca
          </span>

          <div className="relative z-10 flex h-full flex-col justify-end gap-3 p-3 pb-3 pt-8 sm:gap-5 sm:p-4 sm:pb-4 sm:pt-12">
            {/* Muscle groups title + subtitle */}
            <div className="flex flex-col gap-2.5">
              <h2 className="font-display text-xl font-bold leading-tight text-white">
                {muscleGroups.length > 0 ? (
                  muscleGroups.map((g, i) => (
                    <span key={g}>
                      {i > 0 && <span className="font-normal text-[var(--accent-bright)]"> · </span>}
                      {g}
                    </span>
                  ))
                ) : activeRoutine && nextPendingDay ? (
                  nextPendingDay.dayName
                ) : activeRoutine ? (
                  <span className="text-[var(--accent-bright)]">¡Semana completada!</span>
                ) : (
                  <span className="text-[var(--foreground-subtle)]">Sin rutina activa</span>
                )}
              </h2>
              {nextPendingDay && (
                <p className="text-xs font-medium text-[var(--foreground-muted)]">
                  <span className="text-[var(--accent-bright)]">Día {nextPendingDay.dayOrder}</span>
                  {" de tu rutina semanal"}
                </p>
              )}
            </div>

            {/* Stats row — icono izquierda, valor+desc apilados a la derecha */}
            {nextPendingDay && (
              <div className="flex items-center gap-5">
                {estimatedMinutes > 0 && (
                  <HeroStat icon={Clock} value={`~${estimatedMinutes} min`} label="duración aprox." />
                )}
                {exerciseCount > 0 && (
                  <HeroStat icon={Dumbbell} value={`${exerciseCount}`} label="ejercicios" />
                )}
                <HeroStat
                  icon={ListChecks}
                  value={`${completedDaysCount}/${totalDaysCount}`}
                  label="completados"
                />
              </div>
            )}

            {/* CTAs */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                asChild
                size="sm"
                className="justify-center gap-1.5 px-4 normal-case tracking-normal shadow-[0_6px_20px_rgba(16,185,129,0.32)]"
              >
                <Link href={primaryHref}>
                  {nextPendingDay && <Play className="size-3 fill-current" />}
                  {nextPendingDay
                    ? "Comenzar entrenamiento"
                    : activeRoutine
                      ? "Ver progreso"
                      : "Explorar rutinas"}
                </Link>
              </Button>

              {activeRoutine && (
                <Link
                  href="/rutinas"
                  className="pressable inline-flex h-11 items-center rounded-lg border border-white/20 bg-white/[0.07] px-3 text-xs font-semibold text-white/80 backdrop-blur-sm hover:bg-white/[0.12] hover:text-white"
                >
                  Ver rutina
                </Link>
              )}
            </div>
          </div>
        </div>
      </MotionDiv>

      {/* ── 3-card summary row ── */}
      <MotionSection
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="hidden grid-cols-3 gap-3 sm:grid"
      >
        <MotionDiv variants={fadeUp} whileHover={listItemHover} whileTap={tapFeedback}>
          <SummaryStatCard
            icon={Dumbbell}
            accent="#10b981"
            value={nextPendingDay ? `0/${exerciseCount}` : completedDaysCount > 0 ? "✓" : "—"}
            unit={nextPendingDay ? "ejercicios" : undefined}
            label="Entrenamiento"
            progress={{
              pct: totalDaysCount > 0 ? Math.round((completedDaysCount / totalDaysCount) * 100) : 0,
              text: nextPendingDay ? "Pendiente" : completedDaysCount > 0 ? "Completado" : "Sin rutina",
            }}
            href={primaryHref}
          />
        </MotionDiv>
        <MotionDiv variants={fadeUp} whileHover={listItemHover} whileTap={tapFeedback}>
          <SummaryStatCard
            icon={Flame}
            accent="#f59e0b"
            value={String(totalKcal)}
            unit="kcal"
            label="Nutrición"
            progress={{
              pct: kcalPercent,
              text: `Objetivo: ${plan.targetKcal} kcal`,
            }}
            href="/nutricion/registro"
          />
        </MotionDiv>
        <MotionDiv variants={fadeUp} whileHover={listItemHover} whileTap={tapFeedback}>
          <SummaryStatCard
            icon={TrendingUp}
            accent="#a3e635"
            value={String(streak)}
            unit={streak === 1 ? "día" : "días"}
            label="Constancia"
            progress={{
              pct: Math.min(100, streak * 14),
              text: streak > 0 ? `¡${streak} días seguidos!` : "Iniciá tu racha hoy",
            }}
          />
        </MotionDiv>
      </MotionSection>

      {/* ── Nutrición + Carga muscular (2-col) + Comidas (full-width) ── */}
      <MotionSection
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="flex flex-col gap-3"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MotionDiv variants={fadeUp} className="h-full">
            <NutricionTodayCard
              totalKcal={totalKcal}
              targetKcal={plan.targetKcal}
              kcalPercent={kcalPercent}
              kcalRemaining={kcalRemaining}
              totalMacros={totalMacros}
              targetMacros={plan.macros}
            />
          </MotionDiv>
          <MotionDiv variants={fadeUp} className="h-full">
            <CargaMuscularCard
              muscleLoad={muscleLoad}
              maxCount={maxMuscleCount}
              strengthSummaries={muscleStrengthSummaries}
              href={primaryHref}
            />
          </MotionDiv>
        </div>

        <MotionDiv variants={fadeUp}>
          <ComidasHoyCard meals={meals} totalKcal={totalKcal} />
        </MotionDiv>
      </MotionSection>

      {/* ── Calendarios semanales — full-width apilado en mobile, 2-col en sm+ ── */}
      <MotionSection
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <MotionDiv variants={fadeUp} className="h-full">
          <WeekStripCard
            icon={CalendarRange}
            label="Constancia semanal"
            subtitle="Entrenamientos esta semana"
            count={weeklyTrainingCount}
          >
            <TrainingCalendarCard completedDates={completedTrainingDates} variant="weekly" bare />
          </WeekStripCard>
        </MotionDiv>

        <MotionDiv variants={fadeUp} className="h-full">
          <WeekStripCard
            icon={UtensilsCrossed}
            label="Registro nutricional"
            subtitle="Días con comidas registradas"
            count={weeklyNutritionCount}
          >
            <NutritionCalendarCard loggedDates={nutritionDatesSet} variant="weekly" bare />
          </WeekStripCard>
        </MotionDiv>
      </MotionSection>
    </section>
  );
}

// ──────────────────────────────────────────
// Sub-components (server-rendered)
// ──────────────────────────────────────────

function CardLabel({
  icon: Icon,
  label,
  small = false,
  as: Tag = "h3",
}: {
  icon: typeof Flame;
  label: string;
  small?: boolean;
  as?: "h2" | "h3" | "div";
}) {
  return (
    <Tag className="flex items-center gap-1.5">
      <Icon aria-hidden="true" className={small ? "size-3 text-[var(--accent-bright)]" : "size-3.5 text-[var(--accent-bright)]"} />
      <span className={`truncate font-bold uppercase tracking-[0.04em] text-[var(--foreground-muted)] ${small ? "text-[11px]" : "text-[11px]"}`}>
        {label}
      </span>
    </Tag>
  );
}

/** Icon + value/label apilados para la fila de stats del hero. */
function HeroStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Clock;
  value: string;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3.5 shrink-0 text-[var(--accent-bright)]" />
      <div className="flex flex-col leading-none">
        <span className="text-sm font-semibold text-white">{value}</span>
        {label && <span className="mt-0.5 text-xs text-white/70">{label}</span>}
      </div>
    </div>
  );
}

/** Una de las 3 cards resumen debajo del hero. */
function SummaryStatCard({
  icon: Icon,
  accent,
  value,
  unit,
  label,
  progress,
  href,
}: {
  icon: typeof Flame;
  accent: string;
  value: string;
  unit?: string;
  label: string;
  progress?: { pct: number; text: string };
  href?: string;
}) {
  const inner = (
    <div className="flex h-full flex-col gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--border-strong)]">
      {/* Top: icono + label lado a lado */}
      <div className="flex items-center gap-2">
        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${accent}1f` }}
        >
          <Icon className="size-3.5" style={{ color: accent }} />
        </div>
        <span className="truncate text-xs font-bold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">
          {label}
        </span>
      </div>
      {/* Counter: valor + unidad chiquita */}
      <div className="flex items-baseline gap-1 min-w-0">
        <span className="truncate font-display text-xl font-bold leading-none tabular-nums text-[var(--foreground)]">
          {value}
        </span>
        {unit && (
          <span className="shrink-0 text-xs text-[var(--foreground-muted)]">{unit}</span>
        )}
      </div>
      {/* Barra de progreso + texto */}
      {progress && (
        <div className="mt-auto flex flex-col gap-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--card-alt)]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(0, progress.pct))}%`, background: accent }}
            />
          </div>
          <span className="truncate text-xs text-[var(--foreground-muted)]">{progress.text}</span>
        </div>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

/** Compact vertical nutrition card for half-column layout. */
function NutricionTodayCard({
  totalKcal,
  targetKcal,
  kcalPercent,
  kcalRemaining,
  totalMacros,
  targetMacros,
}: {
  totalKcal: number;
  targetKcal: number;
  kcalPercent: number;
  kcalRemaining: number;
  totalMacros: Macros;
  targetMacros: Macros;
}) {
  const isEmpty = totalKcal === 0;
  const macros = [
    {
      label: "Prot.",
      value: totalMacros.proteinG,
      target: targetMacros.proteinG,
      color: MACRO_COLORS.protein,
    },
    {
      label: "Carb.",
      value: totalMacros.carbsG,
      target: targetMacros.carbsG,
      color: MACRO_COLORS.carbs,
    },
    {
      label: "Gras.",
      value: totalMacros.fatG,
      target: targetMacros.fatG,
      color: MACRO_COLORS.fat,
    },
  ];

  return (
    <div className="flex h-full flex-col gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--card)] p-4">
      {/* Header */}
      <CardLabel icon={Flame} label="Nutrición" />

      {/* Mobile: ring izq + macros der (usa el ancho). lg: apilado vertical */}
      <div className="flex flex-1 flex-row items-center gap-4 lg:flex-col lg:items-center">
        {/* Ring */}
        <div className="shrink-0">
          <AnimatedProgressRing
            value={kcalPercent}
            size={104}
            strokeWidth={8}
            progressColor="var(--accent)"
          >
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-display text-2xl font-bold leading-none tabular-nums text-[var(--foreground)]">
                {totalKcal}
              </span>
              <span className="text-center text-[10px] font-medium leading-tight text-[var(--foreground-muted)]">
                de {targetKcal} kcal
              </span>
            </div>
          </AnimatedProgressRing>
        </div>

        {/* Macro bars — ancho completo */}
        <div className="flex w-full flex-col gap-2.5">
          {macros.map(({ label, value, target, color }) => {
            const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
            return (
              <div key={label} className="grid gap-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold" style={{ color }}>
                    {label}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-[var(--foreground-muted)]">
                    {Math.round(value)}g
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--card-alt)]">
                  <AnimatedMacroBar pct={pct} color={color} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/nutricion/registro"
        className="pressable mt-auto flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--card-alt)] text-xs font-semibold text-[var(--accent-bright)] hover:bg-[var(--card-hover)] hover:text-white"
      >
        <Plus className="size-3" />
        Agregar comida
      </Link>
    </div>
  );
}

function CargaMuscularCard({
  muscleLoad,
  maxCount,
  strengthSummaries,
  href,
}: {
  muscleLoad: Record<string, number>;
  maxCount: number;
  strengthSummaries: MuscleStrengthSummary[];
  href: string;
}) {
  const isEmpty = Object.keys(muscleLoad).length === 0;
  const hasStrengthData = strengthSummaries.some((s) => s.bestWeight != null);
  const muscleColors = Object.fromEntries(
    strengthSummaries.map((s) => [s.muscleGroup, s.color]),
  );

    return (
      <div className="flex h-full flex-col gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--card)] p-4">
        <CardLabel icon={Zap} label="Carga muscular" />

        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4">
            <Zap className="size-7 text-[var(--foreground-subtle)]" />
          <p className="text-center text-sm font-semibold text-[var(--foreground-muted)]">Sin rutina activa</p>
          <p className="text-center text-xs leading-relaxed text-[var(--foreground-subtle)]">
            Activá una rutina para ver tu carga muscular
          </p>
        </div>
      ) : (
          <div className="flex flex-1 flex-col justify-center">
            <div className="flex justify-center overflow-hidden" style={{ height: 120 }}>
              <div className="flex origin-top scale-[0.72] justify-center">
                <BodyMuscleFigure
                  muscleLoad={hasStrengthData ? {} : muscleLoad}
                  maxCount={maxCount}
                  muscleColors={muscleColors}
                />
              </div>
            </div>
            <div className="mt-4 grid w-full gap-1.5">
                <div className="h-1.5 rounded-full" style={{ background: STRENGTH_LEGEND_GRADIENT }} />
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--foreground-muted)]">
                  <span>Base</span>
                  <span>Intensidad</span>
                  <span>Elite</span>
              </div>
            </div>
          </div>
        )}

      {/* Botón "Ver detalle muscular" → rutina */}
      <Link
        href={href}
        className="pressable mt-auto flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--card-alt)] text-xs font-semibold text-[var(--accent-bright)] hover:bg-[var(--card-hover)] hover:text-white"
      >
        Ver detalle muscular
      </Link>
    </div>
  );
}

function ComidasHoyCard({
  meals,
  totalKcal,
}: {
  meals: MealGroup[];
  totalKcal: number;
}) {
  const preview = meals.slice(0, 2);

  return (
    <div className="flex flex-col rounded-[14px] border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <UtensilsCrossed className="size-4 shrink-0 text-[var(--accent-bright)]" />
          <div className="min-w-0">
          <h2 className="font-display text-sm font-semibold text-white">Comidas de hoy</h2>
          {meals.length > 0 && (
          <p className="mt-0.5 truncate text-xs text-[var(--foreground-muted)]">
            {meals.length > 0
              ? `${meals.length} comida${meals.length === 1 ? "" : "s"} · ${totalKcal} kcal`
              : "Nada registrado aún"}
          </p>
          )}
          </div>
        </div>
        <Link
          href="/nutricion/registro"
          aria-label="Ver registro de nutrición"
          className="group pressable grid size-11 shrink-0 place-items-center text-[var(--foreground-muted)] hover:text-white"
        >
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {preview.length === 0 ? (
        /* Empty state: columna centrada, mensaje + CTA */
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="grid size-11 place-items-center rounded-xl border border-[var(--border)] bg-[var(--card-alt)]">
            <UtensilsCrossed className="size-5 text-[var(--foreground-subtle)]" strokeWidth={1.8} />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Todavía no registraste comidas
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">
              Llevá el control de lo que comés hoy
            </p>
          </div>
          <Link
            href="/nutricion/registro"
            className="pressable inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent-foreground)] hover:bg-[var(--accent-strong)]"
          >
            <Plus className="size-3.5" />
            Agregar comida
          </Link>
        </div>
      ) : (
        <div className="grid overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-alt)]">
          {preview.map((meal) => (
            <div
              key={meal.id}
              className="flex min-w-0 items-center gap-2.5 border-b border-[var(--border)] p-2.5 last:border-b-0"
            >
              <span className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-alt)]">
                <Image
                  alt={MEAL_TYPE_LABELS[meal.type]}
                  className="object-cover"
                  fill
                  sizes="48px"
                  src={meal.imageUrl}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent-bright)]">
                  {MEAL_TYPE_LABELS[meal.type]}
                </p>
                <p className="mt-0.5 truncate font-display text-xs font-semibold leading-tight text-white">
                  {meal.name}
                </p>
                <p className="mt-0.5 line-clamp-1 text-xs leading-4 text-[var(--foreground-muted)]">
                  {formatMealFoods(meal)}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs font-semibold">
                  <MealMacro label="P" value={meal.macros.proteinG} color={MACRO_COLORS.protein} />
                  <MealMacro label="C" value={meal.macros.carbsG} color={MACRO_COLORS.carbs} />
                  <MealMacro label="G" value={meal.macros.fatG} color={MACRO_COLORS.fat} />
                </div>
              </div>
              <span className="self-start whitespace-nowrap rounded-full bg-[rgba(255,255,255,0.05)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {meal.kcal} kcal
              </span>
            </div>
          ))}
          {meals.length > 2 && (
            <p className="px-2.5 py-2 text-xs font-semibold text-[var(--foreground-muted)]">
              +{meals.length - 2} más
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function formatMealFoods(meal: MealGroup) {
  if (meal.items.length === 0) return "Sin alimentos";
  const names = meal.items.slice(0, 3).map((item) => item.foodName);
  const suffix = meal.items.length > 3 ? ` +${meal.items.length - 3}` : "";
  return `${names.join(", ")}${suffix}`;
}

function MealMacro({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <span style={{ color }}>
      {label} {Math.round(value)}g
    </span>
  );
}
