import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveHeroState } from "../../app/lib/home-dashboard.ts";
import { buildHeroView, buildHomeHeroInputs } from "../../app/lib/home-hero.ts";
import { planWeek } from "../../app/lib/training-schedule.ts";

const day = (order, groups = ["Espalda", "Bíceps"]) => ({
  id: `d${order}`,
  order,
  total: 3,
  name: `Día ${order}`,
  groups,
  minutes: 55,
  exerciseCount: 6,
  seriesCount: 18,
  href: `/rutinas/dia?savedRoutineId=r1&day=${order}`,
});

const text = (line) => (line?.kind === "text" ? line.parts.map((part) => part.text).join("") : null);
const title = (view) => view.title.map((part) => part.text).join("");

const state = (overrides = {}) =>
  resolveHeroState({
    hasActiveRoutine: true,
    hasPendingDay: true,
    trainedToday: false,
    hasOpenSession: false,
    needsSchedule: false,
    restDay: false,
    ...overrides,
  });

describe("resolveHeroState", () => {
  it("un entreno de hoy gana siempre: nunca vuelve a \"Hoy toca descanso\"", () => {
    assert.equal(state({ restDay: true, hasOpenSession: true }), "in_progress");
    assert.equal(state({ restDay: true, trainedToday: true }), "done_today");
    assert.equal(state({ needsSchedule: true, trainedToday: true }), "done_today");
  });

  it("semana cerrada antes que pedir días o descansar", () => {
    assert.equal(state({ hasPendingDay: false, restDay: true }), "week_done");
    assert.equal(state({ hasPendingDay: false, needsSchedule: true }), "week_done");
  });

  it("sin días elegidos se piden antes de decidir descanso o entreno", () => {
    assert.equal(state({ needsSchedule: true }), "needs_schedule");
    assert.equal(state({ restDay: true }), "rest");
    assert.equal(state(), "ready");
    assert.equal(state({ hasActiveRoutine: false, hasOpenSession: true }), "no_routine");
  });
});

describe("buildHeroView", () => {
  it("día de entreno: Día N de M, grupos y Empezar emerald con los ejercicios", () => {
    const view = buildHeroView({ kind: "ready", weekdayLabel: "Miércoles", day: day(2) });
    assert.equal(view.chip.text, "Miércoles · Día 2 de 3");
    assert.equal(title(view), "Espalda & Bíceps");
    assert.deepEqual(view.primary, { label: "Empezar", href: day(2).href, icon: "play" });
    assert.deepEqual(view.sheet, { dayId: "d2", ctaLabel: "Empezar" });
  });

  it("descanso al día: próximo entreno y Entrenar igual neutro", () => {
    const view = buildHeroView({
      kind: "rest",
      weekdayLabel: "Martes",
      missed: null,
      next: { day: day(2), when: "mañana" },
    });
    assert.equal(view.chip.text, "Martes · Descanso");
    assert.equal(title(view), "Hoy toca descanso");
    assert.equal(text(view.line), "Próximo: mañana · Día 2 · Espalda & Bíceps");
    assert.equal(view.primary, null);
    assert.deepEqual(view.secondary, { label: "Entrenar igual", href: day(2).href });
    assert.equal(view.tone, "dim");
  });

  it("descanso atrasado: avisa el día que quedó y ofrece hacerlo hoy", () => {
    const view = buildHeroView({
      kind: "rest",
      weekdayLabel: "Martes",
      missed: day(1, ["Pecho", "Tríceps"]),
      next: { day: day(2), when: "mañana" },
    });
    assert.equal(title(view), "Hoy no toca");
    assert.match(text(view.line), /^Te quedó el Día 1 · Pecho & Tríceps/);
    assert.deepEqual(view.secondary, { label: "Hacer el Día 1 hoy", href: day(1).href });
    assert.equal(view.primary, null);
  });

  it("sin días elegidos: pregunta, abre el selector y deja entrenar igual", () => {
    const view = buildHeroView({ kind: "needs_schedule", routineName: "Push Pull Legs", dayCount: 3, startDay: day(1) });
    assert.equal(view.chip.text, "Push Pull Legs · 3 días");
    assert.equal(title(view), "¿Qué días vas al gym?");
    assert.equal(view.chooseDays, true);
    assert.deepEqual(view.link, { label: "Entrenar ahora · Día 1", href: day(1).href });
  });

  it("entreno hecho: próximo con día de semana si hay calendario", () => {
    const withSchedule = buildHeroView({
      kind: "done_today",
      weekdayLabel: "Miércoles",
      next: { day: day(3, ["Piernas"]), when: "viernes" },
      missed: null,
    });
    assert.equal(text(withSchedule.line), "Próximo: viernes · Día 3 · Piernas");
    const legacy = buildHeroView({
      kind: "done_today",
      weekdayLabel: "Miércoles",
      next: { day: day(3, ["Piernas"]), when: null },
      missed: null,
    });
    assert.equal(text(legacy.line), "Próximo: Día 3 · Piernas");
  });

  it("los otros días de la semana nunca llevan el CTA emerald", () => {
    const views = [
      buildHeroView({ kind: "planned", weekdayLabel: "Lunes", day: day(1), missed: true }),
      buildHeroView({ kind: "planned", weekdayLabel: "Viernes", day: day(3), missed: false }),
      buildHeroView({ kind: "planned_done", weekdayLabel: "Lunes", day: day(1), doneOn: "martes" }),
      buildHeroView({ kind: "day_off", weekdayLabel: "Jueves" }),
    ];
    assert.ok(views.every((view) => view.primary === null && !view.chooseDays));
    assert.equal(views[0].chip.text, "Lunes · Te quedó");
    assert.deepEqual(views[1].secondary, { label: "Hacerlo hoy", href: day(3).href });
    assert.equal(text(views[2].line), "Lo hiciste el martes.");
    assert.equal(title(views[3]), "Día libre");
  });

  it("sin grupos el título es el nombre del día", () => {
    const view = buildHeroView({ kind: "ready", weekdayLabel: "Lunes", day: day(1, []) });
    assert.equal(title(view), "Día 1");
  });
});

describe("buildHomeHeroInputs", () => {
  const WEDNESDAY = "2026-09-23";
  const days = [day(1, ["Pecho", "Tríceps"]), day(2), day(3, ["Piernas"])];
  const inputs = (overrides = {}) => {
    const completedDayIds = overrides.completedDayIds ?? [];
    const todayKey = overrides.todayKey ?? WEDNESDAY;
    return buildHomeHeroInputs({
      state: "ready",
      todayKey,
      hasSavedRoutines: true,
      routineName: "Push Pull Legs",
      days,
      openDay: null,
      nextPendingId: days.find((item) => !completedDayIds.includes(item.id))?.id ?? null,
      plan: planWeek({ weekdays: [1, 3, 5], days: days.map(({ id, order }) => ({ id, dayOrder: order })), completedDayIds, todayKey }),
      completedDayDates: {},
      ...overrides,
    });
  };

  it("día de entreno: hoy toca el día fijo aunque haya quedado uno atrás", () => {
    const { today, previews } = inputs();
    assert.equal(today.kind, "ready");
    assert.equal(today.day.id, "d2");
    assert.equal(previews["2026-09-21"].kind, "planned");
    assert.equal(previews["2026-09-21"].missed, true);
    assert.equal(previews["2026-09-25"].kind, "planned");
    assert.equal(previews["2026-09-25"].missed, false);
    assert.equal(previews["2026-09-24"].kind, "day_off");
    assert.equal(previews[WEDNESDAY], undefined, "hoy no es una vista previa");
  });

  it("descanso con el lunes pendiente: avisa ese día y el próximo es mañana", () => {
    const { today } = inputs({ state: "rest", todayKey: "2026-09-22" });
    assert.equal(today.kind, "rest");
    assert.equal(today.missed.id, "d1");
    assert.deepEqual([today.next.day.id, today.next.when], ["d2", "mañana"]);
  });

  it("hecho en otro día: el día planeado lo muestra hecho y el día libre también", () => {
    const { previews } = inputs({
      completedDayIds: ["d1"],
      completedDayDates: { d1: "2026-09-22" },
    });
    assert.deepEqual([previews["2026-09-21"].kind, previews["2026-09-21"].doneOn], ["planned_done", "martes"]);
    assert.deepEqual([previews["2026-09-22"].kind, previews["2026-09-22"].day.id], ["planned_done", "d1"]);
  });

  it("sin días elegidos: sin vistas de otros días y el próximo sin día de semana", () => {
    const { today, previews } = inputs({ state: "done_today", plan: null, nextPendingId: "d2" });
    assert.deepEqual(previews, {});
    assert.deepEqual([today.next.day.id, today.next.when], ["d2", null]);
  });

  it("rutina sin días elegidos: pide elegir y deja entrenar el primer pendiente", () => {
    const { today } = inputs({ state: "needs_schedule", plan: null });
    assert.deepEqual([today.kind, today.dayCount, today.startDay.id], ["needs_schedule", 3, "d1"]);
  });
});
