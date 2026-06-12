"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/app/lib/auth";
import type { ExerciseFormPayload, ExerciseFormState } from "@/app/lib/exercise-form";
import { createExercise, getExerciseById, updateExercise } from "@/app/lib/exercises";
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
      });
    } else {
      await createExercise({
        name: parsed.data.name,
        description: parsed.data.description,
        imageUrl: parsed.data.imageUrl,
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

  return {
    status: "success",
    message: existingExercise
      ? "Ejercicio actualizado."
      : "Ejercicio guardado.",
    fieldErrors: {},
  };
}
