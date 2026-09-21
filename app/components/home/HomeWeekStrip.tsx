import { Check } from "lucide-react";
import type { KeyboardEvent } from "react";

import { WEEKDAYS, type StripDay } from "@/app/lib/training-schedule";
import { cn } from "@/app/lib/utils";

/**
 * Z2 · semana L–D (DESIGN.md §10.1): emerald con check = entrenado, borde claro = hoy, borde gris = día de
 * entreno, punteado = te quedó, sin borde = descanso. Con `onSelect` cada día se toca y el hero muestra ese día.
 */
export function HomeWeekStrip({
  days,
  selectedKey,
  onSelect,
}: {
  days: StripDay[];
  selectedKey: string;
  onSelect?: (dateKey: string) => void;
}) {
  const hasPlan = days.some((day) => day.plannedDayOrder !== null);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!onSelect || (event.key !== "ArrowRight" && event.key !== "ArrowLeft")) return;
    event.preventDefault();
    const next = (index + (event.key === "ArrowRight" ? 1 : -1) + days.length) % days.length;
    onSelect(days[next].dateKey);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
  }

  return (
    <div
      role={onSelect ? "tablist" : "list"}
      aria-label="Tu semana"
      className="grid grid-cols-7 gap-1.5"
    >
      {days.map((day, index) => {
        const selected = day.dateKey === selectedKey;
        const { name, letter } = WEEKDAYS[day.iso - 1];
        const status = day.trained
          ? "entrenado"
          : day.plannedDayOrder !== null
            ? `día ${day.plannedDayOrder}${day.missed ? ", te quedó" : ""}`
            : hasPlan
              ? "descanso"
              : "sin entrenar";
        const circle = cn(
          "grid h-[38px] w-full place-items-center rounded-full border-2 font-display text-[13px] font-bold transition-[background-color,border-color,color] duration-150 motion-reduce:transition-none",
          day.trained
            ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
            : selected && !day.isToday
              ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
              : day.isToday
                ? "border-[var(--foreground)] text-[var(--foreground)]"
                : day.missed
                  ? "border-dashed border-[var(--border-strong)] text-[var(--foreground-muted)]"
                  : day.plannedDayOrder !== null || !hasPlan
                    ? "border-[var(--border-strong)] text-[var(--foreground-muted)]"
                    : "border-transparent text-[var(--foreground-muted)]",
          day.trained && selected && "ring-2 ring-[var(--foreground)] ring-offset-2 ring-offset-[var(--background)]",
        );
        const content = (
          <>
            <span aria-hidden="true" className={circle}>
              {day.trained ? <Check className="size-4" strokeWidth={3} /> : letter}
            </span>
            <span className="sr-only">
              {name}
              {day.isToday ? " (hoy)" : ""}: {status}
            </span>
          </>
        );

        if (!onSelect) {
          return (
            <div key={day.dateKey} role="listitem" className="grid">
              {content}
            </div>
          );
        }

        return (
          <button
            key={day.dateKey}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls="home-hero"
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(day.dateKey)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className="pressable grid h-11 place-items-center rounded-full outline-none focus-visible:shadow-[var(--focus-glow)]"
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
