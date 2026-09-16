import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  chipOptions,
  countFoodsByChip,
  defaultFoodPortion,
  filterFoodsByChip,
  foodPortions,
  formatCatalogMeta,
  formatDecimal,
  formatServingLine,
  frequentFoodTiles,
  getFoodGramsPerUnit,
  groupFoodsByCategory,
  isGroupedCatalog,
  nutritionForGrams,
  parseRegistroFoodParams,
  per100,
  portionGrams,
  registroFoodHref,
  searchCatalog,
  sortFoods,
  splitMacroKcal,
} from "../../app/lib/food-catalog.ts";

const food = (overrides) => ({
  id: overrides.name.toLowerCase().replace(/\s+/g, "-"),
  category: "carb",
  measure: "g",
  servingG: 100,
  gramsPerUnit: null,
  calories: 100,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  ownerUserId: null,
  ...overrides,
});

const pollo = food({ name: "Pechuga de pollo a la plancha", category: "protein", gramsPerUnit: 150, calories: 151, proteinG: 30.5, fatG: 3.2 });
const alfajor = food({ name: "Alfajor de chocolate", measure: "unit", gramsPerUnit: 50, calories: 411, proteinG: 6.3, carbsG: 64.6, fatG: 14.1 });
const maiz = food({ name: "Maíz dulce", calories: 86, proteinG: 3.3, carbsG: 19, fatG: 1.4 });
const whey = food({ name: "Proteína whey en polvo", category: "protein", gramsPerUnit: 30, calories: 359, proteinG: 80, fatG: 4.3 });
const jugo = food({ name: "Jugo de naranja", category: "drink", measure: "unit", gramsPerUnit: 200, calories: 45, proteinG: 0.7, carbsG: 10.2, fatG: 0.2 });
const propio = food({ name: "Galletitas de arroz caseras", servingG: 30, measure: "unit", gramsPerUnit: 9, calories: 114, proteinG: 2.3, carbsG: 24.3, fatG: 0.7, ownerUserId: "u1" });
const agua = food({ name: "Agua", category: "drink", calories: 0 });
// Orden del servidor: propios primero, después catálogo por categoría (alfabética) y nombre.
const catalog = [propio, alfajor, maiz, jugo, agua, pollo, whey];

describe("getFoodGramsPerUnit", () => {
  it("usa gramsPerUnit si existe", () => {
    assert.equal(getFoodGramsPerUnit(pollo), 150);
  });

  it("en alimentos por unidad sin peso definido usa la porción base", () => {
    assert.equal(getFoodGramsPerUnit({ measure: "unit", servingG: 40, gramsPerUnit: null }), 40);
  });

  it("en alimentos por gramos sin peso definido no hay unidad", () => {
    assert.equal(getFoodGramsPerUnit(maiz), null);
  });
});

describe("porciones y nutrición", () => {
  it("portionGrams convierte unidades a gramos", () => {
    assert.equal(portionGrams(alfajor, "unit", 2), 100);
    assert.equal(portionGrams(alfajor, "g", 30), 30);
  });

  it("nutritionForGrams escala desde la porción base y redondea como el registro", () => {
    assert.deepEqual(nutritionForGrams(alfajor, 50), { kcal: 206, proteinG: 3.2, carbsG: 32.3, fatG: 7.1 });
    // 155 kcal cada 100 g × 0,5 = 77,5 → 78 (Math.round, igual que previewNutrition)
    assert.equal(nutritionForGrams(food({ name: "x", calories: 155 }), 50).kcal, 78);
    assert.deepEqual(nutritionForGrams(propio, 9), { kcal: 34, proteinG: 0.7, carbsG: 7.3, fatG: 0.2 });
  });

  it("nutritionForGrams con porción base 0 devuelve ceros", () => {
    assert.deepEqual(nutritionForGrams(food({ name: "roto", servingG: 0 }), 50), { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  });

  it("foodPortions ofrece la base y 1 unidad, con ml en bebidas", () => {
    assert.deepEqual(
      foodPortions(jugo).map((portion) => [portion.measure, portion.quantity, portion.grams, portion.label, portion.action]),
      [
        ["g", 100, 100, "100 ml", "Registrar 100 ml"],
        ["unit", 1, 200, "1 unidad · 200 ml", "Registrar 1 unidad"],
      ],
    );
    assert.deepEqual(foodPortions(maiz).map((portion) => portion.measure), ["g"]);
  });

  it("foodPortions no duplica si la unidad pesa lo mismo que la base", () => {
    const unitOnly = food({ name: "Barrita", measure: "unit", servingG: 40, gramsPerUnit: null });
    assert.deepEqual(foodPortions(unitOnly).map((portion) => portion.measure), ["unit"]);
    const gramsFirst = food({ name: "Queso", servingG: 30, gramsPerUnit: 30 });
    assert.deepEqual(foodPortions(gramsFirst).map((portion) => portion.measure), ["g"]);
  });

  it("defaultFoodPortion respeta la medida del alimento o la preferida", () => {
    assert.equal(defaultFoodPortion(alfajor).measure, "unit");
    assert.equal(defaultFoodPortion(pollo).measure, "g");
    assert.equal(defaultFoodPortion(pollo, "unit").measure, "unit");
    assert.equal(defaultFoodPortion(maiz, "unit").measure, "g");
  });
});

describe("splitMacroKcal", () => {
  it("reparte las kcal por macro y los % suman 100", () => {
    const split = splitMacroKcal(alfajor);
    assert.equal(split.total, 6.3 * 4 + 64.6 * 4 + 14.1 * 9);
    assert.deepEqual(split.pct, { protein: 6, carbs: 63, fat: 31 });
    assert.equal(split.pct.protein + split.pct.carbs + split.pct.fat, 100);
  });

  it("con tercios reparte el resto al primero", () => {
    const split = splitMacroKcal({ proteinG: 9, carbsG: 9, fatG: 4 });
    assert.deepEqual(split.pct, { protein: 34, carbs: 33, fat: 33 });
  });

  it("sin macros devuelve todo en 0", () => {
    assert.deepEqual(splitMacroKcal({ proteinG: 0, carbsG: 0, fatG: 0 }).pct, { protein: 0, carbs: 0, fat: 0 });
  });
});

describe("textos", () => {
  it("formatDecimal usa coma y redondea", () => {
    assert.equal(formatDecimal(30.54), "30,5");
    assert.equal(formatDecimal(150), "150");
    assert.equal(formatDecimal(1.256, 2), "1,26");
  });

  it("formatServingLine muestra el peso por unidad solo si está definido", () => {
    assert.equal(formatServingLine(alfajor), "100 g · 1 u ≈ 50 g");
    assert.equal(formatServingLine(jugo), "100 ml · 1 u ≈ 200 ml");
    assert.equal(formatServingLine(maiz), "100 g");
  });

  it("formatCatalogMeta pluraliza y muestra los propios solo con sesión", () => {
    const counts = countFoodsByChip(catalog);
    assert.equal(formatCatalogMeta(counts, true), "7 alimentos · 1 tuyo");
    assert.equal(formatCatalogMeta(counts, false), "7 alimentos");
    assert.equal(formatCatalogMeta(countFoodsByChip([pollo]), true), "1 alimento");
    assert.equal(formatCatalogMeta(countFoodsByChip([propio, { ...propio, id: "otro" }]), true), "2 alimentos · 2 tuyos");
  });
});

describe("chips y filtros", () => {
  const counts = countFoodsByChip(catalog);

  it("cuenta por categoría y propios", () => {
    assert.equal(counts.all, 7);
    assert.equal(counts.own, 1);
    assert.equal(counts.protein, 2);
    assert.equal(counts.carb, 3);
    assert.equal(counts.drink, 2);
    assert.equal(counts.fat, 0);
  });

  it("chipOptions muestra Tuyos solo con sesión y oculta categorías vacías", () => {
    assert.deepEqual(
      chipOptions(counts, true).map((option) => [option.value, option.count]),
      [["all", null], ["own", 1], ["protein", 2], ["carb", 3], ["drink", 2]],
    );
    assert.equal(chipOptions(counts, false).some((option) => option.value === "own"), false);
    assert.deepEqual(chipOptions(countFoodsByChip([pollo]), true)[1], { value: "own", label: "Tuyos", count: 0 });
  });

  it("filterFoodsByChip filtra por propios o categoría", () => {
    assert.deepEqual(filterFoodsByChip(catalog, "own"), [propio]);
    assert.deepEqual(filterFoodsByChip(catalog, "protein"), [pollo, whey]);
    assert.equal(filterFoodsByChip(catalog, "all").length, 7);
  });
});

describe("orden y búsqueda", () => {
  it("per100 normaliza porciones distintas", () => {
    assert.equal(per100(propio, propio.proteinG), (2.3 * 100) / 30);
    assert.equal(per100({ servingG: 0 }, 10), 0);
  });

  it("sortFoods por proteína cada 100 g, estable ante empates", () => {
    const empate = food({ name: "Empate", category: "protein", proteinG: 30.5, calories: 1 });
    assert.deepEqual(sortFoods([pollo, empate, whey, maiz], "protein").map((item) => item.name), [
      "Proteína whey en polvo",
      "Pechuga de pollo a la plancha",
      "Empate",
      "Maíz dulce",
    ]);
  });

  it("sortFoods por menos calorías normaliza y manda al final las porciones inválidas", () => {
    const roto = food({ name: "Roto", servingG: 0, calories: 1 });
    assert.deepEqual(sortFoods([roto, propio, agua, maiz], "kcal").map((item) => item.name), [
      "Agua",
      "Maíz dulce",
      "Galletitas de arroz caseras",
      "Roto",
    ]);
  });

  it("sortFoods relevance no cambia el orden ni muta la entrada", () => {
    const input = [maiz, pollo];
    const output = sortFoods(input, "relevance");
    assert.deepEqual(output, input);
    assert.notEqual(output, input);
  });

  it("isGroupedCatalog solo sin búsqueda, en Todos y por relevancia", () => {
    assert.equal(isGroupedCatalog({ query: "  ", chip: "all", sort: "relevance" }), true);
    assert.equal(isGroupedCatalog({ query: "po", chip: "all", sort: "relevance" }), false);
    assert.equal(isGroupedCatalog({ query: "", chip: "own", sort: "relevance" }), false);
    assert.equal(isGroupedCatalog({ query: "", chip: "all", sort: "kcal" }), false);
  });

  it("searchCatalog sin búsqueda ordena por categoría de los chips y respeta el orden del servidor", () => {
    assert.deepEqual(searchCatalog(catalog, { query: "", chip: "all", sort: "relevance" }).map((item) => item.name), [
      "Pechuga de pollo a la plancha",
      "Proteína whey en polvo",
      "Galletitas de arroz caseras",
      "Alfajor de chocolate",
      "Maíz dulce",
      "Jugo de naranja",
      "Agua",
    ]);
  });

  it("searchCatalog ignora tildes", () => {
    assert.deepEqual(searchCatalog(catalog, { query: "maiz", chip: "all", sort: "relevance" }), [maiz]);
  });

  it("searchCatalog prioriza los propios a igual relevancia", () => {
    const catalogo = food({ name: "Galletitas de arroz" });
    const result = searchCatalog([catalogo, propio], { query: "galletitas", chip: "all", sort: "relevance" });
    assert.deepEqual(result.map((item) => item.name), ["Galletitas de arroz caseras", "Galletitas de arroz"]);
  });

  it("searchCatalog aplica chip y el orden elegido sobre la búsqueda", () => {
    const polloFrito = food({ name: "Pollo frito", category: "protein", proteinG: 20 });
    const foods = [polloFrito, pollo, maiz];
    assert.deepEqual(searchCatalog(foods, { query: "pollo", chip: "all", sort: "relevance" }).map((item) => item.name), [
      "Pollo frito",
      "Pechuga de pollo a la plancha",
    ]);
    assert.deepEqual(searchCatalog(foods, { query: "pollo", chip: "all", sort: "protein" }).map((item) => item.name), [
      "Pechuga de pollo a la plancha",
      "Pollo frito",
    ]);
    assert.deepEqual(searchCatalog(foods, { query: "pollo", chip: "carb", sort: "relevance" }), []);
  });

  it("groupFoodsByCategory agrupa lo visible con el total de la categoría", () => {
    const counts = countFoodsByChip(catalog);
    const visible = searchCatalog(catalog, { query: "", chip: "all", sort: "relevance" }).slice(0, 3);
    assert.deepEqual(
      groupFoodsByCategory(visible, counts).map((group) => [group.category, group.label, group.total, group.foods.length]),
      [
        ["protein", "Proteína", 2, 2],
        ["carb", "Carbohidrato", 3, 1],
      ],
    );
  });
});

describe("frequentFoodTiles", () => {
  const items = [
    { kind: "recipe", id: "r1", uses: 9, lastMeasure: "unit", lastQuantity: 1 },
    { kind: "food", id: pollo.id, uses: 12, lastMeasure: "g", lastQuantity: 150 },
    { kind: "food", id: "borrado", uses: 5, lastMeasure: "g", lastQuantity: 10 },
    { kind: "food", id: alfajor.id, uses: 1, lastMeasure: "unit", lastQuantity: 2 },
    { kind: "food", id: maiz.id, uses: 3, lastMeasure: "unit", lastQuantity: 2 },
    { kind: "food", id: jugo.id, uses: 2, lastMeasure: "g", lastQuantity: 250.5 },
  ];

  it("saltea recetas y alimentos que ya no existen, con kcal de la última porción", () => {
    const tiles = frequentFoodTiles(items, catalog);
    assert.deepEqual(
      tiles.map((tile) => [tile.food.name, tile.measure, tile.quantity, tile.kcal, tile.label]),
      [
        ["Pechuga de pollo a la plancha", "g", 150, 227, "150 g · 12 veces"],
        ["Alfajor de chocolate", "unit", 2, 411, "2 u · 1 vez"],
        ["Maíz dulce", "g", 100, 86, "100 g · 3 veces"],
        ["Jugo de naranja", "g", 250.5, 113, "250,5 ml · 2 veces"],
      ],
    );
  });

  it("respeta el límite", () => {
    assert.equal(frequentFoodTiles(items, catalog, 2).length, 2);
  });
});

describe("link Registrar", () => {
  it("registroFoodHref arma la URL y parseRegistroFoodParams la lee", () => {
    const href = registroFoodHref({ foodId: alfajor.id, measure: "unit", quantity: 1 });
    assert.equal(href, "/nutricion/registro?alimento=alfajor-de-chocolate&medida=unit&cantidad=1");
    const params = Object.fromEntries(new URL(href, "https://x.test").searchParams);
    assert.deepEqual(parseRegistroFoodParams(params, catalog), {
      kind: "food",
      foodId: alfajor.id,
      measure: "unit",
      quantity: 1,
    });
  });

  it("acepta coma decimal y toma el primer valor de un array", () => {
    assert.deepEqual(
      parseRegistroFoodParams({ alimento: [pollo.id, "otro"], medida: "g", cantidad: "150,5" }, catalog),
      { kind: "food", foodId: pollo.id, measure: "g", quantity: 150.5 },
    );
  });

  it("rechaza parámetros inválidos", () => {
    const valid = { alimento: pollo.id, medida: "g", cantidad: "100" };
    const invalid = [
      {},
      { ...valid, alimento: "no-existe" },
      { ...valid, alimento: "" },
      { ...valid, medida: "kg" },
      { ...valid, alimento: maiz.id, medida: "unit" },
      { ...valid, cantidad: "0" },
      { ...valid, cantidad: "-1" },
      { ...valid, cantidad: "abc" },
      { ...valid, cantidad: "10001" },
      { ...valid, cantidad: "" },
      { ...valid, cantidad: "0x10" },
      { ...valid, cantidad: "1e3" },
    ];

    for (const params of invalid) {
      assert.equal(parseRegistroFoodParams(params, catalog), null, JSON.stringify(params));
    }

    assert.notEqual(parseRegistroFoodParams({ ...valid, cantidad: "10000" }, catalog), null);
  });
});
