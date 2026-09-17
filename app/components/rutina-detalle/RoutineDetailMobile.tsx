"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bookmark } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CompactDetailAction, DetailAction, type ActionContext } from "@/app/components/rutina-detalle/DetailAction";
import { DetailDays, type DetailDay } from "@/app/components/rutina-detalle/DetailDays";
import { DetailTopBar } from "@/app/components/rutina-detalle/DetailTopBar";
import { MuscleBalance, type GroupVolume } from "@/app/components/rutina-detalle/MuscleBalance";
import { WeekStats } from "@/app/components/rutinas/DayPanel";
import { RoutineCover } from "@/app/components/rutinas/RoutineCover";
import { premiumEase } from "@/app/components/ui/motion";

export type RoutineDetailView = {
  title: string;
  fullName: string;
  description: string;
  imageUrl: string;
  difficultyLabel: string;
  objectiveLabel: string;
  dayCount: number;
  averageMinutes: number;
  seriesCount: number;
  backHref: string;
  volume: GroupVolume[];
  fills: Record<string, string>;
  equipment: string[];
  days: DetailDay[];
};

const PILL_CLASS =
  "inline-flex h-[30px] w-fit max-w-full items-center gap-1.5 rounded-full border border-white/15 bg-[rgba(5,7,11,0.72)] px-3 text-xs font-semibold text-white";

function StatePill({ view, context }: { view: RoutineDetailView; context: ActionContext }) {
  const days = `${view.dayCount} ${view.dayCount === 1 ? "día" : "días"}`;

  switch (context.state) {
    case "saved":
      return (
        <p className={PILL_CLASS}>
          <Bookmark aria-hidden="true" className="size-3 fill-current" />
          <span className="truncate">Guardada · {view.difficultyLabel} · {days}</span>
        </p>
      );
    case "active":
      return (
        <p className={PILL_CLASS}>
          <span aria-hidden="true" className="size-[7px] shrink-0 rounded-full bg-[var(--accent)]" />
          <span className="truncate">Tu rutina activa · {days}</span>
        </p>
      );
    case "archived":
      return (
        <p className={PILL_CLASS}>
          <span className="text-[var(--warning)]">Ya no disponible</span> · {days}
        </p>
      );
    default:
      return (
        <p className={PILL_CLASS}>
          {view.difficultyLabel} · {days}
        </p>
      );
  }
}

/**
 * Detalle de rutina mobile (DESIGN.md §19): portada con nombre y acción, stats, qué trabaja y los días.
 * Cuando la acción sale de la pantalla hacia arriba aparece una barra compacta con la misma acción.
 */
export function RoutineDetailMobile({ view, context }: { view: RoutineDetailView; context: ActionContext }) {
  const actionRef = useRef<HTMLDivElement>(null);
  const [actionAbove, setActionAbove] = useState(false);
  const withCompactBar = context.state !== "archived";

  useEffect(() => {
    const target = actionRef.current;
    if (!target || !withCompactBar) return;
    const observer = new IntersectionObserver(([entry]) => {
      setActionAbove(!entry.isIntersecting && entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0));
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [withCompactBar]);

  return (
    <>
      <RoutineCover imageUrl={view.imageUrl} />

      <div className="sticky top-[env(safe-area-inset-top)] z-30 -mx-4 h-0">
        <AnimatePresence>
          {actionAbove ? (
            <motion.div
              key="compact-bar"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: premiumEase }}
              className="absolute inset-x-0 top-0 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--background)] px-4 py-2"
            >
              <div className="grid min-w-0 flex-1 gap-0.5">
                <p className="truncate font-display text-[15px] font-semibold text-[var(--foreground)]">{view.title}</p>
                <p className="truncate text-[12px] text-[var(--foreground-muted)]">
                  {view.dayCount} {view.dayCount === 1 ? "día" : "días"}
                  {view.averageMinutes > 0 ? ` · ~${view.averageMinutes} min` : ""}
                </p>
              </div>
              <CompactDetailAction context={context} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <DetailTopBar backHref={view.backHref} name={view.fullName} context={context} />

      <div className="grid gap-3.5 pt-[clamp(7rem,28svh,12rem)]">
        <StatePill view={view} context={context} />
        <h1 className="font-display text-[clamp(2.75rem,14vw,3.625rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.05em] text-white [overflow-wrap:anywhere]">
          {view.title === view.fullName ? (
            view.title
          ) : (
            <>
              <span aria-hidden="true">{view.title}</span>
              <span className="sr-only">{view.fullName}</span>
            </>
          )}
        </h1>
        {view.description ? (
          <p className="max-w-[34ch] text-[15px] leading-snug text-white/80">{view.description}</p>
        ) : null}
      </div>

      <div ref={actionRef} className="mt-6">
        <DetailAction context={context} />
      </div>

      {view.days.length > 0 ? (
        <div className="mt-7 grid gap-9 pb-4">
          <WeekStats
            stats={[
              { label: view.dayCount === 1 ? "Día" : "Días", value: view.dayCount },
              { label: "Por día", value: view.averageMinutes, prefix: "~", unit: " min" },
              { label: "Series", value: view.seriesCount, unit: "/sem" },
            ]}
          />
          {view.volume.length > 0 ? <MuscleBalance volume={view.volume} fills={view.fills} /> : null}
          <DetailDays days={view.days} />
          <p className="font-mono text-[13px] leading-relaxed text-[var(--foreground-muted)]">
            {[view.objectiveLabel, ...view.equipment].join(" · ")}
          </p>
        </div>
      ) : (
        <p className="mt-7 border-y border-[var(--border)] py-4 text-[15px] text-[var(--foreground-muted)]">
          Esta rutina todavía no tiene días.
        </p>
      )}
    </>
  );
}
