// Sin imports a propósito: se testea con `node --test`.

/** Lo que mide el navegador: dónde cae `bottom: 0` de un elemento fijo y el viewport visual. */
export type ViewportSample = {
  layoutHeight: number;
  height: number;
  offsetTop: number;
  scale: number;
};

export type SheetViewport = {
  /** Cuánto del borde de abajo queda tapado (el teclado): es el `bottom` del sheet. */
  inset: number;
  /** Alto que se ve arriba del teclado. */
  height: number;
  keyboardOpen: boolean;
};

export type Span = { top: number; bottom: number };

/** Menos que esto es redondeo del navegador, no un teclado. */
const COVERED_MIN_PX = 2;

/**
 * Dónde apoyar un sheet con el teclado en pantalla. Si el navegador desplazó la vista para mostrar
 * el campo (`offsetTop`), lo tapado abajo es menos: el sheet queda justo arriba del teclado igual.
 */
export function sheetViewport({ layoutHeight, height, offsetTop, scale }: ViewportSample): SheetViewport {
  // El zoom con los dedos también achica el viewport visual: no es teclado.
  if (scale > 1.01 || layoutHeight - height <= COVERED_MIN_PX) {
    return { inset: 0, height: layoutHeight, keyboardOpen: false };
  }

  return { inset: Math.max(0, layoutHeight - offsetTop - height), height, keyboardOpen: true };
}

/** Franja donde un campo se ve: dentro de su scroll y del viewport visual, con margen. */
export function visibleBand(scroller: Span, viewport: Span, margin: number): Span {
  return {
    top: Math.max(scroller.top, viewport.top) + margin,
    bottom: Math.min(scroller.bottom, viewport.bottom) - margin,
  };
}

/**
 * Cuánto mover el scroll (positivo = bajar) para ver `box` en `band`. "start" lo lleva arriba de todo
 * (un buscador con resultados abajo); "nearest" lo mueve lo justo sin esconder su borde de arriba.
 */
export function revealOffset(box: Span, band: Span, align: "start" | "nearest"): number {
  if (align === "start") return box.top - band.top;
  if (box.bottom > band.bottom) return Math.min(box.bottom - band.bottom, box.top - band.top);
  if (box.top < band.top) return box.top - band.top;
  return 0;
}
