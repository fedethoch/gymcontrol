import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getTodayDateKey } from "../../app/lib/local-date.ts";
import {
  buildWeekStrip,
  isoWeekday,
  parseWeekdays,
  planWeek,
  relativeDayLabel,
  resolveSchedule,
  scheduleNeedsChoice,
  suggestWeekdays,
  summarizeWeek,
  weekdayTitle,
} from "../../app/lib/training-schedule.ts";

const WEDNESDAY = "2026-09-23";
const days = [
  { id: "d1", dayOrder: 1 },
  { id: "d2", dayOrder: 2 },
  { id: "d3", dayOrder: 3 },
];
const planFor = (overrides = {}) =>
  planWeek({ weekdays: [1, 3, 5], days, completedDayIds: [], todayKey: WEDNESDAY, ...overrides });

describe("isoWeekday", () => {
  it("lunes = 1 … domingo = 7", () => {
    assert.equal(isoWeekday("2026-09-21"), 1);
    assert.equal(isoWeekday("2026-09-23"), 3);
    assert.equal(isoWeekday("2026-09-27"), 7);
    assert.equal(weekdayTitle(3), "Miércoles");
  });

  it("a las 21:30 de Argentina sigue siendo el mismo día aunque en UTC ya sea mañana", () => {
    const lateWednesday = new Date("2026-09-24T00:30:00Z");
    assert.equal(getTodayDateKey(lateWednesday), WEDNESDAY);
    assert.equal(isoWeekday(getTodayDateKey(lateWednesday)), 3);
  });
});

describe("parseWeekdays", () => {
  it("ordena, saca repetidos y acepta texto del form", () => {
    assert.deepEqual(parseWeekdays(["5", "1", "3"]), [1, 3, 5]);
    assert.deepEqual(parseWeekdays([3, 1, 3]), [1, 3]);
  });

  it("rechaza lo que no es un día de semana", () => {
    assert.equal(parseWeekdays(["8"]), null);
    assert.equal(parseWeekdays(["0"]), null);
    assert.equal(parseWeekdays(["x"]), null);
    assert.equal(parseWeekdays([1.5]), null);
  });
});

describe("resolveSchedule", () => {
  it("vale solo si coincide con la cantidad de días de la rutina", () => {
    assert.deepEqual(resolveSchedule([1, 3, 5], 3), [1, 3, 5]);
    assert.equal(resolveSchedule([1, 3], 3), null, "el admin cambió la rutina: hay que volver a elegir");
    assert.equal(resolveSchedule(null, 3), null, "sin elegir");
  });

  it("con 7 días son todos y con más de 7 no hay calendario", () => {
    assert.deepEqual(resolveSchedule(null, 7), [1, 2, 3, 4, 5, 6, 7]);
    assert.equal(resolveSchedule([1, 2, 3, 4, 5, 6, 7], 8), null);
    assert.equal(resolveSchedule(null, 0), null);
  });

  it("solo se eligen días de 1 a 6", () => {
    assert.deepEqual([0, 1, 6, 7, 8].map(scheduleNeedsChoice), [false, true, true, false, false]);
  });
});

describe("suggestWeekdays", () => {
  it("sin historial reparte los días desde el lunes", () => {
    assert.deepEqual(suggestWeekdays(3, [], WEDNESDAY), [1, 3, 5]);
    assert.deepEqual(suggestWeekdays(2, [], WEDNESDAY), [1, 4]);
    assert.deepEqual(suggestWeekdays(7, [], WEDNESDAY), [1, 2, 3, 4, 5, 6, 7]);
    assert.deepEqual(suggestWeekdays(0, [], WEDNESDAY), []);
  });

  it("toma los días que se entrenan seguido en las últimas 4 semanas", () => {
    const history = ["2026-09-01", "2026-09-08", "2026-09-03", "2026-09-10", "2026-09-05", "2026-09-12"];
    assert.deepEqual(suggestWeekdays(3, history, WEDNESDAY), [2, 4, 6]);
  });

  it("ignora un día entrenado una sola vez y lo que pasó hace más de 4 semanas", () => {
    const history = ["2026-09-01", "2026-09-15", "2026-09-18", "2026-08-04", "2026-08-11"];
    // martes 2 veces; viernes 1 vez; los martes de agosto quedan fuera de la ventana.
    assert.deepEqual(suggestWeekdays(3, history, WEDNESDAY), [1, 2, 3]);
  });
});

describe("planWeek", () => {
  it("cada día de la rutina cae en su día elegido de esta semana", () => {
    const plan = planFor();
    assert.deepEqual(
      plan.map(({ id, dateKey, status }) => [id, dateKey, status]),
      [
        ["d1", "2026-09-21", "missed"],
        ["d2", "2026-09-23", "today"],
        ["d3", "2026-09-25", "upcoming"],
      ],
    );
    const week = summarizeWeek(plan);
    assert.equal(week.today?.id, "d2");
    assert.deepEqual(week.missed.map((day) => day.id), ["d1"]);
    assert.equal(week.next?.id, "d3");
  });

  it("si adelantaste el día de hoy, hoy no toca nada", () => {
    const week = summarizeWeek(planFor({ completedDayIds: ["d1", "d2"] }));
    assert.equal(week.today, null);
    assert.equal(week.missed.length, 0);
    assert.equal(week.next?.id, "d3");
  });

  it("eligiendo los días un jueves, lo anterior queda como pendiente", () => {
    const week = summarizeWeek(planFor({ todayKey: "2026-09-24" }));
    assert.equal(week.today, null);
    assert.deepEqual(week.missed.map((day) => day.id), ["d1", "d2"]);
    assert.equal(week.next?.id, "d3");
  });
});

describe("relativeDayLabel", () => {
  it("mañana o el día de la semana", () => {
    assert.equal(relativeDayLabel("2026-09-24", WEDNESDAY), "mañana");
    assert.equal(relativeDayLabel("2026-09-25", WEDNESDAY), "viernes");
  });
});

describe("buildWeekStrip", () => {
  it("lunes a domingo con lo entrenado, lo planeado y lo que quedó", () => {
    const strip = buildWeekStrip({ todayKey: WEDNESDAY, trainedDates: new Set(["2026-09-22"]), plan: planFor() });
    assert.equal(strip.length, 7);
    assert.deepEqual(
      strip.map((day) => [day.iso, day.plannedDayOrder, day.trained, day.missed, day.isToday]),
      [
        [1, 1, false, true, false],
        [2, null, true, false, false],
        [3, 2, false, false, true],
        [4, null, false, false, false],
        [5, 3, false, false, false],
        [6, null, false, false, false],
        [7, null, false, false, false],
      ],
    );
  });

  it("sin calendario no hay días planeados", () => {
    const strip = buildWeekStrip({ todayKey: WEDNESDAY, trainedDates: new Set(), plan: null });
    assert.ok(strip.every((day) => day.plannedDayId === null && !day.missed));
  });
});
