import Image from "next/image";
import { Check, ChevronRight, Dumbbell } from "lucide-react";
import type { ReactNode } from "react";

import { MuscleBodyView } from "@/app/components/shared/BodyMuscleFigure";
import type { ExerciseDetail } from "@/app/components/shared/ExerciseDetailModal";
import { AnimatedNumber } from "@/app/components/ui/motion";
import type { DayTab } from "@/app/lib/routine-week";
import { cn } from "@/app/lib/utils";

export type WeekExercise = {
  id: string;
  name: string;
  imageUrl: string;
  /** "3 × 8-12 · RIR 2 · 90s" */
  meta: string;
  done: boolean;
  detail: ExerciseDetail;
};

export type WeekDay = {
  id: string;
  dayOrder: number;
  href: string;
  /** Hasta 2 grupos ya formateados ("Hombros", "Bíceps"); vacío = usar `dayName`. */
  titleGroups: string[];
  dayName: string;
  /** Color por grupo (claves de `muscle_group`) para `MuscleBodyView`. */
  fills: Record<string, string>;
  minutes: number;
  seriesCount: number;
  exercises: WeekExercise[];
  progress: { done: number; total: number; nextExerciseName: string | null } | null;
  tab: DayTab;
  /** "Lunes 14" si el día está hecho esta semana. */
  doneLabel: string | null;
};

/** Z3 · panel de un día: chip, grupos en Display XXL, figura, stats y ejercicios (DESIGN.md §12.1). */
export function DayPanel({
  day,
  chip,
  onOpenExercise,
}: {
  day: WeekDay;
  chip: ReactNode;
  onOpenExercise: (exercise: ExerciseDetail) => void;
}) {
  return (
    <div className="grid content-start gap-6">
      <div className="flex items-end gap-3 pt-[clamp(6rem,24svh,9.5rem)]">
        <div className="grid min-w-0 flex-1 gap-3.5">
          {chip}
          <h2 className="font-display text-[clamp(2.25rem,10.5vw,2.75rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.05em] text-white [overflow-wrap:anywhere]">
            {day.titleGroups.length === 2 ? (
              <>
                {day.titleGroups[0]} <em className="not-italic text-[var(--accent-bright)]">&amp;</em> {day.titleGroups[1]}
              </>
            ) : (
              (day.titleGroups[0] ?? day.dayName)
            )}
          </h2>
        </div>
        {Object.keys(day.fills).length > 0 ? (
          <div role="img" aria-label={`Músculos del día: ${Object.keys(day.fills).join(", ")}`} className="flex shrink-0 items-end gap-1">
            <MuscleBodyView view="front" width={40} fills={day.fills} />
            <MuscleBodyView view="back" width={40} fills={day.fills} />
          </div>
        ) : null}
      </div>

      {day.progress ? (
        <div className="grid gap-2">
          <p className="text-[15px] font-medium leading-snug text-white/80">
            <b className="font-semibold text-white">{day.progress.done}</b> de {day.progress.total} ejercicios
            {day.progress.nextExerciseName ? <> · sigue {day.progress.nextExerciseName}</> : null}
          </p>
          <div
            role="progressbar"
            aria-label="Progreso del entrenamiento en curso"
            aria-valuemin={0}
            aria-valuemax={day.progress.total}
            aria-valuenow={day.progress.done}
            className="h-2 overflow-hidden rounded-full bg-white/15"
          >
            <div
              className="h-full rounded-full bg-[var(--accent-bright)]"
              style={{ width: `${day.progress.total > 0 ? Math.round((day.progress.done / day.progress.total) * 100) : 0}%` }}
            />
          </div>
        </div>
      ) : (
        <WeekStats
          stats={[
            { label: "Duración", value: day.minutes, prefix: "~", unit: " min" },
            { label: "Ejercicios", value: day.exercises.length },
            { label: "Series", value: day.seriesCount },
          ]}
        />
      )}

      <section aria-label="Ejercicios" className="grid gap-2">
        <h3 className="font-display text-[1.375rem] font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)]">
          Ejercicios
        </h3>
        <ol className="border-y border-[var(--border)]">
          {day.exercises.map((exercise, index) => (
            <li key={exercise.id} className="border-b border-[var(--border)] last:border-b-0">
              <button
                type="button"
                onClick={() => onOpenExercise(exercise.detail)}
                className="pressable flex min-h-[72px] w-full items-center gap-3 text-left outline-none focus-visible:shadow-[var(--focus-glow)]"
              >
                {exercise.done ? (
                  <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
                    <Check aria-hidden="true" className="size-3.5" strokeWidth={3.2} />
                    <span className="sr-only">Hecho:</span>
                  </span>
                ) : (
                  <span className="w-[22px] shrink-0 text-center font-mono text-xs tabular-nums text-[var(--foreground-subtle)]">
                    {index + 1}
                  </span>
                )}
                <span className="relative grid size-[52px] shrink-0 place-items-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground-subtle)]">
                  {exercise.imageUrl ? (
                    <Image alt="" fill sizes="52px" src={exercise.imageUrl} className="object-cover" />
                  ) : (
                    <Dumbbell aria-hidden="true" className="size-5" />
                  )}
                </span>
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span
                    className={cn(
                      "truncate font-display text-[15px] font-semibold",
                      exercise.done ? "text-[var(--foreground-muted)]" : "text-[var(--foreground)]",
                    )}
                  >
                    {exercise.name}
                  </span>
                  <span className="truncate text-[13px] text-[var(--foreground-muted)]">{exercise.meta}</span>
                </span>
                <ChevronRight aria-hidden="true" className="size-[18px] shrink-0 text-[var(--foreground-subtle)]" />
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

/** Stats en fila sin cards, patrón de "Esta semana" del home. */
export function WeekStats({
  stats,
}: {
  stats: Array<{ label: string; value: number; prefix?: string; unit?: string }>;
}) {
  return (
    <dl className="grid grid-cols-3 border-y border-[var(--border)]">
      {stats.map(({ label, value, prefix, unit }) => (
        <div
          key={label}
          className="grid min-w-0 gap-2 py-4 [&:not(:first-child)]:border-l [&:not(:first-child)]:border-[var(--border)] [&:not(:first-child)]:pl-4"
        >
          <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">{label}</dt>
          <dd className="font-display text-[1.75rem] font-bold leading-none tracking-[-0.03em] tabular-nums text-[var(--foreground)]">
            {prefix}
            <AnimatedNumber value={value} />
            {unit ? (
              <span className="font-sans text-sm font-medium tracking-normal text-[var(--foreground-muted)]">{unit}</span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
