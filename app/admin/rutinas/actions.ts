"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "@/app/lib/auth";
import { listExerciseCatalogItems } from "@/app/lib/exercises";
import type { RoutineFormPayload, RoutineFormState } from "@/app/lib/routine-form";
import { deleteRoutine, getRoutineById, restoreRoutine, saveRoutine } from "@/app/lib/routines";
import { parseRoutinePayload } from "@/app/lib/routine-validation";

export async function saveRoutineAction(
  payload: RoutineFormPayload,
): Promise<RoutineFormState> {
  await requireAdmin();
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
    await saveRoutine({ id: existingRoutine?.id, ...parsed.data });
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
  revalidateTag("routines", {});

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

export async function deleteRoutineAction(
  id: string,
): Promise<{ ok: true; archived: boolean } | { ok: false; message: string }> {
  await requireAdmin();

  let archived = false;

  try {
    ({ archived } = await deleteRoutine(id));
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo eliminar la rutina.",
    };
  }

  revalidateRoutinePaths(id);

  return { ok: true, archived };
}

export async function restoreRoutineAction(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireAdmin();

  try {
    await restoreRoutine(id);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo restaurar la rutina.",
    };
  }

  revalidateRoutinePaths(id);

  return { ok: true };
}

function revalidateRoutinePaths(id: string) {
  revalidatePath("/admin/rutinas");
  revalidatePath("/catalogo");
  revalidatePath(`/catalogo/rutinas/${id}`);
  revalidateTag("routines", {});
}
