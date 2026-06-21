"use client";

import { Dumbbell } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/app/components/ui/Badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/app/components/ui/Sheet";
import {
  MUSCLE_BADGE_STYLES,
  MUSCLE_GRADIENTS,
  equipmentLabel,
  muscleLabel,
} from "@/app/lib/exercise-form";
import { cn } from "@/app/lib/utils";

export type ExerciseDetail = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  videoUrl?: string | null;
  exerciseDbId?: string | null;
  muscleGroup?: string | null;
  equipment?: string | null;
  series?: number;
  repsTarget?: string;
  rir?: number | string;
  rest?: string;
  minReps?: number | null;
  maxReps?: number | null;
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
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const displayExercise = exercise;

  const hasIdealRange =
    displayExercise?.minReps !== null &&
    displayExercise?.minReps !== undefined &&
    displayExercise?.maxReps !== null &&
    displayExercise?.maxReps !== undefined;

  const muscleGroup = displayExercise?.muscleGroup ?? null;
  const equipment = displayExercise?.equipment ?? null;
  const heroGradient = muscleGroup ? MUSCLE_GRADIENTS[muscleGroup] ?? MUSCLE_GRADIENTS.Core : MUSCLE_GRADIENTS.Core;

  return (
    <Sheet
      open={open && displayExercise !== null}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (nextOpen) {
          setHeroImgFailed(false);
        }
      }}
    >
      <SheetContent
        side="right"
        className="w-full max-w-full overflow-hidden p-0 sm:max-w-[34rem]"
        aria-describedby="exercise-detail-description"
      >
        {displayExercise ? (
          <div className="flex h-full flex-col overflow-hidden">
            <div className="h-0.5 shrink-0 bg-[linear-gradient(90deg,transparent,#7c3aed_25%,#b995ff_60%,transparent)]" />

            {/* Hero */}
            <div className="relative h-[218px] shrink-0 overflow-hidden">
              {displayExercise.imageUrl && !heroImgFailed ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={displayExercise.name}
                    className="h-full w-full object-cover"
                    src={displayExercise.imageUrl}
                    onError={() => setHeroImgFailed(true)}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(5,7,11,0.85)_100%)]" />
                </>
              ) : (
                <>
                  <div className="absolute inset-0" style={{ background: heroGradient }} />
                  <div
                    className="absolute inset-0 opacity-60"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(124,58,237,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.055) 1px,transparent 1px)",
                      backgroundSize: "38px 38px",
                      maskImage: "radial-gradient(ellipse 80% 100% at 30% 50%, black 0%, transparent 75%)",
                    }}
                  />
                  <p
                    aria-hidden="true"
                    className="font-display pointer-events-none absolute -bottom-4 -right-1 text-[118px] font-extrabold uppercase leading-none tracking-[-0.07em] text-[rgba(124,58,237,0.08)]"
                  >
                    {muscleGroup ?? ""}
                  </p>
                  {!muscleGroup ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-[var(--foreground-muted)]">
                      <Dumbbell className="size-8" aria-hidden="true" />
                      <p className="text-sm">Imagen no disponible</p>
                    </div>
                  ) : null}
                </>
              )}

              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5">
                <SheetTitle className="font-display text-2xl font-bold tracking-[-0.05em] text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.55)]">
                  {displayExercise.name}
                </SheetTitle>
                <div className="flex flex-wrap gap-1.5">
                  {muscleGroup ? (
                    <Badge
                      className={cn(
                        "border",
                        MUSCLE_BADGE_STYLES[muscleGroup] ?? MUSCLE_BADGE_STYLES.Core,
                      )}
                    >
                      {muscleLabel(muscleGroup)}
                    </Badge>
                  ) : null}
                  {equipment ? <Badge variant="neutral">{equipmentLabel(equipment)}</Badge> : null}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              <SheetDescription id="exercise-detail-description" className="sr-only">
                Detalle del ejercicio {displayExercise.name}
              </SheetDescription>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7887a6]">
                    Descripcion
                  </p>
                  <p className="text-sm leading-7 text-[var(--foreground-muted)]">
                    {displayExercise.description || "Sin descripcion adicional."}
                  </p>
                </div>

                <div className="h-px bg-[var(--border)]" />

                <div className="flex flex-col gap-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7887a6]">
                    Clasificacion
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    <SpecChip label="Grupo muscular" value={muscleLabel(muscleGroup) ?? "Sin definir"} />
                    <SpecChip label="Equipamiento" value={equipmentLabel(equipment) ?? "Sin definir"} />
                    <SpecChip
                      label="Rango ideal"
                      value={hasIdealRange ? `${displayExercise.minReps}-${displayExercise.maxReps} reps` : "Sin definir"}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function SpecChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--card-alt)] px-3.5 py-2.5">
      <span className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-[#7887a6]">
        {label}
      </span>
      <span className="text-sm font-semibold tracking-[-0.01em] text-[var(--foreground)]">{value}</span>
    </div>
  );
}
