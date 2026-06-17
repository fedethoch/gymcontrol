export const FOOD_CATEGORIES = ["protein", "carb", "fat", "vegetable", "mixed"] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  protein: "Proteína",
  carb: "Carbohidrato",
  fat: "Grasa",
  vegetable: "Vegetal",
  mixed: "Mixto",
};

export const RECIPE_CATEGORIES = ["desayuno", "comida", "snack"] as const;
export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];

export const RECIPE_CATEGORY_LABELS: Record<RecipeCategory, string> = {
  desayuno: "Desayuno",
  comida: "Comida",
  snack: "Snack",
};

export const FOOD_MEASURES = ["g", "unit"] as const;
export type FoodMeasure = (typeof FOOD_MEASURES)[number];

export const FOOD_MEASURE_LABELS: Record<FoodMeasure, string> = {
  g: "Gramos",
  unit: "Unidades",
};

export type Macros = {
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type Food = {
  id: string;
  name: string;
  imageUrl: string;
  category: FoodCategory;
  measure: FoodMeasure;
  servingG: number;
  gramsPerUnit: number | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type RecipeIngredient = {
  foodId: string;
  foodName: string;
  grams: number;
};

export type Recipe = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: RecipeCategory;
  servings: number;
  ingredients: RecipeIngredient[];
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export const GENDERS = ["male", "female"] as const;
export type Gender = (typeof GENDERS)[number];

export const ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "high", "very_high"] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export const ACTIVITY_LEVEL_INFO: Record<ActivityLevel, { label: string; description: string; factor: number }> = {
  sedentary: {
    label: "Sedentario",
    description: "Poco o nada de ejercicio, trabajo de oficina.",
    factor: 1.2,
  },
  light: {
    label: "Actividad ligera",
    description: "Ejercicio leve 1-3 días por semana.",
    factor: 1.375,
  },
  moderate: {
    label: "Actividad moderada",
    description: "Ejercicio moderado 3-5 días por semana.",
    factor: 1.55,
  },
  high: {
    label: "Actividad alta",
    description: "Ejercicio intenso 6-7 días por semana.",
    factor: 1.725,
  },
  very_high: {
    label: "Actividad muy alta",
    description: "Ejercicio muy intenso, trabajo físico o doble sesión diaria.",
    factor: 1.9,
  },
};

export const GOALS = ["cut", "recomposition", "bulk"] as const;
export type Goal = (typeof GOALS)[number];

export const GOAL_INFO: Record<Goal, { label: string; description: string; kcalAdjustment: number }> = {
  cut: {
    label: "Definición",
    description: "Reducir grasa corporal manteniendo masa muscular.",
    kcalAdjustment: -0.2,
  },
  recomposition: {
    label: "Recomposición corporal",
    description: "Mantener peso mientras se gana músculo y se pierde grasa.",
    kcalAdjustment: 0,
  },
  bulk: {
    label: "Ganancia de masa muscular",
    description: "Superávit calórico moderado para ganar músculo.",
    kcalAdjustment: 0.1,
  },
};

export const BODY_FAT_REFERENCES = [
  { value: 12, range: "10-14%", label: "Muy bajo", description: "Definición atlética marcada, venas visibles." },
  { value: 17, range: "15-19%", label: "Bajo", description: "Abdomen definido, poca grasa visible." },
  { value: 22, range: "20-24%", label: "Moderado", description: "Contorno normal, definición leve." },
  { value: 27, range: "25-29%", label: "Alto", description: "Sobrepeso leve, sin definición muscular." },
  { value: 33, range: "30%+", label: "Muy alto", description: "Acumulación notoria de grasa corporal." },
] as const;

export type NutritionProfileInput = {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  bodyFatPct: number | null;
  activityLevel: ActivityLevel;
  goal: Goal;
};

export type NutritionPlan = {
  bmr: number;
  maintenanceKcal: number;
  targetKcal: number;
  macros: Macros;
};

