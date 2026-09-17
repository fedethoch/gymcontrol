"use client";

import { useState } from "react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/app/components/ui/Drawer";
import {
  formatMetric,
  formatShortDate as formatDate,
  metricLabel,
  trendPoints,
} from "@/app/lib/exercise-history";
import {
  formatKg,
  formatLoggedSet,
  isValidSet,
  type ExerciseKind,
} from "@/app/lib/workout-progression";
import type { ExerciseHistoryEntry } from "@/app/lib/workout-tracking";
import { cn } from "@/app/lib/utils";

type HistoryExercise = {
  exercise: { name: string };
  kind: ExerciseKind;
  history: ExerciseHistoryEntry[];
};

const CHART_WIDTH = 320;
const CHART_HEIGHT = 72;
const CHART_PADDING = 10;

/** Historial del ejercicio en bottom sheet: evolución de la mejor marca y las series de cada sesión. */
export function ExerciseHistorySheet({
  exercise,
  onOpenChange,
}: {
  exercise: HistoryExercise | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Drawer open={exercise !== null} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85dvh]">
        {exercise ? <HistoryContent key={exercise.exercise.name} exercise={exercise} /> : null}
      </DrawerContent>
    </Drawer>
  );
}

function HistoryContent({ exercise }: { exercise: HistoryExercise }) {
  const sessions = exercise.history;
  const points = trendPoints(sessions);
  const bestEver = sessions
    .map((entry) => entry.best)
    .filter((best) => best != null)
    .sort((left, right) => right.e1rm - left.e1rm)[0];

  return (
    <>
      <DrawerHeader className="px-5 pb-2 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
        <DrawerTitle className="text-xl font-bold tracking-[-0.02em]">{exercise.exercise.name}</DrawerTitle>
        <DrawerDescription>
          {sessions.length === 1 ? "Última sesión" : `Últimas ${sessions.length} sesiones`}
          {bestEver
            ? ` · mejor: ${formatKg(bestEver.kg)} kg × ${bestEver.reps} (1RM est. ${formatKg(bestEver.e1rm)} kg)`
            : ""}
        </DrawerDescription>
      </DrawerHeader>

      <div className="grid gap-5 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {points.length >= 2 ? <TrendChart points={points} kind={exercise.kind} /> : null}

        <ol aria-label="Sesiones anteriores" className="grid border-y border-[var(--border)]">
          {sessions.map((entry) => (
            <li
              key={entry.sessionId}
              className="grid gap-1.5 border-b border-[var(--border)] py-3 last:border-b-0"
            >
              <p className="flex items-baseline justify-between gap-3">
                <span className="font-display text-[15px] font-semibold text-[var(--foreground)]">
                  {formatDate(entry.trainingDate)}
                </span>
                {entry.target ? (
                  <span className="text-[13px] text-[var(--foreground-muted)]">objetivo {entry.target}</span>
                ) : null}
              </p>
              <p className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[13px] tabular-nums text-[var(--foreground-muted)]">
                {entry.sets.filter(isValidSet).map((set, index) => (
                  <span key={index}>{formatLoggedSet(set, entry.kind)}</span>
                ))}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

function TrendChart({ points, kind }: { points: Array<{ date: string; value: number }>; kind: ExerciseKind }) {
  const [selected, setSelected] = useState(points.length - 1);
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = (CHART_WIDTH - CHART_PADDING * 2) / (points.length - 1);
  const coordinates = points.map((point, index) => ({
    x: CHART_PADDING + index * step,
    y: CHART_HEIGHT - CHART_PADDING - ((point.value - min) / span) * (CHART_HEIGHT - CHART_PADDING * 2),
  }));
  const current = points[selected];

  return (
    <figure className="grid gap-2">
      <figcaption className="flex items-baseline justify-between gap-3 text-[13px] text-[var(--foreground-muted)]">
        <span>{metricLabel(kind)}</span>
        <span aria-live="polite">
          {formatDate(current.date)} ·{" "}
          <b className="font-display text-base text-[var(--foreground)]">{formatMetric(current.value, kind)}</b>
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="h-[72px] w-full overflow-visible"
        role="group"
        aria-label={`${metricLabel(kind)} por sesión`}
      >
        <line
          x1={CHART_PADDING}
          x2={CHART_WIDTH - CHART_PADDING}
          y1={CHART_HEIGHT - CHART_PADDING}
          y2={CHART_HEIGHT - CHART_PADDING}
          stroke="var(--border)"
          strokeWidth={1}
        />
        <polyline
          points={coordinates.map(({ x, y }) => `${x},${y}`).join(" ")}
          fill="none"
          stroke="var(--foreground-muted)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coordinates.map(({ x, y }, index) => (
          <g key={points[index].date + index}>
            <circle
              cx={x}
              cy={y}
              r={4}
              fill={index === selected ? "var(--foreground)" : "var(--card)"}
              stroke="var(--foreground)"
              strokeWidth={2}
            />
            <circle
              cx={x}
              cy={y}
              r={18}
              fill="transparent"
              tabIndex={0}
              role="button"
              aria-label={`${formatDate(points[index].date)}: ${formatMetric(points[index].value, kind)}`}
              className={cn("cursor-pointer outline-none")}
              onPointerEnter={() => setSelected(index)}
              onFocus={() => setSelected(index)}
              onClick={() => setSelected(index)}
            />
          </g>
        ))}
      </svg>
    </figure>
  );
}
