"use client";

import Image from "next/image";
import { useEffect, useRef, type KeyboardEvent } from "react";

import { BODY_FAT_REFERENCES, type Gender } from "@/app/lib/nutrition-types";
import { cn } from "@/app/lib/utils";

type BodyFatOption = { value: number | null; range: string; label: string; description: string };

const UNKNOWN_OPTION: BodyFatOption = {
  value: null,
  range: "No lo sé",
  label: "Estimada",
  description: "Usamos tu peso, altura, edad y sexo para estimar.",
};

export function bodyFatImageSrc(gender: Gender, value: number) {
  return `/references/body-fat/${gender === "female" ? "female" : "male"}/${value}.png`;
}

/** Carrusel de referencias de grasa corporal (radiogroup horizontal, ←/→ con teclado). */
export function BodyFatCarousel({
  gender,
  value,
  onChange,
  disabled = false,
}: {
  gender: Gender;
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const options: BodyFatOption[] = [UNKNOWN_OPTION, ...BODY_FAT_REFERENCES[gender]];
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selected = options[selectedIndex];

  // Centra la opción elegida al abrir o al cambiar de sexo, sin mover otros contenedores.
  useEffect(() => {
    const list = listRef.current;
    const item = list?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!list || !item) return;
    list.scrollLeft = item.offsetLeft - (list.clientWidth - item.clientWidth) / 2;
  }, [gender]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (delta === 0) return;
    event.preventDefault();

    const nextIndex = Math.min(options.length - 1, Math.max(0, index + delta));
    onChange(options[nextIndex].value);
    const next = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[nextIndex];
    next?.focus();
    next?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={listRef}
        role="radiogroup"
        aria-label="Grasa corporal"
        aria-disabled={disabled || undefined}
        className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {options.map((option, index) => {
          const checked = index === selectedIndex;

          return (
            <button
              key={option.range}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={option.value === null ? "No lo sé" : `${option.range}, ${option.label}`}
              tabIndex={checked ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className="group relative flex w-[120px] shrink-0 snap-start flex-col items-center gap-1.5 rounded-[14px] outline-none disabled:opacity-50"
            >
              <span
                className={cn(
                  "grid h-[150px] w-[120px] place-items-center overflow-hidden rounded-[14px] border bg-[var(--card)] transition-colors group-focus-visible:shadow-[var(--focus-glow)]",
                  checked
                    ? "border-[var(--accent)] shadow-[0_0_0_1px_var(--accent)]"
                    : "border-[var(--border)]",
                )}
              >
                {option.value === null ? (
                  <span aria-hidden="true" className="font-display text-[1.75rem] font-bold text-[var(--foreground-subtle)]">
                    ?
                  </span>
                ) : (
                  <Image
                    src={bodyFatImageSrc(gender, option.value)}
                    alt=""
                    width={120}
                    height={138}
                    sizes="120px"
                    className="h-[138px] w-auto object-contain"
                  />
                )}
              </span>
              <span className="font-mono text-[13px] tabular-nums text-[var(--foreground)]">{option.range}</span>
              <span className="-mt-1 text-xs text-[var(--foreground-muted)]">{option.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-1.5">
        <p aria-live="polite" className="text-[15px] font-medium text-[var(--foreground)]">
          {selected.description}
        </p>
        <p className="text-[13px] leading-snug text-[var(--foreground-muted)]">
          Referencia ilustrativa. Con este dato el cálculo usa tu masa magra; con “No lo sé” usa peso, altura, edad y sexo.
        </p>
      </div>
    </div>
  );
}
