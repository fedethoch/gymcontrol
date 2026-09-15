"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/app/lib/auth";
import type { Recipe } from "@/app/lib/nutrition-types";
import { archiveRecipe, getRecipeById, saveRecipe } from "@/app/lib/recipes";
import type { RecipeFormPayload, RecipeFormState } from "@/app/lib/recipes-form";
import { parseRecipePayload } from "@/app/lib/recipes-validation";

export type SaveRecipeResult = RecipeFormState & { recipe?: Recipe };

/**
 * Crea o edita una receta pública. Cualquier usuario crea; editar queda para el creador o un admin
 * (lo valida la RPC `save_recipe` con RLS). Las comidas ya registradas no cambian: guardan su snapshot.
 */
export async function saveRecipeAction(payload: RecipeFormPayload): Promise<SaveRecipeResult> {
  await requireUser();
  const recipeId = payload.recipeId?.trim() || null;
  const parsed = parseRecipePayload(payload);

  if (!parsed.ok) {
    return parsed.state;
  }

  let id: string;

  try {
    id = await saveRecipe({ id: recipeId, ...parsed.data });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No se pudo guardar la receta.",
      fieldErrors: {},
    };
  }

  revalidateRecipePaths();

  const recipe = await getRecipeById(id);

  if (!recipe) {
    return { status: "error", message: "La receta se guardó pero no se pudo volver a leer.", fieldErrors: {} };
  }

  return {
    status: "success",
    message: recipeId ? "Receta actualizada." : "Receta publicada.",
    fieldErrors: {},
    recipe,
  };
}

/** Archiva la receta (creador o admin): sale del catálogo, las comidas que la usaron quedan intactas. */
export async function archiveRecipeAction(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireUser();

  try {
    await archiveRecipe(id);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo eliminar la receta." };
  }

  revalidateRecipePaths();

  return { ok: true };
}

function revalidateRecipePaths() {
  revalidatePath("/recetas");
  revalidatePath("/admin/recetas");
  revalidatePath("/nutricion/registro");
}
