import { CalendarRange, Dumbbell, UtensilsCrossed } from "lucide-react";

import { getCurrentWeekDays, WEEK_DAY_LABELS } from "@/app/lib/week";

type WeekCombinedCardProps = {
  completedDates: Set<string>;
  loggedDates: Set<string>;
  trainingCount: number;
  nutritionCount: number;
};

type DayCell = { key: string; label: string; active: boolean; isToday: boolean };

function buildWeek(dates: Set<string>): DayCell[] {
  return getCurrentWeekDays().map((day) => ({
    key: day.key,
    label: day.label,
    active: dates.has(day.key),
    isToday: day.isToday,
  }));
}

/**
 * Semana combinada — reemplaza los dos WeekStripCard separados (entreno + nutrición).
 * Un header de días (L–D) compartido y dos filas de puntos etiquetadas por icono.
 * Compacta: entra tanto en media columna mobile como en 1/3 desktop.
 * Las series se distinguen por icono, no por color: acento único emerald.
 */
export function WeekCombinedCard({
  completedDates,
  loggedDates,
  trainingCount,
  nutritionCount,
}: WeekCombinedCardProps) {
  const trainingWeek = buildWeek(completedDates);
  const nutritionWeek = buildWeek(loggedDates);

  return (
    <div className="flex h-full flex-col gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-center gap-1.5">
        <CalendarRange aria-hidden="true" className="size-3.5 shrink-0 text-[var(--accent-bright)]" />
        <h3 className="truncate text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--foreground-muted)]">
          Esta semana
        </h3>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-2">
        {/* Header de días — compartido por ambas filas */}
        <WeekLine gutter={<span aria-hidden="true" />}>
          {WEEK_DAY_LABELS.map((label, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="flex-1 text-center text-[10px] font-semibold text-[var(--foreground-muted)]"
            >
              {label}
            </span>
          ))}
        </WeekLine>

        <WeekLine
          gutter={<Dumbbell aria-hidden="true" className="size-3.5 text-[var(--foreground-muted)]" />}
        >
          {trainingWeek.map((day) => (
            <WeekDot key={day.key} day={day} series="Entreno" stateVerb="entrenado" />
          ))}
        </WeekLine>

        <WeekLine
          gutter={<UtensilsCrossed aria-hidden="true" className="size-3.5 text-[var(--foreground-muted)]" />}
        >
          {nutritionWeek.map((day) => (
            <WeekDot key={day.key} day={day} series="Nutrición" stateVerb="registrado" />
          ))}
        </WeekLine>
      </div>

      <p className="text-xs font-medium tabular-nums text-[var(--foreground-muted)]">
        Entreno <span className="text-[var(--foreground)]">{trainingCount}</span>/7
        <span className="px-1.5 text-[var(--foreground-muted)]">·</span>
        Nutrición <span className="text-[var(--foreground)]">{nutritionCount}</span>/7
      </p>
    </div>
  );
}

function WeekLine({ gutter, children }: { gutter: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex w-4 shrink-0 items-center justify-center">{gutter}</span>
      <div className="flex flex-1 items-center justify-between gap-0.5">{children}</div>
    </div>
  );
}

function WeekDot({ day, series, stateVerb }: { day: DayCell; series: string; stateVerb: string }) {
  return (
    <span className="flex flex-1 justify-center">
      <span
        role="img"
        aria-label={`${series} ${day.label}: ${day.active ? stateVerb : "sin registro"}${day.isToday ? " (hoy)" : ""}`}
        className={`size-3.5 rounded-full ${
          day.active
            ? "bg-[var(--accent)]"
            : day.isToday
              ? "border border-[var(--accent)] bg-transparent"
              : "bg-[var(--card-alt)]"
        }`}
      />
    </span>
  );
}
