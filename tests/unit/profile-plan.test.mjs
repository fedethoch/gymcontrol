import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateNutritionPlan } from "../../app/lib/nutrition-calc.ts";
import {
  activityLevelIndex,
  bodySummary,
  checkManualTarget,
  formatAdjustment,
  macroKcal,
  macroSplit,
  parseManualTarget,
} from "../../app/lib/profile-plan.ts";

// Datos del mock: hombre, 28 años, 178 cm, 78 kg, 22% de grasa, actividad moderada.
const body = { gender: "male", age: 28, heightCm: 178, weightKg: 78, bodyFatPct: 22, activityLevel: "moderate" };

describe("plan de ejemplo (mock v2)", () => {
  it("mantenimiento 2610 y definición −20% = 2088 con P172 C193 G70", () => {
    const plan = calculateNutritionPlan({ ...body, goal: "cut" });
    assert.equal(plan.maintenanceKcal, 2610);
    assert.equal(plan.targetKcal, 2088);
    assert.deepEqual(plan.macros, { proteinG: 172, carbsG: 193, fatG: 70 });
    assert.deepEqual(macroSplit(plan.macros), { protein: 33, carbs: 37, fat: 30 });
  });

  it("las kcal de cada objetivo para el sheet Objetivo", () => {
    const kcal = ["cut", "maintenance", "bulk"].map((goal) => calculateNutritionPlan({ ...body, goal }).targetKcal);
    assert.deepEqual(kcal, [2088, 2610, 2871]);
  });
});

describe("formatAdjustment", () => {
  it("usa el signo menos tipográfico, 0% y +", () => {
    assert.equal(formatAdjustment(-0.2), "−20%");
    assert.equal(formatAdjustment(0), "0%");
    assert.equal(formatAdjustment(0.1), "+10%");
  });
});

describe("bodySummary", () => {
  it("resume el cuerpo con coma decimal", () => {
    assert.equal(bodySummary(body), "28 a · 178 cm · 78 kg · 22%");
    assert.equal(bodySummary({ ...body, weightKg: 78.5, bodyFatPct: null }), "28 a · 178 cm · 78,5 kg · grasa sin dato");
  });

  it("redondea a un decimal", () => {
    assert.equal(bodySummary({ ...body, weightKg: 78.25 }), "28 a · 178 cm · 78,3 kg · 22%");
  });
});

describe("macroKcal / macroSplit", () => {
  it("reparte 33/37/30 y suma 100", () => {
    const macros = { proteinG: 172, carbsG: 192, fatG: 70 };
    assert.equal(macroKcal(macros), 2086);
    assert.deepEqual(macroSplit(macros), { protein: 33, carbs: 37, fat: 30 });
  });

  it("siempre suma 100 con restos", () => {
    const split = macroSplit({ proteinG: 1, carbsG: 1, fatG: 1 });
    assert.equal(split.protein + split.carbs + split.fat, 100);
  });

  it("sin kcal devuelve ceros", () => {
    assert.deepEqual(macroSplit({ proteinG: 0, carbsG: 0, fatG: 0 }), { protein: 0, carbs: 0, fat: 0 });
  });
});

describe("parseManualTarget", () => {
  const valid = { kcal: "2200", proteinG: "180", carbsG: "200", fatG: "75" };

  it("acepta valores coherentes y coma decimal", () => {
    assert.deepEqual(parseManualTarget(valid), { targetKcal: 2200, macros: { proteinG: 180, carbsG: 200, fatG: 75 } });
    assert.equal(parseManualTarget({ ...valid, proteinG: "180,4" })?.macros.proteinG, 180);
  });

  it("macros vacíos cuentan como 0, como antes", () => {
    assert.equal(parseManualTarget({ ...valid, fatG: "" })?.macros.fatG, 0);
  });

  it("rechaza kcal vacías o fuera de 800–10000 y macros fuera de 0–1500", () => {
    assert.equal(parseManualTarget({ ...valid, kcal: " " }), null);
    assert.equal(parseManualTarget({ ...valid, kcal: "799" }), null);
    assert.equal(parseManualTarget({ ...valid, kcal: "10001" }), null);
    assert.equal(parseManualTarget({ ...valid, carbsG: "-1" }), null);
    assert.equal(parseManualTarget({ ...valid, carbsG: "1501" }), null);
    assert.equal(parseManualTarget({ ...valid, fatG: "abc" }), null);
  });
});

describe("checkManualTarget", () => {
  it("2195 kcal de macros coincide con 2200; 2645 no", () => {
    assert.deepEqual(checkManualTarget({ targetKcal: 2200, macros: { proteinG: 180, carbsG: 200, fatG: 75 } }), {
      macroKcal: 2195,
      matches: true,
    });
    assert.equal(checkManualTarget({ targetKcal: 2200, macros: { proteinG: 180, carbsG: 200, fatG: 125 } }).matches, false);
  });

  it("el borde del 10% todavía coincide", () => {
    assert.equal(checkManualTarget({ targetKcal: 2000, macros: { proteinG: 0, carbsG: 550, fatG: 0 } }).matches, true);
  });
});

describe("activityLevelIndex", () => {
  it("ordena de sedentaria a muy alta", () => {
    assert.equal(activityLevelIndex("sedentary"), 0);
    assert.equal(activityLevelIndex("moderate"), 2);
    assert.equal(activityLevelIndex("very_high"), 4);
  });
});
