"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { TrainingDaysButton, type TrainingDaysChoice } from "@/app/components/rutinas/TrainingDaysSheet";
import { updateTrainingWeekdaysAction } from "@/app/rutinas/actions";

/** Elegir o cambiar los días de entreno de una rutina guardada sin reactivarla (DESIGN.md §12.3). */
export function TrainingDaysEditButton({
  savedRoutineId,
  choice,
  className,
  children,
}: {
  savedRoutineId: string;
  choice: TrainingDaysChoice;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();

  async function save(weekdays: number[]) {
    const result = await updateTrainingWeekdaysAction(savedRoutineId, weekdays);
    if (!result.ok) {
      toast.error(result.message);
      return false;
    }
    toast.success("Días guardados.");
    router.refresh();
    return true;
  }

  return (
    <TrainingDaysButton className={className} choice={choice} confirmLabel="Guardar mis días" submit={{ onConfirm: save }}>
      {children}
    </TrainingDaysButton>
  );
}
