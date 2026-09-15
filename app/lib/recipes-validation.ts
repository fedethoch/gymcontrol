import { z } from "zod";

import { RECIPE_CATEGORIES } from "@/app/lib/nutrition-types";
import type { ParsedRecipePayload, RecipeFormPayload, RecipeFormState } from "@/app/lib/recipes-form";

const recipeTextSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingresa un nombre.")
    .max(80, "El nombre no puede superar 80 caracteres."),
  description: z.string().trim().max(280, "La descripcion no puede superar 280 caracteres."),
});

export function parseRecipePayload(
  payload: RecipeFormPayload,
): { ok: true; data: ParsedRecipePayload } | { ok: false; state: RecipeFormState } {
  const fieldErrors: RecipeFormState["fieldErrors"] = {};

  const textResult = recipeTextSchema.safeParse({
    name: payload.name,
    description: payload.description,
  });
  let name: string | null = null;
  let description = "";

  if (!textResult.success) {
    const flattened = textResult.error.flatten().fieldErrors;
    if (flattened.name?.[0]) {
      fieldErrors.name = flattened.name[0];
    }
    if (flattened.description?.[0]) {
      fieldErrors.description = flattened.description[0];
    }
  } else {
    name = textResult.data.name;
    description = textResult.data.description;
  }

  const normalizedCategory = payload.category.trim();
  let category: ParsedRecipePayload["category"] | null = null;

  if (!normalizedCategory) {
    fieldErrors.category = "Selecciona una categoria.";
  } else if (!RECIPE_CATEGORIES.includes(normalizedCategory as never)) {
    fieldErrors.category = "Selecciona una categoria valida.";
  } else {
    category = normalizedCategory as ParsedRecipePayload["category"];
  }

  const servingValue = parseGrams(payload.servingG);
  let servingG: number | null = null;

  if (servingValue == null || servingValue <= 0 || servingValue > 10_000) {
    fieldErrors.servingG = "Indicá cuántos gramos tiene una porción.";
  } else {
    servingG = roundOneDecimal(servingValue);
  }

  const totalWeightValue = payload.totalWeightG.trim() ? parseGrams(payload.totalWeightG) : null;
  let totalWeightG: number | null = null;

  if (payload.totalWeightG.trim() && (totalWeightValue == null || totalWeightValue <= 0 || totalWeightValue > 100_000)) {
    fieldErrors.totalWeightG = "Ingresá un peso final válido o dejalo vacío.";
  } else if (totalWeightValue != null) {
    totalWeightG = roundOneDecimal(totalWeightValue);
  }

  const ingredients: ParsedRecipePayload["ingredients"] = [];

  if (payload.ingredients.length === 0) {
    fieldErrors.ingredients = "Agrega al menos un ingrediente.";
  } else {
    for (const ingredient of payload.ingredients) {
      const foodId = ingredient.foodId.trim();
      const gramsValue = parseGrams(ingredient.grams);

      if (!foodId || gramsValue == null || gramsValue <= 0) {
        fieldErrors.ingredients = "Revisa los ingredientes: cada uno necesita un alimento y gramos validos.";
        break;
      }

      ingredients.push({ foodId, grams: roundOneDecimal(gramsValue) });
    }
  }

  const baseGrams = totalWeightG ?? ingredients.reduce((sum, ingredient) => sum + ingredient.grams, 0);

  if (servingG != null && !fieldErrors.ingredients && !fieldErrors.totalWeightG && servingG > baseGrams) {
    fieldErrors.servingG = "La porción no puede pesar más que la receta completa.";
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
      description,
      category: category!,
      servingG: servingG!,
      totalWeightG,
      ingredients,
    },
  };
}

/** Acepta coma decimal ("250,5"). */
function parseGrams(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  const parsed = Number(normalized);

  return normalized && Number.isFinite(parsed) ? parsed : null;
}

function roundOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}
