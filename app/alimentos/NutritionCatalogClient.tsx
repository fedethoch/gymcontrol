"use client";

import Image from "next/image";

import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { deleteOwnFoodAction } from "@/app/alimentos/actions";
import { FoodForm } from "@/app/components/shared/FoodForm";
import { MacroBar } from "@/app/components/shared/MacroBar";
import { FilterPanel } from "@/app/components/shared/FilterPanel";
import { Button } from "@/app/components/ui/Button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/app/components/ui/Drawer";
import { Input } from "@/app/components/ui/Input";
import { LoadingDots } from "@/app/components/ui/LoadingDots";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/app/components/ui/Sheet";
import { searchByName } from "@/app/lib/food-search";
import {
  CATEGORY_ACCENT,
  CATEGORY_GRADIENTS,
  CATEGORY_ICONS,
} from "@/app/lib/nutrition-style";
import { FOOD_CATEGORIES, FOOD_CATEGORY_LABELS, getAmountUnitLabel, type Food } from "@/app/lib/nutrition-types";
import {
  fadeUp,
  listItemHover,
  motion,
  staggerContainer,
  tapFeedback,
} from "@/app/components/ui/motion";

type NutritionCatalogClientProps = {
  foods: Food[];
  /** Usuario logueado: puede crear y editar sus propios alimentos. */
  canCreate: boolean;
};

const PAGE_SIZE = 60;
const ANIMATED_ROWS = 12;

type FormState = { mode: "create" } | { mode: "edit"; food: Food } | null;

export function NutritionCatalogClient({ foods, canCreate }: NutritionCatalogClientProps) {
  const [foodList, setFoodList] = useState(foods);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [origin, setOrigin] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [formState, setFormState] = useState<FormState>(null);

  const filteredByGroups = foodList.filter((food) => {
    if (category !== "all" && food.category !== category) {
      return false;
    }
    if (origin === "own" && !food.ownerUserId) {
      return false;
    }
    return true;
  });

  const filtered = query.trim()
    ? searchByName(filteredByGroups, query, { boost: (food) => (food.ownerUserId ? 10 : 0) })
    : filteredByGroups;
  const visibleFoods = filtered.slice(0, visibleCount);

  function handleSaved(food: Food) {
    setFoodList((current) =>
      current.some((candidate) => candidate.id === food.id)
        ? current.map((candidate) => (candidate.id === food.id ? food : candidate))
        : [food, ...current],
    );
    setSelectedFood((current) => (current?.id === food.id ? food : current));
    setFormState(null);
  }

  function handleDeleted(foodId: string) {
    setFoodList((current) => current.filter((candidate) => candidate.id !== foodId));
    setSelectedFood(null);
  }

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
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
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
              onChange: (value) => {
                setCategory(value);
                setVisibleCount(PAGE_SIZE);
              },
            },
            ...(canCreate
              ? [
                  {
                    label: "Origen",
                    options: [{ value: "own", label: "Mis alimentos" }],
                    value: origin,
                    onChange: (value: string) => {
                      setOrigin(value);
                      setVisibleCount(PAGE_SIZE);
                    },
                  },
                ]
              : []),
          ]}
          onClear={() => {
            setCategory("all");
            setOrigin("all");
            setVisibleCount(PAGE_SIZE);
          }}
        />

        {canCreate ? (
          <Button type="button" className="h-12 shrink-0 rounded-xl px-4" onClick={() => setFormState({ mode: "create" })}>
            <Plus aria-hidden="true" className="size-4" />
            Crear
          </Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="motion-empty-state grid min-h-[20rem] place-items-center rounded-2xl border border-dashed border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-6 py-10 text-center">
          <div className="max-w-md">
            <p className="font-display text-lg font-semibold text-white">
              {origin === "own" && !query.trim() ? "Todavía no creaste alimentos" : "No hay alimentos para mostrar"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              {canCreate
                ? "Probá con otra búsqueda o creá el alimento con sus valores nutricionales."
                : "Ajusta la búsqueda o la categoría seleccionada."}
            </p>
            {canCreate ? (
              <Button type="button" variant="secondary" className="mt-4 h-11" onClick={() => setFormState({ mode: "create" })}>
                <Plus aria-hidden="true" className="size-4" />
                Crear alimento
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="text-sm text-[var(--foreground-muted)]">
            {filtered.length} {filtered.length === 1 ? "alimento" : "alimentos"}
          </p>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-alt)]"
          >
            {visibleFoods.map((food, index) => (
              <motion.div key={food.id} variants={index < ANIMATED_ROWS ? fadeUp : undefined}>
                <FoodRow food={food} onSelect={() => setSelectedFood(food)} />
              </motion.div>
            ))}
          </motion.div>
          {filtered.length > visibleCount ? (
            <Button
              type="button"
              variant="secondary"
              className="h-11 justify-self-center"
              onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
            >
              Mostrar más ({filtered.length - visibleCount} restantes)
            </Button>
          ) : null}
        </div>
      )}

      <FoodDetailSheet
        food={selectedFood}
        open={selectedFood !== null}
        onOpenChange={(open) => !open && setSelectedFood(null)}
        onEdit={(food) => setFormState({ mode: "edit", food })}
        onDeleted={handleDeleted}
      />

      <Drawer open={formState !== null} onOpenChange={(open) => !open && setFormState(null)}>
        <DrawerContent className="max-h-[90dvh]">
          <div className="mx-auto flex min-h-0 w-full max-w-xl flex-col">
            <DrawerHeader className="px-4 pb-2 pt-3 text-left">
              <DrawerTitle>{formState?.mode === "edit" ? "Editar alimento" : "Nuevo alimento"}</DrawerTitle>
              <DrawerDescription>Solo lo ves vos. Aparece en el catálogo y al registrar comidas.</DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 overflow-y-auto px-4 pb-4">
              {formState ? (
                <FoodForm
                  key={formState.mode === "edit" ? formState.food.id : "create"}
                  food={formState.mode === "edit" ? formState.food : null}
                  onSaved={handleSaved}
                  onCancel={() => setFormState(null)}
                />
              ) : null}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
}

function FoodRow({ food, onSelect }: { food: Food; onSelect: () => void }) {
  const Icon = CATEGORY_ICONS[food.category];
  const unit = getAmountUnitLabel(food.category);

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
        <h3 className="font-display flex min-w-0 items-center gap-2 text-sm font-semibold tracking-[-0.02em] text-white">
          <span className="truncate">{food.name}</span>
          {food.ownerUserId ? (
            <span className="shrink-0 rounded-full border border-[var(--border-strong)] px-2 py-0.5 font-sans text-[11px] font-semibold tracking-normal text-[var(--foreground-muted)]">
              Tuyo
            </span>
          ) : null}
        </h3>
        <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-[#7d8697]">
          {food.servingG} {unit} · {food.calories} kcal
          {food.gramsPerUnit != null ? ` · 1u (≈${food.gramsPerUnit} ${unit})` : ""}
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
  onEdit,
  onDeleted,
}: {
  food: Food | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (food: Food) => void;
  onDeleted: (foodId: string) => void;
}) {
  const [displayFood, setDisplayFood] = useState<Food | null>(food);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (food && food !== displayFood) {
    setDisplayFood(food);
    setIsConfirmingDelete(false);
  }

  if (!displayFood) return null;

  const Icon = CATEGORY_ICONS[displayFood.category];
  const unit = getAmountUnitLabel(displayFood.category);
  const isOwn = displayFood.ownerUserId !== null;

  async function handleDelete(foodId: string) {
    setIsDeleting(true);
    const result = await deleteOwnFoodAction(foodId);
    setIsDeleting(false);

    if (!result.ok) {
      toast.error(result.message);
      setIsConfirmingDelete(false);
      return;
    }

    toast.success("Alimento eliminado.");
    onDeleted(foodId);
  }

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
                {isOwn ? " · Tuyo" : ""}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <SheetDescription id="food-detail-description" className="sr-only">
              Detalle nutricional de {displayFood.name}
            </SheetDescription>

            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-2.5">
                <SpecChip label="Porción" value={`${displayFood.servingG} ${unit}`} />
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

              {isOwn ? (
                <div className="grid gap-2 border-t border-[var(--border)] pt-5">
                  {isConfirmingDelete ? (
                    <div className="grid gap-2 rounded-xl border border-[rgba(244,63,94,0.35)] bg-[rgba(244,63,94,0.08)] p-3">
                      <p className="text-sm text-[var(--foreground)]">
                        ¿Eliminar “{displayFood.name}”? Si ya lo usaste en comidas no se puede borrar.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-11"
                          onClick={() => setIsConfirmingDelete(false)}
                          disabled={isDeleting}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          className="h-11 bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
                          onClick={() => handleDelete(displayFood.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? <LoadingDots /> : <Trash2 aria-hidden="true" className="size-4" />}
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button type="button" variant="secondary" className="h-11" onClick={() => onEdit(displayFood)}>
                        <Pencil aria-hidden="true" className="size-4" />
                        Editar
                      </Button>
                      <Button type="button" variant="ghost" className="h-11 hover:text-[var(--danger)]" onClick={() => setIsConfirmingDelete(true)}>
                        <Trash2 aria-hidden="true" className="size-4" />
                        Eliminar
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
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
