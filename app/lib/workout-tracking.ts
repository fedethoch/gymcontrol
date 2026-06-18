import "server-only";

import { createSupabaseServerClient } from "@/app/lib/supabase/server";

export type WorkoutSessionStatus = "in_progress" | "completed";

export type WorkoutSessionItemInput = {
  routineItemId: string;
  performedReps: string | null;
  usedWeight: string | null;
  isCompleted: boolean;
};

export type WorkoutSessionItem = WorkoutSessionItemInput;

export type WorkoutSession = {
  id: string;
  savedRoutineId: string;
  routineDayId: string;
  trainingDate: string;
  status: WorkoutSessionStatus;
  completedAt: string | null;
  itemsByRoutineItemId: Record<string, WorkoutSessionItem>;
};

export type WorkoutWeeklySummary = {
  savedRoutineId: string;
  completedDayCount: number;
  completedRoutineDayIds: string[];
  completedTrainingDatesCount: number;
  currentStreak: number;
  hasRealData: boolean;
};

export type MuscleStrengthRange = "sin_datos" | "base" | "fuerte" | "avanzado" | "elite";

export type MuscleStrengthSummary = {
  muscleGroup: string;
  principalExercise: string;
  matchedExerciseName: string | null;
  bestWeight: number | null;
  range: MuscleStrengthRange;
  color: string;
};

type WorkoutSessionRow = {
  id: string;
  saved_routine_id: string;
  routine_day_id: string;
  training_date: string;
  status: WorkoutSessionStatus;
  completed_at: string | null;
  workout_session_items: WorkoutSessionItemRow[] | null;
};

type WorkoutSessionItemRow = {
  routine_item_id: string;
  performed_reps: string | null;
  used_weight: string | null;
  is_completed: boolean;
};

type SavedRoutineOwnershipRow = {
  id: string;
  routine_template_id: string;
};

type RoutineDayOwnershipRow = {
  id: string;
};

type RoutineItemOwnershipRow = {
  id: string;
};

const WORKOUT_SESSION_SELECT = `
  id,
  saved_routine_id,
  routine_day_id,
  training_date,
  status,
  completed_at,
  workout_session_items (
    routine_item_id,
    performed_reps,
    used_weight,
    is_completed
  )
`;

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

const STRENGTH_RANGE_COLORS: Record<MuscleStrengthRange, string> = {
  sin_datos: "#263347",
  base: "#22c55e",
  fuerte: "#eab308",
  avanzado: "#f97316",
  elite: "#ef4444",
};

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
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getCurrentWeekRange() {
  const today = new Date();
  const currentDay = today.getDay();
  const offsetFromMonday = currentDay === 0 ? 6 : currentDay - 1;
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(today.getDate() - offsetFromMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    weekStart: formatDateOnly(start),
    weekEnd: formatDateOnly(end),
    today: getLocalTrainingDate(),
  };
}

export async function getWorkoutSessionForToday(args: {
  savedRoutineId: string;
  routineDayId: string;
  userId: string;
}) {
  return getWorkoutSessionForDate({
    ...args,
    trainingDate: getLocalTrainingDate(),
  });
}

export async function getWorkoutSessionForDate(args: {
  savedRoutineId: string;
  routineDayId: string;
  userId: string;
  trainingDate: string;
}) {
  await validateWorkoutOwnership({
    savedRoutineId: args.savedRoutineId,
    routineDayId: args.routineDayId,
    userId: args.userId,
  });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(WORKOUT_SESSION_SELECT)
    .eq("user_id", args.userId)
    .eq("saved_routine_id", args.savedRoutineId)
    .eq("routine_day_id", args.routineDayId)
    .eq("training_date", args.trainingDate)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer la sesion del entrenamiento: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapWorkoutSession(data as WorkoutSessionRow);
}

export async function getWorkoutSessionForWeek(args: {
  savedRoutineId: string;
  routineDayId: string;
  userId: string;
}) {
  await validateWorkoutOwnership({
    savedRoutineId: args.savedRoutineId,
    routineDayId: args.routineDayId,
    userId: args.userId,
  });

  const { weekStart, weekEnd } = getCurrentWeekRange();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(WORKOUT_SESSION_SELECT)
    .eq("user_id", args.userId)
    .eq("saved_routine_id", args.savedRoutineId)
    .eq("routine_day_id", args.routineDayId)
    .gte("training_date", weekStart)
    .lte("training_date", weekEnd)
    .order("training_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer la sesion del entrenamiento: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapWorkoutSession(data as WorkoutSessionRow);
}

export async function saveWorkoutSessionForToday(args: {
  savedRoutineId: string;
  routineDayId: string;
  userId: string;
  items: WorkoutSessionItemInput[];
  complete: boolean;
}) {
  return saveWorkoutSession({
    ...args,
    trainingDate: getLocalTrainingDate(),
  });
}

export async function saveWorkoutSessionForWeek(args: {
  savedRoutineId: string;
  routineDayId: string;
  userId: string;
  items: WorkoutSessionItemInput[];
  complete: boolean;
}) {
  return saveWorkoutSession({
    ...args,
    trainingDate: getLocalTrainingDate(),
    useWeekRange: true,
  });
}

export async function saveWorkoutSession(args: {
  savedRoutineId: string;
  routineDayId: string;
  userId: string;
  trainingDate: string;
  items: WorkoutSessionItemInput[];
  complete: boolean;
  useWeekRange?: boolean;
}) {
  await validateWorkoutOwnership({
    savedRoutineId: args.savedRoutineId,
    routineDayId: args.routineDayId,
    userId: args.userId,
    submittedRoutineItemIds: args.items.map((item) => item.routineItemId),
  });
  const normalizedItemsById = new Map(
    args.items.map((item) => [item.routineItemId, item] satisfies [string, WorkoutSessionItemInput]),
  );
  const supabase = await createSupabaseServerClient();

  let existingSessionQuery = supabase
    .from("workout_sessions")
    .select("id, status, completed_at, training_date")
    .eq("user_id", args.userId)
    .eq("saved_routine_id", args.savedRoutineId)
    .eq("routine_day_id", args.routineDayId);

  if (args.useWeekRange) {
    const { weekStart, weekEnd } = getCurrentWeekRange();
    existingSessionQuery = existingSessionQuery
      .gte("training_date", weekStart)
      .lte("training_date", weekEnd)
      .order("training_date", { ascending: false })
      .limit(1);
  } else {
    existingSessionQuery = existingSessionQuery.eq("training_date", args.trainingDate);
  }

  const { data: existingSession, error: existingSessionError } = await existingSessionQuery.maybeSingle();

  if (existingSessionError) {
    throw new Error(`No se pudo buscar la sesion del entrenamiento: ${existingSessionError.message}`);
  }

  const nextStatus = args.complete ? "completed" : "in_progress";
  const completedAt = nextStatus === "completed" ? new Date().toISOString() : null;

  let sessionId = existingSession?.id ?? null;

  if (sessionId) {
    const { error: updateError } = await supabase
      .from("workout_sessions")
      .update({
        status: nextStatus,
        completed_at: completedAt,
      })
      .eq("id", sessionId)
      .eq("user_id", args.userId);

    if (updateError) {
      throw new Error(`No se pudo actualizar la sesion del entrenamiento: ${updateError.message}`);
    }
  } else {
    const { data: insertedSession, error: insertError } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: args.userId,
        saved_routine_id: args.savedRoutineId,
        routine_day_id: args.routineDayId,
        training_date: args.trainingDate,
        status: nextStatus,
        completed_at: completedAt,
      })
      .select("id")
      .single();

    if (insertError || !insertedSession) {
      throw new Error(`No se pudo crear la sesion del entrenamiento: ${insertError?.message ?? "sin id"}`);
    }

    sessionId = insertedSession.id;
  }

  if (!sessionId) {
    throw new Error("No se pudo resolver la sesion del entrenamiento.");
  }

  const itemRows = [...normalizedItemsById.values()].map((submitted) => ({
    workout_session_id: sessionId,
    routine_item_id: submitted.routineItemId,
    performed_reps: submitted.performedReps,
    used_weight: submitted.usedWeight,
    is_completed: submitted.isCompleted,
  }));

  if (itemRows.length > 0) {
    const { error: upsertError } = await supabase.from("workout_session_items").upsert(itemRows, {
      onConflict: "workout_session_id,routine_item_id",
    });

    if (upsertError) {
      throw new Error(`No se pudieron guardar los ejercicios del entrenamiento: ${upsertError.message}`);
    }
  }

  const { data: savedSession, error: savedSessionError } = await supabase
    .from("workout_sessions")
    .select(WORKOUT_SESSION_SELECT)
    .eq("id", sessionId)
    .single();

  if (savedSessionError || !savedSession) {
    throw new Error(`No se pudo leer la sesion del entrenamiento: ${savedSessionError?.message ?? "sin datos"}`);
  }

  return mapWorkoutSession(savedSession as WorkoutSessionRow);
}

export async function listWorkoutWeeklySummaries(args: {
  userId: string;
  savedRoutineIds: string[];
  plannedDaysBySavedRoutineId?: Record<string, number>;
}): Promise<Record<string, WorkoutWeeklySummary>> {
  if (args.savedRoutineIds.length === 0) {
    return {};
  }

  const { weekStart, weekEnd, today } = getCurrentWeekRange();
  const streakWindowStart = formatDateOnly(addDays(new Date(`${today}T00:00:00`), -90));
  const supabase = await createSupabaseServerClient();
  const [{ data, error }, { data: streakData, error: streakError }] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("saved_routine_id, routine_day_id, training_date")
      .eq("user_id", args.userId)
      .eq("status", "completed")
      .gte("training_date", weekStart)
      .lte("training_date", weekEnd)
      .in("saved_routine_id", args.savedRoutineIds),
    supabase
      .from("workout_sessions")
      .select("saved_routine_id, routine_day_id, training_date")
      .eq("user_id", args.userId)
      .eq("status", "completed")
      .gte("training_date", streakWindowStart)
      .lte("training_date", today)
      .in("saved_routine_id", args.savedRoutineIds),
  ]);

  if (error) {
    throw new Error(`No se pudo calcular el progreso semanal: ${error.message}`);
  }

  if (streakError) {
    throw new Error(`No se pudo calcular la racha actual: ${streakError.message}`);
  }

  const streakSessionsBySavedRoutineId = new Map<
    string,
    Array<{ trainingDate: string; routineDayId: string }>
  >();

  for (const row of (streakData ?? []) as Array<{
    saved_routine_id: string;
    routine_day_id: string;
    training_date: string;
  }>) {
    const sessions = streakSessionsBySavedRoutineId.get(row.saved_routine_id) ?? [];
    sessions.push({ trainingDate: row.training_date, routineDayId: row.routine_day_id });
    streakSessionsBySavedRoutineId.set(row.saved_routine_id, sessions);
  }

  const summaries = Object.fromEntries(
    args.savedRoutineIds.map((savedRoutineId) => [
      savedRoutineId,
      {
        savedRoutineId,
        completedDayCount: 0,
        completedRoutineDayIds: [],
        completedTrainingDatesCount: 0,
        currentStreak: 0,
        hasRealData: false,
      } satisfies WorkoutWeeklySummary,
    ]),
  ) as Record<string, WorkoutWeeklySummary>;

  const grouped = new Map<
    string,
    {
      completedRoutineDayIds: Set<string>;
      completedDates: Set<string>;
    }
  >();

  for (const row of (data ?? []) as Array<{
    saved_routine_id: string;
    routine_day_id: string;
    training_date: string;
  }>) {
    const entry = grouped.get(row.saved_routine_id) ?? {
      completedRoutineDayIds: new Set<string>(),
      completedDates: new Set<string>(),
    };

    entry.completedRoutineDayIds.add(row.routine_day_id);
    entry.completedDates.add(row.training_date);
    grouped.set(row.saved_routine_id, entry);
  }

  for (const [savedRoutineId, entry] of grouped) {
    const streakSessions = streakSessionsBySavedRoutineId.get(savedRoutineId) ?? [];
    const plannedDays = args.plannedDaysBySavedRoutineId?.[savedRoutineId] ?? 0;

    summaries[savedRoutineId] = {
      savedRoutineId,
      completedDayCount: entry.completedRoutineDayIds.size,
      completedRoutineDayIds: [...entry.completedRoutineDayIds],
      completedTrainingDatesCount: entry.completedDates.size,
      currentStreak: calculateCurrentStreak({ sessions: streakSessions, plannedDays, today }),
      hasRealData: entry.completedRoutineDayIds.size > 0 || streakSessions.length > 0,
    };
  }

  for (const [savedRoutineId, streakSessions] of streakSessionsBySavedRoutineId) {
    if (grouped.has(savedRoutineId)) {
      continue;
    }

    const plannedDays = args.plannedDaysBySavedRoutineId?.[savedRoutineId] ?? 0;

    summaries[savedRoutineId] = {
      savedRoutineId,
      completedDayCount: 0,
      completedRoutineDayIds: [],
      completedTrainingDatesCount: 0,
      currentStreak: calculateCurrentStreak({ sessions: streakSessions, plannedDays, today }),
      hasRealData: streakSessions.length > 0,
    };
  }

  return summaries;
}

export type ExerciseHistoryEntry = {
  date: string;
  weight: string | null;
  reps: string | null;
};

const EXERCISE_HISTORY_LIMIT = 5;

export async function getExerciseHistoryByRoutineItem(args: {
  userId: string;
  savedRoutineId: string;
  routineItemIds: string[];
}): Promise<Record<string, ExerciseHistoryEntry[]>> {
  if (args.routineItemIds.length === 0) {
    return {};
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_session_items")
    .select(
      "routine_item_id, performed_reps, used_weight, workout_sessions!inner(training_date, user_id, saved_routine_id)",
    )
    .in("routine_item_id", args.routineItemIds)
    .eq("workout_sessions.user_id", args.userId)
    .eq("workout_sessions.saved_routine_id", args.savedRoutineId)
    .order("training_date", { referencedTable: "workout_sessions", ascending: false });

  if (error) {
    throw new Error(`No se pudo leer el historial de ejercicios: ${error.message}`);
  }

  const result: Record<string, ExerciseHistoryEntry[]> = {};

  for (const row of (data ?? []) as Array<{
    routine_item_id: string;
    performed_reps: string | null;
    used_weight: string | null;
    workout_sessions: { training_date: string } | { training_date: string }[] | null;
  }>) {
    const session = Array.isArray(row.workout_sessions)
      ? row.workout_sessions[0]
      : row.workout_sessions;

    if (!session) {
      continue;
    }

    const entries = result[row.routine_item_id] ?? [];

    if (entries.length >= EXERCISE_HISTORY_LIMIT) {
      continue;
    }

    entries.push({
      date: formatHistoryDate(session.training_date),
      weight: row.used_weight,
      reps: row.performed_reps,
    });
    result[row.routine_item_id] = entries;
  }

  return result;
}

export async function listMuscleStrengthSummariesForSavedRoutine(args: {
  userId: string;
  savedRoutineId: string;
}): Promise<MuscleStrengthSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_session_items")
    .select(
      `
        used_weight,
        workout_sessions!inner(user_id, saved_routine_id),
        routine_item:routine_items!inner(
          exercise:exercises!routine_items_exercise_id_fkey(name, muscle_group)
        )
      `,
    )
    .eq("workout_sessions.user_id", args.userId)
    .eq("workout_sessions.saved_routine_id", args.savedRoutineId);

  if (error) {
    throw new Error(`No se pudo leer la fuerza por grupo muscular: ${error.message}`);
  }

  const bestByGroup = new Map<
    string,
    {
      principal: { exerciseName: string; weight: number } | null;
      fallback: { exerciseName: string; weight: number } | null;
    }
  >();

  for (const row of (data ?? []) as Array<{
    used_weight: string | null;
    routine_item:
      | {
          exercise:
            | { name: string; muscle_group: string | null }
            | Array<{ name: string; muscle_group: string | null }>
            | null;
        }
      | Array<{
          exercise:
            | { name: string; muscle_group: string | null }
            | Array<{ name: string; muscle_group: string | null }>
            | null;
        }>
      | null;
  }>) {
    const routineItem = Array.isArray(row.routine_item) ? row.routine_item[0] : row.routine_item;
    const exercise = Array.isArray(routineItem?.exercise)
      ? routineItem.exercise[0]
      : routineItem?.exercise;
    const muscleGroup = normalizeStrengthGroup(exercise?.muscle_group);
    const bestWeight = parseBestWeight(row.used_weight);

    if (!exercise || !muscleGroup || bestWeight == null) {
      continue;
    }

    const current = bestByGroup.get(muscleGroup) ?? { principal: null, fallback: null };
    const entry = { exerciseName: exercise.name, weight: bestWeight };

    if (!current.fallback || bestWeight > current.fallback.weight) {
      current.fallback = entry;
    }

    if (isPrincipalStrengthExercise(muscleGroup, exercise.name)) {
      if (!current.principal || bestWeight > current.principal.weight) {
        current.principal = entry;
      }
    }

    bestByGroup.set(muscleGroup, current);
  }

  return STRENGTH_GROUPS.map((muscleGroup) => {
    const best = bestByGroup.get(muscleGroup);
    const selected = best?.principal ?? best?.fallback ?? null;
    const range = resolveStrengthRange(muscleGroup, selected?.weight ?? null);

    return {
      muscleGroup,
      principalExercise: PRIMARY_STRENGTH_EXERCISES[muscleGroup][0],
      matchedExerciseName: selected?.exerciseName ?? null,
      bestWeight: selected?.weight ?? null,
      range,
      color: STRENGTH_RANGE_COLORS[range],
    };
  });
}

function formatHistoryDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${value}T00:00:00`));
}

function parseBestWeight(value: string | null) {
  if (!value) {
    return null;
  }

  const weights = value
    .split("/")
    .map((token) => Number.parseFloat(token.trim().replace(/,/g, ".")))
    .filter((weight) => Number.isFinite(weight) && weight > 0);

  if (weights.length === 0) {
    return null;
  }

  return Math.max(...weights);
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
  weight: number | null,
): MuscleStrengthRange {
  if (weight == null) {
    return "sin_datos";
  }

  const [base, fuerte, avanzado, elite] = STRENGTH_THRESHOLDS[muscleGroup];

  if (weight >= elite) return "elite";
  if (weight >= avanzado) return "avanzado";
  if (weight >= fuerte) return "fuerte";
  if (weight >= base) return "base";
  return "sin_datos";
}

export async function getCompletedTrainingDates(args: {
  userId: string;
  savedRoutineId: string;
  days: number;
}): Promise<Set<string>> {
  const { today } = getCurrentWeekRange();
  const rangeStart = formatDateOnly(addDays(new Date(`${today}T00:00:00`), -(args.days - 1)));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("training_date")
    .eq("user_id", args.userId)
    .eq("saved_routine_id", args.savedRoutineId)
    .eq("status", "completed")
    .gte("training_date", rangeStart)
    .lte("training_date", today);

  if (error) {
    throw new Error(`No se pudo leer el historial de entrenamientos: ${error.message}`);
  }

  return new Set((data ?? []).map((row) => (row as { training_date: string }).training_date));
}

async function validateWorkoutOwnership(args: {
  savedRoutineId: string;
  routineDayId: string;
  userId: string;
  submittedRoutineItemIds?: string[];
}) {
  const supabase = await createSupabaseServerClient();
  const { data: savedRoutine, error: savedRoutineError } = await supabase
    .from("saved_routines")
    .select("id, routine_template_id")
    .eq("id", args.savedRoutineId)
    .eq("user_id", args.userId)
    .maybeSingle();

  if (savedRoutineError) {
    throw new Error(`No se pudo validar la rutina guardada: ${savedRoutineError.message}`);
  }

  if (!savedRoutine) {
    throw new Error("La rutina guardada no existe o no pertenece al usuario actual.");
  }

  const { data: routineDay, error: routineDayError } = await supabase
    .from("routine_days")
    .select("id")
    .eq("id", args.routineDayId)
    .eq("routine_id", (savedRoutine as SavedRoutineOwnershipRow).routine_template_id)
    .maybeSingle();

  if (routineDayError) {
    throw new Error(`No se pudo validar el dia de rutina: ${routineDayError.message}`);
  }

  if (!routineDay) {
    throw new Error("El dia solicitado no pertenece a la rutina guardada indicada.");
  }

  const { data: routineItems, error: routineItemsError } = await supabase
    .from("routine_items")
    .select("id")
    .eq("routine_day_id", (routineDay as RoutineDayOwnershipRow).id);

  if (routineItemsError) {
    throw new Error(`No se pudieron validar los ejercicios del dia: ${routineItemsError.message}`);
  }

  const routineItemIds = ((routineItems ?? []) as RoutineItemOwnershipRow[]).map((item) => item.id);
  const routineItemSet = new Set(routineItemIds);

  for (const submittedRoutineItemId of args.submittedRoutineItemIds ?? []) {
    if (!routineItemSet.has(submittedRoutineItemId)) {
      throw new Error("Se enviaron ejercicios que no pertenecen al dia de rutina seleccionado.");
    }
  }

  return {
    routineItemIds,
  };
}

function mapWorkoutSession(row: WorkoutSessionRow): WorkoutSession {
  const itemsByRoutineItemId = Object.fromEntries(
    (row.workout_session_items ?? []).map((item) => [
      item.routine_item_id,
      {
        routineItemId: item.routine_item_id,
        performedReps: item.performed_reps,
        usedWeight: item.used_weight,
        isCompleted: item.is_completed,
      } satisfies WorkoutSessionItem,
    ]),
  );

  return {
    id: row.id,
    savedRoutineId: row.saved_routine_id,
    routineDayId: row.routine_day_id,
    trainingDate: row.training_date,
    status: row.status,
    completedAt: row.completed_at,
    itemsByRoutineItemId,
  };
}

function getWeekStartKey(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const offsetFromMonday = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - offsetFromMonday);

  return formatDateOnly(date);
}

function calculateCurrentStreak(args: {
  sessions: Array<{ trainingDate: string; routineDayId: string }>;
  plannedDays: number;
  today: string;
}) {
  const byWeek = new Map<string, { dates: Set<string>; dayIds: Set<string> }>();

  for (const session of args.sessions) {
    const weekStart = getWeekStartKey(new Date(`${session.trainingDate}T00:00:00`));
    const entry = byWeek.get(weekStart) ?? { dates: new Set<string>(), dayIds: new Set<string>() };
    entry.dates.add(session.trainingDate);
    entry.dayIds.add(session.routineDayId);
    byWeek.set(weekStart, entry);
  }

  let streak = 0;
  let cursor = getWeekStartKey(new Date(`${args.today}T00:00:00`));
  let isCurrentWeek = true;

  while (true) {
    const entry = byWeek.get(cursor);
    const completedCount = entry?.dates.size ?? 0;

    if (isCurrentWeek) {
      streak += completedCount;
      isCurrentWeek = false;
    } else {
      const isWeekComplete = args.plannedDays > 0 && (entry?.dayIds.size ?? 0) >= args.plannedDays;
      if (!isWeekComplete) {
        break;
      }
      streak += completedCount;
    }

    const cursorDate = new Date(`${cursor}T00:00:00`);
    cursorDate.setDate(cursorDate.getDate() - 7);
    cursor = formatDateOnly(cursorDate);
  }

  return streak;
}

function addDays(value: Date, amount: number) {
  const result = new Date(value);
  result.setDate(result.getDate() + amount);

  return result;
}

function formatDateOnly(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
