"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Beef,
  Check,
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
  AnimatedMacroBar,
  AnimatedNumber,
  fadeUp,
  motion,
  staggerContainer,
} from "@/app/components/ui/motion";
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

const compactControlClass = "nutrition-compact-control";
const compactButtonClass = "h-8 rounded-lg px-2.5 text-xs";

const NUTRITION_PHRASES = [
  "Cada comida registrada te acerca a tu objetivo.",
  "La constancia pesa más que la perfección.",
  "Lo que medís, lo mejorás.",
  "Un registro hoy, un hábito mañana.",
] as const;

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
  const macrosEmpty = totalMacros.proteinG === 0 && totalMacros.carbsG === 0 && totalMacros.fatG === 0;
  const dailyPhrase = NUTRITION_PHRASES[parseInt(logDate.replace(/-/g, ""), 10) % NUTRITION_PHRASES.length];
  const todayDow = (new Date().getDay() + 6) % 7;

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
    <div className="flex max-h-[calc(82dvh-4.25rem)] flex-col gap-2.5 overflow-y-auto pr-1">
      <div className="grid grid-cols-[60px_1fr] items-end gap-2.5">
        <div className="relative aspect-square overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-alt)]">
          <Image
            alt={MEAL_TYPE_LABELS[mealType]}
            className="object-cover"
            fill
            sizes="60px"
            src={MEAL_TYPE_IMAGES[mealType]}
          />
        </div>
        <label className="grid gap-1 text-[11px] font-semibold text-[#c2c8d6]">
          Tipo de comida
          <Select value={mealType} onValueChange={(value) => handleNewMealTypeChange(value as MealType)}>
            <SelectTrigger className={compactControlClass}>
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

      <label className="grid gap-1 text-[11px] font-semibold text-[#c2c8d6]">
        Nombre de la comida
        <Input
          className={compactControlClass}
          placeholder="Ej. Desayuno"
          value={mealName}
          onChange={(event) => {
            setMealName(event.target.value);
            setMealNameTouched(true);
          }}
        />
      </label>

      <FoodPickerRow foods={foods} onAdd={handleAddDraftItem} actionLabel="Agregar" />

      <div className="flex min-h-[6.75rem] flex-col overflow-hidden rounded-xl border border-[var(--border)]">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 bg-[var(--card-alt)] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#7887a6]">
          <span>Alimento</span>
          <span className="text-right">Cantidad</span>
          <span className="text-right">Calorías</span>
          <span />
        </div>
        {draftItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-3 py-4 text-center">
            <UtensilsCrossed className="size-5 text-[#3c4456]" />
            <p className="text-xs text-[#7887a6]">Agregá alimentos a esta comida.</p>
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
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 border-t border-[var(--border)] px-2.5 py-1.5 text-xs"
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
                  className="size-8 justify-self-end rounded-lg"
                  onClick={() => handleRemoveDraftItem(item.localId)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            );
          })
        )}
      </div>

      <Button
        type="button"
        className="sticky bottom-0 h-10 shrink-0 rounded-lg text-sm shadow-[0_-10px_24px_rgba(8,11,16,0.85)]"
        onClick={handleSaveMeal}
        disabled={isSavingMeal}
      >
                    {isSavingMeal ? <LoadingDots /> : <Plus className="size-4" />}
        Guardar comida
      </Button>
    </div>
  );

  const newMealIntro = (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <span className="grid size-10 place-items-center rounded-xl border border-[var(--accent-soft-border)] bg-[var(--accent-soft-surface)] text-[var(--accent-bright)]">
        <UtensilsCrossed className="size-5" />
      </span>
      <div>
        <CardTitle className="text-base">Nueva comida</CardTitle>
        <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
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
        <DrawerContent className="max-h-[82dvh]">
          <DrawerHeader className="px-3 py-2">
            <DrawerTitle className="sr-only">Nueva comida</DrawerTitle>
            <DrawerDescription className="sr-only">
              Agregá los alimentos que consumiste y guardá tu comida.
            </DrawerDescription>
            {newMealIntro}
          </DrawerHeader>
          <div className="min-h-0 px-3 pb-3">{newMealBody}</div>
        </DrawerContent>
      </Drawer>

      <motion.div
        className="grid gap-3"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Row 1: Calorías card */}
        <motion.div variants={fadeUp} className="rounded-2xl bg-[#0e131e] p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Flame className="size-3.5 text-[var(--accent-bright)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7887a6]">Calorías</span>
            <Button asChild type="button" variant="outline" size="sm" className="ml-auto h-6 gap-1 border-[rgba(255,255,255,0.1)] px-2 text-[10px]">
              <Link href="/configuracion">
                <Settings2 className="size-3" />
                <span>Editar objetivo</span>
              </Link>
            </Button>
          </div>
          <p className="mb-2 text-center text-[9px] font-semibold text-[#7887a6]">
            Objetivo: {targetKcal} kcal
          </p>
          <div className="grid grid-cols-3 items-center">
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-display text-xl font-bold text-white">
                <AnimatedNumber value={totalKcal} />
              </span>
              <span className="text-center text-[9px] leading-tight text-[#7887a6]">kcal consumidas</span>
            </div>
            <div className="flex justify-center">
              <AnimatedProgressRing
                value={targetKcal > 0 ? Math.min(100, Math.round((totalKcal / targetKcal) * 100)) : 0}
                size={72}
                strokeWidth={5}
                progressColor="var(--accent-bright)"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-display text-sm font-bold text-white">
                    {targetKcal > 0 ? Math.min(100, Math.round((totalKcal / targetKcal) * 100)) : 0}%
                  </span>
                  {totalKcal === 0 && (
                    <span className="text-[7px] leading-none text-[#7887a6]">Sin registro</span>
                  )}
                </div>
              </AnimatedProgressRing>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-display text-xl font-bold text-white">
                <AnimatedNumber value={Math.max(0, targetKcal - totalKcal)} />
              </span>
              <span className="text-center text-[9px] leading-tight text-[#7887a6]">kcal restantes</span>
            </div>
          </div>
        </motion.div>

        {/* Row 2: Macros card */}
        <motion.div variants={fadeUp} className="rounded-2xl bg-[#0e131e] px-3 py-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-full bg-[rgba(124,58,237,0.14)] text-[var(--accent-bright)]">
              <UtensilsCrossed className="size-3.5" />
            </span>
            <span className="font-display text-base font-semibold text-white">Macros</span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-[rgba(255,255,255,0.07)]">
            {(
              [
                { Icon: Beef, label: MACRO_LABELS.protein, value: totalMacros.proteinG, target: targetMacros.proteinG, color: MACRO_COLORS.protein, barDelay: 0 },
                { Icon: Wheat, label: MACRO_LABELS.carbs, value: totalMacros.carbsG, target: targetMacros.carbsG, color: MACRO_COLORS.carbs, barDelay: 0.1 },
                { Icon: Droplet, label: MACRO_LABELS.fat, value: totalMacros.fatG, target: targetMacros.fatG, color: MACRO_COLORS.fat, barDelay: 0.2 },
              ] as { Icon: LucideIcon; label: string; value: number; target: number; color: string; barDelay: number }[]
            ).map(({ Icon: MacroIcon, label, value, target, color, barDelay }) => {
              const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
              return (
                <div key={label} className="flex min-w-0 flex-col items-center px-1.5 first:pl-0 last:pr-0">
                  <p className="mb-1.5 truncate text-[10px] font-bold leading-none text-white">{label}</p>
                  <AnimatedProgressRing value={pct} size={42} strokeWidth={4} progressColor={color}>
                    <MacroIcon className="size-3" style={{ color }} />
                  </AnimatedProgressRing>
                  <div className="mt-1 w-full min-w-0 text-center">
                    <p className="mt-1 whitespace-nowrap text-[10px] font-bold leading-none text-white">
                      <AnimatedNumber value={Math.round(value)} /> / {Math.round(target)}g
                    </p>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#1a2235]">
                      <AnimatedMacroBar pct={pct} color={color} delay={barDelay} />
                    </div>
                    <p className="mt-1 text-center text-[9px] font-semibold leading-none" style={{ color }}>
                      {pct}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {macrosEmpty && (
            <p className="mt-3 text-center text-[10px] text-[#7887a6]">
              Agregá una comida para ver tu distribución diaria de macros.
            </p>
          )}
        </motion.div>

        {/* Row 3: Comidas de hoy */}
        <motion.div variants={fadeUp} className="rounded-2xl bg-[#0e131e] p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-display text-base font-semibold text-white">Comidas de hoy</h2>
              <p className="mt-0.5 truncate text-xs text-[#7887a6]">Cada comida suma a tu registro diario</p>
            </div>
            <Button type="button" size="sm" className="h-8 shrink-0 px-2.5 text-[10px]" onClick={() => setNewMealOpen(true)}>
              <Plus className="size-4" />
              Nueva comida
            </Button>
          </div>
          {meals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-2 py-4 text-center"
            >
              <UtensilsCrossed className="size-6 text-[#3c4456]" />
              <p className="text-sm text-[#7887a6]">
                Todavía no registraste comidas hoy.{" "}
                <span className="text-white/50">Agregá tu primera comida para empezar a sumar calorías y macros.</span>
              </p>
            </motion.div>
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
        </motion.div>

        {/* Row 4: Constancia */}
        <motion.div variants={fadeUp} className="rounded-2xl bg-[#0e131e] p-3">
          <div className="flex items-start gap-3">
            <Flame className="mt-0.5 size-6 shrink-0 text-orange-400" />
            <div className="flex-1">
              <p className="font-display font-semibold text-white">{streak} días seguidos</p>
              {streak === 0 && (
                <p className="mt-0.5 text-xs text-[#7887a6]">Registrá una comida hoy para iniciar tu racha.</p>
              )}
              <div className="mt-2 flex justify-between">
                {(["L","M","M","J","V","S","D"] as const).map((letter, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - todayDow + i);
                  const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                  const logged = loggedDates.includes(key) || (i === todayDow && meals.length > 0);
                  const isToday = i === todayDow;
                  const todayActive = isToday && (loggedDates.includes(logDate) || meals.length > 0);
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className={`text-[9px] font-medium ${isToday ? "text-white" : "text-[#7887a6]"}`}>{letter}</span>
                      <motion.div
                        className={`size-4 rounded-full border-2 ${
                          logged
                            ? "border-orange-400 bg-orange-400"
                            : isToday
                            ? "border-[var(--accent-bright)] bg-transparent"
                            : "border-[#3a4560] bg-transparent"
                        }`}
                        animate={
                          todayActive
                            ? {
                                boxShadow: [
                                  "0 0 0px 0px rgba(251,146,60,0)",
                                  "0 0 6px 2px rgba(251,146,60,0.55)",
                                  "0 0 0px 0px rgba(251,146,60,0)",
                                ],
                              }
                            : undefined
                        }
                        transition={
                          todayActive
                            ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                            : undefined
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Row 5: Frase motivadora */}
        <motion.div
          variants={fadeUp}
          className="relative flex min-h-[72px] items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#1a1535_0%,#0e1528_100%)] px-4 py-4"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(124,58,237,0.25),transparent_70%)]" />
          <p className="relative text-center text-sm font-semibold italic text-white/80">
            &ldquo;{dailyPhrase}&rdquo;
          </p>
        </motion.div>
      </motion.div>
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
    <div className="grid gap-1.5">
      {meal.items.map((item) => {
        const itemFood = foods.find((food) => food.id === item.foodId);
        const itemGramsPerUnit =
          itemFood?.gramsPerUnit ?? (itemFood?.measure === "unit" ? itemFood.servingG : null);
        const canChooseUnit = itemGramsPerUnit != null;
        const isEditingItem = editingItemId === item.id;

        return (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5"
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
              <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
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
                    }}
                  >
                    <SelectTrigger className={cn(compactControlClass, "w-22 sm:w-26")}>
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
                  className={cn(compactControlClass, "w-14 sm:w-18")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-lg"
                  onClick={() => handleSaveItem(item.id)}
                  disabled={isSavingItem}
                  title="Guardar alimento"
                  aria-label="Guardar alimento"
                >
                  {isSavingItem ? <LoadingDots /> : <Check className="size-4" />}
                </Button>
              </div>
            )}
            {isEditing && !isEditingItem && (
              <div className="flex items-center gap-1.5">
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
          ? "gap-2.5 rounded-2xl bg-[#0e131e] p-3.5"
          : "gap-2 border-b border-[rgba(255,255,255,0.06)] bg-[#111722] p-2.5 last:border-b-0 sm:gap-3 sm:rounded-2xl sm:border sm:border-[rgba(255,255,255,0.06)] sm:bg-[#0e131e] sm:p-4",
      )}
    >
      {isEditing ? (
        <>
          <div className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-2.5">
            <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-alt)]">
              <Image
                alt={MEAL_TYPE_LABELS[type]}
                className="object-cover"
                fill
                sizes="40px"
                src={MEAL_TYPE_IMAGES[type]}
              />
            </div>
            <div className="min-w-0">
              <Select value={type} onValueChange={(value) => handleTypeChange(value as MealType)}>
                <SelectTrigger className={compactControlClass}>
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
            </div>
            <p className="whitespace-nowrap text-sm font-semibold text-white">{meal.kcal} kcal</p>
          </div>

          <div className="grid gap-1.5">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => {
                if (!name.trim()) {
                  setName(meal.name);
                  toast.error("Ponele un nombre a la comida.");
                }
              }}
              className={cn("min-w-0", compactControlClass)}
            />
            {(isSavingName || isSavingType) && (
              <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a63ff]">
                <LoadingDots />
                Guardando
              </span>
            )}
          </div>

          {meal.items.length === 0 ? (
            <p className="text-sm text-[#7887a6]">Sin alimentos todavia.</p>
          ) : (
            itemsList
          )}

          <FoodPickerRow foods={foods} onAdd={handleAddItem} actionLabel="Agregar" layout="stacked" />

          <div className="mt-auto flex items-center justify-between gap-2.5 border-t border-[var(--border)] pt-2.5">
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
  layout = "responsive",
}: {
  foods: Food[];
  onAdd: (foodId: string, measure: FoodMeasure, quantity: number) => void | Promise<void>;
  actionLabel: string;
  layout?: "responsive" | "stacked";
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

  const isStacked = layout === "stacked";

  return (
    <div
      className={cn(
        "grid gap-1",
        isStacked
          ? "grid-cols-2 gap-x-2.5 gap-y-3"
          : "sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end",
      )}
    >
      <div ref={containerRef} className={cn("relative", isStacked ? "col-span-2" : "sm:col-span-2 lg:col-span-1")}>
        <label className="grid gap-0.5 text-[11px] font-semibold text-[#c2c8d6]">
          Buscar alimento
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#7d8697]" />
            <Input
              className={cn("pl-8 text-[12px] placeholder:text-[12px]", compactControlClass)}
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
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-44 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
            {results.map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => handleSelectFood(food)}
                className="flex w-full items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-1.5 text-left text-xs text-[var(--foreground)] last:border-b-0 hover:bg-[rgba(124,58,237,0.1)]"
              >
                <span className="truncate">{food.name}</span>
                <span className="whitespace-nowrap text-[11px] text-[#7887a6]">{food.calories} kcal/{food.servingG}g</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <label className="grid gap-0.5 text-[11px] font-semibold text-[#c2c8d6]">
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
          <SelectTrigger className={cn(compactControlClass, isStacked && "h-8 px-2 text-[12px]")}>
            <SelectValue placeholder="Medida" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="g">Gramos</SelectItem>
            <SelectItem value="unit">Unidades</SelectItem>
          </SelectContent>
        </Select>
      </label>

      <label className="grid gap-0.5 text-[11px] font-semibold text-[#c2c8d6]">
        {isUnit ? "Unidades" : "Gramos"}
        <Input
          type="number"
          min={isUnit ? 0.5 : 1}
          step={isUnit ? 0.5 : 1}
          value={quantity}
          className={cn(compactControlClass, isStacked && "h-8 px-2 text-[11px]")}
          onChange={(event) => setQuantity(event.target.value)}
        />
      </label>

      <Button
        type="button"
        variant="outline"
        onClick={handleAdd}
        disabled={isAdding || !foodId}
        className={cn(compactButtonClass, isStacked ? "col-span-2 mt-1" : "sm:col-span-2 lg:col-span-1")}
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
