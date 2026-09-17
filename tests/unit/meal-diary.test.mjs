import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { insertAfter } from "../../app/lib/meal-order.ts";
import {
  SUMMARY_KEY,
  buildDiaryDay,
  buildWeekStrip,
  calculateStreak,
  findAddedItem,
  findCreatedMeal,
  formatDayHeader,
  formatDayReference,
  formatEmptyMeta,
  formatMealFoods,
  formatMealMeta,
  formatWeekRange,
  resolveAfterMealId,
  resolveBudget,
  resolveInitialDiary,
  resolvePanelSelection,
  resolveTargetMeal,
  resolveTypeChange,
  resolveUndo,
  sumDay,
  targetKey,
  targetLabel,
  targetMealType,
  titleScale,
  withCurrentDay,
} from "../../app/lib/meal-diary.ts";

const LABELS = { desayuno: "Desayuno", almuerzo: "Almuerzo", merienda: "Merienda", cena: "Cena", snack: "Snack" };
const item = (id, overrides = {}) => ({ id, name: `Alimento ${id}`, kind: "food", foodId: `f-${id}`, recipeId: null, kcal: 100, ...overrides });
const meal = (id, type, items = [item(`${id}-1`)], overrides = {}) => ({
  id,
  name: LABELS[type],
  type,
  kcal: items.reduce((total, current) => total + current.kcal, 0),
  macros: { proteinG: 10, carbsG: 20, fatG: 5 },
  items,
  ...overrides,
});
const shape = (day) => day.tabs.map((tab) => `${tab.key}:${tab.status}`);
const typeOf = (day) => (key) => day.tabs.find((tab) => tab.key === key)?.type ?? null;

describe("buildDiaryDay", () => {
  it("día vacío: desayuno sigue y el resto está pendiente", () => {
    const day = buildDiaryDay([]);
    assert.deepEqual(shape(day), [
      "empty-desayuno:next",
      "empty-almuerzo:pending",
      "empty-merienda:pending",
      "empty-cena:pending",
    ]);
    assert.equal(day.nextKey, "empty-desayuno");
    assert.equal(day.closed, false);
    assert.deepEqual(day.panelKeys, day.tabs.map((tab) => tab.key));
  });

  it("con el desayuno registrado sigue el almuerzo", () => {
    const day = buildDiaryDay([meal("d", "desayuno")]);
    assert.deepEqual(shape(day).slice(0, 2), ["d:logged", "empty-almuerzo:next"]);
    assert.equal(day.tabs[0].kcal, 100);
    assert.equal(day.tabs[1].kcal, null);
  });

  it("con las cuatro comidas registradas el día se cierra y el resumen va primero", () => {
    const day = buildDiaryDay([meal("d", "desayuno"), meal("a", "almuerzo"), meal("m", "merienda"), meal("c", "cena")]);
    assert.equal(day.closed, true);
    assert.equal(day.nextKey, null);
    assert.deepEqual(day.panelKeys, [SUMMARY_KEY, "d", "a", "m", "c"]);
  });

  it("un snack vacío no reabre el día", () => {
    const day = buildDiaryDay([
      meal("d", "desayuno"),
      meal("a", "almuerzo"),
      meal("m", "merienda"),
      meal("c", "cena"),
      meal("s", "snack", []),
    ]);
    assert.equal(day.closed, true);
    assert.equal(day.tabs.at(-1).status, "empty");
  });

  it("una comida del día sin alimentos queda pendiente", () => {
    const day = buildDiaryDay([meal("d", "desayuno"), meal("a", "almuerzo", [])]);
    assert.deepEqual(shape(day).slice(0, 3), ["d:logged", "a:next", "empty-merienda:pending"]);
  });

  it("de dos almuerzos, el vacío es el pendiente", () => {
    const day = buildDiaryDay([meal("d", "desayuno"), meal("a1", "almuerzo"), meal("a2", "almuerzo", [])]);
    assert.equal(day.nextKey, "a2");
  });

  it("respeta el orden manual: con solo la cena, sigue el desayuno", () => {
    const day = buildDiaryDay([meal("c", "cena")]);
    assert.equal(day.nextKey, "empty-desayuno");
    assert.deepEqual(day.tabs.map((tab) => tab.key), ["empty-desayuno", "empty-almuerzo", "empty-merienda", "c"]);
  });

  it("los nombres repetidos se numeran", () => {
    const day = buildDiaryDay([meal("a1", "almuerzo"), meal("a2", "almuerzo")]);
    assert.deepEqual(
      day.tabs.filter((tab) => tab.type === "almuerzo").map((tab) => tab.label),
      ["Almuerzo", "Almuerzo 2"],
    );
  });
});

describe("resolveBudget", () => {
  const target = { kcal: 2000, macros: { proteinG: 150, carbsG: 200, fatG: 60 } };
  const consumed = (kcal, macros = { proteinG: 0, carbsG: 0, fatG: 0 }) => ({ kcal, macros });

  it("sin objetivo pide configurarlo", () => {
    const budget = resolveBudget(null, consumed(1300));
    assert.equal(budget.state, "no_profile");
    assert.equal(budget.consumedKcal, 1300);
    assert.equal(budget.macros, null);
  });

  it("debajo, en objetivo (hasta 5% abajo) y por encima", () => {
    assert.equal(resolveBudget(target, consumed(0)).state, "under");
    assert.equal(resolveBudget(target, consumed(1899)).state, "under");
    assert.equal(resolveBudget(target, consumed(1900)).state, "on_target");
    assert.equal(resolveBudget(target, consumed(2000)).state, "on_target");
    const over = resolveBudget(target, consumed(2180));
    assert.equal(over.state, "over");
    assert.equal(over.remainingKcal, -180);
    assert.equal(over.progress, 1);
  });

  it("macros con lo que falta y lo que sobra", () => {
    const budget = resolveBudget(target, consumed(1000, { proteinG: 187, carbsG: 50, fatG: 59.6 }));
    const [protein, carbs, fat] = budget.macros;
    assert.deepEqual(protein, { key: "protein", consumed: 187, target: 150, remaining: -37, over: true, progress: 1 });
    assert.equal(carbs.remaining, 150);
    assert.equal(carbs.progress, 0.25);
    assert.equal(fat.remaining, 0);
    assert.equal(fat.over, false);
  });

  it("suma el día", () => {
    assert.deepEqual(sumDay([meal("d", "desayuno"), meal("a", "almuerzo")]), {
      kcal: 200,
      macros: { proteinG: 20, carbsG: 40, fatG: 10 },
    });
  });
});

describe("resolveAfterMealId", () => {
  it("sin comidas va al final (sin reordenar)", () => {
    assert.equal(resolveAfterMealId([], "almuerzo"), undefined);
  });

  it("antes que todas: al principio", () => {
    assert.equal(resolveAfterMealId([meal("c", "cena")], "desayuno"), null);
  });

  it("snack: después de la última", () => {
    assert.equal(resolveAfterMealId([meal("d", "desayuno"), meal("a", "almuerzo")], "snack"), "a");
  });

  const cases = [
    [["desayuno", "cena"], "merienda"],
    [["desayuno", "snack", "cena"], "almuerzo"],
    [["almuerzo", "desayuno"], "merienda"],
    [["cena", "desayuno"], "almuerzo"],
    [["cena"], "desayuno"],
    [["merienda"], "cena"],
  ];

  for (const [types, added] of cases) {
    it(`la comida creada ocupa el lugar vacío (${types.join(",")} + ${added})`, () => {
      const meals = types.map((type, index) => meal(`m${index}`, type));
      const before = buildDiaryDay(meals);
      const slotIndex = before.tabs.findIndex((tab) => tab.key === `empty-${added}`);
      const afterId = resolveAfterMealId(meals, added);
      const ids = meals.map((current) => current.id);
      const order = afterId === undefined ? [...ids, "nuevo"] : insertAfter(ids, "nuevo", afterId);
      const byId = new Map([...meals.map((current) => [current.id, current]), ["nuevo", meal("nuevo", added)]]);
      const after = buildDiaryDay(order.map((id) => byId.get(id)));
      assert.equal(after.tabs.findIndex((tab) => tab.key === "nuevo"), slotIndex);
    });
  }
});

describe("destinos de agregado", () => {
  const meals = [meal("d", "desayuno"), meal("m", "merienda")];

  it("claves estables", () => {
    assert.equal(targetKey({ kind: "meal", mealId: "d" }), "meal:d");
    assert.equal(targetKey({ kind: "slot", type: "cena" }), "slot:cena");
    assert.equal(targetKey({ kind: "new", token: "t1", name: "Postre", type: "snack" }), "new:t1");
  });

  it("un lugar vacío apunta a la comida que creó", () => {
    const created = new Map([["slot:merienda", "m"]]);
    assert.equal(resolveTargetMeal({ kind: "slot", type: "merienda" }, meals, created)?.id, "m");
    assert.equal(resolveTargetMeal({ kind: "slot", type: "cena" }, meals, created), null);
    assert.equal(resolveTargetMeal({ kind: "meal", mealId: "x" }, meals, created), null);
  });

  it("nombre del destino", () => {
    const created = new Map();
    assert.equal(targetLabel({ kind: "meal", mealId: "d" }, meals, created), "Desayuno");
    assert.equal(targetLabel({ kind: "slot", type: "cena" }, meals, created), "Cena");
    assert.equal(targetLabel({ kind: "new", token: "t", name: "Postre", type: "snack" }, meals, created), "Postre");
  });

  it("tipo del destino", () => {
    assert.equal(targetMealType({ kind: "meal", mealId: "m" }, meals), "merienda");
    assert.equal(targetMealType({ kind: "slot", type: "cena" }, meals), "cena");
    assert.equal(targetMealType({ kind: "new", token: "t", name: "Postre", type: "snack" }, meals), "snack");
    assert.equal(targetMealType({ kind: "meal", mealId: "x" }, meals), "snack");
  });
});

describe("resolveInitialDiary", () => {
  const meals = [meal("d", "desayuno"), meal("a1", "almuerzo"), meal("a2", "almuerzo")];

  it("sin enlace abre la comida que sigue", () => {
    assert.deepEqual(resolveInitialDiary(meals, {}), { selectedKey: "empty-merienda", addTarget: null });
  });

  it("sin enlace y con el día cerrado abre el resumen", () => {
    const closed = [meal("d", "desayuno"), meal("a", "almuerzo"), meal("m", "merienda"), meal("c", "cena")];
    assert.equal(resolveInitialDiary(closed, {}).selectedKey, SUMMARY_KEY);
  });

  it("?comida= abre esa comida para agregar", () => {
    assert.deepEqual(resolveInitialDiary(meals, { mealId: "d" }), {
      selectedKey: "d",
      addTarget: { kind: "meal", mealId: "d" },
    });
  });

  it("?comida= que no existe se ignora", () => {
    assert.deepEqual(resolveInitialDiary(meals, { mealId: "zzz" }), { selectedKey: "empty-merienda", addTarget: null });
  });

  it("?tipo= con dos comidas de ese tipo elige la última", () => {
    assert.deepEqual(resolveInitialDiary(meals, { mealType: "almuerzo" }).addTarget, { kind: "meal", mealId: "a2" });
  });

  it("?tipo= sin comida de ese tipo abre su lugar vacío", () => {
    assert.deepEqual(resolveInitialDiary(meals, { mealType: "cena" }), {
      selectedKey: "empty-cena",
      addTarget: { kind: "slot", type: "cena" },
    });
  });

  it("?alimento= va a la comida que sigue", () => {
    const food = { foodId: "f1", measure: "g", quantity: 100 };
    assert.deepEqual(resolveInitialDiary(meals, { food }), {
      selectedKey: "empty-merienda",
      addTarget: { kind: "slot", type: "merienda" },
    });
    const withEmptyMeal = [meal("d", "desayuno"), meal("a", "almuerzo", [])];
    assert.deepEqual(resolveInitialDiary(withEmptyMeal, { food }).addTarget, { kind: "meal", mealId: "a" });
  });

  it("?alimento= con el día cerrado va a un snack nuevo", () => {
    const closed = [meal("d", "desayuno"), meal("a", "almuerzo"), meal("m", "merienda"), meal("c", "cena")];
    const initial = resolveInitialDiary(closed, { food: { foodId: "f1", measure: "unit", quantity: 1 } });
    assert.equal(initial.selectedKey, SUMMARY_KEY);
    assert.equal(initial.addTarget.kind, "new");
    assert.equal(initial.addTarget.type, "snack");
  });

  it("?receta= va a la comida que sigue y, con ?tipo=, a esa comida", () => {
    const recipe = { recipeId: "r1", measure: "unit", quantity: 1.5 };
    assert.deepEqual(resolveInitialDiary(meals, { recipe }), {
      selectedKey: "empty-merienda",
      addTarget: { kind: "slot", type: "merienda" },
    });
    assert.deepEqual(resolveInitialDiary(meals, { recipe, mealType: "cena" }), {
      selectedKey: "empty-cena",
      addTarget: { kind: "slot", type: "cena" },
    });
    assert.deepEqual(resolveInitialDiary(meals, { recipe, mealType: "almuerzo" }).addTarget, { kind: "meal", mealId: "a2" });
  });

  it("?tipo=snack sin snack crea una comida nueva", () => {
    const initial = resolveInitialDiary(meals, { mealType: "snack" });
    assert.equal(initial.selectedKey, "empty-merienda");
    assert.equal(initial.addTarget.kind, "new");
    assert.equal(initial.addTarget.name, "Snack");
    assert.equal(initial.addTarget.type, "snack");
  });
});

describe("resolvePanelSelection", () => {
  it("si la pestaña sigue, se queda (aunque cambie su lugar)", () => {
    const day = buildDiaryDay([meal("d", "desayuno"), meal("a", "almuerzo"), meal("m", "merienda"), meal("c", "cena")]);
    const next = resolvePanelSelection(day.panelKeys, { key: "a", type: "almuerzo", index: 1 }, {
      nextKey: day.nextKey,
      typeOfKey: typeOf(day),
    });
    assert.deepEqual(next, { key: "a", type: "almuerzo", index: 2 });
  });

  it("si se borra la comida, va a su lugar vacío", () => {
    const day = buildDiaryDay([meal("d", "desayuno")]);
    const next = resolvePanelSelection(day.panelKeys, { key: "a", type: "almuerzo", index: 1 }, {
      nextKey: day.nextKey,
      typeOfKey: typeOf(day),
    });
    assert.equal(next.key, "empty-almuerzo");
  });

  it("si queda otra comida del mismo tipo, va al índice más cercano", () => {
    const day = buildDiaryDay([meal("d", "desayuno"), meal("a1", "almuerzo")]);
    const next = resolvePanelSelection(day.panelKeys, { key: "a2", type: "almuerzo", index: 2 }, {
      nextKey: day.nextKey,
      typeOfKey: typeOf(day),
    });
    assert.equal(next.key, day.panelKeys[2]);
  });

  it("al crear la comida de un lugar vacío queda en la comida nueva", () => {
    const day = buildDiaryDay([meal("d", "desayuno"), meal("nuevo", "almuerzo")]);
    const next = resolvePanelSelection(day.panelKeys, { key: "empty-almuerzo", type: "almuerzo", index: 1 }, {
      nextKey: day.nextKey,
      typeOfKey: typeOf(day),
    });
    assert.equal(next.key, "nuevo");
  });

  it("si el resumen desaparece, va a la comida que sigue", () => {
    const day = buildDiaryDay([meal("d", "desayuno"), meal("a", "almuerzo"), meal("m", "merienda")]);
    const next = resolvePanelSelection(day.panelKeys, { key: SUMMARY_KEY, type: null, index: 0 }, {
      nextKey: day.nextKey,
      typeOfKey: typeOf(day),
    });
    assert.equal(next.key, "empty-cena");
  });

  it("si la lista se achica, recorta al último panel", () => {
    const day = buildDiaryDay([]);
    const next = resolvePanelSelection(day.panelKeys, { key: "s", type: "snack", index: 9 }, {
      nextKey: day.nextKey,
      typeOfKey: typeOf(day),
    });
    assert.equal(next.key, "empty-cena");
  });
});

describe("resultado de un agregado y deshacer", () => {
  it("encuentra la comida creada", () => {
    const after = [meal("d", "desayuno"), meal("m", "merienda"), meal("x", "snack")];
    assert.equal(findCreatedMeal(new Set(["d"]), after, { name: "Merienda", type: "merienda" })?.id, "m");
    assert.equal(findCreatedMeal(new Set(["d", "m", "x"]), after, { name: "Merienda", type: "merienda" }), null);
  });

  it("encuentra el alimento agregado", () => {
    const after = meal("d", "desayuno", [item("1"), item("2", { foodId: "f-avena" }), item("3", { kind: "recipe", foodId: null, recipeId: "r-1" })]);
    assert.equal(findAddedItem(new Set(["1"]), after, { kind: "food", id: "f-avena" })?.id, "2");
    assert.equal(findAddedItem(new Set(["1", "2"]), after, { kind: "recipe", id: "r-1" })?.id, "3");
    assert.equal(findAddedItem(new Set(["1", "2", "3"]), after, { kind: "food", id: "f-avena" }), null);
    assert.equal(findAddedItem(new Set(), null, { kind: "food", id: "f" }), null);
  });

  it("borra la comida si la creó ese agregado y sigue sola", () => {
    const meals = [meal("m", "merienda", [item("1")])];
    assert.deepEqual(resolveUndo(meals, { mealId: "m", itemId: "1", createdMeal: true }), { kind: "delete-meal", mealId: "m" });
  });

  it("si después se sumaron más alimentos, borra solo el suyo", () => {
    const meals = [meal("m", "merienda", [item("1"), item("2")])];
    assert.deepEqual(resolveUndo(meals, { mealId: "m", itemId: "1", createdMeal: true }), { kind: "delete-item", itemId: "1" });
  });

  it("en una comida que ya existía borra el alimento", () => {
    const meals = [meal("d", "desayuno", [item("1")])];
    assert.deepEqual(resolveUndo(meals, { mealId: "d", itemId: "1", createdMeal: false }), { kind: "delete-item", itemId: "1" });
  });

  it("si ya no está, no hace nada", () => {
    const meals = [meal("d", "desayuno", [item("1")])];
    assert.equal(resolveUndo(meals, { mealId: "d", itemId: "9", createdMeal: false }), null);
    assert.equal(resolveUndo(meals, { mealId: "x", itemId: "1", createdMeal: true }), null);
  });

  it("el nombre sigue al tipo solo si era el nombre por defecto", () => {
    assert.deepEqual(resolveTypeChange({ name: "Almuerzo", type: "almuerzo" }, "cena"), { type: "cena", name: "Cena" });
    assert.deepEqual(resolveTypeChange({ name: "Post entreno", type: "snack" }, "merienda"), { type: "merienda" });
  });
});

describe("racha y semana", () => {
  it("cuenta días seguidos hasta hoy", () => {
    assert.equal(calculateStreak(new Set(["2026-09-16", "2026-09-15", "2026-09-13"]), "2026-09-16"), 2);
    assert.equal(calculateStreak(new Set(["2026-09-15"]), "2026-09-16"), 0);
  });

  it("actualiza el día que se está viendo", () => {
    assert.deepEqual([...withCurrentDay(["2026-09-15"], "2026-09-16", true)].sort(), ["2026-09-15", "2026-09-16"]);
    assert.deepEqual([...withCurrentDay(["2026-09-15", "2026-09-16"], "2026-09-16", false)], ["2026-09-15"]);
  });

  it("arma la semana con días futuros y viejos deshabilitados", () => {
    const strip = buildWeekStrip({
      weekStart: "2026-09-14",
      todayKey: "2026-09-16",
      minKey: "2025-09-16",
      selectedKey: "2026-09-16",
      logged: new Set(["2026-09-14"]),
    });
    assert.deepEqual(
      strip.days.map((day) => `${day.letter}${day.day}${day.logged ? "✓" : ""}${day.selected ? "*" : ""}${day.disabled ? "x" : ""}`),
      ["L14✓", "M15", "M16*", "J17x", "V18x", "S19x", "D20x"],
    );
    assert.equal(strip.days[2].today, true);
    assert.equal(strip.canPrev, true);
    assert.equal(strip.canNext, false);
  });

  it("no deja ir antes del límite", () => {
    const strip = buildWeekStrip({
      weekStart: "2025-09-15",
      todayKey: "2026-09-16",
      minKey: "2025-09-16",
      selectedKey: "2025-09-16",
      logged: new Set(),
    });
    assert.equal(strip.days[0].disabled, true);
    assert.equal(strip.days[1].disabled, false);
    assert.equal(strip.canPrev, false);
    assert.equal(strip.canNext, true);
  });
});

describe("textos", () => {
  it("encabezado del día", () => {
    assert.deepEqual(formatDayHeader("2026-09-16", "2026-09-16"), { title: "Hoy", caption: "mié 16" });
    assert.deepEqual(formatDayHeader("2026-09-15", "2026-09-16"), { title: "Ayer", caption: "mar 15" });
    assert.deepEqual(formatDayHeader("2026-09-14", "2026-09-16"), { title: "Lunes", caption: "14 sep" });
    assert.deepEqual(formatDayHeader("2025-11-20", "2026-09-16"), { title: "Jueves", caption: "20 nov 2025" });
  });

  it("referencia al día en una frase", () => {
    assert.equal(formatDayReference("2026-09-16", "2026-09-16"), "hoy");
    assert.equal(formatDayReference("2026-09-15", "2026-09-16"), "ayer");
    assert.equal(formatDayReference("2026-09-10", "2026-09-16"), "el jueves");
    assert.equal(formatDayReference("2026-09-01", "2026-09-16"), "el 1 de septiembre");
    assert.equal(formatDayReference("2025-11-20", "2026-09-16"), "el 20 de noviembre de 2025");
  });

  it("rango de una semana", () => {
    assert.equal(formatWeekRange("2026-09-14", "2026-09-16"), "14 – 20 sep");
    assert.equal(formatWeekRange("2026-09-28", "2026-09-16"), "28 sep – 4 oct");
    assert.equal(formatWeekRange("2025-09-15", "2026-09-16"), "15 – 21 sep 2025");
  });

  it("meta de una comida y de un lugar vacío", () => {
    assert.equal(formatMealMeta({ kcal: 779.6, macros: { proteinG: 52.4, carbsG: 75, fatG: 21.5 } }), "780 kcal · P 52 · C 75 · G 22");
    const base = { logDate: "2026-09-16", todayKey: "2026-09-16", consumedKcal: 1300, targetKcal: 2610 };
    assert.equal(formatEmptyMeta({ ...base, dayEmpty: true, consumedKcal: 0 }), "Tu primera comida del día.");
    assert.equal(formatEmptyMeta({ ...base, dayEmpty: false }), "Sin registrar · llevás 1300 de 2610 kcal");
    assert.equal(formatEmptyMeta({ ...base, dayEmpty: false, targetKcal: null }), "Sin registrar · llevás 1300 kcal");
    assert.equal(formatEmptyMeta({ ...base, logDate: "2026-09-14", dayEmpty: true, consumedKcal: 0 }), "Sin registros el lunes.");
    assert.equal(formatEmptyMeta({ ...base, logDate: "2026-09-14", dayEmpty: false }), "Sin registrar · ese día sumaste 1300 de 2610 kcal");
  });

  it("alimentos de una comida y tamaño del título", () => {
    assert.equal(formatMealFoods({ items: [] }), "Sin alimentos");
    assert.equal(formatMealFoods({ items: [{ name: "Avena" }, { name: "Banana" }] }), "Avena, Banana");
    assert.equal(formatMealFoods({ items: ["a", "b", "c", "d", "e"].map((name) => ({ name })) }), "a, b, c +2");
    assert.equal(titleScale("Merienda"), "xxl");
    assert.equal(titleScale("Post entreno"), "xl");
    assert.equal(titleScale("Colación de media tarde"), "l");
  });
});
