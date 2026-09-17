import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  bestSessionId,
  bestSetLabel,
  chartScale,
  compareLastSessions,
  formatMetric,
  formatShortDate,
  metricLabel,
  sessionMetric,
  splitMetric,
  splitPlanValue,
  trendPoints,
} from "../../app/lib/exercise-history.ts";

const set = (kg, reps, done = true) => ({ kg, reps, secs: null, done });
const timed = (secs, done = true) => ({ kg: null, reps: null, secs, done });

// El historial llega de la sesión más nueva a la más vieja.
const squat = [
  {
    sessionId: "s3",
    trainingDate: "2026-09-09",
    kind: "reps",
    target: "8-10",
    sets: [set(92.5, 9), set(92.5, 8), set(92.5, 8)],
    best: { kg: 92.5, reps: 9, e1rm: 120.3 },
  },
  {
    sessionId: "s2",
    trainingDate: "2026-09-02",
    kind: "reps",
    target: "8-10",
    sets: [set(90, 10), set(90, 9), set(90, 8), set(90, 12, false)],
    best: { kg: 90, reps: 10, e1rm: 120 },
  },
  {
    sessionId: "s1",
    trainingDate: "2026-07-22",
    kind: "reps",
    target: "8-10",
    sets: [set(80, 10), set(80, 9), set(80, 8)],
    best: { kg: 80, reps: 10, e1rm: 106.7 },
  },
];

describe("sessionMetric", () => {
  it("usa el 1RM estimado en ejercicios con peso", () => {
    assert.equal(sessionMetric(squat[0]), 120.3);
  });

  it("usa el máximo de reps en peso corporal y el máximo de segundos en tiempo", () => {
    assert.equal(
      sessionMetric({ ...squat[0], kind: "bodyweight", best: null, sets: [set(null, 8), set(10, 12), set(null, 20, false)] }),
      12,
    );
    assert.equal(sessionMetric({ ...squat[0], kind: "time", best: null, sets: [timed(45), timed(75)] }), 75);
  });

  it("devuelve null sin series válidas", () => {
    assert.equal(sessionMetric({ ...squat[0], kind: "bodyweight", best: null, sets: [set(null, 8, false)] }), null);
    assert.equal(sessionMetric({ ...squat[0], best: null }), null);
  });
});

describe("métrica", () => {
  it("nombra y formatea según el tipo", () => {
    assert.equal(metricLabel("reps"), "1RM estimado");
    assert.equal(metricLabel("bodyweight"), "Máximo de reps");
    assert.equal(metricLabel("time"), "Mejor tiempo");
    assert.deepEqual(splitMetric(120.3, "reps"), { value: "120.3", unit: "kg" });
    assert.deepEqual(splitMetric(12, "bodyweight"), { value: "12", unit: "reps" });
    assert.deepEqual(splitMetric(75, "time"), { value: "75", unit: "s" });
    assert.deepEqual(splitMetric(150, "time"), { value: "2:30", unit: "min" });
    assert.equal(formatMetric(120.3, "reps"), "120.3 kg");
  });
});

describe("trendPoints", () => {
  it("ordena de la más vieja a la más nueva y descarta sesiones sin métrica", () => {
    const points = trendPoints([...squat, { ...squat[2], sessionId: "s0", best: null }]);

    assert.deepEqual(
      points.map((point) => [point.sessionId, point.value]),
      [
        ["s1", 106.7],
        ["s2", 120],
        ["s3", 120.3],
      ],
    );
  });
});

describe("bestSessionId", () => {
  it("elige la sesión con la mejor marca", () => {
    assert.equal(bestSessionId(squat), "s3");
  });

  it("prefiere la más reciente si empatan y null sin métricas", () => {
    assert.equal(bestSessionId([{ ...squat[0], sessionId: "new", best: squat[1].best }, squat[1]]), "new");
    assert.equal(bestSessionId([{ ...squat[0], best: null }]), null);
  });
});

describe("compareLastSessions", () => {
  it("compara la última sesión con la anterior contando solo series hechas", () => {
    assert.deepEqual(compareLastSessions(squat), {
      date: "2026-09-09",
      previousDate: "2026-09-02",
      sets: { value: 3, previous: 3 },
      volume: { value: 25, previous: 27, unit: "reps" },
      best: { value: "92.5×9", previous: "90×10" },
    });
  });

  it("suma segundos en ejercicios de tiempo", () => {
    const plank = [
      { ...squat[0], kind: "time", best: null, sets: [timed(60), timed(75)] },
      { ...squat[1], kind: "time", best: null, sets: [timed(45), timed(50)] },
    ];

    assert.deepEqual(compareLastSessions(plank).volume, { value: 135, previous: 95, unit: "secs" });
    assert.deepEqual(compareLastSessions(plank).best, { value: "75 s", previous: "50 s" });
  });

  it("salta sesiones sin series válidas y devuelve null con menos de dos", () => {
    const withEmpty = [squat[0], { ...squat[1], sets: [set(90, 10, false)] }, squat[2]];

    assert.equal(compareLastSessions(withEmpty).previousDate, "2026-07-22");
    assert.equal(compareLastSessions([squat[0]]), null);
    assert.equal(compareLastSessions([]), null);
  });
});

describe("bestSetLabel", () => {
  it("muestra el lastre en peso corporal y las reps sin lastre", () => {
    const pullups = { ...squat[0], kind: "bodyweight", best: null };

    assert.equal(bestSetLabel({ ...pullups, sets: [set(10, 8), set(null, 12)] }), "12 reps");
    assert.equal(bestSetLabel({ ...pullups, sets: [set(10, 12), set(null, 8)] }), "+10×12");
    assert.equal(bestSetLabel({ ...pullups, sets: [] }), "—");
  });
});

describe("chartScale", () => {
  it("usa ticks redondos que cubren todos los valores", () => {
    assert.deepEqual(chartScale([106.7, 107.3, 113.3, 120.3]), { min: 105, max: 125, ticks: [105, 110, 115, 120, 125] });
    assert.deepEqual(chartScale([40, 45, 50, 60, 75]).ticks, [40, 50, 60, 70, 80]);
    assert.deepEqual(chartScale([7, 8, 12]).ticks, [6, 8, 10, 12]);
  });

  it("abre un rango cuando todos los valores son iguales", () => {
    const scale = chartScale([100, 100]);

    assert.ok(scale.min <= 100 && scale.max > 100);
    assert.ok(scale.ticks.length >= 2);
  });
});

describe("splitPlanValue", () => {
  it("separa número y unidad del plan", () => {
    assert.deepEqual(splitPlanValue("60-120s"), { value: "60–120", unit: "s" });
    assert.deepEqual(splitPlanValue("2-3m"), { value: "2–3", unit: "min" });
    assert.deepEqual(splitPlanValue("90s"), { value: "90", unit: "s" });
    assert.deepEqual(splitPlanValue("8-10"), { value: "8–10", unit: "" });
    assert.deepEqual(splitPlanValue("12 c/lado"), { value: "12", unit: "c/lado" });
    assert.deepEqual(splitPlanValue("1-2"), { value: "1–2", unit: "" });
    assert.deepEqual(splitPlanValue("fallo"), { value: "Fallo", unit: "" });
  });
});

describe("formatShortDate", () => {
  it("formatea día/mes", () => {
    assert.equal(formatShortDate("2026-09-09"), "09/09");
  });
});
