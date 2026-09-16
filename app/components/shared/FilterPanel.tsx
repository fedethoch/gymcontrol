"use client";

import { Check, SlidersHorizontal } from "lucide-react";
import { useId, type ComponentProps, type ReactNode, type RefObject } from "react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/app/components/ui/Drawer";
import { cn } from "@/app/lib/utils";

export type FilterOption = {
  value: string;
  label: string;
  /** Resultados si se elige esta opción. En 0 (y sin elegir) el chip se apaga. */
  count?: number;
};

export type FilterGroup = {
  /** Section heading displayed in the panel */
  label: string;
  options: FilterOption[];
  /** Currently selected value; use "all" to represent no filter */
  value: string;
  onChange: (value: string) => void;
  /** "sort": un orden, no un filtro. No muestra "Todos" ni cuenta como filtro activo. */
  kind?: "filter" | "sort";
};

type FilterPanelProps = {
  groups: FilterGroup[];
  /** Reset all groups to "all" */
  onClear: () => void;
  /** Texto del botón del pie, p. ej. "Ver 3 rutinas". Sin él: "Ver resultados". */
  resultLabel?: string;
};

export function countActiveFilters(groups: FilterGroup[]) {
  return groups.filter((group) => group.kind !== "sort" && group.value !== "all").length;
}

/**
 * Botón de filtros + bottom sheet (vaul) con chips por grupo (DESIGN.md §4, §16.3).
 *
 * Usage:
 *   <div className="flex gap-2">
 *     <label className="relative flex-1"><Input .../></label>
 *     <FilterPanel groups={[...]} onClear={...} />
 *   </div>
 *
 * Para abrirlo desde más de un botón, usar `FilterTrigger` + `FilterDrawer` controlado.
 */
export function FilterPanel({ groups, onClear, resultLabel }: FilterPanelProps) {
  return (
    <FilterDrawer groups={groups} onClear={onClear} resultLabel={resultLabel}>
      <FilterTrigger activeCount={countActiveFilters(groups)} />
    </FilterDrawer>
  );
}

export function FilterTrigger({
  activeCount,
  className,
  ...props
}: ComponentProps<"button"> & { activeCount: number }) {
  return (
    <button
      type="button"
      aria-label={
        activeCount > 0 ? `Filtros (${activeCount} ${activeCount === 1 ? "activo" : "activos"})` : "Filtros"
      }
      className={cn(
        "relative flex size-11 shrink-0 items-center justify-center rounded-xl text-[var(--foreground-muted)] outline-none transition-[background-color,color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/5 hover:text-[var(--foreground)] focus-visible:shadow-[var(--focus-glow)] active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100",
        className,
      )}
      {...props}
    >
      <SlidersHorizontal aria-hidden="true" className="size-5" />
      {activeCount > 0 ? (
        <span
          aria-hidden="true"
          className="motion-empty-state absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-[var(--accent)] text-[10px] font-bold leading-none text-[var(--accent-foreground)]"
        >
          {activeCount}
        </span>
      ) : null}
    </button>
  );
}

/** Sheet de filtros. Con `children` usa ese botón como trigger; si no, se controla con `open`. */
export function FilterDrawer({
  groups,
  onClear,
  resultLabel,
  open,
  onOpenChange,
  returnFocusRef,
  children,
}: FilterPanelProps & {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Controlado: a dónde vuelve el foco al cerrar. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  children?: ReactNode;
}) {
  const activeCount = countActiveFilters(groups);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} autoFocus>
      {children ? <DrawerTrigger asChild>{children}</DrawerTrigger> : null}
      <DrawerContent
        className="max-h-[85dvh] sm:mx-auto sm:w-full sm:max-w-[34rem]"
        onCloseAutoFocus={
          returnFocusRef
            ? (event) => {
                event.preventDefault();
                returnFocusRef.current?.focus();
              }
            : undefined
        }
      >
        <DrawerHeader className="flex-row items-center justify-between gap-3 px-5 pb-1 pt-3 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left md:gap-3">
          <DrawerTitle className="text-xl font-bold tracking-[-0.02em]">Filtros</DrawerTitle>
          <DrawerDescription className="sr-only">Elegí qué mostrar y en qué orden.</DrawerDescription>
          <button
            type="button"
            onClick={onClear}
            disabled={activeCount === 0}
            className="pressable -mr-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-[var(--accent-bright)] outline-none hover:text-[var(--accent-strong)] focus-visible:shadow-[var(--focus-glow)] disabled:pointer-events-none disabled:text-[var(--foreground-subtle)]"
          >
            Limpiar
          </button>
        </DrawerHeader>

        <div className="grid gap-6 overflow-y-auto px-5 pb-2 pt-3">
          {groups.map((group) => (
            <FilterGroupSection key={group.label} group={group} />
          ))}
        </div>

        <DrawerFooter className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <DrawerClose asChild>
            <button
              type="button"
              className="pressable flex h-14 w-full items-center justify-center rounded-2xl bg-[var(--foreground)] font-display text-base font-bold text-[var(--background)] outline-none hover:bg-white focus-visible:shadow-[var(--focus-glow)]"
            >
              {resultLabel ?? "Ver resultados"}
            </button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function FilterGroupSection({ group }: { group: FilterGroup }) {
  const labelId = useId();

  return (
    <div role="group" aria-labelledby={labelId} className="grid gap-2.5">
      <p id={labelId} className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">
        {group.label}
      </p>
      {group.kind === "sort" ? (
        <div className="grid">
          {group.options.map((option) => {
            const selected = group.value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => group.onChange(option.value)}
                className="pressable flex min-h-12 items-center justify-between gap-3 border-b border-[var(--border)] text-left text-[15px] outline-none last:border-b-0 focus-visible:shadow-[var(--focus-glow)]"
              >
                <span
                  className={
                    selected ? "font-semibold text-[var(--foreground)]" : "font-medium text-[var(--foreground-muted)]"
                  }
                >
                  {option.label}
                </span>
                {selected ? (
                  <Check aria-hidden="true" className="size-[18px] shrink-0 text-[var(--accent-bright)]" strokeWidth={2.5} />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <FilterChip label="Todos" selected={group.value === "all"} onSelect={() => group.onChange("all")} />
          {group.options.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              count={option.count}
              selected={group.value === option.value}
              onSelect={() => group.onChange(option.value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  count,
  selected,
  onSelect,
}: {
  label: string;
  count?: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={!selected && count === 0}
      onClick={onSelect}
      className={cn(
        "relative inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium outline-none transition-[background-color,border-color,color,opacity,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] before:absolute before:inset-x-0 before:-inset-y-0.5 before:content-[''] focus-visible:shadow-[var(--focus-glow)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none motion-reduce:active:scale-100",
        selected
          ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
          : "border-[var(--border-strong)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
      )}
    >
      {label}
      {count !== undefined ? (
        <span
          className={cn(
            "font-mono text-xs tabular-nums",
            selected ? "text-[var(--background)]/70" : "text-[var(--foreground-muted)]",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
