"use client";

import { Dumbbell, History, Info } from "lucide-react";
import Image from "next/image";

/**
 * Z2 · ilustración del ejercicio invertida a dark (D-D2): las imágenes vienen sobre fondo blanco,
 * el filtro las pasa a figura clara sobre negro manteniendo el rojo de los músculos.
 * El filtro vive en una capa propia: los chips de arriba conservan sus colores.
 */
export function ExerciseStage({
  imageUrl,
  name,
  position,
  hasHistory,
  onTechnique,
  onHistory,
}: {
  imageUrl: string;
  name: string;
  position: string;
  hasHistory: boolean;
  onTechnique: () => void;
  onHistory: () => void;
}) {
  return (
    <div className="relative h-[clamp(140px,22svh,184px)] overflow-hidden rounded-[20px] border border-[var(--border)]">
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-white [filter:invert(1)_hue-rotate(180deg)]"
      >
        {imageUrl ? (
          <Image
            alt=""
            src={imageUrl}
            fill
            sizes="(max-width: 1023px) 100vw, 400px"
            className="scale-[1.3] object-contain object-bottom p-2"
            priority
          />
        ) : null}
      </span>

      {imageUrl ? null : (
        <span className="grid h-full place-items-center text-[var(--foreground-subtle)]">
          <Dumbbell aria-hidden="true" className="size-8" />
        </span>
      )}

      <span className="absolute bottom-2.5 left-2.5 rounded-full bg-[rgba(5,7,11,0.82)] px-2.5 py-1 font-mono text-[12px] text-[var(--foreground)]">
        {position}
      </span>

      <div className="absolute bottom-2.5 right-2.5 flex gap-1.5">
        {hasHistory ? (
          <StageChip label={`Ver historial de ${name}`} onClick={onHistory}>
            <History aria-hidden="true" className="size-4" />
            Historial
          </StageChip>
        ) : null}
        <StageChip label={`Ver técnica de ${name}`} onClick={onTechnique}>
          <Info aria-hidden="true" className="size-4" />
          Técnica
        </StageChip>
      </div>
    </div>
  );
}

function StageChip({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="pressable inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-[rgba(5,7,11,0.82)] px-3 text-[13px] font-medium text-[var(--foreground)] outline-none focus-visible:shadow-[var(--focus-glow)]"
    >
      {children}
    </button>
  );
}
