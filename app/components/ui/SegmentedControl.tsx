"use client";

import { useId, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { premiumEase } from "@/app/components/ui/motion";
import { cn } from "@/app/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

const NAV_KEYS = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"];

/** Elegir una de 2–3 opciones (radiogroup de 44px con indicador que se desliza). */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  className,
}: {
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}) {
  const markerId = useId();
  const reduceMotion = useReducedMotion();
  const enabled = options.filter((option) => !option.disabled);
  const checkedIndex = options.findIndex((option) => option.value === value);
  const focusIndex = checkedIndex >= 0 ? checkedIndex : options.findIndex((option) => !option.disabled);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, option: SegmentedOption<T>) {
    if (!NAV_KEYS.includes(event.key) || enabled.length === 0) return;
    event.preventDefault();

    const position = enabled.findIndex((candidate) => candidate.value === option.value);
    const next =
      event.key === "Home"
        ? enabled[0]
        : event.key === "End"
          ? enabled[enabled.length - 1]
          : enabled[
              (position + (event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1) + enabled.length) %
                enabled.length
            ];

    onChange(next.value);
    event.currentTarget.parentElement
      ?.querySelector<HTMLButtonElement>(`[data-value="${CSS.escape(next.value)}"]`)
      ?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={cn("grid h-11 rounded-xl bg-[var(--card)] p-[3px]", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option, index) => {
        const checked = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            data-value={option.value}
            tabIndex={index === focusIndex ? 0 : -1}
            disabled={disabled || option.disabled}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, option)}
            className={cn(
              "relative min-w-0 rounded-[9px] px-2 text-sm font-semibold outline-none transition-colors duration-200 focus-visible:shadow-[var(--focus-glow)] disabled:opacity-50",
              checked
                ? "text-[var(--foreground)]"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
            )}
          >
            {checked ? (
              <motion.span
                aria-hidden="true"
                layoutId={`segmented-${markerId}`}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: premiumEase }}
                className="absolute inset-0 rounded-[9px] bg-[var(--card-hover)]"
              />
            ) : null}
            <span className="relative block truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
