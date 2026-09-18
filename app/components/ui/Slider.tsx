"use client";

import { Slider as SliderPrimitive } from "radix-ui";

import { cn } from "@/app/lib/utils";

/**
 * Un valor en un rango (Radix Slider). La fila mide 44px de alto para el tap; `band` marca
 * debajo del track la franja recomendada y `color` pinta el relleno (tinta neutra por defecto).
 */
export function Slider({
  value,
  onChange,
  min,
  max,
  step,
  label,
  valueText,
  band,
  color,
  inverted = false,
  disabled = false,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  /** Nombre accesible del thumb. */
  label: string;
  /** Lectura del valor para lectores de pantalla ("172 g, 33%"). */
  valueText?: string;
  band?: readonly [number, number];
  color?: string;
  /** El máximo a la izquierda (el relleno crece hacia valores más chicos). */
  inverted?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const span = max - min || 1;
  const position = (raw: number) => {
    const pct = ((Math.min(max, Math.max(min, raw)) - min) / span) * 100;
    return inverted ? 100 - pct : pct;
  };
  const bandEdges = band ? [position(band[0]), position(band[1])].sort((a, b) => a - b) : null;

  return (
    <SliderPrimitive.Root
      value={[value]}
      onValueChange={([next]) => onChange(next)}
      min={min}
      max={max}
      step={step}
      inverted={inverted}
      disabled={disabled}
      // Dentro de un sheet, mover el thumb no arrastra el sheet.
      data-vaul-no-drag=""
      className={cn(
        "relative flex h-11 w-full touch-none select-none items-center data-[disabled]:opacity-50",
        className,
      )}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-[var(--border)]">
        <SliderPrimitive.Range
          className="absolute h-full rounded-full"
          style={{ backgroundColor: color ?? "var(--foreground-muted)" }}
        />
      </SliderPrimitive.Track>
      {bandEdges ? (
        <span
          aria-hidden="true"
          data-slot="slider-band"
          className="pointer-events-none absolute top-[calc(50%+7px)] h-[3px] rounded-full bg-[var(--foreground-subtle)]"
          style={{ left: `${bandEdges[0]}%`, right: `${100 - bandEdges[1]}%` }}
        />
      ) : null}
      <SliderPrimitive.Thumb
        aria-label={label}
        aria-valuetext={valueText}
        className="block size-6 rounded-full border-2 border-[var(--background)] bg-[var(--foreground)] shadow-[0_1px_4px_rgba(0,0,0,0.5)] outline-none transition-transform focus-visible:shadow-[var(--focus-glow)] active:scale-110 motion-reduce:transition-none"
      />
    </SliderPrimitive.Root>
  );
}
