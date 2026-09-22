import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getLocalMinutesOfDay } from "../../app/lib/local-date.ts";
import {
  buildPushPayload,
  DEFAULT_NOTIFICATION_PREFERENCES,
  dueReminders,
  isAllowedPushEndpoint,
  mealReminderMessage,
  normalizeTime,
  parseTimeToMinutes,
  preferencesFromRow,
  preferencesToRow,
  pushDelivery,
  pushTag,
  restEndMessage,
  trainingReminderMessage,
  weeklySummaryMessage,
  withNotificationOrigin,
} from "../../app/lib/notifications.ts";

const at = (time, isoDay = 3) => ({ minutes: parseTimeToMinutes(time), isoDay });
const prefsWith = (overrides) => ({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...overrides });

describe("getLocalMinutesOfDay", () => {
  it("usa la hora argentina aunque el server corra en UTC", () => {
    assert.equal(getLocalMinutesOfDay(new Date("2026-09-21T12:00:00Z")), 9 * 60);
    assert.equal(getLocalMinutesOfDay(new Date("2026-09-22T02:45:00Z")), 23 * 60 + 45);
    assert.equal(getLocalMinutesOfDay(new Date("2026-09-22T03:00:00Z")), 0);
  });
});

describe("horas", () => {
  it("normaliza HH:MM:SS de Postgres y rechaza horas inválidas", () => {
    assert.equal(normalizeTime("09:00:00", "10:00"), "09:00");
    assert.equal(normalizeTime("9:05", "10:00"), "09:05");
    assert.equal(normalizeTime("24:00", "10:00"), "10:00");
    assert.equal(normalizeTime("", "10:00"), "10:00");
    assert.equal(normalizeTime(null, "10:00"), "10:00");
  });

  it("parsea minutos", () => {
    assert.equal(parseTimeToMinutes("14:30"), 870);
    assert.equal(parseTimeToMinutes("00:00"), 0);
    assert.equal(parseTimeToMinutes("7:30"), null);
  });
});

describe("preferencias ⇄ fila", () => {
  it("sin fila = valores por defecto", () => {
    assert.deepEqual(preferencesFromRow(null), DEFAULT_NOTIFICATION_PREFERENCES);
  });

  it("ida y vuelta conserva todo (y normaliza las horas de Postgres)", () => {
    const row = preferencesToRow(DEFAULT_NOTIFICATION_PREFERENCES);
    const fromDb = { ...row, training_time: "09:00:00", meal_cena_time: "21:00:00", weekly_time: "20:00:00" };

    assert.deepEqual(preferencesFromRow(fromDb), DEFAULT_NOTIFICATION_PREFERENCES);
  });
});

describe("dueReminders", () => {
  it("sale desde la hora exacta y durante 30 minutos", () => {
    const prefs = DEFAULT_NOTIFICATION_PREFERENCES;

    assert.deepEqual(dueReminders(prefs, at("08:59")), []);
    assert.deepEqual(dueReminders(prefs, at("09:00")), ["training"]);
    assert.deepEqual(dueReminders(prefs, at("09:29")), ["training"]);
    assert.deepEqual(dueReminders(prefs, at("09:30")), []);
  });

  it("cada comida a su hora por defecto: 08:00, 12:30, 17:30 y 21:00", () => {
    const prefs = DEFAULT_NOTIFICATION_PREFERENCES;

    assert.deepEqual(dueReminders(prefs, at("07:59")), []);
    assert.deepEqual(dueReminders(prefs, at("08:00")), ["meal_desayuno"]);
    assert.deepEqual(dueReminders(prefs, at("12:30")), ["meal_almuerzo"]);
    assert.deepEqual(dueReminders(prefs, at("17:30")), ["meal_merienda"]);
    assert.deepEqual(dueReminders(prefs, at("21:00")), ["meal_cena"]);
    assert.deepEqual(dueReminders(prefs, at("21:30")), []);
  });

  it("apagado no sale", () => {
    const prefs = prefsWith({ training: { enabled: false, time: "09:00" } });

    assert.deepEqual(dueReminders(prefs, at("09:10")), []);
  });

  it("el semanal solo el día elegido", () => {
    const prefs = DEFAULT_NOTIFICATION_PREFERENCES;

    assert.deepEqual(dueReminders(prefs, at("20:00", 7)), ["weekly"]);
    assert.deepEqual(dueReminders(prefs, at("20:00", 6)), []);
  });

  it("cerca de medianoche la ventana no pasa al día siguiente", () => {
    const prefs = prefsWith({
      meals: { ...DEFAULT_NOTIFICATION_PREFERENCES.meals, cena: { enabled: true, time: "23:50" } },
    });

    assert.deepEqual(dueReminders(prefs, at("23:59")), ["meal_cena"]);
    assert.deepEqual(dueReminders(prefs, at("00:05")), []);
  });

  it("dos avisos a la misma hora salen juntos", () => {
    const prefs = prefsWith({ training: { enabled: true, time: "12:30" } });

    assert.deepEqual(dueReminders(prefs, at("12:30")), ["training", "meal_almuerzo"]);
  });
});

describe("mensajes", () => {
  it("con voseo y dentro del largo del copy", () => {
    const messages = [
      mealReminderMessage("desayuno"),
      mealReminderMessage("merienda"),
      trainingReminderMessage({ dayOrder: 2, dayCount: 4, label: "Pecho & Tríceps" }),
      restEndMessage("Sigue: Press banca · serie 3 de 4"),
      restEndMessage(null),
    ];

    for (const message of messages) {
      assert.ok(message.title.length <= 30, message.title);
      assert.ok(message.body.length <= 90, message.body);
    }

    assert.equal(mealReminderMessage("merienda").body, "Registrá la merienda para no perder el hilo del día.");
    assert.equal(trainingReminderMessage({ dayOrder: 2, dayCount: 4, label: "Pecho & Tríceps" }).body, "Día 2 de 4 · Pecho & Tríceps");
  });

  it("resumen semanal según lo que use cada uno", () => {
    assert.equal(
      weeklySummaryMessage({ training: { done: 3, planned: 4 }, nutrition: { loggedDays: 5, onTargetDays: 2 } })?.body,
      "3 de 4 entrenos · 5 días registrados · 2 en objetivo",
    );
    assert.equal(weeklySummaryMessage({ training: { done: 1, planned: null }, nutrition: null })?.body, "1 entreno");
    assert.equal(
      weeklySummaryMessage({ training: null, nutrition: { loggedDays: 1, onTargetDays: 0 } })?.body,
      "1 día registrado · 0 en objetivo",
    );
    assert.equal(weeklySummaryMessage({ training: null, nutrition: null }), null);
  });
});

describe("payload", () => {
  it("links con la marca del aviso y tag por tipo", () => {
    const payload = buildPushPayload({
      kind: "meal_almuerzo",
      message: mealReminderMessage("almuerzo"),
      origin: "https://gymcontrol-lake.vercel.app",
      path: "/nutricion/registro?tipo=almuerzo",
    });

    assert.equal(payload.url, "https://gymcontrol-lake.vercel.app/nutricion/registro?tipo=almuerzo&origen=aviso");
    assert.equal(payload.tag, "meal-almuerzo");
    assert.equal(payload.v, 1);
    assert.equal("token" in payload, false);
  });

  it("recorta textos largos y entra en el límite de 3 KB", () => {
    const payload = buildPushPayload({
      kind: "rest_end",
      message: { title: "x".repeat(200), body: "y".repeat(2000) },
      origin: "https://gymcontrol-lake.vercel.app",
      path: "/rutinas/dia?savedRoutineId=00000000-0000-4000-8000-000000000000&day=2",
      token: "00000000-0000-4000-8000-000000000001",
      endsAt: 1_790_000_000_000,
    });

    assert.ok(payload.title.length <= 60);
    assert.ok(payload.body.length <= 160);
    assert.ok(Buffer.byteLength(JSON.stringify(payload)) <= 3072);
    assert.equal(payload.endsAt, 1_790_000_000_000);
  });

  it("withNotificationOrigin agrega la marca a paths con y sin query", () => {
    assert.equal(withNotificationOrigin("http://localhost:3001", "/"), "http://localhost:3001/?origen=aviso");
    assert.equal(
      withNotificationOrigin("http://localhost:3001", "/configuracion?panel=notificaciones"),
      "http://localhost:3001/configuracion?panel=notificaciones&origen=aviso",
    );
  });

  it("tag y entrega por tipo", () => {
    assert.equal(pushTag("rest_end"), "rest-end");
    assert.equal(pushTag("weekly"), "weekly");
    assert.deepEqual(pushDelivery("rest_end"), { ttl: 60, urgency: "high", topic: "rest" });
    assert.deepEqual(pushDelivery("meal_cena"), { ttl: 3600, urgency: "normal", topic: "meal-cena" });
  });
});

describe("isAllowedPushEndpoint", () => {
  it("acepta los push services conocidos", () => {
    assert.ok(isAllowedPushEndpoint("https://fcm.googleapis.com/fcm/send/abc:123"));
    assert.ok(isAllowedPushEndpoint("https://web.push.apple.com/QGx3abc"));
    assert.ok(isAllowedPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc"));
    assert.ok(isAllowedPushEndpoint("https://wns2-by3p.notify.windows.com/w/?token=abc"));
  });

  it("rechaza hosts trampa, http, puertos y credenciales", () => {
    assert.equal(isAllowedPushEndpoint("https://fcm.googleapis.com.evil.com/x"), false);
    assert.equal(isAllowedPushEndpoint("https://evilpush.apple.com/x"), false);
    assert.equal(isAllowedPushEndpoint("http://fcm.googleapis.com/fcm/send/abc"), false);
    assert.equal(isAllowedPushEndpoint("https://fcm.googleapis.com:8443/fcm/send/abc"), false);
    assert.equal(isAllowedPushEndpoint("https://user:pass@fcm.googleapis.com/fcm/send/abc"), false);
    assert.equal(isAllowedPushEndpoint("https://127.0.0.1/push"), false);
    assert.equal(isAllowedPushEndpoint("no es una url"), false);
  });
});
