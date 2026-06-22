"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useState } from "react";

import { FilterPanel } from "@/app/components/shared/FilterPanel";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import {
  fadeUp,
  motion,
  premiumEase,
  staggerContainer,
} from "@/app/components/ui/motion";
import {
  ROUTINE_DIFFICULTY_LABELS,
  ROUTINE_OBJECTIVE_LABELS,
} from "@/app/lib/routine-metadata";
import type { RoutineTemplate } from "@/app/lib/routines";

type RoutineCatalogClientProps = {
  routines: RoutineTemplate[];
};

type SortOption = "recent" | "name" | "days" | "rows";

const PAGE_SIZE = 8;

export function RoutineCatalogClient({ routines }: RoutineCatalogClientProps) {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [objective, setObjective] = useState<string>("all");
  const [dayCount, setDayCount] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [currentPage, setCurrentPage] = useState(1);

  function handleQueryChange(value: string) {
    setQuery(value);
    setCurrentPage(1);
  }

  function handleFilterChange(setter: (value: string) => void, value: string) {
    setter(value);
    setCurrentPage(1);
  }

  function handleSortChange(value: string) {
    setSortBy(value as SortOption);
    setCurrentPage(1);
  }

  const normalizedQuery = query.trim().toLowerCase();
  const dayOptions = Array.from(new Set(routines.map((routine) => routine.days.length))).sort(
    (left, right) => left - right,
  );

  const filteredRoutines = routines
    .filter((routine) => {
      if (
        normalizedQuery &&
        !`${routine.name} ${routine.description}`.toLowerCase().includes(normalizedQuery)
      ) {
        return false;
      }

      if (difficulty !== "all" && routine.difficulty !== difficulty) {
        return false;
      }

      if (objective !== "all" && routine.objective !== objective) {
        return false;
      }

      if (dayCount !== "all" && routine.days.length !== Number(dayCount)) {
        return false;
      }

      return true;
    })
    .sort((left, right) => {
      if (sortBy === "name") {
        return left.name.localeCompare(right.name, "es");
      }

      if (sortBy === "days") {
        return right.days.length - left.days.length;
      }

      if (sortBy === "rows") {
        return getRoutineItemCount(right) - getRoutineItemCount(left);
      }

      return 0;
    });

  const total = filteredRoutines.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const pageStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE;
  const paginatedRoutines = filteredRoutines.slice(pageStart, pageStart + PAGE_SIZE);
  const visiblePages = getVisiblePages(page, totalPages);

  const activeFilterCount = [difficulty, objective, dayCount].filter(
    (value) => value !== "all",
  ).length;

  function handleClearFilters() {
    handleFilterChange(setDifficulty, "all");
    handleFilterChange(setObjective, "all");
    handleFilterChange(setDayCount, "all");
  }

  return (
    <section className="grid content-start gap-5">
      {/* Search + filter row */}
      <div className="flex items-center gap-2">
        <label className="relative flex h-12 flex-1 items-center rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] transition-[border-color] duration-200 focus-within:border-[rgba(139,92,246,0.5)] motion-reduce:transition-none">
          <span className="sr-only">Buscar rutinas</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#7d8697]" />
          <Input
            className="h-12 rounded-xl border-transparent bg-transparent pl-9 pr-9 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Buscar por nombre o descripción..."
            type="search"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
          />
          {query && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => handleQueryChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7d8697] transition-colors duration-150 hover:text-white motion-reduce:transition-none"
            >
              <X className="size-4" />
            </button>
          )}
        </label>

        <FilterPanel
          groups={[
            {
              label: "Dificultad",
              options: Object.entries(ROUTINE_DIFFICULTY_LABELS).map(([v, l]) => ({
                value: v,
                label: l,
              })),
              value: difficulty,
              onChange: (v) => handleFilterChange(setDifficulty, v),
            },
            {
              label: "Objetivo",
              options: Object.entries(ROUTINE_OBJECTIVE_LABELS).map(([v, l]) => ({
                value: v,
                label: l,
              })),
              value: objective,
              onChange: (v) => handleFilterChange(setObjective, v),
            },
            {
              label: "Días por semana",
              options: dayOptions.map((v) => ({
                value: String(v),
                label: `${v} días`,
              })),
              value: dayCount,
              onChange: (v) => handleFilterChange(setDayCount, v),
            },
            {
              label: "Ordenar por",
              options: [
                { value: "recent", label: "Recientes" },
                { value: "name", label: "Nombre A-Z" },
                { value: "days", label: "Más días" },
                { value: "rows", label: "Más ejercicios" },
              ],
              value: sortBy,
              onChange: handleSortChange,
            },
          ]}
          onClear={handleClearFilters}
        />
      </div>

      {paginatedRoutines.length === 0 ? (
        <div className="motion-empty-state grid min-h-[32rem] place-items-center rounded-2xl border border-dashed border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-6 py-10 text-center">
          <div className="max-w-md">
            <p className="font-display text-lg font-semibold text-white">
              No hay rutinas para mostrar
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Ajustá la búsqueda o los filtros para ver más opciones.
            </p>
          </div>
        </div>
      ) : (
        <>
          <motion.div
            key={page}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4"
          >
            {paginatedRoutines.map((routine) => (
              <motion.div key={routine.id} variants={fadeUp} className="h-full">
                <RoutineCatalogCard routine={routine} />
              </motion.div>
            ))}
          </motion.div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 rounded-xl border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)] text-[var(--foreground-muted)] hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="size-4" />
              <span className="sr-only">Página anterior</span>
            </Button>

            <div className="flex items-center gap-2">
              {visiblePages.map((pageNumber) => (
                <Button
                  key={pageNumber}
                  type="button"
                  variant="outline"
                  className={
                    pageNumber === page
                      ? "size-11 rounded-xl border-[rgba(139,92,246,0.7)] bg-[rgba(124,58,237,0.16)] px-0 text-base text-white hover:bg-[rgba(124,58,237,0.2)]"
                      : "size-11 rounded-xl border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)] px-0 text-base text-[var(--foreground-muted)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
                  }
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 rounded-xl border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)] text-[var(--foreground-muted)] hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-40"
              disabled={page >= totalPages}
              onClick={() =>
                setCurrentPage((current) => Math.min(totalPages, current + 1))
              }
            >
              <ChevronRight className="size-4" />
              <span className="sr-only">Página siguiente</span>
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

function RoutineCatalogCard({ routine }: { routine: RoutineTemplate }) {
  const dayCount = routine.days.length;
  const itemCount = getRoutineItemCount(routine);
  const imageUrl = getRoutineCoverImage(routine);
  const difficulty = ROUTINE_DIFFICULTY_LABELS[routine.difficulty];
  const objective = ROUTINE_OBJECTIVE_LABELS[routine.objective];

  return (
    <motion.article
      whileHover={{ y: -2, transition: { duration: 0.18, ease: premiumEase } }}
      whileTap={{
        scale: 0.98,
        boxShadow:
          "0 0 0 1px rgba(139,92,246,0.5), 0 0 24px rgba(124,58,237,0.25)",
        transition: { duration: 0.1, ease: premiumEase },
      }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,#111723_0%,#0b1017_100%)] shadow-[0_18px_40px_rgba(0,0,0,0.24)] transition-[border-color,box-shadow] duration-200 hover:border-[rgba(185,149,255,0.24)] motion-reduce:transition-none"
    >
      {/* Stretched link — makes the whole card clickeable */}
      <Link
        href={`/catalogo/rutinas/${routine.id}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgba(139,92,246,0.8)]"
        aria-label={`Ver rutina: ${routine.name}`}
      />

      {/* Cover image */}
      <div className="relative h-28 overflow-hidden border-b border-[rgba(255,255,255,0.08)] bg-[#141a24] sm:h-40">
        {imageUrl ? (
          <Image
            alt={routine.name}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04] group-active:scale-[1.04] motion-reduce:transition-none"
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1536px) 33vw, 25vw"
            src={imageUrl}
          />
        ) : (
          <div className="thumb-fitness h-full w-full" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-[linear-gradient(180deg,transparent,rgba(5,7,11,0.86))]" />
      </div>

      {/* Card body */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2.5 sm:gap-3 sm:p-4">
        {/* Title */}
        <h3 className="font-display text-[13px] font-semibold tracking-[-0.04em] text-white sm:text-base">
          {routine.name}
        </h3>

        {/* Chips: días + objetivo */}
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-2 py-0.5 text-[9px] font-semibold text-[#9ea7b9] sm:text-[11px]">
            {dayCount} días
          </span>
          <span className="rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(124,58,237,0.08)] px-2 py-0.5 text-[9px] font-semibold text-[#b89aff] sm:text-[11px]">
            {objective}
          </span>
        </div>

        {/* Meta: nivel · ejercicios */}
        <p className="text-[10px] text-[var(--foreground-muted)] sm:text-xs">
          {difficulty} · {itemCount} ejercicios
        </p>

        {/* CTA liviana — pointer-events-none, el link absoluto maneja el click */}
        <div className="pointer-events-none mt-auto flex items-center justify-between border-t border-[rgba(185,149,255,0.12)] pt-2">
          <span className="text-[10px] font-semibold text-[rgba(185,149,255,0.9)] sm:text-xs">
            Ver rutina
          </span>
          <ChevronRight className="size-3.5 text-[rgba(185,149,255,0.7)] transition-transform duration-150 group-active:translate-x-0.5 motion-reduce:transition-none sm:size-4" />
        </div>
      </div>
    </motion.article>
  );
}

function getRoutineItemCount(routine: RoutineTemplate) {
  return routine.days.reduce((total, day) => total + day.items.length, 0);
}

function getRoutineCoverImage(routine: RoutineTemplate) {
  return routine.imageUrl || routine.days[0]?.items[0]?.exercise.imageUrl || "";
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const maxVisible = 3;

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.min(
    Math.max(1, currentPage - 1),
    totalPages - maxVisible + 1,
  );

  return Array.from({ length: maxVisible }, (_, index) => start + index);
}
