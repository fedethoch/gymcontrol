"use client";

import { MacroRing } from "@/app/components/alimentos/MacroRing";
import { findMatchRange, ingredientLine, type RecipeGroup, type RecipeSort } from "@/app/lib/recipe-catalog";
import { MACRO_COLORS } from "@/app/lib/nutrition-style";
import type { Recipe } from "@/app/lib/nutrition-types";
import { cn } from "@/app/lib/utils";

type SelectRecipe = (recipe: Recipe, trigger: HTMLElement) => void;

/** Z4 · lista agrupada por categoría (Explorar) o plana con conteo (DESIGN.md §18.1). */
export function RecipeList({
  groups,
  recipes,
  resultLabel,
  query,
  emphasis,
  isOwn,
  onSelect,
}: {
  /** null = lista plana. */
  groups: RecipeGroup[] | null;
  recipes: Recipe[];
  resultLabel: string | null;
  query: string;
  emphasis: RecipeSort;
  isOwn: (recipe: Recipe) => boolean;
  onSelect: SelectRecipe;
}) {
  const rows = (items: Recipe[]) => (
    <ul className="-mx-4">
      {items.map((recipe) => (
        <li key={recipe.id}>
          <RecipeRow recipe={recipe} query={query} emphasis={emphasis} own={isOwn(recipe)} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="mt-4">
      {groups ? (
        groups.map((group) => (
          <section key={group.category} aria-labelledby={`recipes-group-${group.category}`}>
            <h2
              id={`recipes-group-${group.category}`}
              className="sticky top-[calc(env(safe-area-inset-top)+4rem)] z-[5] -mx-4 flex items-baseline justify-between gap-3 border-b border-[var(--border)] bg-[var(--background)] px-4 pb-2 pt-4 font-display text-[1.0625rem] font-semibold tracking-[-0.01em] text-[var(--foreground)]"
            >
              {group.label}
              <span className="font-mono text-xs font-normal tabular-nums text-[var(--foreground-muted)]">
                <span aria-hidden="true">{group.total}</span>
                <span className="sr-only">, {group.total} recetas</span>
              </span>
            </h2>
            {rows(group.recipes)}
          </section>
        ))
      ) : (
        <>
          {resultLabel ? (
            <p className="border-b border-[var(--border)] pb-2 text-[0.8125rem] text-[var(--foreground-muted)]">{resultLabel}</p>
          ) : null}
          {rows(recipes)}
        </>
      )}
    </div>
  );
}

function RecipeRow({
  recipe,
  query,
  emphasis,
  own,
  onSelect,
}: {
  recipe: Recipe;
  query: string;
  emphasis: RecipeSort;
  own: boolean;
  onSelect: SelectRecipe;
}) {
  return (
    <button
      type="button"
      onClick={(event) => onSelect(recipe, event.currentTarget)}
      className="relative grid min-h-[4.5rem] w-full scroll-mt-[calc(env(safe-area-inset-top)+6.5rem)] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--border)] px-4 py-2.5 text-left outline-none transition-colors duration-150 active:bg-[var(--card-alt)] focus-visible:bg-[var(--card-alt)] motion-reduce:transition-none"
    >
      <MacroRing macros={recipe} />
      <span className="min-w-0">
        <span className="line-clamp-2 text-[0.9375rem] font-medium leading-5 text-[var(--foreground)] [overflow-wrap:anywhere]">
          <Highlight text={recipe.name} query={query} />
          {own ? (
            <span className="ml-1.5 inline-block rounded-full border border-[var(--border-strong)] px-1.5 align-[1px] text-[0.6875rem] font-semibold leading-4 text-[var(--foreground-muted)]">
              Tuya
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-[0.8125rem] text-[var(--foreground-muted)]">
          <Highlight text={ingredientLine(recipe)} query={query} />
        </span>
      </span>
      <span className="grid justify-items-end gap-1 text-right">
        <span className="font-display text-[1.0625rem] font-bold leading-none tabular-nums text-[var(--foreground)]">
          {recipe.calories}
          <span className="ml-0.5 font-sans text-[0.6875rem] font-medium text-[var(--foreground-muted)]">kcal</span>
        </span>
        <span aria-hidden="true" className="whitespace-nowrap font-mono text-[0.6875rem] tabular-nums text-[var(--foreground-muted)]">
          <MacroLetter letter="P" color={MACRO_COLORS.protein} />{" "}
          <span className={cn(emphasis === "protein" && "font-semibold text-[var(--foreground)]")}>{recipe.proteinG}</span>
          {" · "}
          <MacroLetter letter="C" color={MACRO_COLORS.carbs} /> {recipe.carbsG}
          {" · "}
          <MacroLetter letter="G" color={MACRO_COLORS.fat} /> {recipe.fatG}
        </span>
        <span className="sr-only">
          {`, por porción: ${recipe.proteinG} g de proteína, ${recipe.carbsG} g de carbohidratos y ${recipe.fatG} g de grasas`}
        </span>
      </span>
    </button>
  );
}

/** Subraya en emerald lo que coincide con la búsqueda (sin tildes ni mayúsculas). */
function Highlight({ text, query }: { text: string; query: string }) {
  const range = query.trim() ? findMatchRange(text, query) : null;

  if (!range) return text;

  const [start, end] = range;

  return (
    <>
      {text.slice(0, start)}
      <mark className="bg-transparent font-semibold text-[var(--foreground)] underline decoration-[var(--accent)] decoration-2 underline-offset-[3px]">
        {text.slice(start, end)}
      </mark>
      {text.slice(end)}
    </>
  );
}

function MacroLetter({ letter, color }: { letter: string; color: string }) {
  return (
    <b className="font-medium" style={{ color }}>
      {letter}
    </b>
  );
}
