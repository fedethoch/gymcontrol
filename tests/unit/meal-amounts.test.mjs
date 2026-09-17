import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  convertQuantity,
  formatAmount,
  formatItemAmount,
  formatQuantity,
  getFoodGramsPerUnit,
  parseQuantity,
  previewItemNutrition,
  previewNutrition,
  quantityStep,
  rankFrequentItems,
  rankFrequentItemsBySlot,
  resolveDefaultAmount,
  toMealItemInput,
  validateAmount,
} from "../../app/lib/meal-amounts.ts";

const food = (overrides = {}) => ({
  id: "f1",
  name: "Pechuga de pollo",
  category: "protein",
  measure: "g",
  servingG: 100,
  gramsPerUnit: null,
  calories: 165,
  proteinG: 31,
  carbsG: 0,
  fatG: 3.6,
  ownerUserId: null,
  ...overrides,
});
const foodOption = (overrides) => {
  const value = food(overrides);
  return { kind: "food", id: value.id, name: value.name, food: value };
};
const recipeOption = {
  kind: "recipe",
  id: "r1",
  name: "Guiso",
  recipe: { id: "r1", name: "Guiso", servingG: 350, kcalPerG: 1.2, macrosPerG: { proteinG: 0.08, carbsG: 0.15, fatG: 0.03 } },
};

describe("frecuentes", () => {
  const use = (id, mealType, createdAt, quantity = 100) => ({
    kind: "food",
    id,
    mealType,
    measure: "g",
    quantity,
    createdAt,
  });

  it("ordena por usos y guarda la última cantidad", () => {
    const ranked = rankFrequentItems(
      [use("pan", "desayuno", "2026-09-01", 50), use("pan", "desayuno", "2026-09-03", 80), use("arroz", "cena", "2026-09-02")],
      8,
    );
    assert.deepEqual(ranked, [
      { kind: "food", id: "pan", uses: 2, lastMeasure: "g", lastQuantity: 80 },
      { kind: "food", id: "arroz", uses: 1, lastMeasure: "g", lastQuantity: 100 },
    ]);
  });

  it("separa desayuno, almuerzo y cena, merienda y snack", () => {
    const bySlot = rankFrequentItemsBySlot(
      [
        use("pan", "desayuno", "2026-09-01"),
        use("pollo", "almuerzo", "2026-09-01"),
        use("pollo", "cena", "2026-09-02"),
        use("yogur", "merienda", "2026-09-01"),
        use("barrita", "snack", "2026-09-01"),
      ],
      8,
    );
    const ids = Object.fromEntries(Object.entries(bySlot).map(([slot, items]) => [slot, items.map((item) => item.id)]));
    assert.deepEqual(ids, { desayuno: ["pan"], comidas: ["pollo"], merienda: ["yogur"], snack: ["barrita"] });
    assert.equal(bySlot.comidas[0].uses, 2);
  });

  it("los usos de un grupo no suman en otro", () => {
    const bySlot = rankFrequentItemsBySlot(
      [use("pan", "desayuno", "2026-09-01", 50), use("pan", "merienda", "2026-09-02", 30)],
      8,
    );
    assert.equal(bySlot.desayuno[0].lastQuantity, 50);
    assert.equal(bySlot.merienda[0].lastQuantity, 30);
    assert.deepEqual(bySlot.comidas, []);
  });
});

describe("getFoodGramsPerUnit", () => {
  it("usa los gramos por unidad si existen", () => {
    assert.equal(getFoodGramsPerUnit(food({ gramsPerUnit: 50 })), 50);
  });

  it("si se mide por unidad, la unidad es la porción", () => {
    assert.equal(getFoodGramsPerUnit(food({ measure: "unit", servingG: 120 })), 120);
  });

  it("por gramos y sin peso de unidad no hay unidades", () => {
    assert.equal(getFoodGramsPerUnit(food()), null);
  });
});

describe("parseQuantity y formatQuantity", () => {
  it("acepta coma y redondea a 2 decimales", () => {
    assert.equal(parseQuantity("1,5"), 1.5);
    assert.ok(Number.isNaN(parseQuantity("abc")));
    assert.equal(formatQuantity(1 / 3), "0.33");
    assert.equal(formatQuantity(150), "150");
  });
});

describe("previewNutrition", () => {
  it("escala un alimento por gramos", () => {
    assert.deepEqual(previewNutrition(foodOption(), "g", 150), { kcal: 248, proteinG: 47, carbsG: 0, fatG: 5 });
  });

  it("escala un alimento por unidades", () => {
    assert.equal(previewNutrition(foodOption({ gramsPerUnit: 50 }), "unit", 2).kcal, 165);
  });

  it("escala una receta por porciones y por gramos", () => {
    assert.equal(previewNutrition(recipeOption, "unit", 1).kcal, 420);
    assert.equal(previewNutrition(recipeOption, "g", 100).kcal, 120);
  });
});

describe("previewItemNutrition", () => {
  it("escala lo que calculó el registro", () => {
    const item = { grams: 180, kcal: 297, proteinG: 56, carbsG: 0, fatG: 6 };
    assert.deepEqual(previewItemNutrition(item, 90), { kcal: 149, proteinG: 28, carbsG: 0, fatG: 3 });
  });

  it("sin gramos no inventa nutrientes", () => {
    assert.equal(previewItemNutrition({ grams: 0, kcal: 10, proteinG: 1, carbsG: 1, fatG: 1 }, 100).kcal, 0);
  });
});

describe("resolveDefaultAmount", () => {
  it("receta sin historial: 1 porción", () => {
    assert.deepEqual(resolveDefaultAmount(recipeOption, null), { measure: "unit", quantity: 1 });
  });

  it("receta con historial en gramos: lo repite", () => {
    assert.deepEqual(resolveDefaultAmount(recipeOption, { lastMeasure: "g", lastQuantity: 250 }), {
      measure: "g",
      quantity: 250,
    });
  });

  it("alimento por unidad: 1 unidad", () => {
    assert.deepEqual(resolveDefaultAmount(foodOption({ measure: "unit", servingG: 60 })), { measure: "unit", quantity: 1 });
  });

  it("alimento por gramos: la porción base", () => {
    assert.deepEqual(resolveDefaultAmount(foodOption()), { measure: "g", quantity: 100 });
  });

  it("historial en unidades pero el alimento ya no tiene unidad: porción base en gramos", () => {
    assert.deepEqual(resolveDefaultAmount(foodOption(), { lastMeasure: "unit", lastQuantity: 3 }), {
      measure: "g",
      quantity: 100,
    });
  });

  it("historial en unidades con unidad disponible: lo repite", () => {
    assert.deepEqual(resolveDefaultAmount(foodOption({ gramsPerUnit: 50 }), { lastMeasure: "unit", lastQuantity: 2 }), {
      measure: "unit",
      quantity: 2,
    });
  });
});

describe("convertQuantity", () => {
  it("convierte gramos a unidades y al revés", () => {
    assert.equal(convertQuantity(150, "unit", 50), 3);
    assert.equal(convertQuantity(1.5, "g", 190), 285);
    assert.equal(convertQuantity(100, "unit", 30), 3.33);
  });

  it("sin peso de unidad o con cantidad inválida no cambia", () => {
    assert.equal(convertQuantity(150, "unit", null), 150);
    assert.ok(Number.isNaN(convertQuantity(Number.NaN, "unit", 50)));
  });
});

describe("quantityStep", () => {
  it("media unidad, 10 g o 50 ml", () => {
    assert.equal(quantityStep("unit", "g"), 0.5);
    assert.equal(quantityStep("g", "g"), 10);
    assert.equal(quantityStep("g", "ml"), 50);
  });
});

describe("validateAmount", () => {
  it("rechaza lo que rechazaría el servidor", () => {
    assert.equal(validateAmount({ measure: "g", quantity: 150 }, null), null);
    assert.equal(validateAmount({ measure: "g", quantity: 0 }, null), "Ingresá una cantidad mayor a 0.");
    assert.equal(validateAmount({ measure: "g", quantity: Number.NaN }, null), "Ingresá una cantidad válida.");
    assert.equal(validateAmount({ measure: "g", quantity: 10_001 }, null), "La cantidad es demasiado grande.");
    assert.equal(
      validateAmount({ measure: "unit", quantity: 300 }, 190),
      "Revisá la cantidad: es demasiado chica o demasiado grande.",
    );
  });
});

describe("toMealItemInput", () => {
  it("arma el ítem según el tipo", () => {
    assert.deepEqual(toMealItemInput({ kind: "food", id: "f1" }, { measure: "g", quantity: 100 }), {
      kind: "food",
      foodId: "f1",
      measure: "g",
      quantity: 100,
    });
    assert.deepEqual(toMealItemInput({ kind: "recipe", id: "r1" }, { measure: "unit", quantity: 1 }), {
      kind: "recipe",
      recipeId: "r1",
      measure: "unit",
      quantity: 1,
    });
  });
});

describe("formatItemAmount y formatAmount", () => {
  const item = (overrides) => ({ kind: "food", category: "protein", measure: "g", quantity: 150, grams: 150, ...overrides });

  it("formatea igual que el registro de escritorio", () => {
    assert.equal(formatItemAmount(item({ kind: "recipe", category: null, measure: "unit", quantity: 1 })), "1 porción");
    assert.equal(formatItemAmount(item({ kind: "recipe", category: null, measure: "unit", quantity: 2 })), "2 porciones");
    assert.equal(formatItemAmount(item({ measure: "unit", quantity: 2, grams: 100 })), "2 u");
    assert.equal(formatItemAmount(item({ category: "drink", quantity: 250, grams: 250 })), "250 ml");
    assert.equal(formatItemAmount(item()), "150 g");
    assert.equal(formatItemAmount(item({ kind: "recipe", category: null, measure: "g", grams: 300 })), "300 g");
  });

  it("formatea una cantidad a agregar", () => {
    assert.equal(formatAmount({ measure: "unit", quantity: 1.5 }, { kind: "food", category: "carb" }), "1.5 u");
    assert.equal(formatAmount({ measure: "g", quantity: 250 }, { kind: "food", category: "drink" }), "250 ml");
    assert.equal(formatAmount({ measure: "unit", quantity: 1 }, { kind: "recipe", category: null }), "1 porción");
  });

  it("el mobile muestra coma decimal", () => {
    assert.equal(formatAmount({ measure: "unit", quantity: 1.5 }, { kind: "recipe", category: null }, ","), "1,5 porciones");
    assert.equal(formatItemAmount(item({ measure: "unit", quantity: 0.5, grams: 25 }), ","), "0,5 u");
    assert.equal(formatQuantity(2.25, ","), "2,25");
  });
});
