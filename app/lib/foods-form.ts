import type { FoodCategory, FoodMeasure } from "@/app/lib/nutrition-types";

export type FoodFormField = "name" | "category" | "measure" | "servingG" | "gramsPerUnit" | "calories" | "proteinG" | "carbsG" | "fatG";

export type FoodFormPayload = {
  foodId?: string;
  name: string;
  category: string;
  measure: string;
  servingG: string;
  gramsPerUnit: string;
  calories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
};

export type FoodFormState = {
  status: "idle" | "error" | "success";
  message: string | null;
  fieldErrors: Partial<Record<FoodFormField, string>>;
};

export const INITIAL_FOOD_FORM_STATE: FoodFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

export type ParsedFoodPayload = {
  name: string;
  category: FoodCategory;
  measure: FoodMeasure;
  servingG: number;
  gramsPerUnit: number | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};
