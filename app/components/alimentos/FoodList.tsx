"use client";

import { MacroRing } from "@/app/components/alimentos/MacroRing";
import { Button } from "@/app/components/ui/Button";
import { formatDecimal, formatServingLine, type FoodGroup, type FoodSort } from "@/app/lib/food-catalog";
import { MACRO_COLORS } from "@/app/lib/nutrition-style";
import { getAmountUnitLabel, type Food } from "@/app/lib/nutrition-types";
import { cn } from "@/app/lib/utils";

type SelectFood = (food: Food, trigger: HTMLElement) => void;

/** Z5 · lista agrupada por categoría (Explorar) o plana con conteo (DESIGN.md §13.1). */
export function FoodList({
  groups,
  foods,
  resultLabel,
  remaining,
  emphasis,
  onSelect,
  onShowMore,
}: {
  /** null = lista plana. */
  groups: FoodGroup[] | null;
  foods: Food[];
  resultLabel: string | null;
  remaining: number;
  emphasis: FoodSort;
  onSelect: SelectFood;
  onShowMore: () => void;
}) {
  return (
    <div className="mt-4">
      {groups ? (
        groups.map((group) => (
          <section key={group.category} aria-labelledby={`foods-group-${group.category}`}>
            <h2
              id={`foods-group-${group.category}`}
              className="sticky top-[calc(env(safe-area-inset-top)+4rem)] z-[5] -mx-4 flex items-baseline justify-between gap-3 border-b border-[var(--border)] bg-[var(--background)] px-4 pb-2 pt-4 font-display text-[1.0625rem] font-semibold tracking-[-0.01em] text-[var(--foreground)]"
            >
              {group.label}
              <span className="font-mono text-xs font-normal tabular-nums text-[var(--foreground-muted)]">
                <span aria-hidden="true">{group.total}</span>
                <span className="sr-only">, {group.total} alimentos</span>
              </span>
            </h2>
            <FoodRows foods={group.foods} emphasis={emphasis} onSelect={onSelect} />
          </section>
        ))
      ) : (
        <>
          {resultLabel ? (
            <p className="border-b border-[var(--border)] pb-2 text-[0.8125rem] text-[var(--foreground-muted)]">{resultLabel}</p>
          ) : null}
          <FoodRows foods={foods} emphasis={emphasis} onSelect={onSelect} />
        </>
      )}

      {remaining > 0 ? (
        <div className="flex justify-center pt-5">
          <Button type="button" variant="secondary" className="h-11 rounded-2xl px-5" onClick={onShowMore}>
            Mostrar más ({remaining})
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function FoodRows({ foods, emphasis, onSelect }: { foods: Food[]; emphasis: FoodSort; onSelect: SelectFood }) {
  return (
    <ul className="-mx-4">
      {foods.map((food) => (
        <li key={food.id}>
          <FoodRow food={food} emphasis={emphasis} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}

function FoodRow({ food, emphasis, onSelect }: { food: Food; emphasis: FoodSort; onSelect: SelectFood }) {
  const unit = getAmountUnitLabel(food.category);

  return (
    <button
      type="button"
      onClick={(event) => onSelect(food, event.currentTarget)}
      className="relative grid min-h-16 w-full scroll-mt-[calc(env(safe-area-inset-top)+6.5rem)] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--border)] px-4 py-2.5 text-left outline-none transition-colors duration-150 active:bg-[var(--card-alt)] focus-visible:bg-[var(--card-alt)] motion-reduce:transition-none"
    >
      <MacroRing macros={food} />
      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[0.9375rem] font-medium text-[var(--foreground)]">{food.name}</span>
          {food.ownerUserId ? (
            <span className="shrink-0 rounded-full border border-[var(--border-strong)] px-1.5 text-[0.6875rem] font-semibold leading-4 text-[var(--foreground-muted)]">
              Tuyo
            </span>
          ) : null}
        </span>
        <span className="block truncate text-[0.8125rem] text-[var(--foreground-muted)]">{formatServingLine(food)}</span>
      </span>
      <span className="grid justify-items-end gap-1 text-right">
        <span className="font-display text-[1.0625rem] font-bold leading-none tabular-nums text-[var(--foreground)]">
          {food.calories}
          <span className="ml-0.5 font-sans text-[0.6875rem] font-medium text-[var(--foreground-muted)]">kcal</span>
        </span>
        <span aria-hidden="true" className="whitespace-nowrap font-mono text-[0.6875rem] tabular-nums text-[var(--foreground-muted)]">
          <MacroLetter letter="P" color={MACRO_COLORS.protein} />{" "}
          <span className={cn(emphasis === "protein" && "font-semibold text-[var(--foreground)]")}>{Math.round(food.proteinG)}</span>
          {" · "}
          <MacroLetter letter="C" color={MACRO_COLORS.carbs} /> {Math.round(food.carbsG)}
          {" · "}
          <MacroLetter letter="G" color={MACRO_COLORS.fat} /> {Math.round(food.fatG)}
        </span>
        <span className="sr-only">
          {`, cada ${formatDecimal(food.servingG)} ${unit}: ${formatDecimal(food.proteinG)} g de proteína, ${formatDecimal(food.carbsG)} g de carbohidratos y ${formatDecimal(food.fatG)} g de grasas`}
        </span>
      </span>
    </button>
  );
}

function MacroLetter({ letter, color }: { letter: string; color: string }) {
  return (
    <b className="font-medium" style={{ color }}>
      {letter}
    </b>
  );
}
