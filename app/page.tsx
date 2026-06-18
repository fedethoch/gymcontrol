import Link from "next/link";
import Image from "next/image";
import {
  CalendarRange,
  ChevronRight,
  Dumbbell,
  Flame,
  Image as ImageIcon,
  UtensilsCrossed,
  Zap,
} from "lucide-react";

import { BodyMuscleFigure } from "@/app/components/shared/BodyMuscleFigure";
import { NutritionCalendarCard } from "@/app/components/shared/NutritionCalendarCard";
import { TrainingCalendarCard } from "@/app/components/shared/TrainingCalendarCard";
import { Button } from "@/app/components/ui/Button";
import { fadeUp, MotionDiv, MotionSection, staggerContainer } from "@/app/components/ui/motion";
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

  const [activeRoutine, weeklySummaries, completedTrainingDates, muscleStrengthSummaries] = activeRoutineListItem
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

  const totalDays = activeRoutine?.days.length ?? 0;
  const weeklySummary = activeRoutine ? weeklySummaries[activeRoutine.id] : null;
  const completedDayIds = new Set(weeklySummary?.completedRoutineDayIds ?? []);
  const nextPendingDay =
    activeRoutine?.days.find((day) => !completedDayIds.has(day.id)) ?? null;

  const primaryHref =
    activeRoutine && nextPendingDay
      ? `/rutinas/dia?savedRoutineId=${activeRoutine.id}&day=${nextPendingDay.dayOrder}`
      : activeRoutine
        ? "/rutinas"
        : "/";

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


  return (
    <section className="page-frame auto-rows-max content-start bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.12),transparent_32%),linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">

      {/* Hero: hoy toca — image placeholder banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#11151f]">
        {/* Placeholder bg */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <ImageIcon className="size-16 text-[#1e2540]" />
        </div>
        {/* Scrim */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
        {/* Content */}
        <div className="relative z-10 flex flex-col gap-2 p-4 pb-5">
          <p className="text-xs font-medium text-[#9a9eb0]">Hoy toca:</p>
          <h2 className="font-display text-xl font-semibold leading-tight text-white sm:text-2xl lg:text-3xl">
            {activeRoutine && nextPendingDay ? (
              <>
                <span className="text-[#8b4dff]">Dia {nextPendingDay.dayOrder}</span>
                <span className="text-[#d8dbe7]"> · </span>
                {nextPendingDay.dayName}
              </>
            ) : activeRoutine ? (
              "Semana completa"
            ) : (
              "Sin rutina activa"
            )}
          </h2>
          <div className="mt-1">
            <Button
              asChild
              size="sm"
              className="w-1/3 justify-center px-3 shadow-[0_8px_24px_rgba(124,58,237,0.28)]"
            >
              <Link href={primaryHref}>Comenzar</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Card grid: 2 columns on mobile, 3 on desktop */}
      <MotionSection
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="grid grid-cols-2 gap-2 lg:grid-cols-3"
      >
        {/* Nutrición */}
        <MotionDiv variants={fadeUp} className="col-span-1 h-full">
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
        <MotionDiv variants={fadeUp} className="col-span-1 h-full">
          <CargaMuscularCard
            muscleLoad={muscleLoad}
            maxCount={maxMuscleCount}
            strengthSummaries={muscleStrengthSummaries}
          />
        </MotionDiv>

        {/* Comidas hoy — full ancho en mobile */}
        <MotionDiv variants={fadeUp} className="col-span-2 h-full lg:col-span-1">
          <ComidasHoyCard meals={meals} totalKcal={totalKcal} />
        </MotionDiv>

        {/* Constancia */}
        <MotionDiv variants={fadeUp} className="col-span-1 h-full">
          <div className="flex h-full flex-col gap-2 rounded-2xl bg-[#0e131e] p-3">
            <CardLabel icon={CalendarRange} label="Constancia" />
            <div className="flex flex-1 items-center justify-center">
              <TrainingCalendarCard completedDates={completedTrainingDates} weeks={5} bare />
            </div>
          </div>
        </MotionDiv>

        {/* Calendario de nutrición */}
        <MotionDiv variants={fadeUp} className="col-span-1 h-full">
          <div className="flex h-full flex-col gap-2 rounded-2xl bg-[#0e131e] p-3">
            <CardLabel icon={UtensilsCrossed} label="Nutrición" />
            <div className="flex flex-1 items-center justify-center">
              <NutritionCalendarCard loggedDates={new Set(nutritionLoggedDates)} weeks={5} bare />
            </div>
          </div>
        </MotionDiv>
      </MotionSection>
    </section>
  );
}

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

const STRENGTH_LEGEND = [
  { label: "Base", color: "#22c55e" },
  { label: "Fuerte", color: "#eab308" },
  { label: "Avanz.", color: "#f97316" },
  { label: "Elite", color: "#ef4444" },
];

const STRENGTH_RANGE_LABELS: Record<MuscleStrengthSummary["range"], string> = {
  sin_datos: "sin datos",
  base: "base",
  fuerte: "fuerte",
  avanzado: "avanzado",
  elite: "elite",
};

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
  const macros = [
    { label: "Proteína", value: totalMacros.proteinG, target: targetMacros.proteinG, color: "#4ade80" },
    { label: "Carbohid.", value: totalMacros.carbsG, target: targetMacros.carbsG, color: "#fb923c" },
    { label: "Grasas", value: totalMacros.fatG, target: targetMacros.fatG, color: "#f472b6" },
  ];

  return (
    <div className="flex h-full flex-col gap-2 rounded-2xl bg-[#0e131e] p-3">
        <CardLabel icon={Flame} label="Nutrición" />

        {/* Circle — fills most of the card width */}
        <div className="flex justify-center">
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
        </div>

        {/* Restantes — single line */}
        <p className="text-center text-xs font-semibold text-[#c5cad8]">
          <span className="text-white">{kcalRemaining}</span> kcal restantes
        </p>

        {/* Macro bars — stacked */}
        <div className="flex flex-col gap-1">
          {macros.map(({ label, value, target, color }) => {
            const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
            const remaining = Math.max(0, Math.round(target - value));
            return (
              <div key={label} className="grid gap-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-[8px] font-bold" style={{ color }}>{label}</span>
                  <span className="shrink-0 text-[8px] text-[#7887a6]">{Math.round(value)}G/{remaining}G</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#1a2235]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
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
  const hasStrengthData = strengthSummaries.some((summary) => summary.bestWeight != null);
  const muscleColors = Object.fromEntries(
    strengthSummaries.map((summary) => [summary.muscleGroup, summary.color]),
  );
  const visibleSummaries = [
    ...strengthSummaries.filter((summary) => summary.bestWeight != null),
    ...strengthSummaries.filter((summary) => summary.bestWeight == null),
  ].slice(0, 3);

  return (
    <div className="flex h-full flex-col gap-2 rounded-2xl bg-[#0e131e] p-3">
        <CardLabel icon={Zap} label="Carga muscular" />

        {isEmpty ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-center text-[10px] text-[#7887a6]">Sin rutina activa</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-2">
            <BodyMuscleFigure
              muscleLoad={hasStrengthData ? {} : muscleLoad}
              maxCount={maxCount}
              muscleColors={muscleColors}
            />
            <div className="grid grid-cols-4 gap-1">
              {STRENGTH_LEGEND.map((item) => (
                <div key={item.label} className="grid gap-0.5">
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-center text-[7px] font-semibold text-[#6e7788]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="grid gap-1">
              {visibleSummaries.map((summary) => (
                <div key={summary.muscleGroup} className="flex items-center justify-between gap-2 text-[9px]">
                  <span className="min-w-0 truncate font-semibold text-[#c5cad8]">{summary.muscleGroup}</span>
                  <span className="shrink-0 font-bold" style={{ color: summary.color }}>
                    {summary.bestWeight == null
                      ? STRENGTH_RANGE_LABELS[summary.range]
                      : `${summary.bestWeight}kg · ${STRENGTH_RANGE_LABELS[summary.range]}`}
                  </span>
                </div>
              ))}
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
  const preview = meals.slice(0, 2);

  return (
    <div className="flex h-full flex-col rounded-2xl bg-[#0e131e] p-3">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-display text-sm font-semibold text-white">Comidas de hoy</h2>

            <p className="mt-0.5 truncate text-[10px] text-[#7887a6]">
              {meals.length} comidas - {totalKcal} kcal
            </p>
          </div>
          <Link
            href="/nutricion/registro"
            aria-label="Ver registro de nutricion"
            className="grid size-7 shrink-0 place-items-center text-[#8f98ad] transition-colors hover:text-white"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>

        {preview.length === 0 ? (
          <p className="text-xs text-[#7887a6]">Sin comidas registradas hoy.</p>
        ) : (
          <div className="grid overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111722]">
            {preview.map((meal) => (
              <div
                key={meal.id}
                className="flex min-w-0 items-center gap-2 border-b border-[rgba(255,255,255,0.06)] p-2 last:border-b-0"
              >
                <span className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-alt)]">
                  <Image
                    alt={MEAL_TYPE_LABELS[meal.type]}
                    className="object-cover"
                    fill
                    sizes="56px"
                    src={meal.imageUrl}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-[#b985ff]">
                    {MEAL_TYPE_LABELS[meal.type]}
                  </p>
                  <p className="mt-0.5 truncate font-display text-[13px] font-semibold leading-tight text-white">
                    {meal.name}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[10px] leading-4 text-[#8d97ab]">
                    {formatMealFoods(meal)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[9px] font-semibold text-[#7887a6]">
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
              <p className="px-2 py-1.5 text-[9px] font-semibold text-[#7887a6]">
                +{meals.length - 2} mas
              </p>
            )}
          </div>
        )}

    </div>
  );
}

function formatMealFoods(meal: MealGroup) {
  if (meal.items.length === 0) {
    return "Sin alimentos";
  }

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
