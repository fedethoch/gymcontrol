"use client";

import Image from "next/image";

import type { Gender } from "@/app/lib/nutrition-types";
import { cn } from "@/app/lib/utils";

const BODY_FAT_VALUES = [12, 17, 22, 27, 33] as const;

export function BodyFatFigure({ gender, value, className }: { gender: Gender; value: number | null; className?: string }) {
  void gender;
  const known = value !== null && BODY_FAT_VALUES.includes(value as (typeof BODY_FAT_VALUES)[number]);

  return (
    <div className={cn("grid place-items-center rounded-xl border border-[var(--border)] bg-[var(--card)] p-4", className)}>
      {known ? (
        <Image
          src={`/references/body-fat/${value}.png`}
          alt={`Referencia visual de ${value}% de grasa corporal`}
          width={140}
          height={160}
          className="h-40 w-auto object-contain"
        />
      ) : (
        <div className="grid h-40 w-[140px] place-items-center rounded-lg border border-dashed border-[var(--border)] text-center text-xs text-[#7887a6]">
          Referencia ilustrativa
        </div>
      )}
      <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7887a6]">
        {known ? `${value}% graso aprox.` : "Referencia ilustrativa"}
      </p>
    </div>
  );
}
