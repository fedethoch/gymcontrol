"use client";

import { Dumbbell } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { SegmentedControl } from "@/app/components/ui/SegmentedControl";
import { useMediaQuery } from "@/app/components/ui/use-media-query";

type MediaView = "image" | "gif";

/**
 * Ilustración del ejercicio invertida a dark, como en el pager (§11.1 Z2).
 * La imagen es la vista por defecto; la animación se pide con el selector (T-D2) y no se ofrece con reduced-motion.
 */
export function ExerciseMedia({ imageUrl, gifUrl }: { imageUrl: string; gifUrl?: string | null }) {
  const [view, setView] = useState<MediaView>("image");
  const [failed, setFailed] = useState<Record<MediaView, boolean>>({ image: false, gif: false });
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const canAnimate = Boolean(gifUrl) && reduceMotion === false && !failed.gif;
  const current: MediaView = canAnimate ? view : "image";
  const src = current === "gif" ? gifUrl : imageUrl;
  const showImage = Boolean(src) && !failed[current];

  return (
    <div className="relative h-[216px] shrink-0 overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card)]">
      {showImage && src ? (
        <span aria-hidden="true" className="absolute inset-0 bg-white [filter:invert(1)_hue-rotate(180deg)]">
          <Image
            key={src}
            alt=""
            src={src}
            fill
            sizes="(max-width: 1023px) 100vw, 400px"
            unoptimized={current === "gif"}
            className="scale-[1.25] object-contain object-bottom p-2"
            onError={() => setFailed((state) => ({ ...state, [current]: true }))}
          />
        </span>
      ) : (
        <span className="grid h-full place-items-center text-[var(--foreground-subtle)]">
          <Dumbbell aria-hidden="true" className="size-8" />
          <span className="sr-only">Imagen no disponible</span>
        </span>
      )}

      {canAnimate ? (
        <SegmentedControl
          label="Vista del ejercicio"
          options={[
            { value: "image", label: "Imagen" },
            { value: "gif", label: "Animación" },
          ]}
          value={current}
          onChange={setView}
          className="absolute bottom-2.5 right-2.5 w-[196px] rounded-full border border-[var(--border)] bg-[rgba(5,7,11,0.86)] [&_button]:rounded-full [&_button>span:first-child]:rounded-full"
        />
      ) : null}
    </div>
  );
}
