"use client";

import { PencilLine, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FilterPanel } from "@/app/components/shared/FilterPanel";
import { MacroBar } from "@/app/components/shared/MacroBar";
import { RecipeForm } from "@/app/components/shared/RecipeForm";
import { Button } from "@/app/components/ui/Button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/app/components/ui/Drawer";
import { Input } from "@/app/components/ui/Input";
import { LoadingDots } from "@/app/components/ui/LoadingDots";
import { archiveRecipeAction } from "@/app/recetas/actions";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/app/components/ui/Sheet";
import { RECIPE_CATEGORIES, RECIPE_CATEGORY_LABELS, type Food, type Recipe } from "@/app/lib/nutrition-types";
import {
  fadeUp,
  listItemHover,
  motion,
  staggerContainer,
  tapFeedback,
} from "@/app/components/ui/motion";

type RecipeCatalogClientProps = {
  recipes: Recipe[];
  /** Alimentos del catálogo global para armar recetas (vacío si no hay sesión). */
  foods: Food[];
  /** null = visitante sin sesión (solo lectura). */
  viewer: { profileId: string; isAdmin: boolean } | null;
};

type FormState = { mode: "create" } | { mode: "edit"; recipe: Recipe } | null;

export function RecipeCatalogClient({ recipes: initialRecipes, foods, viewer }: RecipeCatalogClientProps) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [origin, setOrigin] = useState<string>("all");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [formState, setFormState] = useState<FormState>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const canManage = (recipe: Recipe) => viewer !== null && (viewer.isAdmin || recipe.createdBy === viewer.profileId);

  const filtered = recipes.filter((recipe) => {
    if (normalizedQuery && !recipe.name.toLowerCase().includes(normalizedQuery)) {
      return false;
    }
    if (category !== "all" && recipe.category !== category) {
      return false;
    }
    if (origin === "own" && recipe.createdBy !== viewer?.profileId) {
      return false;
    }
    return true;
  });

  function handleSaved(recipe: Recipe) {
    setRecipes((current) =>
      current.some((item) => item.id === recipe.id)
        ? current.map((item) => (item.id === recipe.id ? recipe : item))
        : [recipe, ...current],
    );
    setSelectedRecipe((current) => (current?.id === recipe.id ? recipe : current));
    setFormState(null);
  }

  function handleArchived(recipeId: string) {
    setRecipes((current) => current.filter((item) => item.id !== recipeId));
    setSelectedRecipe(null);
  }

  return (
    <section className="grid content-start gap-5">
      <div className="flex items-center gap-2">
        <label className="relative flex h-12 flex-1 items-center">
          <span className="sr-only">Buscar recetas</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#7d8697]" />
          <Input
            className="h-12 rounded-xl border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] pl-9"
            placeholder="Buscar receta..."
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
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
              value: category,
              onChange: setCategory,
            },
            ...(viewer
              ? [
                  {
                    label: "Origen",
                    options: [{ value: "own", label: "Mis recetas" }],
                    value: origin,
                    onChange: setOrigin,
                  },
                ]
              : []),
          ]}
          onClear={() => {
            setCategory("all");
            setOrigin("all");
          }}
        />

        {viewer ? (
          <Button type="button" className="h-12 shrink-0 rounded-xl px-4" onClick={() => setFormState({ mode: "create" })}>
            <Plus aria-hidden="true" className="size-4" />
            Crear
          </Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="motion-empty-state grid min-h-[20rem] place-items-center rounded-2xl border border-dashed border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-6 py-10 text-center">
          <div className="max-w-md">
            <p className="font-display text-lg font-semibold text-white">
              {origin === "own" && !normalizedQuery ? "Todavía no creaste recetas" : "No hay recetas para mostrar"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              {viewer
                ? "Creá una receta con alimentos del catálogo: queda pública para todos."
                : "Ajusta la búsqueda o la categoría seleccionada."}
            </p>
            {viewer ? (
              <Button type="button" variant="secondary" className="mt-4 h-11" onClick={() => setFormState({ mode: "create" })}>
                <Plus aria-hidden="true" className="size-4" />
                Crear receta
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3 lg:grid-cols-3"
        >
          {filtered.map((recipe) => (
            <motion.div key={recipe.id} variants={fadeUp}>
              <RecipeCard recipe={recipe} onSelect={() => setSelectedRecipe(recipe)} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <RecipeDetailSheet
        recipe={selectedRecipe}
        open={selectedRecipe !== null}
        canManage={selectedRecipe ? canManage(selectedRecipe) : false}
        onOpenChange={(open) => !open && setSelectedRecipe(null)}
        onEdit={(recipe) => setFormState({ mode: "edit", recipe })}
        onArchived={handleArchived}
      />

      <Drawer open={formState !== null} onOpenChange={(open) => !open && setFormState(null)}>
        <DrawerContent className="max-h-[90dvh]">
          <div className="mx-auto flex min-h-0 w-full max-w-xl flex-col">
            <DrawerHeader className="px-4 pb-2 pt-3 text-left">
              <DrawerTitle>{formState?.mode === "edit" ? "Editar receta" : "Nueva receta"}</DrawerTitle>
              <DrawerDescription>
                Pública para todos. Si la editás, lo que ya se registró en comidas no cambia.
              </DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 overflow-y-auto px-4 pb-4">
              {formState ? (
                <RecipeForm
                  key={formState.mode === "edit" ? formState.recipe.id : "create"}
                  recipe={formState.mode === "edit" ? formState.recipe : null}
                  foods={foods}
                  onSaved={handleSaved}
                  onCancel={() => setFormState(null)}
                />
              ) : null}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
}

function RecipeCard({ recipe, onSelect }: { recipe: Recipe; onSelect: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={listItemHover}
      whileTap={tapFeedback}
      className="group flex h-full w-full flex-col gap-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-alt)] text-left transition-colors duration-200 hover:bg-[rgba(255,255,255,0.03)]"
    >
      <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
        <span className="self-start rounded-full border border-[var(--border)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#9aa3b8] sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-[0.14em]">
          {formatGrams(recipe.servingG)} g/porción
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display truncate text-sm font-semibold tracking-[-0.02em] text-white">
            {recipe.name}
          </h3>
          {recipe.description ? (
            <p className="mt-1 line-clamp-1 text-xs leading-5 text-[var(--foreground-muted)] sm:line-clamp-2">
              {recipe.description}
            </p>
          ) : null}
          <p className="mt-1.5 text-xs uppercase tracking-[0.12em] text-[#7d8697] sm:mt-2">
            {recipe.calories} kcal/porción
          </p>
        </div>

        <MacroBar
          macros={{ proteinG: recipe.proteinG, carbsG: recipe.carbsG, fatG: recipe.fatG }}
          showLegend={false}
        />
      </div>
    </motion.button>
  );
}

function RecipeDetailSheet({
  recipe,
  open,
  canManage,
  onOpenChange,
  onEdit,
  onArchived,
}: {
  recipe: Recipe | null;
  open: boolean;
  canManage: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (recipe: Recipe) => void;
  onArchived: (recipeId: string) => void;
}) {
  const [displayRecipe, setDisplayRecipe] = useState<Recipe | null>(recipe);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  if (recipe && recipe !== displayRecipe) {
    setDisplayRecipe(recipe);
    setConfirmingArchive(false);
  }

  async function handleArchive(recipeId: string) {
    setIsArchiving(true);
    const result = await archiveRecipeAction(recipeId);
    setIsArchiving(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success("Receta eliminada del catálogo.");
    onArchived(recipeId);
  }

  if (!displayRecipe) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-full overflow-hidden p-0 sm:max-w-[28rem]"
        aria-describedby="recipe-detail-description"
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="relative flex shrink-0 items-end border-b border-[var(--border)] bg-[var(--card)] p-5 pt-14">
            <div>
              <SheetTitle className="font-display text-2xl font-bold tracking-[-0.05em] text-white">
                {displayRecipe.name}
              </SheetTitle>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                {RECIPE_CATEGORY_LABELS[displayRecipe.category]} · 1 porción = {formatGrams(displayRecipe.servingG)} g
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <SheetDescription id="recipe-detail-description" className="sr-only">
              Detalle de la receta {displayRecipe.name}
            </SheetDescription>

            <div className="flex flex-col gap-5">
              {displayRecipe.description ? (
                <p className="text-sm leading-6 text-[var(--foreground-muted)]">
                  {displayRecipe.description}
                </p>
              ) : null}

              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7887a6]">
                  Por porción ({formatGrams(displayRecipe.servingG)} g)
                </p>
                <MacroBar
                  macros={{
                    proteinG: displayRecipe.proteinG,
                    carbsG: displayRecipe.carbsG,
                    fatG: displayRecipe.fatG,
                  }}
                />
                <div className="grid grid-cols-4 gap-2.5">
                  <SpecChip label="Calorías" value={`${displayRecipe.calories} kcal`} />
                  <SpecChip label="Proteína" value={`${displayRecipe.proteinG} g`} />
                  <SpecChip label="Carbos" value={`${displayRecipe.carbsG} g`} />
                  <SpecChip label="Grasas" value={`${displayRecipe.fatG} g`} />
                </div>
              </div>

              <div className="h-px bg-[var(--border)]" />

              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7887a6]">
                  Ingredientes
                  {displayRecipe.totalWeightG != null ? ` · peso final ${formatGrams(displayRecipe.totalWeightG)} g` : ""}
                </p>
                <ul className="flex flex-col gap-2">
                  {displayRecipe.ingredients.map((ingredient) => (
                    <li
                      key={ingredient.foodId}
                      className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card-alt)] px-3.5 py-2.5 text-sm text-[var(--foreground)]"
                    >
                      <span>{ingredient.foodName}</span>
                      <span className="text-xs uppercase tracking-[0.12em] text-[#7887a6]">
                        {ingredient.grams} g
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {canManage ? (
                confirmingArchive ? (
                  <div
                    role="group"
                    aria-label="Confirmar eliminación"
                    className="grid gap-3 rounded-2xl border border-[rgba(244,63,94,0.35)] bg-[rgba(244,63,94,0.08)] p-4"
                  >
                    <p className="text-sm text-[var(--foreground)]">
                      ¿Eliminar “{displayRecipe.name}” del catálogo? Las comidas que ya la usaron no cambian.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button type="button" variant="ghost" className="h-11" onClick={() => setConfirmingArchive(false)} disabled={isArchiving}>
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        className="h-11 bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
                        onClick={() => handleArchive(displayRecipe.id)}
                        disabled={isArchiving}
                      >
                        {isArchiving ? <LoadingDots /> : <Trash2 aria-hidden="true" className="size-4" />}
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="secondary" className="h-11" onClick={() => onEdit(displayRecipe)}>
                      <PencilLine aria-hidden="true" className="size-4" />
                      Editar
                    </Button>
                    <Button type="button" variant="ghost" className="h-11 hover:text-[var(--danger)]" onClick={() => setConfirmingArchive(true)}>
                      <Trash2 aria-hidden="true" className="size-4" />
                      Eliminar
                    </Button>
                  </div>
                )
              ) : null}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function formatGrams(value: number) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(value);
}

function SpecChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--card-alt)] px-3 py-2.5">
      <span className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-[#7887a6]">{label}</span>
      <span className="text-sm font-semibold tracking-[-0.01em] text-[var(--foreground)]">{value}</span>
    </div>
  );
}
