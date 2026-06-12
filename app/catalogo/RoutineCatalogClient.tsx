"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { fadeUp, motion, staggerContainer } from "@/app/components/ui/motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/Select";
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

  return (
    <section className="grid gap-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,0.7fr))]">
        <label className="relative block">
          <span className="sr-only">Buscar rutinas</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7d8697]" />
          <Input
            className="h-12 rounded-xl border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] pl-9"
            placeholder="Buscar por nombre o descripcion..."
            type="search"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
          />
        </label>

        <CatalogSelect
          value={difficulty}
          placeholder="Dificultad"
          onValueChange={(value) => handleFilterChange(setDifficulty, value)}
        >
          <SelectItem value="all">Todas</SelectItem>
          {Object.entries(ROUTINE_DIFFICULTY_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </CatalogSelect>

        <CatalogSelect
          value={objective}
          placeholder="Objetivo"
          onValueChange={(value) => handleFilterChange(setObjective, value)}
        >
          <SelectItem value="all">Todos</SelectItem>
          {Object.entries(ROUTINE_OBJECTIVE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </CatalogSelect>

        <CatalogSelect
          value={dayCount}
          placeholder="Dias"
          onValueChange={(value) => handleFilterChange(setDayCount, value)}
        >
          <SelectItem value="all">Todos los dias</SelectItem>
          {dayOptions.map((value) => (
            <SelectItem key={value} value={String(value)}>
              {value} dias
            </SelectItem>
          ))}
        </CatalogSelect>

        <CatalogSelect
          value={sortBy}
          placeholder="Ordenar"
          onValueChange={handleSortChange}
        >
          <SelectItem value="recent">Recientes</SelectItem>
          <SelectItem value="name">Nombre A-Z</SelectItem>
          <SelectItem value="days">Mas dias</SelectItem>
          <SelectItem value="rows">Mas filas</SelectItem>
        </CatalogSelect>
      </div>

      {paginatedRoutines.length === 0 ? (
        <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-6 py-10 text-center">
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
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          >
            {paginatedRoutines.map((routine) => (
              <motion.div key={routine.id} variants={fadeUp}>
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

function CatalogSelect({
  value,
  placeholder,
  onValueChange,
  children,
}: {
  value: string;
  placeholder: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-12 rounded-xl border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

function RoutineCatalogCard({ routine }: { routine: RoutineTemplate }) {
  const dayCount = routine.days.length;
  const itemCount = getRoutineItemCount(routine);
  const imageUrl = getRoutineCoverImage(routine);
  const difficulty = ROUTINE_DIFFICULTY_LABELS[routine.difficulty];
  const objective = ROUTINE_OBJECTIVE_LABELS[routine.objective];

  return (
    <article className="group flex min-h-[32rem] flex-col overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,#111723_0%,#0b1017_100%)] shadow-[0_18px_40px_rgba(0,0,0,0.24)] transition-transform duration-200 hover:-translate-y-0.5 hover:border-[rgba(185,149,255,0.24)]">
      <div className="relative h-[22rem] overflow-hidden border-b border-[rgba(255,255,255,0.08)] bg-[#141a24]">
        {imageUrl ? (
          <Image
            alt={routine.name}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 25vw"
            src={imageUrl}
          />
        ) : (
          <div className="thumb-fitness h-full w-full" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(5,7,11,0.86))]" />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9ea7b9]">
          <span>{dayCount} dias</span>
          <span aria-hidden="true" className="text-[#556074]">
            /
          </span>
          <span>{itemCount} filas</span>
          <span aria-hidden="true" className="text-[#556074]">
            /
          </span>
          <span>{difficulty}</span>
          <span aria-hidden="true" className="text-[#556074]">
            /
          </span>
          <span>{objective}</span>
        </div>

        <div>
          <h3 className="font-display text-lg font-semibold tracking-[-0.04em] text-white">
            {routine.name}
          </h3>
          <p className="mt-2 line-clamp-4 text-sm leading-6 text-[var(--foreground-muted)]">
            {routine.description || "Rutina semanal disponible para explorar."}
          </p>
        </div>

        <Button
          asChild
          className="mt-auto w-full justify-between rounded-xl border border-[rgba(185,149,255,0.2)] bg-[rgba(124,58,237,0.12)] text-white hover:bg-[rgba(124,58,237,0.18)]"
        >
          <Link href={`/catalogo/rutinas/${routine.id}`}>
            Ver rutina
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

function getRoutineItemCount(routine: RoutineTemplate) {
  return routine.days.reduce((total, day) => total + day.items.length, 0);
}

function getRoutineCoverImage(routine: RoutineTemplate) {
  return routine.days[0]?.items[0]?.exercise.imageUrl || "";
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
