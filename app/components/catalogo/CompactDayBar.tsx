"use client";

import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { useId, type KeyboardEvent, type MouseEvent } from "react";

import { CATALOG_ICON_BUTTON } from "@/app/components/catalogo/CatalogTopBar";
import { FilterTrigger } from "@/app/components/shared/FilterPanel";
import { premiumEase } from "@/app/components/ui/motion";
import { dayCountLabel, nextRadioIndex, type DayOption } from "@/app/lib/routine-catalog";
import { cn } from "@/app/lib/utils";

/** Barra compacta que aparece arriba al pasar la rueda: cambiar días sin volver arriba (DESIGN.md §16.1). */
export function CompactDayBar({
  options,
  value,
  onChange,
  onOpenSearch,
  activeFilterCount,
  onOpenFilters,
}: {
  options: readonly DayOption[];
  value: DayOption;
  onChange: (value: DayOption) => void;
  onOpenSearch: () => void;
  activeFilterCount: number;
  onOpenFilters: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const markerId = useId();

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = nextRadioIndex(event.key, index, options.length);
    if (next === null) return;
    event.preventDefault();
    onChange(options[next]);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=radio]")[next]?.focus();
  }

  return (
    <div className="border-b border-[var(--border)] bg-[var(--background)] px-4 pb-1">
      <div className="flex h-11 items-center justify-between gap-3">
        <p className="font-display text-[15px] font-semibold text-[var(--foreground)]">Catálogo</p>
        <div className="-mr-2 flex items-center">
          <button type="button" aria-label="Buscar rutinas" onClick={onOpenSearch} className={CATALOG_ICON_BUTTON}>
            <Search aria-hidden="true" className="size-5" />
          </button>
          <FilterTrigger activeCount={activeFilterCount} onClick={onOpenFilters} />
        </div>
      </div>
      <div
        role="radiogroup"
        aria-label="Días por semana"
        className="grid"
        style={{ gridTemplateColumns: `1.6fr repeat(${Math.max(0, options.length - 1)}, minmax(0, 1fr))` }}
      >
        {options.map((option, index) => {
          const selected = option === value;
          const word = option === "all";
          return (
            <button
              key={String(option)}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={word ? "Todas" : dayCountLabel(option)}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(option)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className="pressable relative flex min-h-11 items-center justify-center rounded-lg outline-none focus-visible:shadow-[var(--focus-glow)]"
            >
              <span
                aria-hidden="true"
                className={cn(
                  selected ? (word ? "text-base" : "text-[1.375rem]") : word ? "text-[13px]" : "text-[15px]",
                  "font-display leading-none tabular-nums",
                  selected
                    ? "font-extrabold tracking-[-0.04em] text-[var(--foreground)]"
                    : "font-semibold text-[var(--foreground-muted)]",
                )}
              >
                {word ? "Todas" : option}
              </span>
              {selected ? (
                <motion.span
                  aria-hidden="true"
                  layoutId={`${markerId}-marker`}
                  transition={{ duration: 0.2, ease: premiumEase }}
                  className="absolute bottom-0.5 h-[3px] w-[18px] rounded-full bg-[var(--foreground)]"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
