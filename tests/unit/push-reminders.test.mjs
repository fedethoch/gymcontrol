import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveTodayTraining } from "../../app/lib/home-dashboard.ts";
import { isMealTypePending } from "../../app/lib/meal-diary.ts";
import { buildWeeklySummary } from "../../app/lib/weekly-summary.ts";

// Miércoles 2026-09-23; rutina de 3 días lunes · miércoles · viernes.
const WEDNESDAY = "2026-09-23";
const days = [
  { id: "d1", dayOrder: 1 },
  { id: "d2", dayOrder: 2 },
  { id: "d3", dayOrder: 3 },
];
const routine = { trainingWeekdays: [1, 3, 5], days };
const today = (overrides = {}) =>
  resolveTodayTraining({
    routine,
    completedRoutineDayIds: [],
    trainedToday: false,
    openRoutineDayId: null,
    todayKey: WEDNESDAY,
    ...overrides,
  });

describe("resolveTodayTraining (aviso 'Hoy toca entrenar')", () => {
  it("día de entreno pendiente: ready con el día de hoy", () => {
    const result = today({ completedRoutineDayIds: ["d1"] });
    assert.equal(result.heroState, "ready");
    assert.equal(result.todayPlannedDay?.id, "d2");
    assert.equal(result.heroDay?.id, "d2");
  });

  it("aunque haya quedado un día atrás, hoy toca el día fijo de hoy", () => {
    const result = today();
    assert.equal(result.heroState, "ready");
    assert.equal(result.todayPlannedDay?.id, "d2");
  });

  it("día de descanso: rest y sin día planificado", () => {
    const result = today({ todayKey: "2026-09-22", completedRoutineDayIds: ["d1"] });
    assert.equal(result.heroState, "rest");
    assert.equal(result.todayPlannedDay, null);
  });

  it("ya entrenó hoy: done_today", () => {
    assert.equal(today({ completedRoutineDayIds: ["d1"], trainedToday: true }).heroState, "done_today");
  });

  it("entreno a medio hacer: in_progress", () => {
    const result = today({ openRoutineDayId: "d2" });
    assert.equal(result.heroState, "in_progress");
    assert.equal(result.openDay?.id, "d2");
  });

  it("semana hecha: week_done", () => {
    assert.equal(today({ completedRoutineDayIds: ["d1", "d2", "d3"] }).heroState, "week_done");
  });

  it("sin rutina: no_routine", () => {
    assert.equal(today({ routine: null }).heroState, "no_routine");
  });

  it("sin días elegidos: needs_schedule", () => {
    const result = today({ routine: { trainingWeekdays: null, days } });
    assert.equal(result.heroState, "needs_schedule");
    assert.equal(result.todayPlannedDay, null);
  });

  it("rutina de 7 días: todos los días tocan", () => {
    const seven = Array.from({ length: 7 }, (_, index) => ({ id: `s${index + 1}`, dayOrder: index + 1 }));
    const result = today({ routine: { trainingWeekdays: null, days: seven } });
    assert.equal(result.heroState, "ready");
    assert.equal(result.todayPlannedDay?.id, "s3");
  });

  it("rutina de 8 días: ready sin día planificado (el aviso no sale)", () => {
    const eight = Array.from({ length: 8 }, (_, index) => ({ id: `e${index + 1}`, dayOrder: index + 1 }));
    const result = today({ routine: { trainingWeekdays: null, days: eight } });
    assert.equal(result.heroState, "ready");
    assert.equal(result.todayPlannedDay, null);
  });
});

describe("isMealTypePending (aviso de comida)", () => {
  it("pendiente sin comida de ese tipo o con la comida vacía", () => {
    assert.equal(isMealTypePending([], "almuerzo"), true);
    assert.equal(isMealTypePending([{ type: "almuerzo", items: [] }], "almuerzo"), true);
    assert.equal(isMealTypePending([{ type: "desayuno", items: [{}] }], "almuerzo"), true);
  });

  it("registrada si alguna comida de ese tipo tiene alimentos", () => {
    assert.equal(
      isMealTypePending(
        [
          { type: "almuerzo", items: [] },
          { type: "almuerzo", items: [{}] },
        ],
        "almuerzo",
      ),
      false,
    );
  });
});

describe("buildWeeklySummary", () => {
  const SUNDAY = "2026-09-27";

  it("cuenta los últimos 7 días (lunes a domingo si es domingo)", () => {
    const summary = buildWeeklySummary({
      todayKey: SUNDAY,
      training: { trainedDates: ["2026-09-20", "2026-09-21", "2026-09-23", "2026-09-23", "2026-09-25"], plannedPerWeek: 3 },
      nutrition: {
        loggedDates: ["2026-09-20", "2026-09-21", "2026-09-22", "2026-09-26"],
        days: [
          { logDate: "2026-09-21", totalKcal: 1950, targetKcal: 2000 },
          { logDate: "2026-09-22", totalKcal: 2050, targetKcal: 2000 },
          { logDate: "2026-09-26", totalKcal: 1980, targetKcal: null },
          { logDate: "2026-09-24", totalKcal: 0, targetKcal: 2000 },
        ],
        currentTargetKcal: 2000,
      },
    });

    assert.deepEqual(summary, {
      training: { done: 3, planned: 3 },
      // 21 (97,5%) y 26 (99%, objetivo actual) en objetivo; 22 se pasó; 24 sin registro.
      nutrition: { loggedDays: 3, onTargetDays: 2 },
    });
  });

  it("sin rutina o sin perfil, esa parte queda afuera", () => {
    assert.deepEqual(buildWeeklySummary({ todayKey: SUNDAY, training: null, nutrition: null }), {
      training: null,
      nutrition: null,
    });
  });
});
