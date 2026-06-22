"use client";

import Image from "next/image";

import { Search } from "lucide-react";
import { useState } from "react";

import { MacroBar } from "@/app/components/shared/MacroBar";
import { FilterPanel } from "@/app/components/shared/FilterPanel";
import { Input } from "@/app/components/ui/Input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/app/components/ui/Sheet";
import {
  CATEGORY_ACCENT,
  CATEGORY_GRADIENTS,
  CATEGORY_ICONS,
} from "@/app/lib/nutrition-style";
import { FOOD_CATEGORIES, FOOD_CATEGORY_LABELS, type Food } from "@/app/lib/nutrition-types";
import {
  fadeUp,
  listItemHover,
  motion,
  staggerContainer,
  tapFeedback,
} from "@/app/components/ui/motion";

type NutritionCatalogClientProps = {
  foods: Food[];
};

export function NutritionCatalogClient({ foods }: NutritionCatalogClientProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = foods.filter((food) => {
    if (normalizedQuery && !food.name.toLowerCase().includes(normalizedQuery)) {
      return false;
    }
    if (category !== "all" && food.category !== category) {
      return false;
    }
    return true;
  });

  return (
    <section className="grid content-start gap-5">
      <div className="flex items-center gap-2">
        <label className="relative flex h-12 flex-1 items-center">
          <span className="sr-only">Buscar alimentos</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#7d8697]" />
          <Input
            className="h-12 rounded-xl border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] pl-9"
            placeholder="Buscar alimento..."
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
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
              No hay alimentos para mostrar
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
          className="flex flex-col divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-alt)]"
        >
          {filtered.map((food) => (
            <motion.div key={food.id} variants={fadeUp}>
              <FoodRow food={food} onSelect={() => setSelectedFood(food)} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <FoodDetailSheet
        food={selectedFood}
        open={selectedFood !== null}
        onOpenChange={(open) => !open && setSelectedFood(null)}
      />
    </section>
  );
}

function FoodRow({ food, onSelect }: { food: Food; onSelect: () => void }) {
  const Icon = CATEGORY_ICONS[food.category];

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={listItemHover}
      whileTap={tapFeedback}
      className="group flex w-full flex-col gap-3 px-4 py-3.5 text-left transition-colors duration-200 hover:bg-[rgba(255,255,255,0.03)] sm:flex-row sm:items-center sm:gap-4"
    >
      <span
        className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl"
        style={{ background: CATEGORY_GRADIENTS[food.category] }}
        aria-hidden="true"
      >
        <Icon className="size-5" style={{ color: CATEGORY_ACCENT[food.category] }} />
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="font-display truncate text-sm font-semibold tracking-[-0.02em] text-white">
          {food.name}
        </h3>
        <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-[#7d8697]">
          {food.servingG} g · {food.calories} kcal
          {food.gramsPerUnit != null ? ` · 1u (≈${food.gramsPerUnit} g)` : ""}
        </p>
      </div>

      <div className="sm:w-40 sm:shrink-0">
        <MacroBar
          macros={{ proteinG: food.proteinG, carbsG: food.carbsG, fatG: food.fatG }}
          showLegend={false}
        />
      </div>
    </motion.button>
  );
}

function FoodDetailSheet({
  food,
  open,
  onOpenChange,
}: {
  food: Food | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [displayFood, setDisplayFood] = useState<Food | null>(food);

  if (food && food !== displayFood) {
    setDisplayFood(food);
  }

  if (!displayFood) return null;

  const Icon = CATEGORY_ICONS[displayFood.category];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-full overflow-hidden p-0 sm:max-w-[28rem]"
        aria-describedby="food-detail-description"
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div
            className="relative flex h-44 shrink-0 items-end p-5"
            style={{ background: CATEGORY_GRADIENTS[displayFood.category] }}
          >
            {displayFood.imageUrl ? (
              <Image
                src={displayFood.imageUrl}
                alt={displayFood.name}
                fill
                className="object-cover opacity-40"
                sizes="448px"
              />
            ) : (
              <Icon
                className="absolute right-5 top-5 size-12 opacity-30"
                style={{ color: CATEGORY_ACCENT[displayFood.category] }}
                aria-hidden="true"
              />
            )}
            <div>
              <SheetTitle className="font-display text-2xl font-bold tracking-[-0.05em] text-white">
                {displayFood.name}
              </SheetTitle>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#b985ff]">
                {FOOD_CATEGORY_LABELS[displayFood.category]}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <SheetDescription id="food-detail-description" className="sr-only">
              Detalle nutricional de {displayFood.name}
            </SheetDescription>

            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-2.5">
                <SpecChip label="Porción" value={`${displayFood.servingG} g`} />
                <SpecChip label="Calorías" value={`${displayFood.calories} kcal`} />
              </div>

              <div className="h-px bg-[var(--border)]" />

              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7887a6]">
                  Macronutrientes por porción
                </p>
                <MacroBar
                  macros={{
                    proteinG: displayFood.proteinG,
                    carbsG: displayFood.carbsG,
                    fatG: displayFood.fatG,
                  }}
                />
                <div className="grid grid-cols-3 gap-2.5">
                  <SpecChip label="Proteína" value={`${displayFood.proteinG} g`} />
                  <SpecChip label="Carbohidratos" value={`${displayFood.carbsG} g`} />
                  <SpecChip label="Grasas" value={`${displayFood.fatG} g`} />
                </div>
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
    <div className="flex flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--card-alt)] px-3.5 py-2.5">
      <span className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-[#7887a6]">{label}</span>
      <span className="text-sm font-semibold tracking-[-0.01em] text-[var(--foreground)]">{value}</span>
    </div>
  );
}
