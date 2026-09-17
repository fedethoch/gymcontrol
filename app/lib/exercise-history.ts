import {
  formatKg,
  formatLoggedSet,
  formatSeconds,
  isValidSet,
  type ExerciseKind,
  type LoggedSet,
} from "@/app/lib/workout-progression";
import type { ExerciseHistoryEntry } from "@/app/lib/workout-tracking";

export { chartScale } from "@/app/lib/chart-scale";

/**
 * Lógica pura del historial de un ejercicio (sheet del ejercicio, DESIGN.md §11.4).
 * Se testea con `node --test` (tests/unit/exercise-history.test.mjs).
 */

export type TrendPoint = { sessionId: string; date: string; value: number };

export type SessionComparison = {
  date: string;
  previousDate: string;
  sets: { value: number; previous: number };
  /** Reps totales (reps / peso corporal) o segundos totales (tiempo). */
  volume: { value: number; previous: number; unit: "reps" | "secs" };
  best: { value: string; previous: string };
};

/** Mejor marca de la sesión: 1RM estimado (reps), máximo de reps (peso corporal) o de segundos (tiempo). */
export function sessionMetric(entry: ExerciseHistoryEntry): number | null {
  const valid = entry.sets.filter(isValidSet);

  if (entry.kind === "reps") return entry.best?.e1rm ?? null;
  if (entry.kind === "time") return maxOf(valid, (set) => set.secs);
  return maxOf(valid, (set) => set.reps);
}

export function metricLabel(kind: ExerciseKind) {
  if (kind === "reps") return "1RM estimado";
  if (kind === "time") return "Mejor tiempo";
  return "Máximo de reps";
}

/** Valor y unidad por separado, para mostrar la unidad más chica. */
export function splitMetric(value: number, kind: ExerciseKind): { value: string; unit: string } {
  if (kind === "reps") return { value: formatKg(value), unit: "kg" };
  if (kind === "time") {
    const [amount, unit] = formatSeconds(value).split(" ");
    return { value: amount, unit: unit ?? "" };
  }
  return { value: String(value), unit: "reps" };
}

export function formatMetric(value: number, kind: ExerciseKind) {
  const { value: amount, unit } = splitMetric(value, kind);

  return unit ? `${amount} ${unit}` : amount;
}

/** Puntos del gráfico, de la sesión más vieja a la más nueva (el historial llega de la más nueva a la más vieja). */
export function trendPoints(history: ExerciseHistoryEntry[]): TrendPoint[] {
  return [...history]
    .reverse()
    .map((entry) => ({ sessionId: entry.sessionId, date: entry.trainingDate, value: sessionMetric(entry) }))
    .filter((point): point is TrendPoint => point.value != null);
}

/** Sesión con la mejor marca (la más reciente si empatan). */
export function bestSessionId(history: ExerciseHistoryEntry[]): string | null {
  let best: { id: string; value: number } | null = null;

  for (const entry of history) {
    const value = sessionMetric(entry);

    if (value != null && (!best || value > best.value)) {
      best = { id: entry.sessionId, value };
    }
  }

  return best?.id ?? null;
}

/** Última sesión contra la anterior. `null` si hay menos de dos sesiones con series válidas. */
export function compareLastSessions(history: ExerciseHistoryEntry[]): SessionComparison | null {
  const sessions = history.filter((entry) => entry.sets.some(isValidSet));

  if (sessions.length < 2) return null;

  const [last, previous] = sessions;
  const unit = last.kind === "time" ? "secs" : "reps";

  return {
    date: last.trainingDate,
    previousDate: previous.trainingDate,
    sets: { value: validSets(last).length, previous: validSets(previous).length },
    volume: { value: totalOf(last, unit), previous: totalOf(previous, unit), unit },
    best: { value: bestSetLabel(last), previous: bestSetLabel(previous) },
  };
}

/** Mejor serie de la sesión en formato compacto (`92.5×9`, `+10×8`, `12 reps`, `75 s`). */
export function bestSetLabel(entry: ExerciseHistoryEntry): string {
  const valid = validSets(entry);

  if (entry.kind === "reps" && entry.best) {
    return `${formatKg(entry.best.kg)}×${entry.best.reps}`;
  }

  const pick = entry.kind === "time" ? (set: LoggedSet) => set.secs ?? 0 : (set: LoggedSet) => set.reps ?? 0;
  const top = valid.reduce<LoggedSet | null>((best, set) => (!best || pick(set) > pick(best) ? set : best), null);

  if (!top) return "—";
  if (entry.kind === "bodyweight" && top.kg != null && top.kg > 0) return `+${formatKg(top.kg)}×${top.reps}`;

  return formatLoggedSet(top, entry.kind);
}

/** Texto del plan como número + unidad: `60-120s` → `60–120` `s` · `2-3m` → `2–3` `min` · `12 c/lado` · `fallo` → `Fallo`. */
export function splitPlanValue(text: string): { value: string; unit: string } {
  const trimmed = text.trim();
  const match = /^(\d+)(?:\s*-\s*(\d+))?\s*(seg|s|min|m)?\s*(c\/lado)?$/i.exec(trimmed);

  if (!match) {
    return { value: trimmed.charAt(0).toUpperCase() + trimmed.slice(1), unit: "" };
  }

  const value = match[2] ? `${match[1]}–${match[2]}` : match[1];
  const unit = match[4] ? "c/lado" : match[3] ? (/^m/i.test(match[3]) ? "min" : "s") : "";

  return { value, unit };
}

/** `2026-09-09` → `09/09`. */
export function formatShortDate(dateKey: string) {
  const [, month, day] = dateKey.split("-");

  return `${day}/${month}`;
}

function validSets(entry: ExerciseHistoryEntry) {
  return entry.sets.filter(isValidSet);
}

function totalOf(entry: ExerciseHistoryEntry, unit: "reps" | "secs") {
  return validSets(entry).reduce((sum, set) => sum + ((unit === "secs" ? set.secs : set.reps) ?? 0), 0);
}

function maxOf(sets: LoggedSet[], pick: (set: LoggedSet) => number | null) {
  const values = sets.map(pick).filter((value): value is number => value != null);

  return values.length > 0 ? Math.max(...values) : null;
}
