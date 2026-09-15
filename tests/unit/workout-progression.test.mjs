import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  computeWeeklyStreak,
  estimateDayMinutes,
  estimateE1rm,
  findBestSet,
  formatLoggedSet,
  getLoadStep,
  isValidSet,
  parsePlanTarget,
  parseRestSeconds,
  resolveExerciseKind,
  suggestNextTarget,
} from "../../app/lib/workout-progression.ts";

const set = (kg, reps, done = true, secs = null) => ({ kg, reps, secs, done });

describe("parsePlanTarget", () => {
  it("entiende los formatos reales de routine_items.repetitions", () => {
    assert.deepEqual(parsePlanTarget("8-10"), { measure: "reps", min: 8, max: 10 });
    assert.deepEqual(parsePlanTarget("12"), { measure: "reps", min: 12, max: 12 });
    assert.deepEqual(parsePlanTarget("10 c/lado"), { measure: "reps", min: 10, max: 10 });
    assert.deepEqual(parsePlanTarget("30-45s"), { measure: "seconds", min: 30, max: 45 });
    assert.deepEqual(parsePlanTarget("45-60s"), { measure: "seconds", min: 45, max: 60 });
    assert.deepEqual(parsePlanTarget("30m"), { measure: "minutes", min: 30, max: 30 });
  });

  it("devuelve null si no reconoce el formato", () => {
    assert.equal(parsePlanTarget("AMRAP"), null);
    assert.equal(parsePlanTarget("10-8"), null);
    assert.equal(parsePlanTarget(""), null);
  });
});

describe("resolveExerciseKind", () => {
  it("tiempo manda sobre el equipamiento y peso corporal es bodyweight", () => {
    assert.equal(resolveExerciseKind(parsePlanTarget("30-45s"), "Peso corporal"), "time");
    assert.equal(resolveExerciseKind(parsePlanTarget("6-12"), "Peso corporal"), "bodyweight");
    assert.equal(resolveExerciseKind(parsePlanTarget("8-10"), "Barra"), "reps");
    assert.equal(resolveExerciseKind(null, null), "reps");
  });
});

describe("parseRestSeconds", () => {
  it("usa el límite inferior de un rango y entiende minutos", () => {
    assert.equal(parseRestSeconds("60s"), 60);
    assert.equal(parseRestSeconds("60-120s"), 60);
    assert.equal(parseRestSeconds("0s"), 0);
    assert.equal(parseRestSeconds("2 min"), 120);
    assert.equal(parseRestSeconds("1:30"), 90);
    assert.equal(parseRestSeconds("un rato"), null);
  });
});

describe("estimateDayMinutes", () => {
  it("suma series por trabajo y descanso, con piso de 15 y redondeo a 5", () => {
    assert.equal(estimateDayMinutes([]), 0);
    assert.equal(
      estimateDayMinutes([
        { series: 3, rest: "90s" },
        { series: 3, rest: "60s" },
      ]),
      15,
    );
    assert.equal(
      estimateDayMinutes([
        { series: 4, rest: "120s" },
        { series: 3, rest: "90s" },
        { series: 3, rest: "60-120s" },
      ]),
      20,
    );
  });
});

describe("isValidSet, estimateE1rm y findBestSet", () => {
  it("una serie cuenta solo si está hecha y tiene reps o segundos", () => {
    assert.equal(isValidSet(set(40, 10)), true);
    assert.equal(isValidSet(set(40, 10, false)), false);
    assert.equal(isValidSet(set(40, null)), false);
    assert.equal(isValidSet(set(null, null, true, 45)), true);
  });

  it("solo estima con peso y entre 1 y 12 reps", () => {
    assert.equal(estimateE1rm(100, 1), 100);
    assert.equal(estimateE1rm(80, 10), 106.7);
    assert.equal(estimateE1rm(80, 15), null);
    assert.equal(estimateE1rm(null, 10), null);
    assert.equal(estimateE1rm(0, 10), null);
  });

  it("ignora series sin completar y ejercicios que no son de reps", () => {
    const sets = [set(80, 10), set(100, 5, false), set(90, 6)];

    assert.deepEqual(findBestSet(sets, "reps"), { kg: 90, reps: 6, e1rm: 108 });
    assert.equal(findBestSet(sets, "bodyweight"), null);
    assert.equal(findBestSet(sets, "time"), null);
  });
});

describe("suggestNextTarget", () => {
  const target = { measure: "reps", min: 8, max: 10 };

  it("sube la carga cuando todas las series llegaron al tope", () => {
    assert.deepEqual(
      suggestNextTarget({
        target,
        kind: "reps",
        previousSets: [set(40, 10), set(40, 10), set(40, 10)],
        plannedSeries: 3,
        loadStep: getLoadStep("Barra"),
      }),
      { kind: "increase_load", kg: 42.5, reps: 8 },
    );
  });

  it("pide una rep más en la serie más floja si no llegó al tope", () => {
    assert.deepEqual(
      suggestNextTarget({
        target,
        kind: "reps",
        previousSets: [set(40, 10), set(40, 9), set(40, 7)],
        plannedSeries: 3,
        loadStep: 2.5,
      }),
      { kind: "increase_reps", kg: 40, reps: 8 },
    );
  });

  it("no sube carga si faltaron series del plan o hubo series sin completar", () => {
    assert.equal(
      suggestNextTarget({
        target,
        kind: "reps",
        previousSets: [set(40, 10), set(40, 10), set(40, 10, false)],
        plannedSeries: 3,
        loadStep: 2.5,
      })?.kind,
      "increase_reps",
    );
  });

  it("en peso corporal avisa el tope en vez de inventar carga", () => {
    assert.deepEqual(
      suggestNextTarget({
        target: { measure: "reps", min: 6, max: 12 },
        kind: "bodyweight",
        previousSets: [set(null, 12), set(null, 12)],
        plannedSeries: 2,
        loadStep: getLoadStep("Peso corporal"),
      }),
      { kind: "top_of_range" },
    );
  });

  it("en tiempo progresa en segundos", () => {
    const timeTarget = { measure: "seconds", min: 30, max: 45 };

    assert.deepEqual(
      suggestNextTarget({
        target: timeTarget,
        kind: "time",
        previousSets: [set(null, null, true, 35), set(null, null, true, 30)],
        plannedSeries: 2,
        loadStep: null,
      }),
      { kind: "increase_time", secs: 35 },
    );
    assert.deepEqual(
      suggestNextTarget({
        target: timeTarget,
        kind: "time",
        previousSets: [set(null, null, true, 45), set(null, null, true, 50)],
        plannedSeries: 2,
        loadStep: null,
      }),
      { kind: "top_of_range" },
    );
  });

  it("no sugiere sin datos válidos previos", () => {
    assert.equal(suggestNextTarget({ target, kind: "reps", previousSets: [], plannedSeries: 3, loadStep: 2.5 }), null);
    assert.equal(
      suggestNextTarget({ target, kind: "reps", previousSets: [set(40, 10, false)], plannedSeries: 3, loadStep: 2.5 }),
      null,
    );
  });
});

describe("computeWeeklyStreak", () => {
  const weekStarts = ["2026-09-14", "2026-09-07", "2026-08-31", "2026-08-24"];

  it("cuenta semanas seguidas cumplidas sin cortar por la semana en curso", () => {
    assert.equal(
      computeWeeklyStreak({
        weekStarts,
        sessionsByWeekStart: { "2026-09-14": 1, "2026-09-07": 3, "2026-08-31": 3 },
        plannedDays: 3,
      }),
      2,
    );
  });

  it("suma la semana en curso cuando ya se cumplió y corta en la primera semana incompleta", () => {
    assert.equal(
      computeWeeklyStreak({
        weekStarts,
        sessionsByWeekStart: { "2026-09-14": 3, "2026-09-07": 2, "2026-08-31": 3 },
        plannedDays: 3,
      }),
      1,
    );
  });
});

describe("formatLoggedSet", () => {
  it("formatea según el tipo de ejercicio", () => {
    assert.equal(formatLoggedSet(set(42.5, 10), "reps"), "42.5 kg × 10");
    assert.equal(formatLoggedSet(set(null, 12), "bodyweight"), "12 reps");
    assert.equal(formatLoggedSet(set(10, 8), "bodyweight"), "+10 kg × 8");
    assert.equal(formatLoggedSet(set(null, null, true, 45), "time"), "45 s");
    assert.equal(formatLoggedSet(set(null, null, true, 1800), "time"), "30 min");
    assert.equal(formatLoggedSet(set(40, null), "reps"), "—");
  });
});
