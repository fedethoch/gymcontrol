"use client";

import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/app/lib/utils";

/**
 * Prendido/apagado (Radix Switch). Track de 44×26 dentro de un área táctil de 48×44;
 * `--accent` prendido, `--border-strong` apagado (DESIGN.md §15.2 S7).
 */
export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Nombre accesible (el switch no tiene texto propio). */
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={label}
      data-vaul-no-drag=""
      className={cn(
        "group inline-flex h-11 w-12 shrink-0 items-center justify-center rounded-full outline-none disabled:opacity-50 [&:focus-visible>span]:shadow-[var(--focus-glow)]",
        className,
      )}
    >
      <span className="relative block h-[26px] w-11 rounded-full bg-[var(--border-strong)] transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[state=checked]:bg-[var(--accent)] motion-reduce:transition-none">
        <SwitchPrimitive.Thumb className="absolute left-0.5 top-0.5 block size-[22px] rounded-full bg-[var(--foreground)] shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] data-[state=checked]:translate-x-[18px] motion-reduce:transition-none" />
      </span>
    </SwitchPrimitive.Root>
  );
}
