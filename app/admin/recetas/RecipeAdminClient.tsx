"use client";

import { useMemo, useState } from "react";
import { PencilLine, Plus, Search, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { MacroBar } from "@/app/components/shared/MacroBar";
import { RecipeForm } from "@/app/components/shared/RecipeForm";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/Dialog";
import { FilterPanel } from "@/app/components/shared/FilterPanel";
import { Input } from "@/app/components/ui/Input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
import { archiveRecipeAction } from "@/app/recetas/actions";
import type { AdminRecipeListItem } from "@/app/lib/recipes";
import {
  RECIPE_CATEGORY_ACCENT,
  RECIPE_CATEGORY_GRADIENTS,
  RECIPE_CATEGORY_ICONS,
} from "@/app/lib/nutrition-style";
import {
  RECIPE_CATEGORIES,
  RECIPE_CATEGORY_LABELS,
  type Food,
  type Recipe,
} from "@/app/lib/nutrition-types";

type AdminRecipe = Recipe & { authorName?: string | null };

type RecipeAdminClientProps = {
  initialRecipes: AdminRecipeListItem[];
  foods: Food[];
};

const PAGE_SIZE = 8;

export function RecipeAdminClient({ initialRecipes, foods }: RecipeAdminClientProps) {
  const [recipes, setRecipes] = useState<AdminRecipe[]>(initialRecipes);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(0);

  const [drawer, setDrawer] = useState<{ mode: "create" } | { mode: "edit"; recipe: AdminRecipe } | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<AdminRecipe | null>(null);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return recipes.filter((recipe) => {
      if (normalized && !recipe.name.toLowerCase().includes(normalized)) return false;
      if (categoryFilter !== "all" && recipe.category !== categoryFilter) return false;
      return true;
    });
  }, [recipes, search, categoryFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageData = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  function handleSave(recipe: Recipe) {
    setRecipes((current) => {
      const existing = current.find((item) => item.id === recipe.id);
      if (existing) {
        return current.map((item) => (item.id === recipe.id ? { ...recipe, authorName: existing.authorName } : item));
      }
      return [recipe, ...current];
    });

    setDrawer(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const result = await archiveRecipeAction(deleteTarget.id);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    setRecipes((current) => current.filter((item) => item.id !== deleteTarget.id));
    toast.success("Receta eliminada.");
    setDeleteTarget(null);
  }

  const hasFilters = search.trim() !== "" || categoryFilter !== "all";

  return (
    <section className="page-frame dashboard-page-frame">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">
          Recetas
        </h1>
      </header>

      <div className="flex items-center gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Buscar receta</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#7d8697]" />
          <Input
            className="h-11 rounded-xl border-[var(--border)] bg-[var(--card-alt)] pl-9"
            placeholder="Buscar receta..."
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
              options: RECIPE_CATEGORIES.map((v) => ({
                value: v,
                label: RECIPE_CATEGORY_LABELS[v],
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
          <span className="hidden sm:inline">Nueva receta</span>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0 sm:p-0">
          {pageData.length === 0 ? (
            <div className="motion-empty-state grid min-h-72 place-items-center px-6 py-10 text-center">
              <div className="max-w-sm">
                <p className="font-display text-lg font-semibold text-white">
                  {hasFilters ? "Sin resultados" : "Todavía no hay recetas"}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                  {hasFilters
                    ? "Proba cambiando los filtros o el término de búsqueda."
                    : "Usa el botón \"Nueva receta\" para agregar la primera."}
                </p>
              </div>
            </div>
          ) : (
            <>
            <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Receta</TableHead>
                  <TableHead className="text-center">Categoría</TableHead>
                  <TableHead className="text-center">Porción</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead className="text-center">Calorías</TableHead>
                  <TableHead>Macros</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.map((recipe) => {
                  const Icon = RECIPE_CATEGORY_ICONS[recipe.category];

                  return (
                    <TableRow key={recipe.id}>
                      <TableCell className="text-white">
                        <div className="flex items-center gap-3">
                          <span
                            className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--border)]"
                            style={{ background: RECIPE_CATEGORY_GRADIENTS[recipe.category] }}
                          >
                            <Icon className="size-4" style={{ color: RECIPE_CATEGORY_ACCENT[recipe.category] }} />
                          </span>
                          <p className="font-medium">{recipe.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{RECIPE_CATEGORY_LABELS[recipe.category]}</TableCell>
                      <TableCell className="text-center whitespace-nowrap">{recipe.servingG} g</TableCell>
                      <TableCell className="max-w-32 truncate">{recipe.authorName ?? "—"}</TableCell>
                      <TableCell className="text-center whitespace-nowrap">{recipe.calories} kcal</TableCell>
                      <TableCell>
                        <MacroBar
                          macros={{ proteinG: recipe.proteinG, carbsG: recipe.carbsG, fatG: recipe.fatG }}
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
                              setDrawer({ mode: "edit", recipe });
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
                            onClick={() => setDeleteTarget(recipe)}
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
              {pageData.map((recipe) => {
                const Icon = RECIPE_CATEGORY_ICONS[recipe.category];

                return (
                  <div
                    key={recipe.id}
                    className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card-alt)] p-4 transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--border)]"
                          style={{ background: RECIPE_CATEGORY_GRADIENTS[recipe.category] }}
                        >
                          <Icon className="size-4" style={{ color: RECIPE_CATEGORY_ACCENT[recipe.category] }} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">{recipe.name}</p>
                          <p className="truncate text-xs text-[var(--foreground-muted)]">
                            {RECIPE_CATEGORY_LABELS[recipe.category]} · {recipe.servingG} g/porción · {recipe.calories} kcal
                            {recipe.authorName ? ` · ${recipe.authorName}` : ""}
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
                            setDrawer({ mode: "edit", recipe });
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
                          onClick={() => setDeleteTarget(recipe)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>

                    <MacroBar
                      macros={{ proteinG: recipe.proteinG, carbsG: recipe.carbsG, fatG: recipe.fatG }}
                      className="mt-3"
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

      <Sheet open={drawer !== null} onOpenChange={(value) => !value && setDrawer(null)}>
        <SheetContent side="right" className="w-[min(28rem,92vw)]">
          <SheetHeader>
            <SheetTitle>{drawer?.mode === "edit" ? "Editar receta" : "Nueva receta"}</SheetTitle>
            <SheetDescription>Pública para todos. Lo ya registrado en comidas no cambia al editar.</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            <RecipeForm
              key={formKey}
              recipe={drawer?.mode === "edit" ? drawer.recipe : null}
              foods={foods}
              onCancel={() => setDrawer(null)}
              onSaved={handleSave}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent open={deleteTarget !== null}>
          <DialogHeader>
            <span className="grid size-11 place-items-center rounded-full border border-[#7a2630] bg-[#3b1419]/60 text-[#f87171]">
              <TriangleAlert className="size-5" />
            </span>
            <DialogTitle className="mt-3">Eliminar receta</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que querés eliminar{" "}
              <strong className="text-white">{deleteTarget?.name}</strong>? Deja de verse en el
              catálogo; las comidas que ya la usaron no cambian.
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
