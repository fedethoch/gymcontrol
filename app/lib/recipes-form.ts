import type { RecipeCategory } from "@/app/lib/nutrition-types";

export type RecipeFormField = "name" | "description" | "category" | "servingG" | "totalWeightG" | "ingredients";

export type RecipeIngredientPayload = {
  foodId: string;
  grams: string;
};

export type RecipeFormPayload = {
  recipeId?: string;
  name: string;
  description: string;
  category: string;
  /** Gramos de una porción (obligatorio). */
  servingG: string;
  /** Peso final cocido (opcional). */
  totalWeightG: string;
  ingredients: RecipeIngredientPayload[];
};

export type RecipeFormState = {
  status: "idle" | "error" | "success";
  message: string | null;
  fieldErrors: Partial<Record<RecipeFormField, string>>;
};

export const INITIAL_RECIPE_FORM_STATE: RecipeFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

export type ParsedRecipePayload = {
  name: string;
  description: string;
  category: RecipeCategory;
  servingG: number;
  totalWeightG: number | null;
  ingredients: { foodId: string; grams: number }[];
};
