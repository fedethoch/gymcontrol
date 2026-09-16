"use client";

import { useEffect, useRef } from "react";

import { RoutineCoverImage } from "@/app/components/shared/RoutineCoverImage";

/**
 * Z1 · portada de la rutina a sangre detrás del encabezado (DESIGN.md §12.1).
 * El recorte del título horneado vive en `RoutineCoverImage`. Parallax suave con el scroll de `.shell-main`.
 */
export function RoutineCover({ imageUrl }: { imageUrl: string }) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const scroller = layer?.closest(".shell-main");
    if (!layer || !scroller || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const offset = Math.min(scroller.scrollTop, 600) * 0.35;
        layer.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(540px,72svh)] overflow-hidden"
    >
      <div ref={layerRef} className="absolute inset-0 will-change-transform">
        <RoutineCoverImage imageUrl={imageUrl} sizes="100vw" priority />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,7,11,0.8)_0%,rgba(5,7,11,0.2)_26%,rgba(5,7,11,0.15)_48%,rgba(5,7,11,0.85)_80%,var(--background)_100%)]" />
    </div>
  );
}
