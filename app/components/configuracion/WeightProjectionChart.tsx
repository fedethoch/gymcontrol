"use client";

import { useId, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { useReducedMotion } from "framer-motion";

import { motion, premiumEase } from "@/app/components/ui/motion";
import { chartScale } from "@/app/lib/chart-scale";
import type { ProjectionPoint } from "@/app/lib/weight-projection";

/** Un punto de cualquier serie proyectada: peso en kg o grasa en %. */
export type ChartPoint = { week: number; value: number; low: number; high: number };

const WIDTH = 343;
const HEIGHT = 170;
const PAD = { top: 12, right: 40, bottom: 24, left: 8 };
const MILESTONE_EVERY = 4;

const bandPoints = (points: Array<Pick<ChartPoint, "low" | "high">>, x: (index: number) => number, y: (value: number) => number) =>
  [
    ...points.map((point, index) => `${x(index)},${y(point.high)}`),
    ...points.map((point, index) => `${x(index)},${y(point.low)}`).reverse(),
  ].join(" ");

/**
 * Curva proyectada (punteada: futura), banda de rango y la semana elegida (DESIGN.md §15.4).
 * Tinta neutra como ExerciseTrend: es un dato, no una acción. Tocar o arrastrar elige la semana;
 * con foco, ←/→, Home y End.
 */
export function WeightProjectionChart({
  points,
  selected,
  onSelect,
  formatValue,
}: {
  points: ChartPoint[];
  selected: number;
  onSelect: (week: number) => void;
  /** Valor con unidad para lectores de pantalla: "73,5 kg". */
  formatValue: (value: number) => string;
}) {
  const clipId = useId();
  const reduceMotion = useReducedMotion();
  const draggingRef = useRef(false);
  const last = points.length - 1;
  const scale = chartScale(points.flatMap((point) => [point.low, point.high]));
  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotBottom = HEIGHT - PAD.bottom;
  const x = (index: number) => PAD.left + (index * plotWidth) / last;
  const y = (value: number) => PAD.top + (1 - (value - scale.min) / (scale.max - scale.min)) * (plotBottom - PAD.top);
  const current = points[selected];
  const middle = Math.round(last / 2);

  function pick(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const viewX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const week = Math.round(((viewX - PAD.left) / plotWidth) * last);
    const next = Math.min(last, Math.max(0, week));
    if (next !== selected) onSelect(next);
  }

  function onKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    const next =
      event.key === "ArrowRight" || event.key === "ArrowUp"
        ? selected + 1
        : event.key === "ArrowLeft" || event.key === "ArrowDown"
          ? selected - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;

    if (next == null) return;
    event.preventDefault();
    onSelect(Math.min(last, Math.max(0, next)));
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto max-h-[42svh] w-full cursor-crosshair touch-pan-y overflow-visible rounded-md outline-none focus-visible:shadow-[var(--focus-glow)]"
      tabIndex={0}
      role="slider"
      aria-label="Semana de la proyección"
      aria-valuemin={0}
      aria-valuemax={last}
      aria-valuenow={selected}
      aria-valuetext={`${selected === 0 ? "Hoy" : `Semana ${selected}`}, ${formatValue(current.value)}`}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        draggingRef.current = true;
        pick(event);
      }}
      onPointerMove={(event) => {
        if (draggingRef.current || event.pointerType === "mouse") pick(event);
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
      onPointerLeave={() => {
        draggingRef.current = false;
      }}
    >
      <defs>
        <clipPath id={clipId}>
          <motion.rect
            key={last}
            x={0}
            y={0}
            width={WIDTH}
            height={HEIGHT}
            style={{ originX: 0 }}
            initial={reduceMotion ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, ease: premiumEase }}
          />
        </clipPath>
      </defs>

      {scale.ticks.map((tick) => (
        <g key={tick}>
          <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--border)" strokeWidth={1} opacity={0.6} />
          <text x={WIDTH - PAD.right + 8} y={y(tick) + 3.5} className="fill-[var(--foreground-subtle)] font-mono text-[10.5px]">
            {tick}
          </text>
        </g>
      ))}

      <g clipPath={`url(#${clipId})`}>
        <polygon points={bandPoints(points, x, y)} fill="var(--foreground)" opacity={0.06} />
        <polyline
          points={points.map((point, index) => `${x(index)},${y(point.value)}`).join(" ")}
          fill="none"
          stroke="var(--foreground-muted)"
          strokeWidth={2}
          strokeDasharray="5 4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, index) =>
          index > 0 && index !== selected && (index % MILESTONE_EVERY === 0 || index === last) ? (
            <circle
              key={point.week}
              cx={x(index)}
              cy={y(point.value)}
              r={3.5}
              fill="var(--background)"
              stroke="var(--foreground-muted)"
              strokeWidth={1.6}
            />
          ) : null,
        )}
      </g>

      <line
        x1={x(selected)}
        x2={x(selected)}
        y1={y(current.value) + 7}
        y2={plotBottom}
        stroke="var(--border-strong)"
        strokeDasharray="3 3"
      />
      <circle cx={x(0)} cy={y(points[0].value)} r={4.5} fill="var(--foreground)" />
      {selected > 0 ? (
        <circle
          cx={x(selected)}
          cy={y(current.value)}
          r={5.5}
          fill="var(--foreground)"
          stroke="var(--background)"
          strokeWidth={2}
        />
      ) : null}

      <text x={PAD.left} y={HEIGHT - 5} className="fill-[var(--foreground-subtle)] font-mono text-[10.5px]">
        Hoy
      </text>
      {last >= 8 ? (
        <text x={x(middle)} y={HEIGHT - 5} textAnchor="middle" className="fill-[var(--foreground-subtle)] font-mono text-[10.5px]">
          Sem {middle}
        </text>
      ) : null}
      <text x={WIDTH - PAD.right} y={HEIGHT - 5} textAnchor="end" className="fill-[var(--foreground-subtle)] font-mono text-[10.5px]">
        Sem {last}
      </text>
    </svg>
  );
}

/** Forma de la curva sin ejes ni interacción, para la vista previa del sheet Objetivo. */
export function WeightProjectionSpark({ points, className }: { points: ProjectionPoint[]; className?: string }) {
  const width = 120;
  const height = 56;
  const last = points.length - 1;
  const low = Math.min(...points.map((point) => point.low));
  const high = Math.max(...points.map((point) => point.high));
  const x = (index: number) => 4 + (index * (width - 12)) / last;
  const y = (value: number) => 6 + (1 - (value - low) / (high - low || 1)) * (height - 12);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className={className}>
      <polygon points={bandPoints(points, x, y)} fill="var(--foreground)" opacity={0.07} />
      <polyline
        points={points.map((point, index) => `${x(index)},${y(point.kg)}`).join(" ")}
        fill="none"
        stroke="var(--foreground-muted)"
        strokeWidth={2}
        strokeDasharray="4 3"
        strokeLinecap="round"
      />
      <circle cx={x(0)} cy={y(points[0].kg)} r={3.5} fill="var(--foreground)" />
      <circle
        cx={x(last)}
        cy={y(points[last].kg)}
        r={3.5}
        fill="var(--background)"
        stroke="var(--foreground)"
        strokeWidth={1.6}
      />
    </svg>
  );
}
