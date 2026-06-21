"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "@/app/lib/auth";
import type { ExerciseFormPayload, ExerciseFormState } from "@/app/lib/exercise-form";
import { createExercise, deleteExercise, getExerciseById, updateExercise } from "@/app/lib/exercises";
import { parseExercisePayload } from "@/app/lib/exercise-validation";
import { getSupabasePublicEnv } from "@/app/lib/supabase/env";

export async function saveExerciseAction(
  payload: ExerciseFormPayload,
): Promise<ExerciseFormState> {
  const auth = await requireAdmin();
  const supabaseEnv = getSupabasePublicEnv();
  const exerciseId = payload.exerciseId?.trim();
  const existingExercise = exerciseId ? await getExerciseById(exerciseId) : null;

  if (exerciseId && !existingExercise) {
    return {
      status: "error",
      message: "El ejercicio que intentas editar ya no existe.",
      fieldErrors: {},
    };
  }

  const parsed = parseExercisePayload({
    payload,
    requiresImage: !existingExercise,
    supabaseUrl: supabaseEnv.url,
  });

  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    if (existingExercise) {
      await updateExercise({
        id: existingExercise.id,
        name: parsed.data.name,
        description: parsed.data.description,
        imageUrl: parsed.data.imageUrl || existingExercise.imageUrl,
        muscleGroup: parsed.data.muscleGroup,
        equipment: parsed.data.equipment,
        videoUrl: parsed.data.videoUrl,
        minReps: parsed.data.minReps,
        maxReps: parsed.data.maxReps,
        steps: parsed.data.steps,
        tips: parsed.data.tips,
      });
    } else {
      await createExercise({
        name: parsed.data.name,
        description: parsed.data.description,
        imageUrl: parsed.data.imageUrl,
        muscleGroup: parsed.data.muscleGroup,
        equipment: parsed.data.equipment,
        videoUrl: parsed.data.videoUrl,
        minReps: parsed.data.minReps,
        maxReps: parsed.data.maxReps,
        steps: parsed.data.steps,
        tips: parsed.data.tips,
        createdBy: auth.profile.id,
      });
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "No se pudo guardar el ejercicio.",
      fieldErrors: {},
    };
  }

  revalidatePath("/admin/ejercicios");
  revalidateTag("exercises", {});

  return {
    status: "success",
    message: existingExercise
      ? "Ejercicio actualizado."
      : "Ejercicio guardado.",
    fieldErrors: {},
  };
}

export async function deleteExerciseAction(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireAdmin();

  try {
    await deleteExercise(id);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo eliminar el ejercicio.",
    };
  }

  revalidatePath("/admin/ejercicios");
  revalidateTag("exercises", {});

  return { ok: true };
}
