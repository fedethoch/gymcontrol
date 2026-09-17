"use client";

import { cn } from "@/app/lib/utils";
import { Check } from "lucide-react";

export type SetRow = {
  /** "40 × 10", "45s" o el placeholder de hoy si todavía no se cargó. */
  value: string;
  state: "done" | "current" | "pending";
};

/**
 * Z4 · series del ejercicio en columnas planas de alto fijo, con un segmento arriba como la barra de Z1:
 * la pantalla entra sin scroll con 2 a 5 series. Tocar una serie la vuelve la que se está cargando.
 */
export function SetList({
  rows,
  onSelect,
}: {
  rows: SetRow[];
  onSelect: (index: number) => void;
}) {
  return (
    <ol className="flex gap-2">
      {rows.map((row, index) => (
        <li key={index} className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onSelect(index)}
            aria-current={row.state === "current" ? "step" : undefined}
            aria-label={`Serie ${index + 1}${row.state === "done" ? " hecha" : ""}: ${row.value}`}
            className="pressable flex h-14 w-full flex-col items-center gap-1.5 rounded-lg outline-none focus-visible:shadow-[var(--focus-glow)] short:h-12 short:gap-1"
          >
            <span
              aria-hidden="true"
              className={cn(
                "h-[3px] w-full shrink-0 rounded-full",
                row.state === "done" && "bg-[var(--accent-bright)]",
                row.state === "current" && "bg-[var(--foreground)]",
                row.state === "pending" && "bg-[var(--border-strong)]"
              )}
            />
            <span
              aria-hidden="true"
              className={cn(
                "max-w-full truncate font-mono text-[13px] leading-tight tabular-nums",
                row.state === "done" && "text-[var(--foreground-muted)]",
                row.state === "current" && "text-[var(--foreground)]",
                row.state === "pending" && "text-[var(--foreground-subtle)]"
              )}
            >
              {row.value.replace(" × ", "×")}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "inline-flex items-center gap-1 text-[11px] leading-none",
                row.state === "done" && "text-[var(--accent-bright)]",
                row.state === "current" && "font-semibold text-[var(--foreground)]",
                row.state === "pending" && "text-[var(--foreground-muted)]"
              )}
            >
              {row.state === "done" ? <Check className="size-3" strokeWidth={3.2} /> : null}
              Serie {index + 1}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}
