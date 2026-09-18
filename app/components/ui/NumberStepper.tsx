"use client";

import { useState, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";

import {
  canStep,
  clampNumber,
  formatDecimal,
  parseDecimalInput,
  roundTo,
  stepNumber,
} from "@/app/lib/number-input";
import { cn } from "@/app/lib/utils";

const SIZES = {
  m: { button: "size-11", icon: "size-5", value: "text-[1.75rem] tracking-[-0.02em]" },
  l: { button: "size-14", icon: "size-6", value: "text-[3rem] tracking-[-0.04em]" },
} as const;

export type NumberStepperProps = {
  /** `null` = vacío. */
  value: number | null;
  /** Se llama en vivo mientras se escribe un número válido; al salir del campo se recorta a min/max. */
  onChange: (value: number | null) => void;
  step: number;
  min?: number;
  max?: number;
  /** Se muestra debajo del número ("g", "años", "kg"). */
  unit?: string;
  /** Nombre accesible del número ("Cantidad en gramos"). */
  label: string;
  decrementLabel?: string;
  incrementLabel?: string;
  /** m = Metric M con botones de 44px (filas de un sheet) · l = Metric L con botones de 56px. */
  size?: "m" | "l";
  disabled?: boolean;
  maxDecimals?: number;
  id?: string;
  className?: string;
};

/**
 * −/+ para el caso común y el número grande para escribir: es un input que se ve como texto
 * (`data-metric-input` lo saca de la regla de 16px de mobile; siempre mide más que eso).
 */
export function NumberStepper({
  value,
  onChange,
  step,
  min,
  max,
  unit,
  label,
  decrementLabel,
  incrementLabel,
  size = "l",
  disabled = false,
  maxDecimals = 2,
  id,
  className,
}: NumberStepperProps) {
  // Texto mientras se escribe ("1," todavía no es un número que se pueda mostrar tal cual).
  const [draft, setDraft] = useState<string | null>(null);
  const styles = SIZES[size];
  const shown = draft ?? (value === null ? "" : formatDecimal(value, maxDecimals));
  const stepLabel = `${formatDecimal(step, maxDecimals)}${unit ? ` ${unit}` : ""}`;
  const current = draft === null ? value : parseDecimalInput(draft);

  function handleStep(direction: 1 | -1) {
    setDraft(null);
    onChange(stepNumber(current, direction, { step, min, max, maxDecimals }));
  }

  function handleInput(text: string) {
    setDraft(text);

    if (text.trim() === "") {
      onChange(null);
      return;
    }

    const parsed = parseDecimalInput(text);

    if (parsed !== null) {
      onChange(roundTo(parsed, maxDecimals));
    }
  }

  function commit() {
    if (draft === null) return;
    setDraft(null);

    const parsed = parseDecimalInput(draft);

    // Vacío ya se avisó al escribir; texto inválido vuelve al último valor válido.
    if (parsed === null) return;

    const next = clampNumber(roundTo(parsed, maxDecimals), min, max);

    if (next !== value) {
      onChange(next);
    }
  }

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <StepButton
        label={decrementLabel ?? `Restar ${stepLabel}`}
        className={styles.button}
        disabled={disabled || !canStep(current, -1, { min, max })}
        onClick={() => handleStep(-1)}
      >
        <Minus aria-hidden="true" className={styles.icon} />
      </StepButton>

      <span className="grid min-w-0 flex-1 justify-items-center leading-none">
        <input
          id={id}
          data-metric-input=""
          data-vaul-no-drag=""
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          aria-label={label}
          value={shown}
          placeholder="—"
          disabled={disabled}
          onChange={(event) => handleInput(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
          // El tamaño va primero: tailwind-merge descarta `leading-none` si el `text-[…]` viene después.
          className={cn(
            styles.value,
            "w-full min-w-0 rounded-lg bg-transparent text-center font-display font-bold leading-none tabular-nums text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-subtle)] focus-visible:shadow-[var(--focus-glow)] disabled:opacity-60",
          )}
        />
        {unit ? <span className="mt-1.5 text-[13px] text-[var(--foreground-muted)]">{unit}</span> : null}
      </span>

      <StepButton
        label={incrementLabel ?? `Sumar ${stepLabel}`}
        className={styles.button}
        disabled={disabled || !canStep(current, 1, { min, max })}
        onClick={() => handleStep(1)}
      >
        <Plus aria-hidden="true" className={styles.icon} />
      </StepButton>
    </div>
  );
}

function StepButton({
  label,
  className,
  disabled,
  onClick,
  children,
}: {
  label: string;
  className: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "pressable grid shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] outline-none focus-visible:shadow-[var(--focus-glow)] disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}
