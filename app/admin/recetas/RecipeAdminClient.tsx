"use client";

import { useMemo, useState } from "react";
import { PencilLine, Plus, Search, Trash2, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";

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
import { FilterPanel } from "@/app/components/shared/FilterPanel";
import { Input } from "@/app/components/ui/Input";
import { LoadingDots } from "@/app/components/ui/LoadingDots";
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
import { deleteRecipeAction, saveRecipeAction } from "@/app/admin/recetas/actions";
import {
  RECIPE_CATEGORY_ACCENT,
  RECIPE_CATEGORY_GRADIENTS,
  RECIPE_CATEGORY_ICONS,
} from "@/app/lib/nutrition-style";
import {
  RECIPE_CATEGORIES,
  RECIPE_CATEGORY_LABELS,
  type Food,
  type RecipeCategory,
  type Recipe,
  type RecipeIngredient,
} from "@/app/lib/nutrition-types";

type RecipeAdminClientProps = {
  initialRecipes: Recipe[];
  foods: Food[];
};

const PAGE_SIZE = 8;

export function RecipeAdminClient({ initialRecipes, foods }: RecipeAdminClientProps) {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(0);

  const [drawer, setDrawer] = useState<{ mode: "create" } | { mode: "edit"; recipe: Recipe } | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null);

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
      const exists = current.some((item) => item.id === recipe.id);
      if (exists) {
        return current.map((item) => (item.id === recipe.id ? recipe : item));
      }
      return [recipe, ...current];
    });

    setDrawer(null);
    toast.success(drawer?.mode === "edit" ? "Receta actualizada." : "Receta creada.");
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const result = await deleteRecipeAction(deleteTarget.id);

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
                  <TableHead className="text-center">Porciones</TableHead>
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
                      <TableCell className="text-center whitespace-nowrap">{recipe.servings}</TableCell>
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
                            {RECIPE_CATEGORY_LABELS[recipe.category]} · {recipe.servings} porciones · {recipe.calories} kcal
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

      <RecipeFormSheet
        key={formKey}
        open={drawer !== null}
        recipe={drawer?.mode === "edit" ? drawer.recipe : null}
        foods={foods}
        onClose={() => setDrawer(null)}
        onSave={handleSave}
      />

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent open={deleteTarget !== null}>
          <DialogHeader>
            <span className="grid size-11 place-items-center rounded-full border border-[#7a2630] bg-[#3b1419]/60 text-[#f87171]">
              <TriangleAlert className="size-5" />
            </span>
            <DialogTitle className="mt-3">Eliminar receta</DialogTitle>
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

type RecipeFormSheetProps = {
  open: boolean;
  recipe: Recipe | null;
  foods: Food[];
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
};

function RecipeFormSheet({ open, recipe, foods, onClose, onSave }: RecipeFormSheetProps) {
  const isEditing = recipe !== null;

  const [name, setName] = useState(() => recipe?.name ?? "");
  const [description, setDescription] = useState(() => recipe?.description ?? "");
  const [category, setCategory] = useState<RecipeCategory>(() => recipe?.category ?? "comida");
  const [servings, setServings] = useState(() => String(recipe?.servings ?? 1));
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(() => recipe?.ingredients ?? []);
  const [ingredientQuery, setIngredientQuery] = useState("");
  const [isPending, setIsPending] = useState(false);

  const canSubmit =
    name.trim().length > 0 && Number(servings) > 0 && ingredients.length > 0;

  const ingredientMatches = useMemo(() => {
    const normalized = ingredientQuery.trim().toLowerCase();
    if (!normalized) return [];

    return foods
      .filter((food) => !ingredients.some((ingredient) => ingredient.foodId === food.id))
      .filter((food) => food.name.toLowerCase().includes(normalized))
      .slice(0, 6);
  }, [foods, ingredientQuery, ingredients]);

  function addIngredient(food: Food) {
    setIngredients((current) => [
      ...current,
      { foodId: food.id, foodName: food.name, grams: food.servingG },
    ]);
    setIngredientQuery("");
  }

  function updateIngredientGrams(foodId: string, grams: string) {
    const value = Number(grams);
    setIngredients((current) =>
      current.map((ingredient) =>
        ingredient.foodId === foodId
          ? { ...ingredient, grams: Number.isFinite(value) ? value : 0 }
          : ingredient,
      ),
    );
  }

  function removeIngredient(foodId: string) {
    setIngredients((current) => current.filter((ingredient) => ingredient.foodId !== foodId));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsPending(true);

    const result = await saveRecipeAction({
      recipeId: recipe?.id,
      name,
      description,
      category,
      servings,
      ingredients: ingredients.map((ingredient) => ({
        foodId: ingredient.foodId,
        grams: String(ingredient.grams),
      })),
    });

    setIsPending(false);

    if (result.status !== "success" || !result.recipe) {
      toast.error(result.message ?? "No se pudo guardar la receta.");
      return;
    }

    onSave(result.recipe);
  }

  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent side="right" className="w-[min(28rem,92vw)]">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar receta" : "Nueva receta"}</SheetTitle>
          <p className="text-sm text-[var(--foreground-muted)]">
            {isEditing ? "Modifica los datos de la receta." : "Completa los campos para agregar una receta al catálogo."}
          </p>
        </SheetHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="grid flex-1 gap-5 overflow-y-auto px-5 py-2">
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-alt)]">
              {(() => {
                const CategoryIcon = RECIPE_CATEGORY_ICONS[category];
                return (
                  <div
                    className="flex h-24 flex-col items-center justify-center gap-1.5 px-4 text-center"
                    style={{ background: RECIPE_CATEGORY_GRADIENTS[category] }}
                  >
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-black/30">
                      <CategoryIcon className="size-5" style={{ color: RECIPE_CATEGORY_ACCENT[category] }} />
                    </div>
                    <div>
                      <p className="truncate font-display text-base font-semibold text-white">
                        {name || "Nombre de la receta..."}
                      </p>
                      <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-white/70">
                        {RECIPE_CATEGORY_LABELS[category]}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
              Nombre de la receta
              <Input placeholder="Ej. Bowl de pollo y arroz" value={name} onChange={(e) => setName(e.target.value)} />
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
              Descripción (opcional)
              <textarea
                className="min-h-20 rounded-xl border border-[var(--border)] bg-[var(--card-alt)] px-3 py-2 text-sm font-normal text-[var(--foreground)] outline-none focus-visible:border-[var(--accent)]"
                placeholder="Breve descripción de la receta..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <div className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
              Categoría
              <div className="grid grid-cols-3 gap-1.5">
                {RECIPE_CATEGORIES.map((value) => (
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
                    {RECIPE_CATEGORY_LABELS[value]}
                  </button>
                ))}
              </div>
            </div>

            <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
              Porciones
              <Input type="number" min={1} value={servings} onChange={(e) => setServings(e.target.value)} />
            </label>

            <div className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
              Ingredientes
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#7d8697]" />
                <Input
                  className="pl-9"
                  placeholder="Buscar alimento para agregar..."
                  value={ingredientQuery}
                  onChange={(e) => setIngredientQuery(e.target.value)}
                />
                {ingredientMatches.length > 0 ? (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
                    {ingredientMatches.map((food) => (
                      <button
                        key={food.id}
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-normal text-[var(--foreground)] hover:bg-[var(--card-alt)]"
                        onClick={() => addIngredient(food)}
                      >
                        <span>{food.name}</span>
                        <span className="text-xs text-[#7887a6]">{food.servingG} g</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {ingredients.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[var(--border)] px-3 py-2.5 text-center text-xs font-normal text-[#7887a6]">
                  Buscá y agregá alimentos como ingredientes.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {ingredients.map((ingredient) => (
                    <li
                      key={ingredient.foodId}
                      className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card-alt)] px-3 py-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-normal text-[var(--foreground)]">
                        {ingredient.foodName}
                      </span>
                      <Input
                        type="number"
                        min={1}
                        className="h-8 w-20 text-right"
                        value={ingredient.grams}
                        onChange={(e) => updateIngredientGrams(ingredient.foodId, e.target.value)}
                      />
                      <span className="text-xs text-[#7887a6]">g</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 hover:text-red-400"
                        onClick={() => removeIngredient(ingredient.foodId)}
                      >
                        <X className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t border-[var(--border)]">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button disabled={!canSubmit || isPending} type="submit">
              {isPending ? <LoadingDots /> : null}
              {isEditing ? "Guardar cambios" : "Crear receta"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
