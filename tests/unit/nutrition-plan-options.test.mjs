import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateNutritionPlan } from "../../app/lib/nutrition-calc.ts";
import {
  adjustCustomMacros,
  customParamsFrom,
  effectiveTargetWeight,
  goalVariantOptions,
  macroBounds,
  presetMacroGrams,
  referenceWeightKg,
  resolveAdjustment,
  resolveVariant,
  suggestedPreset,
  suggestsKeto,
} from "../../app/lib/nutrition-plan-options.ts";
import { macroKcal } from "../../app/lib/profile-plan.ts";

const body = {
  gender: "male",
  age: 28,
  heightCm: 178,
  weightKg: 78,
  bodyFatPct: 22,
  activityLevel: "moderate",
  goal: "cut",
};
const kcalOf = (grams) => grams.protein * 4 + grams.carbs * 4 + grams.fat * 9;
const near = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

describe("variantes de objetivo", () => {
  it("cada grupo tiene una sola recomendada", () => {
    for (const goal of ["cut", "maintenance", "bulk"]) {
      assert.equal(goalVariantOptions(goal).filter((option) => option.recommended).length, 1);
    }
  });

  it("déficit suave/moderado/agresivo = −10/−20/−25%", () => {
    const kcal = ["gentle", "moderate", "aggressive"].map(
      (goalVariant) => calculateNutritionPlan({ ...body, goalVariant }).targetKcal,
    );
    assert.deepEqual(kcal, [2349, 2088, 1958]);
  });

  it("ganancia limpia/estándar/agresiva = +10/+15/+20%", () => {
    const adjustments = ["lean", "standard", "aggressive"].map((goalVariant) =>
      resolveAdjustment({ goal: "bulk", goalVariant, kcalAdjustment: null }),
    );
    assert.deepEqual(adjustments, [0.1, 0.15, 0.2]);
  });

  it("una variante de otro grupo cae en la recomendada", () => {
    assert.equal(resolveVariant("maintenance", "aggressive"), "recomposition");
    assert.equal(resolveVariant("bulk", "aggressive"), "aggressive");
    assert.equal(resolveVariant("cut", undefined), "moderate");
  });

  it("el ajuste fino se acota al rango del objetivo y se redondea a 1%", () => {
    assert.equal(resolveAdjustment({ goal: "cut", kcalAdjustment: -0.5 }), -0.3);
    assert.equal(resolveAdjustment({ goal: "cut", kcalAdjustment: 0.1 }), -0.05);
    assert.equal(resolveAdjustment({ goal: "maintenance", kcalAdjustment: 0.034 }), 0.03);
    assert.equal(resolveAdjustment({ goal: "bulk", kcalAdjustment: 0.4 }), 0.25);
  });

  it("el déficit nunca baja del metabolismo basal", () => {
    const sedentary = { ...body, activityLevel: "sedentary", kcalAdjustment: -0.3 };
    const plan = calculateNutritionPlan(sedentary);
    assert.equal(plan.clampedToBmr, true);
    assert.equal(plan.targetKcal, plan.bmr);
    assert.equal(calculateNutritionPlan(body).clampedToBmr, false);
  });

  it("el mantenimiento real reemplaza al calculado", () => {
    const plan = calculateNutritionPlan({ ...body, maintenanceOverrideKcal: 3000 });
    assert.equal(plan.maintenanceKcal, 3000);
    assert.equal(plan.targetKcal, 2400);
  });
});

describe("tipos de dieta", () => {
  const presets = ["balanced", "high_protein", "high_carb", "high_fat", "keto", "custom"];

  it("todos suman las kcal objetivo", () => {
    for (const macroPreset of presets) {
      for (const kcal of [1400, 2088, 3500]) {
        near(kcalOf(presetMacroGrams(kcal, { ...body, macroPreset })), kcal, 1e-6);
      }
    }
  });

  it("todos respetan los límites", () => {
    for (const macroPreset of presets) {
      for (const kcal of [1400, 2088, 3500]) {
        const grams = presetMacroGrams(kcal, { ...body, macroPreset });
        const bounds = macroBounds(kcal, 78, macroPreset);
        for (const key of ["protein", "carbs", "fat"]) {
          assert.ok(grams[key] >= bounds[key][0] - 1e-6, `${macroPreset} ${kcal} ${key} bajo`);
          assert.ok(grams[key] <= bounds[key][1] + 1e-6, `${macroPreset} ${kcal} ${key} alto`);
        }
      }
    }
  });

  it("Equilibrada mantiene el cálculo de siempre", () => {
    assert.deepEqual(calculateNutritionPlan(body).macros, { proteinG: 172, carbsG: 193, fatG: 70 });
  });

  it("cada tipo reparte distinto", () => {
    const plan = (macroPreset) => calculateNutritionPlan({ ...body, macroPreset }).macros;
    assert.equal(plan("high_protein").proteinG, 203);
    assert.ok(plan("high_carb").carbsG > plan("balanced").carbsG);
    assert.equal(plan("high_fat").carbsG, 104);
    assert.ok(plan("high_fat").fatG > plan("balanced").fatG);
    assert.equal(plan("keto").carbsG, 30);
  });

  it("keto puede superar el 60% de grasa", () => {
    const grams = presetMacroGrams(2400, { ...body, macroPreset: "keto" });
    assert.ok((grams.fat * 9) / 2400 > 0.6);
  });

  it("Personalizada usa proteína por kg y % de grasa", () => {
    const macros = calculateNutritionPlan({ ...body, macroPreset: "custom", customProteinGPerKg: 2, customFatPct: 35 }).macros;
    assert.equal(macros.proteinG, 156);
    assert.equal(macros.fatG, 81);
    assert.ok(Math.abs(macroKcal(macros) - 2088) <= 4);
  });

  it("sugiere alta en proteína en déficit agresivo y recomposición", () => {
    assert.equal(suggestedPreset("cut", "aggressive"), "high_protein");
    assert.equal(suggestedPreset("maintenance", "recomposition"), "high_protein");
    assert.equal(suggestedPreset("cut", "moderate"), "balanced");
    assert.equal(suggestedPreset("bulk", "lean"), "balanced");
  });
});

describe("peso de referencia", () => {
  it("usa el peso total salvo con mucha grasa", () => {
    assert.equal(referenceWeightKg(body), 78);
    assert.equal(referenceWeightKg({ ...body, bodyFatPct: null }), 78);
    near(referenceWeightKg({ ...body, weightKg: 110, bodyFatPct: 35 }), (110 * 0.65) / 0.8);
    assert.equal(referenceWeightKg({ ...body, gender: "female", bodyFatPct: 30 }), 78);
  });
});

describe("sliders de la Personalizada", () => {
  const kcal = 2400;
  const bounds = macroBounds(kcal, 80);
  const start = { protein: 160, fat: 80, carbs: (2400 - 640 - 720) / 4 };

  it("mover la proteína lo absorben los carbos", () => {
    const next = adjustCustomMacros(kcal, start, "protein", 200, bounds);
    assert.equal(next.protein, 200);
    assert.equal(next.fat, 80);
    near(next.carbs, start.carbs - 40);
    near(kcalOf(next), kcal);
  });

  it("mover los carbos lo absorbe la grasa y la proteína no cambia", () => {
    const next = adjustCustomMacros(kcal, start, "carbs", 300, bounds);
    assert.equal(next.protein, 160);
    assert.equal(next.carbs, 300);
    near(kcalOf(next), kcal);
  });

  it("en el borde, la suma sigue dando y nada sale de rango", () => {
    for (const changed of ["protein", "carbs", "fat"]) {
      for (const value of [-1000, 0, 10_000]) {
        const next = adjustCustomMacros(kcal, start, changed, value, bounds);
        near(kcalOf(next), kcal, 1e-6);
        for (const key of ["protein", "carbs", "fat"]) {
          assert.ok(next[key] >= bounds[key][0] - 1e-6 && next[key] <= bounds[key][1] + 1e-6, `${changed}=${value} ${key}`);
        }
      }
    }
  });

  it("si los carbos tocan el mínimo, cede la proteína y se sugiere keto", () => {
    const highProtein = { protein: 240, fat: 80, carbs: (2400 - 960 - 720) / 4 };
    const next = adjustCustomMacros(kcal, highProtein, "fat", 10_000, bounds);
    near(next.fat, bounds.fat[1]);
    near(next.carbs, bounds.carbs[0]);
    near(next.protein, 180);
    assert.equal(suggestsKeto(next, bounds), true);
    assert.equal(suggestsKeto(start, bounds), false);
  });

  it("sin margen, el slider se frena", () => {
    const low = macroBounds(1200, 95);
    const next = adjustCustomMacros(1200, { protein: 120, fat: 50, carbs: (1200 - 480 - 450) / 4 }, "fat", 10_000, low);
    assert.ok(next.fat < low.fat[1] - 5, `grasa ${next.fat}`);
    near(next.carbs, low.carbs[0]);
    near(kcalOf(next), 1200);
  });

  it("con pocas kcal siempre hay una combinación válida", () => {
    const low = macroBounds(1200, 95);
    const next = adjustCustomMacros(1200, { protein: 120, fat: 40, carbs: 90 }, "protein", 0, low);
    near(kcalOf(next), 1200, 1e-6);
  });

  it("guarda g/kg y % de grasa que reproducen los macros", () => {
    const params = customParamsFrom(kcal, 80, { protein: 176, fat: 80, carbs: 260 });
    assert.deepEqual(params, { customProteinGPerKg: 2.2, customFatPct: 30 });
    const again = presetMacroGrams(kcal, { ...body, weightKg: 80, bodyFatPct: null, macroPreset: "custom", ...params });
    near(again.protein, 176, 0.01);
    near(again.fat, 80, 0.01);
  });
});

describe("peso objetivo", () => {
  it("solo vale si va hacia donde apunta el objetivo", () => {
    assert.equal(effectiveTargetWeight({ goal: "cut", weightKg: 78, targetWeightKg: 72 }), 72);
    assert.equal(effectiveTargetWeight({ goal: "cut", weightKg: 78, targetWeightKg: 80 }), null);
    assert.equal(effectiveTargetWeight({ goal: "bulk", weightKg: 78, targetWeightKg: 82 }), 82);
    assert.equal(effectiveTargetWeight({ goal: "maintenance", weightKg: 78, targetWeightKg: 75 }), null);
    assert.equal(effectiveTargetWeight({ goal: "cut", weightKg: 78, targetWeightKg: null }), null);
  });
});
