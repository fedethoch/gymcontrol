import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildDayMealRows, insertAfter, moveInOrder, suggestAfterMealId } from "../../app/lib/meal-order.ts";

const meal = (id, type) => ({ id, type });
const shape = (rows) => rows.map((row) => (row.kind === "meal" ? row.meal.id : `(${row.type})`));

describe("insertAfter", () => {
  it("inserta después de la comida indicada", () => {
    assert.deepEqual(insertAfter(["a", "b", "c"], "x", "a"), ["a", "x", "b", "c"]);
  });

  it("null = al principio", () => {
    assert.deepEqual(insertAfter(["a", "b"], "x", null), ["x", "a", "b"]);
  });

  it("afterId inexistente = al final", () => {
    assert.deepEqual(insertAfter(["a", "b"], "x", "zzz"), ["a", "b", "x"]);
  });

  it("no duplica si el id ya estaba", () => {
    assert.deepEqual(insertAfter(["a", "x", "b"], "x", "b"), ["a", "b", "x"]);
  });
});

describe("moveInOrder", () => {
  it("sube y baja intercambiando con el vecino", () => {
    assert.deepEqual(moveInOrder(["a", "b", "c"], "c", "up"), ["a", "c", "b"]);
    assert.deepEqual(moveInOrder(["a", "b", "c"], "a", "down"), ["b", "a", "c"]);
  });

  it("en los extremos no cambia", () => {
    assert.deepEqual(moveInOrder(["a", "b"], "a", "up"), ["a", "b"]);
    assert.deepEqual(moveInOrder(["a", "b"], "b", "down"), ["a", "b"]);
  });
});

describe("suggestAfterMealId", () => {
  const meals = [meal("d", "desayuno"), meal("s", "snack"), meal("c", "cena")];

  it("ubica antes de la primera comida de un tipo posterior", () => {
    assert.equal(suggestAfterMealId(meals, "almuerzo"), "s");
  });

  it("null cuando va antes de todo", () => {
    assert.equal(suggestAfterMealId([meal("c", "cena")], "desayuno"), null);
  });

  it("undefined (al final) para snacks o si no hay posteriores", () => {
    assert.equal(suggestAfterMealId(meals, "snack"), undefined);
    assert.equal(suggestAfterMealId([meal("d", "desayuno")], "cena"), undefined);
  });
});

describe("buildDayMealRows", () => {
  it("sin comidas muestra los 4 tipos vacíos en orden", () => {
    assert.deepEqual(shape(buildDayMealRows([])), ["(desayuno)", "(almuerzo)", "(merienda)", "(cena)"]);
  });

  it("un snack entre desayuno y almuerzo queda en su lugar", () => {
    const rows = buildDayMealRows([meal("d", "desayuno"), meal("s", "snack"), meal("a", "almuerzo")]);
    assert.deepEqual(shape(rows), ["d", "s", "a", "(merienda)", "(cena)"]);
  });

  it("los vacíos se ubican antes de la primera comida posterior", () => {
    const rows = buildDayMealRows([meal("d", "desayuno"), meal("s", "snack"), meal("c", "cena")]);
    assert.deepEqual(shape(rows), ["d", "s", "(almuerzo)", "(merienda)", "c"]);
  });

  it("respeta el orden manual aunque no sea el habitual y muestra cada comida", () => {
    const rows = buildDayMealRows([meal("a", "almuerzo"), meal("d", "desayuno"), meal("s1", "snack"), meal("s2", "snack")]);
    assert.deepEqual(shape(rows), ["a", "d", "s1", "s2", "(merienda)", "(cena)"]);
  });
});
