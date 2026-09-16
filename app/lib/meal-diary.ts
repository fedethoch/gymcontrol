// Registro de comidas mobile (DESIGN.md §14): pestañas, presupuesto del día, selección y deshacer.
// Sin React ni servidor: se testea con `node --test`.
import { addDaysToDateKey, getMondayFirstWeekdayIndex } from "@/app/lib/local-date";
import { DEFAULT_DAY_MEAL_TYPES, buildDayMealRows, suggestAfterMealId } from "@/app/lib/meal-order";
import { MEAL_TYPE_LABELS, type Macros, type MealType } from "@/app/lib/nutrition-types";

export type DiaryItem = {
  id: string;
  name: string;
  kind: "food" | "recipe";
  foodId: string | null;
  recipeId: string | null;
  kcal: number;
};

/** Lo que el registro necesita de una comida (`MealGroup` lo cumple). */
export type DiaryMeal = {
  id: string;
  name: string;
  type: MealType;
  kcal: number;
  macros: Macros;
  items: DiaryItem[];
};

/** Panel "Día cerrado": va primero cuando no queda ninguna comida del día por registrar. */
export const SUMMARY_KEY = "resumen";

/** Hasta 5% por debajo del objetivo cuenta como "en objetivo". */
export const ON_TARGET_RATIO = 0.05;

// ---------------------------------------------------------------------------------------------
// Pestañas

/**
 * logged = tiene alimentos · next = la primera comida del día sin registrar ("Sigue") ·
 * pending = otra comida del día sin registrar · empty = snack o comida propia sin alimentos.
 */
export type DiaryTabStatus = "logged" | "next" | "pending" | "empty";

export type DiaryTab<M extends DiaryMeal = DiaryMeal> = {
  key: string;
  type: MealType;
  label: string;
  meal: M | null;
  status: DiaryTabStatus;
  kcal: number | null;
};

export type DiaryDay<M extends DiaryMeal = DiaryMeal> = {
  tabs: DiaryTab<M>[];
  nextKey: string | null;
  closed: boolean;
  panelKeys: string[];
};

/** Desayuno, almuerzo, merienda y cena cuentan como pendientes mientras no tengan alimentos. */
export function isPendingRow(type: string, meal: { items: unknown[] } | null) {
  return (DEFAULT_DAY_MEAL_TYPES as readonly string[]).includes(type) && (meal === null || meal.items.length === 0);
}

export function buildDiaryDay<M extends DiaryMeal>(meals: M[]): DiaryDay<M> {
  const seen = new Map<string, number>();
  let nextKey: string | null = null;

  const tabs = buildDayMealRows(meals).map((row): DiaryTab<M> => {
    const meal = row.kind === "meal" ? row.meal : null;
    const type = row.type as MealType;
    const baseLabel = meal ? meal.name : MEAL_TYPE_LABELS[type];
    const count = (seen.get(baseLabel) ?? 0) + 1;
    seen.set(baseLabel, count);

    const hasItems = meal !== null && meal.items.length > 0;
    let status: DiaryTabStatus = hasItems ? "logged" : "empty";

    if (!hasItems && isPendingRow(type, meal)) {
      status = nextKey === null ? "next" : "pending";
      nextKey ??= row.key;
    }

    return {
      key: row.key,
      type,
      label: count > 1 ? `${baseLabel} ${count}` : baseLabel,
      meal,
      status,
      kcal: hasItems ? Math.round(meal.kcal) : null,
    };
  });

  const closed = nextKey === null;
  const keys = tabs.map((tab) => tab.key);

  return { tabs, nextKey, closed, panelKeys: closed ? [SUMMARY_KEY, ...keys] : keys };
}

// ---------------------------------------------------------------------------------------------
// Presupuesto

export type BudgetState = "no_profile" | "under" | "on_target" | "over";

export type MacroKey = "protein" | "carbs" | "fat";

export type MacroBudget = {
  key: MacroKey;
  consumed: number;
  target: number;
  /** Negativo = de más. */
  remaining: number;
  over: boolean;
  /** 0–1 para el anillo. */
  progress: number;
};

export type Budget = {
  state: BudgetState;
  consumedKcal: number;
  targetKcal: number | null;
  /** Negativo = por encima del objetivo. */
  remainingKcal: number;
  progress: number;
  macros: MacroBudget[] | null;
};

export function sumDay(meals: Array<{ kcal: number; macros: Macros }>) {
  return meals.reduce(
    (total, meal) => ({
      kcal: total.kcal + meal.kcal,
      macros: {
        proteinG: total.macros.proteinG + meal.macros.proteinG,
        carbsG: total.macros.carbsG + meal.macros.carbsG,
        fatG: total.macros.fatG + meal.macros.fatG,
      },
    }),
    { kcal: 0, macros: { proteinG: 0, carbsG: 0, fatG: 0 } as Macros },
  );
}

export function resolveBudget(
  target: { kcal: number; macros: Macros } | null,
  consumed: { kcal: number; macros: Macros },
): Budget {
  const consumedKcal = Math.round(consumed.kcal);

  if (!target || target.kcal <= 0) {
    return { state: "no_profile", consumedKcal, targetKcal: null, remainingKcal: 0, progress: 0, macros: null };
  }

  const targetKcal = Math.round(target.kcal);
  const remainingKcal = targetKcal - consumedKcal;
  const state: BudgetState =
    remainingKcal < 0 ? "over" : remainingKcal <= targetKcal * ON_TARGET_RATIO ? "on_target" : "under";

  const pairs: Array<[MacroKey, number, number]> = [
    ["protein", consumed.macros.proteinG, target.macros.proteinG],
    ["carbs", consumed.macros.carbsG, target.macros.carbsG],
    ["fat", consumed.macros.fatG, target.macros.fatG],
  ];

  return {
    state,
    consumedKcal,
    targetKcal,
    remainingKcal,
    progress: Math.min(1, consumedKcal / targetKcal),
    macros: pairs.map(([key, rawConsumed, rawTarget]) => {
      const macroConsumed = Math.round(rawConsumed);
      const macroTarget = Math.round(rawTarget);
      const remaining = macroTarget - macroConsumed;

      return {
        key,
        consumed: macroConsumed,
        target: macroTarget,
        remaining,
        over: remaining < 0,
        progress: macroTarget > 0 ? Math.min(1, macroConsumed / macroTarget) : 0,
      };
    }),
  };
}

// ---------------------------------------------------------------------------------------------
// Dónde se agrega

/** Lugar de una comida nueva: la misma regla que "Ubicar después de" del registro de escritorio. */
export function resolveAfterMealId(meals: Array<{ id: string; type: string }>, type: string) {
  if (meals.length === 0) return undefined;
  const suggested = suggestAfterMealId(meals, type);
  if (suggested === null) return null;
  return suggested ?? meals[meals.length - 1].id;
}

/**
 * meal = comida que ya existe · slot = lugar vacío de una comida del día (se crea con el primer
 * alimento) · new = comida nueva con nombre propio ("Otra comida").
 */
export type AddTarget =
  | { kind: "meal"; mealId: string }
  | { kind: "slot"; type: MealType }
  | { kind: "new"; token: string; name: string; type: MealType };

export function targetKey(target: AddTarget) {
  if (target.kind === "meal") return `meal:${target.mealId}`;
  if (target.kind === "slot") return `slot:${target.type}`;
  return `new:${target.token}`;
}

/** Nombre y tipo con los que se crea la comida de un destino que todavía no existe. */
export function targetMealSpec(target: Exclude<AddTarget, { kind: "meal" }>) {
  return target.kind === "slot"
    ? { name: MEAL_TYPE_LABELS[target.type], type: target.type }
    : { name: target.name, type: target.type };
}

/** La comida del destino, si ya existe (las creadas en esta sesión se buscan en `created`). */
export function resolveTargetMeal<M extends DiaryMeal>(
  target: AddTarget,
  meals: M[],
  created: ReadonlyMap<string, string>,
): M | null {
  const mealId = target.kind === "meal" ? target.mealId : created.get(targetKey(target));
  return mealId ? (meals.find((meal) => meal.id === mealId) ?? null) : null;
}

export function targetLabel(target: AddTarget, meals: DiaryMeal[], created: ReadonlyMap<string, string>) {
  const meal = resolveTargetMeal(target, meals, created);
  if (meal) return meal.name;
  return target.kind === "meal" ? "la comida" : targetMealSpec(target).name;
}

// ---------------------------------------------------------------------------------------------
// Selección inicial y al cambiar las pestañas

export type DiaryDeepLink = {
  mealId?: string;
  mealType?: MealType;
  /** Alimento que llega desde /alimentos (`?alimento=&medida=&cantidad=`). */
  food?: { foodId: string; measure: "g" | "unit"; quantity: number } | null;
  /** Receta que llega desde /recetas (`?receta=&medida=&cantidad=`). */
  recipe?: { recipeId: string; measure: "g" | "unit"; quantity: number } | null;
};

/**
 * `?comida=`, `?tipo=`, `?alimento=` y `?receta=` (solo hoy): qué pestaña se abre y para qué comida se
 * abre "Agregar". Sin `?tipo=`, el alimento o la receta van a la comida que sigue; con el día cerrado,
 * a un snack nuevo.
 */
export function resolveInitialDiary(
  meals: DiaryMeal[],
  link: DiaryDeepLink,
): { selectedKey: string; addTarget: AddTarget | null } {
  const day = buildDiaryDay(meals);
  const fallback = day.nextKey ?? SUMMARY_KEY;

  if (link.mealId) {
    const meal = meals.find((candidate) => candidate.id === link.mealId);
    if (meal) return { selectedKey: meal.id, addTarget: { kind: "meal", mealId: meal.id } };
  }

  if (link.mealType) {
    const last = meals.filter((meal) => meal.type === link.mealType).at(-1);
    if (last) return { selectedKey: last.id, addTarget: { kind: "meal", mealId: last.id } };

    const slotKey = `empty-${link.mealType}`;
    if (day.tabs.some((tab) => tab.key === slotKey)) {
      return { selectedKey: slotKey, addTarget: { kind: "slot", type: link.mealType } };
    }

    // Snack sin registrar: no tiene lugar vacío, se crea como comida nueva.
    return {
      selectedKey: fallback,
      addTarget: { kind: "new", token: "enlace", name: MEAL_TYPE_LABELS[link.mealType], type: link.mealType },
    };
  }

  if (link.food || link.recipe) {
    const next = day.tabs.find((tab) => tab.key === day.nextKey);

    if (next) {
      return {
        selectedKey: next.key,
        addTarget: next.meal ? { kind: "meal", mealId: next.meal.id } : { kind: "slot", type: next.type },
      };
    }

    return {
      selectedKey: fallback,
      addTarget: { kind: "new", token: "enlace", name: MEAL_TYPE_LABELS.snack, type: "snack" },
    };
  }

  return { selectedKey: fallback, addTarget: null };
}

export type PanelSelection = { key: string; type: MealType | null; index: number };

/**
 * La pestaña elegida se sigue por clave. Si desaparece (se borró la comida, se creó la del lugar
 * vacío, se cerró o reabrió el día), cae en el lugar vacío de su tipo o en el índice más cercano.
 */
export function resolvePanelSelection(
  panelKeys: string[],
  previous: PanelSelection,
  context: { nextKey: string | null; typeOfKey: (key: string) => MealType | null },
): PanelSelection {
  const select = (key: string): PanelSelection => ({ key, type: context.typeOfKey(key), index: panelKeys.indexOf(key) });

  if (panelKeys.length === 0) return { key: SUMMARY_KEY, type: null, index: 0 };
  if (panelKeys.includes(previous.key)) return select(previous.key);
  if (previous.key === SUMMARY_KEY) return select(context.nextKey ?? panelKeys[0]);

  if (previous.type) {
    const slotKey = `empty-${previous.type}`;
    if (panelKeys.includes(slotKey)) return select(slotKey);
  }

  return select(panelKeys[Math.min(Math.max(previous.index, 0), panelKeys.length - 1)]);
}

// ---------------------------------------------------------------------------------------------
// Resultado de un agregado y deshacer

export function findCreatedMeal<M extends DiaryMeal>(
  beforeIds: ReadonlySet<string>,
  after: M[],
  match: { name: string; type: MealType },
): M | null {
  const fresh = after.filter((meal) => !beforeIds.has(meal.id));
  return fresh.find((meal) => meal.name === match.name && meal.type === match.type) ?? fresh[0] ?? null;
}

export function findAddedItem(
  beforeItemIds: ReadonlySet<string>,
  meal: DiaryMeal | null,
  match: { kind: "food" | "recipe"; id: string },
): DiaryItem | null {
  if (!meal) return null;
  const fresh = meal.items.filter((item) => !beforeItemIds.has(item.id));
  const sameOption = fresh.find((item) =>
    match.kind === "food" ? item.foodId === match.id : item.recipeId === match.id,
  );
  return sameOption ?? fresh[0] ?? null;
}

export type UndoRecord = { mealId: string; itemId: string; createdMeal: boolean };

/**
 * Qué borra "Deshacer", decidido al tocarlo: la comida solo si la creó ese agregado y sigue teniendo
 * ese único alimento; si no, solo el alimento. `null` si ya no está.
 */
export function resolveUndo(
  meals: DiaryMeal[],
  record: UndoRecord,
): { kind: "delete-meal"; mealId: string } | { kind: "delete-item"; itemId: string } | null {
  const meal = meals.find((candidate) => candidate.id === record.mealId);

  if (!meal || !meal.items.some((item) => item.id === record.itemId)) return null;
  if (record.createdMeal && meal.items.length === 1) return { kind: "delete-meal", mealId: meal.id };
  return { kind: "delete-item", itemId: record.itemId };
}

/** Cambiar el tipo: si el nombre era el del tipo ("Almuerzo"), el nombre lo sigue. */
export function resolveTypeChange(meal: { name: string; type: MealType }, next: MealType) {
  return meal.name.trim() === MEAL_TYPE_LABELS[meal.type]
    ? { type: next, name: MEAL_TYPE_LABELS[next] }
    : { type: next };
}

// ---------------------------------------------------------------------------------------------
// Racha y semana

/** Días seguidos con comidas registradas, contando hacia atrás desde hoy. */
export function calculateStreak(loggedDates: ReadonlySet<string>, todayKey: string) {
  let streak = 0;
  let cursor = todayKey;

  while (loggedDates.has(cursor)) {
    streak += 1;
    cursor = addDaysToDateKey(cursor, -1);
  }

  return streak;
}

/** Días registrados con el día que se está viendo actualizado según sus comidas actuales. */
export function withCurrentDay(loggedDates: readonly string[], logDate: string, hasItems: boolean) {
  const logged = new Set(loggedDates);

  if (hasItems) {
    logged.add(logDate);
  } else {
    logged.delete(logDate);
  }

  return logged;
}

const WEEK_LETTERS = ["L", "M", "M", "J", "V", "S", "D"] as const;

export type WeekStripDay = {
  key: string;
  letter: string;
  day: number;
  logged: boolean;
  selected: boolean;
  today: boolean;
  disabled: boolean;
};

export function buildWeekStrip(args: {
  weekStart: string;
  todayKey: string;
  minKey: string;
  selectedKey: string;
  logged: ReadonlySet<string>;
}) {
  const days: WeekStripDay[] = WEEK_LETTERS.map((letter, index) => {
    const key = addDaysToDateKey(args.weekStart, index);

    return {
      key,
      letter,
      day: Number(key.slice(8)),
      logged: args.logged.has(key),
      selected: key === args.selectedKey,
      today: key === args.todayKey,
      disabled: key > args.todayKey || key < args.minKey,
    };
  });

  return {
    days,
    canPrev: addDaysToDateKey(args.weekStart, -1) >= args.minKey,
    canNext: addDaysToDateKey(args.weekStart, 7) <= args.todayKey,
  };
}

// ---------------------------------------------------------------------------------------------
// Textos (arrays fijos: `Intl` abrevia distinto en Node y en Safari y rompe la hidratación)

const WEEKDAYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"] as const;
const WEEKDAYS_SHORT = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"] as const;
const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;
const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function dateParts(key: string) {
  return { year: key.slice(0, 4), month: Number(key.slice(5, 7)) - 1, day: Number(key.slice(8)) };
}

/** Encabezado del día: "Hoy · mié 16", "Ayer · mar 15", "Lunes · 14 sep", "Jueves · 20 nov 2025". */
export function formatDayHeader(logDate: string, todayKey: string) {
  const weekday = getMondayFirstWeekdayIndex(logDate);
  const { year, month, day } = dateParts(logDate);

  if (logDate === todayKey || logDate === addDaysToDateKey(todayKey, -1)) {
    return { title: logDate === todayKey ? "Hoy" : "Ayer", caption: `${WEEKDAYS_SHORT[weekday]} ${day}` };
  }

  const sameYear = year === todayKey.slice(0, 4);
  return {
    title: capitalize(WEEKDAYS[weekday]),
    caption: `${day} ${MONTHS_SHORT[month]}${sameYear ? "" : ` ${year}`}`,
  };
}

/** Cómo nombrar el día en una frase: "hoy", "ayer", "el lunes", "el 20 de noviembre de 2025". */
export function formatDayReference(logDate: string, todayKey: string) {
  if (logDate === todayKey) return "hoy";
  if (logDate === addDaysToDateKey(todayKey, -1)) return "ayer";
  if (logDate >= addDaysToDateKey(todayKey, -6)) return `el ${WEEKDAYS[getMondayFirstWeekdayIndex(logDate)]}`;

  const { year, month, day } = dateParts(logDate);
  const sameYear = year === todayKey.slice(0, 4);
  return `el ${day} de ${MONTHS[month]}${sameYear ? "" : ` de ${year}`}`;
}

/** "14 – 20 sep", "29 sep – 5 oct", "15 – 21 sep 2025". */
export function formatWeekRange(weekStart: string, todayKey: string) {
  const start = dateParts(weekStart);
  const end = dateParts(addDaysToDateKey(weekStart, 6));
  const year = end.year === todayKey.slice(0, 4) ? "" : ` ${end.year}`;

  return start.month === end.month
    ? `${start.day} – ${end.day} ${MONTHS_SHORT[end.month]}${year}`
    : `${start.day} ${MONTHS_SHORT[start.month]} – ${end.day} ${MONTHS_SHORT[end.month]}${year}`;
}

/** "780 kcal · P 52 · C 75 · G 22". */
export function formatMealMeta(meal: { kcal: number; macros: Macros }) {
  return `${Math.round(meal.kcal)} kcal · P ${Math.round(meal.macros.proteinG)} · C ${Math.round(meal.macros.carbsG)} · G ${Math.round(meal.macros.fatG)}`;
}

/** Línea debajo de una comida sin alimentos. */
export function formatEmptyMeta(args: {
  logDate: string;
  todayKey: string;
  dayEmpty: boolean;
  consumedKcal: number;
  targetKcal: number | null;
}) {
  const isToday = args.logDate === args.todayKey;

  if (args.dayEmpty) {
    return isToday
      ? "Tu primera comida del día."
      : `Sin registros ${formatDayReference(args.logDate, args.todayKey)}.`;
  }

  const total = args.targetKcal ? `${args.consumedKcal} de ${args.targetKcal} kcal` : `${args.consumedKcal} kcal`;
  return isToday ? `Sin registrar · llevás ${total}` : `Sin registrar · ese día sumaste ${total}`;
}

/** "Avena, banana, leche +2". */
export function formatMealFoods(meal: { items: Array<{ name: string }> }, max = 3) {
  if (meal.items.length === 0) return "Sin alimentos";
  const names = meal.items.slice(0, max).map((item) => item.name);
  const rest = meal.items.length - names.length;
  return `${names.join(", ")}${rest > 0 ? ` +${rest}` : ""}`;
}

/** Tamaño del título del panel según el largo del nombre (en mayúsculas). */
export function titleScale(label: string): "xxl" | "xl" | "l" {
  if (label.length <= 9) return "xxl";
  if (label.length <= 14) return "xl";
  return "l";
}
