import { z } from "zod";

import { FOOD_CATEGORIES, FOOD_MEASURES } from "@/app/lib/nutrition-types";
import type { FoodFormPayload, FoodFormState, ParsedFoodPayload } from "@/app/lib/foods-form";

const foodTextSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingresa un nombre.")
    .max(80, "El nombre no puede superar 80 caracteres."),
});

const NUMERIC_FIELDS = ["servingG", "calories", "proteinG", "carbsG", "fatG"] as const;

export function parseFoodPayload(
  payload: FoodFormPayload,
): { ok: true; data: ParsedFoodPayload } | { ok: false; state: FoodFormState } {
  const fieldErrors: FoodFormState["fieldErrors"] = {};

  const textResult = foodTextSchema.safeParse({ name: payload.name });
  let name: string | null = null;

  if (!textResult.success) {
    const flattened = textResult.error.flatten().fieldErrors;
    if (flattened.name?.[0]) {
      fieldErrors.name = flattened.name[0];
    }
  } else {
    name = textResult.data.name;
  }

  const normalizedCategory = payload.category.trim();
  let category: ParsedFoodPayload["category"] | null = null;

  if (!normalizedCategory) {
    fieldErrors.category = "Selecciona una categoria.";
  } else if (!FOOD_CATEGORIES.includes(normalizedCategory as never)) {
    fieldErrors.category = "Selecciona una categoria valida.";
  } else {
    category = normalizedCategory as ParsedFoodPayload["category"];
  }

  const normalizedMeasure = payload.measure.trim();
  let measure: ParsedFoodPayload["measure"] | null = null;

  if (!normalizedMeasure) {
    fieldErrors.measure = "Selecciona una unidad de medida.";
  } else if (!FOOD_MEASURES.includes(normalizedMeasure as never)) {
    fieldErrors.measure = "Selecciona una unidad de medida valida.";
  } else {
    measure = normalizedMeasure as ParsedFoodPayload["measure"];
  }

  const numericValues: Partial<Record<(typeof NUMERIC_FIELDS)[number], number>> = {};

  for (const field of NUMERIC_FIELDS) {
    const raw = payload[field].trim();
    const value = Number(raw);

    if (!raw || !Number.isFinite(value) || value < 0) {
      fieldErrors[field] = "Ingresa un numero valido.";
      continue;
    }

    if (field === "servingG" && value <= 0) {
      fieldErrors[field] = "La porcion debe ser mayor a 0.";
      continue;
    }

    numericValues[field] = Math.round(value);
  }

  const rawGramsPerUnit = payload.gramsPerUnit.trim();
  let gramsPerUnit: number | null = null;

  if (rawGramsPerUnit) {
    const value = Number(rawGramsPerUnit);

    if (!Number.isFinite(value) || value <= 0) {
      fieldErrors.gramsPerUnit = "Ingresa un numero valido mayor a 0.";
    } else {
      gramsPerUnit = Math.round(value);
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      state: {
        status: "error",
        message: "Revisa los campos marcados.",
        fieldErrors,
      },
    };
  }

  return {
    ok: true,
    data: {
      name: name!,
      category: category!,
      measure: measure!,
      servingG: numericValues.servingG!,
      gramsPerUnit,
      calories: numericValues.calories!,
      proteinG: numericValues.proteinG!,
      carbsG: numericValues.carbsG!,
      fatG: numericValues.fatG!,
    },
  };
}
