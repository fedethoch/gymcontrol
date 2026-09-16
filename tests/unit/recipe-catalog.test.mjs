import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  countRecipesByChip,
  filterRecipesByChip,
  findMatchRange,
  formatPortions,
  formatRecipesMeta,
  groupRecipesByCategory,
  ingredientLine,
  isGroupedRecipes,
  mealChoiceLabel,
  parseRegistroRecipeParams,
  recipeChipOptions,
  recipeIngredientRows,
  recipePortion,
  registerRecipeLabel,
  registroRecipeHref,
  searchRecipes,
  sortRecipes,
} from "../../app/lib/recipe-catalog.ts";

const ME = "profile-me";

const recipe = (overrides) => ({
  id: overrides.name.toLowerCase().replace(/\s+/g, "-"),
  description: "",
  category: "comida",
  servingG: 100,
  totalWeightG: null,
  ingredients: [],
  createdBy: null,
  calories: 100,
  proteinG: 10,
  carbsG: 10,
  fatG: 2,
  kcalPerG: 1,
  macrosPerG: { proteinG: 0.1, carbsG: 0.1, fatG: 0.02 },
  ...overrides,
});

const ing = (foodName, grams, kcal) => ({ foodId: foodName.toLowerCase(), foodName, grams, kcal });

const sandwich = recipe({
  name: "Sandwich proteico",
  category: "snack",
  servingG: 275,
  calories: 479,
  proteinG: 57,
  kcalPerG: 479 / 275,
  macrosPerG: { proteinG: 57 / 275, carbsG: 34 / 275, fatG: 9 / 275 },
  ingredients: [ing("Lechuga", 30, 4), ing("Pan integral", 90, 227), ing("Pechuga de pavo", 120, 176), ing("Queso", 35, 72)],
  createdBy: ME,
});
const bowl = recipe({
  name: "Bowl de arroz",
  calories: 445,
  proteinG: 52,
  ingredients: [ing("Arroz blanco", 150, 189), ing("Pechuga de pollo", 150, 227)],
});
const milanesa = recipe({
  name: "Milanesa saludable",
  calories: 605,
  proteinG: 48,
  ingredients: [ing("Milanesa de pollo", 180, 373), ing("Puré de papa", 180, 205)],
});
const avena = recipe({ name: "Avena proteica", category: "desayuno", calories: 500, proteinG: 42 });
const tacos = recipe({
  name: "Tacos de carne",
  servingG: 215,
  calories: 392,
  ingredients: [ing("Carne picada", 180, 414), ing("Tortilla de maíz", 120, 262), ing("Tomate", 80, 14), ing("Palta", 50, 95)],
});
const catalog = [sandwich, bowl, milanesa, avena, tacos];

describe("recipe-catalog", () => {
  it("cuenta por chip con las propias según el perfil", () => {
    const counts = countRecipesByChip(catalog, ME);
    assert.equal(counts.all, 5);
    assert.equal(counts.own, 1);
    assert.equal(counts.comida, 3);
    assert.equal(counts.desayuno, 1);
    assert.equal(counts.snack, 1);
    assert.equal(countRecipesByChip(catalog, null).own, 0);
  });

  it("chips: Tuyas solo con sesión y categorías con recetas", () => {
    const counts = countRecipesByChip([bowl, avena], ME);
    assert.deepEqual(
      recipeChipOptions(counts, true).map((option) => option.value),
      ["all", "own", "desayuno", "comida"],
    );
    assert.deepEqual(
      recipeChipOptions(counts, false).map((option) => option.value),
      ["all", "desayuno", "comida"],
    );
  });

  it("meta con tuyas solo si hay", () => {
    assert.equal(formatRecipesMeta(countRecipesByChip(catalog, ME), true), "5 recetas · 1 tuya");
    assert.equal(formatRecipesMeta(countRecipesByChip(catalog, "otro"), true), "5 recetas");
    assert.equal(formatRecipesMeta(countRecipesByChip([bowl], ME), false), "1 receta");
  });

  it("filtra por chip", () => {
    assert.deepEqual(filterRecipesByChip(catalog, "own", ME), [sandwich]);
    assert.deepEqual(filterRecipesByChip(catalog, "own", null), []);
    assert.deepEqual(filterRecipesByChip(catalog, "desayuno", ME), [avena]);
  });

  it("línea de ingredientes de más a menos gramos", () => {
    assert.equal(ingredientLine(sandwich), "Pechuga de pavo, Pan integral, Queso, Lechuga");
  });

  it("busca por nombre primero y después por ingrediente, sin tildes", () => {
    assert.deepEqual(
      searchRecipes(catalog, { query: "POLLO", chip: "all", sort: "relevance" }, ME).map((r) => r.name),
      ["Bowl de arroz", "Milanesa saludable"],
    );
    assert.deepEqual(
      searchRecipes(catalog, { query: "milanesa", chip: "all", sort: "relevance" }, ME).map((r) => r.name),
      ["Milanesa saludable"],
    );
    assert.deepEqual(
      searchRecipes(catalog, { query: "maiz", chip: "all", sort: "relevance" }, ME).map((r) => r.name),
      ["Tacos de carne"],
    );
    assert.deepEqual(
      searchRecipes(catalog, { query: "arroz", chip: "all", sort: "relevance" }, ME).map((r) => r.name),
      ["Bowl de arroz"],
    );
    assert.deepEqual(searchRecipes(catalog, { query: "lentejas", chip: "all", sort: "relevance" }, ME), []);
  });

  it("la búsqueda respeta el chip y el orden", () => {
    assert.deepEqual(
      searchRecipes(catalog, { query: "pollo", chip: "comida", sort: "protein" }, ME).map((r) => r.name),
      ["Bowl de arroz", "Milanesa saludable"],
    );
    assert.deepEqual(searchRecipes(catalog, { query: "pollo", chip: "snack", sort: "relevance" }, ME), []);
  });

  it("ordena por proteína (desc) y kcal (asc) de forma estable", () => {
    assert.deepEqual(
      sortRecipes(catalog, "protein").map((r) => r.proteinG),
      [57, 52, 48, 42, 10],
    );
    assert.deepEqual(
      sortRecipes(catalog, "kcal").map((r) => r.calories),
      [392, 445, 479, 500, 605],
    );
    assert.deepEqual(sortRecipes(catalog, "relevance"), catalog);
  });

  it("Explorar agrupa en el orden de las categorías", () => {
    const query = { query: "", chip: "all", sort: "relevance" };
    assert.equal(isGroupedRecipes(query), true);
    assert.equal(isGroupedRecipes({ ...query, chip: "own" }), false);
    assert.equal(isGroupedRecipes({ ...query, query: " x" }), false);
    const visible = searchRecipes(catalog, query, ME);
    assert.deepEqual(visible.map((r) => r.category), ["desayuno", "comida", "comida", "comida", "snack"]);
    const groups = groupRecipesByCategory(visible, countRecipesByChip(catalog, ME));
    assert.deepEqual(
      groups.map((group) => [group.label, group.total, group.recipes.length]),
      [
        ["Desayuno", 1, 1],
        ["Comida", 3, 3],
        ["Snack", 1, 1],
      ],
    );
  });

  it("encuentra el tramo a subrayar en el texto original", () => {
    assert.deepEqual(findMatchRange("Tortilla de maíz", "MAIZ"), [12, 16]);
    assert.deepEqual(findMatchRange("Pechuga de pollo", "pollo"), [11, 16]);
    assert.equal(findMatchRange("Pan", "pollo"), null);
    assert.equal(findMatchRange("Pan", "  "), null);
  });

  it("porciones: texto y valores", () => {
    assert.equal(formatPortions(1), "1 porción");
    assert.equal(formatPortions(1.5), "1,5 porciones");
    assert.equal(formatPortions(0.5), "0,5 porciones");
    assert.deepEqual(recipePortion(sandwich, 1), { grams: 275, kcal: 479, proteinG: 57, carbsG: 34, fatG: 9 });
    assert.deepEqual(recipePortion(sandwich, 1.5), { grams: 413, kcal: 719, proteinG: 86, carbsG: 51, fatG: 14 });
  });

  it("ingredientes escalados a la porción y con su aporte", () => {
    const rows = recipeIngredientRows(sandwich, 1);
    assert.deepEqual(
      rows.map((row) => [row.name, row.grams, row.kcal]),
      [
        ["Pechuga de pavo", 120, 176],
        ["Pan integral", 90, 227],
        ["Queso", 35, 72],
        ["Lechuga", 30, 4],
      ],
    );
    assert.ok(Math.abs(rows.reduce((sum, row) => sum + row.share, 0) - 1) < 1e-9);

    // Tacos: la receta entera pesa 430 g y la porción 215 g → la mitad.
    assert.deepEqual(
      recipeIngredientRows(tacos, 1).map((row) => [row.grams, row.kcal]),
      [
        [90, 207],
        [60, 131],
        [40, 7],
        [25, 48],
      ],
    );
    assert.deepEqual(recipeIngredientRows(tacos, 2)[0].grams, 180);

    // Con peso final cocido, la proporción sale de ese peso.
    const cooked = recipe({ name: "Guiso", servingG: 100, totalWeightG: 400, ingredients: [ing("Lentejas", 200, 700)] });
    assert.deepEqual(recipeIngredientRows(cooked, 1)[0], { foodId: "lentejas", name: "Lentejas", grams: 50, kcal: 175, share: 1 });
    assert.deepEqual(recipeIngredientRows(recipe({ name: "Vacía" }), 1), []);
  });

  it("textos del CTA y de la comida", () => {
    assert.equal(registerRecipeLabel(1, "next"), "Registrar 1 porción");
    assert.equal(registerRecipeLabel(1.5, "cena"), "Registrar 1,5 porciones en cena");
    assert.equal(mealChoiceLabel("next"), "La que sigue");
    assert.equal(mealChoiceLabel("merienda"), "Merienda");
  });

  it("registroRecipeHref arma la URL y parseRegistroRecipeParams la lee", () => {
    const href = registroRecipeHref({ recipeId: sandwich.id, portions: 1.5, meal: "cena" });
    assert.equal(href, "/nutricion/registro?receta=sandwich-proteico&medida=unit&cantidad=1.5&tipo=cena");
    assert.equal(
      registroRecipeHref({ recipeId: sandwich.id, portions: 1, meal: "next" }),
      "/nutricion/registro?receta=sandwich-proteico&medida=unit&cantidad=1",
    );

    const params = Object.fromEntries(new URL(href, "http://x").searchParams);
    assert.deepEqual(parseRegistroRecipeParams(params, catalog), {
      kind: "recipe",
      recipeId: sandwich.id,
      measure: "unit",
      quantity: 1.5,
    });
  });

  it("parseRegistroRecipeParams descarta enlaces inválidos", () => {
    const ok = { receta: bowl.id, medida: "g", cantidad: "250" };
    assert.deepEqual(parseRegistroRecipeParams(ok, catalog), { kind: "recipe", recipeId: bowl.id, measure: "g", quantity: 250 });
    assert.deepEqual(parseRegistroRecipeParams({ ...ok, receta: [bowl.id, "x"], cantidad: "2,5" }, catalog)?.quantity, 2.5);
    assert.equal(parseRegistroRecipeParams({ ...ok, receta: "otra" }, catalog), null);
    assert.equal(parseRegistroRecipeParams({ ...ok, medida: "kg" }, catalog), null);
    assert.equal(parseRegistroRecipeParams({ ...ok, cantidad: "0" }, catalog), null);
    assert.equal(parseRegistroRecipeParams({ ...ok, cantidad: "-1" }, catalog), null);
    assert.equal(parseRegistroRecipeParams({ ...ok, cantidad: "10001" }, catalog), null);
    assert.equal(parseRegistroRecipeParams({ ...ok, cantidad: undefined }, catalog), null);
    assert.equal(parseRegistroRecipeParams({}, catalog), null);
  });
});
