"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";

import { FoodForm } from "@/app/components/shared/FoodForm";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { LoadingDots } from "@/app/components/ui/LoadingDots";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/Select";
import { searchByName } from "@/app/lib/food-search";
import {
  describeOption,
  formatQuantity,
  getFoodGramsPerUnit,
  optionKcalLabel,
  optionKey,
  parseQuantity,
  previewNutrition,
  resolveDefaultAmount,
  type PickerOption,
} from "@/app/lib/meal-amounts";
import {
  getAmountUnitLabel,
  type Food,
  type FoodMeasure,
  type FrequentItem,
  type MealItemInput,
  type RecipeOption,
} from "@/app/lib/nutrition-types";

const RESULT_LIMIT = 8;
const FREQUENT_CHIPS_LIMIT = 6;

export function FoodPicker({
  foods,
  recipes,
  frequentItems,
  actionLabel,
  onAdd,
  onFoodCreated,
}: {
  foods: Food[];
  recipes: RecipeOption[];
  frequentItems: FrequentItem[];
  actionLabel: string;
  /** Devuelve false si no se pudo agregar (se conserva la selección para reintentar). */
  onAdd: (input: MealItemInput) => boolean | Promise<boolean>;
  onFoodCreated: (food: Food) => void;
}) {
  const inputId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<PickerOption | null>(null);
  const [measure, setMeasure] = useState<FoodMeasure>("g");
  const [quantity, setQuantity] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const options = useMemo<PickerOption[]>(
    () => [
      ...foods.map((food) => ({ kind: "food" as const, id: food.id, name: food.name, food })),
      ...recipes.map((recipe) => ({ kind: "recipe" as const, id: recipe.id, name: recipe.name, recipe })),
    ],
    [foods, recipes],
  );

  const frequentByKey = useMemo(
    () => new Map(frequentItems.map((item) => [`${item.kind}:${item.id}`, item])),
    [frequentItems],
  );

  const frequentOptions = useMemo(
    () =>
      frequentItems.flatMap((item) => {
        const option = options.find((candidate) => candidate.kind === item.kind && candidate.id === item.id);
        return option ? [option] : [];
      }),
    [frequentItems, options],
  );

  const trimmedQuery = query.trim();
  const results = trimmedQuery
    ? searchByName(options, trimmedQuery, {
        limit: RESULT_LIMIT,
        boost: (option) =>
          (frequentByKey.has(`${option.kind}:${option.id}`) ? 15 : 0) +
          (option.kind === "food" && option.food.ownerUserId ? 10 : 0) +
          // A igual coincidencia, el alimento simple antes que el plato preparado.
          (option.kind === "food" && option.food.category !== "mixed" ? 1 : 0),
      })
    : [];

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const selectedFood = selected?.kind === "food" ? selected.food : null;
  const isRecipe = selected?.kind === "recipe";
  // En recetas la "unidad" es la porción que definió el creador.
  const gramsPerUnit = selected?.kind === "recipe" ? selected.recipe.servingG : selectedFood ? getFoodGramsPerUnit(selectedFood) : null;
  const amountUnit = selectedFood ? getAmountUnitLabel(selectedFood.category) : "g";
  const amountLabel = amountUnit === "ml" ? "Mililitros" : "Gramos";
  const unitLabel = isRecipe ? "Porciones" : "Unidades";
  const isUnit = gramsPerUnit != null && measure === "unit";
  const parsedQuantity = parseQuantity(quantity);
  const hasValidQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0;
  const preview = selected && hasValidQuantity ? previewNutrition(selected, isUnit ? "unit" : "g", parsedQuantity) : null;

  function reset() {
    setQuery("");
    setSelected(null);
    setQuantity("");
    setMeasure("g");
  }

  function selectOption(option: PickerOption) {
    const amount = resolveDefaultAmount(option, frequentByKey.get(optionKey(option)));

    setSelected(option);
    setQuery(option.name);
    setIsOpen(false);
    setMeasure(amount.measure);
    setQuantity(formatQuantity(amount.quantity));
  }

  function handleMeasureChange(nextMeasure: FoodMeasure) {
    if (hasValidQuantity && gramsPerUnit) {
      setQuantity(formatQuantity(nextMeasure === "unit" ? parsedQuantity / gramsPerUnit : parsedQuantity * gramsPerUnit));
    }

    setMeasure(nextMeasure);
  }

  async function handleAdd() {
    if (!selected || !hasValidQuantity) {
      toast.error("Elegí un alimento y una cantidad válida.");
      return;
    }

    const input: MealItemInput =
      selected.kind === "recipe"
        ? { kind: "recipe", recipeId: selected.id, measure: isUnit ? "unit" : "g", quantity: parsedQuantity }
        : { kind: "food", foodId: selected.id, measure: isUnit ? "unit" : "g", quantity: parsedQuantity };

    setIsAdding(true);

    try {
      if (await onAdd(input)) {
        reset();
      }
    } finally {
      setIsAdding(false);
    }
  }

  if (isCreating) {
    return (
      <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card-alt)] p-4">
        <div>
          <p className="font-display text-base font-semibold text-[var(--foreground)]">Nuevo alimento</p>
          <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">Solo lo ves vos y queda guardado para la próxima.</p>
        </div>
        <FoodForm
          initialName={trimmedQuery}
          variant="inline"
          submitLabel="Crear y elegir"
          onCancel={() => setIsCreating(false)}
          onSaved={(food) => {
            onFoodCreated(food);
            setIsCreating(false);
            selectOption({ kind: "food", id: food.id, name: food.name, food });
          }}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div ref={containerRef} className="relative">
        <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-[var(--foreground-muted)]">
          Buscar alimento o receta
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--foreground-muted)]"
          />
          <Input
            id={inputId}
            autoComplete="off"
            className="pl-9 pr-11"
            placeholder="Ej. pollo, mate, empanada…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(null);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setIsOpen(false);
              }
            }}
          />
          {query ? (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={reset}
              className="absolute right-0 top-0 grid size-11 place-items-center rounded-xl text-[var(--foreground-muted)] outline-none hover:text-[var(--foreground)] focus-visible:shadow-[var(--focus-glow)]"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        {isOpen && trimmedQuery && !selected ? (
          <div
            aria-label="Resultados de búsqueda"
            className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-72 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
          >
            {results.map((option) => (
              <button
                key={`${option.kind}:${option.id}`}
                type="button"
                onClick={() => selectOption(option)}
                className="flex min-h-12 w-full items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-2 text-left outline-none hover:bg-[var(--card-alt)] focus-visible:bg-[var(--card-alt)] active:bg-[var(--card-alt)]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-[var(--foreground)]">{option.name}</span>
                  <span className="block truncate text-xs text-[var(--foreground-muted)]">
                    {describeOption(option, frequentByKey.has(`${option.kind}:${option.id}`))}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-[var(--foreground-muted)]">
                  {optionKcalLabel(option)}
                </span>
              </button>
            ))}
            {results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-[var(--foreground-muted)]">No encontramos “{trimmedQuery}”.</p>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsCreating(true);
              }}
              className="flex min-h-12 w-full items-center gap-2 px-4 text-left text-sm font-semibold text-[var(--accent-bright)] outline-none hover:bg-[var(--card-alt)] focus-visible:bg-[var(--card-alt)]"
            >
              <Plus aria-hidden="true" className="size-4" />
              Crear “{trimmedQuery}”
            </button>
          </div>
        ) : null}
      </div>

      {!selected && !trimmedQuery && frequentOptions.length > 0 ? (
        <div className="grid gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">Frecuentes</p>
          <div className="flex flex-wrap gap-2">
            {frequentOptions.slice(0, FREQUENT_CHIPS_LIMIT).map((option) => (
              <button
                key={`${option.kind}:${option.id}`}
                type="button"
                onClick={() => selectOption(option)}
                className="min-h-11 max-w-full truncate rounded-full border border-[var(--border)] bg-[var(--card-alt)] px-4 text-sm text-[var(--foreground)] outline-none transition-colors hover:border-[var(--border-strong)] focus-visible:shadow-[var(--focus-glow)] active:scale-[0.98]"
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {selected ? (
        <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card-alt)] p-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1.5 text-[13px] font-medium text-[var(--foreground-muted)]">
              Medida
              <Select
                value={isUnit ? "unit" : "g"}
                disabled={gramsPerUnit == null}
                onValueChange={(value) => handleMeasureChange(value as FoodMeasure)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">{amountLabel}</SelectItem>
                  {gramsPerUnit != null ? (
                    <SelectItem value="unit">
                      {isRecipe
                        ? `Porciones (1 = ${formatQuantity(gramsPerUnit)} g)`
                        : `Unidades (1 u ≈ ${formatQuantity(gramsPerUnit)} ${amountUnit})`}
                    </SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-1.5 text-[13px] font-medium text-[var(--foreground-muted)]">
              {isUnit ? unitLabel : amountLabel}
              <Input
                inputMode="decimal"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleAdd();
                  }
                }}
              />
            </label>
          </div>
          {preview ? (
            <p className="font-mono text-xs tabular-nums text-[var(--foreground-muted)]">
              ≈ {preview.kcal} kcal · P {preview.proteinG} g · C {preview.carbsG} g · G {preview.fatG} g
            </p>
          ) : null}
          <Button type="button" variant="outline" className="h-11" onClick={handleAdd} disabled={isAdding || !hasValidQuantity}>
            {isAdding ? <LoadingDots /> : <Plus aria-hidden="true" className="size-4" />}
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
