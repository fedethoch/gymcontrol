"use client";

import { useState } from "react";

import { ExerciseDetailModal } from "@/app/components/shared/ExerciseDetailModal";
import { TableBody, TableCell, TableRow } from "@/app/components/ui/Table";
import type { AdminExerciseListItem } from "@/app/lib/exercises";

export function RecentExercisesTable({ exercises }: { exercises: AdminExerciseListItem[] }) {
  const [selectedExercise, setSelectedExercise] = useState<AdminExerciseListItem | null>(null);

  return (
    <>
      <TableBody>
        {exercises.map((exercise) => (
          <TableRow key={exercise.id}>
            <TableCell className="py-2.5 text-white">
              <button
                type="button"
                onClick={() => setSelectedExercise(exercise)}
                className="flex items-center gap-3 text-left"
              >
                <span className="thumb-fitness size-8 shrink-0 rounded-xl border border-[var(--border)] sm:size-10" />
                <span className="line-clamp-1 font-medium underline-offset-4 hover:underline">
                  {exercise.name}
                </span>
              </button>
            </TableCell>
            <TableCell className="max-w-[7rem] truncate py-2.5 sm:max-w-none">
              {exercise.description}
            </TableCell>
            <TableCell className="py-2.5">{exercise.createdAtLabel}</TableCell>
          </TableRow>
        ))}
      </TableBody>

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
