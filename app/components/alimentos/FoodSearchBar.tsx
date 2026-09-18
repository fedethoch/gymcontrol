"use client";

import { ArrowDownUp, Search, X } from "lucide-react";
import { useId, type RefObject } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/DropdownMenu";
import { FOOD_SORT_LABELS, FOOD_SORTS, type FoodSort } from "@/app/lib/food-catalog";
import { cn } from "@/app/lib/utils";

/** Z2 · buscador fijo bajo la franja segura (64px) con el menú de orden (DESIGN.md §13.1; recetas §18.1). */
export function FoodSearchBar({
  inputRef,
  query,
  onQueryChange,
  sort,
  onSortChange,
  label = "Buscar alimentos",
  placeholder = "Buscar alimento",
  sortNote = "cada 100 g",
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  query: string;
  onQueryChange: (value: string) => void;
  sort: FoodSort;
  onSortChange: (value: FoodSort) => void;
  label?: string;
  placeholder?: string;
  /** Base de los órdenes por valor ("cada 100 g", "por porción"). */
  sortNote?: string;
}) {
  const inputId = useId();

  return (
    <div className="sticky top-[env(safe-area-inset-top)] z-10 -mx-4 mt-3 bg-[var(--background)] px-4 py-2">
      <div className="relative flex h-12 items-center">
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
        <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 size-[18px] text-[var(--foreground-muted)]" />
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            // "Buscar" cierra el teclado para ver los resultados (igual que el catálogo).
            if (event.key === "Enter" && !event.nativeEvent.isComposing) event.currentTarget.blur();
          }}
          className={cn(
            "h-12 w-full rounded-[14px] border border-[var(--border)] bg-[var(--card)] pl-10 text-base text-[var(--foreground)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[var(--foreground-subtle)] focus:border-[var(--accent)] focus:shadow-[var(--focus-glow)] motion-reduce:transition-none [&::-webkit-search-cancel-button]:appearance-none",
            query ? "pr-[5.75rem]" : "pr-12",
          )}
        />
        <div className="absolute right-0.5 flex items-center">
          {query ? (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => {
                onQueryChange("");
                inputRef.current?.focus();
              }}
              className="pressable grid size-11 place-items-center rounded-xl text-[var(--foreground-muted)] outline-none hover:text-[var(--foreground)] focus-visible:shadow-[var(--focus-glow)]"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          ) : null}
          <SortMenu sort={sort} onSortChange={onSortChange} note={sortNote} />
        </div>
      </div>
    </div>
  );
}

function SortMenu({ sort, onSortChange, note }: { sort: FoodSort; onSortChange: (value: FoodSort) => void; note: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Ordenar: ${FOOD_SORT_LABELS[sort]}`}
          className="pressable relative grid size-11 place-items-center rounded-xl text-[var(--foreground-muted)] outline-none hover:text-[var(--foreground)] focus-visible:shadow-[var(--focus-glow)] data-[state=open]:text-[var(--foreground)]"
        >
          <ArrowDownUp aria-hidden="true" className="size-[18px]" />
          {sort !== "relevance" ? (
            <span aria-hidden="true" className="absolute right-2 top-2 size-2 rounded-full bg-[var(--accent)]" />
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-60">
        <DropdownMenuLabel>Ordenar</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={sort}
          onValueChange={(value) => {
            const next = FOOD_SORTS.find((candidate) => candidate === value);
            if (next) onSortChange(next);
          }}
        >
          {FOOD_SORTS.map((value) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <span className="flex-1">{FOOD_SORT_LABELS[value]}</span>
              {value !== "relevance" ? (
                <span className="text-xs text-[var(--foreground-muted)]">{note}</span>
              ) : null}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
