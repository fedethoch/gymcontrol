// Solo tipos: este módulo va al cliente y no debe arrastrar las tablas de strength-standards-data.
import type { StrengthDivision, StrengthLevel } from "@/app/lib/strength-standards";

/** Sin datos: mismo gris que el cuerpo de `BodyMuscleFigure`. Tokens en globals.css (DESIGN.md §1.6). */
export const STRENGTH_EMPTY_COLOR = "var(--strength-0)";

/** Rampa de fuerza peor → mejor, un color por nivel. */
export const STRENGTH_LEVEL_COLORS: Record<StrengthLevel, string> = {
  principiante: "var(--strength-1)",
  novato: "var(--strength-2)",
  intermedio: "var(--strength-3)",
  avanzado: "var(--strength-4)",
  elite: "var(--strength-5)",
};

export const STRENGTH_LEVEL_LABELS: Record<StrengthLevel, string> = {
  principiante: "Principiante",
  novato: "Novato",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
  elite: "Élite",
};

/** Intensidad de cada división: % del color del nivel sobre el gris de "sin datos". */
const DIVISION_MIX: Record<StrengthDivision, number> = { 1: 60, 2: 80, 3: 100 };

/** Relleno de un músculo: color del nivel con la intensidad de su división. */
export function strengthFill(level: StrengthLevel | null, division: StrengthDivision | null) {
  if (!level) return STRENGTH_EMPTY_COLOR;

  const mix = division ? DIVISION_MIX[division] : 100;
  return mix === 100
    ? STRENGTH_LEVEL_COLORS[level]
    : `color-mix(in srgb, ${STRENGTH_LEVEL_COLORS[level]} ${mix}%, ${STRENGTH_EMPTY_COLOR})`;
}

/** "Novato 2", "Élite" o "Sin datos". */
export function strengthLabel(level: StrengthLevel | null, division: StrengthDivision | null) {
  if (!level) return "Sin datos";
  return division ? `${STRENGTH_LEVEL_LABELS[level]} ${division}` : STRENGTH_LEVEL_LABELS[level];
}

/** Orden total de los 13 escalones (−1 = sin datos), para elegir el grupo más fuerte. */
export function strengthScore(level: StrengthLevel | null, division: StrengthDivision | null) {
  if (!level) return -1;
  // STRENGTH_LEVEL_COLORS está declarado en orden peor → mejor.
  return Object.keys(STRENGTH_LEVEL_COLORS).indexOf(level) * 3 + (division ?? 1);
}
