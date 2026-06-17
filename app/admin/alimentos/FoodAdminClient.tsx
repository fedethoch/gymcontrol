"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, LoaderCircle, PencilLine, Plus, Salad, Search, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { FilterPanel } from "@/app/components/shared/FilterPanel";
import { MacroBar } from "@/app/components/shared/MacroBar";
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
import { SectionEyebrow } from "@/app/components/ui/SectionEyebrow";
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
import { deleteFoodAction, saveFoodAction } from "@/app/admin/alimentos/actions";
import { CATEGORY_ACCENT, CATEGORY_GRADIENTS, CATEGORY_ICONS } from "@/app/lib/nutrition-style";
import {
  FOOD_CATEGORIES,
  FOOD_CATEGORY_LABELS,
  FOOD_MEASURES,
  FOOD_MEASURE_LABELS,
  type Food,
  type FoodCategory,
  type FoodMeasure,
} from "@/app/lib/nutrition-types";

type FoodAdminClientProps = {
  initialFoods: Food[];
};

const PAGE_SIZE = 8;

type SortColumn = "name" | "category" | "servingG" | "calories" | "proteinG" | "carbsG" | "fatG";
type SortDirection = "asc" | "desc";

export function FoodAdminClient({ initialFoods }: FoodAdminClientProps) {
  const [foods, setFoods] = useState<Food[]>(initialFoods);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(0);

  const [drawer, setDrawer] = useState<{ mode: "create" } | { mode: "edit"; food: Food } | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Food | null>(null);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    const rows = foods.filter((food) => {
      if (normalized && !food.name.toLowerCase().includes(normalized)) return false;
      if (categoryFilter !== "all" && food.category !== categoryFilter) return false;
      return true;
    });

    return [...rows].sort((left, right) => {
      let cmp = 0;

      if (sortColumn === "name") {
        cmp = left.name.localeCompare(right.name, "es");
      } else if (sortColumn === "category") {
        cmp = FOOD_CATEGORY_LABELS[left.category].localeCompare(FOOD_CATEGORY_LABELS[right.category], "es");
      } else {
        cmp = left[sortColumn] - right[sortColumn];
      }

      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [foods, search, categoryFilter, sortColumn, sortDirection]);

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

  function handleSave(food: Food) {
    setFoods((current) => {
      const exists = current.some((item) => item.id === food.id);
      if (exists) {
        return current.map((item) => (item.id === food.id ? food : item));
      }
      return [food, ...current];
    });

    setDrawer(null);
    toast.success(drawer?.mode === "edit" ? "Alimento actualizado." : "Alimento creado.");
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const result = await deleteFoodAction(deleteTarget.id);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    setFoods((current) => current.filter((item) => item.id !== deleteTarget.id));
    toast.success("Alimento eliminado.");
    setDeleteTarget(null);
  }

  const hasFilters = search.trim() !== "" || categoryFilter !== "all";

  return (
    <section className="page-frame dashboard-page-frame">
      <header>
        <SectionEyebrow>Gestión / Alimentos</SectionEyebrow>
        <h1 className="font-display mt-2 text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">
          Alimentos
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--foreground-muted)]">
          Gestiona el catálogo de alimentos con sus calorías y macronutrientes.
        </p>
      </header>

      <div className="flex items-center gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Buscar alimento</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#7d8697]" />
          <Input
            className="h-11 rounded-xl border-[var(--border)] bg-[var(--card-alt)] pl-9"
            placeholder="Buscar alimento..."
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
          />
        </label>

        <FilterPanel
          groups={[
            {
              label: "Categoría",
              options: FOOD_CATEGORIES.map((v) => ({
                value: v,
                label: FOOD_CATEGORY_LABELS[v],
              })),
              value: categoryFilter,
              onChange: (v) => {
                setCategoryFilter(v);
                setPage(0);
              },
            },
          ]}
          onClear={() => {
            setCategoryFilter("all");
            setPage(0);
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
          <span className="hidden sm:inline">Nuevo alimento</span>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0 sm:p-0">
          {pageData.length === 0 ? (
            <div className="grid min-h-72 place-items-center px-6 py-10 text-center">
              <div className="max-w-sm">
                <p className="font-display text-lg font-semibold text-white">
                  {hasFilters ? "Sin resultados" : "Todavía no hay alimentos"}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                  {hasFilters
                    ? "Proba cambiando los filtros o el término de búsqueda."
                    : "Usa el botón \"Nuevo alimento\" para agregar el primero."}
                </p>
              </div>
            </div>
          ) : (
            <>
            <div className="hidden md:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[32%]">
                    <SortHeader label="Alimento" column="name" active={sortColumn} direction={sortDirection} onClick={() => toggleSort("name")} />
                  </TableHead>
                  <TableHead className="w-[12%] text-center">
                    <SortHeader label="Categoría" column="category" active={sortColumn} direction={sortDirection} onClick={() => toggleSort("category")} center />
                  </TableHead>
                  <TableHead className="w-[16%] text-center">
                    <SortHeader label="Porción" column="servingG" active={sortColumn} direction={sortDirection} onClick={() => toggleSort("servingG")} center />
                  </TableHead>
                  <TableHead className="w-[12%] text-center">
                    <SortHeader label="Calorías" column="calories" active={sortColumn} direction={sortDirection} onClick={() => toggleSort("calories")} center />
                  </TableHead>
                  <TableHead className="w-[16%]">Macros</TableHead>
                  <TableHead className="w-[12%] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.map((food) => {
                  const Icon = CATEGORY_ICONS[food.category];

                  return (
                    <TableRow key={food.id}>
                      <TableCell className="text-white">
                        <div className="flex items-center gap-3">
                          <span
                            className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--border)]"
                            style={{ background: CATEGORY_GRADIENTS[food.category] }}
                          >
                            <Icon className="size-4" style={{ color: CATEGORY_ACCENT[food.category] }} />
                          </span>
                          <p className="truncate font-medium">{food.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{FOOD_CATEGORY_LABELS[food.category]}</TableCell>
                      <TableCell className="truncate text-center">
                        {food.servingG} g{food.gramsPerUnit ? ` · 1 u ≈ ${food.gramsPerUnit} g` : ""}
                      </TableCell>
                      <TableCell className="truncate text-center">{food.calories} kcal</TableCell>
                      <TableCell>
                        <MacroBar
                          macros={{ proteinG: food.proteinG, carbsG: food.carbsG, fatG: food.fatG }}
                          showLegend={false}
                          className="max-w-40"
                        />
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
                              setDrawer({ mode: "edit", food });
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
                            onClick={() => setDeleteTarget(food)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {pageData.map((food) => {
                const Icon = CATEGORY_ICONS[food.category];

                return (
                  <div
                    key={food.id}
                    className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card-alt)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--border)]"
                          style={{ background: CATEGORY_GRADIENTS[food.category] }}
                        >
                          <Icon className="size-4" style={{ color: CATEGORY_ACCENT[food.category] }} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">{food.name}</p>
                          <p className="truncate text-xs text-[var(--foreground-muted)]">
                            {FOOD_CATEGORY_LABELS[food.category]} · {food.servingG} g
                            {food.gramsPerUnit ? ` · 1 u ≈ ${food.gramsPerUnit} g` : ""}
                          </p>
                        </div>
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
                            setDrawer({ mode: "edit", food });
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
                          onClick={() => setDeleteTarget(food)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-[#7d8697]">{food.calories} kcal</p>
                    <MacroBar
                      macros={{ proteinG: food.proteinG, carbsG: food.carbsG, fatG: food.fatG }}
                      className="mt-2"
                    />
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
        </div>
      ) : null}

      <FoodFormSheet
        key={formKey}
        open={drawer !== null}
        food={drawer?.mode === "edit" ? drawer.food : null}
        onClose={() => setDrawer(null)}
        onSave={handleSave}
      />

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent open={deleteTarget !== null}>
          <DialogHeader>
            <span className="grid size-11 place-items-center rounded-full border border-[#7a2630] bg-[#3b1419]/60 text-[#f87171]">
              <TriangleAlert className="size-5" />
            </span>
            <DialogTitle className="mt-3">Eliminar alimento</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que querés eliminar{" "}
              <strong className="text-white">{deleteTarget?.name}</strong>? Esta acción no se
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
              onClick={confirmDelete}
            >
              <Trash2 className="size-4" />
              Sí, eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
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

type FoodFormSheetProps = {
  open: boolean;
  food: Food | null;
  onClose: () => void;
  onSave: (food: Food) => void;
};

function FoodFormSheet({ open, food, onClose, onSave }: FoodFormSheetProps) {
  const isEditing = food !== null;

  const [name, setName] = useState(() => food?.name ?? "");
  const [category, setCategory] = useState<FoodCategory>(() => food?.category ?? "protein");
  const [measure, setMeasure] = useState<FoodMeasure>(() => food?.measure ?? "g");
  const [servingG, setServingG] = useState(() => String(food?.servingG ?? 100));
  const [gramsPerUnit, setGramsPerUnit] = useState(() => String(food?.gramsPerUnit ?? ""));
  const [calories, setCalories] = useState(() => String(food?.calories ?? ""));
  const [proteinG, setProteinG] = useState(() => String(food?.proteinG ?? ""));
  const [carbsG, setCarbsG] = useState(() => String(food?.carbsG ?? ""));
  const [fatG, setFatG] = useState(() => String(food?.fatG ?? ""));
  const [isPending, setIsPending] = useState(false);

  const canSubmit = name.trim().length > 0 && Number(servingG) > 0 && Number(calories) >= 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsPending(true);

    const result = await saveFoodAction({
      foodId: food?.id,
      name,
      category,
      measure,
      servingG,
      gramsPerUnit,
      calories,
      proteinG,
      carbsG,
      fatG,
    });

    setIsPending(false);

    if (result.status !== "success" || !result.food) {
      toast.error(result.message ?? "No se pudo guardar el alimento.");
      return;
    }

    onSave(result.food);
  }

  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent side="right" className="w-[min(26rem,92vw)]">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar alimento" : "Nuevo alimento"}</SheetTitle>
          <p className="text-sm text-[var(--foreground-muted)]">
            {isEditing ? "Modifica los datos del alimento." : "Completa los campos para agregar un alimento al catálogo."}
          </p>
        </SheetHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="grid flex-1 gap-5 overflow-y-auto px-5 py-2">
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-alt)]">
              <div className="relative flex h-24 items-center gap-3 px-4" style={{ background: CATEGORY_GRADIENTS[category] }}>
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-black/30">
                  <Salad className="size-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-semibold text-white">
                    {name || "Nombre del alimento..."}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-white/70">
                    {FOOD_CATEGORY_LABELS[category]}
                  </p>
                </div>
              </div>
            </div>

            <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
              Nombre del alimento
              <Input placeholder="Ej. Pechuga de pollo" value={name} onChange={(e) => setName(e.target.value)} />
            </label>

            <div className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
              Categoría
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {FOOD_CATEGORIES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    className={
                      category === value
                        ? "rounded-lg border border-[var(--accent)] bg-[var(--accent)]/15 px-2.5 py-1.5 text-center text-xs font-semibold text-white"
                        : "rounded-lg border border-[var(--border)] bg-[var(--card-alt)] px-2.5 py-1.5 text-center text-xs font-semibold text-[#9aa3b8] hover:text-white"
                    }
                  >
                    {FOOD_CATEGORY_LABELS[value]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
              Unidad de medida por defecto
              <div className="grid grid-cols-2 gap-1.5">
                {FOOD_MEASURES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMeasure(value)}
                    className={
                      measure === value
                        ? "rounded-lg border border-[var(--accent)] bg-[var(--accent)]/15 px-2.5 py-1.5 text-center text-xs font-semibold text-white"
                        : "rounded-lg border border-[var(--border)] bg-[var(--card-alt)] px-2.5 py-1.5 text-center text-xs font-semibold text-[#9aa3b8] hover:text-white"
                    }
                  >
                    {FOOD_MEASURE_LABELS[value]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                Porción (g)
                <Input type="number" min={1} value={servingG} onChange={(e) => setServingG(e.target.value)} />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                Calorías (kcal)
                <Input type="number" min={0} value={calories} onChange={(e) => setCalories(e.target.value)} />
              </label>
            </div>

            <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
              Gramos por unidad/porción (opcional)
              <Input
                type="number"
                min={1}
                placeholder="Ej. 50"
                value={gramsPerUnit}
                onChange={(e) => setGramsPerUnit(e.target.value)}
              />
              <span className="text-[11px] font-normal normal-case text-[#7887a6]">
                Si se completa, el alimento podrá registrarse también por unidades/porciones.
              </span>
            </label>

            <div className="grid grid-cols-3 gap-3">
              <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                Proteína (g)
                <Input type="number" min={0} value={proteinG} onChange={(e) => setProteinG(e.target.value)} />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                Carbohidratos (g)
                <Input type="number" min={0} value={carbsG} onChange={(e) => setCarbsG(e.target.value)} />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
                Grasas (g)
                <Input type="number" min={0} value={fatG} onChange={(e) => setFatG(e.target.value)} />
              </label>
            </div>

            <MacroBar
              macros={{ proteinG: Number(proteinG) || 0, carbsG: Number(carbsG) || 0, fatG: Number(fatG) || 0 }}
            />
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t border-[var(--border)]">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button disabled={!canSubmit || isPending} type="submit">
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {isEditing ? "Guardar cambios" : "Crear alimento"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
