// Sin imports a propósito: se testea con `node --test`.

export type StepOptions = {
  step: number;
  min?: number;
  max?: number;
  maxDecimals?: number;
};

/** Número escrito a mano ("1,5", " 2 ", "3.") o `null` si no es un número. */
export function parseDecimalInput(value: string): number | null {
  const normalized = value.trim().replace(",", ".");

  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function clampNumber(value: number, min?: number, max?: number) {
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}

/** Texto del número: sin ceros de más ni ruido de coma flotante, con coma decimal ("1,5", "150"). */
export function formatDecimal(value: number, maxDecimals = 2, separator: "," | "." = ",") {
  return String(roundTo(value, maxDecimals)).replace(".", separator);
}

/**
 * Un toque de −/+. Si el valor no cae en la grilla del paso, primero se alinea
 * (155 − 10 = 150, 70.3 + 0.5 = 70.5). Vacío arranca desde `min` (o 0). Siempre respeta min/max.
 */
export function stepNumber(value: number | null, direction: 1 | -1, options: StepOptions) {
  const { step, min, max, maxDecimals = 2 } = options;
  const current = value ?? min ?? 0;
  const ratio = roundTo(current / step, 9);
  const aligned = Number.isInteger(ratio);
  const next = aligned
    ? current + direction * step
    : (direction === 1 ? Math.ceil(ratio) : Math.floor(ratio)) * step;

  return clampNumber(roundTo(next, maxDecimals), min, max);
}

/** `false` cuando el valor ya está en el límite hacia donde apunta el botón. */
export function canStep(value: number | null, direction: 1 | -1, options: Pick<StepOptions, "min" | "max">) {
  if (value === null) return true;
  if (direction === -1) return options.min === undefined || value > options.min;
  return options.max === undefined || value < options.max;
}
