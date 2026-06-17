"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Dumbbell,
  ImagePlus,
  Info,
  Lightbulb,
  Link as LinkIcon,
  ListOrdered,
  LoaderCircle,
  PencilLine,
  Plus,
  Search,
  Sparkles,
  Tags,
  Target,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { deleteExerciseAction, saveExerciseAction } from "@/app/admin/ejercicios/actions";
import { ExerciseDetailModal } from "@/app/components/shared/ExerciseDetailModal";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/Table";
import { Textarea } from "@/app/components/ui/Textarea";
import {
  EXERCISE_IMAGE_ACCEPT,
  EXERCISE_IMAGE_BUCKET,
} from "@/app/lib/exercise-config";
import {
  EXERCISE_EQUIPMENT_OPTIONS,
  EXERCISE_MUSCLE_GROUPS,
  INITIAL_EXERCISE_FORM_STATE,
  MUSCLE_BADGE_STYLES,
  MUSCLE_GRADIENTS,
  equipmentLabel,
  muscleLabel,
  type ExerciseFormState,
} from "@/app/lib/exercise-form";
import type { AdminExerciseListItem } from "@/app/lib/exercises";
import { validateExerciseImageFile } from "@/app/lib/exercise-validation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { cn } from "@/app/lib/utils";

type ExerciseAdminClientProps = {
  initialExercises: AdminExerciseListItem[];
};

type SortColumn = "name" | "muscleGroup" | "equipment" | "createdAt";
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 8;


export function ExerciseAdminClient({ initialExercises }: ExerciseAdminClientProps) {
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("all");
  const [equipFilter, setEquipFilter] = useState("all");
  const [sortColumn, setSortColumn] = useState<SortColumn>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(0);

  const [drawer, setDrawer] = useState<{ mode: "create" } | { mode: "edit"; exercise: AdminExerciseListItem } | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<AdminExerciseListItem | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<AdminExerciseListItem | null>(null);

  const [weekAgo] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000);

  const stats = useMemo(() => {
    const thisWeek = initialExercises.filter(
      (exercise) => new Date(exercise.createdAt).getTime() >= weekAgo,
    ).length;
    const groups = new Set(
      initialExercises.map((exercise) => exercise.muscleGroup).filter(Boolean),
    ).size;
    const equip = new Set(
      initialExercises.map((exercise) => exercise.equipment).filter(Boolean),
    ).size;

    return { total: initialExercises.length, thisWeek, groups, equip };
  }, [initialExercises, weekAgo]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const rows = initialExercises.filter((exercise) => {
      if (
        normalizedSearch &&
        !`${exercise.name} ${exercise.description}`.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      if (muscleFilter !== "all" && exercise.muscleGroup !== muscleFilter) {
        return false;
      }

      if (equipFilter !== "all" && exercise.equipment !== equipFilter) {
        return false;
      }

      return true;
    });

    return [...rows].sort((left, right) => {
      let cmp = 0;

      if (sortColumn === "name") {
        cmp = left.name.localeCompare(right.name, "es");
      } else if (sortColumn === "muscleGroup") {
        cmp = (left.muscleGroup ?? "").localeCompare(right.muscleGroup ?? "", "es");
      } else if (sortColumn === "equipment") {
        cmp = (left.equipment ?? "").localeCompare(right.equipment ?? "", "es");
      } else {
        cmp = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      }

      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [initialExercises, search, muscleFilter, equipFilter, sortColumn, sortDirection]);

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

  function handleFilterChange(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(0);
  }

  function handleSaved(message: string) {
    setDrawer(null);
    toast.success(message);
    router.refresh();
  }

  function confirmDelete() {
    if (!deleteTarget) return;

    startDeleteTransition(async () => {
      const result = await deleteExerciseAction(deleteTarget.id);

      if (!result.ok) {
        toast.error(result.message);
        setDeleteTarget(null);
        return;
      }

      toast.success("Ejercicio eliminado.");
      setDeleteTarget(null);
      router.refresh();
    });
  }

  const hasFilters = search.trim() !== "" || muscleFilter !== "all" || equipFilter !== "all";

  return (
    <section className="page-frame dashboard-page-frame">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">
          Ejercicios
        </h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StatTile icon={Dumbbell} value={stats.total} label="Total de ejercicios" />
        <StatTile icon={Sparkles} value={stats.thisWeek} label="Agregados esta semana" />
        <StatTile icon={Target} value={stats.groups} label="Grupos musculares" />
        <StatTile icon={Tags} value={stats.equip} label="Tipos de equipamiento" />
      </div>

      <div className="flex items-center gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Buscar ejercicio</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#7d8697]" />
          <Input
            className="h-11 rounded-xl border-[var(--border)] bg-[var(--card-alt)] pl-9"
            placeholder="Buscar ejercicio..."
            type="search"
            value={search}
            onChange={(event) => handleFilterChange(setSearch, event.target.value)}
          />
        </label>

        <FilterPanel
          groups={[
            {
              label: "Grupo muscular",
              options: EXERCISE_MUSCLE_GROUPS.map((g) => ({
                value: g,
                label: muscleLabel(g) ?? g,
              })),
              value: muscleFilter,
              onChange: (v) => handleFilterChange(setMuscleFilter, v),
            },
            {
              label: "Equipamiento",
              options: EXERCISE_EQUIPMENT_OPTIONS.map((o) => ({
                value: o,
                label: equipmentLabel(o) ?? o,
              })),
              value: equipFilter,
              onChange: (v) => handleFilterChange(setEquipFilter, v),
            },
          ]}
          onClear={() => {
            handleFilterChange(setMuscleFilter, "all");
            handleFilterChange(setEquipFilter, "all");
          }}
        />

        <Button
          type="button"
          className="shrink-0"
          onClick={() => {
            setFormKey((value) => value + 1);
            setDrawer({ mode: "create" });
          }}
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nuevo ejercicio</span>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0 sm:p-0">
          {pageData.length === 0 ? (
            <div className="grid min-h-72 place-items-center px-6 py-10 text-center">
              <div className="max-w-sm">
                <p className="font-display text-lg font-semibold text-white">
                  {hasFilters ? "Sin resultados" : "Todavia no hay ejercicios"}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                  {hasFilters
                    ? "Proba cambiando los filtros o el termino de busqueda."
                    : "Usa el boton \"Nuevo ejercicio\" para agregar el primero."}
                </p>
              </div>
            </div>
          ) : (
            <>
            <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-center">
                    <SortHeader label="Ejercicio" column="name" active={sortColumn} direction={sortDirection} onClick={() => toggleSort("name")} />
                  </TableHead>
                  <TableHead className="text-center">
                    <SortHeader label="Grupo muscular" column="muscleGroup" active={sortColumn} direction={sortDirection} onClick={() => toggleSort("muscleGroup")} center />
                  </TableHead>
                  <TableHead className="text-center">
                    <SortHeader label="Equipamiento" column="equipment" active={sortColumn} direction={sortDirection} onClick={() => toggleSort("equipment")} center />
                  </TableHead>
                  <TableHead className="text-center">
                    <SortHeader label="Agregado" column="createdAt" active={sortColumn} direction={sortDirection} onClick={() => toggleSort("createdAt")} center />
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.map((exercise) => (
                  <TableRow key={exercise.id}>
                    <TableCell className="text-center text-white">
                      <button
                        type="button"
                        onClick={() => setSelectedExercise(exercise)}
                        className="flex max-w-sm items-center gap-3 text-left"
                      >
                        <span
                          className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--border)]"
                          style={{
                            background: exercise.muscleGroup
                              ? MUSCLE_GRADIENTS[exercise.muscleGroup]
                              : MUSCLE_GRADIENTS.Core,
                          }}
                        >
                          <Dumbbell className="size-4 text-white/20" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium underline-offset-4 hover:underline">
                            {exercise.name}
                          </p>
                          <p className="truncate text-xs text-[var(--foreground-muted)]">
                            {exercise.description}
                          </p>
                        </div>
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      {exercise.muscleGroup ? (
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${MUSCLE_BADGE_STYLES[exercise.muscleGroup] ?? MUSCLE_BADGE_STYLES.Core}`}
                        >
                          {muscleLabel(exercise.muscleGroup)}
                        </span>
                      ) : (
                        <span className="text-xs text-[#7d8697]">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {exercise.equipment ? (
                        <Badge variant="neutral">{equipmentLabel(exercise.equipment)}</Badge>
                      ) : (
                        <span className="text-xs text-[#7d8697]">-</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-center text-sm text-[#7d8697]">
                      {exercise.createdAtLabel}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => {
                            setFormKey((value) => value + 1);
                            setDrawer({ mode: "edit", exercise });
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
                          onClick={() => setDeleteTarget(exercise)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {pageData.map((exercise) => (
                <div
                  key={exercise.id}
                  className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card-alt)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedExercise(exercise)}
                      className="flex min-w-0 items-center gap-3 text-left"
                    >
                      <span
                        className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--border)]"
                        style={{
                          background: exercise.muscleGroup
                            ? MUSCLE_GRADIENTS[exercise.muscleGroup]
                            : MUSCLE_GRADIENTS.Core,
                        }}
                      >
                        <Dumbbell className="size-4 text-white/20" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white underline-offset-4 hover:underline">
                          {exercise.name}
                        </p>
                        <p className="truncate text-xs text-[var(--foreground-muted)]">
                          {exercise.description}
                        </p>
                      </div>
                    </button>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-11"
                        title="Editar"
                        onClick={() => {
                          setFormKey((value) => value + 1);
                          setDrawer({ mode: "edit", exercise });
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
                        onClick={() => setDeleteTarget(exercise)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {exercise.muscleGroup ? (
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${MUSCLE_BADGE_STYLES[exercise.muscleGroup] ?? MUSCLE_BADGE_STYLES.Core}`}
                      >
                        {muscleLabel(exercise.muscleGroup)}
                      </span>
                    ) : null}
                    {exercise.equipment ? (
                      <Badge variant="neutral">{equipmentLabel(exercise.equipment)}</Badge>
                    ) : null}
                    <span className="text-xs text-[#7d8697]">{exercise.createdAtLabel}</span>
                  </div>
                </div>
              ))}
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

      <ExerciseDetailModal
        exercise={selectedExercise}
        open={selectedExercise !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedExercise(null);
          }
        }}
      />

      <ExerciseFormSheet
        key={formKey}
        open={drawer !== null}
        exercise={drawer?.mode === "edit" ? drawer.exercise : null}
        onClose={() => setDrawer(null)}
        onSaved={handleSaved}
      />

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent open={deleteTarget !== null}>
          <DialogHeader>
            <span className="grid size-11 place-items-center rounded-full border border-[#7a2630] bg-[#3b1419]/60 text-[#f87171]">
              <TriangleAlert className="size-5" />
            </span>
            <DialogTitle className="mt-3">Eliminar ejercicio</DialogTitle>
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
              {isDeleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
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
  icon: typeof Dumbbell;
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

type ExerciseFormSheetProps = {
  open: boolean;
  exercise: AdminExerciseListItem | null;
  onClose: () => void;
  onSaved: (message: string) => void;
};

type UploadStatus = "idle" | "uploading" | "uploaded";

function ExerciseFormSheet({ open, exercise, onClose, onSaved }: ExerciseFormSheetProps) {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [name, setName] = useState(() => exercise?.name ?? "");
  const [description, setDescription] = useState(() => exercise?.description ?? "");
  const [imageUrl, setImageUrl] = useState(() => exercise?.imageUrl ?? "");
  const [muscleGroup, setMuscleGroup] = useState<string>(() => exercise?.muscleGroup ?? "");
  const [equipment, setEquipment] = useState<string>(() => exercise?.equipment ?? "");
  const [videoUrl, setVideoUrl] = useState(() => exercise?.videoUrl ?? "");
  const [minReps, setMinReps] = useState(() => exercise?.minReps?.toString() ?? "");
  const [maxReps, setMaxReps] = useState(() => exercise?.maxReps?.toString() ?? "");
  const [steps, setSteps] = useState<string[]>(() => exercise?.steps ?? []);
  const [tips, setTips] = useState<string[]>(() => exercise?.tips ?? []);
  const [previewSrc, setPreviewSrc] = useState<string | null>(() => exercise?.imageUrl ?? null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadMessage, setUploadMessage] = useState<string | null>(() =>
    exercise ? "Imagen actual cargada." : null,
  );
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [serverState, setServerState] = useState<ExerciseFormState>(INITIAL_EXERCISE_FORM_STATE);

  const isEditing = exercise !== null;

  useEffect(() => {
    return () => {
      clearObjectUrl();
    };
  }, []);

  function clearObjectUrl() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setServerState(INITIAL_EXERCISE_FORM_STATE);
    setSelectedFileName(file.name);

    const validation = validateExerciseImageFile(file);

    if (!validation.ok) {
      setUploadStatus("idle");
      setUploadMessage(validation.message);
      event.target.value = "";
      return;
    }

    const previousPreview = imageUrl || previewSrc;
    const temporaryPreviewUrl = URL.createObjectURL(file);
    clearObjectUrl();
    objectUrlRef.current = temporaryPreviewUrl;
    setPreviewSrc(temporaryPreviewUrl);
    setUploadStatus("uploading");
    setUploadMessage("Subiendo imagen...");

    const fileExtension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const sanitizedBaseName =
      file.name
        .replace(/\.[^/.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48) || "exercise";
    const path = `${crypto.randomUUID()}-${sanitizedBaseName}.${fileExtension}`;
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.storage.from(EXERCISE_IMAGE_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      clearObjectUrl();
      setPreviewSrc(previousPreview || null);
      setUploadStatus("idle");
      setUploadMessage(error.message || "No se pudo subir la imagen.");
      event.target.value = "";
      return;
    }

    const { data } = supabase.storage.from(EXERCISE_IMAGE_BUCKET).getPublicUrl(path);

    clearObjectUrl();
    setImageUrl(data.publicUrl);
    setPreviewSrc(data.publicUrl);
    setUploadStatus("uploaded");
    setUploadMessage("Imagen lista para guardar.");
    event.target.value = "";
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerState(INITIAL_EXERCISE_FORM_STATE);

    startTransition(async () => {
      const result = await saveExerciseAction({
        exerciseId: exercise?.id,
        name,
        description,
        imageUrl,
        muscleGroup,
        equipment,
        videoUrl,
        minReps,
        maxReps,
        steps,
        tips,
      });

      if (result.status === "success") {
        onSaved(result.message ?? (isEditing ? "Ejercicio actualizado." : "Ejercicio guardado."));
        return;
      }

      setServerState(result);
    });
  }

  const submitDisabled = isPending || uploadStatus === "uploading" || (!isEditing && !imageUrl);

  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent side="right" className="w-[min(28rem,92vw)]">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar ejercicio" : "Nuevo ejercicio"}</SheetTitle>
          <p className="text-sm text-[var(--foreground-muted)]">
            {isEditing
              ? "Modifica los datos del ejercicio."
              : "Completa los campos para agregar un ejercicio al catalogo."}
          </p>
        </SheetHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="grid flex-1 gap-5 overflow-y-auto px-5 py-2">
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-alt)]">
              <div
                className="relative flex h-24 items-center gap-3 px-4"
                style={{ background: MUSCLE_GRADIENTS[muscleGroup] ?? MUSCLE_GRADIENTS.Core }}
              >
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-black/30">
                  <Dumbbell className="size-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-semibold text-white">
                    {name || "Nombre del ejercicio..."}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {muscleGroup ? (
                      <Badge
                        className={cn(
                          "border",
                          MUSCLE_BADGE_STYLES[muscleGroup] ?? MUSCLE_BADGE_STYLES.Core,
                        )}
                      >
                        {muscleLabel(muscleGroup)}
                      </Badge>
                    ) : null}
                    {equipment ? <Badge variant="neutral">{equipmentLabel(equipment)}</Badge> : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7d8697]">
                <Info className="size-3.5" />
                Informacion general
              </p>

              <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                Nombre del ejercicio
                <Input
                  placeholder="Ej. Press de banca"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                {serverState.fieldErrors.name ? (
                  <span className="text-xs text-[#f8b4b4]">{serverState.fieldErrors.name}</span>
                ) : null}
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                <span className="flex items-center justify-between">
                  Descripcion
                  <span className="text-[11px] font-normal text-[#7d8697]">
                    {description.length}/200
                  </span>
                </span>
                <Textarea
                  className="min-h-28 resize-none"
                  maxLength={200}
                  placeholder="Describe la tecnica y los musculos que trabaja este ejercicio..."
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

            <div className="h-px bg-[var(--border)]" />

            <div className="grid gap-4">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7d8697]">
                <Tags className="size-3.5" />
                Clasificacion
              </p>

              <div className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                Grupo muscular
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {EXERCISE_MUSCLE_GROUPS.map((group) => (
                    <button
                      key={group}
                      type="button"
                      onClick={() => setMuscleGroup(group)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1.5 text-center text-xs font-semibold transition-colors",
                        muscleGroup === group
                          ? (MUSCLE_BADGE_STYLES[group] ?? MUSCLE_BADGE_STYLES.Core)
                          : "border-[var(--border)] bg-[var(--card-alt)] text-[#9aa3b8] hover:text-white",
                      )}
                    >
                      {muscleLabel(group)}
                    </button>
                  ))}
                </div>
                {serverState.fieldErrors.muscleGroup ? (
                  <span className="text-xs text-[#f8b4b4]">
                    {serverState.fieldErrors.muscleGroup}
                  </span>
                ) : null}
              </div>

              <div className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                Equipamiento
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {EXERCISE_EQUIPMENT_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setEquipment(option)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1.5 text-center text-xs font-semibold transition-colors",
                        equipment === option
                          ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent-bright)]"
                          : "border-[var(--border)] bg-[var(--card-alt)] text-[#9aa3b8] hover:text-white",
                      )}
                    >
                      {equipmentLabel(option)}
                    </button>
                  ))}
                </div>
                {serverState.fieldErrors.equipment ? (
                  <span className="text-xs text-[#f8b4b4]">
                    {serverState.fieldErrors.equipment}
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                  Reps minimas (ideal)
                  <Input
                    placeholder="Ej. 8"
                    type="number"
                    min={1}
                    value={minReps}
                    onChange={(event) => setMinReps(event.target.value)}
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                  Reps maximas (ideal)
                  <Input
                    placeholder="Ej. 12"
                    type="number"
                    min={1}
                    value={maxReps}
                    onChange={(event) => setMaxReps(event.target.value)}
                  />
                  {serverState.fieldErrors.maxReps ? (
                    <span className="text-xs text-[#f8b4b4]">
                      {serverState.fieldErrors.maxReps}
                    </span>
                  ) : null}
                </label>
              </div>
            </div>

            <div className="h-px bg-[var(--border)]" />

            <div className="grid gap-4">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7d8697]">
                <ImagePlus className="size-3.5" />
                Multimedia
              </p>

              <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
              <span className="flex items-center justify-between">
                URL de video (opcional)
                {videoUrl.trim().startsWith("http") ? (
                  <Badge variant="success">URL valida</Badge>
                ) : null}
              </span>
              <div className="relative">
                <LinkIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#7d8697]" />
                <Input
                  className="pl-9"
                  placeholder="https://youtube.com/watch?v=..."
                  type="text"
                  value={videoUrl}
                  onChange={(event) => setVideoUrl(event.target.value)}
                />
              </div>
              {serverState.fieldErrors.videoUrl ? (
                <span className="text-xs text-[#f8b4b4]">{serverState.fieldErrors.videoUrl}</span>
              ) : null}
            </label>

            <div className="grid gap-3 text-xs font-semibold text-[#c2c8d6]">
              <div className="flex items-center justify-between gap-3">
                <span>Imagen del ejercicio</span>
                <span className="text-[11px] uppercase tracking-[0.12em] text-[#7d8697]">
                  JPG, PNG o WEBP
                </span>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-alt)]">
                <div className="relative aspect-[4/3]">
                  {previewSrc ? (
                    <Image
                      alt={name || "Preview del ejercicio"}
                      className="object-cover"
                      fill
                      sizes="(max-width: 1280px) 100vw, 480px"
                      src={previewSrc}
                      unoptimized={previewSrc.startsWith("blob:")}
                    />
                  ) : (
                    <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_top,#2b1854_0%,#171d2a_48%,#0c1017_100%)] text-center text-sm text-[#96a0b5]">
                      <div className="space-y-2">
                        <p className="font-display text-base font-semibold text-white">
                          Sin imagen
                        </p>
                        <p>Sube un archivo para generar la preview.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card-alt)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">
                    {selectedFileName ?? (isEditing ? "Mantener imagen actual" : "Seleccionar imagen")}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--foreground-muted)]">
                    {uploadMessage ??
                      (isEditing
                        ? "Puedes dejar la imagen actual o reemplazarla."
                        : "La imagen es obligatoria al crear. Maximo 5 MB.")}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadStatus === "uploading"}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadStatus === "uploading" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  {uploadStatus === "uploading" ? "Subiendo..." : "Elegir archivo"}
                </Button>
                <input
                  ref={fileInputRef}
                  accept={EXERCISE_IMAGE_ACCEPT}
                  className="hidden"
                  type="file"
                  onChange={handleFileChange}
                />
              </div>

              {serverState.fieldErrors.imageUrl ? (
                <span className="text-xs text-[#f8b4b4]">{serverState.fieldErrors.imageUrl}</span>
              ) : null}
            </div>
            </div>

            <div className="h-px bg-[var(--border)]" />

            <div className="grid gap-4">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7d8697]">
                <ListOrdered className="size-3.5" />
                Pasos de ejecucion
              </p>
              <EditableTextList
                items={steps}
                onChange={setSteps}
                placeholder="Ej. Bajá la barra de forma controlada hasta el pecho..."
                addLabel="Agregar paso"
                numbered
              />
            </div>

            <div className="grid gap-4">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7d8697]">
                <Lightbulb className="size-3.5" />
                Claves de tecnica
              </p>
              <EditableTextList
                items={tips}
                onChange={setTips}
                placeholder="Ej. Manten el core activo durante todo el movimiento..."
                addLabel="Agregar clave"
              />
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
                  <LoaderCircle className="size-4 animate-spin" />
                  Guardando...
                </>
              ) : isEditing ? (
                "Guardar cambios"
              ) : (
                "Crear ejercicio"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function EditableTextList({
  items,
  onChange,
  placeholder,
  addLabel,
  numbered,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  addLabel: string;
  numbered?: boolean;
}) {
  return (
    <div className="grid gap-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {numbered ? (
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-[rgba(124,58,237,0.35)] bg-[rgba(124,58,237,0.12)] font-display text-[11px] font-bold text-[var(--accent-bright)]">
              {index + 1}
            </span>
          ) : null}
          <Input
            placeholder={placeholder}
            value={item}
            onChange={(event) => {
              const next = [...items];
              next[index] = event.target.value;
              onChange(next);
            }}
          />
          <button
            type="button"
            aria-label="Quitar"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-[var(--border)] text-[#9aa3b8] transition-colors hover:border-[#7a2630] hover:text-[#f8b4b4]"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => onChange([...items, ""])}>
        <Plus className="size-4" />
        {addLabel}
      </Button>
    </div>
  );
}
