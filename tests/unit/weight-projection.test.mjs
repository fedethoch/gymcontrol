import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { chartScale } from "../../app/lib/chart-scale.ts";
import { calculateNutritionPlan } from "../../app/lib/nutrition-calc.ts";
import {
  contradictsGoal,
  formatKg,
  formatKgDelta,
  projectionPace,
  projectWeight,
  showsProjection,
} from "../../app/lib/weight-projection.ts";

// Mock de la propuesta: hombre, 28 años, 178 cm, 78,5 kg, 22% de grasa, actividad moderada.
const body = { gender: "male", age: 28, heightCm: 178, weightKg: 78.5, bodyFatPct: 22, activityLevel: "moderate" };
const planFor = (goal, input = body) => calculateNutritionPlan({ ...input, goal });
const project = (goal, weeks = 12, input = body) =>
  projectWeight({ ...input, goal }, planFor(goal, input).targetKcal, weeks);

describe("projectWeight", () => {
  it("definición baja ~5 kg en 12 semanas y la curva se aplana", () => {
    const result = project("cut");
    assert.equal(result.points.length, 13);
    assert.equal(result.points[0].kg, 78.5);
    assert.equal(formatKg(result.points[12].kg), "73,5");
    assert.equal(result.direction, "down");
    assert.equal(result.pace, "steady");
    const first = result.points[0].kg - result.points[1].kg;
    const last = result.points[11].kg - result.points[12].kg;
    assert.ok(last < first, "la última semana baja menos que la primera");
  });

  it("volumen sube ~2,5 kg en 12 semanas", () => {
    const result = project("bulk");
    assert.equal(formatKg(result.points[12].kg), "81,0");
    assert.equal(result.direction, "up");
    assert.equal(result.pace, "steady");
    assert.equal(formatKgDelta(result.weeklyKg, 2), "+0,24");
  });

  it("recomposición queda plana y no se muestra", () => {
    const result = project("recomposition");
    assert.equal(result.direction, "flat");
    assert.equal(showsProjection("recomposition"), false);
    assert.equal(showsProjection("cut"), true);
  });

  it("la banda arranca en cero y se abre ±25% del cambio", () => {
    const { points } = project("cut");
    assert.equal(points[0].low, points[0].high);
    const change = 78.5 - points[12].kg;
    assert.ok(Math.abs(points[12].high - points[12].kg - change * 0.25) < 1e-9);
    assert.ok(points[12].low < points[12].kg && points[12].kg < points[12].high);
  });

  it("se detiene en el peso de IMC 18,5", () => {
    const lean = { ...body, weightKg: 60, heightCm: 178, bodyFatPct: null };
    const result = projectWeight({ ...lean, goal: "cut" }, 1000, 24);
    const floor = 18.5 * 1.78 ** 2;
    assert.equal(result.floorReached, true);
    assert.ok(Math.abs(result.points[24].kg - floor) < 1e-9);
    assert.ok(result.points.every((point) => point.kg >= floor - 1e-9));
  });

  it("un objetivo manual agresivo da ritmo alto", () => {
    const plan = planFor("cut");
    const result = projectWeight({ ...body, goal: "cut" }, Math.round(plan.maintenanceKcal * 0.6), 12);
    assert.equal(result.pace, "fast");
  });
});

describe("projectWeight · grasa corporal", () => {
  it("sin % de grasa no proyecta la grasa", () => {
    assert.equal(project("cut", 12, { ...body, bodyFatPct: null }).fat, null);
  });

  it("arranca en el % del perfil y grasa + magra suman el peso", () => {
    const { points, fat } = project("cut");
    assert.equal(fat.length, points.length);
    assert.ok(Math.abs(fat[0].pct - 22) < 1e-9);
    assert.equal(fat[0].low, fat[0].high);
    fat.forEach((point, week) => {
      assert.ok(Math.abs(point.fatKg + point.leanKg - points[week].kg) < 1e-9);
      assert.ok(point.low <= point.pct && point.pct <= point.high);
    });
  });

  it("en definición la mayor parte de lo que baja es grasa y el % baja", () => {
    const { points, fat } = project("cut");
    const lost = points[0].kg - points[12].kg;
    const fatLost = fat[0].fatKg - fat[12].fatKg;
    assert.ok(fatLost / lost > 0.75 && fatLost / lost < 0.9, `grasa ${fatLost} de ${lost}`);
    assert.equal(formatKg(fat[12].pct), "18,1");
  });

  it("en volumen el % sube: Forbes reparte sin el ajuste de definición", () => {
    const { points, fat } = project("bulk");
    const gained = points[12].kg - points[0].kg;
    const leanGained = fat[12].leanKg - fat[0].leanKg;
    assert.ok(Math.abs(leanGained / gained - 10.4 / (10.4 + 17.27)) < 0.02);
    assert.ok(fat[12].pct > 22);
  });

  it("con menos grasa, más del cambio es magra", () => {
    const lean = project("cut", 12, { ...body, bodyFatPct: 10 }).fat;
    const high = project("cut", 12, body).fat;
    const leanShare = (fat) => (fat[0].leanKg - fat[12].leanKg) / (fat[0].leanKg + fat[0].fatKg - fat[12].leanKg - fat[12].fatKg);
    assert.ok(leanShare(lean) > leanShare(high));
  });
});

describe("projectionPace", () => {
  it("usa límites distintos para bajar y para subir", () => {
    assert.equal(projectionPace("down", 0.4), "slow");
    assert.equal(projectionPace("down", 0.8), "steady");
    assert.equal(projectionPace("down", 1.2), "fast");
    assert.equal(projectionPace("up", 0.2), "slow");
    assert.equal(projectionPace("up", 0.4), "steady");
    assert.equal(projectionPace("up", 0.6), "fast");
  });
});

describe("contradictsGoal", () => {
  it("avisa si el objetivo fijo va al revés", () => {
    assert.equal(contradictsGoal("cut", "up"), true);
    assert.equal(contradictsGoal("bulk", "down"), true);
    assert.equal(contradictsGoal("cut", "down"), false);
    assert.equal(contradictsGoal("bulk", "flat"), false);
  });
});

describe("formatKgDelta", () => {
  it("usa el signo menos tipográfico y no firma el cero", () => {
    assert.equal(formatKgDelta(-5.04), "−5,0");
    assert.equal(formatKgDelta(2.76), "+2,8");
    assert.equal(formatKgDelta(-0.01), "0,0");
  });
});

describe("chartScale (movida a chart-scale.ts)", () => {
  it("sigue dando ticks redondos", () => {
    assert.deepEqual(chartScale([72.3, 78.5]), { min: 72, max: 80, ticks: [72, 74, 76, 78, 80] });
  });
});
