"use client";

import Link from "next/link";
import { Check, List, Play } from "lucide-react";

import { Button } from "@/app/components/ui/Button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/app/components/ui/Drawer";
import { cn } from "@/app/lib/utils";

export type SheetExercise = {
  id: string;
  name: string;
  series: number;
  repetitions: string;
  done: boolean;
};

/** D3-a · botón de lista del hero → bottom sheet con los ejercicios del día. */
export function TodayExercisesSheet({
  title,
  description,
  href,
  ctaLabel,
  exercises,
  triggerLabel = "Ver ejercicios de hoy",
}: {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  exercises: SheetExercise[];
  triggerLabel?: string;
}) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label={triggerLabel}
          className="pressable grid size-14 shrink-0 place-items-center rounded-full bg-white/10 text-white hover:bg-white/15"
        >
          <List aria-hidden="true" className="size-[22px]" />
        </button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[85dvh]">
        <DrawerHeader className="px-5 pb-2 pt-3 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
          <DrawerTitle className="text-xl font-bold tracking-[-0.02em]">{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>

        <ol className="overflow-y-auto px-5">
          {exercises.map((exercise, index) => (
            <li
              key={exercise.id}
              className="grid min-h-12 grid-cols-[1.75rem_1fr_auto] items-center gap-2.5 border-t border-[var(--border)] text-[15px]"
            >
              {exercise.done ? (
                <Check aria-hidden="true" className="size-4 text-[var(--accent-bright)]" strokeWidth={3} />
              ) : (
                <span aria-hidden="true" className="font-mono text-xs text-[var(--foreground-muted)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
              )}
              <span
                className={cn(
                  "min-w-0 truncate",
                  exercise.done ? "text-[var(--foreground-muted)]" : "text-[var(--foreground)]",
                )}
              >
                {exercise.name}
                {exercise.done ? <span className="sr-only"> (hecho)</span> : null}
              </span>
              <span className="font-mono text-[13px] tabular-nums text-[var(--foreground-muted)]">
                {exercise.series}×{exercise.repetitions}
              </span>
            </li>
          ))}
        </ol>

        <DrawerFooter className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <Button asChild className="h-14 rounded-2xl text-base font-bold">
            <Link href={href}>
              <Play aria-hidden="true" className="size-4 fill-current" />
              {ctaLabel}
            </Link>
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
