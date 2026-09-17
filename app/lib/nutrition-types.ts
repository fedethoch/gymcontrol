export const FOOD_CATEGORIES = ["protein", "carb", "fat", "vegetable", "mixed", "drink"] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  protein: "Proteína",
  carb: "Carbohidrato",
  fat: "Grasa",
  vegetable: "Vegetal",
  mixed: "Mixto",
  drink: "Bebida",
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

export const MEAL_TYPES = ["desayuno", "almuerzo", "merienda", "cena", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  merienda: "Merienda",
  cena: "Cena",
  snack: "Snack",
};

export const MEAL_TYPE_IMAGES: Record<MealType, string> = {
  desayuno: "/images/meals/desayuno.png",
  almuerzo: "/images/meals/almuerzo.png",
  merienda: "/images/meals/merienda.png",
  cena: "/images/meals/cena.png",
  snack: "/images/meals/snack.png",
};

export type Macros = {
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type Food = {
  id: string;
  name: string;
  category: FoodCategory;
  measure: FoodMeasure;
  servingG: number;
  gramsPerUnit: number | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  /** null = catálogo global; con valor = alimento privado de ese usuario. */
  ownerUserId: string | null;
};

/** Bebidas se registran en ml (1 ml ≈ 1 g); el resto en gramos. */
export function getAmountUnitLabel(category: FoodCategory) {
  return category === "drink" ? "ml" : "g";
}

/** Hasta cuántos días atrás se puede cargar o corregir el registro diario. */
export const MEAL_LOG_MAX_PAST_DAYS = 365;

/** Lo que se agrega a una comida: un alimento o una receta, en gramos o unidades (en recetas, porciones). */
export type MealItemInput =
  | { kind: "food"; foodId: string; measure: FoodMeasure; quantity: number }
  | { kind: "recipe"; recipeId: string; measure: FoodMeasure; quantity: number };

/** Receta lista para registrar: gramos de una porción y valores por gramo. */
export type RecipeOption = {
  id: string;
  name: string;
  servingG: number;
  kcalPerG: number;
  macrosPerG: Macros;
};

/** Alimento o receta que el usuario registra seguido (para cargarlo en 2 taps). */
export type FrequentItem = {
  kind: "food" | "recipe";
  id: string;
  uses: number;
  lastMeasure: FoodMeasure;
  lastQuantity: number;
};

/** Grupos de frecuentes: almuerzo y cena comparten; desayuno, merienda y snack van aparte. */
export const FREQUENT_SLOTS = ["desayuno", "comidas", "merienda", "snack"] as const;
export type FrequentSlot = (typeof FREQUENT_SLOTS)[number];
export type FrequentItemsBySlot = Record<FrequentSlot, FrequentItem[]>;

export function frequentSlotOf(type: MealType): FrequentSlot {
  return type === "almuerzo" || type === "cena" ? "comidas" : type;
}

export type RecipeIngredient = {
  foodId: string;
  foodName: string;
  /** Gramos en la receta entera. */
  grams: number;
  /** Kcal que aportan esos gramos. */
  kcal: number;
};

export type Recipe = {
  id: string;
  name: string;
  description: string;
  category: RecipeCategory;
  /** Gramos de una porción (los define el creador). */
  servingG: number;
  /** Peso final cocido; null = se usa la suma de ingredientes. */
  totalWeightG: number | null;
  ingredients: RecipeIngredient[];
  /** Profile id del creador (null en recetas viejas del seed). */
  createdBy: string | null;
  /** Valores de una porción. */
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  /** Por gramo, sin redondear (para registrar). */
  kcalPerG: number;
  macrosPerG: Macros;
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

/** Los 3 grupos de objetivo; cada uno tiene variantes (app/lib/nutrition-plan-options.ts). */
export const GOALS = ["cut", "maintenance", "bulk"] as const;
export type Goal = (typeof GOALS)[number];

export const GOAL_INFO: Record<Goal, { label: string; description: string }> = {
  cut: {
    label: "Déficit",
    description: "Reducir grasa corporal manteniendo masa muscular.",
  },
  maintenance: {
    label: "Mantenimiento",
    description: "Mantener el peso: recomposición o sostener lo logrado.",
  },
  bulk: {
    label: "Ganancia",
    description: "Superávit calórico para ganar músculo.",
  },
};

export const GOAL_VARIANTS = ["gentle", "moderate", "aggressive", "recomposition", "maintain", "lean", "standard"] as const;
export type GoalVariant = (typeof GOAL_VARIANTS)[number];

/** Qué variantes tiene cada objetivo, en orden de menor a mayor intensidad. */
export const VARIANTS_BY_GOAL = {
  cut: ["gentle", "moderate", "aggressive"],
  maintenance: ["recomposition", "maintain"],
  bulk: ["lean", "standard", "aggressive"],
} as const satisfies Record<Goal, readonly GoalVariant[]>;

export const MACRO_PRESETS = ["balanced", "high_protein", "high_carb", "high_fat", "keto", "custom"] as const;
export type MacroPreset = (typeof MACRO_PRESETS)[number];

// Same five levels for both sexes, with ranges shifted to each sex's typical body fat.
export const BODY_FAT_REFERENCES = {
  male: [
    { value: 12, range: "10-14%", label: "Muy bajo", description: "Definición atlética marcada, venas visibles." },
    { value: 17, range: "15-19%", label: "Bajo", description: "Abdomen definido, poca grasa visible." },
    { value: 22, range: "20-24%", label: "Moderado", description: "Contorno normal, definición leve." },
    { value: 27, range: "25-29%", label: "Alto", description: "Sobrepeso leve, sin definición muscular." },
    { value: 33, range: "30%+", label: "Muy alto", description: "Acumulación notoria de grasa corporal." },
  ],
  female: [
    { value: 17, range: "15-19%", label: "Muy bajo", description: "Definición atlética marcada, abdomen marcado." },
    { value: 22, range: "20-24%", label: "Bajo", description: "Tonificada, abdomen plano con leve definición." },
    { value: 27, range: "25-29%", label: "Moderado", description: "Contorno normal, curvas suaves sin definición." },
    { value: 32, range: "30-34%", label: "Alto", description: "Más grasa en abdomen, caderas y muslos." },
    { value: 38, range: "35%+", label: "Muy alto", description: "Acumulación notoria de grasa corporal." },
  ],
} as const satisfies Record<Gender, readonly { value: number; range: string; label: string; description: string }[]>;

export type NutritionProfileInput = {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  bodyFatPct: number | null;
  activityLevel: ActivityLevel;
  goal: Goal;
  /** Sin valor: la recomendada del objetivo. */
  goalVariant?: GoalVariant;
  /** Ajuste fino sobre el mantenimiento (−0,2 = −20%); null = el de la variante. */
  kcalAdjustment?: number | null;
  macroPreset?: MacroPreset;
  /** Solo con macroPreset "custom". */
  customProteinGPerKg?: number | null;
  customFatPct?: number | null;
  /** Mantenimiento real conocido por el usuario; reemplaza al calculado. */
  maintenanceOverrideKcal?: number | null;
  targetWeightKg?: number | null;
};

export type NutritionPlan = {
  bmr: number;
  maintenanceKcal: number;
  targetKcal: number;
  macros: Macros;
  /** Ajuste aplicado sobre el mantenimiento (−0,2 = −20%). */
  adjustment: number;
  /** El objetivo quedaba por debajo del metabolismo basal y se subió hasta él. */
  clampedToBmr: boolean;
};

export const TARGET_MODES = ["auto", "manual"] as const;
export type TargetMode = (typeof TARGET_MODES)[number];

/** Objetivo diario fijado a mano (reemplaza al calculado cuando targetMode = "manual"). */
export type ManualTarget = {
  targetKcal: number;
  macros: Macros;
};
