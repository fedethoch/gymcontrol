"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/app/lib/auth";
import type { RecipeFormPayload, RecipeFormState } from "@/app/lib/recipes-form";
import { parseRecipePayload } from "@/app/lib/recipes-validation";
import { createRecipe, deleteRecipe, getRecipeById, updateRecipe } from "@/app/lib/recipes";
import type { Recipe } from "@/app/lib/nutrition-types";

export type SaveRecipeResult = RecipeFormState & { recipe?: Recipe };

export async function saveRecipeAction(payload: RecipeFormPayload): Promise<SaveRecipeResult> {
  const auth = await requireAdmin();
  const recipeId = payload.recipeId?.trim();
  const existingRecipe = recipeId ? await getRecipeById(recipeId) : null;

  if (recipeId && !existingRecipe) {
    return {
      status: "error",
      message: "La receta que intentas editar ya no existe.",
      fieldErrors: {},
    };
  }

  const parsed = parseRecipePayload(payload);

  if (!parsed.ok) {
    return parsed.state;
  }

  let id = existingRecipe?.id ?? "";

  try {
    if (existingRecipe) {
      await updateRecipe({ id: existingRecipe.id, ...parsed.data });
    } else {
      id = await createRecipe({ ...parsed.data, createdBy: auth.profile.id });
    }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No se pudo guardar la receta.",
      fieldErrors: {},
    };
  }

  revalidatePath("/admin/recetas");
  revalidatePath("/recetas");

  const recipe = await getRecipeById(id);

  if (!recipe) {
    return {
      status: "error",
      message: "La receta se guardó pero no se pudo volver a leer.",
      fieldErrors: {},
    };
  }

  return {
    status: "success",
    message: existingRecipe ? "Receta actualizada." : "Receta creada.",
    fieldErrors: {},
    recipe,
  };
}

export async function deleteRecipeAction(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireAdmin();

  try {
    await deleteRecipe(id);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo eliminar la receta.",
    };
  }

  revalidatePath("/admin/recetas");
  revalidatePath("/recetas");

  return { ok: true };
}
