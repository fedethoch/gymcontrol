import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { revealOffset, sheetViewport, visibleBand } from "../../app/lib/sheet-keyboard.ts";

const PHONE = { layoutHeight: 844, scale: 1 };

describe("sheetViewport", () => {
  it("sin teclado el sheet queda abajo de todo", () => {
    assert.deepEqual(sheetViewport({ ...PHONE, height: 844, offsetTop: 0 }), { inset: 0, height: 844, keyboardOpen: false });
  });

  it("con el teclado se apoya encima y se limita a lo visible", () => {
    assert.deepEqual(sheetViewport({ ...PHONE, height: 508, offsetTop: 0 }), { inset: 336, height: 508, keyboardOpen: true });
  });

  it("si el navegador desplazó la vista, lo tapado abajo es menos", () => {
    assert.deepEqual(sheetViewport({ ...PHONE, height: 508, offsetTop: 150 }), { inset: 186, height: 508, keyboardOpen: true });
    assert.equal(sheetViewport({ ...PHONE, height: 508, offsetTop: 400 }).inset, 0);
  });

  it("la barra de un teclado físico también cuenta", () => {
    assert.deepEqual(sheetViewport({ ...PHONE, height: 789, offsetTop: 0 }), { inset: 55, height: 789, keyboardOpen: true });
  });

  it("el zoom con los dedos y el redondeo no son teclado", () => {
    assert.equal(sheetViewport({ ...PHONE, height: 422, offsetTop: 200, scale: 2 }).keyboardOpen, false);
    assert.equal(sheetViewport({ ...PHONE, height: 422, offsetTop: 200, scale: 2 }).inset, 0);
    assert.equal(sheetViewport({ ...PHONE, height: 842.5, offsetTop: 0 }).keyboardOpen, false);
  });
});

describe("visibleBand", () => {
  it("recorta al scroll y al viewport visual con margen", () => {
    assert.deepEqual(visibleBand({ top: 185, bottom: 844 }, { top: 0, bottom: 508 }, 12), { top: 197, bottom: 496 });
    assert.deepEqual(visibleBand({ top: 100, bottom: 400 }, { top: 150, bottom: 658 }, 0), { top: 150, bottom: 400 });
  });
});

describe("revealOffset", () => {
  const band = { top: 200, bottom: 500 };

  it("no mueve un campo que ya se ve", () => {
    assert.equal(revealOffset({ top: 250, bottom: 300 }, band, "nearest"), 0);
  });

  it("sube lo justo un campo tapado abajo", () => {
    assert.equal(revealOffset({ top: 520, bottom: 564 }, band, "nearest"), 64);
  });

  it("baja lo justo un campo que quedó arriba", () => {
    assert.equal(revealOffset({ top: 150, bottom: 194 }, band, "nearest"), -50);
  });

  it("un bloque más alto que la franja muestra su borde de arriba", () => {
    assert.equal(revealOffset({ top: 400, bottom: 800 }, band, "nearest"), 200);
  });

  it("start lleva el campo arriba de la franja", () => {
    assert.equal(revealOffset({ top: 476, bottom: 520 }, band, "start"), 276);
    assert.equal(revealOffset({ top: 150, bottom: 194 }, band, "start"), -50);
  });
});
