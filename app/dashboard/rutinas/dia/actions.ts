"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/app/lib/auth";
import { saveWorkoutSessionForToday, type WorkoutSessionItemInput } from "@/app/lib/workout-tracking";

export async function autosaveWorkoutSessionItemAction(input: {
  savedRoutineId: string;
  routineDayId: string;
  day: number;
  routineItemId: string;
  performedReps: string;
  usedWeight: string;
  isCompleted: boolean;
  complete: boolean;
}) {
  const auth = await requireUser();
  const savedRoutineId = input.savedRoutineId.trim();
  const routineDayId = input.routineDayId.trim();
  const routineItemId = input.routineItemId.trim();
  const day = String(input.day).trim();

  if (!savedRoutineId || !routineDayId || !routineItemId || !day) {
    return {
      status: "error" as const,
      message: "Faltan datos para guardar este ejercicio.",
    };
  }

  try {
    const item = parseWorkoutItem({
      routineItemId,
      performedReps: input.performedReps,
      usedWeight: input.usedWeight,
      isCompleted: input.isCompleted,
    });

    await saveWorkoutSessionForToday({
      savedRoutineId,
      routineDayId,
      userId: auth.user.id,
      items: [item],
      complete: input.complete,
    });

    revalidateWorkoutPaths();

    return {
      status: "success" as const,
    };
  } catch (error) {
    return {
      status: "error" as const,
      message:
        error instanceof Error ? error.message : "No se pudo guardar el ejercicio.",
    };
  }
}

function parseWorkoutItem(input: {
  routineItemId: string;
  performedReps?: string;
  usedWeight?: string;
  isCompleted: boolean;
}): WorkoutSessionItemInput {
  return {
    routineItemId: input.routineItemId,
    performedReps: parsePositiveInteger(input.performedReps),
    usedWeight: parsePositiveNumber(input.usedWeight),
    isCompleted: input.isCompleted,
  };
}

function parsePositiveInteger(value: string | undefined) {
  const normalized = value?.trim() ?? "";

  if (!normalized) {
    return null;
  }

  if (!/^\d+$/.test(normalized)) {
    throw new Error("Las reps realizadas deben ser un numero entero positivo.");
  }

  const parsed = Number.parseInt(normalized, 10);

  if (parsed <= 0) {
    throw new Error("Las reps realizadas deben ser mayores a cero.");
  }

  return parsed;
}

function parsePositiveNumber(value: string | undefined) {
  const normalized = value?.trim().replace(",", ".") ?? "";

  if (!normalized) {
    return null;
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("El peso utilizado debe ser un numero positivo.");
  }

  const parsed = Number.parseFloat(normalized);

  if (parsed <= 0) {
    throw new Error("El peso utilizado debe ser mayor a cero.");
  }

  return parsed;
}

function revalidateWorkoutPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/rutinas");
  revalidatePath("/dashboard/rutinas/dia");
}
