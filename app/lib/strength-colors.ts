import type { MuscleStrengthRange } from "@/app/lib/workout-tracking";

/** Rampa de fuerza peor → mejor. Tokens en globals.css (DESIGN.md §1.6). */
export const STRENGTH_RANGE_COLORS: Record<MuscleStrengthRange, string> = {
  sin_datos: "var(--strength-0)",
  base: "var(--strength-1)",
  fuerte: "var(--strength-2)",
  avanzado: "var(--strength-3)",
  elite: "var(--strength-4)",
};

export const STRENGTH_RANGE_LABELS: Record<MuscleStrengthRange, string> = {
  sin_datos: "Sin datos",
  base: "Base",
  fuerte: "Fuerte",
  avanzado: "Avanzado",
  elite: "Elite",
};

/** Orden de menor a mayor para comparar rangos. */
export const STRENGTH_RANGE_ORDER: MuscleStrengthRange[] = ["sin_datos", "base", "fuerte", "avanzado", "elite"];
