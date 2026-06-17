import type { RecipeCategory } from "@/app/lib/nutrition-types";

export type RecipeFormField = "name" | "description" | "category" | "servings" | "ingredients";

export type RecipeIngredientPayload = {
  foodId: string;
  grams: string;
};

export type RecipeFormPayload = {
  recipeId?: string;
  name: string;
  description: string;
  category: string;
  servings: string;
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
  servings: number;
  ingredients: { foodId: string; grams: number }[];
};
