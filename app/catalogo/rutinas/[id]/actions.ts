"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/app/lib/auth";
import {
  saveRoutineForUser,
  toggleSavedRoutineActiveForUser,
} from "@/app/lib/saved-routines";

export async function saveRoutineFromCatalogAction(formData: FormData) {
  const auth = await requireUser();
  const routineTemplateId = String(formData.get("routineTemplateId") ?? "").trim();
  const customName = String(formData.get("customName") ?? "");

  if (!routineTemplateId) {
    redirect("/catalogo?status=save-error");
  }

  let destination = `/catalogo/rutinas/${routineTemplateId}?status=save-error`;

  try {
    const result = await saveRoutineForUser({
      routineTemplateId,
      userId: auth.user.id,
      customName,
    });

  revalidatePath("/");
  revalidatePath("/rutinas");
    revalidatePath(`/catalogo/rutinas/${routineTemplateId}`);

    destination = `/catalogo/rutinas/${routineTemplateId}?status=${result.status}&savedRoutineId=${result.routine.id}`;
  } catch {
    destination = `/catalogo/rutinas/${routineTemplateId}?status=save-error`;
  }

  redirect(destination);
}

export async function activateRoutineFromCatalogAction(formData: FormData) {
  const auth = await requireUser();
  const savedRoutineId = String(formData.get("savedRoutineId") ?? "").trim();
  const routineTemplateId = String(formData.get("routineTemplateId") ?? "").trim();

  if (!savedRoutineId || !routineTemplateId) {
    redirect("/catalogo/rutinas?status=active-error");
  }

  let destination = `/catalogo/rutinas/${routineTemplateId}?status=active-error`;

  try {
    const result = await toggleSavedRoutineActiveForUser({
      savedRoutineId,
      userId: auth.user.id,
    });

    if (result) {
  revalidatePath("/");
  revalidatePath("/rutinas");
      revalidatePath(`/catalogo/rutinas/${routineTemplateId}`);

      const status = result.status === "activated" ? "active" : "inactive";
      destination = `/catalogo/rutinas/${routineTemplateId}?status=${status}&savedRoutineId=${savedRoutineId}`;
    }
  } catch {
    destination = `/catalogo/rutinas/${routineTemplateId}?status=active-error`;
  }

  redirect(destination);
}
