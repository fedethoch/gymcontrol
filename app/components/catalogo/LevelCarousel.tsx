"use client";

import { useEffect, useId, useRef, useState } from "react";

import { CatalogFeatureCard } from "@/app/components/catalogo/CatalogFeatureCard";
import { carouselIndex, featureCtaTone, type CatalogRoutine, type SavedStatus } from "@/app/lib/routine-catalog";
import { cn } from "@/app/lib/utils";

/**
 * Estado Todas · una card por nivel con scroll-snap (DESIGN.md §16.1 Z4).
 * Solo la card visible puede llevar el CTA emerald.
 */
export function LevelCarousel({
  routines,
  statusById,
}: {
  routines: CatalogRoutine[];
  statusById: Record<string, SavedStatus>;
}) {
  const headingId = useId();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const [current, setCurrent] = useState(0);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  function updateCurrent() {
    window.clearTimeout(timerRef.current);
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const slides = Array.from(scroller.querySelectorAll<HTMLElement>("[data-slide]"));
    const first = slides[0]?.offsetLeft ?? 0;
    const offsets = slides.map((slide) => slide.offsetLeft - first);
    setCurrent(carouselIndex(offsets, scroller.scrollLeft, scroller.scrollWidth - scroller.clientWidth));
  }

  function handleScroll() {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(updateCurrent, 90);
  }

  return (
    <section aria-labelledby={headingId} className="grid gap-3">
      <h2
        id={headingId}
        className="font-display text-[1.375rem] font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)]"
      >
        Para cada nivel
      </h2>
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onScrollEnd={updateCurrent}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {routines.map((routine, index) => {
          const status = statusById[routine.id] ?? null;
          return (
            <div
              key={routine.id}
              data-slide=""
              className="relative flex w-[min(300px,calc(100%-2.5rem))] shrink-0 snap-start"
            >
              <CatalogFeatureCard
                routine={routine}
                status={status}
                ctaTone={featureCtaTone({ isCurrent: index === current, status })}
                className="w-full"
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div aria-hidden="true" className="flex items-center gap-1.5">
          {routines.map((routine, index) => (
            <span
              key={routine.id}
              className={cn(
                "h-1 rounded-full transition-colors duration-200 motion-reduce:transition-none",
                index === current ? "w-7 bg-[var(--foreground)]" : "w-[18px] bg-[var(--border-strong)]",
              )}
            />
          ))}
        </div>
        <p className="text-xs text-[var(--foreground-muted)]">Una por nivel</p>
      </div>
    </section>
  );
}
