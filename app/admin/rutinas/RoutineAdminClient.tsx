"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  Info,
  PencilLine,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { deleteRoutineAction, saveRoutineAction } from "@/app/admin/rutinas/actions";
import { FilterPanel } from "@/app/components/shared/FilterPanel";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/Dialog";
import { Input } from "@/app/components/ui/Input";
import { LoadingDots } from "@/app/components/ui/LoadingDots";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/Select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/app/components/ui/Sheet";
import { Textarea } from "@/app/components/ui/Textarea";
import type { ExerciseCatalogItem } from "@/app/lib/exercises";
import {
  INITIAL_ROUTINE_FORM_STATE,
  type RoutineFormDayPayload,
  type RoutineFormItemPayload,
  type RoutineFormState,
} from "@/app/lib/routine-form";
import {
  ROUTINE_DIFFICULTIES,
  ROUTINE_DIFFICULTY_LABELS,
  ROUTINE_OBJECTIVES,
  ROUTINE_OBJECTIVE_LABELS,
  type RoutineDifficulty,
  type RoutineObjective,
} from "@/app/lib/routine-metadata";
import type { AdminRoutineListItem } from "@/app/lib/routines";

type RoutineAdminClientProps = {
  initialExercises: ExerciseCatalogItem[];
  initialRoutines: AdminRoutineListItem[];
};

type SortColumn = "name" | "difficulty" | "objective" | "dayCount" | "usersCount" | "createdAt";
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 6;

const DIFFICULTY_BADGE_STYLES: Record<RoutineDifficulty, string> = {
  principiante: "border-[#255936] bg-[#13251a] text-[#d7f5df]",
  intermedio: "border-[#5b2ab3] bg-[#281a45] text-[#f4edff]",
  avanzado: "border-[#323949] bg-[#141a26] text-[#c0c8dc]",
};

const OBJECTIVE_BADGE_STYLES: Record<RoutineObjective, string> = {
  hipertrofia: "border-[#5b2ab3] bg-[#251740] text-[#eee0ff]",
  fuerza: "border-[#5a3c00] bg-[#221500] text-[#ffe09a]",
  mantenimiento: "border-[#255936] bg-[#101f15] text-[#b8f0c4]",
};

const OBJECTIVE_DOT_STYLES: Record<RoutineObjective, string> = {
  hipertrofia: "bg-[#b995ff]",
  fuerza: "bg-[#fbbf24]",
  mantenimiento: "bg-[#86efac]",
};

export function RoutineAdminClient({
  initialExercises,
  initialRoutines,
}: RoutineAdminClientProps) {
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<RoutineDifficulty | "all">("all");
  const [objectiveFilter, setObjectiveFilter] = useState<RoutineObjective | "all">("all");
  const [sortColumn, setSortColumn] = useState<SortColumn>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(0);

  const [formTarget, setFormTarget] = useState<
    { mode: "create" } | { mode: "edit"; routine: AdminRoutineListItem } | null
  >(null);
  const [formKey, setFormKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<AdminRoutineListItem | null>(null);

  const stats = useMemo(() => {
    const total = initialRoutines.length;
    const avgDays =
      total === 0
        ? 0
        : Math.round(
            (initialRoutines.reduce((sum, routine) => sum + routine.dayCount, 0) / total) * 10,
          ) / 10;
    const activeUsers = initialRoutines.reduce((sum, routine) => sum + routine.usersCount, 0);
    const withUsers = initialRoutines.filter((r) => r.usersCount > 0).length;

    return { total, avgDays, activeUsers, withUsers };
  }, [initialRoutines]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const rows = initialRoutines.filter((routine) => {
      if (
        normalizedSearch &&
        !`${routine.name} ${routine.description}`.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      if (difficultyFilter !== "all" && routine.difficulty !== difficultyFilter) {
        return false;
      }

      if (objectiveFilter !== "all" && routine.objective !== objectiveFilter) {
        return false;
      }

      return true;
    });

    return [...rows].sort((left, right) => {
      let cmp = 0;

      if (sortColumn === "name") {
        cmp = left.name.localeCompare(right.name, "es");
      } else if (sortColumn === "difficulty") {
        cmp = left.difficulty.localeCompare(right.difficulty, "es");
      } else if (sortColumn === "objective") {
        cmp = left.objective.localeCompare(right.objective, "es");
      } else if (sortColumn === "dayCount") {
        cmp = left.dayCount - right.dayCount;
      } else if (sortColumn === "usersCount") {
        cmp = left.usersCount - right.usersCount;
      } else {
        cmp = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      }

      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [initialRoutines, search, difficultyFilter, objectiveFilter, sortColumn, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageData = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  function toggleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setPage(0);
  }

  function handleFilterChange<T extends string>(setter: (value: T) => void, value: T) {
    setter(value);
    setPage(0);
  }

  function handleSaved(message: string) {
    setFormTarget(null);
    toast.success(message);
    router.refresh();
  }

  function confirmDelete() {
    if (!deleteTarget) return;

    startDeleteTransition(async () => {
      const result = await deleteRoutineAction(deleteTarget.id);

      if (!result.ok) {
        toast.error(result.message);
        setDeleteTarget(null);
        return;
      }

      toast.success("Rutina eliminada.");
      setDeleteTarget(null);
      router.refresh();
    });
  }

  const hasFilters = search.trim() !== "" || difficultyFilter !== "all" || objectiveFilter !== "all";
  const hasExercises = initialExercises.length > 0;

  return (
    <section className="page-frame dashboard-page-frame">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">
          Rutinas
        </h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StatTile icon={ClipboardList} value={stats.total} label="Total de rutinas" />
        <StatTile icon={CalendarDays} value={stats.avgDays} label="Promedio de dias" />
        <StatTile icon={Users} value={stats.activeUsers} label="Usuarios activos" />
        <StatTile icon={Dumbbell} value={stats.withUsers} label="Con usuarios" />
      </div>

      <div className="flex items-center gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Buscar rutina</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#7d8697]" />
          <Input
            className="h-11 rounded-xl border-[var(--border)] bg-[var(--card-alt)] pl-9"
            placeholder="Buscar rutina..."
            type="search"
            value={search}
            onChange={(event) => handleFilterChange(setSearch, event.target.value)}
          />
        </label>

        <FilterPanel
          groups={[
            {
              label: "Dificultad",
              options: ROUTINE_DIFFICULTIES.map((v) => ({
                value: v,
                label: ROUTINE_DIFFICULTY_LABELS[v],
              })),
              value: difficultyFilter,
              onChange: (v) =>
                handleFilterChange(setDifficultyFilter, v as typeof difficultyFilter),
            },
            {
              label: "Objetivo",
              options: ROUTINE_OBJECTIVES.map((v) => ({
                value: v,
                label: ROUTINE_OBJECTIVE_LABELS[v],
              })),
              value: objectiveFilter,
              onChange: (v) =>
                handleFilterChange(setObjectiveFilter, v as typeof objectiveFilter),
            },
          ]}
          onClear={() => {
            handleFilterChange(setDifficultyFilter, "all");
            handleFilterChange(setObjectiveFilter, "all");
          }}
        />

        <Button
          type="button"
          className="shrink-0"
          onClick={() => {
            setFormKey((value) => value + 1);
            setFormTarget({ mode: "create" });
          }}
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nueva rutina</span>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0 sm:p-0">
          {pageData.length === 0 ? (
            <div className="motion-empty-state grid min-h-72 place-items-center px-6 py-10 text-center">
              <div className="max-w-sm">
                <p className="font-display text-lg font-semibold text-white">
                  {hasFilters ? "Sin resultados" : "Todavia no hay rutinas"}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                  {hasFilters
                    ? "Proba cambiando los filtros o el termino de busqueda."
                    : 'Usa el boton "Nueva rutina" para agregar la primera.'}
                </p>
              </div>
            </div>
          ) : (
            <>
            <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-5 py-4 text-center sm:px-6">
                    <SortHeader label="Rutina" column="name" active={sortColumn} direction={sortDirection} onClick={() => toggleSort("name")} />
                  </th>
                  <th className="px-3 py-4 text-center">
                    <SortHeader label="Dificultad" column="difficulty" active={sortColumn} direction={sortDirection} onClick={() => toggleSort("difficulty")} center />
                  </th>
                  <th className="px-3 py-4 text-center">
                    <SortHeader label="Objetivo" column="objective" active={sortColumn} direction={sortDirection} onClick={() => toggleSort("objective")} center />
                  </th>
                  <th className="px-3 py-4 text-center">
                    <SortHeader label="Dias" column="dayCount" active={sortColumn} direction={sortDirection} onClick={() => toggleSort("dayCount")} center />
                  </th>
                  <th className="px-3 py-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8697]">
                    Ej./dia
                  </th>
                  <th className="px-3 py-4 text-center">
                    <SortHeader label="Usuarios" column="usersCount" active={sortColumn} direction={sortDirection} onClick={() => toggleSort("usersCount")} center />
                  </th>
                  <th className="px-3 py-4 text-center">
                    <SortHeader label="Creada" column="createdAt" active={sortColumn} direction={sortDirection} onClick={() => toggleSort("createdAt")} center />
                  </th>
                  <th className="px-5 py-4 text-right sm:px-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {pageData.map((routine) => {
                  const exercisesPerDay =
                    routine.dayCount === 0 ? 0 : Math.round(routine.itemCount / routine.dayCount);

                  return (
                    <tr key={routine.id} className="transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--card-alt)] motion-reduce:transition-none">
                      <td className="px-5 py-4 text-center sm:px-6">
                        <div className="mx-auto min-w-0 max-w-xs text-left">
                          <p className="truncate font-medium text-white">{routine.name}</p>
                          <p className="truncate text-xs text-[var(--foreground-muted)]">
                            {routine.description || "Sin descripcion."}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${DIFFICULTY_BADGE_STYLES[routine.difficulty]}`}
                        >
                          {ROUTINE_DIFFICULTY_LABELS[routine.difficulty]}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${OBJECTIVE_BADGE_STYLES[routine.objective]}`}
                        >
                          {ROUTINE_OBJECTIVE_LABELS[routine.objective]}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {Array.from({ length: routine.dayCount }, (_, index) => (
                            <span
                              key={index}
                              className={`size-2 rounded-full ${OBJECTIVE_DOT_STYLES[routine.objective]}`}
                            />
                          ))}
                          <span className="ml-1 text-xs text-[#7d8697]">{routine.dayCount}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center text-sm text-[#c2c8d6]">{exercisesPerDay}</td>
                      <td className="px-3 py-4 text-center text-sm text-[#c2c8d6]">{routine.usersCount}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-center text-sm text-[#7d8697]">
                        {routine.createdAtLabel}
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Editar"
                            onClick={() => {
                              setFormKey((value) => value + 1);
                              setFormTarget({ mode: "edit", routine });
                            }}
                          >
                            <PencilLine className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Eliminar"
                            className="hover:text-red-400"
                            onClick={() => setDeleteTarget(routine)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>

            <div className="grid gap-2 p-3 md:hidden">
              {pageData.map((routine) => {
                const exercisesPerDay =
                  routine.dayCount === 0 ? 0 : Math.round(routine.itemCount / routine.dayCount);

                return (
                  <div
                    key={routine.id}
                    className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card-alt)] p-3 transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{routine.name}</p>
                        <p className="truncate text-xs text-[var(--foreground-muted)]">
                          {routine.description || "Sin descripcion."}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-11"
                          title="Editar"
                          onClick={() => {
                            setFormKey((value) => value + 1);
                            setFormTarget({ mode: "edit", routine });
                          }}
                        >
                          <PencilLine className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-11 hover:text-red-400"
                          title="Eliminar"
                          onClick={() => setDeleteTarget(routine)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${DIFFICULTY_BADGE_STYLES[routine.difficulty]}`}
                      >
                        {ROUTINE_DIFFICULTY_LABELS[routine.difficulty]}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${OBJECTIVE_BADGE_STYLES[routine.objective]}`}
                      >
                        {ROUTINE_OBJECTIVE_LABELS[routine.objective]}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-[#7d8697]">Dias</p>
                        <p className="mt-1 font-medium text-white">{routine.dayCount}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-[#7d8697]">Ej./dia</p>
                        <p className="mt-1 font-medium text-white">{exercisesPerDay}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-[#7d8697]">Usuarios</p>
                        <p className="mt-1 font-medium text-white">{routine.usersCount}</p>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {pageCount > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={currentPage <= 0}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
          >
            <ChevronLeft className="size-4" />
            <span className="sr-only">Pagina anterior</span>
          </Button>
          {Array.from({ length: pageCount }, (_, index) => (
            <Button
              key={index}
              type="button"
              variant="outline"
              className={
                index === currentPage
                  ? "size-11 border-[rgba(139,92,246,0.7)] bg-[rgba(124,58,237,0.16)] px-0 text-white"
                  : "size-11 px-0"
              }
              onClick={() => setPage(index)}
            >
              {index + 1}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
          >
            <ChevronRight className="size-4" />
            <span className="sr-only">Pagina siguiente</span>
          </Button>
        </div>
      ) : null}

      <RoutineFormSheet
        key={formKey}
        open={formTarget !== null}
        routine={formTarget?.mode === "edit" ? formTarget.routine : null}
        initialExercises={initialExercises}
        hasExercises={hasExercises}
        onClose={() => setFormTarget(null)}
        onSaved={handleSaved}
      />

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent open={deleteTarget !== null}>
          <DialogHeader>
            <span className="grid size-11 place-items-center rounded-full border border-[#7a2630] bg-[#3b1419]/60 text-[#f87171]">
              <TriangleAlert className="size-5" />
            </span>
            <DialogTitle className="mt-3">Eliminar rutina</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de que queres eliminar{" "}
              <strong className="text-white">{deleteTarget?.name}</strong>? Esta accion no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 px-5 pb-5">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="default"
              className="bg-[#b91c1c] text-white hover:bg-[#991b1b]"
              disabled={isDeleting}
              onClick={confirmDelete}
            >
              {isDeleting ? <LoadingDots /> : <Trash2 className="size-4" />}
              Si, eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function StatTile({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof ClipboardList;
  value: number;
  label: string;
}) {
  return (
    <Card className="flex flex-col gap-2 p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#5b2ab3] bg-[#281a45] text-[var(--accent-bright)] sm:size-11">
          <Icon className="size-4 sm:size-5" />
        </span>
        <p className="font-display text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">
          {value}
        </p>
      </div>
      <p className="truncate text-xs text-[var(--foreground-muted)] sm:text-sm">{label}</p>
    </Card>
  );
}

function SortHeader({
  label,
  column,
  active,
  direction,
  onClick,
  center,
}: {
  label: string;
  column: SortColumn;
  active: SortColumn;
  direction: SortDirection;
  onClick: () => void;
  center?: boolean;
}) {
  const isActive = active === column;
  const Icon = isActive && direction === "asc" ? ChevronUp : ChevronDown;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
        center ? "w-full justify-center" : ""
      } ${isActive ? "text-white" : "text-[#7d8697] hover:text-white"}`}
    >
      {label}
      <Icon className="size-3" />
    </button>
  );
}

type RoutineFormSheetProps = {
  open: boolean;
  routine: AdminRoutineListItem | null;
  initialExercises: ExerciseCatalogItem[];
  hasExercises: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
};

function RoutineFormSheet({
  open,
  routine,
  initialExercises,
  hasExercises,
  onClose,
  onSaved,
}: RoutineFormSheetProps) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(() => routine?.name ?? "");
  const [description, setDescription] = useState(() => routine?.description ?? "");
  const [difficulty, setDifficulty] = useState<RoutineDifficulty | "">(
    () => routine?.difficulty ?? "",
  );
  const [objective, setObjective] = useState<RoutineObjective | "">(
    () => routine?.objective ?? "",
  );
  const [days, setDays] = useState<RoutineFormDayPayload[]>(() =>
    routine
      ? routine.days.map((day) => ({
          id: day.id,
          clientId: day.id,
          dayName: day.dayName,
          items: day.items.map((item) => ({
            id: item.id,
            clientId: item.id,
            exerciseId: item.exerciseId,
            series: String(item.series),
            repetitions: item.repetitions,
            rir: String(item.rir),
            rest: item.rest,
          })),
        }))
      : [createEmptyDay(1)],
  );
  const [serverState, setServerState] = useState<RoutineFormState>(INITIAL_ROUTINE_FORM_STATE);

  const isEditing = routine !== null;
  const submitDisabled = isPending || !hasExercises;

  function handleAddDay() {
    setDays((currentDays) => [...currentDays, createEmptyDay(currentDays.length + 1)]);
  }

  function handleRemoveDay(dayClientId: string) {
    setDays((currentDays) => currentDays.filter((day) => day.clientId !== dayClientId));
  }

  function handleDayNameChange(dayClientId: string, value: string) {
    setDays((currentDays) =>
      currentDays.map((day) =>
        day.clientId === dayClientId ? { ...day, dayName: value } : day,
      ),
    );
  }

  function handleAddItem(dayClientId: string) {
    setDays((currentDays) =>
      currentDays.map((day) =>
        day.clientId === dayClientId
          ? { ...day, items: [...day.items, createEmptyItem()] }
          : day,
      ),
    );
  }

  function handleRemoveItem(dayClientId: string, itemClientId: string) {
    setDays((currentDays) =>
      currentDays.map((day) =>
        day.clientId === dayClientId
          ? {
              ...day,
              items: day.items.filter((item) => item.clientId !== itemClientId),
            }
          : day,
      ),
    );
  }

  function handleItemFieldChange(
    dayClientId: string,
    itemClientId: string,
    field: keyof Omit<RoutineFormItemPayload, "clientId" | "id">,
    value: string,
  ) {
    setDays((currentDays) =>
      currentDays.map((day) =>
        day.clientId === dayClientId
          ? {
              ...day,
              items: day.items.map((item) =>
                item.clientId === itemClientId ? { ...item, [field]: value } : item,
              ),
            }
          : day,
      ),
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerState(INITIAL_ROUTINE_FORM_STATE);

    startTransition(async () => {
      const result = await saveRoutineAction({
        routineId: routine?.id,
        name,
        description,
        difficulty,
        objective,
        days,
      });

      if (result.status === "success") {
        onSaved(result.message ?? (isEditing ? "Rutina actualizada." : "Rutina guardada."));
        return;
      }

      setServerState(result);
    });
  }

  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent side="right" className="w-[min(48rem,96vw)]">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar rutina" : "Nueva rutina"}</SheetTitle>
          <p className="text-sm text-[var(--foreground-muted)]">
            El guardado persiste rutina, dias y filas en orden estable.
          </p>
        </SheetHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="grid flex-1 gap-5 overflow-y-auto px-5 py-2">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7d8697]">
              <Info className="size-3.5" />
              Informacion general
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                Nombre de la rutina
                <Input
                  name="name"
                  placeholder="Ej. Hipertrofia superior / inferior"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                {serverState.fieldErrors.name ? (
                  <span className="text-xs text-[#f8b4b4]">{serverState.fieldErrors.name}</span>
                ) : null}
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                Descripcion
                <Textarea
                  className="min-h-28 resize-none"
                  name="description"
                  placeholder="Contexto breve, enfoque o nivel sugerido."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
                {serverState.fieldErrors.description ? (
                  <span className="text-xs text-[#f8b4b4]">
                    {serverState.fieldErrors.description}
                  </span>
                ) : null}
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                Dificultad
                <Select
                  value={difficulty}
                  onValueChange={(value) => setDifficulty(value as RoutineDifficulty)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una dificultad" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROUTINE_DIFFICULTIES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {ROUTINE_DIFFICULTY_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {serverState.fieldErrors.difficulty ? (
                  <span className="text-xs text-[#f8b4b4]">
                    {serverState.fieldErrors.difficulty}
                  </span>
                ) : null}
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                Objetivo
                <Select
                  value={objective}
                  onValueChange={(value) => setObjective(value as RoutineObjective)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROUTINE_OBJECTIVES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {ROUTINE_OBJECTIVE_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {serverState.fieldErrors.objective ? (
                  <span className="text-xs text-[#f8b4b4]">
                    {serverState.fieldErrors.objective}
                  </span>
                ) : null}
              </label>
            </div>

            {!hasExercises ? (
              <div className="rounded-2xl border border-[#7a5a23] bg-[#2c2210]/70 px-4 py-3 text-sm text-[#f8dfaa]">
                Necesitas al menos un ejercicio cargado en `/admin/ejercicios` antes de guardar
                rutinas.
              </div>
            ) : null}

            <div className="h-px bg-[var(--border)]" />

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <CalendarDays className="size-4 text-[#9b87f0]" />
                  Semana editable
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">
                  Agrega dias y filas. El orden final se toma del orden visible.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={handleAddDay}>
                <Plus className="size-4" />
                Agregar dia
              </Button>
            </div>

            {serverState.structureErrors.days ? (
              <div className="rounded-2xl border border-[#7a2630] bg-[#3b1419]/60 px-4 py-3 text-sm text-[#ffd6db]">
                {serverState.structureErrors.days}
              </div>
            ) : null}

            <div className="grid gap-4">
              {days.length === 0 ? (
                <div className="motion-empty-state rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card-alt)] px-5 py-8 text-center">
                  <p className="font-display text-lg font-semibold text-white">Sin dias cargados</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                    Agrega el primer dia para empezar a construir la rutina.
                  </p>
                </div>
              ) : (
                days.map((day, dayIndex) => {
                  const dayErrors = serverState.structureErrors.dayErrors[day.clientId];

                  return (
                    <div
                      key={day.clientId}
                      className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-alt)]"
                    >
                      <div className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="accent">Dia {dayIndex + 1}</Badge>
                            <Badge variant="neutral">{day.items.length} filas</Badge>
                          </div>
                          <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                            Nombre visible del dia
                            <Input
                              placeholder={`Dia ${dayIndex + 1}`}
                              type="text"
                              value={day.dayName}
                              onChange={(event) =>
                                handleDayNameChange(day.clientId, event.target.value)
                              }
                            />
                            {dayErrors?.dayName ? (
                              <span className="text-xs text-[#f8b4b4]">{dayErrors.dayName}</span>
                            ) : null}
                          </label>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleAddItem(day.clientId)}
                          >
                            <Plus className="size-4" />
                            Agregar fila
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleRemoveDay(day.clientId)}
                          >
                            <Trash2 className="size-4" />
                            Quitar dia
                          </Button>
                        </div>
                      </div>

                      {dayErrors?.items ? (
                        <div className="border-b border-[#7a2630] bg-[#3b1419]/40 px-5 py-3 text-sm text-[#ffd6db]">
                          {dayErrors.items}
                        </div>
                      ) : null}

                      <div className="grid gap-3 p-5">
                        {day.items.map((item, itemIndex) => {
                          const itemErrors = dayErrors?.itemErrors[item.clientId] ?? {};

                          return (
                            <div
                              key={item.clientId}
                              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
                            >
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8697]">
                                  <Dumbbell className="size-3.5" />
                                  Fila {itemIndex + 1}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => handleRemoveItem(day.clientId, item.clientId)}
                                >
                                  <Trash2 className="size-4" />
                                  Quitar
                                </Button>
                              </div>

                              <div className="grid gap-3 lg:grid-cols-[2fr_0.7fr_0.9fr_0.7fr_0.9fr]">
                                <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                                  Ejercicio
                                  <Select
                                    value={item.exerciseId}
                                    onValueChange={(value) =>
                                      handleItemFieldChange(
                                        day.clientId,
                                        item.clientId,
                                        "exerciseId",
                                        value,
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecciona un ejercicio" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {initialExercises.map((exercise) => (
                                        <SelectItem key={exercise.id} value={exercise.id}>
                                          {exercise.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {itemErrors.exerciseId ? (
                                    <span className="text-xs text-[#f8b4b4]">
                                      {itemErrors.exerciseId}
                                    </span>
                                  ) : null}
                                </label>

                                <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                                  Series
                                  <Input
                                    inputMode="numeric"
                                    placeholder="4"
                                    type="text"
                                    value={item.series}
                                    onChange={(event) =>
                                      handleItemFieldChange(
                                        day.clientId,
                                        item.clientId,
                                        "series",
                                        event.target.value,
                                      )
                                    }
                                  />
                                  {itemErrors.series ? (
                                    <span className="text-xs text-[#f8b4b4]">
                                      {itemErrors.series}
                                    </span>
                                  ) : null}
                                </label>

                                <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                                  Repeticiones
                                  <Input
                                    placeholder="8-10"
                                    type="text"
                                    value={item.repetitions}
                                    onChange={(event) =>
                                      handleItemFieldChange(
                                        day.clientId,
                                        item.clientId,
                                        "repetitions",
                                        event.target.value,
                                      )
                                    }
                                  />
                                  {itemErrors.repetitions ? (
                                    <span className="text-xs text-[#f8b4b4]">
                                      {itemErrors.repetitions}
                                    </span>
                                  ) : null}
                                </label>

                                <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                                  RIR
                                  <Input
                                    inputMode="numeric"
                                    placeholder="2"
                                    type="text"
                                    value={item.rir}
                                    onChange={(event) =>
                                      handleItemFieldChange(
                                        day.clientId,
                                        item.clientId,
                                        "rir",
                                        event.target.value,
                                      )
                                    }
                                  />
                                  {itemErrors.rir ? (
                                    <span className="text-xs text-[#f8b4b4]">
                                      {itemErrors.rir}
                                    </span>
                                  ) : null}
                                </label>

                                <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                                  Descanso
                                  <Input
                                    placeholder="90s"
                                    type="text"
                                    value={item.rest}
                                    onChange={(event) =>
                                      handleItemFieldChange(
                                        day.clientId,
                                        item.clientId,
                                        "rest",
                                        event.target.value,
                                      )
                                    }
                                  />
                                  {itemErrors.rest ? (
                                    <span className="text-xs text-[#f8b4b4]">
                                      {itemErrors.rest}
                                    </span>
                                  ) : null}
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {serverState.status === "error" && serverState.message ? (
              <div className="rounded-2xl border border-[#7a2630] bg-[#3b1419]/60 px-4 py-3 text-sm text-[#ffd6db]">
                {serverState.message}
              </div>
            ) : null}
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t border-[var(--border)]">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button disabled={submitDisabled} type="submit">
              {isPending ? (
                <>
                  <LoadingDots />
                  Guardando...
                </>
              ) : isEditing ? (
                "Guardar cambios"
              ) : (
                "Crear rutina"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function createEmptyDay(order: number): RoutineFormDayPayload {
  return {
    clientId: crypto.randomUUID(),
    dayName: `Dia ${order}`,
    items: [createEmptyItem()],
  };
}

function createEmptyItem(): RoutineFormItemPayload {
  return {
    clientId: crypto.randomUUID(),
    exerciseId: "",
    series: "",
    repetitions: "",
    rir: "",
    rest: "",
  };
}
