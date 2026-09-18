"use client";

import { useCallback, useRef } from "react";

import { revealOffset, sheetViewport, visibleBand } from "@/app/lib/sheet-keyboard";

const TEXT_INPUT_TYPES = new Set(["text", "search", "email", "tel", "url", "number", "password"]);
/** Si el teclado no avisa con un resize (teclado físico, escritorio), el campo se revisa igual. */
const KEYBOARD_WAIT_MS = 450;
/** Con el teclado ya abierto (cambio de campo) solo se espera el scroll propio del navegador. */
const FIELD_SWITCH_MS = 60;
const FIELD_MARGIN_PX = 12;

/** Campo que abre el teclado en pantalla. */
export function isTextField(element: EventTarget | null): element is HTMLElement {
  if (element instanceof HTMLInputElement) return TEXT_INPUT_TYPES.has(element.type) && !element.readOnly;
  if (element instanceof HTMLTextAreaElement) return !element.readOnly;
  return element instanceof HTMLElement && element.isContentEditable;
}

function scrollParent(element: HTMLElement, root: HTMLElement) {
  for (let node = element.parentElement; node && root.contains(node); node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight + 1) return node;
  }
  return null;
}

/**
 * Engancha un sheet al teclado en pantalla (DESIGN.md §4): mide el viewport visual y deja en el sheet
 * `--keyboard-inset`, `--viewport-height` y `data-keyboard-open` (globals.css lo apoya encima del
 * teclado), y mantiene a la vista el campo con foco.
 */
function attachSheetViewport(node: HTMLElement) {
  const viewport = window.visualViewport;
  if (!viewport) return () => {};

  // Donde cae `bottom: 0` de un elemento fijo: el borde de abajo del viewport de layout.
  const probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText = "position:fixed;left:0;bottom:0;width:0;height:0;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let field: HTMLElement | null = null;
  let timer = 0;

  function reveal() {
    const target = field;
    if (!target || !viewport || document.activeElement !== target) return;

    const scroller = scrollParent(target, node);
    if (!scroller) return;

    // Un buscador sube al tope para que sus resultados se vean; un campo común muestra también su etiqueta.
    const anchor = target.closest<HTMLElement>('[data-keyboard-scroll="start"]');
    const label = target.closest("label");
    const block = anchor && scroller.contains(anchor) ? anchor : label && scroller.contains(label) ? label : target;
    const band = visibleBand(
      scroller.getBoundingClientRect(),
      { top: viewport.offsetTop, bottom: viewport.offsetTop + viewport.height },
      FIELD_MARGIN_PX,
    );
    const offset = revealOffset(block.getBoundingClientRect(), band, block === anchor ? "start" : "nearest");

    if (Math.abs(offset) >= 1) {
      scroller.scrollBy({ top: offset, behavior: reduceMotion.matches ? "auto" : "smooth" });
    }
  }

  function update() {
    if (!viewport) return;
    const layout = sheetViewport({
      layoutHeight: probe.getBoundingClientRect().top,
      height: viewport.height,
      offsetTop: viewport.offsetTop,
      scale: viewport.scale,
    });

    node.style.setProperty("--keyboard-inset", `${layout.inset}px`);
    node.style.setProperty("--viewport-height", `${layout.height}px`);
    node.toggleAttribute("data-keyboard-open", layout.keyboardOpen);
    // Solo el teclado mueve el scroll; con zoom de pellizco manda el usuario.
    if (layout.keyboardOpen) reveal();
  }

  function onFocusIn(event: FocusEvent) {
    if (!isTextField(event.target)) return;
    field = event.target;
    window.clearTimeout(timer);
    timer = window.setTimeout(reveal, node.hasAttribute("data-keyboard-open") ? FIELD_SWITCH_MS : KEYBOARD_WAIT_MS);
  }

  function onFocusOut(event: FocusEvent) {
    if (event.target === field) field = null;
  }

  // Una función por sheet: con sheets apilados, cerrar el de arriba no le saca el listener al de abajo.
  const onPointerDown = () => rememberFieldAtPointerDown();

  update();
  viewport.addEventListener("resize", update);
  viewport.addEventListener("scroll", update);
  window.addEventListener("resize", update);
  node.addEventListener("focusin", onFocusIn);
  node.addEventListener("focusout", onFocusOut);
  document.addEventListener("pointerdown", onPointerDown, true);

  return () => {
    window.clearTimeout(timer);
    viewport.removeEventListener("resize", update);
    viewport.removeEventListener("scroll", update);
    window.removeEventListener("resize", update);
    node.removeEventListener("focusin", onFocusIn);
    node.removeEventListener("focusout", onFocusOut);
    document.removeEventListener("pointerdown", onPointerDown, true);
    probe.remove();
  };
}

/** Campo con el teclado abierto cuando empezó el toque (en Android lo pierde antes de que el toque termine). */
let fieldAtPointerDown: HTMLElement | null = null;

function rememberFieldAtPointerDown() {
  const active = document.activeElement;
  fieldAtPointerDown = isTextField(active) && active.closest("[data-keyboard-open]") ? active : null;
}

/**
 * Ref del contenido de un sheet: lo engancha al teclado mientras está montado. Callback clásico (con
 * `null` al desmontar) porque vaul compone refs sin soportar la limpieza que devuelve React 19.
 */
export function useSheetViewport() {
  const detachRef = useRef<(() => void) | null>(null);

  return useCallback((node: HTMLElement | null) => {
    detachRef.current?.();
    detachRef.current = node ? attachSheetViewport(node) : null;
  }, []);
}

const FOCUSABLE =
  'input:not([type="hidden"]):not(:disabled), textarea:not(:disabled), select:not(:disabled), button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])';

/**
 * `onOpenAutoFocus` de un sheet: en táctil, si lo primero enfocable es un campo, el foco va al sheet.
 * Abrir el teclado mientras el sheet sube lo hace saltar; el teclado se abre al tocar el campo.
 */
export function focusSheetInsteadOfField(event: Event) {
  const sheet = event.currentTarget;
  if (event.defaultPrevented || !(sheet instanceof HTMLElement) || !window.matchMedia("(pointer: coarse)").matches) return;
  if (!isTextField(sheet.querySelector(FOCUSABLE))) return;
  event.preventDefault();
  sheet.focus({ preventScroll: true });
}

/** Con el teclado abierto, tocar afuera del sheet solo cierra el teclado (no el sheet con lo escrito). */
export function blurFieldInsteadOfClosing() {
  const field = fieldAtPointerDown;
  fieldAtPointerDown = null;
  if (!field) return false;
  if (document.activeElement === field) field.blur();
  return true;
}
