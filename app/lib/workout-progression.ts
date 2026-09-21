/**
 * Lógica pura de registro y progresión de entrenamiento.
 * Sin imports a propósito: se testea con `node --test` (tests/unit/workout-progression.test.mjs).
 */

/** Mismo shape que `WorkoutSet` / `ExerciseKind` del contrato (app/lib/workout-sync-contract.ts). */
export type ExerciseKind = "reps" | "bodyweight" | "time";

export type LoggedSet = {
  kg: number | null;
  reps: number | null;
  secs: number | null;
  done: boolean;
};

export type PlanTarget = {
  measure: "reps" | "seconds" | "minutes";
  min: number;
  max: number;
};

export type Suggestion =
  | { kind: "increase_load"; kg: number; reps: number }
  | { kind: "increase_reps"; kg: number | null; reps: number }
  | { kind: "increase_time"; secs: number }
  | { kind: "top_of_range" }
  | { kind: "hold"; kg: number | null; reps: number }
  | { kind: "hold_time"; secs: number };

/**
 * `progress`: primera vez del entreno en la semana, se busca superar la semana anterior.
 * `retry`: ya se hizo esta semana sin lograr el objetivo, se vuelve a intentar el mismo.
 * `hold`: ya se logró esta semana, se reafirma esa marca.
 */
export type WeeklyPhase = "progress" | "retry" | "hold";

/** Objetivo de una serie para hoy, con su fase semanal. */
export type SetPlan = { phase: WeeklyPhase; suggestion: Suggestion | null };

const TARGET_PATTERN = /^(\d+)(?:\s*-\s*(\d+))?\s*(seg|s|min|m)?\s*(?:c\/lado)?$/i;
const REST_PATTERN = /^(\d+)(?:\s*-\s*\d+)?\s*(seg|s|min|m)?$/i;
const E1RM_MAX_REPS = 12;
const DEFAULT_REST_SECONDS = 90;
const SECONDS_PER_SET = 30;
const TIME_STEP_SECONDS = 5;

/** "8-10" → reps 8..10 · "12 c/lado" → reps 12 · "30-45s" → segundos · "30m" → minutos. Null si no se reconoce. */
export function parsePlanTarget(text: string): PlanTarget | null {
  const match = TARGET_PATTERN.exec(text.trim());

  if (!match) {
    return null;
  }

  const min = Number(match[1]);
  const max = match[2] ? Number(match[2]) : min;

  if (min <= 0 || max < min) {
    return null;
  }

  const unit = match[3]?.toLowerCase();
  const measure =
    unit === "s" || unit === "seg" ? "seconds" : unit === "m" || unit === "min" ? "minutes" : "reps";

  return { measure, min, max };
}

/** Tiempo → `time`; peso corporal → `bodyweight` (kg = lastre); el resto → `reps`. */
export function resolveExerciseKind(target: PlanTarget | null, equipment: string | null): ExerciseKind {
  if (target && target.measure !== "reps") return "time";
  if (equipment === "Peso corporal") return "bodyweight";
  return "reps";
}

/** "90s" → 90 · "60-120s" → 60 (límite inferior) · "2 min" → 120 · "1:30" → 90. Null si no se reconoce. */
export function parseRestSeconds(text: string): number | null {
  const value = text.trim().toLowerCase();
  const clock = /^(\d+):(\d{2})$/.exec(value);

  if (clock) {
    return Number(clock[1]) * 60 + Number(clock[2]);
  }

  const match = REST_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const amount = Number(match[1]);

  return match[2] === "min" || match[2] === "m" ? amount * 60 : amount;
}

/** Minutos estimados de un día: series × (30 s de trabajo + descanso), con piso de 15 y redondeo a 5. */
export function estimateDayMinutes(items: Array<{ series: number; rest: string }>): number {
  if (items.length === 0) {
    return 0;
  }

  const totalSeconds = items.reduce(
    (sum, item) => sum + item.series * (SECONDS_PER_SET + (parseRestSeconds(item.rest) ?? DEFAULT_REST_SECONDS)),
    0,
  );

  return Math.round(Math.max(15, Math.round(totalSeconds / 60)) / 5) * 5;
}

/** Serie válida: marcada como hecha y con reps o segundos. Es lo único que cuenta para historial, racha y récords. */
export function isValidSet(set: LoggedSet): boolean {
  return set.done && ((set.reps ?? 0) > 0 || (set.secs ?? 0) > 0);
}

/** 1RM estimado (Epley). Solo con peso > 0 y entre 1 y 12 reps: fuera de ese rango la estimación no sirve. */
export function estimateE1rm(kg: number | null, reps: number | null): number | null {
  if (kg == null || kg <= 0 || reps == null || reps < 1 || reps > E1RM_MAX_REPS) {
    return null;
  }

  return reps === 1 ? kg : Math.round(kg * (1 + reps / 30) * 10) / 10;
}

/** Mejor serie válida por 1RM estimado (desempata el mayor peso). Solo para `reps`. */
export function findBestSet(sets: LoggedSet[], kind: ExerciseKind) {
  if (kind !== "reps") {
    return null;
  }

  let best: { kg: number; reps: number; e1rm: number } | null = null;

  for (const set of sets) {
    const e1rm = isValidSet(set) ? estimateE1rm(set.kg, set.reps) : null;

    if (e1rm == null || set.kg == null || set.reps == null) {
      continue;
    }

    if (!best || e1rm > best.e1rm || (e1rm === best.e1rm && set.kg > best.kg)) {
      best = { kg: set.kg, reps: set.reps, e1rm };
    }
  }

  return best;
}

/** Incremento de carga sugerido por equipamiento. Null = peso corporal (se progresa con reps o lastre). */
export function getLoadStep(equipment: string | null): number | null {
  if (equipment === "Peso corporal") return null;
  if (equipment === "Mancuernas") return 2;
  if (equipment === "Kettlebell") return 4;
  return 2.5;
}

/**
 * Doble progresión de una serie contra el rango vigente del plan: si llegó al tope, subir la carga y volver al
 * mínimo; si no, misma carga y una rep más. En `time` progresa en segundos.
 */
export function suggestSetTarget(args: {
  target: PlanTarget | null;
  kind: ExerciseKind;
  previousSet: LoggedSet | null;
  loadStep: number | null;
}): Suggestion | null {
  const { target, previousSet: set } = args;

  if (!target || !set || !isValidSet(set)) {
    return null;
  }

  if (args.kind === "time") {
    if (target.measure === "reps") return null;

    const toSeconds = target.measure === "minutes" ? 60 : 1;
    const minSecs = target.min * toSeconds;
    const maxSecs = target.max * toSeconds;
    const secs = set.secs ?? 0;

    if (secs >= maxSecs) {
      return { kind: "top_of_range" };
    }

    return { kind: "increase_time", secs: Math.min(maxSecs, Math.max(minSecs, secs + TIME_STEP_SECONDS)) };
  }

  if (target.measure !== "reps") {
    return null;
  }

  const kg = set.kg != null && set.kg > 0 ? set.kg : null;
  const reps = set.reps ?? 0;

  if (reps >= target.max) {
    return args.loadStep != null && kg != null
      ? { kind: "increase_load", kg: roundLoad(kg + args.loadStep), reps: target.min }
      : { kind: "top_of_range" };
  }

  return { kind: "increase_reps", kg, reps: Math.min(target.max, Math.max(target.min, reps + 1)) };
}

/**
 * Progresión una vez por semana por entreno (el día y sus copias exactas), serie por serie. El objetivo de cada
 * serie sale de su mejor marca en la última semana entrenada. La primera sesión de la semana va por ese objetivo;
 * las siguientes lo reintentan si esa serie todavía no lo logró, o reafirman la mejor marca de la semana en esa serie.
 * `history` va de la más reciente a la más vieja, con fechas YYYY-MM-DD; `weekStart` es el lunes de hoy.
 */
export function planWeeklyProgression(args: {
  history: Array<{ trainingDate: string; sets: LoggedSet[] }>;
  weekStart: string;
  target: PlanTarget | null;
  kind: ExerciseKind;
  plannedSeries: number;
  loadStep: number | null;
}): SetPlan[] {
  const thisWeek = args.history.filter((session) => session.trainingDate >= args.weekStart);
  const earlier = args.history.filter((session) => session.trainingDate < args.weekStart);
  const lastWeekStart = earlier[0] ? weekStartOf(earlier[0].trainingDate) : null;
  const lastWeek = earlier.filter((session) => weekStartOf(session.trainingDate) === lastWeekStart);

  return Array.from({ length: args.plannedSeries }, (_, index): SetPlan => {
    const goal = suggestSetTarget({
      target: args.target,
      kind: args.kind,
      previousSet: bestSetAt(lastWeek, index),
      loadStep: args.loadStep,
    });

    if (thisWeek.length === 0 || goal?.kind === "top_of_range") {
      return { phase: "progress", suggestion: goal };
    }

    if (goal && !thisWeek.some((session) => meetsSuggestion(session.sets[index], goal))) {
      return { phase: "retry", suggestion: goal };
    }

    return { phase: "hold", suggestion: holdOf(bestSetAt(thisWeek, index), args.kind) };
  });
}

/**
 * Semanas seguidas cumpliendo el objetivo (entrenos válidos ≥ días del plan).
 * `weekStarts` va de la semana en curso hacia atrás. La semana en curso suma si ya se cumplió
 * y, si todavía no, no corta la racha.
 */
export function computeWeeklyStreak(args: {
  weekStarts: string[];
  sessionsByWeekStart: Record<string, number>;
  plannedDays: number;
}): number {
  if (args.plannedDays <= 0) {
    return 0;
  }

  let streak = 0;

  for (const [index, weekStart] of args.weekStarts.entries()) {
    if ((args.sessionsByWeekStart[weekStart] ?? 0) >= args.plannedDays) {
      streak += 1;
      continue;
    }

    if (index === 0) {
      continue;
    }

    break;
  }

  return streak;
}

/** "40 kg × 10" · "12 reps" (sin carga) · "+10 kg × 8" (lastre) · "45 s". */
export function formatLoggedSet(set: LoggedSet, kind: ExerciseKind): string {
  if (kind === "time") {
    return set.secs != null ? formatSeconds(set.secs) : "—";
  }

  if (set.reps == null) {
    return "—";
  }

  if (set.kg == null || set.kg <= 0) {
    return `${set.reps} reps`;
  }

  return kind === "bodyweight" ? `+${formatKg(set.kg)} kg × ${set.reps}` : `${formatKg(set.kg)} kg × ${set.reps}`;
}

export function formatKg(kg: number): string {
  return String(Math.round(kg * 100) / 100);
}

export function formatSeconds(secs: number): string {
  if (secs < 120) {
    return `${secs} s`;
  }

  const minutes = Math.floor(secs / 60);
  const rest = secs % 60;

  return rest === 0 ? `${minutes} min` : `${minutes}:${String(rest).padStart(2, "0")} min`;
}

/**
 * Serie `index` de una sesión. Si no se registró (el plan tiene más series que esa sesión), la última válida
 * anterior, para que las series nuevas tengan una base.
 */
function setAt(sets: LoggedSet[], index: number): LoggedSet | null {
  for (let current = Math.min(index, sets.length - 1); current >= 0; current -= 1) {
    if (isValidSet(sets[current])) return sets[current];
  }

  return null;
}

/** Mejor serie `index` entre varias sesiones: más carga, después más reps (o más tiempo). */
function bestSetAt(sessions: Array<{ sets: LoggedSet[] }>, index: number): LoggedSet | null {
  return sessions.reduce<LoggedSet | null>((best, session) => {
    const set = setAt(session.sets, index);
    return set && (!best || rankSet(set) > rankSet(best)) ? set : best;
  }, null);
}

function rankSet(set: LoggedSet) {
  return (set.kg ?? 0) * 1000 + (set.reps ?? 0) + (set.secs ?? 0);
}

/** Marca a reafirmar: la carga y las reps de esa serie (o su tiempo). */
function holdOf(set: LoggedSet | null, kind: ExerciseKind): Suggestion | null {
  if (!set) {
    return null;
  }

  if (kind === "time") {
    return { kind: "hold_time", secs: set.secs ?? 0 };
  }

  return { kind: "hold", kg: set.kg != null && set.kg > 0 ? set.kg : null, reps: set.reps ?? 0 };
}

/** La serie llegó al objetivo (carga y reps, o tiempo). */
function meetsSuggestion(set: LoggedSet | undefined, suggestion: Suggestion) {
  if (!set || !isValidSet(set)) {
    return false;
  }

  switch (suggestion.kind) {
    case "increase_load":
    case "increase_reps":
      return (set.kg ?? 0) >= (suggestion.kg ?? 0) && (set.reps ?? 0) >= suggestion.reps;
    case "increase_time":
      return (set.secs ?? 0) >= suggestion.secs;
    default:
      return true;
  }
}

/** Lunes de la semana de una fecha YYYY-MM-DD (misma regla que `getWeekStartDateKey`). */
function weekStartOf(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));

  return date.toISOString().slice(0, 10);
}

function roundLoad(kg: number) {
  return Math.round(kg * 10) / 10;
}
