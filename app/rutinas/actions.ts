"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/app/lib/auth";
import {
  deactivateSavedRoutineForUser,
  deleteSavedRoutineForUser,
  renameSavedRoutineForUser,
  setSavedRoutineActiveForUser,
  updateTrainingWeekdaysForUser,
} from "@/app/lib/saved-routines";

type ActionResult = { ok: true } | { ok: false; message: string };

export async function renameSavedRoutineAction(
  savedRoutineId: string,
  customName: string,
): Promise<{ ok: true; displayName: string } | { ok: false; message: string }> {
  const auth = await requireUser();

  try {
    const result = await renameSavedRoutineForUser({
      savedRoutineId,
      userId: auth.user.id,
      customName: customName.trim() || null,
    });

    if (!result) {
      return { ok: false, message: "No se encontro la rutina o no tenes permiso para renombrarla." };
    }

    revalidatePath("/");
    revalidatePath("/rutinas");

    return { ok: true, displayName: result.displayName };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo renombrar la rutina.",
    };
  }
}

export async function activateSavedRoutineAction(
  savedRoutineId: string,
  trainingWeekdays: number[] | null,
): Promise<ActionResult> {
  const auth = await requireUser();

  return runSelectionChange(async () => {
    const routine = await setSavedRoutineActiveForUser({ savedRoutineId, userId: auth.user.id, trainingWeekdays });

    if (!routine) {
      throw new Error("No se encontro la rutina.");
    }
  }, "No se pudo activar la rutina.");
}

export async function updateTrainingWeekdaysAction(
  savedRoutineId: string,
  trainingWeekdays: number[],
): Promise<ActionResult> {
  const auth = await requireUser();

  return runSelectionChange(async () => {
    const { updated } = await updateTrainingWeekdaysForUser({ savedRoutineId, userId: auth.user.id, trainingWeekdays });

    if (!updated) {
      throw new Error("No se encontro la rutina.");
    }
  }, "No se pudieron guardar tus días.");
}

export async function deactivateSavedRoutineAction(savedRoutineId: string): Promise<ActionResult> {
  const auth = await requireUser();

  return runSelectionChange(
    () => deactivateSavedRoutineForUser({ savedRoutineId, userId: auth.user.id }),
    "No se pudo desactivar la rutina.",
  );
}

export async function deleteSavedRoutineAction(savedRoutineId: string): Promise<ActionResult> {
  const auth = await requireUser();

  return runSelectionChange(async () => {
    const { deleted } = await deleteSavedRoutineForUser({ savedRoutineId, userId: auth.user.id });

    if (!deleted) {
      throw new Error("No se encontro la rutina.");
    }
  }, "No se pudo eliminar la rutina.");
}

async function runSelectionChange(change: () => Promise<void>, fallbackMessage: string): Promise<ActionResult> {
  try {
    await change();
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : fallbackMessage };
  }

  revalidatePath("/");
  revalidatePath("/rutinas");
  revalidatePath("/catalogo");

  return { ok: true };
}
