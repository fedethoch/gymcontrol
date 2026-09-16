"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

import { fadeScale, motion } from "@/app/components/ui/motion";
import { cn } from "@/app/lib/utils";

export type OptionItem<T extends string> = {
  value: T;
  label: string;
  hint: string;
  lead?: ReactNode;
  trailing?: ReactNode;
};

const NEXT_KEYS = ["ArrowDown", "ArrowRight"];
const PREV_KEYS = ["ArrowUp", "ArrowLeft"];

/** Elegir una opción entre filas de 72px con check (radiogroup, ↑/↓ con teclado). */
export function OptionList<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  options: OptionItem<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const checkedIndex = options.findIndex((option) => option.value === value);
  const focusIndex = checkedIndex >= 0 ? checkedIndex : 0;

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const delta = NEXT_KEYS.includes(event.key) ? 1 : PREV_KEYS.includes(event.key) ? -1 : 0;
    if (delta === 0) return;
    event.preventDefault();

    const next = options[(index + delta + options.length) % options.length];
    onChange(next.value);
    listRef.current?.querySelector<HTMLButtonElement>(`[data-value="${CSS.escape(next.value)}"]`)?.focus();
  }

  return (
    <div
      ref={listRef}
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className="border-t border-[var(--border)]"
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
            disabled={disabled}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className="flex min-h-[72px] w-full items-center gap-3 border-b border-[var(--border)] py-3 text-left outline-none transition-colors active:bg-[var(--card)] focus-visible:shadow-[var(--focus-glow)] disabled:opacity-50"
          >
            {option.lead ? (
              <span aria-hidden="true" className="grid w-6 shrink-0 place-items-center">
                {option.lead}
              </span>
            ) : null}
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="text-[15px] font-medium text-[var(--foreground)]">{option.label}</span>
              <span className="text-pretty text-[13px] leading-snug text-[var(--foreground-muted)]">{option.hint}</span>
            </span>
            {option.trailing ? <span className="shrink-0 text-right">{option.trailing}</span> : null}
            <span
              aria-hidden="true"
              className={cn(
                "grid size-[22px] shrink-0 place-items-center rounded-full border-2 transition-colors",
                checked
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "border-[var(--border-strong)]",
              )}
            >
              <AnimatePresence initial={false}>
                {checked ? (
                  <motion.span key="check" variants={fadeScale} initial="hidden" animate="visible" exit="exit">
                    <Check className="size-3.5" strokeWidth={3} />
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </span>
          </button>
        );
      })}
    </div>
  );
}
