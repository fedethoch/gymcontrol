"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/app/lib/auth";
import type { FoodFormPayload, FoodFormState } from "@/app/lib/foods-form";
import { parseFoodPayload } from "@/app/lib/foods-validation";
import { createFood, deleteFood, getFoodById, updateFood } from "@/app/lib/foods";
import type { Food } from "@/app/lib/nutrition-types";

export type SaveFoodResult = FoodFormState & { food?: Food };

export async function saveFoodAction(payload: FoodFormPayload): Promise<SaveFoodResult> {
  const auth = await requireAdmin();
  const foodId = payload.foodId?.trim();
  const existingFood = foodId ? await getFoodById(foodId) : null;

  if (foodId && !existingFood) {
    return {
      status: "error",
      message: "El alimento que intentas editar ya no existe.",
      fieldErrors: {},
    };
  }

  const parsed = parseFoodPayload(payload);

  if (!parsed.ok) {
    return parsed.state;
  }

  let id = existingFood?.id ?? "";

  try {
    if (existingFood) {
      await updateFood({ id: existingFood.id, ...parsed.data });
    } else {
      id = await createFood({ ...parsed.data, createdBy: auth.profile.id });
    }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No se pudo guardar el alimento.",
      fieldErrors: {},
    };
  }

  revalidatePath("/admin/alimentos");
  revalidatePath("/alimentos");

  const food: Food = {
    id,
    imageUrl: existingFood?.imageUrl ?? "",
    ...parsed.data,
  };

  return {
    status: "success",
    message: existingFood ? "Alimento actualizado." : "Alimento creado.",
    fieldErrors: {},
    food,
  };
}

export async function deleteFoodAction(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireAdmin();

  try {
    await deleteFood(id);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo eliminar el alimento.",
    };
  }

  revalidatePath("/admin/alimentos");
  revalidatePath("/alimentos");

  return { ok: true };
}
