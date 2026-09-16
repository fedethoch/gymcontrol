"use client";

import { Search, X } from "lucide-react";
import type { MouseEvent, RefObject } from "react";

import { FilterTrigger } from "@/app/components/shared/FilterPanel";

export const CATALOG_ICON_BUTTON =
  "pressable grid size-11 shrink-0 place-items-center rounded-xl text-[var(--foreground-muted)] outline-none hover:bg-white/5 hover:text-[var(--foreground)] focus-visible:shadow-[var(--focus-glow)]";

/** Z1 · "Catálogo" + Buscar + Filtros; al buscar, campo de búsqueda + Filtros + Cancelar (DESIGN.md §16.1). */
export function CatalogTopBar({
  searchOpen,
  query,
  onQueryChange,
  onOpenSearch,
  onCloseSearch,
  inputRef,
  searchButtonRef,
  filterButtonRef,
  activeFilterCount,
  onOpenFilters,
}: {
  searchOpen: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  searchButtonRef: RefObject<HTMLButtonElement | null>;
  filterButtonRef: RefObject<HTMLButtonElement | null>;
  activeFilterCount: number;
  onOpenFilters: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  if (searchOpen) {
    return (
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          inputRef.current?.blur();
        }}
        className="flex min-h-14 items-center gap-1"
      >
        <label className="relative flex flex-1 items-center">
          <span className="sr-only">Buscar rutinas</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 size-[18px] text-[var(--foreground-muted)]"
          />
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Nombre o descripción"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                onCloseSearch();
              }
            }}
            className="h-11 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--card)] pl-10 pr-11 text-base text-[var(--foreground)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[var(--foreground-subtle)] focus:border-[var(--accent)] focus:shadow-[var(--focus-glow)] motion-reduce:transition-none [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query ? (
            <button
              type="button"
              aria-label="Borrar búsqueda"
              onClick={() => {
                onQueryChange("");
                inputRef.current?.focus();
              }}
              className="absolute right-0 grid size-11 place-items-center rounded-xl text-[var(--foreground-muted)] outline-none hover:text-[var(--foreground)] focus-visible:shadow-[var(--focus-glow)]"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          ) : null}
        </label>
        <FilterTrigger ref={filterButtonRef} activeCount={activeFilterCount} onClick={onOpenFilters} />
        <button
          type="button"
          onClick={onCloseSearch}
          className="pressable -mr-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-[var(--foreground)] outline-none focus-visible:shadow-[var(--focus-glow)]"
        >
          Cancelar
        </button>
      </form>
    );
  }

  return (
    <div className="flex min-h-14 items-center justify-between gap-3">
      <p className="text-[13px] font-medium text-[var(--foreground-muted)]">Catálogo</p>
      <div className="-mr-2 flex items-center">
        <button
          ref={searchButtonRef}
          type="button"
          aria-label="Buscar rutinas"
          onClick={onOpenSearch}
          className={CATALOG_ICON_BUTTON}
        >
          <Search aria-hidden="true" className="size-5" />
        </button>
        <FilterTrigger ref={filterButtonRef} activeCount={activeFilterCount} onClick={onOpenFilters} />
      </div>
    </div>
  );
}
