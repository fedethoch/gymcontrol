"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import {
  ExerciseDetailModal,
  type ExerciseDetail,
} from "@/app/components/shared/ExerciseDetailModal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/Accordion";
import { motion, staggerContainer } from "@/app/components/ui/motion";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/Table";
import type { RoutineDay } from "@/app/lib/routines";

const fadeRow = { hidden: { opacity: 0 }, visible: { opacity: 1 } };

type RoutineDetailClientProps = {
  routine: {
    days: RoutineDay[];
  };
};

export function RoutineDetailClient({ routine }: RoutineDetailClientProps) {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDetail | null>(null);

  return (
    <>
      {/* Days accordion — collapsed by default, exercises visible on expand */}
      <section className="grid gap-2">
        <Accordion type="multiple" className="grid gap-2">
          {routine.days.map((day) => (
            <AccordionItem
              key={day.id}
              value={day.id}
              className="overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.16)] bg-[linear-gradient(180deg,rgba(15,21,34,0.92),rgba(9,13,23,0.96))] px-4 shadow-[0_18px_55px_rgba(0,0,0,0.26)]"
            >
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex flex-1 items-center gap-3">
                  <CalendarDays className="size-4 shrink-0 text-[var(--accent-bright)]" />
                  <span className="font-display text-base font-semibold tracking-[-0.04em] text-white">
                    {day.dayName || `Dia ${day.dayOrder}`}
                  </span>
                </div>
                <span className="mr-2 text-[11px] text-[#7887a6]">
                  {day.items.length} ejercicios
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="overflow-x-auto">
                  <Table className="min-w-[34rem]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-9 pl-3 pr-0 text-[#aab2c4]">Ejercicio</TableHead>
                        <TableHead className="h-9 text-center text-[#aab2c4]">Series</TableHead>
                        <TableHead className="h-9 text-center text-[#aab2c4]">Reps</TableHead>
                        <TableHead className="h-9 text-center text-[#aab2c4]">RIR</TableHead>
                        <TableHead className="h-9 pr-0 text-center text-[#aab2c4]">Descanso</TableHead>
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
                          <TableCell className="pl-3 pr-0 py-3 text-white">
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
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
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
