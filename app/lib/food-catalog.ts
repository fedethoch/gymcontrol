/**
 * Lógica pura del catálogo de alimentos (`/alimentos`, DESIGN.md §13): chips, búsqueda, orden,
 * grupos, porciones, anillo de macros y el link "Registrar" al registro diario.
 * Solo importa libs puras (`nutrition-types`, `food-search`): se testea con `node --test`
 * (tests/unit/food-catalog.test.mjs).
 */
import { searchByName } from "@/app/lib/food-search";
import {
  FOOD_CATEGORIES,
  FOOD_CATEGORY_LABELS,
  FOOD_MEASURES,
  getAmountUnitLabel,
  type Food,
  type FoodCategory,
  type FoodMeasure,
  type FrequentItem,
  type MealItemInput,
} from "@/app/lib/nutrition-types";

export type FoodChip = "all" | "own" | FoodCategory;
export type FoodSort = "relevance" | "protein" | "kcal";
export type CatalogQuery = { query: string; chip: FoodChip; sort: FoodSort };
export type ChipCounts = Record<FoodChip, number>;
export type ChipOption = { value: FoodChip; label: string; count: number | null };
export type FoodGroup = { category: FoodCategory; label: string; total: number; foods: Food[] };
export type MacroGrams = { proteinG: number; carbsG: number; fatG: number };
export type MacroShare = { protein: number; carbs: number; fat: number };
export type MacroKcalSplit = { kcal: MacroShare; total: number; pct: MacroShare };
export type FoodPortion = { measure: FoodMeasure; quantity: number; grams: number; label: string; action: string };
export type PortionNutrition = MacroGrams & { kcal: number };
export type FrequentFoodTile = { food: Food; measure: FoodMeasure; quantity: number; kcal: number; label: string };
export type RegistroFoodItem = Extract<MealItemInput, { kind: "food" }>;
export type RegistroFoodParams = {
  alimento?: string | string[];
  medida?: string | string[];
  cantidad?: string | string[];
};

export const CATALOG_PAGE_SIZE = 60;
/** Mismo tope que `quantitySchema` en `app/nutricion/registro/actions.ts`. */
export const MAX_LOG_QUANTITY = 10_000;
export const FOOD_SORTS: readonly FoodSort[] = ["relevance", "protein", "kcal"];
export const FOOD_SORT_LABELS: Record<FoodSort, string> = {
  relevance: "Relevancia",
  protein: "Más proteína",
  kcal: "Menos calorías",
};

const OWN_FOOD_BOOST = 10;
const QUANTITY_PATTERN = /^\d+(?:[.,]\d+)?$/;

/** Gramos (o ml) de 1 unidad, si el alimento se puede registrar por unidades (misma regla que el registro). */
export function getFoodGramsPerUnit(food: Pick<Food, "gramsPerUnit" | "measure" | "servingG">) {
  return food.gramsPerUnit ?? (food.measure === "unit" ? food.servingG : null);
}

export function formatQuantity(value: number) {
  return String(Math.round(value * 100) / 100);
}

/** Número para mostrar en es-AR: coma decimal y hasta `decimals` decimales ("30,5"). */
export function formatDecimal(value: number, decimals = 1) {
  const factor = 10 ** decimals;
  return String(Math.round(value * factor) / factor).replace(".", ",");
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

export function portionGrams(food: Food, measure: FoodMeasure, quantity: number) {
  return measure === "unit" ? quantity * (getFoodGramsPerUnit(food) ?? food.servingG) : quantity;
}

/** Kcal (enteras, como el preview del registro) y macros (1 decimal) de `grams` del alimento. */
export function nutritionForGrams(food: Food, grams: number): PortionNutrition {
  const ratio = food.servingG > 0 ? grams / food.servingG : 0;

  return {
    kcal: Math.round(food.calories * ratio),
    proteinG: roundOne(food.proteinG * ratio),
    carbsG: roundOne(food.carbsG * ratio),
    fatG: roundOne(food.fatG * ratio),
  };
}

/** Porciones del detalle: la base (`servingG`) y, si existe, 1 unidad. Sin duplicados si pesan lo mismo. */
export function foodPortions(food: Food): FoodPortion[] {
  const unit = getAmountUnitLabel(food.category);
  const base: FoodPortion = {
    measure: "g",
    quantity: food.servingG,
    grams: food.servingG,
    label: `${formatDecimal(food.servingG)} ${unit}`,
    action: `Registrar ${formatDecimal(food.servingG)} ${unit}`,
  };
  const unitGrams = getFoodGramsPerUnit(food);

  if (unitGrams == null) {
    return [base];
  }

  const single: FoodPortion = {
    measure: "unit",
    quantity: 1,
    grams: unitGrams,
    label: `1 unidad · ${formatDecimal(unitGrams)} ${unit}`,
    action: "Registrar 1 unidad",
  };

  if (unitGrams === food.servingG) {
    return [food.measure === "unit" ? single : base];
  }

  return [base, single];
}

export function defaultFoodPortion(food: Food, preferred?: FoodMeasure): FoodPortion {
  const portions = foodPortions(food);
  const measure = preferred ?? food.measure;

  return portions.find((portion) => portion.measure === measure) ?? portions[0];
}

/** Calorías de cada macro (P×4, C×4, G×9) y su % entero; los % suman 100 (mayor resto) o son todos 0. */
export function splitMacroKcal(macros: MacroGrams): MacroKcalSplit {
  const kcal: MacroShare = { protein: macros.proteinG * 4, carbs: macros.carbsG * 4, fat: macros.fatG * 9 };
  const total = kcal.protein + kcal.carbs + kcal.fat;

  if (!(total > 0)) {
    return { kcal, total: 0, pct: { protein: 0, carbs: 0, fat: 0 } };
  }

  const keys = ["protein", "carbs", "fat"] as const;
  const exact = keys.map((key) => (kcal[key] / total) * 100);
  const floors = exact.map(Math.floor);
  let remaining = 100 - floors.reduce((sum, value) => sum + value, 0);
  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - floors[index] }))
    .sort((left, right) => right.remainder - left.remainder || left.index - right.index);

  for (const { index } of byRemainder) {
    if (remaining <= 0) break;
    floors[index] += 1;
    remaining -= 1;
  }

  return { kcal, total, pct: { protein: floors[0], carbs: floors[1], fat: floors[2] } };
}

/** "100 g · 1 u ≈ 50 g" (el peso por unidad solo si el alimento lo define). */
export function formatServingLine(food: Food) {
  const unit = getAmountUnitLabel(food.category);
  const base = `${formatDecimal(food.servingG)} ${unit}`;

  return food.gramsPerUnit != null ? `${base} · 1 u ≈ ${formatDecimal(food.gramsPerUnit)} ${unit}` : base;
}

export function countFoodsByChip(foods: readonly Food[]): ChipCounts {
  const counts = { all: foods.length, own: 0 } as ChipCounts;

  for (const category of FOOD_CATEGORIES) {
    counts[category] = 0;
  }

  for (const food of foods) {
    counts[food.category] += 1;

    if (food.ownerUserId) {
      counts.own += 1;
    }
  }

  return counts;
}

/** Chips: Todos, Tuyos (con sesión, aunque esté vacío) y las categorías que tienen alimentos. */
export function chipOptions(counts: ChipCounts, signedIn: boolean): ChipOption[] {
  const options: ChipOption[] = [{ value: "all", label: "Todos", count: null }];

  if (signedIn) {
    options.push({ value: "own", label: "Tuyos", count: counts.own });
  }

  for (const category of FOOD_CATEGORIES) {
    if (counts[category] > 0) {
      options.push({ value: category, label: FOOD_CATEGORY_LABELS[category], count: counts[category] });
    }
  }

  return options;
}

/** "505 alimentos · 1 tuyo". */
export function formatCatalogMeta(counts: ChipCounts, signedIn: boolean) {
  const total = `${counts.all} ${counts.all === 1 ? "alimento" : "alimentos"}`;

  return signedIn && counts.own > 0 ? `${total} · ${counts.own} ${counts.own === 1 ? "tuyo" : "tuyos"}` : total;
}

export function filterFoodsByChip(foods: readonly Food[], chip: FoodChip): Food[] {
  if (chip === "all") return [...foods];
  if (chip === "own") return foods.filter((food) => food.ownerUserId !== null);
  return foods.filter((food) => food.category === chip);
}

/** Valor normalizado cada 100 g/ml (los alimentos propios pueden tener otra porción base). */
export function per100(food: Pick<Food, "servingG">, value: number) {
  return food.servingG > 0 ? (value * 100) / food.servingG : 0;
}

function sortKey(food: Food, sort: Exclude<FoodSort, "relevance">) {
  if (sort === "protein") {
    return -per100(food, food.proteinG);
  }

  return food.servingG > 0 ? per100(food, food.calories) : Number.POSITIVE_INFINITY;
}

/** Orden estable: "protein" de más a menos proteína y "kcal" de menos a más calorías, cada 100 g. */
export function sortFoods(foods: readonly Food[], sort: FoodSort): Food[] {
  if (sort === "relevance") {
    return [...foods];
  }

  return foods
    .map((food, index) => ({ food, index, key: sortKey(food, sort) }))
    .sort((left, right) => left.key - right.key || left.index - right.index)
    .map((entry) => entry.food);
}

/** Categorías en el orden de los chips, respetando el orden del servidor dentro de cada una. */
function orderByCategory(foods: readonly Food[]): Food[] {
  const rank = new Map(FOOD_CATEGORIES.map((category, index) => [category, index]));

  return foods
    .map((food, index) => ({ food, index }))
    .sort((left, right) => (rank.get(left.food.category) ?? 0) - (rank.get(right.food.category) ?? 0) || left.index - right.index)
    .map((entry) => entry.food);
}

export function isGroupedCatalog(query: CatalogQuery) {
  return !query.query.trim() && query.chip === "all" && query.sort === "relevance";
}

/** Chip → búsqueda (propios primero a igual relevancia) → orden. Sin búsqueda conserva el orden del servidor. */
export function searchCatalog(foods: readonly Food[], query: CatalogQuery): Food[] {
  const inChip = filterFoodsByChip(foods, query.chip);
  const text = query.query.trim();

  if (text) {
    const matched = searchByName(inChip, text, { boost: (food) => (food.ownerUserId ? OWN_FOOD_BOOST : 0) });
    return sortFoods(matched, query.sort);
  }

  if (query.sort !== "relevance") {
    return sortFoods(inChip, query.sort);
  }

  return isGroupedCatalog(query) ? orderByCategory(inChip) : inChip;
}

/** Grupos por categoría de lo visible, con el total de la categoría en todo el catálogo. */
export function groupFoodsByCategory(visible: readonly Food[], counts: ChipCounts): FoodGroup[] {
  return FOOD_CATEGORIES.map((category) => ({
    category,
    label: FOOD_CATEGORY_LABELS[category],
    total: counts[category],
    foods: visible.filter((food) => food.category === category),
  })).filter((group) => group.foods.length > 0);
}

/** Tiles de "Frecuentes": solo alimentos que el usuario todavía ve, con la kcal de la última porción. */
export function frequentFoodTiles(items: readonly FrequentItem[], foods: readonly Food[], limit = 10): FrequentFoodTile[] {
  const byId = new Map(foods.map((food) => [food.id, food]));
  const tiles: FrequentFoodTile[] = [];

  for (const item of items) {
    if (tiles.length >= limit) break;
    if (item.kind !== "food") continue;

    const food = byId.get(item.id);
    if (!food) continue;

    const measure: FoodMeasure = item.lastMeasure === "unit" && getFoodGramsPerUnit(food) != null ? "unit" : "g";
    const quantity = measure === item.lastMeasure ? item.lastQuantity : food.servingG;
    const amount =
      measure === "unit"
        ? `${formatDecimal(quantity, 2)} u`
        : `${formatDecimal(quantity, 2)} ${getAmountUnitLabel(food.category)}`;

    tiles.push({
      food,
      measure,
      quantity,
      kcal: nutritionForGrams(food, portionGrams(food, measure, quantity)).kcal,
      label: `${amount} · ${item.uses} ${item.uses === 1 ? "vez" : "veces"}`,
    });
  }

  return tiles;
}

/** Link "Registrar": `/nutricion/registro?alimento=<id>&medida=<g|unit>&cantidad=<n>`. */
export function registroFoodHref(item: { foodId: string; measure: FoodMeasure; quantity: number }) {
  const params = new URLSearchParams({
    alimento: item.foodId,
    medida: item.measure,
    cantidad: formatQuantity(item.quantity),
  });

  return `/nutricion/registro?${params.toString()}`;
}

function firstParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/**
 * Lee el link "Registrar". Devuelve null si falta algo, si el alimento no está entre los que ve el
 * usuario, si pide unidades a un alimento sin peso por unidad o si la cantidad no es válida.
 */
export function parseRegistroFoodParams(params: RegistroFoodParams, foods: readonly Food[]): RegistroFoodItem | null {
  const foodId = firstParam(params.alimento);
  const measure = firstParam(params.medida);
  const rawQuantity = firstParam(params.cantidad);

  if (!foodId || !QUANTITY_PATTERN.test(rawQuantity)) return null;
  if (!(FOOD_MEASURES as readonly string[]).includes(measure)) return null;

  const food = foods.find((candidate) => candidate.id === foodId);
  if (!food) return null;
  if (measure === "unit" && getFoodGramsPerUnit(food) == null) return null;

  const quantity = Number(rawQuantity.replace(",", "."));
  if (!(quantity > 0) || quantity > MAX_LOG_QUANTITY) return null;

  return { kind: "food", foodId: food.id, measure: measure as FoodMeasure, quantity };
}
