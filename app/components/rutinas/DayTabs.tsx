"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { KeyboardEvent } from "react";

import type { DayTab } from "@/app/lib/routine-week";
import { cn } from "@/app/lib/utils";

/** Z2 · una pestaña por día con su estado (DESIGN.md §12.1). `selected = null` = resumen de semana cerrada. */
export function DayTabs({
  tabs,
  selected,
  onSelect,
  panelIdPrefix,
}: {
  tabs: DayTab[];
  selected: number | null;
  onSelect: (index: number) => void;
  panelIdPrefix: string;
}) {
  const reduceMotion = useReducedMotion();

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    onSelect(next);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label="Días de la rutina"
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab, index) => {
        const isSelected = selected === index;
        const done = tab.state === "done";

        return (
          <button
            key={tab.id}
            id={`${panelIdPrefix}-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={`${panelIdPrefix}-panel-${index}`}
            tabIndex={isSelected || (selected === null && index === 0) ? 0 : -1}
            onClick={() => onSelect(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className="pressable relative grid h-16 min-w-0 content-center justify-items-center gap-1 rounded-[14px] border border-white/15 bg-[rgba(5,7,11,0.62)] px-1 outline-none focus-visible:shadow-[var(--focus-glow)]"
          >
            {isSelected ? (
              <motion.span
                aria-hidden="true"
                layoutId={`${panelIdPrefix}-tab-marker`}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-[-1px] rounded-[14px] border border-[var(--foreground)] bg-[rgba(244,246,251,0.14)]"
              />
            ) : null}
            <span className="relative font-display text-[15px] font-bold leading-none text-[var(--foreground)]">
              Día {tab.dayOrder}
            </span>
            <span
              className={cn(
                "relative flex max-w-full items-center gap-1 truncate text-[11px] font-semibold leading-none",
                done
                  ? "text-[var(--accent-bright)]"
                  : tab.state === "in_progress" || tab.state === "next"
                    ? "text-[var(--foreground)]"
                    : "text-[var(--foreground-muted)]",
              )}
            >
              {done ? <Check aria-hidden="true" className="size-3 shrink-0" strokeWidth={3} /> : null}
              {tab.state === "in_progress" ? (
                <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-[var(--accent-bright)]" />
              ) : null}
              <span className="truncate">{tab.label}</span>
              {done ? <span className="sr-only"> (hecho)</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
