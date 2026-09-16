"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useRef, useState } from "react";

import { FoodChips } from "@/app/components/alimentos/FoodChips";
import { FoodCreateDrawer, type FoodCreateRequest } from "@/app/components/alimentos/FoodCreateDrawer";
import { FoodDetailDrawer } from "@/app/components/alimentos/FoodDetailDrawer";
import { FoodList } from "@/app/components/alimentos/FoodList";
import { FoodsEmpty } from "@/app/components/alimentos/FoodsEmpty";
import { FoodSearchBar } from "@/app/components/alimentos/FoodSearchBar";
import { FoodsHeader } from "@/app/components/alimentos/FoodsHeader";
import { FrequentFoods } from "@/app/components/alimentos/FrequentFoods";
import {
  CATALOG_PAGE_SIZE,
  chipOptions,
  countFoodsByChip,
  formatCatalogMeta,
  frequentFoodTiles,
  groupFoodsByCategory,
  isGroupedCatalog,
  searchCatalog,
  type FoodChip,
  type FoodSort,
} from "@/app/lib/food-catalog";
import type { Food, FoodMeasure, FrequentItem } from "@/app/lib/nutrition-types";

type Selection = { food: Food; measure?: FoodMeasure } | null;

const SORT_HINTS: Record<Exclude<FoodSort, "relevance">, string> = {
  protein: "más proteína primero",
  kcal: "menos calorías primero",
};

/** `/alimentos` mobile (<1024): buscador, chips, frecuentes y lista (DESIGN.md §13). */
export function FoodsMobile({
  foods,
  frequent,
  canCreate,
}: {
  foods: Food[];
  frequent: FrequentItem[];
  /** Usuario con sesión: alimentos propios, frecuentes y "Registrar". */
  canCreate: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [foodList, setFoodList] = useState(foods);
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<FoodChip>("all");
  const [sort, setSort] = useState<FoodSort>("relevance");
  const [visibleCount, setVisibleCount] = useState(CATALOG_PAGE_SIZE);
  const [selection, setSelection] = useState<Selection>(null);
  const [createRequest, setCreateRequest] = useState<FoodCreateRequest | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const createCountRef = useRef(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const listTopRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => countFoodsByChip(foodList), [foodList]);
  const results = useMemo(() => searchCatalog(foodList, { query, chip, sort }), [foodList, query, chip, sort]);
  const tiles = useMemo(() => (canCreate ? frequentFoodTiles(frequent, foodList) : []), [canCreate, frequent, foodList]);
  const grouped = isGroupedCatalog({ query, chip, sort });
  const visible = results.slice(0, visibleCount);
  const groups = grouped ? groupFoodsByCategory(visible, counts) : null;
  const hasQuery = query.trim() !== "";
  const resultLabel = hasQuery
    ? `${results.length} ${results.length === 1 ? "resultado" : "resultados"}`
    : `${results.length} ${results.length === 1 ? "alimento" : "alimentos"}${sort === "relevance" ? "" : ` · ${SORT_HINTS[sort]}`}`;

  function handleQueryChange(value: string) {
    setQuery(value);
    setVisibleCount(CATALOG_PAGE_SIZE);
  }

  function handleChipChange(value: FoodChip) {
    setChip(value);
    setVisibleCount(CATALOG_PAGE_SIZE);
  }

  function handleSortChange(value: FoodSort) {
    setSort(value);
    setVisibleCount(CATALOG_PAGE_SIZE);

    // Si el orden se cambió con la lista scrolleada, volver al principio (bajo el buscador fijo).
    const chipsTop = chipsRef.current?.getBoundingClientRect().top ?? 0;

    if (chipsTop < 0) {
      chipsRef.current?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  function openFood(food: Food, trigger: HTMLElement | null, measure?: FoodMeasure) {
    returnFocusRef.current = trigger;
    setSelection({ food, measure });
  }

  function returnFocus() {
    const target = returnFocusRef.current;
    const fallback = listTopRef.current;

    if (target?.isConnected) {
      target.focus({ preventScroll: true });
    } else {
      fallback?.focus({ preventScroll: true });
    }
  }

  function upsertFood(saved: Food) {
    setFoodList((current) =>
      current.some((candidate) => candidate.id === saved.id)
        ? current.map((candidate) => (candidate.id === saved.id ? saved : candidate))
        : [saved, ...current],
    );
  }

  function handleEdited(saved: Food) {
    upsertFood(saved);
    setSelection((current) => (current?.food.id === saved.id ? { ...current, food: saved } : current));
  }

  function handleCreated(saved: Food) {
    upsertFood(saved);
    setCreateRequest(null);
    setQuery("");
    setChip("all");
    setSort("relevance");
    setVisibleCount(CATALOG_PAGE_SIZE);
    returnFocusRef.current = null;
    setSelection({ food: saved });
  }

  function handleDeleted(foodId: string) {
    const remaining = foodList.filter((candidate) => candidate.id !== foodId);
    setFoodList(remaining);
    setSelection(null);
    returnFocusRef.current = null;

    // Si la categoría elegida quedó vacía, su chip desaparece: volver a "Todos".
    if (chip !== "all" && chip !== "own" && !remaining.some((candidate) => candidate.category === chip)) {
      setChip("all");
    }
  }

  function openCreate(name: string) {
    createCountRef.current += 1;
    setCreateRequest({ key: createCountRef.current, name });
  }

  return (
    <>
      <FoodsHeader meta={formatCatalogMeta(counts, canCreate)} onCreate={canCreate ? () => openCreate("") : undefined} />

      <FoodSearchBar
        inputRef={searchRef}
        query={query}
        onQueryChange={handleQueryChange}
        sort={sort}
        onSortChange={handleSortChange}
      />

      <div ref={chipsRef} className="scroll-mt-[calc(env(safe-area-inset-top)+4rem)]">
        <FoodChips options={chipOptions(counts, canCreate)} value={chip} onChange={handleChipChange} />
      </div>

      <p aria-live="polite" className="sr-only">
        {hasQuery ? resultLabel : ""}
      </p>

      {grouped && tiles.length > 0 ? <FrequentFoods tiles={tiles} onSelect={openFood} /> : null}

      <div ref={listTopRef} tabIndex={-1} className="outline-none" />

      {/* Sin animación en el primer render (el HTML del servidor queda visible); al cambiar chip u orden, fade corto. */}
      <AnimatePresence initial={false}>
        <motion.div
          key={`${chip}-${sort}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
        {results.length === 0 ? (
          <FoodsEmpty
            kind={!hasQuery && chip === "own" ? "own" : "search"}
            query={query}
            canCreate={canCreate}
            onCreate={openCreate}
            onClear={() => {
              handleQueryChange("");
              searchRef.current?.focus();
            }}
          />
        ) : (
          <FoodList
            groups={groups}
            foods={visible}
            resultLabel={grouped ? null : resultLabel}
            remaining={results.length - visible.length}
            emphasis={sort}
            onSelect={openFood}
            onShowMore={() => setVisibleCount((current) => current + CATALOG_PAGE_SIZE)}
          />
        )}
        </motion.div>
      </AnimatePresence>

      <FoodDetailDrawer
        food={selection?.food ?? null}
        initialMeasure={selection?.measure}
        canRegister={canCreate}
        onClose={() => setSelection(null)}
        onSaved={handleEdited}
        onDeleted={handleDeleted}
        onReturnFocus={returnFocus}
      />

      {canCreate ? (
        <FoodCreateDrawer request={createRequest} onClose={() => setCreateRequest(null)} onSaved={handleCreated} />
      ) : null}
    </>
  );
}
