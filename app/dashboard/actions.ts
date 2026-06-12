"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/app/lib/auth";
import {
  deleteSavedRoutineForUser,
  renameSavedRoutineForUser,
  setSavedRoutineActiveForUser,
} from "@/app/lib/saved-routines";

export async function renameSavedRoutineAction(formData: FormData) {
  const auth = await requireUser();
  const savedRoutineId = String(formData.get("savedRoutineId") ?? "").trim();
  const customName = String(formData.get("customName") ?? "");

  if (!savedRoutineId) {
    redirect("/dashboard?status=rename-error");
  }

  let destination = "/dashboard?status=rename-error";

  try {
    const renamedRoutine = await renameSavedRoutineForUser({
      savedRoutineId,
      userId: auth.user.id,
      customName,
    });

    if (!renamedRoutine) {
      destination = "/dashboard?status=rename-error";
    } else {
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/rutinas");

      destination = `/dashboard?status=renamed&savedRoutineId=${savedRoutineId}`;
    }
  } catch {
    destination = "/dashboard?status=rename-error";
  }

  redirect(destination);
}

export async function setActiveSavedRoutineAction(formData: FormData) {
  const auth = await requireUser();
  const savedRoutineId = String(formData.get("savedRoutineId") ?? "").trim();

  if (!savedRoutineId) {
    redirect("/dashboard?status=active-error");
  }

  let destination = "/dashboard?status=active-error";

  try {
    const activeRoutine = await setSavedRoutineActiveForUser({
      savedRoutineId,
      userId: auth.user.id,
    });

    if (activeRoutine) {
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/rutinas");

      destination = `/dashboard?status=active&savedRoutineId=${savedRoutineId}`;
    }
  } catch {
    destination = "/dashboard?status=active-error";
  }

  redirect(destination);
}

export async function deleteSavedRoutineAction(formData: FormData) {
  const auth = await requireUser();
  const savedRoutineId = String(formData.get("savedRoutineId") ?? "").trim();

  if (!savedRoutineId) {
    redirect("/dashboard?status=delete-error");
  }

  let destination = "/dashboard?status=delete-error";

  try {
    const result = await deleteSavedRoutineForUser({
      savedRoutineId,
      userId: auth.user.id,
    });

    if (result.deleted) {
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/rutinas");

      destination = "/dashboard?status=deleted";
    }
  } catch {
    destination = "/dashboard?status=delete-error";
  }

  redirect(destination);
}
