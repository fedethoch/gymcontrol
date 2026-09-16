import type { FoodMeasure, MealItemInput, MealType } from "@/app/lib/nutrition-types";
import {
  addMealItemAction,
  createMealAction,
  deleteMealAction,
  deleteMealItemAction,
  moveMealAction,
  refreshMealLogAction,
  updateMealAction,
  updateMealItemAction,
  type MealLogActionResult,
} from "@/app/nutricion/registro/actions";

/** Las acciones que usa el registro mobile (inyectables para la vista previa con datos de ejemplo). */
export type DiaryActions = {
  createMeal: (input: {
    logDate: string;
    name: string;
    type: MealType;
    afterMealId?: string | null;
    items: MealItemInput[];
  }) => Promise<MealLogActionResult>;
  addItem: (input: { logDate: string; mealId: string; item: MealItemInput }) => Promise<MealLogActionResult>;
  updateItem: (input: {
    logDate: string;
    itemId: string;
    measure: FoodMeasure;
    quantity: number;
  }) => Promise<MealLogActionResult>;
  deleteItem: (input: { logDate: string; itemId: string }) => Promise<MealLogActionResult>;
  deleteMeal: (input: { logDate: string; mealId: string }) => Promise<MealLogActionResult>;
  moveMeal: (input: { logDate: string; mealId: string; direction: "up" | "down" }) => Promise<MealLogActionResult>;
  updateMeal: (input: { logDate: string; mealId: string; name?: string; type?: MealType }) => Promise<MealLogActionResult>;
  refresh: (input: { logDate: string }) => Promise<MealLogActionResult>;
};

export const serverDiaryActions: DiaryActions = {
  createMeal: createMealAction,
  addItem: addMealItemAction,
  updateItem: updateMealItemAction,
  deleteItem: deleteMealItemAction,
  deleteMeal: deleteMealAction,
  moveMeal: moveMealAction,
  updateMeal: updateMealAction,
  refresh: refreshMealLogAction,
};
