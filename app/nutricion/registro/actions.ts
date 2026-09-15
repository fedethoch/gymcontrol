"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/app/lib/auth";
import { addDaysToDateKey, getTodayDateKey, isDateKey } from "@/app/lib/local-date";
import {
  addMealItems,
  createMealWithItems,
  deleteMeal,
  deleteMealItem,
  updateMeal,
  updateMealItem,
  type MealLog,
} from "@/app/lib/meal-logs";
import { FOOD_MEASURES, MEAL_LOG_MAX_PAST_DAYS, MEAL_TYPES } from "@/app/lib/nutrition-types";

export type MealLogActionResult = { ok: true; log: MealLog } | { ok: false; message: string };

const logDateSchema = z.string().refine((value) => {
  const today = getTodayDateKey();
  return isDateKey(value) && value <= today && value >= addDaysToDateKey(today, -MEAL_LOG_MAX_PAST_DAYS);
}, "Elegí un día válido.");

const quantitySchema = z.number("Ingresá una cantidad válida.").positive("Ingresá una cantidad mayor a 0.").max(10_000, "La cantidad es demasiado grande.");
const mealNameSchema = z.string().trim().min(1, "Ponele un nombre a la comida.").max(60, "El nombre no puede superar 60 caracteres.");

const itemSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("food"), foodId: z.uuid(), measure: z.enum(FOOD_MEASURES), quantity: quantitySchema }),
  z.object({ kind: z.literal("recipe"), recipeId: z.uuid(), quantity: quantitySchema.max(50, "Máximo 50 porciones.") }),
]);

const createMealSchema = z.object({
  logDate: logDateSchema,
  name: mealNameSchema,
  type: z.enum(MEAL_TYPES),
  items: z.array(itemSchema).min(1, "Agregá al menos un alimento.").max(50, "Máximo 50 alimentos por comida."),
});

const updateMealSchema = z
  .object({
    logDate: logDateSchema,
    mealId: z.uuid(),
    name: mealNameSchema.optional(),
    type: z.enum(MEAL_TYPES).optional(),
  })
  .refine((value) => value.name !== undefined || value.type !== undefined, "No hay cambios para guardar.");

const mealRefSchema = z.object({ logDate: logDateSchema, mealId: z.uuid() });

const addItemSchema = z.object({ logDate: logDateSchema, mealId: z.uuid(), item: itemSchema });

const updateItemSchema = z.object({
  logDate: logDateSchema,
  itemId: z.uuid(),
  measure: z.enum(FOOD_MEASURES),
  quantity: quantitySchema,
});

const itemRefSchema = z.object({ logDate: logDateSchema, itemId: z.uuid() });

async function runMealLogAction<T>(
  schema: z.ZodType<T>,
  input: unknown,
  task: (data: T, userId: string) => Promise<MealLog>,
): Promise<MealLogActionResult> {
  const auth = await requireUser();
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  }

  try {
    const log = await task(parsed.data, auth.user.id);

    revalidatePath("/nutricion/registro");
    revalidatePath("/");

    return { ok: true, log };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo guardar el registro." };
  }
}

export async function createMealAction(input: z.input<typeof createMealSchema>) {
  return runMealLogAction(createMealSchema, input, (data, userId) => createMealWithItems({ userId, ...data }));
}

export async function updateMealAction(input: z.input<typeof updateMealSchema>) {
  return runMealLogAction(updateMealSchema, input, (data, userId) => updateMeal({ userId, ...data }));
}

export async function deleteMealAction(input: z.input<typeof mealRefSchema>) {
  return runMealLogAction(mealRefSchema, input, (data, userId) => deleteMeal({ userId, ...data }));
}

export async function addMealItemAction(input: z.input<typeof addItemSchema>) {
  return runMealLogAction(addItemSchema, input, (data, userId) =>
    addMealItems({ userId, logDate: data.logDate, mealId: data.mealId, items: [data.item] }),
  );
}

export async function updateMealItemAction(input: z.input<typeof updateItemSchema>) {
  return runMealLogAction(updateItemSchema, input, (data, userId) => updateMealItem({ userId, ...data }));
}

export async function deleteMealItemAction(input: z.input<typeof itemRefSchema>) {
  return runMealLogAction(itemRefSchema, input, (data, userId) => deleteMealItem({ userId, ...data }));
}
