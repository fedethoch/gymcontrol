"use client";

import { useSyncExternalStore } from "react";

/** Más que la barra de URL que aparece y desaparece; menos que cualquier teclado en pantalla. */
const KEYBOARD_MIN_PX = 150;

function subscribe(notify: () => void) {
  const viewport = window.visualViewport;
  viewport?.addEventListener("resize", notify);
  return () => viewport?.removeEventListener("resize", notify);
}

function getSnapshot() {
  const viewport = window.visualViewport;
  if (!viewport) return false;
  // El zoom con los dedos también achica el viewport visual: se compara el alto sin escala.
  return window.innerHeight - viewport.height * viewport.scale > KEYBOARD_MIN_PX;
}

/** Si el teclado en pantalla está abierto (el viewport visual quedó bastante más bajo que la ventana). */
export function useKeyboardOpen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
