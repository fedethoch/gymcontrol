"use client";

import { motion } from "framer-motion";

import { MuscleBodyView } from "@/app/components/shared/BodyMuscleFigure";
import { premiumEase } from "@/app/components/ui/motion";
import { STRONG_GROUP_SERIES } from "@/app/lib/routine-detail";
import { cn } from "@/app/lib/utils";

export type GroupVolume = { group: string; label: string; series: number };

const H2_CLASS = "font-display text-[1.375rem] font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)]";

/** Z5 · qué trabaja la rutina: cuerpo con tinta neutra y series por semana de cada grupo (DESIGN.md §19.1). */
export function MuscleBalance({ volume, fills }: { volume: GroupVolume[]; fills: Record<string, string> }) {
  const max = volume[0]?.series ?? 0;

  return (
    <section aria-labelledby="detalle-balance" className="grid gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="detalle-balance" className={H2_CLASS}>
          Qué trabajás
        </h2>
        <p className="font-mono text-[13px] text-[var(--foreground-muted)]">series por semana</p>
      </div>

      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5">
        <div aria-hidden="true" className="flex gap-1">
          <MuscleBodyView view="front" width={56} fills={fills} />
          <MuscleBodyView view="back" width={56} fills={fills} />
        </div>

        <ul className="grid gap-2.5">
          {volume.map(({ group, label, series }, index) => {
            const strong = series >= STRONG_GROUP_SERIES;
            return (
              <li key={group} className="grid grid-cols-[4rem_minmax(0,1fr)_1.5rem] items-center gap-2.5 text-[13px]">
                <span className="truncate text-[var(--foreground-muted)]">{label}</span>
                <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-[var(--card-alt)]">
                  <motion.span
                    className={cn(
                      "block h-full origin-left rounded-full",
                      strong ? "bg-[var(--foreground)]" : "bg-[var(--foreground-muted)]",
                    )}
                    style={{ width: `${max > 0 ? (series / max) * 100 : 0}%` }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.04, ease: premiumEase }}
                  />
                </span>
                <span
                  className={cn(
                    "text-right font-mono tabular-nums",
                    strong ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]",
                  )}
                >
                  {series}
                  <span className="sr-only"> series</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--foreground-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-[var(--foreground)]" />
          {STRONG_GROUP_SERIES}+ series
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-[var(--foreground-muted)]" />
          1–{STRONG_GROUP_SERIES - 1}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-[var(--strength-0)]" />
          sin trabajo
        </span>
      </p>
    </section>
  );
}
