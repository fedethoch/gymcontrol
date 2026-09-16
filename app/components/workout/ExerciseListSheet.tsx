"use client";

import Image from "next/image";
import { Check, Dumbbell } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/app/components/ui/Drawer";
import { cn } from "@/app/lib/utils";

export type ExerciseListRow = {
  id: string;
  name: string;
  imageUrl: string;
  /** "3 × 8-10 · RIR 2" o, si ya se empezó, lo hecho. */
  meta: string;
  done: number;
  series: number;
  current: boolean;
};

/** Lista del día en bottom sheet: reemplaza la columna de cards y al pie deja "Terminar" neutro (D-D5). */
export function ExerciseListSheet({
  open,
  rows,
  doneSets,
  plannedSets,
  onOpenChange,
  onSelect,
  onFinish,
}: {
  open: boolean;
  rows: ExerciseListRow[];
  doneSets: number;
  plannedSets: number;
  onOpenChange: (open: boolean) => void;
  onSelect: (index: number) => void;
  onFinish: () => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85dvh]">
        <DrawerHeader className="px-4 pb-1 text-left">
          <DrawerTitle className="text-left font-display text-[1.375rem] font-bold tracking-[-0.02em]">
            {rows.length} ejercicios
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Ejercicios del día: tocá uno para ir a sus series.
          </DrawerDescription>
        </DrawerHeader>

        <ol className="overflow-y-auto px-4">
          {rows.map((row, index) => (
            <li key={row.id} className="border-b border-[var(--border)] last:border-b-0">
              <button
                type="button"
                onClick={() => onSelect(index)}
                className="pressable flex min-h-[60px] w-full items-center gap-3 text-left outline-none focus-visible:shadow-[var(--focus-glow)]"
              >
                <span className="relative grid size-[42px] shrink-0 place-items-center overflow-hidden rounded-[10px] border border-[var(--border)] bg-white text-[var(--foreground-subtle)] [filter:invert(1)_hue-rotate(180deg)]">
                  {row.imageUrl ? (
                    <Image alt="" src={row.imageUrl} fill sizes="42px" className="scale-[1.3] object-contain object-bottom p-0.5" />
                  ) : (
                    <Dumbbell aria-hidden="true" className="size-4" />
                  )}
                </span>

                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span
                    className={cn(
                      "truncate font-display text-[14px] font-semibold",
                      row.done >= row.series ? "text-[var(--foreground-muted)]" : "text-[var(--foreground)]",
                    )}
                  >
                    {row.name}
                  </span>
                  <span
                    className={cn(
                      "truncate text-[12px]",
                      row.current ? "text-[var(--accent-bright)]" : "text-[var(--foreground-muted)]",
                    )}
                  >
                    {row.current ? `Ahora · ${row.done}/${row.series}` : row.meta}
                  </span>
                </span>

                {row.done >= row.series ? (
                  <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
                    <Check aria-hidden="true" className="size-3.5" strokeWidth={3.2} />
                    <span className="sr-only">Completo</span>
                  </span>
                ) : (
                  <span className="shrink-0 font-mono text-[12px] tabular-nums text-[var(--foreground-muted)]">
                    {row.done}/{row.series}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ol>

        <div className="px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-3.5">
          <button
            type="button"
            onClick={onFinish}
            className="pressable flex h-[52px] w-full items-center justify-center rounded-2xl bg-white/10 text-[15px] font-semibold text-white outline-none hover:bg-white/15 focus-visible:shadow-[var(--focus-glow)]"
          >
            {doneSets >= plannedSets ? "Terminar entrenamiento" : `Terminar con ${doneSets} de ${plannedSets}`}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
