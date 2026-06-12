"use client";

import Image from "next/image";
import { Dumbbell, Info } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/Dialog";

export type ExerciseDetail = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  series?: number;
  repsTarget?: string;
  rir?: number | string;
  rest?: string;
};

type ExerciseDetailModalProps = {
  exercise: ExerciseDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ExerciseDetailModal({
  exercise,
  open,
  onOpenChange,
}: ExerciseDetailModalProps) {
  const [displayExercise, setDisplayExercise] = useState<ExerciseDetail | null>(exercise);

  if (exercise && exercise !== displayExercise) {
    setDisplayExercise(exercise);
  }

  const hasStats =
    displayExercise?.series !== undefined ||
    displayExercise?.repsTarget !== undefined ||
    displayExercise?.rir !== undefined ||
    displayExercise?.rest !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent open={open && displayExercise !== null} aria-describedby="exercise-detail-description">
        {displayExercise ? (
          <>
            <div className="overflow-hidden rounded-t-2xl border-b border-[var(--border)] bg-[var(--card-alt)]">
              {displayExercise.imageUrl ? (
                <div className="relative aspect-[16/9]">
                  <Image
                    alt={displayExercise.name}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 42rem"
                    src={displayExercise.imageUrl}
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/9] items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-center text-[var(--foreground-muted)]">
                    <Dumbbell className="size-8" aria-hidden="true" />
                    <p className="text-sm">Imagen no disponible</p>
                  </div>
                </div>
              )}
            </div>
            <DialogHeader className="pr-12">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="accent" className="gap-1.5">
                  <Info className="size-3" aria-hidden="true" />
                  Ejercicio
                </Badge>
              </div>
              <DialogTitle>{displayExercise.name}</DialogTitle>

              {hasStats ? (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {displayExercise.series !== undefined ? (
                    <ExerciseStat label="Series" value={String(displayExercise.series)} />
                  ) : null}
                  {displayExercise.repsTarget !== undefined ? (
                    <ExerciseStat label="Reps objetivo" value={displayExercise.repsTarget} />
                  ) : null}
                  {displayExercise.rir !== undefined ? (
                    <ExerciseStat label="RIR" value={String(displayExercise.rir)} />
                  ) : null}
                  {displayExercise.rest !== undefined ? (
                    <ExerciseStat label="Descanso" value={displayExercise.rest} />
                  ) : null}
                </div>
              ) : null}

              <DialogDescription id="exercise-detail-description" className="mt-3">
                {displayExercise.description || "Sin descripcion adicional."}
              </DialogDescription>
            </DialogHeader>
            <div className="px-5 pb-5">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ExerciseStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card-alt)] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7887a6]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
