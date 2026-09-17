"use client";

import { useId, useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";

import { WeightProjectionChart, WeightProjectionSpark } from "@/app/components/configuracion/WeightProjectionChart";
import { SegmentedControl } from "@/app/components/ui/SegmentedControl";
import { calculateNutritionPlan } from "@/app/lib/nutrition-calc";
import type { Goal, NutritionProfileInput } from "@/app/lib/nutrition-types";
import {
  contradictsGoal,
  fastPaceNote,
  formatKg,
  formatKgDelta,
  PACE_COPY,
  PROJECTION_HORIZONS,
  projectWeight,
  showsProjection,
  type ProjectionHorizon,
} from "@/app/lib/weight-projection";
import { cn } from "@/app/lib/utils";

const HORIZON_OPTIONS = PROJECTION_HORIZONS.map((weeks) => ({ value: String(weeks), label: `${weeks} sem` }));
const PREVIEW_WEEKS = 12;

/**
 * Z2b · hacia dónde va el peso si se cumple el objetivo (DESIGN.md §15.4).
 * Solo con Definición o Ganar masa muscular; en manual sigue al objetivo fijado.
 */
export function ProjectionSection({
  input,
  targetKcal,
  manual,
  headingLevel = "h2",
}: {
  input: NutritionProfileInput;
  targetKcal: number;
  manual: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const titleId = useId();
  const [weeks, setWeeks] = useState<ProjectionHorizon>(12);
  const [picked, setPicked] = useState<number | null>(null);
  const projection = useMemo(() => projectWeight(input, targetKcal, weeks), [input, targetKcal, weeks]);

  if (!showsProjection(input.goal)) return null;

  const Heading = headingLevel;
  const selected = Math.min(picked ?? weeks, weeks);
  const point = projection.points[selected];
  const start = projection.points[0].kg;
  const flat = projection.direction === "flat";
  const contradicts = manual && contradictsGoal(input.goal, projection.direction);
  const fast = projection.pace === "fast";

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Heading
          id={titleId}
          className="font-display text-[1.375rem] font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)]"
        >
          Tu proyección
        </Heading>
        {flat ? null : (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
              fast
                ? "border-[var(--warning)]/40 text-[var(--warning)]"
                : "border-[var(--border-strong)] text-[var(--foreground)]",
            )}
          >
            <span
              aria-hidden="true"
              className={cn("size-1.5 rounded-full", fast ? "bg-[var(--warning)]" : "bg-[var(--foreground-muted)]")}
            />
            {PACE_COPY[projection.pace]}
          </span>
        )}
      </div>

      {flat ? (
        <p className="text-[15px] text-[var(--foreground-muted)]">
          Con este objetivo tu peso se mantiene cerca de{" "}
          <span className="font-mono text-[var(--foreground)]">{formatKg(start)} kg</span>.
        </p>
      ) : (
        <>
          <div className="grid gap-1">
            <p className="text-[0.6875rem] font-semibold uppercase leading-normal tracking-[0.08em] text-[var(--foreground-muted)]">
              {selected === 0 ? "Hoy" : `Semana ${selected}`}
            </p>
            <p className="font-display text-5xl font-bold leading-none tracking-[-0.04em] tabular-nums text-[var(--foreground)]">
              {formatKg(point.kg)}
              <span className="ml-1.5 text-lg font-semibold tracking-normal text-[var(--foreground-muted)]">kg</span>
            </p>
            <p className="text-sm text-[var(--foreground-muted)]">
              {selected === 0 ? (
                "Tu peso actual"
              ) : (
                <>
                  <span className="font-medium text-[var(--foreground)]">{formatKgDelta(point.kg - start)} kg</span> desde
                  hoy · entre {formatKg(point.low)} y {formatKg(point.high)}
                </>
              )}
            </p>
          </div>

          <SegmentedControl
            label="Horizonte de la proyección"
            options={HORIZON_OPTIONS}
            value={String(weeks)}
            onChange={(value) => {
              setWeeks(Number(value) as ProjectionHorizon);
              setPicked(null);
            }}
          />

          <WeightProjectionChart points={projection.points} selected={selected} onSelect={setPicked} />

          <dl className="grid grid-cols-3 border-t border-[var(--border)] pt-3">
            <Stat label="Hoy, kg" value={formatKg(start)} />
            <Stat label="kg por semana" value={formatKgDelta(projection.weeklyKg, 2)} divided />
            <Stat label="de tu peso" value={`${formatKg(projection.weeklyPct)}%`} divided />
          </dl>

          {fast || contradicts || projection.floorReached ? (
            <p className="flex items-start gap-2 text-[13px] leading-snug text-[var(--warning)]">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              <span>
                {contradicts
                  ? `Tu objetivo fijo da ${projection.direction === "up" ? "superávit: tu peso subiría" : "déficit: tu peso bajaría"}.`
                  : projection.floorReached
                    ? "La proyección se detiene en un peso saludable para tu altura."
                    : fastPaceNote(projection.direction)}
              </span>
            </p>
          ) : null}

          <p className="text-xs leading-snug text-[var(--foreground-muted)]">
            Aproximado, si cumplís <span className="font-mono text-[var(--foreground)]">{targetKcal}</span> kcal por día.
            Tu peso real sube y baja por agua y sodio: actualizalo cada semana y la curva se recalcula.
          </p>
        </>
      )}
    </section>
  );
}

function Stat({ label, value, divided = false }: { label: string; value: string; divided?: boolean }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", divided && "border-l border-[var(--border)] pl-3")}>
      <dt className="order-2 truncate text-xs font-medium text-[var(--foreground-muted)]">{label}</dt>
      <dd className="order-1 font-display text-lg font-bold tracking-[-0.02em] tabular-nums text-[var(--foreground)]">
        {value}
      </dd>
    </div>
  );
}

/** Vista previa a 12 semanas con las kcal calculadas de cada objetivo (S4 y paso 6 del alta). */
export function ProjectionPreview({ input, goal }: { input: NutritionProfileInput; goal: Goal }) {
  const projection = useMemo(() => {
    const goalInput = { ...input, goal };
    return projectWeight(goalInput, calculateNutritionPlan(goalInput).targetKcal, PREVIEW_WEEKS);
  }, [input, goal]);
  const start = projection.points[0].kg;
  const end = projection.points[PREVIEW_WEEKS].kg;
  const flat = !showsProjection(goal) || projection.direction === "flat";

  return (
    <div
      aria-live="polite"
      className="grid min-h-[84px] grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-3 border-b border-[var(--border)] pb-3"
    >
      <p className="grid gap-0.5 text-[13px] text-[var(--foreground-muted)]">
        <span>{flat ? "Con este objetivo" : `En ${PREVIEW_WEEKS} semanas`}</span>
        <span className="font-display text-[1.375rem] font-bold leading-tight tracking-[-0.02em] tabular-nums text-[var(--foreground)]">
          ≈ {formatKg(flat ? start : end)} kg
        </span>
        <span>
          {flat
            ? "Tu peso se mantiene; cambia la composición"
            : `${formatKgDelta(end - start)} kg · ${formatKgDelta(projection.weeklyKg, 2)} kg por semana`}
        </span>
      </p>
      {flat ? null : <WeightProjectionSpark points={projection.points} className="h-auto w-full" />}
    </div>
  );
}
