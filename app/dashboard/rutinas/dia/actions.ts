"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/app/lib/auth";
import { saveWorkoutSessionForWeek, type WorkoutSessionItemInput } from "@/app/lib/workout-tracking";

export async function autosaveWorkoutSessionItemAction(input: {
  savedRoutineId: string;
  routineDayId: string;
  day: number;
  routineItemId: string;
  series: number;
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
      series: input.series,
      performedReps: input.performedReps,
      usedWeight: input.usedWeight,
      isCompleted: input.isCompleted,
    });

    await saveWorkoutSessionForWeek({
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
  series: number;
  performedReps?: string;
  usedWeight?: string;
  isCompleted: boolean;
}): WorkoutSessionItemInput {
  return {
    routineItemId: input.routineItemId,
    performedReps: parseSeriesValues(input.performedReps, {
      maxValues: input.series,
      pattern: /^\d+$/,
      message: "Las reps realizadas deben ser numeros enteros positivos separados por \"/\" (ej. 12/10/8).",
    }),
    usedWeight: parseSeriesValues(input.usedWeight, {
      maxValues: input.series,
      pattern: /^\d+(\.\d+)?$/,
      message: "El peso utilizado debe ser numeros positivos separados por \"/\" (ej. 40/40/35).",
    }),
    isCompleted: input.isCompleted,
  };
}

function parseSeriesValues(
  value: string | undefined,
  options: { maxValues: number; pattern: RegExp; message: string },
) {
  const normalized = value?.trim().replace(/,/g, ".") ?? "";

  if (!normalized) {
    return null;
  }

  const tokens = normalized.split("/").map((token) => token.trim());

  if (options.maxValues > 0 && tokens.length > options.maxValues) {
    throw new Error(options.message);
  }

  for (const token of tokens) {
    if (!options.pattern.test(token) || Number.parseFloat(token) <= 0) {
      throw new Error(options.message);
    }
  }

  return tokens.join("/");
}

function revalidateWorkoutPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/rutinas");
  revalidatePath("/dashboard/rutinas/dia");
}
