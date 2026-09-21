import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildPlaceholder,
  countDoneSets,
  currentPosition,
  currentSetIndex,
  describeSuggestion,
  exerciseFractions,
  formatCompactSet,
  nextPendingExercise,
  resolveDayState,
  sameWorkoutDayIds,
  sanitizeNumber,
  stepValue,
  timeFactor,
  toLoggedSet,
} from "../../app/lib/day-workout.ts";

const press = {
  routineItemId: "a",
  series: 3,
  target: "8-10",
  kind: "reps",
  equipment: "Barra",
};
const dominadas = {
  routineItemId: "b",
  series: 2,
  target: "6-8",
  kind: "bodyweight",
  equipment: "Peso corporal",
};
const plancha = {
  routineItemId: "c",
  series: 2,
  target: "30-45s",
  kind: "time",
  equipment: "Peso corporal",
};
const caminata = {
  routineItemId: "d",
  series: 1,
  target: "20-30m",
  kind: "time",
  equipment: "Peso corporal",
};

const empty = (count) => Array.from({ length: count }, () => ({ kg: "", reps: "", secs: "", done: false }));
const draft = (sets) => ({ itemId: null, sets, rev: 0 });
const set = (kg, reps) => ({ kg, reps, secs: "", done: true });

describe("toLoggedSet", () => {
  it("convierte kg con coma y reps enteras", () => {
    const logged = toLoggedSet({ kg: "42.5", reps: "8", secs: "", done: true }, press);
    assert.deepEqual(logged, { kg: 42.5, reps: 8, secs: null, done: true });
  });

  it("guarda el tiempo en segundos aunque el plan vaya en minutos", () => {
    assert.equal(timeFactor(plancha), 1);
    assert.equal(timeFactor(caminata), 60);
    assert.equal(toLoggedSet({ kg: "", reps: "", secs: "45", done: true }, plancha).secs, 45);
    assert.equal(toLoggedSet({ kg: "", reps: "", secs: "20", done: true }, caminata).secs, 1200);
  });

  it("descarta valores vacíos o en cero", () => {
    assert.equal(toLoggedSet({ kg: "0", reps: "", secs: "", done: true }, press).kg, null);
    assert.equal(toLoggedSet({ kg: "", reps: "", secs: "", done: true }, press).reps, null);
  });
});

describe("resolveDayState", () => {
  const drafts = { a: draft(empty(3)), b: draft(empty(2)) };

  it("es empty sin ejercicios", () => {
    assert.equal(resolveDayState({ exercises: [], drafts: {}, resting: false }), "empty");
  });

  it("es ready sin series cargadas y active con alguna", () => {
    assert.equal(resolveDayState({ exercises: [press, dominadas], drafts, resting: false }), "ready");

    const started = { ...drafts, a: draft([set("40", "10"), ...empty(2)]) };
    assert.equal(resolveDayState({ exercises: [press, dominadas], drafts: started, resting: false }), "active");
  });

  it("el descanso manda sobre active pero no sobre all_done", () => {
    const started = { ...drafts, a: draft([set("40", "10"), ...empty(2)]) };
    assert.equal(resolveDayState({ exercises: [press, dominadas], drafts: started, resting: true }), "resting");

    const done = {
      a: draft([set("40", "10"), set("40", "10"), set("40", "9")]),
      b: draft([set("", "8"), set("", "7")]),
    };
    assert.equal(resolveDayState({ exercises: [press, dominadas], drafts: done, resting: true }), "all_done");
  });

  it("una serie marcada sin datos no cuenta", () => {
    const marked = { ...drafts, a: draft([{ kg: "40", reps: "", secs: "", done: true }, ...empty(2)]) };
    assert.equal(countDoneSets([press, dominadas], marked), 0);
    assert.equal(resolveDayState({ exercises: [press, dominadas], drafts: marked, resting: false }), "ready");
  });
});

describe("posición y progreso", () => {
  const drafts = {
    a: draft([set("40", "10"), ...empty(2)]),
    b: draft(empty(2)),
  };

  it("apunta al primer ejercicio con series pendientes y a su primera serie libre", () => {
    assert.deepEqual(currentPosition([press, dominadas], drafts), { exerciseIndex: 0, setIndex: 1 });
  });

  it("con el ejercicio completo pasa al siguiente", () => {
    const full = { ...drafts, a: draft([set("40", "10"), set("40", "10"), set("40", "9")]) };
    assert.deepEqual(currentPosition([press, dominadas], full), { exerciseIndex: 1, setIndex: 0 });
    assert.equal(nextPendingExercise([press, dominadas], full, "a")?.routineItemId, "b");
  });

  it("sin nada pendiente se queda en la última serie del último ejercicio", () => {
    const done = {
      a: draft([set("40", "10"), set("40", "10"), set("40", "9")]),
      b: draft([set("", "8"), set("", "7")]),
    };
    assert.deepEqual(currentPosition([press, dominadas], done), { exerciseIndex: 1, setIndex: 1 });
    assert.equal(nextPendingExercise([press, dominadas], done, "a"), null);
    assert.equal(currentSetIndex(done.a, press), 2);
  });

  it("reparte una fracción por ejercicio", () => {
    assert.deepEqual(exerciseFractions([press, dominadas], drafts), [1 / 3, 0]);
  });
});

describe("stepValue", () => {
  it("usa el salto de carga del equipamiento y arranca del placeholder", () => {
    assert.equal(stepValue({ value: "", placeholder: "40", field: "kg", exercise: press, direction: 1 }), "42.5");
    assert.equal(
      stepValue({ value: "40", placeholder: "40", field: "kg", exercise: { ...press, equipment: "Mancuernas" }, direction: -1 }),
      "38",
    );
  });

  it("mueve las reps de a una y nunca baja de cero", () => {
    assert.equal(stepValue({ value: "10", placeholder: "", field: "reps", exercise: press, direction: 1 }), "11");
    assert.equal(stepValue({ value: "1", placeholder: "", field: "reps", exercise: press, direction: -1 }), "");
  });

  it("mueve el tiempo de a 5 segundos, o de a un minuto si el plan va en minutos", () => {
    assert.equal(stepValue({ value: "45", placeholder: "", field: "secs", exercise: plancha, direction: 1 }), "50");
    assert.equal(stepValue({ value: "20", placeholder: "", field: "secs", exercise: caminata, direction: 1 }), "21");
  });
});

describe("placeholders y formato", () => {
  it("sugiere el peso y las reps de hoy", () => {
    const placeholder = buildPlaceholder({
      exercise: press,
      suggestion: { kind: "increase_load", kg: 42.5, reps: 8 },
      target: { measure: "reps", min: 8, max: 10 },
      previousSet: null,
    });
    assert.deepEqual(placeholder, { kg: "42.5", reps: "8", secs: "", done: false });
  });

  it("sin sugerencia cae en la serie anterior y, si no hay, en el mínimo del objetivo", () => {
    const withPrevious = buildPlaceholder({
      exercise: press,
      suggestion: null,
      target: { measure: "reps", min: 8, max: 10 },
      previousSet: { kg: 40, reps: 9, secs: null, done: true },
    });
    assert.deepEqual(withPrevious, { kg: "40", reps: "9", secs: "", done: false });

    const firstTime = buildPlaceholder({
      exercise: press,
      suggestion: null,
      target: { measure: "reps", min: 8, max: 10 },
      previousSet: null,
    });
    assert.deepEqual(firstTime, { kg: "", reps: "8", secs: "", done: false });
  });

  it("muestra la serie anterior compacta según el tipo", () => {
    assert.equal(formatCompactSet({ kg: 40, reps: 10, secs: null, done: true }, "reps"), "40×10");
    assert.equal(formatCompactSet({ kg: 10, reps: 8, secs: null, done: true }, "bodyweight"), "+10×8");
    assert.equal(formatCompactSet({ kg: null, reps: null, secs: 45, done: true }, "time"), "45s");
  });

  it("sanea lo que se escribe", () => {
    assert.equal(sanitizeNumber("42,567", true), "42.56");
    assert.equal(sanitizeNumber("8a", false), "8");
  });

  it("sin historial en el día invita a apuntar al objetivo", () => {
    const text = describeSuggestion({
      suggestion: null,
      target: { measure: "reps", min: 8, max: 10 },
      exercise: press,
      hasHistory: false,
    });
    assert.equal(text, "Primera vez en este día: apuntá a 8-10 reps.");
  });
});

describe("marcas por día", () => {
  const row = (exerciseId, rowOrder, plan = {}) => ({
    exerciseId,
    rowOrder,
    series: 3,
    repetitions: "8-12",
    rir: "1",
    rest: "2-3m",
    ...plan,
  });
  // Semana día 1 · día 2 · día 1: el sábado repite el lunes; el miércoles comparte ejercicios pero es otro entreno.
  const lunes = { id: "lunes", items: [row("press", 1), row("jalon", 2), row("laterales", 3)] };
  const miercoles = { id: "miercoles", items: [row("remo", 1), row("press", 2), row("laterales", 3)] };
  const sabado = { id: "sabado", items: [row("press", 1), row("jalon", 2), row("laterales", 3)] };
  const days = [lunes, miercoles, sabado];

  it("un día repetido comparte las marcas con su copia exacta", () => {
    assert.deepEqual(sameWorkoutDayIds(days, lunes), ["lunes", "sabado"]);
    assert.deepEqual(sameWorkoutDayIds(days, sabado), ["lunes", "sabado"]);
  });

  it("otro día con los mismos ejercicios solo usa sus propias marcas", () => {
    assert.deepEqual(sameWorkoutDayIds(days, miercoles), ["miercoles"]);
  });

  it("no es copia si cambia el orden o el plan de alguna fila", () => {
    const reordenado = { id: "reordenado", items: [row("jalon", 1), row("press", 2), row("laterales", 3)] };
    const otroRango = { id: "otroRango", items: [row("press", 1), row("jalon", 2), row("laterales", 3, { repetitions: "12-15" })] };
    const otrasSeries = { id: "otrasSeries", items: [row("press", 1, { series: 4 }), row("jalon", 2), row("laterales", 3)] };
    const otroRir = { id: "otroRir", items: [row("press", 1), row("jalon", 2, { rir: "fallo" }), row("laterales", 3)] };
    const otroDescanso = { id: "otroDescanso", items: [row("press", 1), row("jalon", 2), row("laterales", 3, { rest: "90s" })] };

    assert.deepEqual(
      sameWorkoutDayIds([lunes, reordenado, otroRango, otrasSeries, otroRir, otroDescanso], lunes),
      ["lunes"],
    );
  });

  it("compara por orden de fila, no por cómo llegan las filas, e ignora espacios y mayúsculas del plan", () => {
    const mismoDesordenado = {
      id: "copia",
      items: [row("laterales", 3), row("press", 1, { repetitions: "8 - 12", rest: "2-3M" }), row("jalon", 2)],
    };
    assert.deepEqual(sameWorkoutDayIds([lunes, mismoDesordenado], lunes), ["lunes", "copia"]);
  });
});
