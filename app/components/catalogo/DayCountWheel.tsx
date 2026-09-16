"use client";

import { useEffect, useLayoutEffect, useRef, type FocusEvent, type KeyboardEvent } from "react";

import {
  dayCountLabel,
  fractionalIndex,
  nextRadioIndex,
  wheelGlyph,
  type DayOption,
} from "@/app/lib/routine-catalog";
import { cn } from "@/app/lib/utils";

/** Sin `scrollend` (Safari viejo), el scroll se da por terminado tras esta pausa. */
const SETTLE_MS = 120;

function wheelItems(scroller: HTMLElement) {
  return Array.from(scroller.querySelectorAll<HTMLElement>("[data-wheel-item]"));
}

function measureCenters(scroller: HTMLElement) {
  return wheelItems(scroller).map((item) => item.offsetLeft + item.offsetWidth / 2);
}

function wheelPosition(scroller: HTMLElement, centers: readonly number[]) {
  return fractionalIndex(centers, scroller.scrollLeft + scroller.clientWidth / 2);
}

/** Escala y color de cada glifo según su distancia al centro, escritos directo en el DOM (sin re-render por frame). */
function paintGlyphs(scroller: HTMLElement, centers: readonly number[]) {
  const position = wheelPosition(scroller, centers);
  wheelItems(scroller).forEach((item, index) => {
    const glyph = item.querySelector<HTMLElement>("[data-glyph]");
    if (!glyph) return;
    const { scale, color } = wheelGlyph(index - position, item.dataset.kind === "word" ? "word" : "number");
    glyph.style.transform = `scale(${scale})`;
    glyph.style.color = color;
  });
}

function scrollToIndex(scroller: HTMLElement, centers: readonly number[], index: number, smooth: boolean) {
  const left = (centers[index] ?? 0) - scroller.clientWidth / 2;
  if (Math.abs(scroller.scrollLeft - left) <= 1) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  scroller.scrollTo({ left, behavior: smooth && !reduce ? "smooth" : "auto" });
}

/**
 * Z2 · rueda de días (DESIGN.md §16.3): `radiogroup` con scroll-snap y el número centrado en Metric XXL.
 * El scroll solo propone: el valor cambia al asentarse si lo movió el usuario, con tap o con teclado.
 * Solo `value` mueve el scroll (efecto de layout), así un lector de pantalla o un `focus()` no cambian el filtro.
 */
export function DayCountWheel({
  options,
  value,
  onChange,
  labelledBy,
}: {
  options: readonly DayOption[];
  value: DayOption;
  onChange: (value: DayOption) => void;
  labelledBy: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const centersRef = useRef<number[]>([]);
  const frameRef = useRef(0);
  const timerRef = useRef<number | undefined>(undefined);
  const touchingRef = useRef(false);
  const intentRef = useRef(false);
  const optionsKeyRef = useRef<string | null>(null);
  const latestRef = useRef({ options, value, onChange });

  const index = Math.max(0, options.indexOf(value));
  const optionsKey = options.join(",");
  const firstKind = options[0] === "all" ? "word" : "number";
  const lastKind = options.at(-1) === "all" ? "word" : "number";

  useLayoutEffect(() => {
    latestRef.current = { options, value, onChange };
    const scroller = scrollerRef.current;
    if (!scroller) return;
    centersRef.current = measureCenters(scroller);
    intentRef.current = false;
    // Primera vez o cambio de opciones: salto sin animación. Cambio de valor: animado.
    const jump = optionsKeyRef.current !== optionsKey;
    optionsKeyRef.current = optionsKey;
    scrollToIndex(scroller, centersRef.current, index, !jump);
    paintGlyphs(scroller, centersRef.current);
  }, [index, optionsKey, options, value, onChange]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const observer = new ResizeObserver(() => {
      centersRef.current = measureCenters(scroller);
      const latest = latestRef.current;
      scrollToIndex(scroller, centersRef.current, Math.max(0, latest.options.indexOf(latest.value)), false);
      paintGlyphs(scroller, centersRef.current);
    });
    observer.observe(scroller);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
      window.clearTimeout(timerRef.current);
    };
  }, []);

  function settle() {
    window.clearTimeout(timerRef.current);
    const scroller = scrollerRef.current;
    if (!scroller || touchingRef.current || !intentRef.current) return;
    intentRef.current = false;
    const latest = latestRef.current;
    const next = latest.options[Math.round(wheelPosition(scroller, centersRef.current))];
    if (next !== undefined && next !== latest.value) latest.onChange(next);
  }

  function scheduleSettle() {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(settle, SETTLE_MS);
  }

  function handleScroll() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => paintGlyphs(scroller, centersRef.current));
    scheduleSettle();
  }

  function handleSelect(nextIndex: number) {
    intentRef.current = false;
    const scroller = scrollerRef.current;
    const next = options[nextIndex];
    if (next !== value) {
      onChange(next);
    } else if (scroller) {
      scrollToIndex(scroller, centersRef.current, nextIndex, true);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    const nextIndex = nextRadioIndex(event.key, currentIndex, options.length);
    if (nextIndex === null) return;
    event.preventDefault();
    handleSelect(nextIndex);
    const scroller = scrollerRef.current;
    if (scroller) wheelItems(scroller)[nextIndex]?.focus({ preventScroll: true });
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current;
    if (!scroller || scroller.contains(event.relatedTarget as Node | null)) return;
    // Si un lector de pantalla desplazó la rueda sin elegir, vuelve al valor actual.
    if (Math.round(wheelPosition(scroller, centersRef.current)) !== index) {
      scrollToIndex(scroller, centersRef.current, index, true);
    }
  }

  function markIntent() {
    intentRef.current = true;
  }

  return (
    <div className="grid">
      <div
        ref={scrollerRef}
        role="radiogroup"
        aria-labelledby={labelledBy}
        onScroll={handleScroll}
        onScrollEnd={settle}
        onPointerDown={markIntent}
        onWheel={(event) => {
          if (event.deltaX !== 0) markIntent();
        }}
        onTouchStart={() => {
          touchingRef.current = true;
          markIntent();
        }}
        onTouchEnd={() => {
          touchingRef.current = false;
          scheduleSettle();
        }}
        onTouchCancel={() => {
          touchingRef.current = false;
          scheduleSettle();
        }}
        onBlur={handleBlur}
        className="relative -mx-4 flex h-28 snap-x snap-mandatory items-center overflow-x-auto overscroll-x-contain [mask-image:linear-gradient(90deg,transparent,#000_14%,#000_86%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <span
          aria-hidden="true"
          className={cn("shrink-0", firstKind === "word" ? "basis-[calc(50%-4.375rem)]" : "basis-[calc(50%-2.5rem)]")}
        />
        {options.map((option, optionIndex) => {
          const kind = option === "all" ? "word" : "number";
          const glyph = wheelGlyph(optionIndex - index, kind);
          const selected = optionIndex === index;
          return (
            <button
              key={String(option)}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option === "all" ? "Todas" : dayCountLabel(option)}
              tabIndex={selected ? 0 : -1}
              data-wheel-item=""
              data-kind={kind}
              onClick={() => handleSelect(optionIndex)}
              onKeyDown={(event) => handleKeyDown(event, optionIndex)}
              className={cn(
                "relative flex h-full shrink-0 snap-center items-center justify-center rounded-2xl outline-none focus-visible:shadow-[var(--focus-glow)]",
                kind === "word" ? "w-[8.75rem]" : "w-20",
              )}
            >
              {/* El tamaño va antes que `leading-*`: tailwind-merge descarta el leading si el tamaño viene después. */}
              <span
                aria-hidden="true"
                data-glyph=""
                style={{ transform: `scale(${glyph.scale})`, color: glyph.color }}
                className={cn(
                  kind === "word" ? "text-[3.25rem]" : "text-[7rem]",
                  "block shrink-0 origin-center whitespace-nowrap font-display font-extrabold leading-[0.85] tracking-[-0.06em] tabular-nums",
                )}
              >
                {option === "all" ? "Todas" : option}
              </span>
            </button>
          );
        })}
        <span
          aria-hidden="true"
          className={cn("shrink-0", lastKind === "word" ? "basis-[calc(50%-4.375rem)]" : "basis-[calc(50%-2.5rem)]")}
        />
      </div>
      <span aria-hidden="true" className="mx-auto mt-1 block h-1 w-7 rounded-full bg-[var(--foreground)]" />
      <p className="mt-2 text-center text-[13px] text-[var(--foreground-muted)]">
        {value === "all" ? "Deslizá para elegir días" : value === 1 ? "día por semana" : "días por semana"}
      </p>
    </div>
  );
}
