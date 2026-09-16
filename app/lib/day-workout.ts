import {
  formatKg,
  formatSeconds,
  getLoadStep,
  isValidSet,
  parsePlanTarget,
  type ExerciseKind,
  type LoggedSet,
  type PlanTarget,
  type Suggestion,
} from "@/app/lib/workout-progression";

/** Lo que el usuario escribe, tal cual (strings), por serie. `secs` va en la unidad del plan (seg o min). */
export type DraftSet = { kg: string; reps: string; secs: string; done: boolean };

export type ExerciseDraft = { itemId: string | null; sets: DraftSet[]; rev: number };

/** Lo mínimo que necesita la lógica de un ejercicio del día (sin la ficha ni el historial). */
export type ExercisePlan = {
  routineItemId: string;
  series: number;
  target: string;
  kind: ExerciseKind;
  equipment: string | null;
};

export type DayState = "empty" | "ready" | "resting" | "active" | "all_done";

/** Ejercicio y serie donde está parado el usuario: primer ejercicio sin completar y su primera serie libre. */
export type Position = { exerciseIndex: number; setIndex: number };

const REPS_STEP = 1;
const TIME_STEP_SECONDS = 5;
const MINUTES_STEP = 1;

/** Objetivo en minutos ("30m") se carga en minutos y se guarda en segundos. */
export function timeFactor(exercise: Pick<ExercisePlan, "kind" | "target">) {
  return exercise.kind === "time" && parsePlanTarget(exercise.target)?.measure === "minutes" ? 60 : 1;
}

export function toLoggedSet(set: DraftSet, exercise: Pick<ExercisePlan, "kind" | "target">): LoggedSet {
  if (exercise.kind === "time") {
    const value = Number.parseFloat(set.secs);

    return {
      kg: null,
      reps: null,
      secs: Number.isFinite(value) && value > 0 ? Math.round(value * timeFactor(exercise)) : null,
      done: set.done,
    };
  }

  const kg = Number.parseFloat(set.kg);
  const reps = Number.parseInt(set.reps, 10);

  return {
    kg: Number.isFinite(kg) && kg > 0 ? Math.round(kg * 100) / 100 : null,
    reps: Number.isFinite(reps) && reps > 0 ? reps : null,
    secs: null,
    done: set.done,
  };
}

export function toDraftSet(set: LoggedSet, factor: number): DraftSet {
  return {
    kg: set.kg != null ? formatNumber(set.kg) : "",
    reps: set.reps != null ? String(set.reps) : "",
    secs: set.secs != null ? formatNumber(set.secs / factor) : "",
    done: set.done,
  };
}

export function padSets(sets: LoggedSet[], series: number): LoggedSet[] {
  return Array.from(
    { length: Math.max(series, sets.length) },
    (_, index) => sets[index] ?? { kg: null, reps: null, secs: null, done: false },
  );
}

export function countValidDrafts(draft: ExerciseDraft, exercise: Pick<ExercisePlan, "kind" | "target">) {
  return draft.sets.filter((set) => isValidSet(toLoggedSet(set, exercise))).length;
}

export function formatNumber(value: number) {
  return String(Math.round(value * 100) / 100);
}

export function sanitizeNumber(value: string, allowDecimal: boolean) {
  const normalized = value.replace(",", ".").replace(allowDecimal ? /[^\d.]/g : /\D/g, "");
  const [whole, ...decimals] = normalized.split(".");

  return (decimals.length > 0 ? `${whole}.${decimals.join("").slice(0, 2)}` : whole).slice(0, 6);
}

/** Serie anterior en la columna angosta: "40×10", "+10×8", "12", "45s". */
export function formatCompactSet(set: LoggedSet, kind: ExerciseKind) {
  if (kind === "time") return set.secs != null ? `${set.secs}s` : "—";
  if (set.kg == null || set.kg <= 0) return String(set.reps ?? "—");
  return `${kind === "bodyweight" ? "+" : ""}${formatKg(set.kg)}×${set.reps}`;
}

export function buildPlaceholder({
  exercise,
  suggestion,
  target,
  previousSet,
}: {
  exercise: Pick<ExercisePlan, "kind" | "target">;
  suggestion: Suggestion | null;
  target: PlanTarget | null;
  previousSet: LoggedSet | null;
}): DraftSet {
  const previous = previousSet && isValidSet(previousSet) ? previousSet : null;
  const factor = timeFactor(exercise);

  if (exercise.kind === "time") {
    const secs =
      suggestion?.kind === "increase_time"
        ? suggestion.secs
        : (previous?.secs ?? (target && target.measure !== "reps" ? target.min * factor : null));

    return { kg: "", reps: "", secs: secs != null ? formatNumber(secs / factor) : "", done: false };
  }

  const kg =
    suggestion?.kind === "increase_load" || suggestion?.kind === "increase_reps"
      ? suggestion.kg
      : (previous?.kg ?? null);
  const reps =
    suggestion?.kind === "increase_load" || suggestion?.kind === "increase_reps"
      ? suggestion.reps
      : (previous?.reps ?? (target?.measure === "reps" ? target.min : null));

  return {
    kg: kg != null && kg > 0 ? formatNumber(kg) : "",
    reps: reps != null ? String(reps) : "",
    secs: "",
    done: false,
  };
}

export function describeSuggestion({
  suggestion,
  target,
  exercise,
  hasHistory,
}: {
  suggestion: Suggestion | null;
  target: PlanTarget | null;
  exercise: Pick<ExercisePlan, "kind" | "target">;
  hasHistory: boolean;
}) {
  if (!hasHistory) {
    return target ? `Primera vez: apuntá a ${exercise.target}${target.measure === "reps" ? " reps" : ""}.` : null;
  }

  switch (suggestion?.kind) {
    case "increase_load":
      return `Hoy: subí a ${formatKg(suggestion.kg)} kg y apuntá a ${suggestion.reps} reps.`;
    case "increase_reps":
      return suggestion.kg != null && suggestion.kg > 0
        ? `Hoy: ${formatKg(suggestion.kg)} kg, buscá ${suggestion.reps} reps en cada serie.`
        : `Hoy: buscá ${suggestion.reps} reps en cada serie.`;
    case "increase_time":
      return `Hoy: buscá ${formatSeconds(suggestion.secs)} por serie.`;
    case "top_of_range":
      return exercise.kind === "time"
        ? "Llegaste al tope del rango: sumá dificultad."
        : "Llegaste al tope del rango: sumá lastre o una variante más difícil.";
    default:
      return null;
  }
}

/** Estado de la pantalla (DESIGN.md §11.2). `resting` manda sobre `active`: durante el descanso no hay serie que cargar. */
export function resolveDayState({
  exercises,
  drafts,
  resting,
}: {
  exercises: ExercisePlan[];
  drafts: Record<string, ExerciseDraft>;
  resting: boolean;
}): DayState {
  if (exercises.length === 0) return "empty";

  const done = countDoneSets(exercises, drafts);

  if (done >= countPlannedSets(exercises)) return "all_done";
  if (resting) return "resting";

  return done === 0 ? "ready" : "active";
}

export function countPlannedSets(exercises: ExercisePlan[]) {
  return exercises.reduce((sum, exercise) => sum + exercise.series, 0);
}

export function countDoneSets(exercises: ExercisePlan[], drafts: Record<string, ExerciseDraft>) {
  return exercises.reduce(
    (sum, exercise) => sum + countValidDrafts(drafts[exercise.routineItemId], exercise),
    0,
  );
}

/** Fracción hecha de cada ejercicio (0–1), para los segmentos de la barra de progreso. */
export function exerciseFractions(exercises: ExercisePlan[], drafts: Record<string, ExerciseDraft>) {
  return exercises.map((exercise) =>
    exercise.series > 0
      ? Math.min(1, countValidDrafts(drafts[exercise.routineItemId], exercise) / exercise.series)
      : 0,
  );
}

/**
 * Dónde está parado el usuario dentro de un ejercicio: primera serie sin registrar.
 * Con todas las series hechas devuelve la última (no hay nada pendiente que resaltar).
 */
export function currentSetIndex(draft: ExerciseDraft, exercise: ExercisePlan) {
  const pending = draft.sets.findIndex((set) => !isValidSet(toLoggedSet(set, exercise)));

  return pending === -1 ? Math.max(0, draft.sets.length - 1) : pending;
}

/** Ejercicio y serie actuales del día. Sin pendientes, el último ejercicio. */
export function currentPosition(exercises: ExercisePlan[], drafts: Record<string, ExerciseDraft>): Position {
  const index = exercises.findIndex(
    (exercise) => countValidDrafts(drafts[exercise.routineItemId], exercise) < exercise.series,
  );
  const exerciseIndex = index === -1 ? Math.max(0, exercises.length - 1) : index;
  const exercise = exercises[exerciseIndex];

  return {
    exerciseIndex,
    setIndex: exercise ? currentSetIndex(drafts[exercise.routineItemId], exercise) : 0,
  };
}

/** Próximo ejercicio con series pendientes después del actual (para avanzar solo al completar uno). */
export function nextPendingExercise(
  exercises: ExercisePlan[],
  drafts: Record<string, ExerciseDraft>,
  currentRoutineItemId: string,
) {
  return (
    exercises.find(
      (exercise) =>
        exercise.routineItemId !== currentRoutineItemId &&
        countValidDrafts(drafts[exercise.routineItemId], exercise) < exercise.series,
    ) ?? null
  );
}

/**
 * Un toque de −/+ sobre el valor que muestra el stepper (el escrito o, si está vacío, el placeholder).
 * kg usa el salto por equipamiento; reps ±1; tiempo ±5 s (±1 min si el plan va en minutos).
 */
export function stepValue({
  value,
  placeholder,
  field,
  exercise,
  direction,
}: {
  value: string;
  placeholder: string;
  field: "kg" | "reps" | "secs";
  exercise: ExercisePlan;
  direction: 1 | -1;
}) {
  const base = Number.parseFloat((value || placeholder).replace(",", "."));
  const current = Number.isFinite(base) ? base : 0;
  const step =
    field === "kg"
      ? (getLoadStep(exercise.equipment) ?? 2.5)
      : field === "reps"
        ? REPS_STEP
        : timeFactor(exercise) === 60
          ? MINUTES_STEP
          : TIME_STEP_SECONDS;
  const next = current + step * direction;

  if (next <= 0) return "";

  return formatNumber(Math.round(next / step) * step);
}
