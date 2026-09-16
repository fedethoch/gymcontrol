"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";


type Chip<T extends string> = { value: T; label: string; count: number | null };

/** Z3 · filtro por origen o categoría como radios nativos (flechas y un solo tab stop). También en recetas. */
export function FoodChips<T extends string>({
  options,
  value,
  onChange,
  legend = "Filtrar alimentos",
}: {
  options: Chip<T>[];
  value: T;
  onChange: (value: T) => void;
  legend?: string;
}) {
  const name = useId();
  const reduceMotion = useReducedMotion();

  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{legend}</legend>
      <div className="-mx-4 flex gap-2 overflow-x-auto scroll-px-4 px-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <label key={option.value} className="relative shrink-0 cursor-pointer py-1">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <span className="relative flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] px-3.5 text-sm font-semibold text-[var(--foreground-muted)] transition-[color,border-color,transform] duration-150 active:scale-[0.97] peer-checked:border-transparent peer-checked:text-[var(--foreground)] peer-focus-visible:shadow-[var(--focus-glow)] motion-reduce:transition-none motion-reduce:active:scale-100">
                {selected ? (
                  <motion.span
                    aria-hidden="true"
                    layoutId={`${name}-marker`}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-[-1px] rounded-full border border-[var(--accent)] bg-[var(--accent)]/15"
                  />
                ) : null}
                <span className="relative">{option.label}</span>
                {option.count != null ? (
                  <span className="relative font-mono text-xs font-normal tabular-nums text-[var(--foreground-muted)]">
                    {option.count}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
