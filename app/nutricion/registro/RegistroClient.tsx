"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Beef,
  Check,
  Droplet,
  Flame,
  LoaderCircle,
  type LucideIcon,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";
import { toast } from "sonner";

import { TrainingCalendarCard } from "@/app/components/shared/TrainingCalendarCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/Accordion";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/app/components/ui/Drawer";
import { Input } from "@/app/components/ui/Input";
import { AnimatedProgressRing } from "@/app/components/ui/ProgressRing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/Select";
import {
  addMealLogItemAction,
  createMealAction,
  deleteMealAction,
  deleteMealLogItemAction,
  updateMealAction,
  updateMealLogItemAction,
} from "@/app/nutricion/registro/actions";
import { MACRO_COLORS, MACRO_LABELS } from "@/app/lib/nutrition-style";
import type { MealGroup } from "@/app/lib/meal-logs";
import type { Food, FoodMeasure, Macros } from "@/app/lib/nutrition-types";
import { cn } from "@/app/lib/utils";

type DraftItem = {
  localId: string;
  foodId: string;
  measure: FoodMeasure;
  quantity: number;
};

export function RegistroClient({
  foods,
  logDate,
  initialMeals,
  targetKcal,
  targetMacros,
  loggedDates,
  avgDailyKcal,
}: {
  foods: Food[];
  logDate: string;
  initialMeals: MealGroup[];
  targetKcal: number;
  targetMacros: Macros;
  loggedDates: string[];
  avgDailyKcal: number;
}) {
  const [meals, setMeals] = useState(initialMeals);
  const [mealName, setMealName] = useState("");
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [isSavingMeal, setIsSavingMeal] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [newMealOpen, setNewMealOpen] = useState(false);

  const totalKcal = meals.reduce((total, meal) => total + meal.kcal, 0);
  const totalMacros: Macros = meals.reduce<Macros>(
    (totals, meal) => ({
      proteinG: totals.proteinG + meal.macros.proteinG,
      carbsG: totals.carbsG + meal.macros.carbsG,
      fatG: totals.fatG + meal.macros.fatG,
    }),
    { proteinG: 0, carbsG: 0, fatG: 0 },
  );

  const streak = calculateStreak(loggedDates, logDate);
  const daysThisMonth = loggedDates.filter((date) => date.startsWith(logDate.slice(0, 7))).length;

  function handleAddDraftItem(foodId: string, measure: FoodMeasure, quantity: number) {
    setDraftItems((current) => [...current, { localId: crypto.randomUUID(), foodId, measure, quantity }]);
  }

  function handleRemoveDraftItem(localId: string) {
    setDraftItems((current) => current.filter((item) => item.localId !== localId));
  }

  async function handleSaveMeal() {
    const trimmed = mealName.trim();

    if (!trimmed) {
      toast.error("Ponele un nombre a la comida.");
      return;
    }

    if (draftItems.length === 0) {
      toast.error("Agregá al menos un alimento.");
      return;
    }

    setIsSavingMeal(true);

    try {
      let log = await createMealAction({ logDate, name: trimmed });
      const newMeal = log.meals.find((meal) => !meals.some((existing) => existing.id === meal.id));

      if (!newMeal) {
        throw new Error("No se pudo identificar la comida creada.");
      }

      for (const item of draftItems) {
        log = await addMealLogItemAction({
          logDate,
          mealId: newMeal.id,
          foodId: item.foodId,
          measure: item.measure,
          quantity: item.quantity,
        });
      }

      setMeals(log.meals);
      setMealName("");
      setDraftItems([]);
      setNewMealOpen(false);
      toast.success("Comida creada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la comida.");
    } finally {
      setIsSavingMeal(false);
    }
  }

  async function handleDeleteMeal(mealId: string) {
    try {
      await deleteMealAction(mealId);
      setMeals((current) => current.filter((meal) => meal.id !== mealId));
      if (editingMealId === mealId) {
        setEditingMealId(null);
      }
      toast.success("Comida eliminada.");
    } catch {
      toast.error("No se pudo eliminar la comida.");
    }
  }

  async function handleRenameMeal(mealId: string, name: string) {
    const log = await updateMealAction({ logDate, mealId, name });
    setMeals(log.meals);
  }

  async function handleAddItem(mealId: string, foodId: string, measure: FoodMeasure, quantity: number) {
    const log = await addMealLogItemAction({ logDate, mealId, foodId, measure, quantity });
    setMeals(log.meals);
  }

  async function handleUpdateItem(itemId: string, measure: FoodMeasure, quantity: number) {
    const log = await updateMealLogItemAction({ logDate, itemId, measure, quantity });
    setMeals(log.meals);
  }

  async function handleDeleteItem(itemId: string) {
    await deleteMealLogItemAction(itemId);
    setMeals((current) =>
      current.map((meal) => ({
        ...meal,
        items: meal.items.filter((item) => item.id !== itemId),
      })),
    );
  }

  const newMealBody = (
    <div className="flex flex-1 flex-col gap-4">
      <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
        Nombre de la comida
        <Input
          placeholder="Ej. Desayuno"
          value={mealName}
          onChange={(event) => setMealName(event.target.value)}
        />
      </label>

      <FoodPickerRow foods={foods} onAdd={handleAddDraftItem} actionLabel="Agregar" />

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border)]">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 bg-[var(--card-alt)] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7887a6]">
          <span>Alimento</span>
          <span className="text-right">Cantidad</span>
          <span className="text-right">Calorías</span>
          <span />
        </div>
        {draftItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
            <UtensilsCrossed className="size-6 text-[#3c4456]" />
            <p className="text-sm text-[#7887a6]">Agregá alimentos a esta comida.</p>
          </div>
        ) : (
          draftItems.map((item) => {
            const food = foods.find((candidate) => candidate.id === item.foodId);

            if (!food) {
              return null;
            }

            const preview = previewItem(food, item.measure, item.quantity);

            return (
              <div
                key={item.localId}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-t border-[var(--border)] px-3.5 py-2.5 text-sm"
              >
                <span className="truncate font-semibold text-white">{food.name}</span>
                <span className="text-right text-[var(--foreground-muted)]">
                  {item.measure === "unit" ? `${roundQuantity(item.quantity)} u` : `${item.quantity} g`}
                </span>
                <span className="text-right text-[var(--foreground-muted)]">{preview.kcal} kcal</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="justify-self-end"
                  onClick={() => handleRemoveDraftItem(item.localId)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })
        )}
      </div>

      <Button type="button" onClick={handleSaveMeal} disabled={isSavingMeal}>
        {isSavingMeal ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Guardar comida
      </Button>
    </div>
  );

  const newMealIntro = (
    <div className="flex items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--accent-soft-border)] bg-[var(--accent-soft-surface)] text-[var(--accent-bright)]">
        <UtensilsCrossed className="size-5" />
      </span>
      <div>
        <CardTitle>Nueva comida</CardTitle>
        <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
          Agregá los alimentos que consumiste y guardá tu comida.
        </p>
      </div>
    </div>
  );

  return (
    <div className="grid gap-6">
      {/* Mobile: botón que abre el drawer "Nueva comida" */}
      <Button type="button" className="lg:hidden" onClick={() => setNewMealOpen(true)}>
        <Plus className="size-4" />
        Nueva comida
      </Button>

      <Drawer open={newMealOpen} onOpenChange={setNewMealOpen}>
        <DrawerContent className="lg:hidden">
          <DrawerHeader>
            <DrawerTitle className="sr-only">Nueva comida</DrawerTitle>
            <DrawerDescription className="sr-only">
              Agregá los alimentos que consumiste y guardá tu comida.
            </DrawerDescription>
            {newMealIntro}
          </DrawerHeader>
          <div className="px-4 pb-4">{newMealBody}</div>
        </DrawerContent>
      </Drawer>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,1fr)] lg:items-stretch">
        {/* Nueva comida (desktop) */}
        <Card className="hidden h-full flex-col lg:flex">
          <CardHeader>{newMealIntro}</CardHeader>
          <CardContent className="flex flex-1 flex-col">{newMealBody}</CardContent>
        </Card>

        {/* Resumen */}
        <Card className="flex h-full flex-col">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Resumen nutricional del día</CardTitle>
              <p className="text-sm text-[var(--foreground-muted)]">Así vas hoy frente a tu objetivo diario.</p>
            </div>
            <Button asChild type="button" variant="outline" size="sm" className="shrink-0">
              <Link href="/configuracion">
                <Settings2 className="size-4" />
                Editar objetivos
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-5">
            <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              <AnimatedProgressRing
                value={targetKcal > 0 ? Math.min(100, Math.round((totalKcal / targetKcal) * 100)) : 0}
                size={200}
                strokeWidth={16}
                progressColor="var(--accent-bright)"
              >
                <div className="flex flex-col items-center">
                  <Flame className="mb-1 size-6 text-[var(--accent-bright)]" />
                  <span className="font-display text-3xl font-bold tracking-[-0.04em] text-white">{totalKcal}</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7887a6]">
                    de {targetKcal} kcal
                  </span>
                </div>
              </AnimatedProgressRing>

              <div className="grid w-full flex-1 gap-3">
                <TargetBar
                  icon={Flame}
                  label="Calorías"
                  current={totalKcal}
                  target={targetKcal}
                  unit="kcal"
                  color="var(--accent-bright)"
                />
                <TargetBar
                  icon={Beef}
                  label={MACRO_LABELS.protein}
                  current={totalMacros.proteinG}
                  target={targetMacros.proteinG}
                  unit="g"
                  color={MACRO_COLORS.protein}
                />
                <TargetBar
                  icon={Wheat}
                  label={MACRO_LABELS.carbs}
                  current={totalMacros.carbsG}
                  target={targetMacros.carbsG}
                  unit="g"
                  color={MACRO_COLORS.carbs}
                />
                <TargetBar
                  icon={Droplet}
                  label={MACRO_LABELS.fat}
                  current={totalMacros.fatG}
                  target={targetMacros.fatG}
                  unit="g"
                  color={MACRO_COLORS.fat}
                />
              </div>
            </div>

            <div className="mt-auto grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-4">
              <SummaryStat label="Comidas hoy" value={String(meals.length)} />
              <SummaryStat label="Promedio diario" value={avgDailyKcal > 0 ? `${avgDailyKcal} kcal` : "—"} />
              <SummaryStat label="Racha actual" value={`${streak} días`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comidas de hoy */}
      <Card>
        <CardHeader>
          <CardTitle>Comidas de hoy</CardTitle>
          <p className="text-sm text-[var(--foreground-muted)]">Tus comidas registradas para hoy.</p>
        </CardHeader>
        <CardContent>
          {meals.length === 0 ? (
            <p className="text-sm text-[#7887a6]">
              Todavía no creaste comidas hoy. Usá &quot;Nueva comida&quot; para empezar.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {meals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  foods={foods}
                  isEditing={editingMealId === meal.id}
                  onToggleEdit={() => setEditingMealId((current) => (current === meal.id ? null : meal.id))}
                  onDeleteMeal={() => handleDeleteMeal(meal.id)}
                  onRenameMeal={(name) => handleRenameMeal(meal.id, name)}
                  onAddItem={(foodId, measure, quantity) => handleAddItem(meal.id, foodId, measure, quantity)}
                  onDeleteItem={handleDeleteItem}
                  onUpdateItem={handleUpdateItem}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Constancia + tip */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <Card className="flex h-full flex-col">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--accent-soft-border)] bg-[var(--accent-soft-surface)] text-[var(--accent-bright)]">
                <UtensilsCrossed className="size-5" />
              </span>
              <div>
                <CardTitle>Constancia nutricional</CardTitle>
                <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
                  Tus últimas 10 semanas registrando comidas.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex shrink-0 gap-4 sm:flex-col sm:gap-4">
              <SummaryStat label="Racha actual" value={`${streak} días`} />
              <SummaryStat label="Días este mes" value={String(daysThisMonth)} />
            </div>
            <div className="h-px w-full bg-[var(--border)] sm:h-auto sm:w-px" />
            <div className="min-w-0 flex-1">
              <TrainingCalendarCard completedDates={new Set(loggedDates)} bare />
            </div>
          </CardContent>
        </Card>

        <NutritionTipCard totalKcal={totalKcal} targetKcal={targetKcal} mealsCount={meals.length} />
      </div>
    </div>
  );
}

function MealCard({
  meal,
  foods,
  isEditing,
  onToggleEdit,
  onDeleteMeal,
  onRenameMeal,
  onAddItem,
  onDeleteItem,
  onUpdateItem,
}: {
  meal: MealGroup;
  foods: Food[];
  isEditing: boolean;
  onToggleEdit: () => void;
  onDeleteMeal: () => void;
  onRenameMeal: (name: string) => Promise<void>;
  onAddItem: (foodId: string, measure: FoodMeasure, quantity: number) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onUpdateItem: (itemId: string, measure: FoodMeasure, quantity: number) => Promise<void>;
}) {
  const [name, setName] = useState(meal.name);
  const [isSavingName, setIsSavingName] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editMeasure, setEditMeasure] = useState<FoodMeasure>("g");
  const [isSavingItem, setIsSavingItem] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setEditingItemId(null);
    }
  }, [isEditing]);

  async function handleSaveName() {
    const trimmed = name.trim();

    if (!trimmed) {
      toast.error("Ponele un nombre a la comida.");
      return;
    }

    setIsSavingName(true);

    try {
      await onRenameMeal(trimmed);
      toast.success("Comida actualizada.");
    } catch {
      toast.error("No se pudo actualizar la comida.");
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleDelete(itemId: string) {
    setDeletingId(itemId);

    try {
      await onDeleteItem(itemId);
      toast.success("Alimento eliminado.");
    } catch {
      toast.error("No se pudo eliminar el alimento.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleStartEditItem(itemId: string, measure: FoodMeasure, quantity: number) {
    setEditingItemId(itemId);
    setEditMeasure(measure);
    setEditQuantity(String(roundQuantity(quantity)));
  }

  async function handleSaveItem(itemId: string) {
    const parsedQuantity = Number(editQuantity);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      toast.error("Ingresá una cantidad válida.");
      return;
    }

    setIsSavingItem(true);

    try {
      await onUpdateItem(itemId, editMeasure, parsedQuantity);
      setEditingItemId(null);
      toast.success("Alimento actualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el alimento.");
    } finally {
      setIsSavingItem(false);
    }
  }

  async function handleAddItem(foodId: string, measure: FoodMeasure, quantity: number) {
    try {
      await onAddItem(foodId, measure, quantity);
      toast.success("Alimento agregado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo agregar el alimento.");
    }
  }

  const itemsList = (
    <div className="grid gap-2">
      {meal.items.map((item) => {
        const itemFood = foods.find((food) => food.id === item.foodId);
        const itemGramsPerUnit =
          itemFood?.gramsPerUnit ?? (itemFood?.measure === "unit" ? itemFood.servingG : null);
        const canChooseUnit = itemGramsPerUnit != null;
        const isEditingItem = editingItemId === item.id;

        return (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{item.foodName}</p>
              {!isEditingItem && (
                <p className="text-xs text-[var(--foreground-muted)]">
                  {item.measure === "unit" ? `${roundQuantity(item.quantity)} u` : `${item.grams} g`} · {item.kcal} kcal
                </p>
              )}
            </div>
            {isEditing && isEditingItem && (
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                {canChooseUnit && (
                  <Select value={editMeasure} onValueChange={(value) => setEditMeasure(value as FoodMeasure)}>
                    <SelectTrigger className="w-24 sm:w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">Gramos</SelectItem>
                      <SelectItem value="unit">Unidades</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Input
                  type="number"
                  min={editMeasure === "unit" ? 0.5 : 1}
                  step={editMeasure === "unit" ? 0.5 : 1}
                  value={editQuantity}
                  onChange={(event) => setEditQuantity(event.target.value)}
                  className="w-16 sm:w-20"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => handleSaveItem(item.id)} disabled={isSavingItem}>
                  {isSavingItem ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
                </Button>
              </div>
            )}
            {isEditing && !isEditingItem && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleStartEditItem(item.id, item.measure, item.quantity)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                >
                  {deletingId === item.id ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card-alt)] p-4">
      {/* Top: nombre + kcal */}
      <div className="flex items-center justify-between gap-2">
        {isEditing ? (
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-w-0 flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleSaveName}
              disabled={isSavingName}
              title="Guardar nombre"
            >
              {isSavingName ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
            </Button>
          </div>
        ) : (
          <p className="truncate text-xs font-bold uppercase tracking-[0.18em] text-[#b985ff]">{meal.name}</p>
        )}
        <p className="whitespace-nowrap text-sm font-semibold text-white">{meal.kcal} kcal</p>
      </div>

      {/* Medio: alimentos con gramos */}
      {meal.items.length === 0 ? (
        <p className="text-sm text-[#7887a6]">Sin alimentos todavía.</p>
      ) : isEditing ? (
        itemsList
      ) : (
        <Accordion type="single" collapsible className="-my-1">
          <AccordionItem value="items" className="border-none">
            <AccordionTrigger className="py-1.5 text-xs font-semibold text-[#9aa3b8] hover:text-white">
              {meal.items.length} alimento{meal.items.length === 1 ? "" : "s"}
            </AccordionTrigger>
            <AccordionContent>{itemsList}</AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {isEditing && <FoodPickerRow foods={foods} onAdd={handleAddItem} actionLabel="Agregar" />}

      {/* Bottom: macros (izq) + acciones (der) */}
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
        <div className="flex flex-1 flex-wrap gap-1.5">
          <MacroChip label="P" value={meal.macros.proteinG} color={MACRO_COLORS.protein} />
          <MacroChip label="C" value={meal.macros.carbsG} color={MACRO_COLORS.carbs} />
          <MacroChip label="G" value={meal.macros.fatG} color={MACRO_COLORS.fat} />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleEdit}
            title={isEditing ? "Terminar edición" : "Editar comida"}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hover:text-red-400"
            onClick={onDeleteMeal}
            title="Eliminar comida"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MacroChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-bold"
      style={{ backgroundColor: `${color}26`, color }}
    >
      <span className="text-xs opacity-80">{label}</span> {value}g
    </span>
  );
}

function FoodPickerRow({
  foods,
  onAdd,
  actionLabel,
}: {
  foods: Food[];
  onAdd: (foodId: string, measure: FoodMeasure, quantity: number) => void | Promise<void>;
  actionLabel: string;
}) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [foodId, setFoodId] = useState<string | null>(null);
  const [measure, setMeasure] = useState<FoodMeasure>("g");
  const [quantity, setQuantity] = useState("100");
  const [isAdding, setIsAdding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedFood = foods.find((food) => food.id === foodId);
  const gramsPerUnit = selectedFood?.gramsPerUnit ?? (selectedFood?.measure === "unit" ? selectedFood.servingG : null);
  const canChooseUnit = gramsPerUnit != null;
  const isUnit = canChooseUnit && measure === "unit";

  const normalizedQuery = query.trim().toLowerCase();
  const results = normalizedQuery
    ? foods.filter((food) => food.name.toLowerCase().includes(normalizedQuery)).slice(0, 6)
    : [];

  function handleSelectFood(food: Food) {
    setFoodId(food.id);
    setMeasure(food.measure);
    setQuery(food.name);
    setShowResults(false);
  }

  async function handleAdd() {
    const parsedQuantity = Number(quantity);

    if (!foodId || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      toast.error("Elegí un alimento y una cantidad válida.");
      return;
    }

    setIsAdding(true);

    try {
      await onAdd(foodId, isUnit ? "unit" : "g", parsedQuantity);
      setQuery("");
      setFoodId(null);
      setQuantity("100");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
      <div ref={containerRef} className="relative sm:col-span-2 lg:col-span-1">
        <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
          Buscar alimento
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7d8697]" />
            <Input
              className="pl-9"
              placeholder="Buscar alimento..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setFoodId(null);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
            />
          </div>
        </label>

        {showResults && results.length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
            {results.map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => handleSelectFood(food)}
                className="flex w-full items-center justify-between gap-3 border-b border-[var(--border)] px-3.5 py-2.5 text-left text-sm text-[var(--foreground)] last:border-b-0 hover:bg-[rgba(124,58,237,0.1)]"
              >
                <span className="truncate">{food.name}</span>
                <span className="whitespace-nowrap text-xs text-[#7887a6]">{food.calories} kcal/{food.servingG}g</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
        Porción
        <Select
          value={canChooseUnit ? measure : "g"}
          disabled={!canChooseUnit}
          onValueChange={(value) => {
            const nextMeasure = value as FoodMeasure;
            const parsedQuantity = Number(quantity);

            if (Number.isFinite(parsedQuantity) && parsedQuantity > 0 && gramsPerUnit) {
              const nextQuantity =
                nextMeasure === "unit" ? parsedQuantity / gramsPerUnit : parsedQuantity * gramsPerUnit;
              setQuantity(String(roundQuantity(nextQuantity)));
            }

            setMeasure(nextMeasure);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Medida" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="g">Gramos</SelectItem>
            <SelectItem value="unit">Unidades</SelectItem>
          </SelectContent>
        </Select>
      </label>

      <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
        {isUnit ? "Unidades" : "Gramos"}
        <Input type="number" min={isUnit ? 0.5 : 1} step={isUnit ? 0.5 : 1} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
      </label>

      <Button
        type="button"
        variant="outline"
        onClick={handleAdd}
        disabled={isAdding || !foodId}
        className="sm:col-span-2 lg:col-span-1"
      >
        {isAdding ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
        {actionLabel}
      </Button>
    </div>
  );
}

function previewItem(food: Food, measure: FoodMeasure, quantity: number) {
  const gramsPerUnit = food.gramsPerUnit ?? food.servingG;
  const grams = measure === "unit" ? quantity * gramsPerUnit : quantity;
  const ratio = grams / food.servingG;

  return {
    grams,
    kcal: Math.round(food.calories * ratio),
    proteinG: Math.round(food.proteinG * ratio),
    carbsG: Math.round(food.carbsG * ratio),
    fatG: Math.round(food.fatG * ratio),
  };
}

function roundQuantity(value: number) {
  return Math.round(value * 100) / 100;
}

function calculateStreak(loggedDates: string[], fromDate: string) {
  const dates = new Set(loggedDates);
  let streak = 0;
  let cursor = new Date(`${fromDate}T00:00:00`);

  while (dates.has(formatDateOnly(cursor))) {
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function formatDateOnly(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function NutritionTipCard({
  totalKcal,
  targetKcal,
  mealsCount,
}: {
  totalKcal: number;
  targetKcal: number;
  mealsCount: number;
}) {
  const pct = targetKcal > 0 ? Math.round((totalKcal / targetKcal) * 100) : 0;
  const remainingKcal = Math.max(0, targetKcal - totalKcal);
  const { title, message } = getNutritionTip(pct, mealsCount, remainingKcal);

  return (
    <Card className="flex h-full flex-col overflow-hidden border-[#27304a] bg-[linear-gradient(145deg,rgba(13,19,34,0.96)_0%,rgba(8,12,20,0.98)_100%)] shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
      <CardContent className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="grid size-12 shrink-0 place-items-center rounded-xl border border-[#34245b] bg-[#251640] text-[#b987ff]"
          >
            <Flame className="size-6" />
          </span>
          <h2 className="font-display text-xl font-semibold leading-tight text-white">{title}</h2>
        </div>
        <p className="text-sm leading-6 text-[#c6cede]">{message}</p>
      </CardContent>
    </Card>
  );
}

function getNutritionTip(pct: number, mealsCount: number, remainingKcal: number) {
  if (mealsCount === 0) {
    return {
      title: "Empezá tu día",
      message: "Todavía no registraste comidas hoy. Agregá la primera con \"Nueva comida\" para arrancar a sumar contra tu objetivo.",
    };
  }

  if (pct >= 100) {
    return {
      title: "Objetivo alcanzado",
      message: `Llegaste al ${pct}% de tu objetivo calórico con ${mealsCount} comida${mealsCount === 1 ? "" : "s"} registrada${mealsCount === 1 ? "" : "s"}. Buen trabajo hoy.`,
    };
  }

  if (pct >= 70) {
    return {
      title: "Seguí así",
      message: `🔥 Vas ${pct}% de tu objetivo. Te faltan ${remainingKcal} kcal, alcanza con una comida más para cerrar el día equilibrado.`,
    };
  }

  return {
    title: "Vas en camino",
    message: `Llevás ${pct}% de tu objetivo diario (${remainingKcal} kcal restantes). Planificá tu próxima comida para mantener el ritmo.`,
  };
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6e7788]">{label}</p>
      <p className="font-display mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function TargetBar({
  icon: Icon,
  label,
  current,
  target,
  unit,
  color,
}: {
  icon: LucideIcon;
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const isOver = target > 0 && current > target;

  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold text-[#c2c8d6]">
          <Icon className="size-3.5" style={{ color }} />
          {label}
        </span>
        <span className={cn("font-semibold", isOver ? "text-[#f4717f]" : "text-[var(--foreground-muted)]")}>
          {current} / {target} {unit}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--card-alt)]">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
