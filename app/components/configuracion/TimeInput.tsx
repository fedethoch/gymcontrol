"use client";

import { normalizeTime } from "@/app/lib/notifications";
import { cn } from "@/app/lib/utils";

/** Con mouse el control invisible no abre su selector al hacer click: se pide. En táctil ya abre la rueda. */
function openTimePicker(input: HTMLInputElement) {
  if (!window.matchMedia("(pointer: fine)").matches) return;

  try {
    input.showPicker?.();
  } catch {
    // Ya abierto, o el navegador no lo permite: queda el teclado.
  }
}

/**
 * Hora del aviso. La pastilla muestra HH:MM (formato de la app, no el del celu: con reloj de 12 h iOS escribe
 * "10:00 AM" y no entra) y se ajusta al texto. Encima, un `<input type="time">` invisible con área táctil de
 * 44px abre la rueda del sistema.
 */
export function TimeInput({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label
      className={cn(
        "relative inline-flex h-9 shrink-0 items-center rounded-[10px] border border-[var(--border)] px-2.5 font-mono text-[15px] tabular-nums transition-colors focus-within:shadow-[var(--focus-glow)]",
        disabled
          ? "text-[var(--foreground-subtle)]"
          : "bg-[var(--card)] text-[var(--foreground)] active:bg-[var(--card-alt)]",
      )}
    >
      <span aria-hidden="true">{value}</span>
      <input
        type="time"
        aria-label={label}
        value={value}
        disabled={disabled}
        data-vaul-no-drag=""
        onChange={(event) => onChange(normalizeTime(event.target.value, value))}
        onClick={(event) => openTimePicker(event.currentTarget)}
        // 34px de contenido (36 menos el borde) + 5px arriba y abajo = 44px táctiles.
        className="absolute inset-x-0 -inset-y-[5px] cursor-pointer appearance-none opacity-0 disabled:cursor-default"
      />
    </label>
  );
}
