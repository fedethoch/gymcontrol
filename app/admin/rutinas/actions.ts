"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/app/lib/auth";
import { listExerciseCatalogItems } from "@/app/lib/exercises";
import type { RoutineFormPayload, RoutineFormState } from "@/app/lib/routine-form";
import { createRoutine, getRoutineById, updateRoutine } from "@/app/lib/routines";
import { parseRoutinePayload } from "@/app/lib/routine-validation";

export async function saveRoutineAction(
  payload: RoutineFormPayload,
): Promise<RoutineFormState> {
  const auth = await requireAdmin();
  const routineId = payload.routineId?.trim();
  const existingRoutine = routineId ? await getRoutineById(routineId) : null;

  if (routineId && !existingRoutine) {
    return {
      status: "error",
      message: "La rutina que intentas editar ya no existe.",
      fieldErrors: {},
      structureErrors: {
        dayErrors: {},
      },
    };
  }

  const exercises = await listExerciseCatalogItems();
  const parsed = parseRoutinePayload({
    payload,
    validExerciseIds: new Set(exercises.map((exercise) => exercise.id)),
  });

  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    if (existingRoutine) {
      await updateRoutine({
        id: existingRoutine.id,
        name: parsed.data.name,
        description: parsed.data.description,
        difficulty: parsed.data.difficulty,
        objective: parsed.data.objective,
        days: parsed.data.days,
      });
    } else {
      await createRoutine({
        name: parsed.data.name,
        description: parsed.data.description,
        difficulty: parsed.data.difficulty,
        objective: parsed.data.objective,
        createdBy: auth.profile.id,
        days: parsed.data.days,
      });
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "No se pudo guardar la rutina.",
      fieldErrors: {},
      structureErrors: {
        dayErrors: {},
      },
    };
  }

  revalidatePath("/admin/rutinas");
  revalidatePath("/catalogo");

  if (existingRoutine) {
    revalidatePath(`/catalogo/rutinas/${existingRoutine.id}`);
  }

  return {
    status: "success",
    message: existingRoutine ? "Rutina actualizada." : "Rutina guardada.",
    fieldErrors: {},
    structureErrors: {
      dayErrors: {},
    },
  };
}
