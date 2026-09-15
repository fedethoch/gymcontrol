"use client";

import { useEffect, useRef, useState } from "react";

import { HomeSectionHeader } from "@/app/components/home/HomeSectionHeader";
import {
  getMuscleCentroid,
  MuscleBodyView,
  type MuscleView,
} from "@/app/components/shared/BodyMuscleFigure";
import {
  STRENGTH_RANGE_COLORS,
  STRENGTH_RANGE_LABELS,
  STRENGTH_RANGE_ORDER,
} from "@/app/lib/strength-colors";
import { formatMuscleGroup } from "@/app/lib/home-dashboard";
import { cn } from "@/app/lib/utils";
import type { MuscleStrengthRange } from "@/app/lib/workout-tracking";

export type MuscleStrengthPoint = {
  muscleGroup: string;
  range: MuscleStrengthRange;
  bestWeight: number | null;
};

type Side = "left" | "right";

/** Grupo → músculo del dibujo donde apunta la línea guía, por vista. */
const CALLOUTS: Record<MuscleView, Array<{ group: string; muscle: string; side: Side }>> = {
  front: [
    { group: "Pecho", muscle: "chest", side: "left" },
    { group: "Core", muscle: "abs", side: "left" },
    { group: "Piernas", muscle: "quadriceps", side: "left" },
    { group: "Hombros", muscle: "front-deltoids", side: "right" },
    { group: "Biceps", muscle: "biceps", side: "right" },
  ],
  back: [
    { group: "Espalda", muscle: "upper-back", side: "left" },
    { group: "Piernas", muscle: "hamstring", side: "left" },
    { group: "Hombros", muscle: "back-deltoids", side: "right" },
    { group: "Triceps", muscle: "triceps", side: "right" },
  ],
};

const LABEL_WIDTH = 86;
const LABEL_SPACING = 64;
const DIMMED_OPACITY = 0.32;

/** Z6 · "Tus músculos": cuerpo por rango de fuerza, sin card (D5-2 · D6-A · D8-A). */
export function MuscleAnatomy({ points }: { points: MuscleStrengthPoint[] }) {
  const byGroup = new Map(points.map((point) => [point.muscleGroup, point]));
  const withData = points.filter((point) => point.bestWeight != null).length;

  const [view, setView] = useState<MuscleView>("front");
  const [selected, setSelected] = useState<string | null>(() => strongestGroup("front", byGroup));
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(343);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => setStageWidth(Math.round(entry.contentRect.width)));
    observer.observe(stage);
    return () => observer.disconnect();
  }, [withData]);

  const fills = Object.fromEntries(points.map((point) => [point.muscleGroup, STRENGTH_RANGE_COLORS[point.range]]));

  if (withData === 0) {
    return (
      <section aria-labelledby="home-muscles-title" className="grid gap-4">
        <div className="grid gap-1">
          <HomeSectionHeader id="home-muscles-title" title="Tus músculos" />
          <p className="text-[13px] text-[var(--foreground-muted)]">Nivel de fuerza por grupo</p>
        </div>
        <div role="img" aria-label="Figura sin datos de fuerza" className="flex justify-center gap-7 pt-2">
          <MuscleBodyView view="front" width={104} fills={fills} />
          <MuscleBodyView view="back" width={104} fills={fills} />
        </div>
        <div className="grid gap-1 text-center">
          <p className="text-base font-semibold text-[var(--foreground)]">Todavía sin datos de fuerza</p>
          <p className="mx-auto max-w-[30ch] text-sm text-[var(--foreground-muted)]">
            Cargá el peso en tus series y cada músculo se pinta según tu mejor marca.
          </p>
        </div>
        <StrengthScale />
      </section>
    );
  }

  const figureWidth = Math.max(96, Math.min(150, stageWidth - 2 * (LABEL_WIDTH + 6)));
  const scale = figureWidth / 100;
  const figureLeft = (stageWidth - figureWidth) / 2;
  const figureTop = 12;
  const stageHeight = figureWidth * 2 + 26;

  const callouts = CALLOUTS[view].map((callout) => {
    const centroid = getMuscleCentroid(view, callout.muscle, callout.side) ?? { x: 50, y: 100 };
    return {
      ...callout,
      anchorX: figureLeft + centroid.x * scale,
      anchorY: figureTop + centroid.y * scale,
      top: 0,
    };
  });
  for (const side of ["left", "right"] as const) {
    let previousTop = -Infinity;
    callouts
      .filter((callout) => callout.side === side)
      .sort((a, b) => a.anchorY - b.anchorY)
      .forEach((callout) => {
        callout.top = Math.min(Math.max(callout.anchorY - 22, previousTop + LABEL_SPACING), stageHeight - LABEL_SPACING);
        previousTop = callout.top;
      });
  }

  const opacities = Object.fromEntries(
    points.map((point) => [
      point.muscleGroup,
      selected && point.muscleGroup !== selected && point.range !== "sin_datos" ? DIMMED_OPACITY : 1,
    ]),
  );
  const viewFills =
    selected && byGroup.get(selected)?.range === "sin_datos"
      ? { ...fills, [selected]: "var(--foreground-subtle)" }
      : fills;

  function changeView(next: MuscleView) {
    setView(next);
    if (!CALLOUTS[next].some((callout) => callout.group === selected)) {
      setSelected(strongestGroup(next, byGroup));
    }
  }

  return (
    <section aria-labelledby="home-muscles-title" className="grid gap-4">
      <div className="grid gap-1">
        <HomeSectionHeader id="home-muscles-title" title="Tus músculos" />
        <p className="text-[13px] text-[var(--foreground-muted)]">Nivel de fuerza por grupo · tocá un músculo</p>
      </div>

      <div
        role="radiogroup"
        aria-label="Vista del cuerpo"
        className="inline-grid h-11 w-[196px] grid-cols-2 rounded-xl bg-[var(--card)] p-[3px]"
      >
        {(["front", "back"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={view === option}
            onClick={() => changeView(option)}
            className={cn(
              "rounded-[9px] text-sm font-semibold transition-colors duration-200",
              view === option
                ? "bg-[var(--card-hover)] text-[var(--foreground)]"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
            )}
          >
            {option === "front" ? "Frente" : "Espalda"}
          </button>
        ))}
      </div>

      <div ref={stageRef} className="relative" style={{ height: stageHeight }}>
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0" width={stageWidth} height={stageHeight}>
          {callouts.map((callout) => {
            const point = byGroup.get(callout.group);
            const isSelected = callout.group === selected;
            const startX = callout.side === "left" ? LABEL_WIDTH + 2 : stageWidth - LABEL_WIDTH - 2;
            const startY = callout.top + 22;
            const stroke = isSelected
              ? point && point.range !== "sin_datos"
                ? STRENGTH_RANGE_COLORS[point.range]
                : "var(--foreground-muted)"
              : "var(--border-strong)";
            return (
              <g key={`${view}-${callout.group}`} style={{ stroke, fill: stroke }}>
                <path
                  d={`M${startX} ${startY} L${(startX + callout.anchorX) / 2} ${startY} L${callout.anchorX} ${callout.anchorY}`}
                  fill="none"
                  strokeWidth={isSelected ? 1.5 : 1}
                />
                <circle cx={callout.anchorX} cy={callout.anchorY} r={isSelected ? 3 : 2} stroke="none" />
              </g>
            );
          })}
        </svg>

        <div className="absolute" style={{ left: figureLeft, top: figureTop }}>
          <MuscleBodyView
            view={view}
            width={figureWidth}
            fills={viewFills}
            opacities={opacities}
            onSelectGroup={setSelected}
          />
        </div>

        {callouts.map((callout) => {
          const point = byGroup.get(callout.group);
          const range = point?.range ?? "sin_datos";
          const isSelected = callout.group === selected;
          const label = formatMuscleGroup(callout.group);
          const weight = point?.bestWeight != null ? `${point.bestWeight} kg` : null;
          const swatch = (
            <span
              aria-hidden="true"
              className="block size-2 rounded-[2px]"
              style={{
                background: STRENGTH_RANGE_COLORS[range],
                boxShadow: range === "sin_datos" ? "inset 0 0 0 1px var(--border-strong)" : undefined,
              }}
            />
          );
          return (
            <button
              key={`${view}-${callout.group}`}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${label}, ${weight ?? "sin registros"}, rango ${STRENGTH_RANGE_LABELS[range]}`}
              onClick={() => setSelected(callout.group)}
              className={cn(
                "absolute grid min-h-11 content-center gap-1 rounded-lg",
                callout.side === "left" ? "left-0 text-left" : "right-0 justify-items-end text-right",
              )}
              style={{ top: callout.top, width: LABEL_WIDTH }}
            >
              <span
                className={cn(
                  "text-sm font-semibold leading-tight",
                  isSelected ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]",
                )}
              >
                {label}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1.5 text-[12.5px] font-medium tabular-nums leading-none",
                  isSelected ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]",
                )}
              >
                {callout.side === "left" ? swatch : null}
                {weight ?? "—"}
                {callout.side === "right" ? swatch : null}
              </span>
              {isSelected ? (
                <span
                  className="text-xs font-semibold leading-none"
                  style={{
                    color: range === "sin_datos" ? "var(--foreground-muted)" : STRENGTH_RANGE_COLORS[range],
                  }}
                >
                  {STRENGTH_RANGE_LABELS[range]}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <StrengthScale />

      {withData < points.length ? (
        <p className="-mt-2 text-[13px] text-[var(--foreground-muted)]">
          {withData} de {points.length} grupos con datos. Los demás se pintan cuando cargues su peso.
        </p>
      ) : null}
    </section>
  );
}

function StrengthScale() {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 border-t border-[var(--border)]">
      <div className="flex items-center gap-1 text-xs font-medium text-[var(--foreground-muted)]">
        <span className="mr-1">Base</span>
        {(["base", "fuerte", "avanzado", "elite"] as const).map((range) => (
          <span
            key={range}
            aria-hidden="true"
            className="block h-1.5 w-5 rounded-[3px]"
            style={{ background: STRENGTH_RANGE_COLORS[range] }}
          />
        ))}
        <span className="ml-1">Elite</span>
      </div>
      <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--foreground-muted)]">
        <span
          aria-hidden="true"
          className="block size-2.5 rounded-[3px]"
          style={{
            background: STRENGTH_RANGE_COLORS.sin_datos,
            boxShadow: "inset 0 0 0 1px var(--border-strong)",
          }}
        />
        Sin datos
      </span>
    </div>
  );
}

/** El grupo con mejor rango (y más kg) entre los que tienen etiqueta en la vista. */
function strongestGroup(view: MuscleView, byGroup: Map<string, MuscleStrengthPoint>) {
  let best: MuscleStrengthPoint | null = null;
  for (const { group } of CALLOUTS[view]) {
    const point = byGroup.get(group);
    if (!point || point.bestWeight == null) continue;
    if (
      !best ||
      STRENGTH_RANGE_ORDER.indexOf(point.range) > STRENGTH_RANGE_ORDER.indexOf(best.range) ||
      (point.range === best.range && point.bestWeight > (best.bestWeight ?? 0))
    ) {
      best = point;
    }
  }
  return best?.muscleGroup ?? null;
}
