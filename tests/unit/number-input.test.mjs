import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canStep,
  clampNumber,
  formatDecimal,
  parseDecimalInput,
  stepNumber,
} from "../../app/lib/number-input.ts";

describe("parseDecimalInput", () => {
  it("acepta coma, punto y espacios", () => {
    assert.equal(parseDecimalInput("1,5"), 1.5);
    assert.equal(parseDecimalInput(" 2 "), 2);
    assert.equal(parseDecimalInput(".5"), 0.5);
  });

  it("acepta el número a medio escribir", () => {
    assert.equal(parseDecimalInput("3."), 3);
    assert.equal(parseDecimalInput("3,"), 3);
  });

  it("devuelve null si no es un número", () => {
    assert.equal(parseDecimalInput(""), null);
    assert.equal(parseDecimalInput("abc"), null);
    assert.equal(parseDecimalInput("1.2.3"), null);
    assert.equal(parseDecimalInput("1e3"), null);
    assert.equal(parseDecimalInput("."), null);
  });
});

describe("stepNumber", () => {
  it("suma y resta un paso cuando el valor está en la grilla", () => {
    assert.equal(stepNumber(150, 1, { step: 10 }), 160);
    assert.equal(stepNumber(150, -1, { step: 10 }), 140);
    assert.equal(stepNumber(1.5, 1, { step: 0.5 }), 2);
  });

  it("fuera de la grilla, primero se alinea", () => {
    assert.equal(stepNumber(155, -1, { step: 10 }), 150);
    assert.equal(stepNumber(155, 1, { step: 10 }), 160);
    assert.equal(stepNumber(70.3, 1, { step: 0.5 }), 70.5);
    assert.equal(stepNumber(70.3, -1, { step: 0.5 }), 70);
  });

  it("no se confunde con el ruido de coma flotante", () => {
    assert.equal(stepNumber(0.7, 1, { step: 0.1 }), 0.8);
    assert.equal(stepNumber(0.3, -1, { step: 0.1 }), 0.2);
  });

  it("respeta min y max", () => {
    assert.equal(stepNumber(10, -1, { step: 10, min: 1 }), 1);
    assert.equal(stepNumber(99, 1, { step: 1, max: 99 }), 99);
    assert.equal(stepNumber(0.5, -1, { step: 0.5, min: 0.5 }), 0.5);
  });

  it("vacío arranca desde min o desde 0", () => {
    assert.equal(stepNumber(null, 1, { step: 10, min: 1 }), 10);
    assert.equal(stepNumber(null, -1, { step: 10, min: 1 }), 1);
    assert.equal(stepNumber(null, 1, { step: 1 }), 1);
    assert.equal(stepNumber(null, 1, { step: 1, min: 14 }), 15);
  });
});

describe("canStep", () => {
  it("se deshabilita en el límite", () => {
    assert.equal(canStep(1, -1, { min: 1 }), false);
    assert.equal(canStep(2, -1, { min: 1 }), true);
    assert.equal(canStep(99, 1, { max: 99 }), false);
    assert.equal(canStep(null, -1, { min: 1 }), true);
    assert.equal(canStep(5, 1, {}), true);
  });
});

describe("clampNumber y formatDecimal", () => {
  it("recorta al rango", () => {
    assert.equal(clampNumber(-1, 0, 10), 0);
    assert.equal(clampNumber(11, 0, 10), 10);
    assert.equal(clampNumber(5, undefined, undefined), 5);
  });

  it("formatea sin ceros de más y con coma decimal", () => {
    assert.equal(formatDecimal(150), "150");
    assert.equal(formatDecimal(1.5), "1,5");
    assert.equal(formatDecimal(0.1 + 0.2), "0,3");
    assert.equal(formatDecimal(1 / 3), "0,33");
    assert.equal(formatDecimal(1.5, 2, "."), "1.5");
  });
});
