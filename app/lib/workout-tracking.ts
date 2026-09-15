import "server-only";

import { addDaysToDateKey, getTodayDateKey, getWeekStartDateKey } from "@/app/lib/local-date";
import { STRENGTH_RANGE_COLORS } from "@/app/lib/strength-colors";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";
import {
  computeWeeklyStreak,
  findBestSet,
  isValidSet,
  type ExerciseKind,
  type LoggedSet,
} from "@/app/lib/workout-progression";

export type WorkoutSessionStatus = "in_progress" | "completed";

/** Ejercicio registrado dentro de una sesión (modelo por posición). */
export type WorkoutItemState = {
  id: string;
  routineItemId: string | null;
  kind: ExerciseKind;
  target: string | null;
  sets: LoggedSet[];
  rev: number;
};

export type OpenWorkoutSession = {
  id: string;
  routineDayId: string | null;
  trainingDate: string;
  itemsByRoutineItemId: Record<string, WorkoutItemState>;
};

export type TrainingOverview = {
  /** Días de la rutina con un entreno contado en la semana en curso. */
  completedRoutineDayIds: string[];
  /** Fechas con al menos un entreno contado (últimas 12 semanas, cualquier rutina). */
  completedDates: string[];
  weeklyStreak: number;
  trainedToday: boolean;
  hasHistory: boolean;
};

export type ExerciseHistoryEntry = {
  sessionId: string;
  trainingDate: string;
  kind: ExerciseKind;
  target: string | null;
  sets: LoggedSet[];
  best: { kg: number; reps: number; e1rm: number } | null;
};

export type MuscleStrengthRange = "sin_datos" | "base" | "fuerte" | "avanzado" | "elite";

export type MuscleStrengthSummary = {
  muscleGroup: string;
  principalExercise: string;
  matchedExerciseName: string | null;
  /** Peso de la mejor serie (por 1RM estimado) de los últimos 180 días. */
  bestWeight: number | null;
  range: MuscleStrengthRange;
  color: string;
};

type ItemRow = {
  id: string;
  routine_item_id: string | null;
  kind: ExerciseKind;
  target_snapshot: string | null;
  sets: LoggedSet[];
  sets_rev: number | string;
};

type CountedSessionRow = {
  id: string;
  saved_routine_id: string | null;
  routine_day_id: string | null;
  training_date: string;
  status: WorkoutSessionStatus;
  workout_session_items: Array<Pick<ItemRow, "sets">> | null;
};

const ITEM_SELECT = "id, routine_item_id, kind, target_snapshot, sets, sets_rev";

const STREAK_WEEKS = 12;
const STRENGTH_WINDOW_DAYS = 180;

const STRENGTH_GROUPS = ["Pecho", "Espalda", "Piernas", "Hombros", "Biceps", "Triceps", "Core"] as const;

const PRIMARY_STRENGTH_EXERCISES: Record<(typeof STRENGTH_GROUPS)[number], string[]> = {
  Pecho: ["press banca", "bench press"],
  Espalda: ["remo con barra", "barbell row"],
  Piernas: ["sentadilla", "squat"],
  Hombros: ["press militar", "overhead press", "shoulder press"],
  Biceps: ["curl con barra", "barbell curl"],
  Triceps: ["press cerrado", "close grip press"],
  Core: ["crunch en polea", "cable crunch"],
};

/** Umbrales sobre el 1RM estimado de la mejor serie. */
const STRENGTH_THRESHOLDS: Record<(typeof STRENGTH_GROUPS)[number], [number, number, number, number]> = {
  Pecho: [20, 50, 80, 110],
  Espalda: [20, 45, 75, 100],
  Piernas: [30, 70, 110, 150],
  Hombros: [15, 35, 55, 75],
  Biceps: [10, 25, 40, 55],
  Triceps: [10, 25, 40, 60],
  Core: [10, 25, 40, 60],
};

export function getLocalTrainingDate() {
  return getTodayDateKey();
}

export function getCurrentWeekRange() {
  const today = getTodayDateKey();
  const weekStart = getWeekStartDateKey(today);

  return {
    weekStart,
    weekEnd: addDaysToDateKey(weekStart, 6),
    today,
  };
}

/** Entreno sin terminar de hoy para ese día de la rutina (el más reciente). */
export async function getOpenSessionForDay(args: {
  userId: string;
  savedRoutineId: string;
  routineDayId: string;
}): Promise<OpenWorkoutSession | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(`id, routine_day_id, training_date, workout_session_items (${ITEM_SELECT})`)
    .eq("user_id", args.userId)
    .eq("saved_routine_id", args.savedRoutineId)
    .eq("routine_day_id", args.routineDayId)
    .eq("training_date", getTodayDateKey())
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer el entrenamiento en curso: ${error.message}`);
  }

  return data ? mapOpenSession(data as unknown as OpenSessionRow) : null;
}

/** Entreno sin terminar de hoy de la rutina, en cualquier día (hero del home). */
export async function getOpenSessionForRoutine(args: {
  userId: string;
  savedRoutineId: string;
}): Promise<OpenWorkoutSession | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(`id, routine_day_id, training_date, workout_session_items (${ITEM_SELECT})`)
    .eq("user_id", args.userId)
    .eq("saved_routine_id", args.savedRoutineId)
    .eq("training_date", getTodayDateKey())
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer el entrenamiento en curso: ${error.message}`);
  }

  return data ? mapOpenSession(data as unknown as OpenSessionRow) : null;
}

/**
 * Resumen de entrenos que cuentan. Un entreno cuenta si tiene al menos una serie válida
 * y ya se terminó o es de un día anterior: no hace falta tocar "Terminar", pero un entreno
 * a medio hacer hoy todavía no suma.
 */
export async function getTrainingOverview(args: {
  userId: string;
  savedRoutineId: string | null;
  plannedDays: number;
}): Promise<TrainingOverview> {
  const { today, weekStart } = getCurrentWeekRange();
  const windowStart = addDaysToDateKey(weekStart, -7 * (STREAK_WEEKS - 1));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("id, saved_routine_id, routine_day_id, training_date, status, workout_session_items (sets)")
    .eq("user_id", args.userId)
    .gte("training_date", windowStart)
    .lte("training_date", today);

  if (error) {
    throw new Error(`No se pudo calcular el progreso: ${error.message}`);
  }

  const counted = ((data ?? []) as unknown as CountedSessionRow[]).filter((session) =>
    isCountedSession(session, today),
  );

  const completedRoutineDayIds = new Set<string>();
  const completedDates = new Set<string>();
  const sessionsByWeekStart: Record<string, number> = {};

  for (const session of counted) {
    completedDates.add(session.training_date);
    const sessionWeek = getWeekStartDateKey(session.training_date);
    sessionsByWeekStart[sessionWeek] = (sessionsByWeekStart[sessionWeek] ?? 0) + 1;

    if (
      sessionWeek === weekStart &&
      session.routine_day_id &&
      session.saved_routine_id === args.savedRoutineId
    ) {
      completedRoutineDayIds.add(session.routine_day_id);
    }
  }

  return {
    completedRoutineDayIds: [...completedRoutineDayIds],
    completedDates: [...completedDates],
    weeklyStreak: computeWeeklyStreak({
      weekStarts: Array.from({ length: STREAK_WEEKS }, (_, index) => addDaysToDateKey(weekStart, -7 * index)),
      sessionsByWeekStart,
      plannedDays: args.plannedDays,
    }),
    trainedToday: completedDates.has(today),
    hasHistory: counted.length > 0,
  };
}

/**
 * Últimas sesiones con series válidas de cada ejercicio (cualquier rutina), de la más reciente a la más vieja.
 * La primera entrada es "Anterior" y la base de la sugerencia de progresión.
 */
export async function listExerciseHistory(args: {
  userId: string;
  exerciseIds: string[];
  excludeSessionId: string | null;
  limitPerExercise?: number;
}): Promise<Record<string, ExerciseHistoryEntry[]>> {
  const exerciseIds = [...new Set(args.exerciseIds)];

  if (exerciseIds.length === 0) {
    return {};
  }

  const limitPerExercise = args.limitPerExercise ?? 8;
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("workout_session_items")
    .select(
      "exercise_id, kind, target_snapshot, sets, workout_sessions!inner(id, user_id, training_date, created_at)",
    )
    .in("exercise_id", exerciseIds)
    .eq("workout_sessions.user_id", args.userId)
    // Orden de las filas por la fecha de su sesión (to-one): `referencedTable` ordenaría solo el embebido.
    .order("workout_sessions(training_date)", { ascending: false })
    .order("workout_sessions(created_at)", { ascending: false })
    .limit(exerciseIds.length * limitPerExercise * 2);

  if (args.excludeSessionId) {
    query = query.neq("workout_session_id", args.excludeSessionId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`No se pudo leer el historial de ejercicios: ${error.message}`);
  }

  const result: Record<string, ExerciseHistoryEntry[]> = {};

  for (const row of (data ?? []) as unknown as HistoryRow[]) {
    const session = Array.isArray(row.workout_sessions) ? row.workout_sessions[0] : row.workout_sessions;
    const entries = (result[row.exercise_id] ??= []);

    if (!session || entries.length >= limitPerExercise) {
      continue;
    }

    if (!row.sets.some(isValidSet)) {
      continue;
    }

    entries.push({
      sessionId: session.id,
      trainingDate: session.training_date,
      kind: row.kind,
      target: row.target_snapshot,
      sets: row.sets,
      best: findBestSet(row.sets, row.kind),
    });
  }

  return result;
}

/** Nivel de fuerza por grupo muscular del usuario (todas sus rutinas, últimos 180 días). */
export async function listMuscleStrengthSummaries(args: { userId: string }): Promise<MuscleStrengthSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_session_items")
    .select(
      "kind, sets, exercise:exercises!workout_session_items_exercise_id_fkey(name, muscle_group), workout_sessions!inner(user_id, training_date)",
    )
    .eq("workout_sessions.user_id", args.userId)
    .gte("workout_sessions.training_date", addDaysToDateKey(getTodayDateKey(), -STRENGTH_WINDOW_DAYS));

  if (error) {
    throw new Error(`No se pudo leer la fuerza por grupo muscular: ${error.message}`);
  }

  const bestByGroup = new Map<
    (typeof STRENGTH_GROUPS)[number],
    { principal: StrengthCandidate | null; fallback: StrengthCandidate | null }
  >();

  for (const row of (data ?? []) as unknown as StrengthRow[]) {
    const exercise = Array.isArray(row.exercise) ? row.exercise[0] : row.exercise;
    const muscleGroup = normalizeStrengthGroup(exercise?.muscle_group);
    const best = findBestSet(row.sets, row.kind);

    if (!exercise || !muscleGroup || !best) {
      continue;
    }

    const current = bestByGroup.get(muscleGroup) ?? { principal: null, fallback: null };
    const candidate = { exerciseName: exercise.name, ...best };

    if (!current.fallback || candidate.e1rm > current.fallback.e1rm) {
      current.fallback = candidate;
    }

    if (isPrincipalStrengthExercise(muscleGroup, exercise.name) && (!current.principal || candidate.e1rm > current.principal.e1rm)) {
      current.principal = candidate;
    }

    bestByGroup.set(muscleGroup, current);
  }

  return STRENGTH_GROUPS.map((muscleGroup) => {
    const best = bestByGroup.get(muscleGroup);
    const selected = best?.principal ?? best?.fallback ?? null;
    const range = resolveStrengthRange(muscleGroup, selected?.e1rm ?? null);

    return {
      muscleGroup,
      principalExercise: PRIMARY_STRENGTH_EXERCISES[muscleGroup][0],
      matchedExerciseName: selected?.exerciseName ?? null,
      bestWeight: selected?.kg ?? null,
      range,
      color: STRENGTH_RANGE_COLORS[range],
    };
  });
}

type OpenSessionRow = {
  id: string;
  routine_day_id: string | null;
  training_date: string;
  workout_session_items: ItemRow[] | null;
};

type HistoryRow = Pick<ItemRow, "kind" | "target_snapshot" | "sets"> & {
  exercise_id: string;
  workout_sessions:
    | { id: string; training_date: string }
    | Array<{ id: string; training_date: string }>
    | null;
};

type StrengthRow = Pick<ItemRow, "kind" | "sets"> & {
  exercise:
    | { name: string; muscle_group: string | null }
    | Array<{ name: string; muscle_group: string | null }>
    | null;
};

type StrengthCandidate = { exerciseName: string; kg: number; reps: number; e1rm: number };

function mapOpenSession(row: OpenSessionRow): OpenWorkoutSession {
  return {
    id: row.id,
    routineDayId: row.routine_day_id,
    trainingDate: row.training_date,
    itemsByRoutineItemId: Object.fromEntries(
      (row.workout_session_items ?? [])
        .filter((item) => item.routine_item_id)
        .map((item) => [
          item.routine_item_id as string,
          {
            id: item.id,
            routineItemId: item.routine_item_id,
            kind: item.kind,
            target: item.target_snapshot,
            sets: item.sets,
            rev: Number(item.sets_rev),
          } satisfies WorkoutItemState,
        ]),
    ),
  };
}

function isCountedSession(session: CountedSessionRow, today: string) {
  const hasValidWork = (session.workout_session_items ?? []).some((item) => item.sets.some(isValidSet));

  return hasValidWork && (session.status === "completed" || session.training_date < today);
}

function normalizeStrengthGroup(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

  return STRENGTH_GROUPS.find((group) => group.toLowerCase() === normalized) ?? null;
}

function isPrincipalStrengthExercise(muscleGroup: (typeof STRENGTH_GROUPS)[number], exerciseName: string) {
  const normalizedName = exerciseName.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

  return PRIMARY_STRENGTH_EXERCISES[muscleGroup].some((candidate) =>
    normalizedName.includes(candidate.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()),
  );
}

function resolveStrengthRange(
  muscleGroup: (typeof STRENGTH_GROUPS)[number],
  e1rm: number | null,
): MuscleStrengthRange {
  if (e1rm == null) {
    return "sin_datos";
  }

  const [base, fuerte, avanzado, elite] = STRENGTH_THRESHOLDS[muscleGroup];

  if (e1rm >= elite) return "elite";
  if (e1rm >= avanzado) return "avanzado";
  if (e1rm >= fuerte) return "fuerte";
  if (e1rm >= base) return "base";
  return "sin_datos";
}
