"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/app/components/ui/Button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/app/components/ui/Sheet";

type FilterSheetProps = {
  activeCount?: number;
  onClear?: () => void;
  children: ReactNode;
};

export function FilterSheet({ activeCount = 0, onClear, children }: FilterSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Button
        type="button"
        variant="outline"
        className="relative h-12 w-full rounded-xl border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal className="size-4" />
        Filtros
        {activeCount > 0 ? (
          <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-semibold text-white">
            {activeCount}
          </span>
        ) : null}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[88dvh] rounded-t-2xl">
          <SheetHeader className="border-b border-[var(--border)]">
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">{children}</div>

          <SheetFooter className="flex-row gap-3 border-t border-[var(--border)]">
            {onClear ? (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  onClear();
                }}
              >
                Limpiar
              </Button>
            ) : null}
            <Button type="button" className="flex-1" onClick={() => setOpen(false)}>
              Ver resultados
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
