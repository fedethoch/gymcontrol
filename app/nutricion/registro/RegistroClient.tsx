"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Beef,
  Droplet,
  Flame,
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

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/Accordion";
import { MobileHeaderBadgeSync } from "@/app/components/shared/MobileHeader";
import { Button } from "@/app/components/ui/Button";
import { CardTitle } from "@/app/components/ui/Card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/app/components/ui/Drawer";
import { Input } from "@/app/components/ui/Input";
import { LoadingDots } from "@/app/components/ui/LoadingDots";
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
import {
  MEAL_TYPE_IMAGES,
  MEAL_TYPE_LABELS,
  MEAL_TYPES,
  type Food,
  type FoodMeasure,
  type Macros,
  type MealType,
} from "@/app/lib/nutrition-types";
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
  const [mealType, setMealType] = useState<MealType>("desayuno");
  const [mealName, setMealName] = useState(MEAL_TYPE_LABELS.desayuno);
  const [mealNameTouched, setMealNameTouched] = useState(false);
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

  function handleAddDraftItem(foodId: string, measure: FoodMeasure, quantity: number) {
    setDraftItems((current) => [...current, { localId: crypto.randomUUID(), foodId, measure, quantity }]);
  }

  function handleRemoveDraftItem(localId: string) {
    setDraftItems((current) => current.filter((item) => item.localId !== localId));
  }

  function handleNewMealTypeChange(value: MealType) {
    setMealType(value);

    if (!mealNameTouched) {
      setMealName(MEAL_TYPE_LABELS[value]);
    }
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
      let log = await createMealAction({ logDate, name: trimmed, type: mealType });
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
      setMealType("desayuno");
      setMealName(MEAL_TYPE_LABELS.desayuno);
      setMealNameTouched(false);
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

  async function handleUpdateMeal(mealId: string, input: { name?: string; type?: MealType }) {
    const log = await updateMealAction({ logDate, mealId, ...input });
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
      <div className="grid grid-cols-[76px_1fr] items-end gap-3">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-alt)]">
          <Image
            alt={MEAL_TYPE_LABELS[mealType]}
            className="object-cover"
            fill
            sizes="76px"
            src={MEAL_TYPE_IMAGES[mealType]}
          />
        </div>
        <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
          Tipo de comida
          <Select value={mealType} onValueChange={(value) => handleNewMealTypeChange(value as MealType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEAL_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {MEAL_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      <label className="grid gap-1.5 text-xs font-semibold text-[#c2c8d6]">
        Nombre de la comida
        <Input
          placeholder="Ej. Desayuno"
          value={mealName}
          onChange={(event) => {
            setMealName(event.target.value);
            setMealNameTouched(true);
          }}
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
                    {isSavingMeal ? <LoadingDots /> : <Plus className="size-4" />}
        Guardar comida
      </Button>
    </div>
  );

  const newMealIntro = (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="grid size-12 place-items-center rounded-xl border border-[var(--accent-soft-border)] bg-[var(--accent-soft-surface)] text-[var(--accent-bright)]">
        <UtensilsCrossed className="size-6" />
      </span>
      <div>
        <CardTitle className="text-lg">Nueva comida</CardTitle>
        <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
          Agregá los alimentos que consumiste y guardá tu comida.
        </p>
      </div>
    </div>
  );

  return (
    <div className="grid gap-3">
      <MobileHeaderBadgeSync
        badge={{
          label: String(streak),
          ariaLabel: `${streak} días de racha de nutrición`,
          tone: "warm",
        }}
      />

      <Drawer open={newMealOpen} onOpenChange={setNewMealOpen}>
        <DrawerContent>
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

      {/* Row 1: Calorías card */}
      <div className="rounded-2xl bg-[#0e131e] p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <Flame className="size-3.5 text-[var(--accent-bright)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7887a6]">Calorías</span>
          <Button asChild type="button" variant="outline" size="sm" className="ml-auto h-6 gap-1 border-[rgba(255,255,255,0.1)] px-2 text-[10px]">
            <Link href="/configuracion">
              <Settings2 className="size-3" />
              <span className="hidden sm:inline">Editar</span>
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-3 items-center">
          <div className="flex flex-col items-center">
            <span className="font-display text-xl font-bold text-white">{totalKcal}</span>
            <span className="text-[9px] text-[#7887a6]">consumidas</span>
          </div>
          <div className="flex justify-center">
            <AnimatedProgressRing
              value={targetKcal > 0 ? Math.min(100, Math.round((totalKcal / targetKcal) * 100)) : 0}
              size={72}
              strokeWidth={8}
              progressColor="var(--accent-bright)"
            >
              <div className="flex flex-col items-center">
                <span className="font-display text-xs font-bold text-white">{targetKcal}</span>
                <span className="text-[7px] text-[#7887a6]">objetivo</span>
              </div>
            </AnimatedProgressRing>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-display text-xl font-bold text-white">{Math.max(0, targetKcal - totalKcal)}</span>
            <span className="text-[9px] text-[#7887a6]">restantes</span>
          </div>
        </div>
      </div>

      {/* Row 2: Macros card */}
      <div className="rounded-2xl bg-[#0e131e] px-3.5 py-3.5">
        <div className="mb-2.5 flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-full bg-[rgba(124,58,237,0.14)] text-[var(--accent-bright)]">
            <UtensilsCrossed className="size-3.5" />
          </span>
          <span className="font-display text-base font-semibold text-white">Macros</span>
        </div>
        <div className="grid grid-cols-3 divide-x divide-[rgba(255,255,255,0.07)]">
          {(
            [
              { Icon: Beef, label: MACRO_LABELS.protein, value: totalMacros.proteinG, target: targetMacros.proteinG, color: MACRO_COLORS.protein },
              { Icon: Wheat, label: MACRO_LABELS.carbs, value: totalMacros.carbsG, target: targetMacros.carbsG, color: MACRO_COLORS.carbs },
              { Icon: Droplet, label: MACRO_LABELS.fat, value: totalMacros.fatG, target: targetMacros.fatG, color: MACRO_COLORS.fat },
            ] as { Icon: LucideIcon; label: string; value: number; target: number; color: string }[]
          ).map(({ Icon: MacroIcon, label, value, target, color }) => {
            const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
            return (
              <div key={label} className="flex min-w-0 flex-col items-center px-2 first:pl-0 last:pr-0">
                <AnimatedProgressRing value={pct} size={46} strokeWidth={4} progressColor={color}>
                  <MacroIcon className="size-3.5" style={{ color }} />
                </AnimatedProgressRing>
                <div className="mt-1.5 w-full min-w-0 text-center">
                  <p className="truncate text-[10px] font-bold leading-none text-white">{label}</p>
                  <p className="mt-1 whitespace-nowrap text-[11px] font-bold leading-none text-white">
                    {Math.round(value)} / {Math.round(target)}g
                  </p>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#1a2235]">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  <p className="mt-1 text-center text-[10px] font-semibold leading-none" style={{ color }}>
                    {pct}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: Comidas de hoy */}
      <div className="rounded-2xl bg-[#0e131e] p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-white">Comidas de hoy</h2>
            <p className="mt-0.5 truncate text-xs text-[#7887a6]">Cada comida suma a tu registro diario</p>
          </div>
          <Button type="button" size="sm" className="h-8 shrink-0 px-2.5 text-[10px]" onClick={() => setNewMealOpen(true)}>
            <Plus className="size-4" />
            Nueva
          </Button>
        </div>
        {meals.length === 0 ? (
          <p className="text-sm text-[#7887a6]">
            Todavía no creaste comidas hoy. Usá &quot;Nueva&quot; para empezar.
          </p>
        ) : (
          <div className="grid overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111722] sm:grid-cols-2 sm:gap-3 sm:border-0 sm:bg-transparent">
            {meals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                foods={foods}
                isEditing={editingMealId === meal.id}
                onToggleEdit={() => setEditingMealId((current) => (current === meal.id ? null : meal.id))}
                onDeleteMeal={() => handleDeleteMeal(meal.id)}
                onUpdateMeal={(input) => handleUpdateMeal(meal.id, input)}
                onAddItem={(foodId, measure, quantity) => handleAddItem(meal.id, foodId, measure, quantity)}
                onDeleteItem={handleDeleteItem}
                onUpdateItem={handleUpdateItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Row 4: Constancia */}
      <div className="rounded-2xl bg-[#0e131e] p-3">
        <div className="flex items-start gap-3">
          <Flame className="mt-0.5 size-6 shrink-0 text-orange-400" />
          <div className="flex-1">
            <p className="font-display font-semibold text-white">{streak} días seguidos</p>
            <div className="mt-2 flex justify-between">
              {(["L","M","M","J","V","S","D"] as const).map((letter, i) => {
                const d = new Date();
                const todayDow = (d.getDay() + 6) % 7;
                d.setDate(d.getDate() - todayDow + i);
                const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                const logged = loggedDates.includes(key);
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-medium text-[#7887a6]">{letter}</span>
                    <div className={`size-4 rounded-full border-2 ${logged ? "border-orange-400 bg-orange-400" : "border-[#3a4560] bg-transparent"}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row 5: Frase motivadora (placeholder bg) */}
      <div className="relative flex min-h-[72px] items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#1a1535_0%,#0e1528_100%)] px-4 py-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(124,58,237,0.25),transparent_70%)]" />
        <p className="relative text-center text-sm font-semibold italic text-white/80">
          &ldquo;Cada repetición te acerca a quien quieres ser.&rdquo;
        </p>
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
  onUpdateMeal,
  onAddItem,
  onDeleteItem,
  onUpdateItem,
}: {
  meal: MealGroup;
  foods: Food[];
  isEditing: boolean;
  onToggleEdit: () => void;
  onDeleteMeal: () => void;
  onUpdateMeal: (input: { name?: string; type?: MealType }) => Promise<void>;
  onAddItem: (foodId: string, measure: FoodMeasure, quantity: number) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onUpdateItem: (itemId: string, measure: FoodMeasure, quantity: number) => Promise<void>;
}) {
  const [name, setName] = useState(meal.name);
  const [type, setType] = useState<MealType>(meal.type);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingType, setIsSavingType] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editMeasure, setEditMeasure] = useState<FoodMeasure>("g");
  const [isSavingItem, setIsSavingItem] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const trimmed = name.trim();

    if (!trimmed || trimmed === meal.name) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      setIsSavingName(true);

      try {
        await onUpdateMeal({ name: trimmed });
      } catch {
        toast.error("No se pudo actualizar la comida.");
      } finally {
        setIsSavingName(false);
      }
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [isEditing, meal.name, name, onUpdateMeal]);

  async function handleTypeChange(nextType: MealType) {
    const shouldSyncName = name.trim() === MEAL_TYPE_LABELS[type];
    const nextName = shouldSyncName ? MEAL_TYPE_LABELS[nextType] : undefined;

    setType(nextType);

    if (nextName) {
      setName(nextName);
    }

    setIsSavingType(true);

    try {
      await onUpdateMeal({ type: nextType, name: nextName });
    } catch {
      toast.error("No se pudo actualizar el tipo de comida.");
      setType(meal.type);
      setName(meal.name);
    } finally {
      setIsSavingType(false);
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

  async function handleSaveItem(itemId: string, nextMeasure = editMeasure, nextQuantity = editQuantity) {
    const parsedQuantity = Number(nextQuantity);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      toast.error("Ingresá una cantidad válida.");
      return;
    }

    setIsSavingItem(true);

    try {
      await onUpdateItem(itemId, nextMeasure, parsedQuantity);
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

  function handleToggleEdit() {
    if (isEditing) {
      setEditingItemId(null);
    }

    onToggleEdit();
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
                  <Select
                    value={editMeasure}
                    onValueChange={(value) => {
                      const nextMeasure = value as FoodMeasure;
                      const parsedQuantity = Number(editQuantity);
                      const nextQuantity =
                        Number.isFinite(parsedQuantity) && parsedQuantity > 0 && itemGramsPerUnit
                          ? nextMeasure === "unit"
                            ? String(roundQuantity(parsedQuantity / itemGramsPerUnit))
                            : String(roundQuantity(parsedQuantity * itemGramsPerUnit))
                          : editQuantity;
                      setEditMeasure(nextMeasure);
                      setEditQuantity(nextQuantity);
                      void handleSaveItem(item.id, nextMeasure, nextQuantity);
                    }}
                  >
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
                  onBlur={() => handleSaveItem(item.id)}
                  className="w-16 sm:w-20"
                />
                {isSavingItem && <LoadingDots className="text-[#9a63ff]" />}
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
                            {deletingId === item.id ? <LoadingDots /> : <Trash2 className="size-4" />}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const actionButtons = (
    <div className="flex shrink-0 items-center gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleToggleEdit}
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
  );

  const macroChips = (
    <div className="flex flex-1 flex-wrap gap-1.5">
      <MacroChip label="P" value={meal.macros.proteinG} color={MACRO_COLORS.protein} />
      <MacroChip label="C" value={meal.macros.carbsG} color={MACRO_COLORS.carbs} />
      <MacroChip label="G" value={meal.macros.fatG} color={MACRO_COLORS.fat} />
    </div>
  );

  const compactActionButtons = (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 rounded-lg"
        onClick={handleToggleEdit}
        title={isEditing ? "Terminar ediciÃ³n" : "Editar comida"}
      >
        <Pencil className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 rounded-lg hover:text-red-400"
        onClick={onDeleteMeal}
        title="Eliminar comida"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );

  return (
    <div
      className={cn(
        "flex h-full flex-col",
        isEditing
          ? "gap-3 rounded-2xl bg-[#0e131e] p-4"
          : "gap-2 border-b border-[rgba(255,255,255,0.06)] bg-[#111722] p-2.5 last:border-b-0 sm:gap-3 sm:rounded-2xl sm:border sm:border-[rgba(255,255,255,0.06)] sm:bg-[#0e131e] sm:p-4",
      )}
    >
      {isEditing ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-alt)]">
              <Image
                alt={MEAL_TYPE_LABELS[type]}
                className="object-cover"
                fill
                sizes="48px"
                src={MEAL_TYPE_IMAGES[type]}
              />
            </div>
            <div className="grid min-w-0 flex-1 gap-2">
              <Select value={type} onValueChange={(value) => handleTypeChange(value as MealType)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map((mealTypeOption) => (
                    <SelectItem key={mealTypeOption} value={mealTypeOption}>
                      {MEAL_TYPE_LABELS[mealTypeOption]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => {
                  if (!name.trim()) {
                    setName(meal.name);
                    toast.error("Ponele un nombre a la comida.");
                  }
                }}
                className="min-w-0"
              />
              {(isSavingName || isSavingType) && (
                <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a63ff]">
                  <LoadingDots />
                  Guardando
                </span>
              )}
            </div>
            <p className="whitespace-nowrap text-sm font-semibold text-white">{meal.kcal} kcal</p>
          </div>

          {meal.items.length === 0 ? (
            <p className="text-sm text-[#7887a6]">Sin alimentos todavia.</p>
          ) : (
            itemsList
          )}

          <FoodPickerRow foods={foods} onAdd={handleAddItem} actionLabel="Agregar" />

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
            {macroChips}
            {actionButtons}
          </div>
        </>
      ) : (
        <>
          <div className="flex min-w-0 items-center gap-2.5 sm:items-start sm:gap-3">
            <div className="relative size-[68px] shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-alt)] sm:size-24 sm:rounded-2xl">
              <Image
                alt={MEAL_TYPE_LABELS[type]}
                className="object-cover"
                fill
                sizes="(max-width: 640px) 68px, 96px"
                src={MEAL_TYPE_IMAGES[type]}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-[#b985ff]">
                {MEAL_TYPE_LABELS[meal.type]}
              </p>
              <p className="mt-0.5 truncate font-display text-[15px] font-semibold leading-tight text-white sm:mt-1 sm:text-base">
                {meal.name}
              </p>
              <p className="mt-0.5 line-clamp-1 text-xs leading-4 text-[#8d97ab] sm:mt-1 sm:line-clamp-2">
                {formatMealFoods(meal)}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold text-[#7887a6] sm:hidden">
                <span style={{ color: MACRO_COLORS.protein }}>P {Math.round(meal.macros.proteinG)}g</span>
                <span style={{ color: MACRO_COLORS.carbs }}>C {Math.round(meal.macros.carbsG)}g</span>
                <span style={{ color: MACRO_COLORS.fat }}>G {Math.round(meal.macros.fatG)}g</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 self-start">
              <span className="whitespace-nowrap rounded-full bg-[rgba(255,255,255,0.05)] px-2 py-1 text-[11px] font-bold text-white">
                {meal.kcal} kcal
              </span>
              {compactActionButtons}
            </div>
          </div>

          {meal.items.length > 0 && (
            <Accordion type="single" collapsible className="-my-1">
              <AccordionItem value="items" className="border-none">
                <AccordionTrigger className="py-1 text-xs font-semibold text-[#9aa3b8] hover:text-white">
                  {meal.items.length} alimento{meal.items.length === 1 ? "" : "s"}
                </AccordionTrigger>
                <AccordionContent>{itemsList}</AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </>
      )}
    </div>
  );
}

function formatMealFoods(meal: MealGroup) {
  if (meal.items.length === 0) {
    return "Sin alimentos";
  }

  const names = meal.items.slice(0, 3).map((item) => item.foodName);
  const suffix = meal.items.length > 3 ? ` +${meal.items.length - 3}` : "";

  return `${names.join(", ")}${suffix}`;
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
              {isAdding ? <LoadingDots /> : <Plus className="size-4" />}
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
    <div className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--card-alt)] p-3">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#34245b] bg-[#251640] text-[#b987ff]"
        >
          <Flame className="size-4" />
        </span>
        <h2 className="font-display text-sm font-semibold leading-tight text-white">{title}</h2>
      </div>
      <p className="mt-2 text-xs leading-5 text-[#c6cede]">{message}</p>
    </div>
  );
}

function getNutritionTip(pct: number, mealsCount: number, remainingKcal: number) {
  if (mealsCount === 0) {
    return {
      title: "Empezá tu día",
      message: "Sin comidas registradas. Usá \"Nueva comida\" para arrancar.",
    };
  }

  if (pct >= 100) {
    return {
      title: "Objetivo alcanzado",
      message: `Llegaste al ${pct}% con ${mealsCount} comida${mealsCount === 1 ? "" : "s"}. ¡Buen trabajo!`,
    };
  }

  if (pct >= 70) {
    return {
      title: "Seguí así",
      message: `Vas en ${pct}%. Te faltan ${remainingKcal} kcal para cerrar el día.`,
    };
  }

  return {
    title: "Vas en camino",
    message: `Llevás ${pct}% · ${remainingKcal} kcal restantes.`,
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
