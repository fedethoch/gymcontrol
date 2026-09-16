"use client";

import { useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, X } from "lucide-react";

import { RegistroSheet } from "@/app/components/registro/RegistroSheet";
import { ICON_BUTTON_CLASS } from "@/app/components/registro/styles";
import { addDaysToDateKey, getWeekStartDateKey } from "@/app/lib/local-date";
import { buildWeekStrip, formatWeekRange } from "@/app/lib/meal-diary";
import { MEAL_LOG_MAX_PAST_DAYS } from "@/app/lib/nutrition-types";
import { cn } from "@/app/lib/utils";

const WEEKDAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

/** Elegir el día del registro: semana con los días registrados y "Otra fecha" (hasta 365 días). */
export function DayPickerSheet({
  open,
  onOpenChange,
  logDate,
  todayKey,
  loggedDates,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logDate: string;
  todayKey: string;
  loggedDates: ReadonlySet<string>;
  onNavigate: (dateKey: string) => void;
}) {
  const minKey = addDaysToDateKey(todayKey, -MEAL_LOG_MAX_PAST_DAYS);
  const [weekStart, setWeekStart] = useState(() => getWeekStartDateKey(logDate));
  const strip = buildWeekStrip({ weekStart, todayKey, minKey, selectedKey: logDate, logged: loggedDates });
  const weekLabel =
    weekStart === getWeekStartDateKey(todayKey) ? "Esta semana" : formatWeekRange(weekStart, todayKey);

  return (
    <RegistroSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Elegí el día"
      description="Semana con los días que registraste comidas. También podés elegir otra fecha."
      headerAction={
        <button type="button" onClick={() => onOpenChange(false)} aria-label="Cerrar" className={`${ICON_BUTTON_CLASS} -mr-2`}>
          <X aria-hidden="true" className="size-5" />
        </button>
      }
    >
      <div className="grid content-start gap-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={!strip.canPrev}
            onClick={() => setWeekStart(addDaysToDateKey(weekStart, -7))}
            aria-label="Semana anterior"
            className={cn(ICON_BUTTON_CLASS, "-ml-2 disabled:opacity-30")}
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <p className="text-sm font-semibold text-[var(--foreground)]" aria-live="polite">
            {weekLabel}
          </p>
          <button
            type="button"
            disabled={!strip.canNext}
            onClick={() => setWeekStart(addDaysToDateKey(weekStart, 7))}
            aria-label="Semana siguiente"
            className={cn(ICON_BUTTON_CLASS, "-mr-2 disabled:opacity-30")}
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </div>

        <ol aria-label="Días de la semana" className="grid grid-cols-7 gap-1">
          {strip.days.map((day, index) => (
            <li key={day.key} className="grid justify-items-center gap-1.5">
              <span aria-hidden="true" className="text-[12px] font-semibold text-[var(--foreground-muted)]">
                {day.letter}
              </span>
              <button
                type="button"
                disabled={day.disabled}
                aria-current={day.selected ? "date" : undefined}
                aria-label={`${WEEKDAY_NAMES[index]} ${day.day}${day.today ? ", hoy" : ""}${day.logged ? ", con comidas" : ""}`}
                onClick={() => {
                  if (!day.selected) onNavigate(day.key);
                  else onOpenChange(false);
                }}
                className={cn(
                  "pressable relative grid size-11 place-items-center rounded-full border-2 font-display text-[14px] font-bold tabular-nums outline-none focus-visible:shadow-[var(--focus-glow)] disabled:pointer-events-none disabled:opacity-30",
                  day.selected
                    ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                    : day.logged
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                      : day.today
                        ? "border-[var(--foreground)] text-[var(--foreground)]"
                        : "border-[var(--border-strong)] text-[var(--foreground-muted)]",
                )}
              >
                {day.day}
                {day.selected && day.logged ? (
                  <span className="absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
                    <Check aria-hidden="true" className="size-2.5" strokeWidth={3.5} />
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ol>
        <p className="text-[13px] text-[var(--foreground-muted)]">En verde, los días con comidas registradas.</p>

        <label className="pressable relative flex min-h-12 items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
          <span className="flex items-center gap-2 text-[15px] font-semibold text-[var(--foreground)]">
            <CalendarDays aria-hidden="true" className="size-[18px] text-[var(--foreground-muted)]" />
            Otra fecha
          </span>
          <span className="text-[13px] text-[var(--foreground-muted)]">hasta {MEAL_LOG_MAX_PAST_DAYS} días atrás</span>
          <input
            type="date"
            aria-label="Elegir otra fecha"
            min={minKey}
            max={todayKey}
            value={logDate}
            onClick={(event) => event.currentTarget.showPicker?.()}
            onChange={(event) => {
              const value = event.target.value;
              if (value && value >= minKey && value <= todayKey && value !== logDate) onNavigate(value);
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
    </RegistroSheet>
  );
}
