import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pushDelivery, pushTag } from "../../app/lib/notifications.ts";
import {
  cleanSupplementName,
  findPresetByName,
  mergeWithPresets,
  minutesFromSupplementKind,
  pendingSupplements,
  shouldSendSupplementReminder,
  sortHomeSupplements,
  SUPPLEMENT_PRESETS,
  supplementDeliveryKind,
  supplementReminderMessage,
} from "../../app/lib/supplements.ts";

const at = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const supplement = (id, name, reminderTime, extra = {}) => ({
  id,
  presetKey: null,
  name,
  active: true,
  reminderEnabled: true,
  reminderTime,
  ...extra,
});

describe("pendingSupplements", () => {
  const list = [
    supplement("a", "Creatina", "09:00"),
    supplement("b", "Omega 3", "09:20"),
    supplement("c", "Magnesio", "09:00", { active: false }),
    supplement("d", "Zinc", "09:00", { reminderEnabled: false }),
    supplement("e", "Vitamina D", "21:00"),
    supplement(null, "Colágeno", "08:00"),
  ];

  it("solo activos, con aviso, sin tilde, con la hora pasada y con fila", () => {
    const pending = pendingSupplements(list, new Set(), at("10:00"));
    assert.deepEqual(
      pending.map((item) => item.id),
      ["a", "b"],
    );
  });

  it("un tildado hoy no cuenta", () => {
    assert.deepEqual(
      pendingSupplements(list, new Set(["a"]), at("10:00")).map((item) => item.id),
      ["b"],
    );
  });

  it("ordena por hora", () => {
    const pending = pendingSupplements(
      [supplement("x", "Zinc", "12:00"), supplement("y", "Creatina", "08:00")],
      new Set(),
      at("13:00"),
    );
    assert.deepEqual(
      pending.map((item) => item.id),
      ["y", "x"],
    );
  });
});

describe("shouldSendSupplementReminder", () => {
  const creatina = { id: "a", name: "Creatina", reminderTime: "09:00" };
  const omega = { id: "b", name: "Omega 3", reminderTime: "09:20" };
  const late = { id: "c", name: "Magnesio", reminderTime: "23:30" };

  it("sin pendientes no sale", () => {
    assert.equal(shouldSendSupplementReminder({ pending: [], lastSendMinutes: null, minutes: at("09:00") }), false);
  });

  it("primera tanda del día", () => {
    assert.equal(
      shouldSendSupplementReminder({ pending: [creatina], lastSendMinutes: null, minutes: at("09:00") }),
      true,
    );
  });

  it("no repite a los 30 min", () => {
    assert.equal(
      shouldSendSupplementReminder({ pending: [creatina], lastSendMinutes: at("09:00"), minutes: at("09:30") }),
      false,
    );
  });

  it("repite a los 55 y a los 60 min", () => {
    for (const now of ["09:55", "10:00"]) {
      assert.equal(
        shouldSendSupplementReminder({ pending: [creatina], lastSendMinutes: at("09:00"), minutes: at(now) }),
        true,
      );
    }
  });

  it("un pendiente nuevo entra en la cadencia y sale enseguida", () => {
    assert.equal(
      shouldSendSupplementReminder({ pending: [creatina, omega], lastSendMinutes: at("09:00"), minutes: at("09:20") }),
      true,
    );
    // A las 09:25 ya salió la tanda de las 09:20: nada nuevo.
    assert.equal(
      shouldSendSupplementReminder({ pending: [creatina, omega], lastSendMinutes: at("09:20"), minutes: at("09:25") }),
      false,
    );
  });

  it("repite hasta las 23:00 y no después", () => {
    assert.equal(
      shouldSendSupplementReminder({ pending: [creatina], lastSendMinutes: at("22:00"), minutes: at("23:00") }),
      true,
    );
    assert.equal(
      shouldSendSupplementReminder({ pending: [creatina], lastSendMinutes: at("22:30"), minutes: at("23:30") }),
      false,
    );
  });

  it("después de las 23:00 sale solo el primer aviso de uno de esa hora", () => {
    assert.equal(
      shouldSendSupplementReminder({ pending: [creatina, late], lastSendMinutes: at("23:00"), minutes: at("23:30") }),
      true,
    );
    // Ya salió la de las 23:30: no hay repetición a las 00:30 (el día es otro) ni a las 23:55.
    assert.equal(
      shouldSendSupplementReminder({ pending: [creatina, late], lastSendMinutes: at("23:30"), minutes: at("23:55") }),
      false,
    );
  });

  it("un pendiente de la mañana no dispara un primer aviso a las 23:50", () => {
    assert.equal(
      shouldSendSupplementReminder({ pending: [creatina], lastSendMinutes: null, minutes: at("23:50") }),
      false,
    );
  });
});

describe("supplementReminderMessage", () => {
  it("1 y 2 suplementos con nombre, en minúscula salvo siglas", () => {
    assert.equal(supplementReminderMessage(["Creatina"]).title, "¿Tomaste creatina?");
    assert.equal(supplementReminderMessage(["Creatina", "Omega 3"]).title, "¿Tomaste creatina y omega 3?");
    assert.equal(supplementReminderMessage(["ZMA"]).title, "¿Tomaste ZMA?");
    assert.equal(supplementReminderMessage(["Vitamina D"]).title, "¿Tomaste vitamina D?");
  });

  it("si no entra en 30 caracteres, el conteo", () => {
    assert.equal(supplementReminderMessage(["Proteína en polvo", "Magnesio"]).title, "Te faltan 2 suplementos");
    assert.equal(supplementReminderMessage(["Un nombre bastante largo de verdad"]).title, "Te falta 1 suplemento");
    assert.equal(supplementReminderMessage(["A", "B", "C"]).title, "Te faltan 3 suplementos");
  });

  it("todos los títulos entran en 30 caracteres", () => {
    const names = SUPPLEMENT_PRESETS.map((preset) => preset.name);
    for (const a of names) {
      assert.ok(supplementReminderMessage([a]).title.length <= 30, a);
      for (const b of names) {
        if (a !== b) assert.ok(supplementReminderMessage([a, b]).title.length <= 30, `${a} + ${b}`);
      }
    }
  });
});

describe("tanda en push_deliveries", () => {
  it("kind con la hora del tick y vuelta", () => {
    assert.equal(supplementDeliveryKind(at("09:05")), "supplements_0905");
    assert.equal(supplementDeliveryKind(at("23:55")), "supplements_2355");
    assert.equal(minutesFromSupplementKind("supplements_0920"), at("09:20"));
    assert.equal(minutesFromSupplementKind("meal_cena"), null);
  });

  it("tag y topic del aviso (topic alfanumérico para Apple)", () => {
    assert.equal(pushTag("supplements"), "supplements");
    const delivery = pushDelivery("supplements");
    assert.match(delivery.topic, /^[A-Za-z0-9]+$/);
    assert.equal(delivery.ttl, 60 * 60);
  });
});

describe("lista y orden", () => {
  it("S8: los 10 comunes en orden fijo y después los propios", () => {
    const merged = mergeWithPresets([
      supplement("own", "Ashwagandha", "22:00"),
      supplement("om", "Omega 3", "09:20", { presetKey: "omega_3" }),
    ]);
    assert.equal(merged.length, 11);
    assert.deepEqual(
      merged.slice(0, 4).map((item) => item.name),
      ["Creatina", "Proteína en polvo", "Multivitamínico", "Omega 3"],
    );
    assert.equal(merged[3].id, "om");
    assert.equal(merged[0].id, null);
    assert.equal(merged[0].active, false);
    assert.equal(merged[10].name, "Ashwagandha");
  });

  it("home: pendientes por hora primero, después los tomados", () => {
    const sorted = sortHomeSupplements([
      { id: "1", name: "Creatina", time: "09:00", takenAt: "09:12" },
      { id: "2", name: "Zinc", time: "22:00", takenAt: null },
      { id: "3", name: "Omega 3", time: "09:20", takenAt: null },
      { id: "4", name: "Magnesio", time: "08:00", takenAt: "08:10" },
    ]);
    assert.deepEqual(
      sorted.map((item) => item.id),
      ["3", "2", "4", "1"],
    );
  });

  it("nombres: espacios y comunes escritos a mano", () => {
    assert.equal(cleanSupplementName("  Ashwa   gandha "), "Ashwa gandha");
    assert.equal(findPresetByName(" creatina ")?.key, "creatina");
    assert.equal(findPresetByName("vitamina d")?.key, "vitamina_d");
    assert.equal(findPresetByName("Melatonina"), null);
  });
});
