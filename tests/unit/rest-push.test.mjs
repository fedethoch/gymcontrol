import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  decideRestPush,
  describeRestNext,
  isSchedulableSendAt,
  REST_PUSH_MAX_MS,
  resolveSendAt,
  summarizeRestDeltas,
} from "../../app/lib/rest-push.ts";

const NOW = 1_790_000_000_000;

describe("resolveSendAt", () => {
  it("con relojes parecidos usa la hora de fin del celu (la red no atrasa el aviso)", () => {
    assert.equal(resolveSendAt({ endsAt: NOW + 90_000, sentAt: NOW, receivedAt: NOW + 800 }), NOW + 90_000);
    assert.equal(resolveSendAt({ endsAt: NOW + 90_000, sentAt: NOW, receivedAt: NOW - 1_500 }), NOW + 90_000);
  });

  it("con el reloj del celu corrido usa lo que faltaba al mandarlo", () => {
    // Celu 5 min adelantado.
    const sentAt = NOW + 300_000;
    assert.equal(resolveSendAt({ endsAt: sentAt + 90_000, sentAt, receivedAt: NOW }), NOW + 90_000);
  });

  it("solo programa descansos que no terminaron y no son absurdos", () => {
    assert.equal(isSchedulableSendAt(NOW + 90_000, NOW), true);
    assert.equal(isSchedulableSendAt(NOW - 1_000, NOW), true);
    assert.equal(isSchedulableSendAt(NOW - 5_000, NOW), false);
    assert.equal(isSchedulableSendAt(NOW + REST_PUSH_MAX_MS + 1, NOW), false);
  });
});

describe("decideRestPush", () => {
  const rest = { endsAt: NOW + 60_000, next: "Sigue: Press banca · serie 2 de 4" };
  const base = { rest, scheduledEndsAt: null, visible: true, canVibrate: false, now: NOW };

  it("programa un descanso nuevo y reprograma con +15 s", () => {
    assert.equal(decideRestPush(base), "schedule");
    assert.equal(decideRestPush({ ...base, scheduledEndsAt: NOW + 45_000 }), "schedule");
    assert.equal(decideRestPush({ ...base, scheduledEndsAt: rest.endsAt }), "none");
  });

  it("sin descanso cancela lo programado", () => {
    assert.equal(decideRestPush({ ...base, rest: null, scheduledEndsAt: rest.endsAt }), "cancel");
    assert.equal(decideRestPush({ ...base, rest: null }), "none");
  });

  it("después de la última serie no programa nada", () => {
    assert.equal(decideRestPush({ ...base, rest: { ...rest, next: null } }), "none");
    assert.equal(decideRestPush({ ...base, rest: { ...rest, next: null }, scheduledEndsAt: rest.endsAt }), "cancel");
  });

  it("Android con la app visible cancela a 1,5 s del fin; oculta vuelve a programar", () => {
    const nearEnd = { ...base, canVibrate: true, scheduledEndsAt: rest.endsAt, now: rest.endsAt - 1_000 };
    assert.equal(decideRestPush(nearEnd), "cancel");
    assert.equal(decideRestPush({ ...nearEnd, scheduledEndsAt: null }), "none");
    assert.equal(decideRestPush({ ...nearEnd, scheduledEndsAt: null, visible: false }), "schedule");
  });

  it("iPhone (no vibra) nunca cancela cerca del fin: el push es el único aviso", () => {
    const nearEnd = { ...base, canVibrate: false, scheduledEndsAt: rest.endsAt, now: rest.endsAt - 1_000 };
    assert.equal(decideRestPush(nearEnd), "none");
  });

  it("un descanso que ya terminó no se programa", () => {
    assert.equal(decideRestPush({ ...base, now: rest.endsAt + 10 }), "none");
  });
});

describe("textos y medición", () => {
  it("describe la próxima serie", () => {
    assert.equal(
      describeRestNext({ exerciseName: " Press banca ", setNumber: 3, setCount: 4 }),
      "Sigue: Press banca · serie 3 de 4",
    );
  });

  it("resume las demoras medidas en el celu", () => {
    assert.equal(summarizeRestDeltas([]), null);
    assert.deepEqual(summarizeRestDeltas([900, -200, 1500, 400, 600, 700, 800, 1000, 1200, 300]), {
      count: 10,
      median: 800,
      p90: 1500,
      max: 1500,
      min: -200,
    });
  });
});
