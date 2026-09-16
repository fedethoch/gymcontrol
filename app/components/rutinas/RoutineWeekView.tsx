"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

import { DayPanel, WeekStats, type WeekDay } from "@/app/components/rutinas/DayPanel";
import { DayTabs } from "@/app/components/rutinas/DayTabs";
import { StartDock } from "@/app/components/rutinas/StartDock";
import { ExerciseDetailModal, type ExerciseDetail } from "@/app/components/shared/ExerciseDetailModal";
import { resolveDockAction } from "@/app/lib/routine-week";

const CHIP_CLASS =
  "inline-flex h-[30px] w-fit items-center gap-1.5 rounded-full bg-[rgba(5,7,11,0.72)] px-3 text-xs font-semibold uppercase tracking-[0.06em] text-white";

const subscribeNothing = () => () => {};

export type WeekSummary ={ completed: number; total: number; streak: number; series: number };

/**
 * Z2–Z4 de la semana activa mobile (DESIGN.md §12): pestañas, panel por día con scroll-snap horizontal y dock.
 * `initialIndex = null` = semana cerrada: abre un panel resumen antes de los días.
 */
export function RoutineWeekView({
  days,
  initialIndex,
  trainedToday,
  todayDoneOrder,
  weekdayLabel,
  summary,
}: {
  days: WeekDay[];
  initialIndex: number | null;
  trainedToday: boolean;
  todayDoneOrder: number | null;
  weekdayLabel: string;
  summary: WeekSummary;
}) {
  const hasSummary = initialIndex === null;
  const offset = hasSummary ? 1 : 0;
  const startPanel = hasSummary ? 0 : initialIndex;
  const panelCount = days.length + offset;

  const pagerRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | undefined>(undefined);
  const [panel, setPanel] = useState(startPanel);
  // Antes de hidratar solo se pinta el panel inicial: sin salto desde el primer día.
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const [detail, setDetail] = useState<ExerciseDetail | null>(null);

  useLayoutEffect(() => {
    const pager = pagerRef.current;
    if (mounted && pager) pager.scrollLeft = startPanel * pager.clientWidth;
  }, [mounted, startPanel]);

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
      const next = Math.min(panelCount - 1, Math.max(0, Math.round(pager.scrollLeft / pager.clientWidth)));
      setPanel(next);
    }, 90);
  }

  const selectedDay = panel - offset >= 0 ? days[panel - offset] : null;
  const total = days.length;

  function chipFor(day: WeekDay) {
    switch (day.tab.state) {
      case "in_progress":
        return (
          <p className={CHIP_CLASS}>
            <span aria-hidden="true" className="size-[7px] rounded-full bg-[var(--accent-bright)]" />
            <span className="text-[var(--accent-bright)]">En curso</span>
          </p>
        );
      case "next":
        return (
          <p className={CHIP_CLASS}>
            {trainedToday ? `Próximo · Día ${day.dayOrder} de ${total}` : `Hoy · ${weekdayLabel}`}
          </p>
        );
      case "done":
        return (
          <p className={CHIP_CLASS}>
            {day.tab.label} · hecho
            <Check aria-hidden="true" className="size-3.5 text-[var(--accent-bright)]" strokeWidth={3} />
          </p>
        );
      default:
        return <p className={CHIP_CLASS}>Día {day.dayOrder} de {total}</p>;
    }
  }

  const panels = [
    ...(hasSummary ? [{ key: "summary", node: <WeekDoneSummary days={days} summary={summary} /> }] : []),
    ...days.map((day) => ({
      key: day.id,
      node: <DayPanel day={day} chip={chipFor(day)} onOpenExercise={setDetail} />,
    })),
  ];

  return (
    <>
      <DayTabs
        tabs={days.map((day) => day.tab)}
        selected={selectedDay ? panel - offset : null}
        onSelect={(index) => goTo(index + offset)}
        panelIdPrefix="rutina"
      />

      <div
        ref={pagerRef}
        onScroll={onScroll}
        className="-mx-4 flex snap-x snap-mandatory items-start overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {panels.map(({ key, node }, index) =>
          mounted || index === startPanel ? (
            <div
              key={key}
              id={index >= offset ? `rutina-panel-${index - offset}` : "rutina-panel-resumen"}
              role="tabpanel"
              aria-labelledby={index >= offset ? `rutina-tab-${index - offset}` : undefined}
              aria-label={index < offset ? "Resumen de la semana" : undefined}
              aria-hidden={mounted ? index !== panel : undefined}
              inert={mounted && index !== panel ? true : undefined}
              className="relative w-full shrink-0 snap-start px-4"
            >
              {node}
            </div>
          ) : null,
        )}
      </div>

      {selectedDay ? (
        <StartDock
          action={resolveDockAction(selectedDay.tab, { trainedToday, todayDoneOrder })}
          href={selectedDay.href}
        />
      ) : null}

      <ExerciseDetailModal
        exercise={detail}
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      />
    </>
  );
}

/** Semana cerrada: la semana pasa a ser el protagonista (DESIGN.md §12.2). */
function WeekDoneSummary({ days, summary }: { days: WeekDay[]; summary: WeekSummary }) {
  return (
    <div className="grid content-start gap-6">
      <div className="grid gap-3.5 pt-[clamp(6rem,24svh,9.5rem)]">
        <p className={CHIP_CLASS}>Semana completa</p>
        <h2 className="font-display text-[clamp(2.75rem,13vw,3.25rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.05em] text-white">
          Semana <em className="not-italic text-[var(--accent-bright)]">cerrada</em>
        </h2>
        <p className="text-[15px] font-medium leading-snug text-white/80">El lunes arranca una nueva semana.</p>
      </div>

      <WeekStats
        stats={[
          { label: "Entrenos", value: summary.completed, unit: `/${summary.total}` },
          { label: "Racha", value: summary.streak, unit: " sem" },
          { label: "Series", value: summary.series },
        ]}
      />

      <section aria-label="Tu semana" className="grid gap-2">
        <h3 className="font-display text-[1.375rem] font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)]">
          Tu semana
        </h3>
        <ol className="border-y border-[var(--border)]">
          {days.map((day) => (
            <li key={day.id} className="border-b border-[var(--border)] last:border-b-0">
              <Link
                href={day.href}
                className="pressable flex min-h-[72px] items-center gap-3 outline-none focus-visible:shadow-[var(--focus-glow)]"
              >
                <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
                  <Check aria-hidden="true" className="size-3.5" strokeWidth={3.2} />
                </span>
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="truncate font-display text-[15px] font-semibold text-[var(--foreground)]">
                    {day.titleGroups.length > 0 ? day.titleGroups.join(" & ") : day.dayName}
                  </span>
                  <span className="truncate text-[13px] text-[var(--foreground-muted)]">
                    {day.doneLabel ? `${day.doneLabel} · ` : ""}
                    {day.exercises.length} ejercicios
                  </span>
                </span>
                <ChevronRight aria-hidden="true" className="size-[18px] shrink-0 text-[var(--foreground-subtle)]" />
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
