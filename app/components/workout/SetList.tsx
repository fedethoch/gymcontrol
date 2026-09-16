"use client";

import { cn } from "@/app/lib/utils";
import { Check } from "lucide-react";

export type SetRow = {
  /** "40 × 10", "45s" o el placeholder de hoy si todavía no se cargó. */
  value: string;
  state: "done" | "current" | "pending";
};

/** Z4 · series del ejercicio. Tocar una fila la vuelve la serie que se está cargando. */
export function SetList({
  rows,
  onSelect,
}: {
  rows: SetRow[];
  onSelect: (index: number) => void;
}) {
  return (
    <ol className="grid">
      {rows.map((row, index) => (
        <li key={index}>
          <button
            type="button"
            onClick={() => onSelect(index)}
            aria-current={row.state === "current" ? "step" : undefined}
            className="pressable flex min-h-10 w-full items-center gap-3 text-left outline-none focus-visible:shadow-[var(--focus-glow)]"
          >
            {row.state === "done" ? (
              <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
                <Check
                  aria-hidden="true"
                  className="size-3.5"
                  strokeWidth={3.2}
                />
                <span className="sr-only">Serie {index + 1} hecha:</span>
              </span>
            ) : (
              <span
                aria-hidden="true"
                className={cn(
                  "size-[22px] shrink-0 rounded-full border",
                  row.state === "current"
                    ? "border-2 border-[var(--foreground)]"
                    : "border-[var(--border-strong)]"
                )}
              />
            )}

            <span
              className={cn(
                "flex-1 font-mono text-[14px] tabular-nums",
                row.state === "done" && "text-[var(--foreground-muted)]",
                row.state === "current" && "text-[var(--foreground)]",
                row.state === "pending" && "text-[var(--foreground-subtle)]"
              )}
            >
              {row.value}
            </span>

            {row.state === "current" ? (
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-bright)]">
                Ahora
              </span>
            ) : null}
          </button>
        </li>
      ))}
    </ol>
  );
}
