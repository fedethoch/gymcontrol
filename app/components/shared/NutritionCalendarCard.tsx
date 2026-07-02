"use client";

import { useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/Card";

const WEEK_LABELS = ["L", "M", "M", "J", "V", "S", "D"] as const;

export function NutritionCalendarCard({
  loggedDates,
  weeks = 10,
  bare = false,
  variant = "heatmap",
}: {
  loggedDates: Set<string>;
  weeks?: number;
  bare?: boolean;
  variant?: "heatmap" | "weekly";
}) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = formatDateOnly(today);

  // ── Vista semanal ──
  if (variant === "weekly") {
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const weekDays = WEEK_LABELS.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = formatDateOnly(d);
      return { key, label, logged: loggedDates.has(key), isToday: key === todayKey };
    });

    const weekCalendar = (
      <div className="flex w-full items-end justify-between gap-0.5">
        {weekDays.map((day) => (
          <div key={day.key} className="flex flex-1 flex-col items-center gap-1.5">
            <span aria-hidden="true" className="text-[10px] font-semibold text-[var(--foreground-muted)]">{day.label}</span>
            <span
              role="img"
              aria-label={dayLabel(day.key, day.logged, day.isToday)}
              className={`size-4 rounded-full ${
                day.logged
                  ? "bg-[var(--accent)]"
                  : day.isToday
                    ? "border border-[var(--accent)] bg-transparent"
                    : "bg-[var(--card-alt)]"
              }`}
            />
          </div>
        ))}
      </div>
    );

    if (bare) return weekCalendar;

    return (
      <Card className="flex h-full flex-col overflow-hidden border-[var(--border)] bg-[var(--card)]">
        <CardContent className="flex-1 p-3">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-lg border border-[var(--border)] bg-[var(--card-alt)] text-[var(--accent-bright)]">
              <UtensilsCrossed className="size-4" />
            </span>
            <h2 className="font-display text-sm font-semibold leading-tight text-white">Nutrición</h2>
          </div>
          <div className="mt-3">{weekCalendar}</div>
        </CardContent>
      </Card>
    );
  }

  // ── Vista heatmap (default) ──
  const totalDays = weeks * 7;

  const days: { key: string; logged: boolean; isToday: boolean; isPast: boolean }[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = formatDateOnly(date);
    days.push({
      key,
      logged: loggedDates.has(key),
      isToday: i === 0,
      isPast: i > 0,
    });
  }

  const firstWeekday = new Date(days[0].key).getDay();
  const leadingOffset = (firstWeekday + 6) % 7;
  const padded = [...Array.from({ length: leadingOffset }, () => null), ...days];

  const calendar = (
    <div className="relative w-full overflow-hidden">
      {hoveredKey && hoverPos ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--card-alt)] px-2 py-1 text-xs font-medium text-white shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
          style={{ left: hoverPos.x, top: hoverPos.y - 8 }}
        >
          {formatDateLabel(hoveredKey)}
        </div>
      ) : null}
      <div
        className="mx-auto grid w-fit gap-[3px]"
        style={{
          gridTemplateRows: "repeat(7, minmax(0, 1fr))",
          gridAutoFlow: "column",
        }}
      >
        {padded.map((day, index) =>
          day ? (
            <span
              key={day.key}
              onMouseEnter={(event) => {
                setHoveredKey(day.key);
                const container = event.currentTarget.parentElement?.parentElement;
                const containerRect = container?.getBoundingClientRect();
                const rect = event.currentTarget.getBoundingClientRect();
                setHoverPos({
                  x: rect.left + rect.width / 2 - (containerRect?.left ?? 0),
                  y: rect.top - (containerRect?.top ?? 0),
                });
              }}
              onMouseLeave={() =>
                setHoveredKey((current) => (current === day.key ? null : current))
              }
              role="img"
              aria-label={dayLabel(day.key, day.logged, day.isToday)}
              className={`size-[10px] rounded-[2px] ${
                day.logged
                  ? "bg-[var(--accent)]"
                  : day.isToday
                    ? "border border-[var(--accent)] bg-transparent"
                    : "bg-[var(--card-alt)]"
              }`}
            />
          ) : (
            <span key={`pad-${index}`} className="size-[10px]" />
          ),
        )}
      </div>
    </div>
  );

  if (bare) {
    return calendar;
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden border-[var(--border)] bg-[var(--card)]">
      <CardContent className="flex-1 p-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="grid size-7 shrink-0 place-items-center rounded-lg border border-[var(--border)] bg-[var(--card-alt)] text-[var(--accent-bright)]"
          >
            <UtensilsCrossed className="size-4" />
          </span>
          <h2 className="font-display text-sm font-semibold leading-tight text-white">
            Nutrición
          </h2>
        </div>

        <div className="mt-3">
          {calendar}
        </div>
      </CardContent>
    </Card>
  );
}

function formatDateOnly(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayLabel(key: string, logged: boolean, isToday: boolean) {
  const state = logged ? "comida registrada" : "sin registro";
  return `${formatDateLabel(key)}: ${state}${isToday ? " (hoy)" : ""}`;
}

function formatDateLabel(key: string) {
  const date = new Date(`${key}T00:00:00`);
  const label = new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}
