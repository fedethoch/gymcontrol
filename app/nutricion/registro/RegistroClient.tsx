"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Beef,
  Check,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Flame,
  type LucideIcon,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  UtensilsCrossed,
  Wheat,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/Accordion";
import { RegistroMobile } from "@/app/components/registro/RegistroMobile";
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
import { useMediaQuery } from "@/app/components/ui/use-media-query";
import {
  addMealItemAction,
  createMealAction,
  deleteMealAction,
  deleteMealItemAction,
  moveMealAction,
  updateMealAction,
  updateMealItemAction,
  type MealLogActionResult,
} from "@/app/nutricion/registro/actions";
import { FoodPicker } from "@/app/nutricion/registro/FoodPicker";
import { addDaysToDateKey, getWeekStartDateKey } from "@/app/lib/local-date";
import {
  formatItemAmount,
  formatQuantity,
  formatServings,
  getFoodGramsPerUnit,
  parseQuantity,
  previewNutrition,
  type PickerOption,
} from "@/app/lib/meal-amounts";
import { calculateStreak, withCurrentDay } from "@/app/lib/meal-diary";
import { MACRO_COLORS, MACRO_LABELS } from "@/app/lib/nutrition-style";
import type { MealGroup, MealLogItem } from "@/app/lib/meal-logs";
import { suggestAfterMealId } from "@/app/lib/meal-order";
import {
  getAmountUnitLabel,
  MEAL_LOG_MAX_PAST_DAYS,
  MEAL_TYPE_IMAGES,
  MEAL_TYPE_LABELS,
  MEAL_TYPES,
  frequentSlotOf,
  type Food,
  type FoodMeasure,
  type FrequentItem,
  type FrequentItemsBySlot,
  type Macros,
  type MealItemInput,
  type MealType,
  type RecipeOption,
} from "@/app/lib/nutrition-types";
import { cn } from "@/app/lib/utils";

type DraftItem = MealItemInput & { localId: string };

const compactControlClass = "nutrition-compact-control";

/** Valor del selector "Ubicar después de" para "al principio". */
const PLACE_AT_START = "start";

const NUTRITION_PHRASES = [
  "Cada comida registrada te acerca a tu objetivo.",
  "La constancia pesa más que la perfección.",
  "Lo que medís, lo mejorás.",
  "Un registro hoy, un hábito mañana.",
] as const;

const WEEK_LETTERS = ["L", "M", "M", "J", "V", "S", "D"] as const;

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("es-AR", { weekday: "long", timeZone: "UTC" });
const DAY_MONTH_FORMATTER = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", timeZone: "UTC" });

export function RegistroClient({
  foods,
  recipes,
  frequentBySlot,
  logDate,
  todayKey,
  initialMeals,
  target,
  loggedDates,
  initialMealType,
  initialMealId,
  initialFoodItem,
  initialRecipeItem,
}: {
  foods: Food[];
  recipes: RecipeOption[];
  frequentBySlot: FrequentItemsBySlot;
  /** Día que se está viendo/cargando (YYYY-MM-DD). */
  logDate: string;
  /** Hoy en hora argentina (YYYY-MM-DD). */
  todayKey: string;
  initialMeals: MealGroup[];
  /** null si el usuario todavía no configuró su objetivo. */
  target: { kcal: number; macros: Macros } | null;
  loggedDates: string[];
  /** Si viene (desde el home): abre la comida de ese tipo si ya existe, o "Nueva comida" con ese tipo. */
  initialMealType?: MealType;
  /** Si viene (desde una fila del home): abre esa comida. */
  initialMealId?: string;
  /** Si viene (desde /alimentos): en mobile abre "Agregar" con ese alimento en la comida que sigue. */
  initialFoodItem?: { foodId: string; measure: FoodMeasure; quantity: number } | null;
  /** Si viene (desde /recetas): en mobile abre "Agregar" con esa receta, en la comida de `?tipo=` o en la que sigue. */
  initialRecipeItem?: { recipeId: string; measure: FoodMeasure; quantity: number } | null;
}) {
  const router = useRouter();
  const [focusMealId] = useState(
    () =>
      initialMeals.find((meal) => meal.id === initialMealId)?.id ??
      (initialMealType ? [...initialMeals].reverse().find((meal) => meal.type === initialMealType)?.id : undefined) ??
      null,
  );
  const [meals, setMeals] = useState(initialMeals);
  const [foodList, setFoodList] = useState(foods);
  const [mealType, setMealType] = useState<MealType>(initialMealType ?? "desayuno");
  const [mealName, setMealName] = useState(MEAL_TYPE_LABELS[initialMealType ?? "desayuno"]);
  const [mealNameTouched, setMealNameTouched] = useState(false);
  /** null = automático según el tipo de comida. */
  const [placementChoice, setPlacementChoice] = useState<string | null>(null);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [isSavingMeal, setIsSavingMeal] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(focusMealId);
  const [newMealOpen, setNewMealOpen] = useState(Boolean(initialMealType) && !focusMealId);
  // Los dos árboles (mobile y desktop) están montados: cada uno abre lo suyo según el ancho.
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    if (isDesktop && focusMealId) {
      document.getElementById(`meal-${focusMealId}`)?.scrollIntoView({ block: "center" });
    }
  }, [isDesktop, focusMealId]);

  const totalKcal = meals.reduce((total, meal) => total + meal.kcal, 0);
  const totalMacros: Macros = meals.reduce<Macros>(
    (totals, meal) => ({
      proteinG: totals.proteinG + meal.macros.proteinG,
      carbsG: totals.carbsG + meal.macros.carbsG,
      fatG: totals.fatG + meal.macros.fatG,
    }),
    { proteinG: 0, carbsG: 0, fatG: 0 },
  );

  const isToday = logDate === todayKey;
  const loggedSet = withCurrentDay(loggedDates, logDate, meals.some((meal) => meal.items.length > 0));
  const streak = calculateStreak(loggedSet, todayKey);
  const macrosEmpty = totalMacros.proteinG === 0 && totalMacros.carbsG === 0 && totalMacros.fatG === 0;
  const dailyPhrase = NUTRITION_PHRASES[parseInt(logDate.replace(/-/g, ""), 10) % NUTRITION_PHRASES.length];
  const weekStart = getWeekStartDateKey(todayKey);
  const minDate = addDaysToDateKey(todayKey, -MEAL_LOG_MAX_PAST_DAYS);
  const previousDay = addDaysToDateKey(logDate, -1);
  const nextDay = addDaysToDateKey(logDate, 1);
  const kcalPct = target && target.kcal > 0 ? Math.round((totalKcal / target.kcal) * 100) : 0;
  const remainingKcal = target ? target.kcal - totalKcal : 0;
  const isOverTarget = target !== null && remainingKcal < 0;
  const suggestedAfter = suggestAfterMealId(meals, mealType);
  const placement =
    placementChoice && (placementChoice === PLACE_AT_START || meals.some((meal) => meal.id === placementChoice))
      ? placementChoice
      : suggestedAfter === null
        ? PLACE_AT_START
        : (suggestedAfter ?? meals.at(-1)?.id ?? PLACE_AT_START);

  function registroHref(dateKey: string) {
    return dateKey === todayKey ? "/nutricion/registro" : `/nutricion/registro?fecha=${dateKey}`;
  }

  function applyResult(result: MealLogActionResult) {
    if (!result.ok) {
      toast.error(result.message);
      return false;
    }

    setMeals(result.log.meals);
    return true;
  }

  function handleFoodCreated(food: Food) {
    setFoodList((current) => [food, ...current.filter((candidate) => candidate.id !== food.id)]);
  }

  function handleAddDraftItem(input: MealItemInput) {
    setDraftItems((current) => [...current, { ...input, localId: crypto.randomUUID() }]);
    return true;
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
      // Comida + alimentos en un solo paso: si algo falla no queda una comida a medias.
      const result = await createMealAction({
        logDate,
        name: trimmed,
        type: mealType,
        afterMealId: meals.length === 0 ? undefined : placement === PLACE_AT_START ? null : placement,
        items: draftItems.map(toMealItemInput),
      });

      if (!applyResult(result)) {
        return;
      }

      setMealType("desayuno");
      setMealName(MEAL_TYPE_LABELS.desayuno);
      setMealNameTouched(false);
      setPlacementChoice(null);
      setDraftItems([]);
      setNewMealOpen(false);
      toast.success("Comida guardada.");
    } catch {
      toast.error("No se pudo guardar la comida. Revisá tu conexión.");
    } finally {
      setIsSavingMeal(false);
    }
  }

  async function handleDeleteMeal(mealId: string) {
    try {
      if (!applyResult(await deleteMealAction({ logDate, mealId }))) {
        return;
      }

      if (editingMealId === mealId) {
        setEditingMealId(null);
      }

      toast.success("Comida eliminada.");
    } catch {
      toast.error("No se pudo eliminar la comida.");
    }
  }

  async function handleMoveMeal(mealId: string, direction: "up" | "down") {
    try {
      applyResult(await moveMealAction({ logDate, mealId, direction }));
    } catch {
      toast.error("No se pudo mover la comida.");
    }
  }

  async function handleUpdateMeal(mealId: string, input: { name?: string; type?: MealType }) {
    const result = await updateMealAction({ logDate, mealId, ...input });

    if (!result.ok) {
      throw new Error(result.message);
    }

    setMeals(result.log.meals);
  }

  async function handleAddItem(mealId: string, input: MealItemInput) {
    try {
      if (!applyResult(await addMealItemAction({ logDate, mealId, item: input }))) {
        return false;
      }

      toast.success("Agregado a la comida.");
      return true;
    } catch {
      toast.error("No se pudo agregar a la comida.");
      return false;
    }
  }

  async function handleUpdateItem(itemId: string, measure: FoodMeasure, quantity: number) {
    const result = await updateMealItemAction({ logDate, itemId, measure, quantity });

    if (!result.ok) {
      throw new Error(result.message);
    }

    setMeals(result.log.meals);
  }

  async function handleDeleteItem(itemId: string) {
    const result = await deleteMealItemAction({ logDate, itemId });

    if (!result.ok) {
      throw new Error(result.message);
    }

    // Totales del día y de la comida vuelven recalculados desde el servidor.
    setMeals(result.log.meals);
  }

  const newMealBody = (
    <div className="flex max-h-[calc(82dvh-4.25rem)] flex-col gap-3 overflow-y-auto pr-1">
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

      {meals.length > 0 ? (
        <label className="grid gap-1 text-[11px] font-semibold text-[#c2c8d6]">
          Ubicar después de
          <Select value={placement} onValueChange={setPlacementChoice}>
            <SelectTrigger className={compactControlClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PLACE_AT_START}>Al principio del día</SelectItem>
              {meals.map((meal) => (
                <SelectItem key={meal.id} value={meal.id}>
                  {meal.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      ) : null}

      <FoodPicker
        foods={foodList}
        recipes={recipes}
        frequentItems={frequentBySlot[frequentSlotOf(mealType)]}
        actionLabel="Agregar"
        onAdd={handleAddDraftItem}
        onFoodCreated={handleFoodCreated}
      />

      <div className="flex min-h-[6.75rem] flex-col overflow-hidden rounded-xl border border-[var(--border)]">
        <div className="grid grid-cols-[1fr_auto_auto_2.75rem] gap-2 bg-[var(--card-alt)] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#7887a6]">
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
            const option = resolveOption(item, foodList, recipes);

            if (!option) {
              return null;
            }

            const preview = previewNutrition(option, item.measure, item.quantity);

            return (
              <div
                key={item.localId}
                className="grid grid-cols-[1fr_auto_auto_2.75rem] items-center gap-2 border-t border-[var(--border)] px-2.5 py-1 text-xs"
              >
                <span className="truncate font-semibold text-white">{option.name}</span>
                <span className="text-right text-[var(--foreground-muted)]">{formatDraftAmount(item, option)}</span>
                <span className="text-right text-[var(--foreground-muted)]">{preview.kcal} kcal</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 justify-self-end rounded-lg"
                  aria-label={`Quitar ${option.name}`}
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
        className="sticky bottom-0 h-11 shrink-0 rounded-lg text-sm shadow-[0_-10px_24px_rgba(8,11,16,0.85)]"
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
          {isToday
            ? "Agregá los alimentos que consumiste y guardá tu comida."
            : `Se guarda en el registro del ${formatDayMonth(logDate)}.`}
        </p>
      </div>
    </div>
  );

  const desktop = (
    <div className="grid gap-3">
      <Drawer open={isDesktop === true && newMealOpen} onOpenChange={setNewMealOpen}>
        <DrawerContent className="max-h-[82dvh]">
          {/* En desktop el sheet ocupa todo el ancho: el contenido queda centrado con ancho legible. */}
          <div className="mx-auto flex min-h-0 w-full max-w-xl flex-col">
            <DrawerHeader className="px-3 py-2">
              <DrawerTitle className="sr-only">Nueva comida</DrawerTitle>
              <DrawerDescription className="sr-only">
                Agregá los alimentos que consumiste y guardá tu comida.
              </DrawerDescription>
              {newMealIntro}
            </DrawerHeader>
            <div className="min-h-0 px-3 pb-3">{newMealBody}</div>
          </div>
        </DrawerContent>
      </Drawer>

      <motion.div
        className="grid gap-3"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Row 0: día del registro */}
        <motion.nav
          variants={fadeUp}
          aria-label="Día del registro"
          className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2 rounded-2xl bg-[#0e131e] p-1.5"
        >
          {logDate > minDate ? (
            <Button asChild variant="ghost" size="icon" className="size-11 rounded-xl">
              <Link href={registroHref(previousDay)} prefetch={false} aria-label="Día anterior">
                <ChevronLeft className="size-5" />
              </Link>
            </Button>
          ) : (
            <span aria-hidden="true" />
          )}
          <label className="relative grid min-h-11 cursor-pointer place-items-center rounded-xl px-2 text-center hover:bg-[var(--card-alt)]">
            <span className="font-display text-base font-semibold leading-tight text-white">
              {formatDayTitle(logDate, todayKey)}
            </span>
            <span className="text-xs text-[var(--foreground-muted)]">{formatDayMonth(logDate)}</span>
            <input
              type="date"
              aria-label="Elegir día del registro"
              className="absolute inset-0 cursor-pointer opacity-0"
              min={minDate}
              max={todayKey}
              value={logDate}
              onClick={(event) => event.currentTarget.showPicker?.()}
              onChange={(event) => {
                const value = event.target.value;

                if (value && value >= minDate && value <= todayKey && value !== logDate) {
                  router.push(registroHref(value));
                }
              }}
            />
          </label>
          {isToday ? (
            <span aria-hidden="true" />
          ) : (
            <Button asChild variant="ghost" size="icon" className="size-11 rounded-xl">
              <Link href={registroHref(nextDay)} prefetch={false} aria-label="Día siguiente">
                <ChevronRight className="size-5" />
              </Link>
            </Button>
          )}
        </motion.nav>

        {/* Row 1: Calorías card */}
        <motion.div variants={fadeUp} className="rounded-2xl bg-[#0e131e] p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Flame className="size-3.5 text-[var(--accent-bright)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7887a6]">Calorías</span>
            {target ? (
              <Button asChild type="button" variant="outline" size="sm" className="ml-auto h-6 gap-1 border-[rgba(255,255,255,0.1)] px-2 text-[10px]">
                <Link href="/configuracion">
                  <Settings2 className="size-3" />
                  <span>Editar objetivo</span>
                </Link>
              </Button>
            ) : null}
          </div>
          {target ? (
            <>
              <p className="mb-2 text-center text-[9px] font-semibold text-[#7887a6]">
                Objetivo: {target.kcal} kcal
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
                    value={Math.min(100, kcalPct)}
                    size={72}
                    strokeWidth={5}
                    progressColor={isOverTarget ? "var(--warning)" : "var(--accent-bright)"}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-display text-sm font-bold text-white">{kcalPct}%</span>
                      {totalKcal === 0 && (
                        <span className="text-[7px] leading-none text-[#7887a6]">Sin registro</span>
                      )}
                    </div>
                  </AnimatedProgressRing>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className={cn("font-display text-xl font-bold", isOverTarget ? "text-[var(--warning)]" : "text-white")}>
                    {isOverTarget ? "+" : null}
                    <AnimatedNumber value={Math.abs(remainingKcal)} />
                  </span>
                  <span className="text-center text-[9px] leading-tight text-[#7887a6]">
                    {isOverTarget ? "kcal de más" : "kcal restantes"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="grid justify-items-center gap-3 py-1 text-center">
              <p>
                <span className="font-display text-xl font-bold text-white">
                  <AnimatedNumber value={totalKcal} />
                </span>
                <span className="ml-1.5 text-xs text-[#7887a6]">kcal consumidas</span>
              </p>
              <p className="max-w-[18rem] text-sm text-[var(--foreground-muted)]">
                Configurá tu objetivo para ver cuánto te falta cada día.
              </p>
              <Button asChild variant="secondary" className="h-11 rounded-xl">
                <Link href="/configuracion">
                  <Settings2 className="size-4" />
                  Configurar objetivo
                </Link>
              </Button>
            </div>
          )}
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
                { Icon: Beef, label: MACRO_LABELS.protein, value: totalMacros.proteinG, target: target?.macros.proteinG ?? 0, color: MACRO_COLORS.protein, barDelay: 0 },
                { Icon: Wheat, label: MACRO_LABELS.carbs, value: totalMacros.carbsG, target: target?.macros.carbsG ?? 0, color: MACRO_COLORS.carbs, barDelay: 0.1 },
                { Icon: Droplet, label: MACRO_LABELS.fat, value: totalMacros.fatG, target: target?.macros.fatG ?? 0, color: MACRO_COLORS.fat, barDelay: 0.2 },
              ] as { Icon: LucideIcon; label: string; value: number; target: number; color: string; barDelay: number }[]
            ).map(({ Icon: MacroIcon, label, value, target: macroTarget, color, barDelay }) => {
              const pct = macroTarget > 0 ? Math.round((value / macroTarget) * 100) : 0;
              return (
                <div key={label} className="flex min-w-0 flex-col items-center px-1.5 first:pl-0 last:pr-0">
                  <p className="mb-1.5 truncate text-[10px] font-bold leading-none text-white">{label}</p>
                  <AnimatedProgressRing value={Math.min(100, pct)} size={42} strokeWidth={4} progressColor={color}>
                    <MacroIcon className="size-3" style={{ color }} />
                  </AnimatedProgressRing>
                  <div className="mt-1 w-full min-w-0 text-center">
                    <p className="mt-1 whitespace-nowrap text-[10px] font-bold leading-none text-white">
                      <AnimatedNumber value={Math.round(value)} />
                      {macroTarget > 0 ? ` / ${Math.round(macroTarget)}g` : " g"}
                    </p>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#1a2235]">
                      <AnimatedMacroBar pct={Math.min(100, pct)} color={color} delay={barDelay} />
                    </div>
                    {macroTarget > 0 ? (
                      <p className="mt-1 text-center text-[9px] font-semibold leading-none" style={{ color }}>
                        {pct}%
                      </p>
                    ) : null}
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

        {/* Row 3: Comidas del día */}
        <motion.div variants={fadeUp} className="rounded-2xl bg-[#0e131e] p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-display text-base font-semibold text-white">
                {isToday ? "Comidas de hoy" : "Comidas del día"}
              </h2>
              <p className="mt-0.5 truncate text-xs text-[#7887a6]">Cada comida suma a tu registro diario</p>
            </div>
            <Button type="button" size="sm" className="h-11 shrink-0 px-3 text-[10px]" onClick={() => setNewMealOpen(true)}>
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
                {isToday ? "Todavía no registraste comidas hoy." : "No registraste comidas este día."}{" "}
                <span className="text-white/50">
                  {isToday
                    ? "Agregá tu primera comida para empezar a sumar calorías y macros."
                    : "Podés cargar lo que comiste y se suma a ese día."}
                </span>
              </p>
            </motion.div>
          ) : (
            <div className="grid overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111722] sm:grid-cols-2 sm:gap-3 sm:border-0 sm:bg-transparent">
              {meals.map((meal, index) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  isFirst={index === 0}
                  isLast={index === meals.length - 1}
                  onMove={(direction) => handleMoveMeal(meal.id, direction)}
                  foods={foodList}
                  recipes={recipes}
                  frequentItems={frequentBySlot[frequentSlotOf(meal.type)]}
                  isEditing={editingMealId === meal.id}
                  onToggleEdit={() => setEditingMealId((current) => (current === meal.id ? null : meal.id))}
                  onDeleteMeal={() => handleDeleteMeal(meal.id)}
                  onUpdateMeal={(input) => handleUpdateMeal(meal.id, input)}
                  onAddItem={(input) => handleAddItem(meal.id, input)}
                  onDeleteItem={handleDeleteItem}
                  onUpdateItem={handleUpdateItem}
                  onFoodCreated={handleFoodCreated}
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
                {WEEK_LETTERS.map((letter, index) => {
                  const key = addDaysToDateKey(weekStart, index);
                  const logged = loggedSet.has(key);
                  const isTodayDot = key === todayKey;
                  const todayActive = isTodayDot && logged;
                  return (
                    <div key={key} className="flex flex-col items-center gap-1">
                      <span className={`text-[9px] font-medium ${isTodayDot ? "text-white" : "text-[#7887a6]"}`}>{letter}</span>
                      <motion.div
                        className={`size-4 rounded-full border-2 ${
                          logged
                            ? "border-orange-400 bg-orange-400"
                            : isTodayDot
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

  return (
    <>
      {/* Mobile (<1024): registro rediseñado (DESIGN.md §14). */}
      <div className="h-full lg:hidden">
        <section className="page-frame registro-frame relative isolate auto-rows-max content-start bg-[var(--background)]">
          <div className="flex flex-col">
            <div aria-hidden="true" className="home-safe-top" />
            <RegistroMobile
              meals={meals}
              onMealsChange={setMeals}
              foods={foodList}
              onFoodCreated={handleFoodCreated}
              recipes={recipes}
              frequentBySlot={frequentBySlot}
              target={target}
              loggedDates={loggedDates}
              logDate={logDate}
              todayKey={todayKey}
              deepLink={{ mealId: initialMealId, mealType: initialMealType, food: initialFoodItem, recipe: initialRecipeItem }}
              sheetsEnabled={isDesktop === false}
            />
          </div>
        </section>
      </div>

      {/* Desktop (≥1024): cards de siempre. */}
      <div className="hidden lg:contents">
        <section className="page-frame content-start bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.15),transparent_31%),linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">
          {desktop}
        </section>
      </div>
    </>
  );
}

function MealCard({
  meal,
  isFirst,
  isLast,
  onMove,
  foods,
  recipes,
  frequentItems,
  isEditing,
  onToggleEdit,
  onDeleteMeal,
  onUpdateMeal,
  onAddItem,
  onDeleteItem,
  onUpdateItem,
  onFoodCreated,
}: {
  meal: MealGroup;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: "up" | "down") => Promise<void>;
  foods: Food[];
  recipes: RecipeOption[];
  frequentItems: FrequentItem[];
  isEditing: boolean;
  onToggleEdit: () => void;
  onDeleteMeal: () => Promise<void>;
  onUpdateMeal: (input: { name?: string; type?: MealType }) => Promise<void>;
  onAddItem: (input: MealItemInput) => Promise<boolean>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onUpdateItem: (itemId: string, measure: FoodMeasure, quantity: number) => Promise<void>;
  onFoodCreated: (food: Food) => void;
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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeletingMeal, setIsDeletingMeal] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  async function handleMove(direction: "up" | "down") {
    setIsMoving(true);

    try {
      await onMove(direction);
    } finally {
      setIsMoving(false);
    }
  }

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
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo actualizar la comida.");
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
      toast.success("Quitado de la comida.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo quitar de la comida.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleStartEditItem(itemId: string, measure: FoodMeasure, quantity: number) {
    setEditingItemId(itemId);
    setEditMeasure(measure);
    setEditQuantity(formatQuantity(quantity));
  }

  async function handleSaveItem(item: MealLogItem) {
    const parsedQuantity = parseQuantity(editQuantity);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      toast.error("Ingresá una cantidad válida.");
      return;
    }

    setIsSavingItem(true);

    try {
      await onUpdateItem(item.id, editMeasure, parsedQuantity);
      setEditingItemId(null);
      toast.success("Cantidad actualizada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la cantidad.");
    } finally {
      setIsSavingItem(false);
    }
  }

  async function handleConfirmDelete() {
    setIsDeletingMeal(true);

    try {
      await onDeleteMeal();
    } finally {
      setIsDeletingMeal(false);
      setIsConfirmingDelete(false);
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
        const itemFood = item.foodId ? foods.find((food) => food.id === item.foodId) : undefined;
        const itemGramsPerUnit = item.kind === "recipe" ? item.servingG : itemFood ? getFoodGramsPerUnit(itemFood) : null;
        const canChooseUnit = itemGramsPerUnit != null;
        const unitOptionLabel = item.kind === "recipe" ? "Porciones" : "Unidades";
        const amountLabel = item.category === "drink" ? "Mililitros" : "Gramos";
        const isEditingItem = editingItemId === item.id;

        return (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{item.name}</p>
              {!isEditingItem && (
                <p className="text-xs text-[var(--foreground-muted)]">
                  {formatItemAmount(item)} · {item.kcal} kcal
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
                      const parsedQuantity = parseQuantity(editQuantity);
                      const nextQuantity =
                        Number.isFinite(parsedQuantity) && parsedQuantity > 0 && itemGramsPerUnit
                          ? nextMeasure === "unit"
                            ? formatQuantity(parsedQuantity / itemGramsPerUnit)
                            : formatQuantity(parsedQuantity * itemGramsPerUnit)
                          : editQuantity;
                      setEditMeasure(nextMeasure);
                      setEditQuantity(nextQuantity);
                    }}
                  >
                    <SelectTrigger aria-label="Medida" className={cn(compactControlClass, "w-26 sm:w-28")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">{amountLabel}</SelectItem>
                      <SelectItem value="unit">{unitOptionLabel}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Input
                  inputMode="decimal"
                  aria-label={editMeasure === "unit" ? unitOptionLabel : amountLabel}
                  value={editQuantity}
                  onChange={(event) => setEditQuantity(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleSaveItem(item);
                    }
                  }}
                  className={cn(compactControlClass, "w-16 sm:w-20")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11 rounded-lg"
                  onClick={() => handleSaveItem(item)}
                  disabled={isSavingItem}
                  title="Guardar cantidad"
                  aria-label="Guardar cantidad"
                >
                  {isSavingItem ? <LoadingDots /> : <Check className="size-4" />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 rounded-lg"
                  onClick={() => setEditingItemId(null)}
                  aria-label="Cancelar edición de cantidad"
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}
            {isEditing && !isEditingItem && (
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11"
                  aria-label={`Editar cantidad de ${item.name}`}
                  onClick={() => handleStartEditItem(item.id, item.measure, item.quantity)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11"
                  aria-label={`Quitar ${item.name}`}
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
        className="size-11"
        onClick={() => handleMove("up")}
        disabled={isFirst || isMoving}
        title="Subir comida"
        aria-label={`Subir ${meal.name}`}
      >
        <ArrowUp className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11"
        onClick={() => handleMove("down")}
        disabled={isLast || isMoving}
        title="Bajar comida"
        aria-label={`Bajar ${meal.name}`}
      >
        <ArrowDown className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11"
        onClick={handleToggleEdit}
        title={isEditing ? "Terminar edición" : "Editar comida"}
        aria-label={isEditing ? "Terminar edición" : "Editar comida"}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 hover:text-red-400"
        onClick={() => setIsConfirmingDelete(true)}
        title="Eliminar comida"
        aria-label="Eliminar comida"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );

  const macroChips = (
    <div className="flex flex-1 flex-wrap gap-1.5">
      <MacroChip label="P" value={Math.round(meal.macros.proteinG)} color={MACRO_COLORS.protein} />
      <MacroChip label="C" value={Math.round(meal.macros.carbsG)} color={MACRO_COLORS.carbs} />
      <MacroChip label="G" value={Math.round(meal.macros.fatG)} color={MACRO_COLORS.fat} />
    </div>
  );

  const compactActionButtons = (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 rounded-lg"
        onClick={handleToggleEdit}
        title="Editar comida"
        aria-label="Editar comida"
      >
        <Pencil className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 rounded-lg hover:text-red-400"
        onClick={() => setIsConfirmingDelete(true)}
        title="Eliminar comida"
        aria-label="Eliminar comida"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );

  const deleteConfirmation = isConfirmingDelete ? (
    <div
      role="group"
      aria-label="Confirmar eliminación"
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[rgba(244,63,94,0.35)] bg-[rgba(244,63,94,0.08)] px-3 py-2"
    >
      <p className="min-w-0 text-sm text-[var(--foreground)]">¿Eliminar “{meal.name}” y sus alimentos?</p>
      <div className="flex gap-1.5">
        <Button type="button" variant="ghost" className="h-11" onClick={() => setIsConfirmingDelete(false)} disabled={isDeletingMeal}>
          Cancelar
        </Button>
        <Button
          type="button"
          className="h-11 bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
          onClick={handleConfirmDelete}
          disabled={isDeletingMeal}
        >
          {isDeletingMeal ? <LoadingDots /> : <Trash2 className="size-4" />}
          Eliminar
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <div
      id={`meal-${meal.id}`}
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
                <SelectTrigger aria-label="Tipo de comida" className={compactControlClass}>
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
              aria-label="Nombre de la comida"
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

          <FoodPicker
            foods={foods}
            recipes={recipes}
            frequentItems={frequentItems}
            actionLabel="Agregar a la comida"
            onAdd={onAddItem}
            onFoodCreated={onFoodCreated}
          />

          {deleteConfirmation}

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

          {deleteConfirmation}

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

function toMealItemInput(item: DraftItem): MealItemInput {
  return item.kind === "recipe"
    ? { kind: "recipe", recipeId: item.recipeId, measure: item.measure, quantity: item.quantity }
    : { kind: "food", foodId: item.foodId, measure: item.measure, quantity: item.quantity };
}

function resolveOption(item: MealItemInput, foods: Food[], recipes: RecipeOption[]): PickerOption | null {
  if (item.kind === "recipe") {
    const recipe = recipes.find((candidate) => candidate.id === item.recipeId);
    return recipe ? { kind: "recipe", id: recipe.id, name: recipe.name, recipe } : null;
  }

  const food = foods.find((candidate) => candidate.id === item.foodId);
  return food ? { kind: "food", id: food.id, name: food.name, food } : null;
}

function formatDraftAmount(item: MealItemInput, option: PickerOption) {
  if (item.kind === "recipe" && item.measure === "unit") {
    return formatServings(item.quantity);
  }

  if (item.measure === "unit") {
    return `${formatQuantity(item.quantity)} u`;
  }

  return `${formatQuantity(item.quantity)} ${option.kind === "food" ? getAmountUnitLabel(option.food.category) : "g"}`;
}

function formatMealFoods(meal: MealGroup) {
  if (meal.items.length === 0) {
    return "Sin alimentos";
  }

  const names = meal.items.slice(0, 3).map((item) => item.name);
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

function dateKeyToDate(key: string) {
  return new Date(`${key}T12:00:00Z`);
}

function formatDayTitle(logDate: string, todayKey: string) {
  if (logDate === todayKey) {
    return "Hoy";
  }

  if (logDate === addDaysToDateKey(todayKey, -1)) {
    return "Ayer";
  }

  const weekday = WEEKDAY_FORMATTER.format(dateKeyToDate(logDate));
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

function formatDayMonth(logDate: string) {
  return DAY_MONTH_FORMATTER.format(dateKeyToDate(logDate));
}
