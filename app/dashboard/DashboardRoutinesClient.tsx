"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";

import {
  deleteSavedRoutineAction,
  renameSavedRoutineAction,
  toggleActiveSavedRoutineAction,
} from "@/app/dashboard/actions";
import { FilterPanel } from "@/app/components/shared/FilterPanel";
import { Button } from "@/app/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/DropdownMenu";
import { Input } from "@/app/components/ui/Input";
import {
  ROUTINE_DIFFICULTY_LABELS,
  ROUTINE_OBJECTIVE_LABELS,
} from "@/app/lib/routine-metadata";
import type { SavedRoutineListItem } from "@/app/lib/saved-routines";

type DashboardRoutinesClientProps = {
  routines: SavedRoutineListItem[];
  activeRoutineId: string | null;
};

const PAGE_SIZE = 6;

export function DashboardRoutinesClient({
  routines,
  activeRoutineId,
}: DashboardRoutinesClientProps) {
  const [query, setQuery] = useState("");
  const [objective, setObjective] = useState<string>("all");
  const [dayCount, setDayCount] = useState<string>("all");
  const [page, setPage] = useState(1);

  const dayOptions = Array.from(new Set(routines.map((routine) => routine.dayCount))).sort(
    (left, right) => left - right,
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRoutines = routines.filter((routine) => {
    if (
      normalizedQuery &&
      !`${routine.displayName} ${routine.templateName} ${routine.templateDescription}`
        .toLowerCase()
        .includes(normalizedQuery)
    ) {
      return false;
    }

    if (objective !== "all" && routine.objective !== objective) {
      return false;
    }

    if (dayCount !== "all" && routine.dayCount !== Number(dayCount)) {
      return false;
    }

    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filteredRoutines.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleRoutines = filteredRoutines.slice(pageStart, pageStart + PAGE_SIZE);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function updateObjective(value: string) {
    setObjective(value);
    setPage(1);
  }

  function updateDayCount(value: string) {
    setDayCount(value);
    setPage(1);
  }

  function handleClearFilters() {
    updateObjective("all");
    updateDayCount("all");
  }

  return (
    <section className="grid gap-4">
      <div className="flex items-center gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Buscar mis rutinas</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#9a63ff]" />
          <Input
            className="h-10 rounded-lg border-[#20283a] bg-[#080d17]/82 pl-11"
            placeholder="Buscar mis rutinas..."
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
          />
        </label>

        <FilterPanel
          groups={[
            {
              label: "Objetivo",
              options: Object.entries(ROUTINE_OBJECTIVE_LABELS).map(([v, l]) => ({
                value: v,
                label: l,
              })),
              value: objective,
              onChange: updateObjective,
            },
            {
              label: "Días por semana",
              options: dayOptions.map((v) => ({
                value: String(v),
                label: `${v} días`,
              })),
              value: dayCount,
              onChange: updateDayCount,
            },
          ]}
          onClear={handleClearFilters}
        />
      </div>

      {visibleRoutines.length === 0 ? (
        <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-[#263047] bg-[#0b111f] px-6 py-10 text-center">
          <div className="max-w-md">
            <p className="font-display text-lg font-semibold text-white">
              No hay rutinas para mostrar
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Ajusta la busqueda o los filtros para volver a ver tus rutinas guardadas.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {visibleRoutines.map((routine) => (
            <DashboardRoutineCard
              key={routine.id}
              routine={routine}
              isActive={routine.id === activeRoutineId}
            />
          ))}
        </div>
      )}

      {filteredRoutines.length > 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 pt-2">
          <p className="text-sm text-[var(--foreground-muted)]">
            Mostrando {pageStart + 1} -{" "}
            {Math.min(pageStart + PAGE_SIZE, filteredRoutines.length)} de{" "}
            {filteredRoutines.length} rutinas
          </p>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeft className="size-4" />
              <span className="sr-only">Pagina anterior</span>
            </Button>
            <span className="grid size-10 place-items-center rounded-lg border border-[#6d40ef] bg-[#26144b] font-display text-sm font-semibold text-white">
              {currentPage}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              <ChevronRight className="size-4" />
              <span className="sr-only">Pagina siguiente</span>
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DashboardRoutineCard({
  routine,
  isActive,
}: {
  routine: SavedRoutineListItem;
  isActive: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const deleteFormRef = useRef<HTMLFormElement>(null);

  return (
    <article className="overflow-hidden rounded-2xl border border-[#20283a] bg-[linear-gradient(145deg,#0d1322_0%,#080d17_100%)] shadow-[0_18px_42px_rgba(0,0,0,0.22)]">
      <div className="relative min-h-40 overflow-hidden bg-[#111827]">
        {routine.coverImageUrl ? (
          <Image
            alt={routine.displayName}
            className="object-cover saturate-[0.82]"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            src={routine.coverImageUrl}
          />
        ) : (
          <div className="thumb-fitness h-full w-full" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(5,7,11,0.85))]" />
        {isActive ? (
          <span className="absolute left-2 top-2 z-10 size-2.5 rounded-full bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
        ) : null}
        <div className="absolute bottom-0 left-0 right-0 flex flex-wrap gap-1.5 p-3">
          <span className="inline-flex items-center gap-1 rounded-md bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <CalendarDays className="size-3" />
            {routine.dayCount} días
          </span>
          <span className="inline-flex items-center rounded-md bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            {ROUTINE_DIFFICULTY_LABELS[routine.difficulty]}
          </span>
          <span className="inline-flex items-center rounded-md bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            {ROUTINE_OBJECTIVE_LABELS[routine.objective]}
          </span>
        </div>
      </div>

      <div className="px-4 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <h3 className="font-display min-w-0 truncate text-base font-semibold tracking-[-0.05em] text-white">
            {routine.displayName}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 pb-4 pt-1">
        <Button asChild className="h-9 flex-1 rounded-lg">
          <Link href={`/catalogo/rutinas/${routine.routineTemplateId}`}>Abrir</Link>
        </Button>

        <form action={toggleActiveSavedRoutineAction} className="flex-1">
          <input type="hidden" name="savedRoutineId" value={routine.id} />
          <Button
            type="submit"
            variant={isActive ? "secondary" : "outline"}
            className="h-9 w-full rounded-lg"
          >
            <Check className="size-4" />
            {isActive ? "Desactivar" : "Activar"}
          </Button>
        </form>

        <DropdownMenu
          open={menuOpen}
          onOpenChange={(value) => {
            setMenuOpen(value);
            if (!value) setRenaming(false);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 border-0"
            >
              <MoreHorizontal className="size-5" />
              <span className="sr-only">Mas acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 p-3">
            {renaming ? (
              <form action={renameSavedRoutineAction} className="grid gap-2">
                <input type="hidden" name="savedRoutineId" value={routine.id} />
                <label
                  className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a63ff]"
                  htmlFor={`customName-${routine.id}`}
                >
                  Renombrar
                </label>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                  <Input
                    id={`customName-${routine.id}`}
                    name="customName"
                    defaultValue={routine.customName ?? ""}
                    maxLength={120}
                    placeholder={routine.templateName}
                    className="h-10 rounded-lg"
                    autoFocus
                  />
                  <Button type="submit" className="h-10 rounded-lg px-3">
                    Guardar
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 justify-start rounded-lg"
                  onClick={() => setRenaming(false)}
                >
                  Cancelar
                </Button>
              </form>
            ) : (
              <div className="grid gap-2">
                <DropdownMenuItem
                  className="h-10 text-white"
                  onSelect={(event) => {
                    event.preventDefault();
                    setRenaming(true);
                  }}
                >
                  <Pencil className="size-4" />
                  Renombrar
                </DropdownMenuItem>
                <form ref={deleteFormRef} action={deleteSavedRoutineAction}>
                  <input type="hidden" name="savedRoutineId" value={routine.id} />
                  <DropdownMenuItem
                    className="text-[#ffb4b4] focus:text-[#ffd1d1]"
                    onSelect={(event) => {
                      event.preventDefault();
                      deleteFormRef.current?.requestSubmit();
                    }}
                  >
                    <Trash2 className="size-4" />
                    Borrar
                  </DropdownMenuItem>
                </form>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}
