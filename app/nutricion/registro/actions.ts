"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/app/lib/auth";
import {
  addMealLogItem,
  createMeal,
  deleteMeal,
  deleteMealLogItem,
  getMealLogForDate,
  updateMeal,
  updateMealLogItem,
  type MealLog,
} from "@/app/lib/meal-logs";
import type { FoodMeasure, MealType } from "@/app/lib/nutrition-types";

export async function createMealAction(input: { logDate: string; name: string; type: MealType }): Promise<MealLog> {
  const auth = await requireUser();
  const log = await createMeal({
    userId: auth.user.id,
    logDate: input.logDate,
    name: input.name,
    type: input.type,
  });

  revalidatePath("/nutricion/registro");

  return log;
}

export async function updateMealAction(input: { logDate: string; mealId: string; name?: string; type?: MealType }): Promise<MealLog> {
  const auth = await requireUser();
  await updateMeal({ mealId: input.mealId, name: input.name, type: input.type });
  revalidatePath("/nutricion/registro");

  const log = await getMealLogForDate({ userId: auth.user.id, logDate: input.logDate });

  if (!log) {
    throw new Error("No se pudo leer el registro recien creado.");
  }

  return log;
}

export async function deleteMealAction(mealId: string): Promise<void> {
  await requireUser();
  await deleteMeal({ mealId });
  revalidatePath("/nutricion/registro");
}

export async function addMealLogItemAction(input: {
  logDate: string;
  mealId: string;
  foodId: string;
  measure: FoodMeasure;
  quantity: number;
}): Promise<MealLog> {
  const auth = await requireUser();
  const log = await addMealLogItem({
    userId: auth.user.id,
    logDate: input.logDate,
    mealId: input.mealId,
    foodId: input.foodId,
    measure: input.measure,
    quantity: input.quantity,
  });

  revalidatePath("/nutricion/registro");

  return log;
}

export async function updateMealLogItemAction(input: {
  logDate: string;
  itemId: string;
  measure: FoodMeasure;
  quantity: number;
}): Promise<MealLog> {
  const auth = await requireUser();
  const log = await updateMealLogItem({
    userId: auth.user.id,
    logDate: input.logDate,
    itemId: input.itemId,
    measure: input.measure,
    quantity: input.quantity,
  });

  revalidatePath("/nutricion/registro");

  return log;
}

export async function deleteMealLogItemAction(itemId: string): Promise<void> {
  await requireUser();
  await deleteMealLogItem({ itemId });
  revalidatePath("/nutricion/registro");
}
