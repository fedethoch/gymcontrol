"use client";

import Image from "next/image";
import { ChevronRight, Dumbbell } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { DayTabs } from "@/app/components/rutinas/DayTabs";
import { ExerciseDetailModal, type ExerciseDetail } from "@/app/components/shared/ExerciseDetailModal";
import type { DayTab } from "@/app/lib/routine-week";

export type DetailExercise = {
  id: string;
  name: string;
  imageUrl: string;
  series: number;
  /** "6–10 reps · RIR 1 · 2 min" */
  meta: string;
  detail: ExerciseDetail;
};

export type DetailDay = {
  id: string;
  dayOrder: number;
  dayName: string;
  /** Hasta 2 grupos ya formateados. */
  groups: string[];
  mainGroup: string | null;
  minutes: number;
  seriesCount: number;
  exercises: DetailExercise[];
};

const H2_CLASS = "font-display text-[1.375rem] font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)]";
const subscribeNothing = () => () => {};

/** Z6 · pestañas por día y panel deslizable con los ejercicios (DESIGN.md §19.1, patrón de §12). */
export function DetailDays({ days }: { days: DetailDay[] }) {
  const pagerRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | undefined>(undefined);
  const [panel, setPanel] = useState(0);
  const [height, setHeight] = useState<number | null>(null);
  const [detail, setDetail] = useState<ExerciseDetail | null>(null);
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);

  const tabs: DayTab[] = days.map((day) => ({
    id: day.id,
    dayOrder: day.dayOrder,
    state: "pending",
    label: day.mainGroup ?? day.dayName,
    doneDate: null,
  }));

  // El alto del pager sigue al panel visible: sin hueco debajo de los días cortos.
  useEffect(() => {
    const target = pagerRef.current?.querySelector<HTMLElement>(`#detalle-panel-${panel}`);
    if (!target) return;
    const observer = new ResizeObserver(() => setHeight(target.offsetHeight));
    observer.observe(target);
    return () => observer.disconnect();
  }, [mounted, panel]);

  const goTo = useCallback((next: number) => {
    const pager = pagerRef.current;
    if (!pager) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    pager.scrollTo({ left: next * pager.clientWidth, behavior: reduce ? "auto" : "smooth" });
    setPanel(next);
  }, []);

  function onScroll() {
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const pager = pagerRef.current;
      if (!pager || pager.clientWidth === 0) return;
      setPanel(Math.min(days.length - 1, Math.max(0, Math.round(pager.scrollLeft / pager.clientWidth))));
    }, 90);
  }

  return (
    <section aria-labelledby="detalle-dias" className="grid gap-4">
      <h2 id="detalle-dias" className={H2_CLASS}>
        {days.length === 1 ? "El día" : `Los ${days.length} días`}
      </h2>

      {days.length > 1 ? (
        <DayTabs tabs={tabs} selected={panel} onSelect={goTo} panelIdPrefix="detalle" />
      ) : null}

      <div
        ref={pagerRef}
        onScroll={onScroll}
        style={height ? { height } : undefined}
        className="-mx-4 flex snap-x snap-mandatory items-start overflow-x-auto overflow-y-hidden overscroll-x-contain transition-[height] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {days.map((day, index) =>
          mounted || index === 0 ? (
            <div
              key={day.id}
              id={`detalle-panel-${index}`}
              role={days.length > 1 ? "tabpanel" : undefined}
              aria-labelledby={days.length > 1 ? `detalle-tab-${index}` : undefined}
              aria-hidden={mounted ? index !== panel : undefined}
              inert={mounted && index !== panel ? true : undefined}
              className="relative w-full shrink-0 snap-start px-4"
            >
              <DayPanelBody day={day} onOpenExercise={setDetail} />
            </div>
          ) : null,
        )}
      </div>

      {days.length > 1 ? (
        <div aria-hidden="true" className="flex justify-center gap-1.5">
          {days.map((day, index) => (
            <span
              key={day.id}
              className={
                index === panel
                  ? "h-1.5 w-[18px] rounded-full bg-[var(--foreground)] transition-[width] duration-200"
                  : "size-1.5 rounded-full bg-[var(--border-strong)] transition-[width] duration-200"
              }
            />
          ))}
        </div>
      ) : null}

      <ExerciseDetailModal
        exercise={detail}
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      />
    </section>
  );
}

function DayPanelBody({ day, onOpenExercise }: { day: DetailDay; onOpenExercise: (detail: ExerciseDetail) => void }) {
  const label = day.dayName ? `Día ${day.dayOrder} · ${day.dayName}` : `Día ${day.dayOrder}`;

  return (
    <div className="grid content-start gap-4">
      <div className="grid gap-2">
        <p className="text-[11px] font-semibold uppercase leading-normal tracking-[0.08em] text-[var(--foreground-muted)]">
          {label}
        </p>
        <h3 className="font-display text-2xl font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)] [overflow-wrap:anywhere]">
          {day.groups.length === 2 ? (
            <>
              {day.groups[0]} <span className="text-[var(--accent-bright)]">&amp;</span> {day.groups[1]}
            </>
          ) : (
            (day.groups[0] ?? day.dayName) || `Día ${day.dayOrder}`
          )}
        </h3>
        <p className="font-mono text-[13px] text-[var(--foreground-muted)]">
          ~{day.minutes} min · {day.exercises.length} {day.exercises.length === 1 ? "ejercicio" : "ejercicios"} ·{" "}
          {day.seriesCount} series
        </p>
      </div>

      {day.exercises.length > 0 ? (
        <ol className="border-y border-[var(--border)]">
          {day.exercises.map((exercise) => (
            <li key={exercise.id} className="border-b border-[var(--border)] last:border-b-0">
              <button
                type="button"
                onClick={() => onOpenExercise(exercise.detail)}
                className="pressable flex min-h-[72px] w-full items-center gap-3 text-left outline-none focus-visible:shadow-[var(--focus-glow)]"
              >
                <span className="relative grid size-[52px] shrink-0 place-items-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground-subtle)]">
                  {exercise.imageUrl ? (
                    <Image alt="" fill sizes="52px" src={exercise.imageUrl} className="object-cover" />
                  ) : (
                    <Dumbbell aria-hidden="true" className="size-5" />
                  )}
                </span>
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="truncate font-display text-[15px] font-semibold text-[var(--foreground)]">
                    <span className="mr-1.5 font-mono font-medium text-[var(--foreground-muted)]">
                      {exercise.series}×
                    </span>
                    {exercise.name}
                  </span>
                  <span className="truncate text-[13px] text-[var(--foreground-muted)]">{exercise.meta}</span>
                </span>
                <ChevronRight aria-hidden="true" className="size-[18px] shrink-0 text-[var(--foreground-subtle)]" />
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="border-y border-[var(--border)] py-4 text-[15px] text-[var(--foreground-muted)]">
          Este día todavía no tiene ejercicios.
        </p>
      )}
    </div>
  );
}
