import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildDayTabs,
  dayMuscleGroups,
  initialDayIndex,
  resolveDockAction,
  weekdayShort,
} from "../../app/lib/routine-week.ts";

const TODAY = "2026-09-15"; // martes
const days = [
  { id: "d1", dayOrder: 1, mainGroup: "Pecho" },
  { id: "d2", dayOrder: 2, mainGroup: "Hombros" },
  { id: "d3", dayOrder: 3, mainGroup: "Piernas" },
  { id: "d4", dayOrder: 4, mainGroup: null },
];

const tabsFor = (overrides = {}) =>
  buildDayTabs({
    days,
    completedDayIds: [],
    completedDayDates: {},
    openDayId: null,
    trainedToday: false,
    todayKey: TODAY,
    ...overrides,
  });

const primaryCount = (tabs, context) =>
  tabs.filter((tab) => resolveDockAction(tab, context).tone === "primary").length;

describe("weekdayShort", () => {
  it("nombra el día de la semana de una fecha", () => {
    assert.equal(weekdayShort("2026-09-14"), "Lun");
    assert.equal(weekdayShort("2026-09-15"), "Mar");
    assert.equal(weekdayShort("2026-09-20"), "Dom");
  });
});

describe("dayMuscleGroups", () => {
  it("ordena por frecuencia, ignora vacíos y corta en 3", () => {
    const item = (muscleGroup) => ({ exercise: { muscleGroup } });
    const groups = dayMuscleGroups([
      item("Biceps"),
      item("Hombros"),
      item(null),
      item("Hombros"),
      item("Triceps"),
      item("Core"),
      item("Hombros"),
      item("Biceps"),
    ]);
    assert.deepEqual(groups, ["Hombros", "Biceps", "Triceps"]);
  });
});

describe("buildDayTabs", () => {
  it("listo: el primer pendiente es 'Hoy' y el resto muestra su grupo", () => {
    const tabs = tabsFor({ completedDayIds: ["d1"], completedDayDates: { d1: "2026-09-14" } });
    assert.deepEqual(
      tabs.map(({ state, label }) => [state, label]),
      [
        ["done", "Lun"],
        ["next", "Hoy"],
        ["pending", "Piernas"],
        ["pending", "Día 4"],
      ],
    );
    assert.equal(initialDayIndex(tabs), 1);
  });

  it("en curso manda sobre el próximo pendiente", () => {
    const tabs = tabsFor({ completedDayIds: ["d1"], completedDayDates: { d1: "2026-09-14" }, openDayId: "d3" });
    assert.deepEqual(
      tabs.map((tab) => tab.state),
      ["done", "pending", "in_progress", "pending"],
    );
    assert.equal(tabs[2].label, "En curso");
    assert.equal(initialDayIndex(tabs), 2);
  });

  it("hecho hoy: el día de hoy dice 'Hoy' y el siguiente 'Próximo'", () => {
    const tabs = tabsFor({
      completedDayIds: ["d1", "d2"],
      completedDayDates: { d1: "2026-09-14", d2: TODAY },
      trainedToday: true,
    });
    assert.equal(tabs[1].label, "Hoy");
    assert.equal(tabs[1].doneDate, TODAY);
    assert.deepEqual([tabs[2].state, tabs[2].label], ["next", "Próximo"]);
    assert.equal(initialDayIndex(tabs), 2);
  });

  it("semana cerrada: sin panel inicial (resumen)", () => {
    const tabs = tabsFor({
      completedDayIds: ["d1", "d2", "d3", "d4"],
      completedDayDates: { d1: "2026-09-14", d2: "2026-09-15", d3: "2026-09-17", d4: "2026-09-19" },
    });
    assert.ok(tabs.every((tab) => tab.state === "done"));
    assert.deepEqual(tabs.map((tab) => tab.label), ["Lun", "Hoy", "Jue", "Sáb"]);
    assert.equal(initialDayIndex(tabs), null);
  });

  it("sin días: sin pestañas ni panel", () => {
    const tabs = buildDayTabs({
      days: [],
      completedDayIds: [],
      completedDayDates: {},
      openDayId: null,
      trainedToday: false,
      todayKey: TODAY,
    });
    assert.deepEqual(tabs, []);
    assert.equal(initialDayIndex(tabs), null);
  });

  it("hecho sin fecha conocida cae en 'Hecho'", () => {
    const tabs = tabsFor({ completedDayIds: ["d1"] });
    assert.equal(tabs[0].label, "Hecho");
  });
});

describe("resolveDockAction", () => {
  it("listo: 'Empezar' emerald solo en el próximo", () => {
    const tabs = tabsFor({ completedDayIds: ["d1"], completedDayDates: { d1: "2026-09-14" } });
    const context = { trainedToday: false, todayDoneOrder: null };
    assert.deepEqual(resolveDockAction(tabs[1], context), { label: "Empezar", tone: "primary", note: null });
    assert.deepEqual(resolveDockAction(tabs[0], context), { label: "Ver día 1", tone: "neutral", note: null });
    assert.deepEqual(resolveDockAction(tabs[2], context), { label: "Empezar día 3", tone: "neutral", note: null });
    assert.equal(primaryCount(tabs, context), 1);
  });

  it("en curso: 'Continuar' es el único emerald", () => {
    const tabs = tabsFor({ openDayId: "d2" });
    const context = { trainedToday: false, todayDoneOrder: null };
    assert.equal(resolveDockAction(tabs[1], context).label, "Continuar");
    assert.equal(primaryCount(tabs, context), 1);
  });

  it("hecho hoy: el próximo queda neutro con la nota", () => {
    const tabs = tabsFor({
      completedDayIds: ["d1", "d2"],
      completedDayDates: { d1: "2026-09-14", d2: TODAY },
      trainedToday: true,
    });
    const context = { trainedToday: true, todayDoneOrder: 2 };
    assert.deepEqual(resolveDockAction(tabs[2], context), {
      label: "Empezar día 3",
      tone: "neutral",
      note: "Hoy ya entrenaste · Día 2 hecho",
    });
    assert.equal(primaryCount(tabs, context), 0);
  });

  it("entreno de hoy en otra rutina: nota sin número de día", () => {
    const tabs = tabsFor({ trainedToday: true });
    assert.equal(resolveDockAction(tabs[0], { trainedToday: true, todayDoneOrder: null }).note, "Hoy ya entrenaste");
  });
});

describe("con días elegidos", () => {
  // Lun, Mar (hoy), Jue y Sáb.
  const plannedDates = { d1: "2026-09-14", d2: TODAY, d3: "2026-09-17", d4: "2026-09-19" };

  it("cada pendiente muestra su día y el de hoy es el próximo", () => {
    const tabs = tabsFor({ plannedDates, completedDayIds: ["d1"], completedDayDates: { d1: "2026-09-14" } });
    assert.deepEqual(
      tabs.map(({ state, label }) => [state, label]),
      [
        ["done", "Lun"],
        ["next", "Hoy"],
        ["pending", "Jue"],
        ["pending", "Sáb"],
      ],
    );
    assert.equal(resolveDockAction(tabs[1], { trainedToday: false, todayDoneOrder: null }).tone, "primary");
  });

  it("si faltaste, el día queda pendiente con su día y el de hoy sigue siendo el próximo", () => {
    const tabs = tabsFor({ plannedDates });
    assert.deepEqual([tabs[0].state, tabs[0].label, tabs[0].missed], ["pending", "Lun", true]);
    assert.deepEqual([tabs[1].state, tabs[1].label], ["next", "Hoy"]);
  });

  it("día libre: se ofrece el próximo día de entreno, neutro", () => {
    const tabs = tabsFor({
      plannedDates: { d1: "2026-09-14", d2: "2026-09-16", d3: "2026-09-18", d4: "2026-09-20" },
      completedDayIds: ["d1"],
      completedDayDates: { d1: "2026-09-14" },
    });
    assert.deepEqual([tabs[1].state, tabs[1].label], ["next", "Mié"]);
    assert.equal(initialDayIndex(tabs), 1);
    assert.deepEqual(resolveDockAction(tabs[1], { trainedToday: false, todayDoneOrder: null, restDay: true }), {
      label: "Empezar día 2",
      tone: "neutral",
      note: "Hoy no toca entrenar",
    });
    assert.equal(primaryCount(tabs, { trainedToday: false, todayDoneOrder: null, restDay: true }), 0);
  });

  it("sin días por delante, se ofrece el primero que quedó atrás", () => {
    const tabs = tabsFor({
      todayKey: "2026-09-20", // domingo
      plannedDates: { d1: "2026-09-14", d2: "2026-09-16", d3: "2026-09-18", d4: "2026-09-19" },
    });
    assert.deepEqual([tabs[0].state, tabs[0].label, tabs[0].missed], ["next", "Lun", true]);
    assert.ok(tabs.slice(1).every((tab) => tab.state === "pending" && tab.missed));
  });
});
