"use client";

import Link from "next/link";
import { ChevronDown, Flame, Search } from "lucide-react";

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
import { MyRoutinesList, type MyRoutineRow } from "@/app/rutinas/MyRoutinesList";

/** Z1 · nombre de la rutina como título: abre "Mis rutinas". Racha a la derecha (DESIGN.md §12.1). */
export function RoutineSwitcher({
  displayName,
  caption,
  streak,
  routines,
}: {
  displayName: string;
  caption: string;
  streak: number;
  routines: MyRoutineRow[];
}) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-3">
      <Drawer>
        <DrawerTrigger asChild>
          <button
            type="button"
            className="pressable -ml-1 grid min-h-11 min-w-0 rounded-xl px-1 text-left outline-none focus-visible:shadow-[var(--focus-glow)]"
          >
            <span className="truncate text-[13px] font-medium text-[var(--foreground-muted)]">{caption}</span>
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate font-display text-[1.375rem] font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)]">
                {displayName}
              </span>
              <ChevronDown aria-hidden="true" className="size-[18px] shrink-0 text-[var(--foreground-muted)]" />
            </span>
            <span className="sr-only">Cambiar de rutina</span>
          </button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[85dvh]">
          <DrawerHeader className="px-5 pb-2 pt-3 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
            <DrawerTitle className="text-xl font-bold tracking-[-0.02em]">Mis rutinas</DrawerTitle>
            <DrawerDescription>Elegí cuál usar esta semana.</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-5">
            <MyRoutinesList routines={routines} withMenu />
          </div>
          <DrawerFooter className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <Button asChild variant="outline" className="h-12">
              <Link href="/catalogo">
                <Search aria-hidden="true" className="size-4" />
                Explorar catálogo
              </Link>
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {streak > 0 ? (
        <span className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-[rgba(5,7,11,0.62)] px-3.5 font-display text-sm font-bold tabular-nums text-[var(--foreground)]">
          <Flame aria-hidden="true" className="size-4 text-[#ff9a75]" />
          {streak}
          <span className="font-sans text-xs font-medium text-[var(--foreground-muted)]">sem</span>
          <span className="sr-only">
            {streak === 1 ? "seguida cumpliendo tu rutina" : "seguidas cumpliendo tu rutina"}
          </span>
        </span>
      ) : null}
    </div>
  );
}
