import { Apple, Beef, Droplet, Leaf, Sunrise, UtensilsCrossed, Wheat } from "lucide-react";

import type { FoodCategory, RecipeCategory } from "@/app/lib/nutrition-types";

/**
 * Paleta fija de macronutrientes. Se usa en toda la seccion de nutricion
 * (cards, anillos, barras) para que protein/carb/fat sean reconocibles
 * de un vistazo, igual color en todas las vistas.
 */
export const MACRO_COLORS = {
  protein: "#f4717f",
  carbs: "#fbbf65",
  fat: "#5ec8f8",
} as const;

export const MACRO_LABELS = {
  protein: "Proteínas",
  carbs: "Carbohidratos",
  fat: "Grasas",
} as const;

export const CATEGORY_ICONS: Record<FoodCategory, typeof Beef> = {
  protein: Beef,
  carb: Wheat,
  fat: Droplet,
  vegetable: Leaf,
  mixed: UtensilsCrossed,
};

export const CATEGORY_GRADIENTS: Record<FoodCategory, string> = {
  protein: "linear-gradient(140deg,#3a1620 0%,#1a1422 50%,#0a090f 100%)",
  carb: "linear-gradient(140deg,#3a2a0c 0%,#1f1a16 50%,#0c0a08 100%)",
  fat: "linear-gradient(140deg,#0c2a3a 0%,#141c26 50%,#080c10 100%)",
  vegetable: "linear-gradient(140deg,#0e2612 0%,#0d1820 50%,#070a10 100%)",
  mixed: "linear-gradient(140deg,#2e1a58 0%,#141828 55%,#08090f 100%)",
};

export const CATEGORY_ACCENT: Record<FoodCategory, string> = {
  protein: MACRO_COLORS.protein,
  carb: MACRO_COLORS.carbs,
  fat: MACRO_COLORS.fat,
  vegetable: "#7adf9c",
  mixed: "#b995ff",
};

// Recipe-specific category maps (meal-type: desayuno/comida/snack)
export const RECIPE_CATEGORY_ICONS: Record<RecipeCategory, typeof Beef> = {
  desayuno: Sunrise,
  comida: UtensilsCrossed,
  snack: Apple,
};

export const RECIPE_CATEGORY_GRADIENTS: Record<RecipeCategory, string> = {
  desayuno: "linear-gradient(140deg,#3a2c08 0%,#1e1a10 50%,#0a0906 100%)",
  comida: "linear-gradient(140deg,#3a1a08 0%,#1e1410 50%,#0a0806 100%)",
  snack: "linear-gradient(140deg,#0e2614 0%,#0d1a14 50%,#070a0a 100%)",
};

export const RECIPE_CATEGORY_ACCENT: Record<RecipeCategory, string> = {
  desayuno: "#f5c518",
  comida: "#f4874b",
  snack: "#4cd38b",
};
