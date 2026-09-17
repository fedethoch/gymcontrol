"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, TrendingUp } from "lucide-react";

import { cn } from "@/app/lib/utils";

export type StepperField = {
  field: "kg" | "reps" | "secs";
  unit: string;
  label: string;
  value: string;
  placeholder: string;
  allowDecimal: boolean;
};

/**
 * Z3 · serie actual: el número grande se toca para escribirlo y −/+ hace el caso común (D-D3).
 * El valor mostrado es lo escrito o, si está vacío, el placeholder de hoy en tono apagado.
 */
export function SetFocus({
  setLabel,
  previousLabel,
  suggestion,
  fields,
  onChange,
  onStep,
}: {
  setLabel: string;
  previousLabel: string;
  suggestion: string | null;
  fields: StepperField[];
  onChange: (field: StepperField["field"], value: string) => void;
  onStep: (field: StepperField["field"], direction: 1 | -1) => void;
}) {
  return (
    <div className="grid gap-3 border-y border-[var(--border)] py-3.5 short:gap-2 short:py-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">
          {setLabel}
        </p>
        <p className="truncate text-[12px] text-[var(--foreground-muted)]">{previousLabel}</p>
      </div>

      <div className={cn("grid", fields.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
        {fields.map((field, index) => (
          <div
            key={field.field}
            className={cn(
              "flex items-center justify-between gap-2",
              index > 0 && "border-l border-[var(--border)] pl-3.5",
              index === 0 && fields.length > 1 && "pr-3.5",
            )}
          >
            <StepButton label={`Bajar ${field.label}`} onClick={() => onStep(field.field, -1)}>
              <Minus aria-hidden="true" className="size-5" />
            </StepButton>
            <StepperValue field={field} onChange={(value) => onChange(field.field, value)} />
            <StepButton label={`Subir ${field.label}`} onClick={() => onStep(field.field, 1)}>
              <Plus aria-hidden="true" className="size-5" />
            </StepButton>
          </div>
        ))}
      </div>

      {suggestion ? (
        <p className="flex items-start gap-2 text-[13px] leading-[1.35] text-[var(--foreground)]">
          <TrendingUp aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--accent-bright)]" />
          {suggestion}
        </p>
      ) : null}
    </div>
  );
}

function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="pressable grid size-11 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] outline-none focus-visible:shadow-[var(--focus-glow)]"
    >
      {children}
    </button>
  );
}

/** El número es un input: se ve como texto grande y abre el teclado numérico solo al tocarlo. */
function StepperValue({ field, onChange }: { field: StepperField; onChange: (value: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const empty = field.value.length === 0;
  // Metric L (3rem) cuando entra; si no, achica al ancho que queda entre los botones. En Sora bold
  // tabular un dígito mide 0.636em y el separador 0.233em; como mínimo se cuentan 2 dígitos para que
  // el número no salte al escribir. Nunca baja de 16px.
  const textEm = [...(field.value || field.placeholder || "—")].reduce(
    (total, char) => total + (/\d/.test(char) ? 0.636 : char === "." || char === "," ? 0.233 : 0.874),
    0,
  );
  const fontSize = `clamp(1rem, calc(100cqw / ${(Math.max(textEm, 1.272) * 1.04).toFixed(3)}), 3rem)`;

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.select();
  }, [editing]);

  return (
    <span className="@container grid min-w-0 flex-1 justify-items-center leading-none">
      <input
        ref={inputRef}
        data-metric-input=""
        style={{ fontSize }}
        inputMode={field.allowDecimal ? "decimal" : "numeric"}
        aria-label={field.label}
        value={field.value}
        placeholder={field.placeholder || "—"}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setEditing(true)}
        onBlur={() => setEditing(false)}
        className={cn(
          "h-[3rem] w-full bg-transparent text-center font-display font-bold leading-none tracking-[-0.04em] tabular-nums outline-none",
          "placeholder:text-[var(--foreground-subtle)]",
          empty ? "text-[var(--foreground-subtle)]" : "text-[var(--foreground)]",
        )}
      />
      <span className="mt-1 text-[12px] text-[var(--foreground-muted)]">{field.unit}</span>
    </span>
  );
}
