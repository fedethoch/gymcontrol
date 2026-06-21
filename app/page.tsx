import Link from "next/link";
import Image from "next/image";
import {
  CalendarRange,
  ChevronRight,
  Flame,
  Plus,
  UtensilsCrossed,
  Zap,
} from "lucide-react";

import { BodyMuscleFigure } from "@/app/components/shared/BodyMuscleFigure";
import { MobileHeaderBadgeSync } from "@/app/components/shared/MobileHeader";
import { NutritionCalendarCard } from "@/app/components/shared/NutritionCalendarCard";
import { TrainingCalendarCard } from "@/app/components/shared/TrainingCalendarCard";
import { Button } from "@/app/components/ui/Button";
import {
  AnimatedMacroBar,
  GlowPulseWrapper,
  fadeUp,
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

const TODAY_CARD_FALLBACK_IMAGE = "/images/dashboard/hoy-toca-fallback.png";

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
  const todayCardImageUrl =
    activeRoutine?.imageUrl || activeRoutineListItem?.coverImageUrl || TODAY_CARD_FALLBACK_IMAGE;

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

  return (
    <section className="page-frame auto-rows-max content-start bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.12),transparent_32%),linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">
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

      {/* ── Hero ── */}
      <MotionDiv
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-1.5"
      >
        <p className="px-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#9b8aff]/80">
          Hoy toca
        </p>

        <div className="relative min-h-[144px] overflow-hidden rounded-2xl bg-[#11151f]">
          <Image
            alt={activeRoutine?.displayName ?? "Entrenamiento de hoy"}
            className="object-cover saturate-[0.85]"
            fill
            priority
            sizes="100vw"
            src={todayCardImageUrl}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_100%,rgba(124,58,237,0.25),transparent_50%)]" />

          <div className="relative z-10 flex h-full flex-col justify-end gap-2 p-3 pb-4 pt-20">
            <h2 className="font-display text-lg font-bold leading-tight text-white">
              {activeRoutine && nextPendingDay ? (
                <>
                  <span className="text-[#b995ff]">Día {nextPendingDay.dayOrder}</span>
                  <span className="text-[#d8dbe7]"> · </span>
                  {nextPendingDay.dayName}
                </>
              ) : activeRoutine ? (
                <><span className="text-[#b995ff]">¡Semana</span>{" completada!"}</>
              ) : (
                <span className="text-[#8a93ad]">Sin rutina activa</span>
              )}
            </h2>

            <div className="flex items-center gap-2">
              <MotionDiv whileTap={tapFeedback}>
                <Button
                  asChild
                  size="sm"
                  className="justify-center px-4 shadow-[0_6px_20px_rgba(124,58,237,0.38)]"
                >
                  <Link href={primaryHref}>
                    {nextPendingDay ? "Comenzar" : activeRoutine ? "Ver progreso" : "Explorar rutinas"}
                  </Link>
                </Button>
              </MotionDiv>

              {activeRoutine && (
                <Link
                  href="/rutinas"
                  className="inline-flex h-7 items-center rounded-lg border border-white/20 bg-white/[0.07] px-3 text-xs font-semibold text-[#c5cad8] backdrop-blur-sm transition-colors hover:bg-white/[0.12] hover:text-white"
                >
                  Ver rutina
                </Link>
              )}
            </div>
          </div>
        </div>
      </MotionDiv>

      {/* ── Card grid ──
          Mobile layout (2-col):
          Row 1: [Nutrición]   [Carga muscular]
          Row 2: [Comidas]     [Constancia]
          Row 3: [Nutrición cal — col-span-2]
      */}
      <MotionSection
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="grid grid-cols-2 gap-2 lg:grid-cols-3"
      >
        {/* Nutrición */}
        <MotionDiv variants={fadeUp} whileTap={tapFeedback} className="col-span-1 h-full">
          <NutricionCard
            totalKcal={totalKcal}
            targetKcal={plan.targetKcal}
            kcalPercent={kcalPercent}
            kcalRemaining={kcalRemaining}
            totalMacros={totalMacros}
            targetMacros={plan.macros}
          />
        </MotionDiv>

        {/* Carga muscular */}
        <MotionDiv variants={fadeUp} whileTap={tapFeedback} className="col-span-1 h-full">
          <CargaMuscularCard
            muscleLoad={muscleLoad}
            maxCount={maxMuscleCount}
            strengthSummaries={muscleStrengthSummaries}
          />
        </MotionDiv>

        {/* Comidas hoy — col-span-1 compacto */}
        <MotionDiv variants={fadeUp} whileTap={tapFeedback} className="col-span-1 h-full">
          <ComidasHoyCard meals={meals} totalKcal={totalKcal} />
        </MotionDiv>

        {/* Constancia */}
        <MotionDiv variants={fadeUp} whileTap={tapFeedback} className="col-span-1 h-full">
          <div className="flex h-full flex-col gap-1.5 rounded-2xl border border-white/[0.06] bg-[#0e131e] p-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
            <CardLabel icon={CalendarRange} label="Constancia" />
            <div className="flex flex-1 items-center justify-center">
              <TrainingCalendarCard completedDates={completedTrainingDates} weeks={5} bare />
            </div>
          </div>
        </MotionDiv>

        {/* Calendario nutrición — full ancho, compacto */}
        <MotionDiv variants={fadeUp} whileTap={tapFeedback} className="col-span-2 h-full lg:col-span-1">
          <div className="flex h-full flex-col gap-1.5 rounded-2xl border border-white/[0.06] bg-[#0e131e] p-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
            <CardLabel icon={UtensilsCrossed} label="Nutrición · historial" />
            <div className="flex flex-1 items-center justify-center">
              <NutritionCalendarCard loggedDates={new Set(nutritionLoggedDates)} weeks={5} bare />
            </div>
          </div>
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
}: {
  icon: typeof Flame;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3.5 text-[#9a63ff]" />
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7887a6]">
        {label}
      </span>
    </div>
  );
}

const STRENGTH_LEGEND_GRADIENT =
  "linear-gradient(90deg,#22c55e 0%,#eab308 33%,#f97316 66%,#ef4444 100%)";

function NutricionCard({
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
    { label: "Proteína", value: totalMacros.proteinG, target: targetMacros.proteinG, color: "#4ade80" },
    { label: "Carbohid.", value: totalMacros.carbsG, target: targetMacros.carbsG, color: "#fb923c" },
    { label: "Grasas", value: totalMacros.fatG, target: targetMacros.fatG, color: "#f472b6" },
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/[0.06] bg-[#0e131e] p-2.5 text-center shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
      <CardLabel icon={Flame} label="Nutrición" />

      <AnimatedProgressRing
        value={kcalPercent}
        size={96}
        strokeWidth={9}
        progressColor="var(--accent-bright)"
      >
        <div className="flex flex-col items-center">
          <span className="font-display text-base font-bold leading-none text-white">
            {totalKcal}
          </span>
          <span className="text-[8px] text-[#7887a6]">kcal</span>
        </div>
      </AnimatedProgressRing>

      {isEmpty ? (
        <p className="text-[9px] text-[#4a5368]">Registrá tu primera comida</p>
      ) : (
        <p className="text-[10px] font-semibold text-[#c5cad8]">
          <span className="text-white">{kcalRemaining}</span> restantes
        </p>
      )}

      <div className="flex w-full flex-col gap-1">
        {macros.map(({ label, value, target, color }) => {
          const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
          const remaining = Math.max(0, Math.round(target - value));
          return (
            <div key={label} className="grid gap-0.5">
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-[8px] font-bold" style={{ color }}>{label}</span>
                <span className="shrink-0 text-[8px] text-[#7887a6]">{Math.round(value)}/{remaining}g</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-[#1a2235]">
                <AnimatedMacroBar pct={pct} color={color} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CargaMuscularCard({
  muscleLoad,
  maxCount,
  strengthSummaries,
}: {
  muscleLoad: Record<string, number>;
  maxCount: number;
  strengthSummaries: MuscleStrengthSummary[];
}) {
  const isEmpty = Object.keys(muscleLoad).length === 0;
  const hasStrengthData = strengthSummaries.some((s) => s.bestWeight != null);
  const muscleColors = Object.fromEntries(
    strengthSummaries.map((s) => [s.muscleGroup, s.color]),
  );

  return (
    <div className="flex h-full flex-col gap-1.5 rounded-2xl border border-white/[0.06] bg-[#0e131e] p-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
      <CardLabel icon={Zap} label="Carga muscular" />

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-2">
          <Zap className="size-6 text-[#1e2840]" />
          <p className="text-center text-[10px] font-semibold text-[#6b7590]">Sin rutina activa</p>
          <p className="text-center text-[9px] leading-relaxed text-[#404e66]">
            Activá una rutina para
            <br />ver tu carga muscular
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-1.5">
          <GlowPulseWrapper active className="min-h-0 flex-1 overflow-hidden">
            <BodyMuscleFigure
              muscleLoad={hasStrengthData ? {} : muscleLoad}
              maxCount={maxCount}
              muscleColors={muscleColors}
            />
          </GlowPulseWrapper>
          <div className="grid gap-0.5">
            <div className="h-1 rounded-full" style={{ background: STRENGTH_LEGEND_GRADIENT }} />
            <div className="flex items-center justify-between text-[7px] font-semibold text-[#6e7788]">
              <span>Base</span>
              <span>Elite</span>
            </div>
          </div>
        </div>
      )}
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
  // Col-span-1: vista compacta, sin thumbnails, max 2 comidas
  const preview = meals.slice(0, 2);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/[0.06] bg-[#0e131e] p-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-1">
        <div className="min-w-0">
          <h2 className="font-display text-xs font-semibold text-white">Comidas</h2>
          <p className="truncate text-[9px] text-[#7887a6]">
            {meals.length > 0
              ? `${meals.length} · ${totalKcal} kcal`
              : "Nada aún"}
          </p>
        </div>
        <Link
          href="/nutricion/registro"
          aria-label="Ver registro"
          className="grid size-6 shrink-0 place-items-center text-[#8f98ad] transition-colors hover:text-white"
        >
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      {/* Empty state */}
      {preview.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-[#111722]">
            <UtensilsCrossed className="size-4 text-[#2e3b52]" />
          </div>
          <p className="text-center text-[9px] font-semibold leading-snug text-[#6b7590]">
            Sin comidas
            <br />registradas
          </p>
          <Link
            href="/nutricion/registro"
            className="inline-flex items-center gap-0.5 rounded-lg bg-[#1a2235] px-2 py-1 text-[9px] font-semibold text-[#b995ff] transition-colors hover:bg-[#1e2840]"
          >
            <Plus className="size-2.5" />
            Agregar
          </Link>
        </div>
      ) : (
        /* Compact meal rows sin thumbnail */
        <div className="grid overflow-hidden rounded-xl border border-white/[0.05] bg-[#111722]">
          {preview.map((meal) => (
            <div
              key={meal.id}
              className="flex min-w-0 items-center gap-2 border-b border-white/[0.05] px-2 py-2 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[8px] font-bold uppercase tracking-[0.1em] text-[#b985ff]">
                  {MEAL_TYPE_LABELS[meal.type]}
                </p>
                <p className="truncate font-display text-xs font-semibold text-white">
                  {meal.name}
                </p>
                <div className="mt-0.5 flex gap-1.5 text-[8px] font-semibold">
                  <MealMacro label="P" value={meal.macros.proteinG} color={MACRO_COLORS.protein} />
                  <MealMacro label="C" value={meal.macros.carbsG} color={MACRO_COLORS.carbs} />
                  <MealMacro label="G" value={meal.macros.fatG} color={MACRO_COLORS.fat} />
                </div>
              </div>
              <span className="shrink-0 self-start rounded-full bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-bold text-white">
                {meal.kcal}
              </span>
            </div>
          ))}
          {meals.length > 2 && (
            <p className="px-2 py-1 text-[8px] font-semibold text-[#7887a6]">
              +{meals.length - 2} más
            </p>
          )}
        </div>
      )}
    </div>
  );
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
