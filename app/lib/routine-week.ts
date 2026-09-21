// Semana activa mobile (`/rutinas`, DESIGN.md §12): estado de cada día, panel inicial y acción del dock.
// Sin imports a propósito: se testea con `node --test`.

export type DayTabState = "done" | "in_progress" | "next" | "pending";

export type DayTab = {
  id: string;
  dayOrder: number;
  state: DayTabState;
  /** Texto corto bajo "Día N" en la pestaña. */
  label: string;
  /** Fecha (YYYY-MM-DD) del entreno que cuenta esta semana, si está hecho. */
  doneDate: string | null;
  /** Fecha de esta semana en que toca, si la rutina tiene días elegidos. */
  plannedDate: string | null;
  /** Tocaba antes de hoy y no se hizo. */
  missed: boolean;
};

export type DockAction = {
  label: string;
  tone: "primary" | "neutral";
  note: string | null;
};

const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

/** "2026-09-14" → "Lun". */
export function weekdayShort(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return WEEKDAY_SHORT[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

/** Grupos musculares únicos del día, ordenados por frecuencia (top 3). */
export function dayMuscleGroups(items: Array<{ exercise: { muscleGroup: string | null } }>): string[] {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const group = item.exercise.muscleGroup;
    if (!group) continue;
    counts[group] = (counts[group] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([group]) => group);
}

/**
 * Día que se ofrece primero con días elegidos: el de hoy, si no el próximo de la semana,
 * si no el primero que quedó atrás.
 */
function plannedNextId(
  pending: Array<{ id: string }>,
  plannedDates: Record<string, string>,
  todayKey: string,
): string | null {
  const dated = pending
    .map((day) => ({ id: day.id, date: plannedDates[day.id] }))
    .filter((day): day is { id: string; date: string } => Boolean(day.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    dated.find((day) => day.date === todayKey)?.id ??
    dated.find((day) => day.date > todayKey)?.id ??
    dated[0]?.id ??
    pending[0]?.id ??
    null
  );
}

/**
 * Pestañas de la semana. Un entreno en curso manda sobre el próximo pendiente (igual que el hero del home):
 * con sesión abierta no hay pestaña "next". Con días elegidos (`plannedDates`), cada pendiente muestra su día.
 */
export function buildDayTabs(args: {
  days: Array<{ id: string; dayOrder: number; mainGroup: string | null }>;
  completedDayIds: string[];
  completedDayDates: Record<string, string>;
  openDayId: string | null;
  trainedToday: boolean;
  todayKey: string;
  plannedDates?: Record<string, string> | null;
}): DayTab[] {
  const done = new Set(args.completedDayIds);
  const planned = args.plannedDates ?? null;
  const pending = args.days.filter((day) => !done.has(day.id));
  const nextId = args.openDayId
    ? null
    : planned
      ? plannedNextId(pending, planned, args.todayKey)
      : (pending[0]?.id ?? null);

  return args.days.map((day): DayTab => {
    const plannedDate = planned?.[day.id] ?? null;
    const base = { id: day.id, dayOrder: day.dayOrder, doneDate: null, plannedDate, missed: false };

    if (day.id === args.openDayId) {
      return { ...base, state: "in_progress", label: "En curso" };
    }

    if (done.has(day.id)) {
      const doneDate = args.completedDayDates[day.id] ?? null;
      const label = doneDate === args.todayKey ? "Hoy" : doneDate ? weekdayShort(doneDate) : "Hecho";
      return { ...base, state: "done", label, doneDate };
    }

    const missed = plannedDate !== null && plannedDate < args.todayKey;
    const plannedLabel = plannedDate === null ? null : plannedDate === args.todayKey ? "Hoy" : weekdayShort(plannedDate);

    if (day.id === nextId) {
      return {
        ...base,
        missed,
        state: "next",
        label: plannedLabel ?? (args.trainedToday ? "Próximo" : "Hoy"),
      };
    }

    return { ...base, missed, state: "pending", label: plannedLabel ?? day.mainGroup ?? `Día ${day.dayOrder}` };
  });
}

/** Panel que se abre: día en curso, si no el próximo. `null` = semana cerrada (resumen). */
export function initialDayIndex(tabs: DayTab[]): number | null {
  const inProgress = tabs.findIndex((tab) => tab.state === "in_progress");
  if (inProgress >= 0) return inProgress;
  const next = tabs.findIndex((tab) => tab.state === "next");
  return next >= 0 ? next : null;
}

/**
 * Acción del dock para el día visible. Solo el día en curso o el próximo (sin entreno hoy) llevan emerald.
 * `restDay` = hay días elegidos y hoy no toca ninguno pendiente: el próximo queda neutro.
 */
export function resolveDockAction(
  tab: DayTab,
  context: { trainedToday: boolean; todayDoneOrder: number | null; restDay?: boolean },
): DockAction {
  if (tab.state === "in_progress") {
    return { label: "Continuar", tone: "primary", note: null };
  }

  if (tab.state === "next" && !context.trainedToday && !context.restDay) {
    return { label: "Empezar", tone: "primary", note: null };
  }

  if (tab.state === "next" && !context.trainedToday) {
    return { label: `Empezar día ${tab.dayOrder}`, tone: "neutral", note: "Hoy no toca entrenar" };
  }

  if (tab.state === "next") {
    const note = context.todayDoneOrder != null ? `Hoy ya entrenaste · Día ${context.todayDoneOrder} hecho` : "Hoy ya entrenaste";
    return { label: `Empezar día ${tab.dayOrder}`, tone: "neutral", note };
  }

  if (tab.state === "done") {
    return { label: `Ver día ${tab.dayOrder}`, tone: "neutral", note: null };
  }

  return { label: `Empezar día ${tab.dayOrder}`, tone: "neutral", note: null };
}
