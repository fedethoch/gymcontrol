"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/app/lib/auth";
import { createFood, deleteFood, getFoodById, updateFood } from "@/app/lib/foods";
import type { FoodFormPayload, FoodFormState } from "@/app/lib/foods-form";
import { parseFoodPayload } from "@/app/lib/foods-validation";
import type { Food } from "@/app/lib/nutrition-types";

export type SaveOwnFoodResult = FoodFormState & { food?: Food };

/** Crea o edita un alimento privado del usuario (solo él lo ve). */
export async function saveOwnFoodAction(payload: FoodFormPayload): Promise<SaveOwnFoodResult> {
  const auth = await requireUser();
  const foodId = payload.foodId?.trim() || null;
  const parsed = parseFoodPayload(payload);

  if (!parsed.ok) {
    return parsed.state;
  }

  let id = foodId ?? "";

  try {
    if (foodId) {
      const existingFood = await getFoodById(foodId, auth.user.id);

      if (!existingFood) {
        return { status: "error", message: "El alimento que intentás editar ya no existe.", fieldErrors: {} };
      }

      await updateFood({ id: foodId, ownerUserId: auth.user.id, ...parsed.data });
    } else {
      id = await createFood({ ...parsed.data, createdBy: auth.profile.id, ownerUserId: auth.user.id });
    }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No se pudo guardar el alimento.",
      fieldErrors: {},
    };
  }

  revalidatePath("/alimentos");
  revalidatePath("/nutricion/registro");

  return {
    status: "success",
    message: foodId ? "Alimento actualizado." : "Alimento creado.",
    fieldErrors: {},
    food: { id, ...parsed.data, ownerUserId: auth.user.id },
  };
}

export async function deleteOwnFoodAction(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const auth = await requireUser();

  try {
    await deleteFood(id, auth.user.id);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo eliminar el alimento." };
  }

  revalidatePath("/alimentos");
  revalidatePath("/nutricion/registro");

  return { ok: true };
}
