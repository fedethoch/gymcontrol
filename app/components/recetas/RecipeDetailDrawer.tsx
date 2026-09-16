"use client";

import Link from "next/link";
import { ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { MacroRing } from "@/app/components/alimentos/MacroRing";
import { RecipeForm } from "@/app/components/shared/RecipeForm";
import { Button } from "@/app/components/ui/Button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/app/components/ui/Drawer";
import { LoadingDots } from "@/app/components/ui/LoadingDots";
import { AnimatedNumber } from "@/app/components/ui/motion";
import { NumberStepper } from "@/app/components/ui/NumberStepper";
import { formatDecimal, splitMacroKcal } from "@/app/lib/food-catalog";
import { MACRO_COLORS, RECIPE_CATEGORY_ICONS } from "@/app/lib/nutrition-style";
import { RECIPE_CATEGORY_LABELS, type Food, type Recipe } from "@/app/lib/nutrition-types";
import {
  formatPortions,
  ingredientLine,
  MAX_PORTIONS,
  mealChoiceLabel,
  MIN_PORTIONS,
  PORTION_STEP,
  RECIPE_MEAL_CHOICES,
  recipeIngredientRows,
  recipePortion,
  registerRecipeLabel,
  registroRecipeHref,
  type RecipeMealChoice,
} from "@/app/lib/recipe-catalog";
import { archiveRecipeAction } from "@/app/recetas/actions";
import { cn } from "@/app/lib/utils";

const MACROS = [
  { key: "protein", grams: "proteinG", label: "Proteína" },
  { key: "carbs", grams: "carbsG", label: "Carbos" },
  { key: "fat", grams: "fatG", label: "Grasas" },
] as const;

type View = "detail" | "edit" | "confirm-delete";

/** Detalle de la receta en bottom sheet (DESIGN.md §18.3). `recipe = null` = cerrado. */
export function RecipeDetailDrawer({
  recipe,
  own,
  canManage,
  signedIn,
  foods,
  onClose,
  onSaved,
  onArchived,
  onReturnFocus,
}: {
  recipe: Recipe | null;
  /** Receta del usuario: muestra "Tuya". */
  own: boolean;
  /** Creador o admin: "Editar" y "Eliminar". */
  canManage: boolean;
  signedIn: boolean;
  foods: Food[];
  onClose: () => void;
  onSaved: (recipe: Recipe) => void;
  onArchived: (recipeId: string) => void;
  onReturnFocus: () => void;
}) {
  // Conserva la última receta mientras el sheet se cierra.
  const [displayRecipe, setDisplayRecipe] = useState(recipe);

  if (recipe && recipe !== displayRecipe) {
    setDisplayRecipe(recipe);
  }

  return (
    <Drawer open={recipe !== null} onOpenChange={(open) => !open && onClose()} autoFocus>
      <DrawerContent
        className="max-h-[90dvh]"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onReturnFocus();
        }}
      >
        {displayRecipe ? (
          <RecipeDetailBody
            key={displayRecipe.id}
            recipe={displayRecipe}
            own={own}
            canManage={canManage}
            signedIn={signedIn}
            foods={foods}
            onSaved={onSaved}
            onArchived={onArchived}
          />
        ) : (
          <DrawerTitle className="sr-only">Receta</DrawerTitle>
        )}
      </DrawerContent>
    </Drawer>
  );
}

function RecipeDetailBody({
  recipe,
  own,
  canManage,
  signedIn,
  foods,
  onSaved,
  onArchived,
}: {
  recipe: Recipe;
  own: boolean;
  canManage: boolean;
  signedIn: boolean;
  foods: Food[];
  onSaved: (recipe: Recipe) => void;
  onArchived: (recipeId: string) => void;
}) {
  const [view, setView] = useState<View>("detail");
  const [portions, setPortions] = useState(1);
  const [meal, setMeal] = useState<RecipeMealChoice>("next");
  const [mealOpen, setMealOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const mealGroupId = useId();
  const Icon = RECIPE_CATEGORY_ICONS[recipe.category];
  const values = recipePortion(recipe, portions);
  const split = splitMacroKcal(recipe);
  const rows = recipeIngredientRows(recipe, portions);

  async function handleDelete() {
    setIsDeleting(true);
    const result = await archiveRecipeAction(recipe.id);
    setIsDeleting(false);

    if (!result.ok) {
      toast.error(result.message);
      setView("detail");
      return;
    }

    toast.success("Receta eliminada del catálogo.");
    onArchived(recipe.id);
  }

  if (view === "edit") {
    return (
      <>
        <DrawerHeader className="px-5 pb-2 pt-3 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
          <DrawerTitle className="text-xl font-bold tracking-[-0.02em]">Editar receta</DrawerTitle>
          <DrawerDescription>Pública para todos. Lo que ya se registró en comidas no cambia.</DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <RecipeForm
            recipe={recipe}
            foods={foods}
            onSaved={(saved) => {
              onSaved(saved);
              setView("detail");
            }}
            onCancel={() => setView("detail")}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-5 pt-1">
        <span className="flex min-w-0 items-center gap-1.5 text-[0.8125rem] font-semibold text-[var(--foreground-muted)]">
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          {RECIPE_CATEGORY_LABELS[recipe.category]}
          {own ? (
            <span className="rounded-full border border-[var(--border-strong)] px-1.5 text-[0.6875rem] leading-4">Tuya</span>
          ) : null}
        </span>
        <DrawerClose asChild>
          <button
            type="button"
            aria-label="Cerrar"
            className="pressable -mr-2.5 grid size-11 shrink-0 place-items-center rounded-full text-[var(--foreground-muted)] outline-none hover:text-[var(--foreground)] focus-visible:shadow-[var(--focus-glow)]"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </DrawerClose>
      </div>

      <div className="min-h-0 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <DrawerTitle className="font-display text-[1.625rem] font-bold leading-[1.15] tracking-[-0.03em] text-[var(--foreground)] [overflow-wrap:anywhere]">
          {recipe.name}
        </DrawerTitle>
        <DrawerDescription className="mt-1.5 text-[0.9375rem] leading-6 text-[var(--foreground-muted)]">
          {ingredientLine(recipe)}
        </DrawerDescription>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-baseline gap-2">
              <span
                aria-hidden="true"
                className="font-display text-5xl font-bold leading-none tracking-[-0.03em] tabular-nums text-[var(--foreground)]"
              >
                <AnimatedNumber value={values.kcal} />
              </span>
              <span aria-hidden="true" className="text-[0.9375rem] font-medium text-[var(--foreground-muted)]">
                kcal
              </span>
              <span className="sr-only" aria-live="polite">{`${values.kcal} kcal en ${formatPortions(portions)}`}</span>
            </p>
            <p aria-hidden="true" className="mt-2 font-mono text-[0.8125rem] tabular-nums text-[var(--foreground-muted)]">
              {formatPortions(portions)} · {values.grams} g
            </p>
          </div>
          <MacroRing macros={recipe} size={88} />
        </div>

        <dl className="mt-5 grid grid-cols-3">
          {MACROS.map((macro, index) => (
            <div
              key={macro.key}
              className={cn("grid min-w-0 gap-0.5", index > 0 && "border-l border-[var(--border)] pl-3", index < 2 && "pr-3")}
            >
              <dt className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-[var(--foreground-muted)]">
                <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: MACRO_COLORS[macro.key] }} />
                {macro.label}
              </dt>
              <dd className="font-display text-2xl font-bold leading-tight tabular-nums text-[var(--foreground)]">
                {values[macro.grams]}
                <span className="ml-0.5 font-sans text-xs font-medium text-[var(--foreground-muted)]">g</span>
              </dd>
              <dd className="font-mono text-xs tabular-nums text-[var(--foreground-muted)]">{split.pct[macro.key]} % kcal</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 border-y border-[var(--border)]">
          <div className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[0.9375rem] font-medium text-[var(--foreground)]">Porciones</p>
              <p className="text-[0.8125rem] text-[var(--foreground-muted)]">1 porción = {formatDecimal(recipe.servingG)} g</p>
            </div>
            <NumberStepper
              size="m"
              className="w-[10.5rem] shrink-0"
              value={portions}
              onChange={(value) => {
                if (value != null && value > 0) setPortions(Math.min(value, MAX_PORTIONS));
              }}
              step={PORTION_STEP}
              min={MIN_PORTIONS}
              max={MAX_PORTIONS}
              maxDecimals={1}
              label="Porciones"
              decrementLabel="Restar media porción"
              incrementLabel="Sumar media porción"
            />
          </div>

          {signedIn ? (
            <div className="border-t border-[var(--border)]">
              <button
                type="button"
                aria-expanded={mealOpen}
                aria-controls={mealGroupId}
                onClick={() => setMealOpen((open) => !open)}
                className="flex min-h-[3.25rem] w-full items-center justify-between gap-3 text-left outline-none focus-visible:shadow-[var(--focus-glow)]"
              >
                <span className="text-[0.9375rem] font-medium text-[var(--foreground)]">Comida</span>
                <span className="flex items-center gap-1.5 text-[0.9375rem] font-medium text-[var(--foreground)]">
                  {mealChoiceLabel(meal)}
                  <ChevronDown
                    aria-hidden="true"
                    className={cn("size-4 text-[var(--foreground-muted)] transition-transform duration-200 motion-reduce:transition-none", mealOpen && "rotate-180")}
                  />
                </span>
              </button>
              {mealOpen ? (
                <fieldset id={mealGroupId} className="pb-3">
                  <legend className="sr-only">Comida donde se registra</legend>
                  <div className="flex flex-wrap gap-2">
                    {RECIPE_MEAL_CHOICES.map((choice) => (
                      <label key={choice} className="cursor-pointer">
                        <input
                          type="radio"
                          name={`${mealGroupId}-meal`}
                          value={choice}
                          checked={meal === choice}
                          onChange={() => {
                            setMeal(choice);
                            setMealOpen(false);
                          }}
                          className="peer sr-only"
                        />
                        <span className="flex h-10 items-center rounded-full border border-[var(--border)] px-3.5 text-sm font-semibold text-[var(--foreground-muted)] transition-colors duration-150 peer-checked:border-[var(--foreground)] peer-checked:bg-[var(--foreground)] peer-checked:text-[var(--background)] peer-focus-visible:shadow-[var(--focus-glow)] motion-reduce:transition-none">
                          {mealChoiceLabel(choice)}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}
            </div>
          ) : null}
        </div>

        {signedIn ? (
          view === "detail" ? (
            <Button asChild className="mt-5 h-14 w-full rounded-2xl text-base font-bold">
              <Link prefetch={false} href={registroRecipeHref({ recipeId: recipe.id, portions, meal })}>
                <Plus aria-hidden="true" className="size-5" />
                {registerRecipeLabel(portions, meal)}
              </Link>
            </Button>
          ) : null
        ) : (
          <Button asChild variant="secondary" className="mt-5 h-14 w-full rounded-2xl text-base">
            <Link href="/auth/login">Ingresá para registrar</Link>
          </Button>
        )}

        {rows.length > 0 ? (
          <section aria-labelledby="recipe-ingredients" className="mt-8">
            <h3 id="recipe-ingredients" className="font-display text-[1.375rem] font-bold tracking-[-0.02em] text-[var(--foreground)]">
              Ingredientes
            </h3>
            <ul className="mt-2">
              {rows.map((row) => (
                <li key={row.foodId} className="grid gap-2 border-b border-[var(--border)] py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 text-[0.9375rem] text-[var(--foreground)]">{row.name}</span>
                    <span className="shrink-0 font-mono text-[0.8125rem] tabular-nums">
                      <span className="text-[var(--foreground-muted)]">{row.grams} g</span>
                      <span className="ml-3 inline-block min-w-[4.5rem] text-right text-[var(--foreground)]">{row.kcal} kcal</span>
                    </span>
                  </div>
                  <span aria-hidden="true" className="block h-1 overflow-hidden rounded-full bg-[var(--card-alt)]">
                    <span
                      className="block h-full rounded-full bg-[var(--foreground-muted)]"
                      style={{ width: `${Math.round(row.share * 100)}%` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.8125rem] leading-5 text-[var(--foreground-muted)]">
              Para {formatPortions(portions)}. La barra es la parte de las kcal que aporta cada ingrediente.
            </p>
          </section>
        ) : null}

        {recipe.description ? (
          <p className="mt-6 text-[0.9375rem] leading-6 text-[var(--foreground-muted)]">{recipe.description}</p>
        ) : null}

        {canManage && view === "detail" ? (
          <div className="mt-6 grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-3">
            <Button type="button" variant="secondary" className="h-12 rounded-2xl" onClick={() => setView("edit")}>
              <Pencil aria-hidden="true" className="size-4" />
              Editar
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-12 rounded-2xl hover:text-[var(--danger)]"
              onClick={() => setView("confirm-delete")}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Eliminar
            </Button>
          </div>
        ) : null}

        {canManage && view === "confirm-delete" ? (
          <div className="mt-6 grid gap-3 border-t border-[var(--border)] pt-4">
            <p className="text-[0.9375rem] font-medium text-[var(--foreground)] [overflow-wrap:anywhere]">
              ¿Eliminar «{recipe.name}» del catálogo?
            </p>
            <p className="text-[0.8125rem] text-[var(--foreground-muted)]">Las comidas que ya la usaron no cambian.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-12 rounded-2xl"
                autoFocus
                disabled={isDeleting}
                onClick={() => setView("detail")}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="h-12 rounded-2xl bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? <LoadingDots /> : <Trash2 aria-hidden="true" className="size-4" />}
                Eliminar
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
