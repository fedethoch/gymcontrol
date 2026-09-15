import { Check } from "lucide-react";

import { cn } from "@/app/lib/utils";
import { getCurrentWeekDays } from "@/app/lib/week";

/** Z2 · semana L–D: emerald con check = entrenado, borde claro = hoy. */
export function HomeWeekStrip({ completedDates }: { completedDates: Set<string> }) {
  return (
    <ol aria-label="Entrenamientos de esta semana" className="grid grid-cols-7 gap-1.5">
      {getCurrentWeekDays().map((day) => {
        const done = completedDates.has(day.key);

        return (
          <li
            key={day.key}
            className={cn(
              "grid h-[38px] place-items-center rounded-full border-2 font-display text-[13px] font-bold",
              done
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                : day.isToday
                  ? "border-[var(--foreground)] text-[var(--foreground)]"
                  : "border-[var(--border-strong)] text-[var(--foreground-muted)]",
              done && day.isToday && "ring-2 ring-[var(--foreground)] ring-offset-2 ring-offset-[var(--background)]",
            )}
          >
            {done ? (
              <Check aria-hidden="true" className="size-4" strokeWidth={3} />
            ) : (
              <span aria-hidden="true">{day.label}</span>
            )}
            <span className="sr-only">
              {day.name}
              {day.isToday ? " (hoy)" : ""}: {done ? "entrenado" : "sin entrenar"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
