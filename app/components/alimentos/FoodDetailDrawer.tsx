"use client";

import Link from "next/link";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { deleteOwnFoodAction } from "@/app/alimentos/actions";
import { FoodForm } from "@/app/components/shared/FoodForm";
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
import {
  defaultFoodPortion,
  foodPortions,
  formatDecimal,
  nutritionForGrams,
  registroFoodHref,
  splitMacroKcal,
  type FoodPortion,
} from "@/app/lib/food-catalog";
import { CATEGORY_ICONS, MACRO_COLORS } from "@/app/lib/nutrition-style";
import { FOOD_CATEGORY_LABELS, getAmountUnitLabel, type Food, type FoodMeasure } from "@/app/lib/nutrition-types";
import { cn } from "@/app/lib/utils";

const MACROS = [
  { key: "protein", grams: "proteinG", label: "Proteína" },
  { key: "carbs", grams: "carbsG", label: "Carbos" },
  { key: "fat", grams: "fatG", label: "Grasas" },
] as const;

type View = "detail" | "edit" | "confirm-delete";

/** Detalle del alimento en bottom sheet (DESIGN.md §13.3). `food = null` = cerrado. */
export function FoodDetailDrawer({
  food,
  initialMeasure,
  canRegister,
  onClose,
  onSaved,
  onDeleted,
  onReturnFocus,
}: {
  food: Food | null;
  initialMeasure?: FoodMeasure;
  /** Con sesión: muestra "Registrar". */
  canRegister: boolean;
  onClose: () => void;
  onSaved: (food: Food) => void;
  onDeleted: (foodId: string) => void;
  onReturnFocus: () => void;
}) {
  // Conserva el último alimento mientras el sheet se cierra.
  const [displayFood, setDisplayFood] = useState(food);

  if (food && food !== displayFood) {
    setDisplayFood(food);
  }

  return (
    <Drawer open={food !== null} onOpenChange={(open) => !open && onClose()} autoFocus>
      <DrawerContent
        className="max-h-[88dvh]"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onReturnFocus();
        }}
      >
        {displayFood ? (
          <FoodDetailBody
            key={displayFood.id}
            food={displayFood}
            initialMeasure={initialMeasure}
            canRegister={canRegister}
            onSaved={onSaved}
            onDeleted={onDeleted}
          />
        ) : (
          <DrawerTitle className="sr-only">Alimento</DrawerTitle>
        )}
      </DrawerContent>
    </Drawer>
  );
}

function FoodDetailBody({
  food,
  initialMeasure,
  canRegister,
  onSaved,
  onDeleted,
}: {
  food: Food;
  initialMeasure?: FoodMeasure;
  canRegister: boolean;
  onSaved: (food: Food) => void;
  onDeleted: (foodId: string) => void;
}) {
  const [measure, setMeasure] = useState<FoodMeasure>(() => defaultFoodPortion(food, initialMeasure).measure);
  const [view, setView] = useState<View>("detail");
  const [isDeleting, setIsDeleting] = useState(false);
  const portions = foodPortions(food);
  const portion = portions.find((candidate) => candidate.measure === measure) ?? portions[0];
  const nutrition = nutritionForGrams(food, portion.grams);
  const split = splitMacroKcal(food);
  const isOwn = food.ownerUserId !== null;
  const unit = getAmountUnitLabel(food.category);
  const Icon = CATEGORY_ICONS[food.category];

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteOwnFoodAction(food.id);
    setIsDeleting(false);

    if (!result.ok) {
      toast.error(result.message);
      setView("detail");
      return;
    }

    toast.success("Alimento eliminado.");
    onDeleted(food.id);
  }

  if (view === "edit") {
    return (
      <>
        <DrawerHeader className="px-5 pb-2 pt-3 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
          <DrawerTitle className="text-xl font-bold tracking-[-0.02em]">Editar alimento</DrawerTitle>
          <DrawerDescription>Solo lo ves vos. Aparece en el catálogo y al registrar comidas.</DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <FoodForm
            food={food}
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
          {FOOD_CATEGORY_LABELS[food.category]}
          {isOwn ? (
            <span className="rounded-full border border-[var(--border-strong)] px-1.5 text-[0.6875rem] leading-4">Tuyo</span>
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
          {food.name}
        </DrawerTitle>
        <DrawerDescription className="sr-only">Calorías y macronutrientes de {food.name} por porción.</DrawerDescription>

        {portions.length > 1 ? (
          <PortionPicker portions={portions} value={portion.measure} onChange={setMeasure} />
        ) : (
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">Valores cada {portion.label}</p>
        )}

        <p className="mt-5 flex items-baseline gap-2">
          <span aria-hidden="true" className="font-display text-5xl font-bold leading-none tracking-[-0.03em] tabular-nums text-[var(--foreground)]">
            <AnimatedNumber value={nutrition.kcal} />
          </span>
          <span aria-hidden="true" className="text-[0.9375rem] font-medium text-[var(--foreground-muted)]">
            kcal
          </span>
          <span className="sr-only">{`${nutrition.kcal} kcal`}</span>
        </p>

        <div className="mt-5 grid gap-4">
          <div aria-hidden="true" className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-[var(--card-alt)]">
            {MACROS.map((macro) =>
              split.kcal[macro.key] > 0 ? (
                <span
                  key={macro.key}
                  className="h-full basis-0"
                  style={{ flexGrow: split.kcal[macro.key], backgroundColor: MACRO_COLORS[macro.key] }}
                />
              ) : null,
            )}
          </div>
          <dl className="grid grid-cols-3">
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
                  {formatDecimal(nutrition[macro.grams])}
                  <span className="ml-0.5 font-sans text-xs font-medium text-[var(--foreground-muted)]">g</span>
                </dd>
                <dd className="font-mono text-xs tabular-nums text-[var(--foreground-muted)]">{split.pct[macro.key]} % kcal</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="mt-4 text-[0.8125rem] leading-5 text-[var(--foreground-muted)]">
          {isOwn ? "Valores que cargaste" : "Valores del catálogo"} cada {formatDecimal(food.servingG)} {unit}. El % indica cuántas
          calorías aporta cada macro.
        </p>

        {canRegister && view === "detail" ? (
          <Button asChild className="mt-6 h-14 w-full rounded-2xl text-base font-bold">
            <Link
              prefetch={false}
              href={registroFoodHref({ foodId: food.id, measure: portion.measure, quantity: portion.quantity })}
            >
              <Plus aria-hidden="true" className="size-5" />
              {portion.action}
            </Link>
          </Button>
        ) : null}

        {isOwn && view === "detail" ? (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-3">
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

        {isOwn && view === "confirm-delete" ? (
          <div className="mt-6 grid gap-3 border-t border-[var(--border)] pt-4">
            <p className="text-[0.9375rem] font-medium text-[var(--foreground)] [overflow-wrap:anywhere]">¿Eliminar «{food.name}»?</p>
            <p className="text-[0.8125rem] text-[var(--foreground-muted)]">Si ya lo usaste en alguna comida no se puede borrar.</p>
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

function PortionPicker({
  portions,
  value,
  onChange,
}: {
  portions: FoodPortion[];
  value: FoodMeasure;
  onChange: (value: FoodMeasure) => void;
}) {
  const name = useId();

  return (
    <fieldset className="mt-4">
      <legend className="sr-only">Porción</legend>
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-[var(--border)] bg-[var(--background)] p-1">
        {portions.map((portion) => (
          <label key={portion.measure} className="relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={portion.measure}
              checked={portion.measure === value}
              onChange={() => onChange(portion.measure)}
              className="peer sr-only"
            />
            <span className="flex min-h-11 items-center justify-center rounded-lg px-2 text-center text-[0.8125rem] font-semibold text-[var(--foreground-muted)] transition-colors duration-150 peer-checked:bg-[var(--card-alt)] peer-checked:text-[var(--foreground)] peer-checked:shadow-[0_1px_2px_rgba(0,0,0,0.4)] peer-focus-visible:shadow-[var(--focus-glow)] motion-reduce:transition-none">
              {portion.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
