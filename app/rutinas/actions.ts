"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/app/lib/auth";
import { renameSavedRoutineForUser } from "@/app/lib/saved-routines";

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
