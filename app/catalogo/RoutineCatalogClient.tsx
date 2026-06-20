"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState } from "react";

import { FilterPanel } from "@/app/components/shared/FilterPanel";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import {
  fadeUp,
  listItemHover,
  motion,
  staggerContainer,
  tapFeedback,
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
      <div className="flex items-center gap-2">
        <label className="relative flex h-12 flex-1 items-center">
          <span className="sr-only">Buscar rutinas</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#7d8697]" />
          <Input
            className="h-12 rounded-xl border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] pl-9"
            placeholder="Buscar por nombre o descripcion..."
            type="search"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
          />
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
                { value: "rows", label: "Más filas" },
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
              Ajusta la busqueda o los filtros para volver a la referencia visual completa.
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
              <span className="sr-only">Pagina anterior</span>
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
              <span className="sr-only">Pagina siguiente</span>
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
      whileHover={listItemHover}
      whileTap={tapFeedback}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,#111723_0%,#0b1017_100%)] shadow-[0_18px_40px_rgba(0,0,0,0.24)] transition-[border-color,box-shadow] duration-200 hover:border-[rgba(185,149,255,0.24)]"
    >
      <div className="relative h-28 overflow-hidden border-b border-[rgba(255,255,255,0.08)] bg-[#141a24] sm:h-40">
        {imageUrl ? (
          <Image
            alt={routine.name}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1536px) 33vw, 25vw"
            src={imageUrl}
          />
        ) : (
          <div className="thumb-fitness h-full w-full" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-[linear-gradient(180deg,transparent,rgba(5,7,11,0.86))]" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-2.5 pb-0 sm:gap-3 sm:p-4 sm:pb-0">
        <div className="flex flex-wrap items-start gap-x-2 gap-y-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#9ea7b9] sm:text-[11px] sm:tracking-[0.12em]">
          <span>{dayCount} dias</span>
          <span aria-hidden="true" className="text-[#556074]">
            /
          </span>
          <span>{itemCount} filas</span>
          <span aria-hidden="true" className="hidden text-[#556074] sm:inline">
            /
          </span>
          <span className="hidden sm:inline">{difficulty}</span>
          <span aria-hidden="true" className="hidden text-[#556074] sm:inline">
            /
          </span>
          <span className="hidden sm:inline">{objective}</span>
        </div>

        <div>
          <h3 className="font-display text-[13px] font-semibold tracking-[-0.04em] text-white sm:text-lg">
            {routine.name}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[10px] leading-4 text-[var(--foreground-muted)] sm:mt-2 sm:text-sm sm:leading-6">
            {routine.description || "Rutina semanal disponible para explorar."}
          </p>
        </div>

        <Button
          asChild
          size="sm"
          className="-mx-2.5 -mb-px mt-auto h-9 w-[calc(100%+1.25rem)] justify-between rounded-none border-x-0 border-b-0 border-t border-[rgba(185,149,255,0.2)] bg-[rgba(124,58,237,0.12)] px-2.5 text-white hover:bg-[rgba(124,58,237,0.18)] sm:-mx-4 sm:h-10 sm:w-[calc(100%+2rem)] sm:px-4"
        >
          <Link href={`/catalogo/rutinas/${routine.id}`}>
            <span className="text-[10px] sm:text-sm">Ver rutina</span>
            <ChevronRight className="size-3.5 sm:size-4" />
          </Link>
        </Button>
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
