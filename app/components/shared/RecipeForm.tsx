"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { LoadingDots } from "@/app/components/ui/LoadingDots";
import { RECIPE_CATEGORIES, RECIPE_CATEGORY_LABELS, type Food, type Recipe, type RecipeCategory } from "@/app/lib/nutrition-types";
import { buildRecipeSnapshot, nutritionFromSnapshot, recipeBaseGrams } from "@/app/lib/recipe-nutrition";
import type { RecipeFormField } from "@/app/lib/recipes-form";
import { saveRecipeAction } from "@/app/recetas/actions";
import { cn } from "@/app/lib/utils";

type RecipeFormProps = {
  /** Si viene, edita esa receta; si no, crea una nueva. */
  recipe?: Recipe | null;
  /** Nombre precargado al crear ("Crear receta «…»"). */
  initialName?: string;
  /** Solo alimentos del catálogo global: una receta pública no puede usar alimentos privados. */
  foods: Food[];
  onSaved: (recipe: Recipe) => void;
  onCancel: () => void;
};

type DraftIngredient = { foodId: string; foodName: string; grams: string };

const chipClass =
  "min-h-11 rounded-xl border px-2 text-sm font-medium transition-colors active:scale-[0.98] focus-visible:shadow-[var(--focus-glow)] outline-none";

/** Acepta coma decimal (teclado es-AR). */
function toNumber(value: string) {
  const parsed = Number(value.replace(",", ".").trim());
  return value.trim() && Number.isFinite(parsed) ? parsed : null;
}

export function RecipeForm({ recipe, initialName = "", foods, onSaved, onCancel }: RecipeFormProps) {
  const [name, setName] = useState(recipe?.name ?? initialName);
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [category, setCategory] = useState<RecipeCategory>(recipe?.category ?? "comida");
  const [servingG, setServingG] = useState(recipe ? String(recipe.servingG) : "");
  const [totalWeightG, setTotalWeightG] = useState(recipe?.totalWeightG != null ? String(recipe.totalWeightG) : "");
  const [ingredients, setIngredients] = useState<DraftIngredient[]>(
    () => recipe?.ingredients.map((ingredient) => ({ ...ingredient, grams: String(ingredient.grams) })) ?? [],
  );
  const [query, setQuery] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RecipeFormField, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const foodsById = useMemo(() => new Map(foods.map((food) => [food.id, food])), [foods]);

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return [];

    return foods
      .filter((food) => !ingredients.some((ingredient) => ingredient.foodId === food.id))
      .filter((food) => food.name.toLowerCase().includes(normalized))
      .slice(0, 6);
  }, [foods, ingredients, query]);

  const preview = useMemo(() => {
    const serving = toNumber(servingG);
    const input = {
      servingG: serving ?? 0,
      totalWeightG: toNumber(totalWeightG),
      ingredients: ingredients.map((ingredient) => {
        const food = foodsById.get(ingredient.foodId);
        return {
          grams: toNumber(ingredient.grams) ?? 0,
          food: food
            ? { servingG: food.servingG, calories: food.calories, proteinG: food.proteinG, carbsG: food.carbsG, fatG: food.fatG }
            : null,
        };
      }),
    };
    const snapshot = serving && serving > 0 ? buildRecipeSnapshot(input) : null;

    if (!snapshot || !serving) return null;

    return {
      baseGrams: recipeBaseGrams(input),
      portions: recipeBaseGrams(input) / serving,
      portion: nutritionFromSnapshot(snapshot, serving),
    };
  }, [foodsById, ingredients, servingG, totalWeightG]);

  function addIngredient(food: Food) {
    setIngredients((current) => [...current, { foodId: food.id, foodName: food.name, grams: String(food.servingG) }]);
    setQuery("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const result = await saveRecipeAction({
      recipeId: recipe?.id,
      name,
      description,
      category,
      servingG,
      totalWeightG,
      ingredients: ingredients.map((ingredient) => ({ foodId: ingredient.foodId, grams: ingredient.grams })),
    });

    setIsSaving(false);
    setFieldErrors(result.fieldErrors);

    if (result.status !== "success" || !result.recipe) {
      toast.error(result.message ?? "No se pudo guardar la receta.");
      return;
    }

    toast.success(result.message ?? "Receta guardada.");
    onSaved(result.recipe);
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <Field label="Nombre" error={fieldErrors.name}>
        <Input
          autoFocus={!recipe}
          maxLength={80}
          placeholder="Ej. Bowl de pollo y arroz"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>

      <fieldset className="grid gap-1.5">
        <legend className="mb-1.5 text-[13px] font-medium text-[var(--foreground-muted)]">Categoría</legend>
        <div className="grid grid-cols-3 gap-2">
          {RECIPE_CATEGORIES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
              className={cn(
                chipClass,
                category === value
                  ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--foreground)]"
                  : "border-[var(--border)] bg-[var(--card-alt)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
              )}
            >
              {RECIPE_CATEGORY_LABELS[value]}
            </button>
          ))}
        </div>
      </fieldset>

      <Field label="Descripción (opcional)" error={fieldErrors.description}>
        <textarea
          className="min-h-20 rounded-xl border border-[var(--border)] bg-[var(--card-alt)] px-3 py-2 text-base font-normal text-[var(--foreground)] outline-none focus-visible:border-[var(--accent)] sm:text-sm"
          maxLength={280}
          placeholder="Cómo se prepara, tips…"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>

      <div className="grid gap-2">
        <span className="text-[13px] font-medium text-[var(--foreground-muted)]">Ingredientes (del catálogo)</span>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <Input
            aria-label="Buscar alimento para agregar"
            className="pl-9"
            placeholder="Buscar alimento…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {matches.length > 0 ? (
            <div className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
              {matches.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--card-alt)]"
                  onClick={() => addIngredient(food)}
                >
                  <span className="truncate">{food.name}</span>
                  <span className="shrink-0 text-xs text-[var(--foreground-muted)]">{food.calories} kcal/{food.servingG} g</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {ingredients.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--border)] px-3 py-3 text-center text-xs text-[var(--foreground-muted)]">
            Buscá y agregá los alimentos que lleva la receta, en crudo.
          </p>
        ) : (
          <ul className="grid gap-2">
            {ingredients.map((ingredient) => (
              <li
                key={ingredient.foodId}
                className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card-alt)] py-1 pl-3 pr-1"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-[var(--foreground)]">{ingredient.foodName}</span>
                <Input
                  aria-label={`Gramos de ${ingredient.foodName}`}
                  inputMode="decimal"
                  className="h-11 w-20 text-right"
                  value={ingredient.grams}
                  onChange={(event) =>
                    setIngredients((current) =>
                      current.map((item) => (item.foodId === ingredient.foodId ? { ...item, grams: event.target.value } : item)),
                    )
                  }
                />
                <span className="text-xs text-[var(--foreground-muted)]">g</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 hover:text-[var(--danger)]"
                  aria-label={`Quitar ${ingredient.foodName}`}
                  onClick={() => setIngredients((current) => current.filter((item) => item.foodId !== ingredient.foodId))}
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {fieldErrors.ingredients ? <span className="text-xs text-[var(--danger)]">{fieldErrors.ingredients}</span> : null}
      </div>

      <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Porción (g)" error={fieldErrors.servingG}>
            <Input inputMode="decimal" placeholder="Ej. 250" value={servingG} onChange={(event) => setServingG(event.target.value)} />
          </Field>
          <Field label="Peso final (g, opcional)" error={fieldErrors.totalWeightG}>
            <Input
              inputMode="decimal"
              placeholder={ingredients.length > 0 ? `≈ ${Math.round(ingredients.reduce((sum, item) => sum + (toNumber(item.grams) ?? 0), 0))}` : "Ya cocida"}
              value={totalWeightG}
              onChange={(event) => setTotalWeightG(event.target.value)}
            />
          </Field>
        </div>
        <p className="text-xs leading-5 text-[var(--foreground-muted)]">
          Si la pesás ya cocida, cargá el peso final: los macros por gramo salen más precisos. Si no, usamos la suma de los ingredientes.
        </p>
        {preview ? (
          <p className="text-sm text-[var(--foreground)]" aria-live="polite">
            Rinde ≈ {formatOneDecimal(preview.portions)} {preview.portions === 1 ? "porción" : "porciones"} · 1 porción ={" "}
            <strong className="font-semibold">{Math.round(preview.portion.kcal)} kcal</strong>, P {Math.round(preview.portion.proteinG)} g · C{" "}
            {Math.round(preview.portion.carbsG)} g · G {Math.round(preview.portion.fatG)} g
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="ghost" className="h-11" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" className="h-11" disabled={isSaving}>
          {isSaving ? <LoadingDots /> : null}
          {recipe ? "Guardar cambios" : "Publicar receta"}
        </Button>
      </div>
    </form>
  );
}

function formatOneDecimal(value: number) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(value);
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-[13px] font-medium text-[var(--foreground-muted)]">
      {label}
      {children}
      {error ? <span className="text-xs text-[var(--danger)]">{error}</span> : null}
    </label>
  );
}
