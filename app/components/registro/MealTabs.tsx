"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { premiumEase } from "@/app/components/ui/motion";
import type { DiaryTab } from "@/app/lib/meal-diary";
import { cn } from "@/app/lib/utils";

const NAV_KEYS = ["ArrowRight", "ArrowLeft", "Home", "End"];

/** Una pestaña por comida con su estado (DESIGN.md §14). `selectedKey = null` = resumen del día cerrado. */
export function MealTabs({
  tabs,
  selectedKey,
  onSelect,
  idPrefix,
}: {
  tabs: DiaryTab[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  idPrefix: string;
}) {
  const reduceMotion = useReducedMotion();
  const stripRef = useRef<HTMLDivElement>(null);
  const many = tabs.length > 4;

  // La pestaña elegida siempre queda a la vista (hay más de 4 cuando se suman snacks).
  useEffect(() => {
    const strip = stripRef.current;
    const tab = selectedKey
      ? strip?.querySelector<HTMLElement>(`[data-tab-key="${CSS.escape(selectedKey)}"]`)
      : null;
    if (!strip || !tab) return;

    const gutter = 16;
    const start = tab.offsetLeft - gutter;
    const end = tab.offsetLeft + tab.offsetWidth + gutter - strip.clientWidth;

    if (strip.scrollLeft > start) strip.scrollLeft = start;
    else if (strip.scrollLeft < end) strip.scrollLeft = end;
  }, [selectedKey, tabs.length]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!NAV_KEYS.includes(event.key)) return;
    event.preventDefault();

    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;

    onSelect(tabs[next].key);
    stripRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
  }

  const focusIndex = Math.max(0, tabs.findIndex((tab) => tab.key === selectedKey));

  return (
    <motion.div
      ref={stripRef}
      layoutScroll
      role="tablist"
      aria-label="Comidas del día"
      className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab, index) => {
        const isSelected = tab.key === selectedKey;

        return (
          <button
            key={tab.key}
            id={`${idPrefix}-tab-${tab.key}`}
            data-tab-key={tab.key}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={`${idPrefix}-panel-${tab.key}`}
            tabIndex={index === focusIndex ? 0 : -1}
            onClick={() => onSelect(tab.key)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "pressable relative grid h-16 shrink-0 content-center [@media(max-height:700px)]:h-14 justify-items-center gap-1.5 rounded-[14px] outline-none focus-visible:shadow-[var(--focus-glow)]",
              // Hasta 4 entran justas ("Desayuno" a 375px); con más, cada una mide lo que su nombre y la tira scrollea.
              many ? "min-w-[4.75rem] max-w-[9.5rem] px-3" : "w-[calc((100%-1.125rem)/4)] px-1",
            )}
          >
            {isSelected ? (
              <motion.span
                aria-hidden="true"
                layoutId={`${idPrefix}-tab-marker`}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: premiumEase }}
                className="absolute inset-0 rounded-[14px] border border-[var(--border-strong)] bg-[var(--card)]"
              />
            ) : null}
            <span className="relative max-w-full truncate font-display text-[14px] font-bold leading-none text-[var(--foreground)] max-[374px]:text-[13px]">
              {tab.label}
            </span>
            <TabStatus tab={tab} />
          </button>
        );
      })}
    </motion.div>
  );
}

function TabStatus({ tab }: { tab: DiaryTab }) {
  if (tab.status === "logged") {
    return (
      <span className="relative flex items-center gap-1 font-mono text-[12px] leading-none tabular-nums text-[var(--foreground-muted)]">
        <Check aria-hidden="true" className="size-3 shrink-0 text-[var(--accent-bright)]" strokeWidth={3} />
        {tab.kcal}
        <span className="sr-only"> kcal, registrada</span>
      </span>
    );
  }

  if (tab.status === "next") {
    return (
      <span className="relative text-[12px] font-semibold leading-none text-[var(--accent-bright)]">
        Sigue
        <span className="sr-only">, sin registrar</span>
      </span>
    );
  }

  return (
    <span className="relative text-[12px] leading-none text-[var(--foreground-muted)]">
      <span aria-hidden="true">—</span>
      <span className="sr-only">sin registrar</span>
    </span>
  );
}
