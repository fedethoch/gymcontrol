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
 * Pestañas de la semana. Un entreno en curso manda sobre el próximo pendiente (igual que el hero del home):
 * con sesión abierta no hay pestaña "next".
 */
export function buildDayTabs(args: {
  days: Array<{ id: string; dayOrder: number; mainGroup: string | null }>;
  completedDayIds: string[];
  completedDayDates: Record<string, string>;
  openDayId: string | null;
  trainedToday: boolean;
  todayKey: string;
}): DayTab[] {
  const done = new Set(args.completedDayIds);
  const nextId = args.openDayId ? null : (args.days.find((day) => !done.has(day.id))?.id ?? null);

  return args.days.map((day): DayTab => {
    const base = { id: day.id, dayOrder: day.dayOrder, doneDate: null };

    if (day.id === args.openDayId) {
      return { ...base, state: "in_progress", label: "En curso" };
    }

    if (done.has(day.id)) {
      const doneDate = args.completedDayDates[day.id] ?? null;
      const label = doneDate === args.todayKey ? "Hoy" : doneDate ? weekdayShort(doneDate) : "Hecho";
      return { ...base, state: "done", label, doneDate };
    }

    if (day.id === nextId) {
      return { ...base, state: "next", label: args.trainedToday ? "Próximo" : "Hoy" };
    }

    return { ...base, state: "pending", label: day.mainGroup ?? `Día ${day.dayOrder}` };
  });
}

/** Panel que se abre: día en curso, si no el próximo. `null` = semana cerrada (resumen). */
export function initialDayIndex(tabs: DayTab[]): number | null {
  const inProgress = tabs.findIndex((tab) => tab.state === "in_progress");
  if (inProgress >= 0) return inProgress;
  const next = tabs.findIndex((tab) => tab.state === "next");
  return next >= 0 ? next : null;
}

/** Acción del dock para el día visible. Solo el día en curso o el próximo (sin entreno hoy) llevan emerald. */
export function resolveDockAction(tab: DayTab, context: { trainedToday: boolean; todayDoneOrder: number | null }): DockAction {
  if (tab.state === "in_progress") {
    return { label: "Continuar", tone: "primary", note: null };
  }

  if (tab.state === "next" && !context.trainedToday) {
    return { label: "Empezar", tone: "primary", note: null };
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
