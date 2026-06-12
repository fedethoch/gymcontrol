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
                "group block rounded-[1.25rem] border px-5 py-5 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 sm:px-7",
                isCompleted
                  ? "border-[#1e5a3d] bg-[linear-gradient(105deg,rgba(12,45,28,0.64),rgba(8,20,14,0.96)_55%,rgba(9,19,15,0.96))] shadow-[0_18px_44px_rgba(38,131,82,0.16)]"
                  : isCurrentDay
                  ? "border-[#7e35ff] bg-[linear-gradient(105deg,rgba(42,19,75,0.64),rgba(9,13,22,0.98)_55%,rgba(14,20,33,0.96))] shadow-[0_18px_44px_rgba(109,64,239,0.16)]"
                  : "border-[#263044] bg-[linear-gradient(145deg,rgba(13,19,34,0.92),rgba(7,11,19,0.98))] hover:border-[#40506f]",
              )}
            >
              <div className="grid gap-4 md:min-h-20 md:grid-cols-[4.5rem_minmax(0,1fr)_8rem_auto] md:items-center">
                <DayMarker
                  dayNumber={day.dayOrder}
                  isCurrentDay={isCurrentDay}
                  isCompleted={isCompleted}
                />

                <div className="min-w-0">
                  <p className="text-sm text-[#b7bfce]">{`Dia ${day.dayOrder}`}</p>
                  <h3 className="font-display mt-1 text-xl font-semibold leading-tight text-white sm:text-2xl">
                    {day.dayName}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    {isCompleted ? "Completado esta semana" : `${day.itemsCount} ejercicios`}
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 text-sm text-[#c8d0df] md:justify-self-start">
                  <Clock3 className="size-4 text-[#b2c7ff]" />
                  <span>60 min</span>
                </div>

                {isCompleted ? (
                  <span className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-[#2a9d5f] bg-[#0f2418] px-5 text-sm font-semibold text-[#88edab] md:w-60">
                    <Check className="size-5" />
                    Completado
                  </span>
                ) : isCurrentDay ? (
                  <span className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-[linear-gradient(90deg,#6a36f0,#8e4dff)] px-5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(109,64,239,0.34)] md:w-60">
                    Ver entrenamiento
                    <ChevronRight className="size-5" />
                  </span>
                ) : (
                  <ChevronRight className="size-6 justify-self-end text-[#9ba8c3] transition-transform group-hover:translate-x-1" />
                )}
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
        "grid size-16 shrink-0 place-items-center rounded-full border-4 text-xl font-semibold",
        isCompleted
          ? "border-[#29d26f] bg-[#10291b] text-[#8bf2ae] shadow-[0_0_0_7px_rgba(41,210,111,0.08)]"
          : isCurrentDay
          ? "border-[#7e35ff] bg-[#21113d] text-[#c7a8ff] shadow-[0_0_0_7px_rgba(109,64,239,0.08)]"
          : "border-[#20283a] bg-[#0a0f19] text-[#d8e0ef]",
      )}
    >
      {isCompleted ? <Check className="size-7" /> : dayNumber}
    </span>
  );
}
