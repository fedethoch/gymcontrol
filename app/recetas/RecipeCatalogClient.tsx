"use client";

import Image from "next/image";
import { ImageIcon, Search } from "lucide-react";
import { useState } from "react";

import { FilterPanel } from "@/app/components/shared/FilterPanel";
import { MacroBar } from "@/app/components/shared/MacroBar";
import { Input } from "@/app/components/ui/Input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/app/components/ui/Sheet";
import {
  RECIPE_CATEGORY_ACCENT,
  RECIPE_CATEGORY_GRADIENTS,
  RECIPE_CATEGORY_ICONS,
} from "@/app/lib/nutrition-style";
import { RECIPE_CATEGORIES, RECIPE_CATEGORY_LABELS, type Recipe } from "@/app/lib/nutrition-types";
import {
  fadeUp,
  listItemHover,
  motion,
  staggerContainer,
  tapFeedback,
} from "@/app/components/ui/motion";

type RecipeCatalogClientProps = {
  recipes: Recipe[];
};

export function RecipeCatalogClient({ recipes }: RecipeCatalogClientProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = recipes.filter((recipe) => {
    if (normalizedQuery && !recipe.name.toLowerCase().includes(normalizedQuery)) {
      return false;
    }
    if (category !== "all" && recipe.category !== category) {
      return false;
    }
    return true;
  });

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
          ]}
          onClear={() => setCategory("all")}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="motion-empty-state grid min-h-[20rem] place-items-center rounded-2xl border border-dashed border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-6 py-10 text-center">
          <div className="max-w-md">
            <p className="font-display text-lg font-semibold text-white">
              No hay recetas para mostrar
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Ajusta la búsqueda o la categoría seleccionada.
            </p>
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
        onOpenChange={(open) => !open && setSelectedRecipe(null)}
      />
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
      <div className="relative aspect-[16/9] w-full shrink-0 bg-[var(--card)]">
        {recipe.imageUrl ? (
          <Image
            alt={recipe.name}
            className="object-cover"
            fill
            sizes="(max-width: 1024px) 50vw, 33vw"
            src={recipe.imageUrl}
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <ImageIcon className="size-8 text-[#5b6577]" aria-hidden="true" />
          </div>
        )}
        <span className="absolute right-2 top-2 rounded-full border border-[var(--border)] bg-[var(--card-alt)]/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#9aa3b8] backdrop-blur-sm sm:right-2.5 sm:top-2.5 sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-[0.14em]">
          {recipe.servings} {recipe.servings === 1 ? "porción" : "porciones"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 pt-0 sm:gap-3 sm:p-4">
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
            {recipe.calories} kcal
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
  onOpenChange,
}: {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [displayRecipe, setDisplayRecipe] = useState<Recipe | null>(recipe);

  if (recipe && recipe !== displayRecipe) {
    setDisplayRecipe(recipe);
  }

  if (!displayRecipe) return null;

  const Icon = RECIPE_CATEGORY_ICONS[displayRecipe.category];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-full overflow-hidden p-0 sm:max-w-[28rem]"
        aria-describedby="recipe-detail-description"
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="h-0.5 shrink-0 bg-[linear-gradient(90deg,transparent,#7c3aed_25%,#b995ff_60%,transparent)]" />

          <div
            className="relative flex h-44 shrink-0 items-end p-5"
            style={{ background: RECIPE_CATEGORY_GRADIENTS[displayRecipe.category] }}
          >
            <Icon
              className="absolute right-5 top-5 size-12 opacity-30"
              style={{ color: RECIPE_CATEGORY_ACCENT[displayRecipe.category] }}
              aria-hidden="true"
            />
            <div>
              <SheetTitle className="font-display text-2xl font-bold tracking-[-0.05em] text-white">
                {displayRecipe.name}
              </SheetTitle>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#b985ff]">
                {RECIPE_CATEGORY_LABELS[displayRecipe.category]} · {displayRecipe.servings}{" "}
                {displayRecipe.servings === 1 ? "porción" : "porciones"}
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
                  Macronutrientes totales
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
                  <SpecChip label="Carbohidratos" value={`${displayRecipe.carbsG} g`} />
                  <SpecChip label="Grasas" value={`${displayRecipe.fatG} g`} />
                </div>
              </div>

              <div className="h-px bg-[var(--border)]" />

              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7887a6]">
                  Ingredientes
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
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SpecChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--card-alt)] px-3 py-2.5">
      <span className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-[#7887a6]">{label}</span>
      <span className="text-sm font-semibold tracking-[-0.01em] text-[var(--foreground)]">{value}</span>
    </div>
  );
}
