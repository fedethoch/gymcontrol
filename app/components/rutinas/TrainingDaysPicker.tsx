"use client";

import { WEEKDAYS } from "@/app/lib/training-schedule";
import { cn } from "@/app/lib/utils";

/** Chips Lu…Do, cuántos faltan y cómo queda la semana (DESIGN.md §12.3). Controlado. */
export function TrainingDaysPicker({
  dayCount,
  dayTitles,
  value,
  onChange,
}: {
  dayCount: number;
  /** Nombre corto de cada día de la rutina, en orden ("Pecho & Tríceps"). */
  dayTitles: string[];
  value: readonly number[];
  onChange: (next: number[]) => void;
}) {
  const selected = [...value].sort((a, b) => a - b);
  const missing = dayCount - selected.length;
  const status =
    missing === 0
      ? "Listo"
      : missing > 0
        ? missing === 1
          ? "Te falta 1 día"
          : `Te faltan ${missing} días`
        : missing === -1
          ? "Sobra 1 día: sacá uno"
          : `Sobran ${-missing} días: sacá algunos`;

  function toggle(iso: number) {
    onChange(
      selected.includes(iso) ? selected.filter((day) => day !== iso) : [...selected, iso].sort((a, b) => a - b),
    );
  }

  return (
    <div className="grid gap-4">
      <div role="group" aria-label="Días de la semana" className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((day) => {
          const on = selected.includes(day.iso);
          return (
            <button
              key={day.iso}
              type="button"
              aria-pressed={on}
              aria-label={day.name}
              onClick={() => toggle(day.iso)}
              className={cn(
                "h-12 min-w-0 rounded-[14px] border font-display text-[15px] font-bold outline-none transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:shadow-[var(--focus-glow)] active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
                on
                  ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                  : "border-[var(--border-strong)] text-[var(--foreground-muted)]",
              )}
            >
              {day.short}
            </button>
          );
        })}
      </div>

      <div className="-mt-1 flex items-baseline justify-between gap-3">
        <p
          role="status"
          className={cn("text-[13px]", missing === 0 ? "text-[var(--accent-bright)]" : "text-[var(--foreground-muted)]")}
        >
          {status}
        </p>
        <span className="font-mono text-[13px] tabular-nums text-[var(--foreground)]">
          {selected.length} de {dayCount}
        </span>
      </div>

      <ol aria-label="Así queda tu semana" className="border-t border-[var(--border)]">
        {dayTitles.map((title, index) => {
          const iso = selected[index];
          return (
            <li key={index} className="flex min-h-12 items-center gap-3 border-b border-[var(--border)]">
              <span
                className={cn(
                  "w-9 shrink-0 font-mono text-[13px]",
                  iso ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]",
                )}
              >
                {iso ? WEEKDAYS[iso - 1].abbr : "—"}
              </span>
              <span className="shrink-0 font-display text-[15px] font-semibold text-[var(--foreground)]">
                Día {index + 1}
              </span>
              <span className="min-w-0 truncate text-sm text-[var(--foreground-muted)]">{title}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
