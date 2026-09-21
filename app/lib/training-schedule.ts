// Días de entreno de la rutina activa (DESIGN.md §10.2 y §12.2). Día fijo: el día k de la rutina va el k-ésimo
// día elegido (lunes → domingo). Si faltás, ese día queda pendiente y se puede hacer a mano otro día.
// Sin imports a propósito: se testea con `node --test`.

export const WEEKDAYS = [
  { iso: 1, letter: "L", short: "Lu", abbr: "Lun", name: "lunes" },
  { iso: 2, letter: "M", short: "Ma", abbr: "Mar", name: "martes" },
  { iso: 3, letter: "M", short: "Mi", abbr: "Mié", name: "miércoles" },
  { iso: 4, letter: "J", short: "Ju", abbr: "Jue", name: "jueves" },
  { iso: 5, letter: "V", short: "Vi", abbr: "Vie", name: "viernes" },
  { iso: 6, letter: "S", short: "Sá", abbr: "Sáb", name: "sábado" },
  { iso: 7, letter: "D", short: "Do", abbr: "Dom", name: "domingo" },
] as const;

const ALL_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

/** Reparto sin historial: días separados, arrancando el lunes. */
const DEFAULT_WEEKDAYS: Record<number, number[]> = {
  1: [1],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
};

/** Semanas que mira la precarga del selector. */
const SUGGESTION_DAYS = 28;

export type PlannedStatus = "done" | "today" | "missed" | "upcoming";

export type PlannedDay = {
  id: string;
  dayOrder: number;
  /** 1 = lunes … 7 = domingo. */
  iso: number;
  /** Fecha (YYYY-MM-DD) de ese día en la semana en curso. */
  dateKey: string;
  status: PlannedStatus;
};

export type StripDay = {
  dateKey: string;
  iso: number;
  isToday: boolean;
  isFuture: boolean;
  /** Hubo un entreno que cuenta esa fecha (cualquier rutina). */
  trained: boolean;
  /** Día de la rutina que va ese día de semana, si hay calendario. */
  plannedDayId: string | null;
  plannedDayOrder: number | null;
  /** Tocaba antes de hoy y no se hizo en la semana. */
  missed: boolean;
};

function addDays(key: string, amount: number): string {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + amount)).toISOString().slice(0, 10);
}

/** "2026-09-21" → 1 (lunes) … 7 (domingo). La fecha ya es un día calendario en hora argentina. */
export function isoWeekday(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return ((new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7) + 1;
}

export function weekdayInfo(iso: number) {
  return WEEKDAYS[iso - 1];
}

/** "Miércoles". */
export function weekdayTitle(iso: number): string {
  const { name } = weekdayInfo(iso);
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Hay que elegir días de 1 a 6: con 7 son todos y con más de 7 no entran en la semana. */
export function scheduleNeedsChoice(dayCount: number): boolean {
  return dayCount >= 1 && dayCount <= 6;
}

/** Enteros de 1 a 7, sin repetir y ordenados. `null` si algún valor no es un día de semana. */
export function parseWeekdays(values: readonly unknown[]): number[] | null {
  const days = values.map((value) => (typeof value === "number" ? value : Number(String(value).trim())));
  if (days.some((day) => !Number.isInteger(day) || day < 1 || day > 7)) return null;
  return [...new Set(days)].sort((a, b) => a - b);
}

/**
 * Calendario que vale para una rutina de `dayCount` días: los guardados si coinciden en cantidad.
 * Con 7 días son todos; `null` = no hay calendario (sin elegir, la rutina cambió o tiene más de 7 días).
 */
export function resolveSchedule(stored: readonly number[] | null | undefined, dayCount: number): number[] | null {
  if (dayCount === 7) return [...ALL_WEEKDAYS];
  if (!scheduleNeedsChoice(dayCount) || !stored) return null;
  const parsed = parseWeekdays(stored);
  return parsed && parsed.length === dayCount ? parsed : null;
}

/**
 * Precarga del selector: los días de semana entrenados 2 veces o más en las últimas 4 semanas
 * (los más frecuentes primero) y, si no alcanzan, el reparto por defecto.
 */
export function suggestWeekdays(dayCount: number, trainedDates: readonly string[], todayKey: string): number[] {
  if (dayCount >= 7) return [...ALL_WEEKDAYS];
  if (dayCount < 1) return [];

  const since = addDays(todayKey, -(SUGGESTION_DAYS - 1));
  const counts = new Map<number, number>();
  for (const date of new Set(trainedDates)) {
    if (date < since || date > todayKey) continue;
    const iso = isoWeekday(date);
    counts.set(iso, (counts.get(iso) ?? 0) + 1);
  }

  const picked = new Set(
    [...counts]
      .filter(([, times]) => times >= 2)
      .sort(([isoA, a], [isoB, b]) => b - a || isoA - isoB)
      .slice(0, dayCount)
      .map(([iso]) => iso),
  );
  for (const iso of DEFAULT_WEEKDAYS[dayCount]) {
    if (picked.size >= dayCount) break;
    picked.add(iso);
  }
  return [...picked].sort((a, b) => a - b);
}

/** Cada día de la rutina en su fecha de esta semana. `weekdays` es un calendario válido (`resolveSchedule`). */
export function planWeek(args: {
  weekdays: readonly number[];
  days: ReadonlyArray<{ id: string; dayOrder: number }>;
  completedDayIds: readonly string[];
  todayKey: string;
}): PlannedDay[] {
  const done = new Set(args.completedDayIds);
  const monday = addDays(args.todayKey, 1 - isoWeekday(args.todayKey));

  return args.days.map((day, index) => {
    const iso = args.weekdays[index];
    const dateKey = addDays(monday, iso - 1);
    const status: PlannedStatus = done.has(day.id)
      ? "done"
      : dateKey === args.todayKey
        ? "today"
        : dateKey < args.todayKey
          ? "missed"
          : "upcoming";
    return { id: day.id, dayOrder: day.dayOrder, iso, dateKey, status };
  });
}

/** Lo que toca hoy (si no se hizo), lo que quedó atrás y el próximo día de entreno de la semana. */
export function summarizeWeek(plan: readonly PlannedDay[]) {
  return {
    today: plan.find((day) => day.status === "today") ?? null,
    missed: plan.filter((day) => day.status === "missed"),
    next: plan.find((day) => day.status === "upcoming") ?? null,
  };
}

/** "mañana" o el día de la semana ("viernes"). */
export function relativeDayLabel(dateKey: string, todayKey: string): string {
  return dateKey === addDays(todayKey, 1) ? "mañana" : weekdayInfo(isoWeekday(dateKey)).name;
}

/** Fechas de lunes a domingo de la semana de `todayKey`. */
export function weekDates(todayKey: string): Array<{ dateKey: string; iso: number }> {
  const monday = addDays(todayKey, 1 - isoWeekday(todayKey));
  return ALL_WEEKDAYS.map((iso) => ({ dateKey: addDays(monday, iso - 1), iso }));
}

/** Los 7 días (lunes → domingo) de la semana de hoy, con lo entrenado y lo planeado. `plan = null`: sin calendario. */
export function buildWeekStrip(args: {
  todayKey: string;
  trainedDates: ReadonlySet<string>;
  plan: readonly PlannedDay[] | null;
}): StripDay[] {
  return weekDates(args.todayKey).map(({ dateKey, iso }) => {
    const planned = args.plan?.find((day) => day.iso === iso) ?? null;
    return {
      dateKey,
      iso,
      isToday: dateKey === args.todayKey,
      isFuture: dateKey > args.todayKey,
      trained: args.trainedDates.has(dateKey),
      plannedDayId: planned?.id ?? null,
      plannedDayOrder: planned?.dayOrder ?? null,
      missed: planned?.status === "missed",
    };
  });
}
