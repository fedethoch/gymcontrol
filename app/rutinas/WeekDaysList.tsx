"use client";

import { Check, ChevronRight, Clock3, Play } from "lucide-react";
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
  animationDelay?: number;
};

export function WeekDaysList({
  days,
  completedDayIds,
  currentDayId,
  activeRoutineId,
  animationDelay = 0,
}: WeekDaysListProps) {
  const completedSet = new Set(completedDayIds);

  return (
    <div className="grid gap-2">
      {days.map((day, index) => {
        const isCompleted = completedSet.has(day.id);
        const isCurrentDay = !isCompleted && day.id === currentDayId;
        const href = `/rutinas/dia?savedRoutineId=${activeRoutineId}&day=${day.dayOrder}`;
        const delay = animationDelay + index * 0.05;

        return (
          <motion.div
            key={day.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{
              opacity: 1,
              y: 0,
              ...(isCurrentDay
                ? {
                    boxShadow: [
                      "0 0 0 0px rgba(124,58,237,0)",
                      "0 0 0 5px rgba(124,58,237,0.22)",
                      "0 0 0 0px rgba(124,58,237,0)",
                    ],
                  }
                : {}),
            }}
            transition={
              isCurrentDay
                ? {
                    opacity: { duration: 0.3, delay, ease: "easeOut" },
                    y: { duration: 0.3, delay, ease: "easeOut" },
                    boxShadow: {
                      duration: 2.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: delay + 0.4,
                    },
                  }
                : { delay, duration: 0.3, ease: "easeOut" }
            }
            className="rounded-[1.25rem]"
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href={href}
              className={cn(
                "group block rounded-[1.25rem] px-3 py-2.5 transition-transform hover:-translate-y-0.5 sm:px-4 sm:py-3",
                isCompleted
                  ? "bg-[#0e1a14]"
                  : isCurrentDay
                    ? "bg-[#15102a]"
                    : "bg-[#0e131e]",
              )}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <DayMarker
                  dayNumber={day.dayOrder}
                  isCurrentDay={isCurrentDay}
                  isCompleted={isCompleted}
                />

                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <h3 className="font-display text-base font-semibold leading-tight text-white">
                    {day.dayName}
                  </h3>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--foreground-muted)]">
                    {isCompleted ? (
                      <span>Completado esta semana</span>
                    ) : (
                      <>
                        <span>{day.itemsCount} ej</span>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[#c8d0df]">
                          <Clock3 className="size-3 text-[#b2c7ff]" />
                          ~60 min
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center">
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-[#88edab]">
                      <Check className="size-4" />
                      <span className="hidden sm:inline">Completado</span>
                    </span>
                  ) : isCurrentDay ? (
                    <span className="inline-flex items-center justify-center gap-1 rounded-lg bg-[linear-gradient(90deg,#6a36f0,#8e4dff)] px-3 py-2 text-xs font-semibold text-white shadow-[0_6px_20px_rgba(109,64,239,0.34)]">
                      <Play className="size-3 fill-white" />
                      Comenzar
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-xs text-[#9ba8c3] transition-transform group-hover:translate-x-0.5">
                      Ver día
                      <ChevronRight className="size-4" />
                    </span>
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
        "grid aspect-square min-w-[2.5rem] shrink-0 place-items-center self-center rounded-full border-[3px] text-sm font-semibold sm:min-w-[2.75rem]",
        isCompleted
          ? "border-[#29d26f] bg-[#10291b] text-[#8bf2ae] shadow-[0_0_0_6px_rgba(41,210,111,0.08)]"
          : isCurrentDay
            ? "border-[#7e35ff] bg-[#21113d] text-[#c7a8ff] shadow-[0_0_0_6px_rgba(109,64,239,0.08)]"
            : "border-[#20283a] bg-[#0a0f19] text-[#d8e0ef]",
      )}
    >
      {isCompleted ? <Check className="size-4 sm:size-5" /> : dayNumber}
    </span>
  );
}
