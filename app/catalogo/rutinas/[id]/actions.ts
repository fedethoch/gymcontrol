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
  const activate = formData.get("intent") === "use";

  if (!routineTemplateId) {
    redirect("/catalogo");
  }

  let destination = `/catalogo/rutinas/${routineTemplateId}?status=save-error`;

  try {
    const result = await saveRoutineForUser({
      routineTemplateId,
      userId: auth.user.id,
      customName,
      activate,
      trainingWeekdays: formData.getAll("trainingWeekdays"),
    });

    revalidateRoutineSelection(routineTemplateId);

    const status = activate ? "active" : result.status;
    destination = `/catalogo/rutinas/${routineTemplateId}?status=${status}&savedRoutineId=${result.routine.id}`;
  } catch {
    destination = `/catalogo/rutinas/${routineTemplateId}?status=save-error`;
  }

  redirect(destination);
}

export async function activateRoutineFromCatalogAction(formData: FormData) {
  const auth = await requireUser();
  const savedRoutineId = String(formData.get("savedRoutineId") ?? "").trim();
  const routineTemplateId = String(formData.get("routineTemplateId") ?? "").trim();

  if (!routineTemplateId) {
    redirect("/catalogo");
  }

  let destination = `/catalogo/rutinas/${routineTemplateId}?status=active-error`;

  try {
    const result = savedRoutineId
      ? await toggleSavedRoutineActiveForUser({
          savedRoutineId,
          userId: auth.user.id,
          trainingWeekdays: formData.getAll("trainingWeekdays"),
        })
      : null;

    if (result) {
      revalidateRoutineSelection(routineTemplateId);

      const status = result.status === "activated" ? "active" : "inactive";
      destination = `/catalogo/rutinas/${routineTemplateId}?status=${status}&savedRoutineId=${savedRoutineId}`;
    }
  } catch {
    destination = `/catalogo/rutinas/${routineTemplateId}?status=active-error`;
  }

  redirect(destination);
}

function revalidateRoutineSelection(routineTemplateId: string) {
  revalidatePath("/");
  revalidatePath("/rutinas");
  revalidatePath("/catalogo");
  revalidatePath(`/catalogo/rutinas/${routineTemplateId}`);
}
