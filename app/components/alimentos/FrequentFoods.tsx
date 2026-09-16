"use client";

import { HomeSectionHeader } from "@/app/components/home/HomeSectionHeader";
import type { FrequentFoodTile } from "@/app/lib/food-catalog";
import type { Food, FoodMeasure } from "@/app/lib/nutrition-types";

/** Z4 · lo que el usuario registra seguido, en tiles horizontales (DESIGN.md §13.1). */
export function FrequentFoods({
  tiles,
  onSelect,
}: {
  tiles: FrequentFoodTile[];
  onSelect: (food: Food, trigger: HTMLElement, measure: FoodMeasure) => void;
}) {
  return (
    <section aria-labelledby="foods-frequent-title" className="mt-6">
      <HomeSectionHeader id="foods-frequent-title" title="Frecuentes" />
      <ul className="-mx-4 mt-2 flex snap-x gap-2.5 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tiles.map((tile) => (
          <li key={tile.food.id} className="shrink-0 snap-start">
            <button
              type="button"
              onClick={(event) => onSelect(tile.food, event.currentTarget, tile.measure)}
              className="pressable grid h-32 w-[8.5rem] content-between rounded-[14px] border border-[var(--border)] bg-[var(--card)] p-3 text-left outline-none hover:bg-[var(--card-hover)] focus-visible:shadow-[var(--focus-glow)]"
            >
              <span className="line-clamp-2 text-sm font-semibold leading-tight text-[var(--foreground)]">{tile.food.name}</span>
              <span className="grid gap-1">
                <span className="font-display text-[1.375rem] font-bold leading-none tabular-nums text-[var(--foreground)]">
                  {tile.kcal}
                  <span className="ml-1 font-sans text-xs font-medium text-[var(--foreground-muted)]">kcal</span>
                </span>
                <span className="truncate text-xs text-[var(--foreground-muted)]">{tile.label}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
