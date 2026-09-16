// Cantidades de lo que se registra (alimentos y recetas): unidades, sugerencias y nutrientes estimados.
// Sin React ni servidor: se testea con `node --test`.
import {
  FOOD_CATEGORY_LABELS,
  getAmountUnitLabel,
  type Food,
  type FoodCategory,
  type FoodMeasure,
  type FrequentItem,
  type MealItemInput,
  type RecipeOption,
} from "@/app/lib/nutrition-types";

export type PickerOption =
  | { kind: "food"; id: string; name: string; food: Food }
  | { kind: "recipe"; id: string; name: string; recipe: RecipeOption };

export type Amount = { measure: FoodMeasure; quantity: number };

export type NutritionPreview = { kcal: number; proteinG: number; carbsG: number; fatG: number };

/** Mismos topes que el servidor (`quantitySchema` en actions.ts y `MAX_ITEM_GRAMS` en meal-logs.ts). */
export const MAX_QUANTITY = 10_000;
export const MAX_ITEM_GRAMS = 50_000;

/** Gramos (o ml) de 1 unidad, si el alimento se puede registrar por unidades. */
export function getFoodGramsPerUnit(food: Pick<Food, "gramsPerUnit" | "measure" | "servingG">) {
  return food.gramsPerUnit ?? (food.measure === "unit" ? food.servingG : null);
}

/** En recetas la "unidad" es la porción que definió el creador. */
export function getOptionGramsPerUnit(option: PickerOption) {
  return option.kind === "recipe" ? option.recipe.servingG : getFoodGramsPerUnit(option.food);
}

/** Separador decimal: el registro de escritorio muestra punto; el mobile, coma (es-AR). */
export type DecimalSeparator = "." | ",";

export function formatQuantity(value: number, separator: DecimalSeparator = ".") {
  return String(Math.round(value * 100) / 100).replace(".", separator);
}

export function parseQuantity(value: string) {
  return Number(value.replace(",", ".").trim());
}

/** Kcal y macros aproximados de lo que se va a agregar (el valor final lo calcula el servidor). */
export function previewNutrition(option: PickerOption, measure: FoodMeasure, quantity: number): NutritionPreview {
  if (option.kind === "recipe") {
    const { recipe } = option;
    const grams = measure === "unit" ? quantity * recipe.servingG : quantity;

    return {
      kcal: Math.round(recipe.kcalPerG * grams),
      proteinG: Math.round(recipe.macrosPerG.proteinG * grams),
      carbsG: Math.round(recipe.macrosPerG.carbsG * grams),
      fatG: Math.round(recipe.macrosPerG.fatG * grams),
    };
  }

  const { food } = option;
  const grams = measure === "unit" ? quantity * (getFoodGramsPerUnit(food) ?? food.servingG) : quantity;
  const ratio = food.servingG > 0 ? grams / food.servingG : 0;

  return {
    kcal: Math.round(food.calories * ratio),
    proteinG: Math.round(food.proteinG * ratio),
    carbsG: Math.round(food.carbsG * ratio),
    fatG: Math.round(food.fatG * ratio),
  };
}

/**
 * Nutrientes de un ítem ya registrado con otra cantidad: escala lo que el registro calculó.
 * Sirve también para recetas archivadas, que ya no están en el catálogo.
 */
export function previewItemNutrition(
  item: { grams: number; kcal: number; proteinG: number; carbsG: number; fatG: number },
  grams: number,
): NutritionPreview {
  const ratio = item.grams > 0 ? grams / item.grams : 0;

  return {
    kcal: Math.round(item.kcal * ratio),
    proteinG: Math.round(item.proteinG * ratio),
    carbsG: Math.round(item.carbsG * ratio),
    fatG: Math.round(item.fatG * ratio),
  };
}

export function amountToGrams(amount: Amount, gramsPerUnit: number | null) {
  if (amount.measure === "g") return amount.quantity;
  return gramsPerUnit == null ? null : amount.quantity * gramsPerUnit;
}

/**
 * Cantidad con la que arranca un alimento o receta: la última que usó la persona o, si no hay,
 * 1 unidad / 1 porción o la porción base (100 g). Nunca "100 unidades".
 */
export function resolveDefaultAmount(
  option: PickerOption,
  frequent?: Pick<FrequentItem, "lastMeasure" | "lastQuantity"> | null,
): Amount {
  if (option.kind === "recipe") {
    const measure: FoodMeasure = frequent?.lastMeasure ?? "unit";
    return { measure, quantity: frequent?.lastQuantity ?? (measure === "unit" ? 1 : option.recipe.servingG) };
  }

  const canUseUnits = getFoodGramsPerUnit(option.food) != null;
  const preferred = frequent?.lastMeasure ?? option.food.measure;
  const measure: FoodMeasure = preferred === "unit" && canUseUnits ? "unit" : "g";
  const lastQuantity = frequent && frequent.lastMeasure === measure ? frequent.lastQuantity : null;

  return { measure, quantity: lastQuantity ?? (measure === "unit" ? 1 : option.food.servingG) };
}

/** Pasa la cantidad de gramos a unidades o al revés, manteniendo lo que representa. */
export function convertQuantity(quantity: number, to: FoodMeasure, gramsPerUnit: number | null) {
  if (!gramsPerUnit || !Number.isFinite(quantity) || quantity <= 0) return quantity;
  const converted = to === "unit" ? quantity / gramsPerUnit : quantity * gramsPerUnit;
  return Math.round(converted * 100) / 100;
}

/** Salto de −/+: media unidad o porción, 10 g, 50 ml. */
export function quantityStep(measure: FoodMeasure, amountUnit: "g" | "ml") {
  if (measure === "unit") return 0.5;
  return amountUnit === "ml" ? 50 : 10;
}

/** `null` si la cantidad es válida; si no, el mismo mensaje que daría el servidor. */
export function validateAmount(amount: Amount, gramsPerUnit: number | null) {
  if (!Number.isFinite(amount.quantity)) return "Ingresá una cantidad válida.";
  if (amount.quantity <= 0) return "Ingresá una cantidad mayor a 0.";
  if (amount.quantity > MAX_QUANTITY) return "La cantidad es demasiado grande.";

  const grams = amountToGrams(amount, gramsPerUnit);

  if (grams !== null && grams > MAX_ITEM_GRAMS) {
    return "Revisá la cantidad: es demasiado chica o demasiado grande.";
  }

  return null;
}

export function toMealItemInput(option: Pick<PickerOption, "kind" | "id">, amount: Amount): MealItemInput {
  return option.kind === "recipe"
    ? { kind: "recipe", recipeId: option.id, measure: amount.measure, quantity: amount.quantity }
    : { kind: "food", foodId: option.id, measure: amount.measure, quantity: amount.quantity };
}

export function measureLabels(subject: { kind: "food" | "recipe"; category: FoodCategory | null }) {
  const amountUnit: "g" | "ml" = subject.category ? getAmountUnitLabel(subject.category) : "g";

  return {
    amountUnit,
    amountLabel: amountUnit === "ml" ? "Mililitros" : "Gramos",
    unitLabel: subject.kind === "recipe" ? "Porciones" : "Unidades",
  } as const;
}

export function optionKey(option: { kind: string; id: string }) {
  return `${option.kind}:${option.id}`;
}

export function optionCategory(option: PickerOption): FoodCategory | null {
  return option.kind === "food" ? option.food.category : null;
}

export function formatServings(quantity: number, separator: DecimalSeparator = ".") {
  return `${formatQuantity(quantity, separator)} ${quantity === 1 ? "porción" : "porciones"}`;
}

/** "150 g", "250 ml", "2 u", "1 porción". */
export function formatAmount(
  amount: Amount,
  subject: { kind: "food" | "recipe"; category: FoodCategory | null },
  separator: DecimalSeparator = ".",
) {
  if (subject.kind === "recipe" && amount.measure === "unit") return formatServings(amount.quantity, separator);
  if (amount.measure === "unit") return `${formatQuantity(amount.quantity, separator)} u`;
  return `${formatQuantity(amount.quantity, separator)} ${subject.category ? getAmountUnitLabel(subject.category) : "g"}`;
}

export function formatItemAmount(
  item: {
    kind: "food" | "recipe";
    category: FoodCategory | null;
    measure: FoodMeasure;
    quantity: number;
    grams: number;
  },
  separator: DecimalSeparator = ".",
) {
  if (item.kind === "recipe" && item.measure === "unit") {
    return formatServings(item.quantity, separator);
  }

  if (item.measure === "unit") {
    return `${formatQuantity(item.quantity, separator)} u`;
  }

  return `${formatQuantity(item.grams, separator)} ${item.category ? getAmountUnitLabel(item.category) : "g"}`;
}

export function describeOption(option: PickerOption, isFrequent: boolean) {
  const parts =
    option.kind === "recipe"
      ? ["Receta", `1 porción = ${formatQuantity(option.recipe.servingG)} g`]
      : [option.food.ownerUserId ? "Tuyo" : null, FOOD_CATEGORY_LABELS[option.food.category]];

  if (isFrequent) {
    parts.push("Frecuente");
  }

  return parts.filter(Boolean).join(" · ");
}

export function optionKcalLabel(option: PickerOption) {
  if (option.kind === "recipe") {
    return `${Math.round(option.recipe.kcalPerG * option.recipe.servingG)} kcal/porción`;
  }

  return `${option.food.calories} kcal/${option.food.servingG} ${getAmountUnitLabel(option.food.category)}`;
}
