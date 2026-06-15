"use client";

import { useState } from "react";

import { CalendarRange, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/app/components/ui/Card";

const WEEKS = 10;
const TOTAL_DAYS = WEEKS * 7;

type TrainingCalendarCardProps = {
  completedDates: Set<string>;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  bare?: boolean;
};

export function TrainingCalendarCard({
  completedDates,
  title = "Constancia",
  subtitle = `Tus ultimas ${WEEKS} semanas de entrenamiento.`,
  icon: Icon = CalendarRange,
  bare = false,
}: TrainingCalendarCardProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: { key: string; completed: boolean; isToday: boolean }[] = [];
  for (let i = TOTAL_DAYS - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = formatDateOnly(date);
    days.push({ key, completed: completedDates.has(key), isToday: i === 0 });
  }

  // Pad to align the first column to Monday.
  const firstWeekday = new Date(days[0].key).getDay();
  const leadingOffset = (firstWeekday + 6) % 7;
  const padded = [...Array.from({ length: leadingOffset }, () => null), ...days];

  const calendar = (
    <div className="relative overflow-x-auto">
      {hoveredKey && hoverPos ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-[#34245b] bg-[#15102a] px-2 py-1 text-xs font-medium text-white shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
          style={{ left: hoverPos.x, top: hoverPos.y - 8 }}
        >
          {formatDateLabel(hoveredKey)}
        </div>
      ) : null}
      <div
        className="grid w-fit gap-1"
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
              onMouseLeave={() => setHoveredKey((current) => (current === day.key ? null : current))}
              className={`size-3 rounded-[3px] ${
                day.completed
                  ? "bg-[#7c3aed]"
                  : day.isToday
                    ? "border border-[#6d40ef] bg-transparent"
                    : "bg-[#1c2333]"
              }`}
            />
          ) : (
            <span key={`pad-${index}`} className="size-3" />
          ),
        )}
      </div>
    </div>
  );

  if (bare) {
    return calendar;
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden border-[#27304a] bg-[linear-gradient(145deg,rgba(13,19,34,0.96)_0%,rgba(8,12,20,0.98)_100%)] shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
      <CardContent className="flex-1 p-6">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="grid size-12 shrink-0 place-items-center rounded-xl border border-[#34245b] bg-[#251640] text-[#b987ff]"
          >
            <Icon className="size-6" />
          </span>
          <h2 className="font-display text-xl font-semibold leading-tight text-white">
            {title}
          </h2>
        </div>

        <p className="mt-4 text-sm leading-6 text-[#c6cede]">{subtitle}</p>

        <div className="mt-5">{calendar}</div>
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

function formatDateLabel(key: string) {
  const date = new Date(`${key}T00:00:00`);
  const label = new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);

  return label.charAt(0).toUpperCase() + label.slice(1);
}
