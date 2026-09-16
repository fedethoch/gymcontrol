"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import { cn } from "@/app/lib/utils";

/** Foto del hero del home: sin título horneado, no necesita recorte. */
const FALLBACK_COVER = "/images/hero.png";

/**
 * Z1 · portada de la rutina a sangre detrás del encabezado (DESIGN.md §12.1).
 * Las portadas de plantilla traen el título horneado en el 27% superior: la imagen ocupa el 137% de la caja,
 * anclada abajo, y el recorte lo tapa. Parallax suave con el scroll de `.shell-main`.
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
        <div className={cn("absolute inset-x-0 bottom-0", imageUrl ? "h-[137%]" : "h-full")}>
          <Image
            alt=""
            fill
            priority
            sizes="100vw"
            src={imageUrl || FALLBACK_COVER}
            className={cn(
              "object-cover grayscale contrast-[1.15]",
              imageUrl ? "object-bottom brightness-[1.05]" : "object-[70%_30%] brightness-[0.8]",
            )}
          />
        </div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,7,11,0.8)_0%,rgba(5,7,11,0.2)_26%,rgba(5,7,11,0.15)_48%,rgba(5,7,11,0.85)_80%,var(--background)_100%)]" />
    </div>
  );
}
