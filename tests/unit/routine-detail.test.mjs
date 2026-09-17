import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  averageMinutes,
  balanceFills,
  countSeries,
  equipmentList,
  formatReps,
  formatRest,
  resolveDetailState,
  titleWithoutDays,
  weeklySeriesByGroup,
} from "../../app/lib/routine-detail.ts";

const item = (series, muscleGroup, equipment = null) => ({ series, exercise: { muscleGroup, equipment } });

// "Upper Lower 4 dias" del catálogo real.
const UPPER_LOWER = [
  { items: [item(4, "Pecho", "Barra"), item(4, "Espalda", "Polea"), item(3, "Hombros", "Mancuernas"), item(3, "Espalda", "Polea"), item(2, "Biceps", "Barra")] },
  { items: [item(4, "Piernas", "Barra"), item(4, "Piernas", "Barra"), item(3, "Piernas", "Maquina"), item(3, "Piernas", "Maquina")] },
  { items: [item(4, "Pecho", "Mancuernas"), item(4, "Espalda", "Mancuernas"), item(3, "Hombros", "Mancuernas"), item(2, "Triceps", "Polea")] },
  { items: [item(4, "Piernas", "Barra"), item(4, "Piernas", "Barra"), item(3, "Piernas", "Maquina"), item(3, "Core", "Peso corporal")] },
];

describe("resolveDetailState", () => {
  const base = { signedIn: true, saved: null, archived: false, status: undefined };

  it("sin sesión es invitado aunque la URL diga otra cosa", () => {
    assert.equal(resolveDetailState({ ...base, signedIn: false, status: "active" }), "guest");
  });

  it("con sesión y sin copia es nueva", () => {
    assert.equal(resolveDetailState(base), "new");
  });

  it("la copia de la base manda sobre la URL", () => {
    assert.equal(resolveDetailState({ ...base, saved: { isActive: true } }), "active");
    assert.equal(resolveDetailState({ ...base, saved: { isActive: false }, status: "active" }), "saved");
  });

  it("sin copia en la base usa el status de la redirección", () => {
    assert.equal(resolveDetailState({ ...base, status: "active" }), "active");
    assert.equal(resolveDetailState({ ...base, status: "created" }), "saved");
    assert.equal(resolveDetailState({ ...base, status: "already-saved" }), "saved");
    assert.equal(resolveDetailState({ ...base, status: "inactive" }), "saved");
    assert.equal(resolveDetailState({ ...base, status: "save-error" }), "new");
  });

  it("archivada solo si no la tenés guardada", () => {
    assert.equal(resolveDetailState({ ...base, archived: true }), "archived");
    assert.equal(resolveDetailState({ ...base, archived: true, saved: { isActive: false } }), "saved");
    assert.equal(resolveDetailState({ ...base, archived: true, saved: { isActive: true } }), "active");
  });
});

describe("titleWithoutDays", () => {
  it("saca el sufijo cuando coincide con los días", () => {
    assert.equal(titleWithoutDays("Upper Lower 4 días", 4), "Upper Lower");
    assert.equal(titleWithoutDays("Full Body 3 dias", 3), "Full Body");
    assert.equal(titleWithoutDays("Arnold Split 6 DÍAS", 6), "Arnold Split");
  });

  it("deja el nombre si no coincide o no hay sufijo", () => {
    assert.equal(titleWithoutDays("Upper Lower 4 días", 5), "Upper Lower 4 días");
    assert.equal(titleWithoutDays("Push Pull Legs", 3), "Push Pull Legs");
    assert.equal(titleWithoutDays("4 días", 4), "4 días");
  });
});

describe("formatRest y formatReps", () => {
  it("pasa segundos a minutos desde 2 min", () => {
    assert.equal(formatRest("120s"), "2 min");
    assert.equal(formatRest("150s"), "2:30 min");
    assert.equal(formatRest("90s"), "90 s");
    assert.equal(formatRest("60 s"), "60 s");
    assert.equal(formatRest("2 min"), "2 min");
  });

  it("usa raya en los rangos", () => {
    assert.equal(formatReps("6-10"), "6–10");
    assert.equal(formatReps("45-60s"), "45–60s");
    assert.equal(formatReps("12"), "12");
  });
});

describe("resumen y series por grupo", () => {
  it("suma series y promedia minutos redondeando a 5", () => {
    assert.equal(countSeries(UPPER_LOWER), 57);
    assert.equal(averageMinutes([35, 35, 25, 30]), 30);
    assert.equal(averageMinutes([]), 0);
  });

  it("ordena grupos por series y conserva el orden en empates", () => {
    assert.deepEqual(weeklySeriesByGroup(UPPER_LOWER), [
      { group: "Piernas", series: 25 },
      { group: "Espalda", series: 11 },
      { group: "Pecho", series: 8 },
      { group: "Hombros", series: 6 },
      { group: "Core", series: 3 },
      { group: "Biceps", series: 2 },
      { group: "Triceps", series: 2 },
    ]);
  });

  it("ignora ejercicios sin grupo", () => {
    assert.deepEqual(weeklySeriesByGroup([{ items: [item(3, null), item(2, "Core")] }]), [{ group: "Core", series: 2 }]);
    assert.deepEqual(weeklySeriesByGroup([]), []);
  });

  it("pinta fuerte desde 8 series", () => {
    assert.deepEqual(balanceFills([{ group: "Pecho", series: 8 }, { group: "Core", series: 7 }]), {
      Pecho: "var(--foreground)",
      Core: "var(--foreground-muted)",
    });
  });

  it("lista el equipamiento sin repetir", () => {
    assert.deepEqual(equipmentList(UPPER_LOWER), ["Barra", "Polea", "Mancuernas", "Maquina", "Peso corporal"]);
  });
});
