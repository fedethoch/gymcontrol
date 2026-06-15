"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  MoreHorizontal,
  Pencil,
  Search,
  SlidersHorizontal,
  Star,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useRef, useState, type ComponentType, type ReactNode } from "react";

import {
  deleteSavedRoutineAction,
  renameSavedRoutineAction,
  toggleActiveSavedRoutineAction,
} from "@/app/dashboard/actions";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/DropdownMenu";
import { Input } from "@/app/components/ui/Input";
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

  return (
    <section className="grid gap-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem_12rem]">
        <label className="relative block">
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

        <DashboardSelect value={objective} onValueChange={updateObjective}>
          <SelectItem value="all">
            <span className="inline-flex h-full w-full items-center justify-center gap-2">
              <Target className="size-4" />
              Todos los objetivos
            </span>
          </SelectItem>
          {Object.entries(ROUTINE_OBJECTIVE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </DashboardSelect>

        <DashboardSelect value={dayCount} onValueChange={updateDayCount}>
          <SelectItem value="all">
            <span className="inline-flex h-full w-full items-center justify-center gap-2">
              <CalendarDays className="size-4" />
              Todos los días
            </span>
          </SelectItem>
          {dayOptions.map((value) => (
            <SelectItem key={value} value={String(value)}>
              {value} días
            </SelectItem>
          ))}
        </DashboardSelect>
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
        <div className="grid gap-3 2xl:grid-cols-2">
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

function DashboardSelect({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-10 justify-center rounded-lg border-[#20283a] bg-[#080d17]/82 [&>span]:flex [&>span]:h-full [&>span]:flex-1 [&>span]:items-center [&>span]:overflow-visible">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
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
    <article className="grid overflow-hidden rounded-2xl border border-[#20283a] bg-[linear-gradient(145deg,#0d1322_0%,#080d17_100%)] shadow-[0_18px_42px_rgba(0,0,0,0.22)] lg:grid-cols-[12.5rem_minmax(0,1fr)] 2xl:grid-cols-[12.5rem_minmax(0,1fr)_11.5rem]">
      <div className="relative min-h-28 overflow-hidden border-b border-[#20283a] bg-[#111827] sm:min-h-40 lg:border-b-0 lg:border-r">
        {routine.coverImageUrl ? (
          <Image
            alt={routine.displayName}
            className="object-cover saturate-[0.82]"
            fill
            sizes="(max-width: 768px) 100vw, 220px"
            src={routine.coverImageUrl}
          />
        ) : (
          <div className="thumb-fitness h-full w-full" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,11,0.28),rgba(5,7,11,0.06)),linear-gradient(180deg,transparent_45%,rgba(5,7,11,0.75))]" />
      </div>

      <div className="min-w-0 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {isActive ? <Badge variant="accent">Activa</Badge> : null}
          <h3 className="font-display min-w-0 truncate text-xl font-semibold tracking-[-0.05em] text-white">
            {routine.displayName}
          </h3>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--foreground-muted)]">
          {routine.templateDescription || `Plantilla: ${routine.templateName}`}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <MetaPill icon={CalendarDays}>{routine.dayCount} días</MetaPill>
          <MetaPill icon={TrendingUp}>
            {ROUTINE_DIFFICULTY_LABELS[routine.difficulty]}
          </MetaPill>
          <MetaPill icon={SlidersHorizontal}>
            {ROUTINE_OBJECTIVE_LABELS[routine.objective]}
          </MetaPill>
        </div>
        <p className="mt-3 text-sm text-[#8790a5]">
          Guardada el: {routine.savedAtLabel}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-[#20283a] p-4 sm:grid-cols-[1fr_1fr_auto] lg:col-span-2 2xl:col-span-1 2xl:border-l 2xl:border-t-0 2xl:grid-cols-1 2xl:px-6">
        <Button asChild className="h-10 rounded-lg">
          <Link href={`/catalogo/rutinas/${routine.routineTemplateId}`}>
            {isActive ? <Star className="size-4" /> : null}
            Abrir
          </Link>
        </Button>

        <form action={toggleActiveSavedRoutineAction}>
          <input type="hidden" name="savedRoutineId" value={routine.id} />
          <Button
            type="submit"
            variant={isActive ? "secondary" : "outline"}
            className="h-10 w-full rounded-lg"
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
            <Button type="button" variant="outline" className="col-span-2 h-10 rounded-lg sm:col-span-1">
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

function MetaPill({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-[#20283a] bg-[#0a101c] px-2.5 py-1 text-xs font-medium text-[#b7bfce]">
      <Icon className="size-3.5 text-[#9a63ff]" />
      {children}
    </span>
  );
}
