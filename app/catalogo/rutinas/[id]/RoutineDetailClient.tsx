"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import {
  ExerciseDetailModal,
  type ExerciseDetail,
} from "@/app/components/shared/ExerciseDetailModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/Tabs";
import { motion, staggerContainer } from "@/app/components/ui/motion";

const fadeRow = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/Table";
import type { RoutineDay } from "@/app/lib/routines";

type RoutineDetailClientProps = {
  routine: {
    days: RoutineDay[];
  };
};

export function RoutineDetailClient({ routine }: RoutineDetailClientProps) {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDetail | null>(null);

  function renderDayCards(day: RoutineDay) {
    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="grid gap-3"
      >
        {day.items.map((item) => (
          <motion.div
            key={item.id}
            variants={fadeRow}
            className="rounded-2xl border border-[rgba(148,163,184,0.13)] bg-[rgba(255,255,255,0.02)] p-4"
          >
            <button
              type="button"
              className="font-semibold text-left text-white transition-colors hover:text-[var(--accent-bright)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-bright)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1a]"
              onClick={() =>
                setSelectedExercise({
                  ...item.exercise,
                  series: item.series,
                  repsTarget: item.repetitions,
                  rir: item.rir,
                  rest: item.rest,
                })
              }
            >
              {item.exercise.name}
            </button>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#7d8697]">Series</p>
                <p className="mt-1 font-medium text-white">{item.series}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#7d8697]">Reps</p>
                <p className="mt-1 font-medium text-white">{item.repetitions}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#7d8697]">RIR</p>
                <p className="mt-1 font-medium text-white">{item.rir}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#7d8697]">Descanso</p>
                <p className="mt-1 font-medium text-white">{item.rest}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <>
      {/* Mobile/tablet: tabs por dia */}
      <Tabs defaultValue={routine.days[0]?.id} className="lg:hidden">
        <TabsList className="w-full justify-start overflow-x-auto">
          {routine.days.map((day) => (
            <TabsTrigger key={day.id} value={day.id} className="shrink-0">
              {day.dayName || `Dia ${day.dayOrder}`}
            </TabsTrigger>
          ))}
        </TabsList>
        {routine.days.map((day) => (
          <TabsContent key={day.id} value={day.id}>
            {renderDayCards(day)}
          </TabsContent>
        ))}
      </Tabs>

      {/* Desktop: dias apilados con tabla */}
      <section className="hidden gap-5 lg:grid">
        {routine.days.map((day) => (
          <div
            key={day.id}
            className="overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.16)] bg-[linear-gradient(180deg,rgba(15,21,34,0.92),rgba(9,13,23,0.96))] px-5 py-5 shadow-[0_18px_55px_rgba(0,0,0,0.26)] sm:px-7 sm:py-6"
          >
            <div className="flex items-center gap-4 pb-4">
              <CalendarDays className="size-7 shrink-0 text-[var(--accent-bright)]" />
              <h3 className="font-display text-2xl font-semibold tracking-[-0.05em] text-white">
                {day.dayName || `Dia ${day.dayOrder}`}
              </h3>
            </div>

            <Table className="min-w-[44rem]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-11 pl-3 pr-0 text-[#aab2c4]">Ejercicio</TableHead>
                  <TableHead className="h-11 text-center text-[#aab2c4]">Series</TableHead>
                  <TableHead className="h-11 text-center text-[#aab2c4]">Reps</TableHead>
                  <TableHead className="h-11 text-center text-[#aab2c4]">RIR</TableHead>
                  <TableHead className="h-11 pr-0 text-center text-[#aab2c4]">Descanso</TableHead>
                </TableRow>
              </TableHeader>
              <motion.tbody
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                className="[&_tr:last-child]:border-0"
              >
                {day.items.map((item) => (
                  <motion.tr
                    key={item.id}
                    variants={fadeRow}
                    className="border-b border-[rgba(148,163,184,0.13)] transition-colors hover:bg-[rgba(124,58,237,0.08)]"
                  >
                    <TableCell className="pl-3 pr-0 py-4 text-white">
                      <button
                        type="button"
                        className="font-semibold text-left transition-colors hover:text-[var(--accent-bright)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-bright)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1a]"
                        onClick={() =>
                          setSelectedExercise({
                            ...item.exercise,
                            series: item.series,
                            repsTarget: item.repetitions,
                            rir: item.rir,
                            rest: item.rest,
                          })
                        }
                      >
                        {item.exercise.name}
                      </button>
                    </TableCell>
                    <TableCell className="text-center text-white">{item.series}</TableCell>
                    <TableCell className="text-center text-white">{item.repetitions}</TableCell>
                    <TableCell className="text-center text-white">{item.rir}</TableCell>
                    <TableCell className="pr-0 text-center text-white">{item.rest}</TableCell>
                  </motion.tr>
                ))}
              </motion.tbody>
            </Table>
          </div>
        ))}
      </section>

      <ExerciseDetailModal
        exercise={selectedExercise}
        open={selectedExercise !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedExercise(null);
          }
        }}
      />
    </>
  );
}
