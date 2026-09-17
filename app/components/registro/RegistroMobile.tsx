"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { AddFoodSheet } from "@/app/components/registro/AddFoodSheet";
import { BudgetBlock } from "@/app/components/registro/BudgetBlock";
import { DayClosedPanel } from "@/app/components/registro/DayClosedPanel";
import { DayPickerSheet } from "@/app/components/registro/DayPickerSheet";
import { DaySheet } from "@/app/components/registro/DaySheet";
import { DiaryHeader } from "@/app/components/registro/DiaryHeader";
import { serverDiaryActions, type DiaryActions } from "@/app/components/registro/diary-actions";
import type { QuickRow } from "@/app/components/registro/FrequentRows";
import { ItemSheet } from "@/app/components/registro/ItemSheet";
import { MealMenuSheet } from "@/app/components/registro/MealMenuSheet";
import { MealPanel } from "@/app/components/registro/MealPanel";
import { MealTabs } from "@/app/components/registro/MealTabs";
import { useDiaryActions } from "@/app/components/registro/useDiaryActions";
import { useDiaryPager } from "@/app/components/registro/useDiaryPager";
import {
  formatAmount,
  getFoodGramsPerUnit,
  optionCategory,
  optionKey,
  previewNutrition,
  resolveDefaultAmount,
  toMealItemInput,
  type Amount,
  type PickerOption,
} from "@/app/lib/meal-amounts";
import {
  SUMMARY_KEY,
  buildDiaryDay,
  calculateStreak,
  formatDayHeader,
  formatDayReference,
  formatEmptyMeta,
  formatMealMeta,
  resolveBudget,
  resolveInitialDiary,
  sumDay,
  targetKey,
  targetLabel,
  targetMealType,
  withCurrentDay,
  type AddTarget,
  type DiaryDeepLink,
  type DiaryTab,
} from "@/app/lib/meal-diary";
import type { MealGroup, MealLogItem } from "@/app/lib/meal-logs";
import {
  FREQUENT_SLOTS,
  MEAL_TYPE_LABELS,
  frequentSlotOf,
  type Food,
  type FrequentItem,
  type FrequentItemsBySlot,
  type FrequentSlot,
  type Macros,
  type MealType,
  type RecipeOption,
} from "@/app/lib/nutrition-types";

const ID = "registro";
const QUICK_LIMIT = 5;
const ADDED_FEEDBACK_MS = 1600;
// Un sheet que cierra tarda 260 ms (DESIGN.md §5): el siguiente se abre después.
const SHEET_SWAP_MS = 320;
const NO_CREATED = new Map<string, string>();
const DEFAULT_LABELS: string[] = Object.values(MEAL_TYPE_LABELS);

type ItemSheetState = { open: boolean; meal: MealGroup | null; item: MealLogItem | null; session: number };

function registroHref(dateKey: string, todayKey: string) {
  return dateKey === todayKey ? "/nutricion/registro" : `/nutricion/registro?fecha=${dateKey}`;
}

function targetFor(tab: DiaryTab<MealGroup>): AddTarget {
  return tab.meal ? { kind: "meal", mealId: tab.meal.id } : { kind: "slot", type: tab.type };
}

/** "Agregar a merienda", "Agregar a Post entreno". */
function addLabelFor(label: string) {
  return `Agregar a ${DEFAULT_LABELS.some((name) => label.startsWith(name)) ? label.toLowerCase() : label}`;
}

/**
 * Registro de comidas mobile (<1024, DESIGN.md §14): presupuesto con medidor y anillos, pestañas por
 * comida con un panel que se desliza y sheets para agregar, editar y moverse de día.
 */
export function RegistroMobile({
  meals,
  onMealsChange,
  foods,
  onFoodCreated,
  recipes,
  frequentBySlot,
  target,
  loggedDates,
  logDate,
  todayKey,
  deepLink,
  sheetsEnabled,
  actions = serverDiaryActions,
}: {
  meals: MealGroup[];
  onMealsChange: (meals: MealGroup[]) => void;
  foods: Food[];
  onFoodCreated: (food: Food) => void;
  recipes: RecipeOption[];
  frequentBySlot: FrequentItemsBySlot;
  target: { kcal: number; macros: Macros } | null;
  loggedDates: string[];
  logDate: string;
  todayKey: string;
  deepLink: DiaryDeepLink;
  /** false en desktop y mientras hidrata: ningún sheet mobile se abre. */
  sheetsEnabled: boolean;
  actions?: DiaryActions;
}) {
  const router = useRouter();
  const [navigating, startNavigation] = useTransition();
  const isToday = logDate === todayKey;

  const day = buildDiaryDay(meals);
  const budget = resolveBudget(target, sumDay(meals));
  const hasItems = meals.some((meal) => meal.items.length > 0);
  const logged = withCurrentDay(loggedDates, logDate, hasItems);
  const streak = calculateStreak(logged, todayKey);
  const header = formatDayHeader(logDate, todayKey);
  const dayReference = formatDayReference(logDate, todayKey);
  const remainingKcal = budget.state === "no_profile" ? null : budget.remainingKcal;

  const [initial] = useState(() => resolveInitialDiary(meals, deepLink));
  // Alimento (desde /alimentos) o receta (desde /recetas): el primer "Agregar" abre directo en su cantidad.
  const [linkedItem] = useState((): { option: PickerOption; amount: Amount } | null => {
    const foodLink = deepLink.food;
    const food = foodLink ? foods.find((candidate) => candidate.id === foodLink.foodId) : undefined;
    if (foodLink && food) {
      return {
        option: { kind: "food", id: food.id, name: food.name, food },
        amount: { measure: foodLink.measure, quantity: foodLink.quantity },
      };
    }

    const recipeLink = deepLink.recipe;
    const recipe = recipeLink ? recipes.find((candidate) => candidate.id === recipeLink.recipeId) : undefined;
    if (recipeLink && recipe) {
      return {
        option: { kind: "recipe", id: recipe.id, name: recipe.name, recipe },
        amount: { measure: recipeLink.measure, quantity: recipeLink.quantity },
      };
    }

    return null;
  });
  const { pagerRef, onScroll, height, mounted, selectedKey, goTo, follow } = useDiaryPager({
    panelKeys: day.panelKeys,
    initialKey: initial.selectedKey,
    nextKey: day.nextKey,
    typeOfKey: (key) => day.tabs.find((tab) => tab.key === key)?.type ?? null,
  });
  const diary = useDiaryActions({ logDate, meals, onMealsChange, actions, onMealCreated: follow });

  // Frecuentes tomados al entrar: no se reordenan mientras se agregan.
  const [frequentSnapshot] = useState(frequentBySlot);
  const [lastAmounts, setLastAmounts] = useState<ReadonlyMap<string, Amount>>(new Map());
  const [quickMeals, setQuickMeals] = useState<ReadonlySet<string>>(new Set());
  const [quickPending, setQuickPending] = useState<ReadonlySet<string>>(new Set());
  const [addedKeys, setAddedKeys] = useState<ReadonlySet<string>>(new Set());
  const timers = useRef(new Set<number>());
  const focusAfterCreate = useRef<{ mealId: string; quickKey: string } | null>(null);
  const refocusTab = useRef(false);

  const [addSheet, setAddSheet] = useState(() => ({
    open: initial.addTarget !== null,
    target: initial.addTarget,
    session: 0,
  }));
  const [itemSheet, setItemSheet] = useState<ItemSheetState>({ open: false, meal: null, item: null, session: 0 });
  const [menuSheet, setMenuSheet] = useState<{ open: boolean; mealId: string | null; session: number }>({
    open: false,
    mealId: null,
    session: 0,
  });
  const [daySheet, setDaySheet] = useState<{ open: boolean; step: "list" | "other"; session: number }>({
    open: false,
    step: "list",
    session: 0,
  });
  const [pickerSheet, setPickerSheet] = useState({ open: false, session: 0 });

  // Al pasar a desktop se cierran los sheets mobile.
  const [wasEnabled, setWasEnabled] = useState(sheetsEnabled);
  if (wasEnabled !== sheetsEnabled) {
    setWasEnabled(sheetsEnabled);
    if (wasEnabled && !sheetsEnabled) {
      setAddSheet((current) => ({ ...current, open: false }));
      setItemSheet((current) => ({ ...current, open: false }));
      setMenuSheet((current) => ({ ...current, open: false }));
      setDaySheet((current) => ({ ...current, open: false }));
      setPickerSheet((current) => ({ ...current, open: false }));
    }
  }

  // Recargar no vuelve a abrir el alimento o la receta del enlace.
  const hasLinkedItem = Boolean(deepLink.food || deepLink.recipe);
  useEffect(() => {
    if (sheetsEnabled && hasLinkedItem) window.history.replaceState(null, "", registroHref(logDate, todayKey));
  }, [sheetsEnabled, hasLinkedItem, logDate, todayKey]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  // Después de crear una comida con "+", el foco sigue en el mismo "+" del panel nuevo.
  useEffect(() => {
    const request = focusAfterCreate.current;
    if (!request) return;
    const button = document.querySelector<HTMLElement>(
      `#${ID}-panel-${CSS.escape(request.mealId)} [data-quick-key="${CSS.escape(request.quickKey)}"]`,
    );
    if (button) {
      focusAfterCreate.current = null;
      button.focus({ preventScroll: true });
    }
  }, [meals, selectedKey]);

  const options = useMemo<PickerOption[]>(
    () => [
      ...foods.map((food) => ({ kind: "food" as const, id: food.id, name: food.name, food })),
      ...recipes.map((recipe) => ({ kind: "recipe" as const, id: recipe.id, name: recipe.name, recipe })),
    ],
    [foods, recipes],
  );
  // Cada grupo de comidas tiene sus frecuentes: lo de desayuno no aparece en merienda.
  const frequent = useMemo(() => {
    const byOptionKey = new Map(options.map((option) => [optionKey(option), option]));
    const view = {} as Record<FrequentSlot, { byKey: ReadonlyMap<string, FrequentItem>; options: PickerOption[] }>;
    for (const slot of FREQUENT_SLOTS) {
      const items = frequentSnapshot[slot];
      view[slot] = {
        byKey: new Map(items.map((item) => [optionKey(item), item])),
        options: items.flatMap((item) => {
          const option = byOptionKey.get(optionKey(item));
          return option ? [option] : [];
        }),
      };
    }
    return view;
  }, [frequentSnapshot, options]);

  function quickRowsFor(type: MealType): QuickRow[] {
    const slot = frequent[frequentSlotOf(type)];
    return slot.options.slice(0, QUICK_LIMIT).map((option) => {
      const key = optionKey(option);
      const amount = lastAmounts.get(key) ?? resolveDefaultAmount(option, slot.byKey.get(key));
      return {
        key,
        option,
        amount,
        amountLabel: formatAmount(amount, { kind: option.kind, category: optionCategory(option) }, ","),
        kcal: previewNutrition(option, amount.measure, amount.quantity).kcal,
      };
    });
  }

  function rememberAmount(key: string, amount: Amount) {
    setLastAmounts((current) => new Map(current).set(key, amount));
  }

  function later(task: () => void, delay: number) {
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      task();
    }, delay);
    timers.current.add(timer);
  }

  function markAdded(key: string) {
    setAddedKeys((current) => new Set(current).add(key));
    later(
      () =>
        setAddedKeys((current) => {
          const next = new Set(current);
          next.delete(key);
          return next;
        }),
      ADDED_FEEDBACK_MS,
    );
  }

  async function quickAdd(tab: DiaryTab<MealGroup>, row: QuickRow) {
    setQuickPending((current) => new Set(current).add(row.key));

    try {
      const result = await diary.addItem(targetFor(tab), toMealItemInput(row.option, row.amount));
      if (!result) return;

      rememberAmount(row.key, row.amount);
      setQuickMeals((current) => new Set(current).add(result.mealId));
      markAdded(row.key);
      if (result.createdMeal) focusAfterCreate.current = { mealId: result.mealId, quickKey: row.key };
      diary.toastAdded(`${row.option.name} · ${row.amountLabel} en ${tab.label}`, result);
    } finally {
      setQuickPending((current) => {
        const next = new Set(current);
        next.delete(row.key);
        return next;
      });
    }
  }

  function openAdd(addTarget: AddTarget) {
    setAddSheet((current) => ({ open: true, target: addTarget, session: current.session + 1 }));
  }

  function openItem(meal: MealGroup, item: MealLogItem) {
    setItemSheet((current) => ({ open: true, meal, item, session: current.session + 1 }));
  }

  function openMenu(meal: MealGroup) {
    setMenuSheet((current) => ({ open: true, mealId: meal.id, session: current.session + 1 }));
  }

  function navigateTo(dateKey: string) {
    setPickerSheet((current) => ({ ...current, open: false }));
    startNavigation(() => router.push(registroHref(dateKey, todayKey)));
  }

  function selectedTabButton() {
    if (!refocusTab.current) return null;
    refocusTab.current = false;
    return document.getElementById(`${ID}-tab-${selectedKey}`) ?? document.getElementById(`${ID}-title-${selectedKey}`);
  }

  const sheetItem = itemSheet.item;
  const sheetMeal = itemSheet.meal;
  const menuMeal = menuSheet.mealId ? (meals.find((meal) => meal.id === menuSheet.mealId) ?? null) : null;
  const menuIndex = menuMeal ? meals.indexOf(menuMeal) : -1;
  const itemFood = sheetItem?.foodId ? foods.find((food) => food.id === sheetItem.foodId) : undefined;
  const itemGramsPerUnit =
    sheetItem?.kind === "recipe" ? sheetItem.servingG : itemFood ? getFoodGramsPerUnit(itemFood) : null;

  const panels = day.panelKeys.map((key) => {
    if (key === SUMMARY_KEY) {
      return {
        key,
        node: (
          <DayClosedPanel
            idPrefix={ID}
            tabs={day.tabs}
            totalKcal={budget.consumedKcal}
            onSelect={goTo}
            onOtherMeal={() => setDaySheet((current) => ({ open: true, step: "other", session: current.session + 1 }))}
          />
        ),
      };
    }

    const tab = day.tabs.find((candidate) => candidate.key === key) as DiaryTab<MealGroup>;
    const meal = tab.meal;
    const empty = !meal || meal.items.length === 0;
    const addTarget = targetFor(tab);

    return {
      key,
      node: (
        <MealPanel
          idPrefix={ID}
          tab={tab}
          meta={
            empty
              ? formatEmptyMeta({
                  logDate,
                  todayKey,
                  dayEmpty: !hasItems,
                  consumedKcal: budget.consumedKcal,
                  targetKcal: budget.targetKcal,
                })
              : formatMealMeta(meal)
          }
          addLabel={addLabelFor(tab.label)}
          primary={tab.status === "next"}
          addPending={diary.pending.has(targetKey(addTarget))}
          quick={
            empty || quickMeals.has(meal.id)
              ? { rows: quickRowsFor(tab.type), pendingKeys: quickPending, addedKeys }
              : null
          }
          onAdd={() => openAdd(addTarget)}
          onSearch={() => openAdd(addTarget)}
          onQuickAdd={(row) => void quickAdd(tab, row)}
          onOpenItem={(item) => {
            if (meal) openItem(meal, item);
          }}
          onOpenMenu={() => {
            if (meal) openMenu(meal);
          }}
        />
      ),
    };
  });

  const addFrequent = addSheet.target ? frequent[frequentSlotOf(targetMealType(addSheet.target, meals))] : null;

  return (
    <div className="grid gap-5 [@media(max-height:700px)]:gap-3">
      <DiaryHeader
        title={header.title}
        caption={header.caption}
        streak={streak}
        isToday={isToday}
        navigating={navigating}
        onOpenPicker={() => setPickerSheet((current) => ({ open: true, session: current.session + 1 }))}
        onOpenDay={() => setDaySheet((current) => ({ open: true, step: "list", session: current.session + 1 }))}
      />

      <BudgetBlock budget={budget} dayReference={dayReference} />

      <div className="grid gap-4 [@media(max-height:700px)]:gap-3">
        <MealTabs
          tabs={day.tabs}
          selectedKey={selectedKey === SUMMARY_KEY ? null : selectedKey}
          onSelect={goTo}
          idPrefix={ID}
        />

        <div
          ref={pagerRef}
          onScroll={onScroll}
          style={height ? { height: height } : undefined}
          className="-mx-4 flex snap-x snap-mandatory items-start overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {panels.map(({ key, node }) =>
            mounted || key === selectedKey ? (
              <div
                key={key}
                data-panel-key={key}
                id={`${ID}-panel-${key}`}
                role="tabpanel"
                aria-labelledby={key === SUMMARY_KEY ? undefined : `${ID}-tab-${key}`}
                aria-label={key === SUMMARY_KEY ? "Resumen del día" : undefined}
                aria-hidden={mounted ? key !== selectedKey : undefined}
                inert={mounted && key !== selectedKey ? true : undefined}
                className="relative w-full shrink-0 snap-start px-4"
              >
                {node}
              </div>
            ) : null,
          )}
        </div>
      </div>

      {addSheet.target && addFrequent ? (
        <AddFoodSheet
          key={`agregar-${addSheet.session}`}
          open={sheetsEnabled && addSheet.open}
          onOpenChange={(open) => setAddSheet((current) => ({ ...current, open }))}
          targetLabel={targetLabel(addSheet.target, meals, NO_CREATED)}
          isToday={isToday}
          options={options}
          frequentOptions={addFrequent.options}
          frequentByKey={addFrequent.byKey}
          lastAmounts={lastAmounts}
          remainingKcal={remainingKcal}
          initialItem={addSheet.session === 0 ? linkedItem : null}
          onAdd={async (option, amount) => {
            const addTarget = addSheet.target;
            if (!addTarget) return null;
            const result = await diary.addItem(addTarget, toMealItemInput(option, amount));
            if (result) rememberAmount(optionKey(option), amount);
            return result;
          }}
          onUndo={diary.undo}
          onFoodCreated={onFoodCreated}
        />
      ) : null}

      {sheetItem && sheetMeal ? (
        <ItemSheet
          key={`item-${itemSheet.session}`}
          open={sheetsEnabled && itemSheet.open}
          onOpenChange={(open) => setItemSheet((current) => ({ ...current, open }))}
          item={sheetItem}
          mealLabel={sheetMeal.name}
          onlyItem={(meals.find((meal) => meal.id === sheetMeal.id)?.items.length ?? 0) <= 1}
          gramsPerUnit={itemGramsPerUnit}
          fallbackFocus={selectedTabButton}
          onSave={(measure, quantity) => diary.updateItem(sheetItem.id, measure, quantity)}
          onRemove={async () => {
            const meal = meals.find((candidate) => candidate.id === sheetMeal.id);
            if (!meal) return false;
            const removed = await diary.removeItem(sheetItem, meal);
            if (removed) refocusTab.current = true;
            return removed;
          }}
        />
      ) : null}

      {menuMeal ? (
        <MealMenuSheet
          key={`menu-${menuSheet.session}`}
          open={sheetsEnabled && menuSheet.open}
          onOpenChange={(open) => setMenuSheet((current) => ({ ...current, open }))}
          meal={menuMeal}
          isFirst={menuIndex <= 0}
          isLast={menuIndex === meals.length - 1}
          fallbackFocus={selectedTabButton}
          onRename={(name) => diary.renameMeal(menuMeal.id, name)}
          onChangeType={(type) => diary.changeMealType(menuMeal, type)}
          onMove={(direction) => diary.moveMeal(menuMeal.id, direction)}
          onDelete={async () => {
            const deleted = await diary.deleteMeal(menuMeal.id);
            if (deleted) refocusTab.current = true;
            return deleted;
          }}
        />
      ) : null}

      <DaySheet
        key={`dia-${daySheet.session}`}
        open={sheetsEnabled && daySheet.open}
        onOpenChange={(open) => setDaySheet((current) => ({ ...current, open }))}
        initialStep={daySheet.step}
        tabs={day.tabs}
        consumedKcal={budget.consumedKcal}
        targetKcal={budget.targetKcal}
        onSelect={(key) => {
          setDaySheet((current) => ({ ...current, open: false }));
          goTo(key);
        }}
        onOtherMeal={({ name, type }) => {
          const addTarget: AddTarget = { kind: "new", token: crypto.randomUUID(), name, type };
          setDaySheet((current) => ({ ...current, open: false }));
          later(() => openAdd(addTarget), SHEET_SWAP_MS);
        }}
      />

      <DayPickerSheet
        key={`fecha-${pickerSheet.session}`}
        open={sheetsEnabled && pickerSheet.open}
        onOpenChange={(open) => setPickerSheet((current) => ({ ...current, open }))}
        logDate={logDate}
        todayKey={todayKey}
        loggedDates={logged}
        onNavigate={navigateTo}
      />
    </div>
  );
}
