import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ageFactor,
  bestStrengthRecord,
  betterRecord,
  formatStrengthRecord,
  MEASUREMENT_EXERCISES,
  normalizeExerciseName,
  resolveMuscleStrength,
  resolveStrengthLevel,
  STRENGTH_GROUPS,
  strengthThresholds,
} from "../../app/lib/strength-standards.ts";
import { STRENGTH_STANDARD_TABLES } from "../../app/lib/strength-standards-data.ts";

const man80 = { sex: "male", bodyweightKg: 80, age: 30 };
const set = (kg, reps, done = true) => ({ kg, reps, secs: null, done });
const approx = (actual, expected) =>
  assert.deepEqual(
    actual.map((value) => Math.round(value * 100) / 100),
    expected.map((value) => Math.round(value * 100) / 100),
  );

describe("tablas de StrengthLevel", () => {
  it("cada tabla crece por nivel y por peso corporal ordenado", () => {
    for (const [key, table] of Object.entries(STRENGTH_STANDARD_TABLES)) {
      for (const [sex, rows] of Object.entries(table)) {
        assert.equal(rows.length, sex === "male" ? 19 : 17, `${key} ${sex}`);
        rows.forEach((row, index) => {
          for (let column = 2; column < 6; column += 1) {
            assert.ok(row[column] >= row[column - 1], `${key} ${sex} ${row[0]} kg`);
          }
          if (index > 0) assert.equal(row[0] - rows[index - 1][0], 5, `${key} ${sex}`);
        });
      }
    }
  });

  it("todo ejercicio de medición apunta a una tabla y hay uno por grupo como mínimo", () => {
    for (const group of STRENGTH_GROUPS) {
      assert.ok(MEASUREMENT_EXERCISES[group].length > 0, group);
      for (const exercise of MEASUREMENT_EXERCISES[group]) {
        assert.ok(STRENGTH_STANDARD_TABLES[exercise.standard], exercise.name);
      }
    }
  });
});

describe("strengthThresholds", () => {
  it("en una fila exacta devuelve la fila de la tabla", () => {
    approx(strengthThresholds("bench-press", man80), [56, 75, 98, 124, 151]);
    approx(strengthThresholds("squat", { sex: "female", bodyweightKg: 60, age: 30 }), [32, 49, 72, 99, 129]);
  });

  it("interpola entre filas de peso corporal", () => {
    approx(strengthThresholds("bench-press", { ...man80, bodyweightKg: 82.5 }), [58, 77.5, 101, 127, 154.5]);
  });

  it("fuera de la tabla usa la fila del extremo", () => {
    approx(strengthThresholds("bench-press", { ...man80, bodyweightKg: 45 }), [27, 41, 58, 78, 101]);
    approx(strengthThresholds("bench-press", { ...man80, bodyweightKg: 160 }), [104, 129, 158, 191, 225]);
    approx(strengthThresholds("bench-press", { sex: "female", bodyweightKg: 130, age: 30 }), [39, 56, 77, 102, 128]);
  });

  it("aplica el factor de edad", () => {
    approx(strengthThresholds("bench-press", { ...man80, age: 60 }), [56, 75, 98, 124, 151].map((v) => v * 0.746));
  });
});

describe("ageFactor", () => {
  it("vale 1 hasta los 40 en levantamientos y hasta los 50 en la plancha", () => {
    assert.equal(ageFactor("bench-press", 18), 1);
    assert.equal(ageFactor("bench-press", 40), 1);
    assert.equal(ageFactor("plank", 50), 1);
    assert.ok(ageFactor("bench-press", 50) < 0.9);
  });

  it("interpola entre puntos y se aplana al final", () => {
    assert.equal(Math.round(ageFactor("bench-press", 62.5) * 1000) / 1000, 0.711);
    assert.equal(ageFactor("plank", 60), 0.85);
    assert.equal(ageFactor("bench-press", 95), 0.393);
  });
});

describe("resolveStrengthLevel", () => {
  const cuts = [56, 75, 98, 124, 151];

  it("por debajo del primer corte es Principiante 1", () => {
    assert.deepEqual(resolveStrengthLevel(10, cuts), { level: "principiante", division: 1 });
  });

  it("parte cada nivel en tercios del tramo hasta el siguiente", () => {
    // Novato: 75 → 98, tercios en 82,67 y 90,33.
    assert.deepEqual(resolveStrengthLevel(75, cuts), { level: "novato", division: 1 });
    assert.deepEqual(resolveStrengthLevel(82.66, cuts), { level: "novato", division: 1 });
    assert.deepEqual(resolveStrengthLevel(82.67, cuts), { level: "novato", division: 2 });
    assert.deepEqual(resolveStrengthLevel(90.34, cuts), { level: "novato", division: 3 });
    assert.deepEqual(resolveStrengthLevel(97.9, cuts), { level: "novato", division: 3 });
  });

  it("Élite no tiene divisiones", () => {
    assert.deepEqual(resolveStrengthLevel(151, cuts), { level: "elite", division: null });
    assert.deepEqual(resolveStrengthLevel(300, cuts), { level: "elite", division: null });
    assert.deepEqual(resolveStrengthLevel(150.9, cuts), { level: "avanzado", division: 3 });
  });
});

describe("bestStrengthRecord", () => {
  it("series con peso: mejor 1RM estimado, ignorando las no hechas", () => {
    assert.deepEqual(bestStrengthRecord("reps", [set(80, 8), set(100, 5, false), set(85, 5)]), {
      unit: "kg",
      value: 101.3,
      kg: 80,
      reps: 8,
    });
  });

  it("series por tiempo: el mejor tiempo hecho", () => {
    const sets = [
      { kg: null, reps: null, secs: 45, done: true },
      { kg: null, reps: null, secs: 90, done: false },
      { kg: null, reps: null, secs: 60, done: true },
    ];
    assert.deepEqual(bestStrengthRecord("time", sets), { unit: "s", value: 60 });
  });

  it("sin series válidas o de peso corporal no hay marca", () => {
    assert.equal(bestStrengthRecord("reps", [set(80, 8, false)]), null);
    assert.equal(bestStrengthRecord("bodyweight", [set(null, 12)]), null);
    assert.equal(bestStrengthRecord("time", []), null);
  });

  it("betterRecord se queda con la mayor", () => {
    const low = { unit: "kg", value: 90, kg: 80, reps: 4 };
    const high = { unit: "kg", value: 101.3, kg: 80, reps: 8 };
    assert.equal(betterRecord(undefined, low), low);
    assert.equal(betterRecord(low, high), high);
    assert.equal(betterRecord(high, low), high);
  });
});

describe("resolveMuscleStrength", () => {
  const key = normalizeExerciseName;
  const kg = (value) => ({ unit: "kg", value, kg: value, reps: 1 });
  const summaryOf = (group, records, active) =>
    resolveMuscleStrength({
      records: new Map(Object.entries(records).map(([name, record]) => [key(name), record])),
      activeExerciseNames: new Set(active.map(key)),
      profile: man80,
    }).find((summary) => summary.muscleGroup === group);

  it("manda el ejercicio de mayor prioridad, sin promedios", () => {
    const summary = summaryOf(
      "Pecho",
      { "Press banca plano": kg(60), "Press en maquina pecho": kg(150) },
      ["Press banca plano", "Press en maquina pecho"],
    );
    assert.equal(summary.exerciseName, "Press banca plano");
    assert.equal(summary.level, "principiante");
  });

  it("un ejercicio fuera de la rutina activa no cuenta", () => {
    const summary = summaryOf(
      "Pecho",
      { "Press banca plano": kg(140), "Press en maquina pecho": kg(89) },
      ["Press en maquina pecho"],
    );
    assert.equal(summary.exerciseName, "Press en maquina pecho");
    assert.deepEqual([summary.level, summary.division], ["intermedio", 1]);
  });

  it("sin registro de ningún ejercicio de la lista queda sin datos", () => {
    const summary = summaryOf("Pecho", { "Aperturas con mancuernas": kg(40) }, [
      "Aperturas con mancuernas",
      "Press en maquina pecho",
      "Press banca plano",
    ]);
    assert.deepEqual(summary, {
      muscleGroup: "Pecho",
      candidates: ["Press banca plano", "Press en maquina pecho"],
      exerciseName: null,
      record: null,
      doubled: false,
      level: null,
      division: null,
    });
  });

  it("el unilateral cuenta doble contra la tabla bilateral y conserva la marca real", () => {
    const record = { unit: "kg", value: 40, kg: 30, reps: 10 };
    const summary = summaryOf(
      "Triceps",
      { "Extensión de tríceps en polea unilateral": record },
      ["Extension de triceps en polea unilateral"],
    );
    // 40 × 2 = 80 = corte de Avanzado de la extensión en polea (hombre de 80 kg).
    assert.deepEqual([summary.level, summary.division, summary.doubled], ["avanzado", 1, true]);
    assert.equal(summary.record, record);
  });

  it("la plancha se mide en segundos con su tabla", () => {
    const summary = summaryOf("Core", { "Plancha frontal": { unit: "s", value: 76 } }, ["Plancha frontal"]);
    assert.deepEqual([summary.level, summary.division], ["intermedio", 1]);
  });

  it("formatStrengthRecord arma la marca corta y la completa", () => {
    assert.deepEqual(formatStrengthRecord({ unit: "kg", value: 101.3, kg: 82.5, reps: 8 }), {
      short: "82,5 kg",
      full: "82,5 kg × 8",
    });
    assert.deepEqual(formatStrengthRecord({ unit: "s", value: 75 }), { short: "75 s", full: "75 s" });
  });

  it("devuelve los 9 grupos en orden", () => {
    const all = resolveMuscleStrength({ records: new Map(), activeExerciseNames: new Set(), profile: man80 });
    assert.deepEqual(
      all.map((summary) => summary.muscleGroup),
      ["Pecho", "Espalda", "Cuadriceps", "Isquios", "Gluteos", "Hombros", "Biceps", "Triceps", "Core"],
    );
  });
});
