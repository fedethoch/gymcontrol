// Detalle de rutina mobile (`/catalogo/rutinas/[id]`, DESIGN.md §19): estado, resumen y series por músculo.
// Sin imports a propósito: se testea con `node --test`.

export type DetailState = "guest" | "new" | "saved" | "active" | "archived";

/** A partir de 8 series por semana un grupo se pinta en `--foreground`; con menos, en `--foreground-muted`. */
export const STRONG_GROUP_SERIES = 8;

/**
 * Estado de la pantalla. `saved` es la copia del usuario en la base (null si no la tiene);
 * `status` es el `?status=` con el que redirigen las server actions, que manda solo mientras la base no lo refleja.
 */
export function resolveDetailState(args: {
  signedIn: boolean;
  saved: { isActive: boolean } | null;
  archived: boolean;
  status: string | undefined;
}): DetailState {
  if (!args.signedIn) return "guest";

  const active = args.saved ? args.saved.isActive : args.status === "active";
  if (active) return "active";

  const saved =
    args.saved !== null ||
    args.status === "created" ||
    args.status === "already-saved" ||
    args.status === "inactive";
  if (saved) return "saved";

  return args.archived ? "archived" : "new";
}

/** "Upper Lower 4 días" con 4 días → "Upper Lower". Si el número no coincide, el nombre queda igual. */
export function titleWithoutDays(name: string, dayCount: number): string {
  const match = /^(.*\S)\s+(\d+)\s+d[ií]as?$/i.exec(name.trim());
  if (!match || Number(match[2]) !== dayCount) return name;
  return match[1];
}

/** "120s" → "2 min", "150s" → "2:30 min", "90s" → "90 s". Lo que no es "Ns" queda igual. */
export function formatRest(rest: string): string {
  const match = /^(\d+)\s*s$/i.exec(rest.trim());
  if (!match) return rest;
  const seconds = Number(match[1]);
  if (seconds < 120) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder === 0 ? `${minutes} min` : `${minutes}:${String(remainder).padStart(2, "0")} min`;
}

/** "6-10" → "6–10" (raya entre números). */
export function formatReps(reps: string): string {
  return reps.replace(/(\d)\s*-\s*(\d)/g, "$1–$2");
}

/** Promedio de minutos por día, redondeado a 5. Sin días, 0. */
export function averageMinutes(minutesByDay: readonly number[]): number {
  if (minutesByDay.length === 0) return 0;
  const average = minutesByDay.reduce((sum, minutes) => sum + minutes, 0) / minutesByDay.length;
  return Math.round(average / 5) * 5;
}

type ItemLike = { series: number; exercise: { muscleGroup: string | null; equipment?: string | null } };
type DayLike = { items: readonly ItemLike[] };

export function countSeries(days: readonly DayLike[]): number {
  return days.reduce((sum, day) => sum + day.items.reduce((daySum, item) => daySum + item.series, 0), 0);
}

/**
 * Series por semana de cada grupo muscular, de mayor a menor (empate: el que aparece primero).
 * Los ejercicios sin grupo no suman.
 */
export function weeklySeriesByGroup(days: readonly DayLike[]): Array<{ group: string; series: number }> {
  const totals = new Map<string, number>();
  for (const day of days) {
    for (const item of day.items) {
      const group = item.exercise.muscleGroup;
      if (!group) continue;
      totals.set(group, (totals.get(group) ?? 0) + item.series);
    }
  }
  return [...totals].map(([group, series]) => ({ group, series })).sort((a, b) => b.series - a.series);
}

/** Color neutro por grupo para `MuscleBodyView` (dato, no acento). */
export function balanceFills(volume: ReadonlyArray<{ group: string; series: number }>): Record<string, string> {
  return Object.fromEntries(
    volume.map(({ group, series }) => [
      group,
      series >= STRONG_GROUP_SERIES ? "var(--foreground)" : "var(--foreground-muted)",
    ]),
  );
}

/** Equipamiento distinto, en orden de aparición. */
export function equipmentList(days: readonly DayLike[]): string[] {
  const seen = new Set<string>();
  for (const day of days) {
    for (const item of day.items) {
      const equipment = item.exercise.equipment;
      if (equipment) seen.add(equipment);
    }
  }
  return [...seen];
}
