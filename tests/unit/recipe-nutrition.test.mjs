import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildRecipeSnapshot,
  isRecipeSnapshot,
  nutritionFromSnapshot,
  recipeBaseGrams,
  recipeGramsFor,
  recipeTotals,
} from "../../app/lib/recipe-nutrition.ts";

// Arroz crudo 100 g = 350 kcal; pollo 100 g = 120 kcal / 22 g proteína.
const rice = { servingG: 100, calories: 350, proteinG: 7, carbsG: 78, fatG: 1 };
const chicken = { servingG: 100, calories: 120, proteinG: 22, carbsG: 0, fatG: 3 };
const recipe = (totalWeightG = null, servingG = 250) => ({
  servingG,
  totalWeightG,
  ingredients: [
    { grams: 200, food: rice },
    { grams: 300, food: chicken },
  ],
});

describe("recipeTotals / recipeBaseGrams", () => {
  it("suma macros de ingredientes", () => {
    const totals = recipeTotals(recipe());
    assert.equal(totals.kcal, 700 + 360);
    assert.equal(totals.proteinG, 14 + 66);
  });

  it("peso base = peso final si existe, si no suma de crudos", () => {
    assert.equal(recipeBaseGrams(recipe()), 500);
    assert.equal(recipeBaseGrams(recipe(800)), 800);
  });

  it("ignora alimentos inaccesibles o con porción 0", () => {
    const totals = recipeTotals({ servingG: 100, totalWeightG: null, ingredients: [{ grams: 50, food: null }, { grams: 50, food: { ...rice, servingG: 0 } }] });
    assert.equal(totals.kcal, 0);
  });
});

describe("snapshot", () => {
  it("con peso final, 1 porción de 250 g = 250/800 de la receta", () => {
    const snapshot = buildRecipeSnapshot(recipe(800));
    const portion = nutritionFromSnapshot(snapshot, recipeGramsFor(snapshot.servingG, "unit", 1));
    assert.ok(Math.abs(portion.kcal - (1060 * 250) / 800) < 1e-9);
  });

  it("gramos directos sin peso final", () => {
    const snapshot = buildRecipeSnapshot(recipe());
    const grams = nutritionFromSnapshot(snapshot, recipeGramsFor(snapshot.servingG, "g", 180));
    assert.ok(Math.abs(grams.proteinG - (80 * 180) / 500) < 1e-9);
  });

  it("null si no hay peso o porción", () => {
    assert.equal(buildRecipeSnapshot({ servingG: 100, totalWeightG: null, ingredients: [] }), null);
    assert.equal(buildRecipeSnapshot(recipe(null, 0)), null);
  });

  it("isRecipeSnapshot valida el shape guardado en jsonb", () => {
    assert.equal(isRecipeSnapshot(buildRecipeSnapshot(recipe())), true);
    assert.equal(isRecipeSnapshot({ servingG: 1 }), false);
    assert.equal(isRecipeSnapshot(null), false);
  });
});
