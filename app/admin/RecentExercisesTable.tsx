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
            <TableCell className="text-white">
              <button
                type="button"
                onClick={() => setSelectedExercise(exercise)}
                className="flex items-center gap-3 text-left"
              >
                <span className="thumb-fitness size-10 rounded-xl border border-[var(--border)]" />
                <span className="font-medium underline-offset-4 hover:underline">
                  {exercise.name}
                </span>
              </button>
            </TableCell>
            <TableCell>{exercise.description}</TableCell>
            <TableCell>{exercise.createdAtLabel}</TableCell>
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
