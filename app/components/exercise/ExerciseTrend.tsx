"use client";

import { useRef, useState, type KeyboardEvent } from "react";

import {
  chartScale,
  formatMetric,
  formatShortDate,
  metricLabel,
  splitMetric,
  type TrendPoint,
} from "@/app/lib/exercise-history";
import type { ExerciseKind } from "@/app/lib/workout-progression";

const WIDTH = 343;
const HEIGHT = 150;
const PAD = { top: 14, right: 40, bottom: 22, left: 6 };

/**
 * Métrica del tipo en Metric L + gráfico con escala (§11.4). Tinta neutra: es un dato, no una acción.
 * Tocar un punto (o ←/→ con foco) cambia el número de arriba.
 */
export function ExerciseTrend({ points, kind }: { points: TrendPoint[]; kind: ExerciseKind }) {
  const [selected, setSelected] = useState(points.length - 1);
  const hitRefs = useRef<Array<SVGCircleElement | null>>([]);
  const values = points.map((point) => point.value);
  const scale = chartScale(values);
  const best = Math.max(...values);
  const span = scale.max - scale.min;
  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotBottom = HEIGHT - PAD.bottom;
  const x = (index: number) => PAD.left + (index * plotWidth) / (points.length - 1);
  const y = (value: number) => PAD.top + (1 - (value - scale.min) / span) * (plotBottom - PAD.top);
  const line = points.map((point, index) => `${x(index)},${y(point.value)}`).join(" ");
  const current = points[selected];
  const metric = splitMetric(current.value, kind);

  function onKeyDown(event: KeyboardEvent<SVGCircleElement>, index: number) {
    const next =
      event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? points.length - 1 : null;

    if (next == null || next < 0 || next >= points.length) return;
    event.preventDefault();
    setSelected(next);
    hitRefs.current[next]?.focus();
  }

  return (
    <figure className="grid gap-3">
      <figcaption className="grid gap-1" aria-live="polite">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">
          {metricLabel(kind)} · {formatShortDate(current.date)}
        </span>
        <span className="font-display text-[3rem] font-bold leading-none tracking-[-0.04em] tabular-nums text-[var(--foreground)]">
          {metric.value}
          {metric.unit ? (
            <span className="ml-1.5 text-[1.125rem] font-semibold tracking-normal text-[var(--foreground-muted)]">
              {metric.unit}
            </span>
          ) : null}
        </span>
        <span className="text-[14px] text-[var(--foreground-muted)]">
          <Change from={points[0]} to={current} kind={kind} />
          {current.value === best ? " · mejor marca" : ""}
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full overflow-visible"
        role="group"
        aria-label={`${metricLabel(kind)} por sesión`}
      >
        {scale.ticks.map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--border)" strokeWidth={1} opacity={0.6} />
            <text x={WIDTH - PAD.right + 8} y={y(tick) + 3.5} className="fill-[var(--foreground-subtle)] font-mono text-[10.5px]">
              {tick}
            </text>
          </g>
        ))}
        <line
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={y(best)}
          y2={y(best)}
          stroke="var(--foreground-muted)"
          strokeDasharray="2 4"
          strokeWidth={1.2}
        />
        <polygon
          points={`${x(0)},${plotBottom} ${line} ${x(points.length - 1)},${plotBottom}`}
          fill="var(--foreground)"
          opacity={0.05}
        />
        <polyline points={line} fill="none" stroke="var(--foreground-muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <line
          x1={x(selected)}
          x2={x(selected)}
          y1={y(current.value) + 7}
          y2={plotBottom}
          stroke="var(--border-strong)"
          strokeDasharray="3 3"
        />
        {points.map((point, index) => (
          <g key={point.sessionId}>
            <circle
              cx={x(index)}
              cy={y(point.value)}
              r={index === selected ? 5.5 : 3.5}
              fill={index === selected ? "var(--foreground)" : "#080b10"}
              stroke="var(--foreground)"
              strokeWidth={2}
            />
            <circle
              ref={(node) => {
                hitRefs.current[index] = node;
              }}
              cx={x(index)}
              cy={y(point.value)}
              r={22}
              fill="transparent"
              tabIndex={index === selected ? 0 : -1}
              role="button"
              aria-pressed={index === selected}
              aria-label={`${formatShortDate(point.date)}: ${formatMetric(point.value, kind)}`}
              className="cursor-pointer outline-none focus-visible:stroke-[var(--accent)] focus-visible:stroke-2"
              onClick={() => setSelected(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
            />
          </g>
        ))}
        <text x={PAD.left} y={HEIGHT - 4} className="fill-[var(--foreground-subtle)] font-mono text-[10.5px]">
          {formatShortDate(points[0].date)}
        </text>
        <text x={WIDTH - PAD.right} y={HEIGHT - 4} textAnchor="end" className="fill-[var(--foreground-subtle)] font-mono text-[10.5px]">
          {formatShortDate(points[points.length - 1].date)}
        </text>
      </svg>
    </figure>
  );
}

function Change({ from, to, kind }: { from: TrendPoint; to: TrendPoint; kind: ExerciseKind }) {
  if (from.sessionId === to.sessionId) {
    return <>Primera sesión</>;
  }

  const diff = Math.round((to.value - from.value) * 10) / 10;

  if (diff === 0) {
    return <>Igual que el {formatShortDate(from.date)}</>;
  }

  const amount = formatMetric(Math.abs(diff), kind);

  return (
    <>
      <span className="font-medium text-[var(--foreground)]">
        {diff > 0 ? "+" : "−"}
        {amount}
      </span>{" "}
      desde el {formatShortDate(from.date)}
    </>
  );
}
