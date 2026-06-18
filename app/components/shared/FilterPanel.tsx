"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { Button } from "@/app/components/ui/Button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/app/components/ui/Sheet";

export type FilterGroup = {
  /** Section heading displayed in the panel */
  label: string;
  options: { value: string; label: string }[];
  /** Currently selected value; use "all" to represent no filter */
  value: string;
  onChange: (value: string) => void;
};

type FilterPanelProps = {
  groups: FilterGroup[];
  /** Reset all groups to "all" */
  onClear: () => void;
};

/**
 * Compact filter button that opens a bottom Sheet with chip-based
 * single-select per group. Replaces the old FilterSheet + Select pattern.
 *
 * Usage:
 *   <div className="flex gap-2">
 *     <label className="relative flex-1"><Input .../></label>
 *     <FilterPanel groups={[...]} onClear={...} />
 *     <Button>+ Nuevo</Button>
 *   </div>
 */
export function FilterPanel({ groups, onClear }: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const activeCount = groups.filter((g) => g.value !== "all").length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Filtros${activeCount > 0 ? ` (${activeCount} activos)` : ""}`}
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#9aa3b8] transition-[background-color,color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        <SlidersHorizontal className="size-4" />
        {activeCount > 0 && (
          <span className="motion-empty-state absolute right-1.5 top-1.5 grid size-3.5 place-items-center rounded-full bg-[var(--accent)] text-[8px] font-bold leading-none text-white">
            {activeCount}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[80dvh] rounded-t-2xl border-t border-[var(--border)] bg-[var(--card)] p-0"
        >
          <SheetHeader className="border-b border-[var(--border)] px-5 py-4">
            <SheetTitle className="text-left text-base">Filtros</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-5 overflow-y-auto px-5 py-4">
            {groups.map((group) => (
              <div key={group.label} className="flex flex-col gap-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7887a6]">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => group.onChange("all")}
                    className={
                      group.value === "all"
                        ? "rounded-full border border-[var(--accent)] bg-[var(--accent)]/15 px-3 py-1.5 text-xs font-semibold text-white transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
                        : "rounded-full border border-[var(--border)] bg-[var(--card-alt)] px-3 py-1.5 text-xs font-semibold text-[#9aa3b8] transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-white active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
                    }
                  >
                    Todos
                  </button>
                  {group.options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => group.onChange(opt.value)}
                      className={
                        group.value === opt.value
                          ? "rounded-full border border-[var(--accent)] bg-[var(--accent)]/15 px-3 py-1.5 text-xs font-semibold text-white transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
                          : "rounded-full border border-[var(--border)] bg-[var(--card-alt)] px-3 py-1.5 text-xs font-semibold text-[#9aa3b8] transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-white active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-5 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClear}
              disabled={activeCount === 0}
              className="text-sm"
            >
              Limpiar filtros
            </Button>
            <Button type="button" onClick={() => setOpen(false)} className="text-sm">
              Ver resultados
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
