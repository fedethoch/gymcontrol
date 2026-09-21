"use client";

import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { useState } from "react";

import { HomeWeekStrip } from "@/app/components/home/HomeWeekStrip";
import { TodayExercisesSheet, type SheetExercise } from "@/app/components/home/TodayExercisesSheet";
import { TodayHero } from "@/app/components/home/TodayHero";
import { TrainingDaysEditButton } from "@/app/components/rutinas/TrainingDaysEditButton";
import type { TrainingDaysChoice } from "@/app/components/rutinas/TrainingDaysSheet";
import { buttonVariants } from "@/app/components/ui/Button";
import { premiumEase } from "@/app/components/ui/motion";
import type { HeroView } from "@/app/lib/home-hero";
import type { StripDay } from "@/app/lib/training-schedule";

export type DaySheet = {
  title: string;
  description: string;
  href: string;
  exercises: SheetExercise[];
};

/**
 * Z2 + Z3 del home mobile (DESIGN.md §10): la semana y el hero. Con días elegidos, tocar un día de la semana
 * muestra ese día en el hero (hacer el lunes un miércoles); tocar hoy vuelve a lo que toca.
 */
export function HomeWeekPlanner({
  todayKey,
  strip,
  views,
  sheets,
  schedule,
}: {
  todayKey: string;
  strip: StripDay[];
  /** Vista del hero por fecha. Siempre está hoy; sin días elegidos es la única (la semana no se toca). */
  views: Record<string, HeroView>;
  /** Ejercicios de cada día de la rutina, por id de día. */
  sheets: Record<string, DaySheet>;
  /** Rutina activa sin días elegidos: el CTA del hero abre el selector. */
  schedule: { savedRoutineId: string; choice: TrainingDaysChoice } | null;
}) {
  const [selectedKey, setSelectedKey] = useState(todayKey);
  // El primer dibujo no anima; cambiar de día hace un fundido corto.
  const [navigated, setNavigated] = useState(false);
  const view = views[selectedKey] ?? views[todayKey];
  const sheet = view.sheet ? sheets[view.sheet.dayId] : undefined;
  const navigable = Object.keys(views).length > 1;

  function select(dateKey: string) {
    setNavigated(true);
    setSelectedKey(dateKey);
  }

  return (
    <>
      <div className="mt-5">
        <HomeWeekStrip days={strip} selectedKey={selectedKey} onSelect={navigable ? select : undefined} />
      </div>
      <motion.div
        key={selectedKey}
        className="mt-5"
        initial={navigated ? { opacity: 0.35 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18, ease: premiumEase }}
      >
        <TodayHero
          view={view}
          exercisesSheet={
            sheet && view.sheet ? (
              <TodayExercisesSheet
                {...sheet}
                ctaLabel={view.sheet.ctaLabel}
                triggerLabel={selectedKey === todayKey ? "Ver ejercicios de hoy" : "Ver ejercicios del día"}
              />
            ) : undefined
          }
          chooseDaysAction={
            schedule ? (
              <TrainingDaysEditButton
                className={buttonVariants({ className: "h-14 flex-1 rounded-2xl text-base font-bold" })}
                savedRoutineId={schedule.savedRoutineId}
                choice={schedule.choice}
              >
                <CalendarDays aria-hidden="true" className="size-[18px]" />
                Elegir días
              </TrainingDaysEditButton>
            ) : undefined
          }
        />
      </motion.div>
    </>
  );
}
