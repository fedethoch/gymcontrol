"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useRef, useState } from "react";

import { FoodChips } from "@/app/components/alimentos/FoodChips";
import { FoodSearchBar } from "@/app/components/alimentos/FoodSearchBar";
import { RecipeCreateDrawer, type RecipeCreateRequest } from "@/app/components/recetas/RecipeCreateDrawer";
import { RecipeDetailDrawer } from "@/app/components/recetas/RecipeDetailDrawer";
import { RecipeList } from "@/app/components/recetas/RecipeList";
import { RecipesEmpty } from "@/app/components/recetas/RecipesEmpty";
import { RecipesHeader } from "@/app/components/recetas/RecipesHeader";
import type { Food, Recipe } from "@/app/lib/nutrition-types";
import {
  countRecipesByChip,
  formatRecipeCount,
  formatRecipesMeta,
  groupRecipesByCategory,
  isGroupedRecipes,
  isOwnRecipe,
  recipeChipOptions,
  searchRecipes,
  type RecipeChip,
  type RecipeSort,
} from "@/app/lib/recipe-catalog";

export type RecipeViewer = { profileId: string; isAdmin: boolean } | null;

const SORT_HINTS: Record<Exclude<RecipeSort, "relevance">, string> = {
  protein: "más proteína primero",
  kcal: "menos calorías primero",
};

/** `/recetas` mobile (<1024): buscador, chips y lista; detalle y alta en bottom sheets (DESIGN.md §18). */
export function RecipesMobile({ recipes, foods, viewer }: { recipes: Recipe[]; foods: Food[]; viewer: RecipeViewer }) {
  const reduceMotion = useReducedMotion();
  const profileId = viewer?.profileId ?? null;
  const signedIn = viewer !== null;
  const [recipeList, setRecipeList] = useState(recipes);
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<RecipeChip>("all");
  const [sort, setSort] = useState<RecipeSort>("relevance");
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [createRequest, setCreateRequest] = useState<RecipeCreateRequest | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const createCountRef = useRef(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const listTopRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => countRecipesByChip(recipeList, profileId), [recipeList, profileId]);
  const results = useMemo(
    () => searchRecipes(recipeList, { query, chip, sort }, profileId),
    [recipeList, query, chip, sort, profileId],
  );
  const grouped = isGroupedRecipes({ query, chip, sort });
  const groups = grouped ? groupRecipesByCategory(results, counts) : null;
  const hasQuery = query.trim() !== "";
  const resultLabel = hasQuery
    ? `${results.length} ${results.length === 1 ? "resultado" : "resultados"}`
    : `${formatRecipeCount(results.length)}${sort === "relevance" ? "" : ` · ${SORT_HINTS[sort]}`}`;
  const isOwn = (recipe: Recipe) => isOwnRecipe(recipe, profileId);
  const canManage = (recipe: Recipe) => viewer !== null && (viewer.isAdmin || isOwn(recipe));

  function handleSortChange(value: RecipeSort) {
    setSort(value);

    // Si el orden se cambió con la lista scrolleada, volver al principio (bajo el buscador fijo).
    if ((chipsRef.current?.getBoundingClientRect().top ?? 0) < 0) {
      chipsRef.current?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  function openRecipe(recipe: Recipe, trigger: HTMLElement | null) {
    returnFocusRef.current = trigger;
    setSelected(recipe);
  }

  function returnFocus() {
    const target = returnFocusRef.current;

    if (target?.isConnected) {
      target.focus({ preventScroll: true });
    } else {
      listTopRef.current?.focus({ preventScroll: true });
    }
  }

  function upsertRecipe(saved: Recipe) {
    setRecipeList((current) =>
      current.some((candidate) => candidate.id === saved.id)
        ? current.map((candidate) => (candidate.id === saved.id ? saved : candidate))
        : [saved, ...current],
    );
  }

  function handleEdited(saved: Recipe) {
    upsertRecipe(saved);
    setSelected((current) => (current?.id === saved.id ? saved : current));
  }

  function handleCreated(saved: Recipe) {
    upsertRecipe(saved);
    setCreateRequest(null);
    setQuery("");
    setChip("all");
    setSort("relevance");
    returnFocusRef.current = null;
    setSelected(saved);
  }

  function handleArchived(recipeId: string) {
    const remaining = recipeList.filter((candidate) => candidate.id !== recipeId);
    setRecipeList(remaining);
    setSelected(null);
    returnFocusRef.current = null;

    // Si la categoría elegida quedó vacía, su chip desaparece: volver a "Todas".
    if (chip !== "all" && chip !== "own" && !remaining.some((candidate) => candidate.category === chip)) {
      setChip("all");
    }
  }

  function openCreate(name: string) {
    createCountRef.current += 1;
    setCreateRequest({ key: createCountRef.current, name });
  }

  function clearSearch() {
    setQuery("");
    searchRef.current?.focus();
  }

  const emptyCatalog = recipeList.length === 0;

  return (
    <>
      <RecipesHeader meta={formatRecipesMeta(counts, signedIn)} onCreate={signedIn ? () => openCreate("") : undefined} />

      {emptyCatalog ? (
        <RecipesEmpty kind="catalog" query="" canCreate={signedIn} onCreate={openCreate} onClear={clearSearch} />
      ) : (
        <>
          <FoodSearchBar
            inputRef={searchRef}
            query={query}
            onQueryChange={setQuery}
            sort={sort}
            onSortChange={handleSortChange}
            label="Buscar recetas"
            placeholder="Buscar receta o ingrediente"
            sortNote="por porción"
          />

          <div ref={chipsRef} className="scroll-mt-[calc(env(safe-area-inset-top)+4rem)]">
            <FoodChips legend="Filtrar recetas" options={recipeChipOptions(counts, signedIn)} value={chip} onChange={setChip} />
          </div>

          <p aria-live="polite" className="sr-only">
            {hasQuery ? resultLabel : ""}
          </p>

          <div ref={listTopRef} tabIndex={-1} className="outline-none" />

          {/* Sin animación en el primer render; al cambiar chip u orden, fundido corto. */}
          <AnimatePresence initial={false}>
            <motion.div
              key={`${chip}-${sort}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              {results.length === 0 ? (
                <RecipesEmpty
                  kind={!hasQuery && chip === "own" ? "own" : "search"}
                  query={query}
                  canCreate={signedIn}
                  onCreate={openCreate}
                  onClear={clearSearch}
                />
              ) : (
                <RecipeList
                  groups={groups}
                  recipes={results}
                  resultLabel={grouped ? null : resultLabel}
                  query={query}
                  emphasis={sort}
                  isOwn={isOwn}
                  onSelect={openRecipe}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      <RecipeDetailDrawer
        recipe={selected}
        own={selected ? isOwn(selected) : false}
        canManage={selected ? canManage(selected) : false}
        signedIn={signedIn}
        foods={foods}
        onClose={() => setSelected(null)}
        onSaved={handleEdited}
        onArchived={handleArchived}
        onReturnFocus={returnFocus}
      />

      {signedIn ? (
        <RecipeCreateDrawer request={createRequest} foods={foods} onClose={() => setCreateRequest(null)} onSaved={handleCreated} />
      ) : null}
    </>
  );
}
