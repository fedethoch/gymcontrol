"use client";

import { Check, ChevronRight, Clock3 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

import { cn } from "@/app/lib/utils";

type WeekDay = {
  id: string;
  dayOrder: number;
  dayName: string;
  itemsCount: number;
};

type WeekDaysListProps = {
  days: WeekDay[];
  completedDayIds: string[];
  currentDayId: string | null;
  activeRoutineId: string;
};

export function WeekDaysList({
  days,
  completedDayIds,
  currentDayId,
  activeRoutineId,
}: WeekDaysListProps) {
  const completedSet = new Set(completedDayIds);

  return (
    <div className="grid gap-2">
      {days.map((day, index) => {
        const isCompleted = completedSet.has(day.id);
        const isCurrentDay = !isCompleted && day.id === currentDayId;
        const href = `/dashboard/rutinas/dia?savedRoutineId=${activeRoutineId}&day=${day.dayOrder}`;

        return (
          <motion.div
            key={day.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
          >
            <Link
              href={href}
              className={cn(
                "group block rounded-[1.25rem] px-3 py-3 transition-transform hover:-translate-y-0.5 sm:px-4 sm:py-3.5",
                isCompleted
                  ? "bg-[#0e1a14]"
                  : isCurrentDay
                  ? "bg-[#15102a]"
                  : "bg-[#0e131e]",
              )}
            >
              <div className="flex items-stretch gap-3 sm:gap-4">
                <DayMarker
                  dayNumber={day.dayOrder}
                  isCurrentDay={isCurrentDay}
                  isCompleted={isCompleted}
                />

                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <h3 className="font-display text-xl font-semibold leading-tight text-white">
                    {day.dayName}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--foreground-muted)] sm:text-sm">
                    <span>
                      {isCompleted ? "Completado esta semana" : `${day.itemsCount} ejercicios`}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[#c8d0df]">
                      <Clock3 className="size-3 text-[#b2c7ff]" />
                      60 min
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center">
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#88edab]">
                      <Check className="size-4" />
                      <span className="hidden sm:inline">Completado</span>
                    </span>
                  ) : isCurrentDay ? (
                    <span className="inline-flex items-center justify-center gap-1 rounded-lg bg-[linear-gradient(90deg,#6a36f0,#8e4dff)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(109,64,239,0.34)]">
                      Ver
                      <ChevronRight className="size-4" />
                    </span>
                  ) : (
                    <ChevronRight className="size-5 text-[#9ba8c3] transition-transform group-hover:translate-x-1" />
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

function DayMarker({
  dayNumber,
  isCurrentDay,
  isCompleted,
}: {
  dayNumber: number;
  isCurrentDay: boolean;
  isCompleted: boolean;
}) {
  return (
    <span
      className={cn(
        "grid aspect-square self-stretch min-w-[3rem] shrink-0 place-items-center rounded-full border-4 text-base font-semibold sm:min-w-[3.5rem] sm:text-lg",
        isCompleted
          ? "border-[#29d26f] bg-[#10291b] text-[#8bf2ae] shadow-[0_0_0_7px_rgba(41,210,111,0.08)]"
          : isCurrentDay
          ? "border-[#7e35ff] bg-[#21113d] text-[#c7a8ff] shadow-[0_0_0_7px_rgba(109,64,239,0.08)]"
          : "border-[#20283a] bg-[#0a0f19] text-[#d8e0ef]",
      )}
    >
      {isCompleted ? <Check className="size-5 sm:size-6" /> : dayNumber}
    </span>
  );
}
