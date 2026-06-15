import "server-only";

import type { RoutineDay, RoutineExerciseRef } from "@/app/lib/routines";
import type { RoutineDifficulty, RoutineObjective } from "@/app/lib/routine-metadata";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";

export type SavedRoutineListItem = {
  id: string;
  routineTemplateId: string;
  templateName: string;
  templateDescription: string;
  difficulty: RoutineDifficulty;
  objective: RoutineObjective;
  coverImageUrl: string;
  customName: string | null;
  displayName: string;
  isActive: boolean;
  savedAt: string;
  savedAtLabel: string;
  updatedAt: string;
  updatedAtLabel: string;
  dayCount: number;
  itemCount: number;
};

export type SavedRoutineDetail = {
  id: string;
  routineTemplateId: string;
  templateName: string;
  templateDescription: string;
  difficulty: RoutineDifficulty;
  objective: RoutineObjective;
  customName: string | null;
  displayName: string;
  savedAt: string;
  savedAtLabel: string;
  updatedAt: string;
  updatedAtLabel: string;
  days: RoutineDay[];
};

type RoutineDayRow = {
  id: string;
  day_order: number;
  day_name: string | null;
  routine_items: RoutineItemRow[] | null;
};

type RoutineItemRow = {
  id: string;
  exercise_id: string;
  series: number;
  repetitions: string;
  rir: number;
  rest: string;
  row_order: number;
  exercise: ExerciseRow | ExerciseRow[] | null;
};

type ExerciseRow = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  muscle_group: string | null;
  equipment: string | null;
  video_url: string | null;
  min_reps: number | null;
  max_reps: number | null;
  steps: string[];
  tips: string[];
};

type RoutineTemplateSummaryRow = {
  id: string;
  name: string;
  description: string | null;
  difficulty: RoutineDifficulty;
  objective: RoutineObjective;
  routine_days: Array<{
    id: string;
    day_order: number;
    routine_items: Array<{
      id: string;
      row_order: number;
      exercise: ExerciseRow | ExerciseRow[] | null;
    }> | null;
  }> | null;
};

type RoutineTemplateDetailRow = {
  id: string;
  name: string;
  description: string | null;
  difficulty: RoutineDifficulty;
  objective: RoutineObjective;
  routine_days: RoutineDayRow[] | null;
};

type SavedRoutineListRow = {
  id: string;
  routine_template_id: string;
  custom_name: string | null;
  is_active: boolean;
  saved_at: string;
  updated_at: string;
  routine_template: RoutineTemplateSummaryRow | RoutineTemplateSummaryRow[] | null;
};

type SavedRoutineDetailRow = {
  id: string;
  routine_template_id: string;
  custom_name: string | null;
  saved_at: string;
  updated_at: string;
  routine_template: RoutineTemplateDetailRow | RoutineTemplateDetailRow[] | null;
};

const SAVED_ROUTINE_LIST_SELECT = `
  id,
  routine_template_id,
  custom_name,
  is_active,
  saved_at,
  updated_at,
  routine_template:routine_templates!saved_routines_routine_template_id_fkey (
    id,
    name,
    description,
    difficulty,
    objective,
    routine_days (
      id,
      day_order,
      routine_items (
        id,
        row_order,
        exercise:exercises!routine_items_exercise_id_fkey (
          id,
          name,
          description,
          image_url,
          muscle_group,
          equipment,
          video_url,
          min_reps,
          max_reps,
          steps,
          tips
        )
      )
    )
  )
`;

const SAVED_ROUTINE_DETAIL_SELECT = `
  id,
  routine_template_id,
  custom_name,
  saved_at,
  updated_at,
  routine_template:routine_templates!saved_routines_routine_template_id_fkey (
    id,
    name,
    description,
    difficulty,
    objective,
    routine_days (
      id,
      day_order,
      day_name,
      routine_items (
        id,
        exercise_id,
        series,
        repetitions,
        rir,
        rest,
        row_order,
        exercise:exercises!routine_items_exercise_id_fkey (
          id,
          name,
          description,
          image_url,
          muscle_group,
          equipment,
          video_url,
          min_reps,
          max_reps,
          steps,
          tips
        )
      )
    )
  )
`;

export async function listSavedRoutinesForUser(userId: string): Promise<SavedRoutineListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("saved_routines")
    .select(SAVED_ROUTINE_LIST_SELECT)
    .eq("user_id", userId)
    .order("is_active", { ascending: false })
    .order("saved_at", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron listar las rutinas guardadas: ${error.message}`);
  }

  return ((data ?? []) as unknown as SavedRoutineListRow[]).map(mapSavedRoutineListItem);
}

export async function getSavedRoutineByIdForUser(args: {
  savedRoutineId: string;
  userId: string;
}): Promise<SavedRoutineDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("saved_routines")
    .select(SAVED_ROUTINE_DETAIL_SELECT)
    .eq("id", args.savedRoutineId)
    .eq("user_id", args.userId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer la rutina guardada: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapSavedRoutineDetail(data as unknown as SavedRoutineDetailRow);
}

export async function getSavedRoutineByTemplateForUser(args: {
  routineTemplateId: string;
  userId: string;
}): Promise<SavedRoutineListItem | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("saved_routines")
    .select(SAVED_ROUTINE_LIST_SELECT)
    .eq("routine_template_id", args.routineTemplateId)
    .eq("user_id", args.userId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo consultar si la rutina ya estaba guardada: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapSavedRoutineListItem(data as unknown as SavedRoutineListRow);
}

export async function saveRoutineForUser(args: {
  routineTemplateId: string;
  userId: string;
  customName?: string | null;
}): Promise<
  | { status: "created"; routine: SavedRoutineListItem }
  | { status: "already-saved"; routine: SavedRoutineListItem }
> {
  const supabase = await createSupabaseServerClient();
  const hasActiveRoutine = await hasActiveSavedRoutineForUser(args.userId);
  const normalizedCustomName = normalizeCustomName(args.customName);
  const existing = await getSavedRoutineByTemplateForUser({
    routineTemplateId: args.routineTemplateId,
    userId: args.userId,
  });

  if (existing) {
    return {
      status: "already-saved",
      routine: existing,
    };
  }

  const { data, error } = await supabase
    .from("saved_routines")
    .insert({
      user_id: args.userId,
      routine_template_id: args.routineTemplateId,
      custom_name: normalizedCustomName,
      is_active: !hasActiveRoutine,
    })
    .select(SAVED_ROUTINE_LIST_SELECT)
    .single();

  if (error) {
    if (error.code === "23505") {
      const duplicate = await getSavedRoutineByTemplateForUser({
        routineTemplateId: args.routineTemplateId,
        userId: args.userId,
      });

      if (duplicate) {
        return {
          status: "already-saved",
          routine: duplicate,
        };
      }
    }

    throw new Error(`No se pudo guardar la rutina: ${error.message}`);
  }

  return {
    status: "created",
    routine: mapSavedRoutineListItem(data as unknown as SavedRoutineListRow),
  };
}

export async function renameSavedRoutineForUser(args: {
  savedRoutineId: string;
  userId: string;
  customName?: string | null;
}): Promise<SavedRoutineListItem | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("saved_routines")
    .update({
      custom_name: normalizeCustomName(args.customName),
    })
    .eq("id", args.savedRoutineId)
    .eq("user_id", args.userId)
    .select(SAVED_ROUTINE_LIST_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo renombrar la rutina guardada: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapSavedRoutineListItem(data as unknown as SavedRoutineListRow);
}

export async function setSavedRoutineActiveForUser(args: {
  savedRoutineId: string;
  userId: string;
}): Promise<SavedRoutineListItem | null> {
  const supabase = await createSupabaseServerClient();
  const existing = await getSavedRoutineByIdForUser({
    savedRoutineId: args.savedRoutineId,
    userId: args.userId,
  });

  if (!existing) {
    return null;
  }

  const { error: clearError } = await supabase
    .from("saved_routines")
    .update({ is_active: false })
    .eq("user_id", args.userId)
    .eq("is_active", true);

  if (clearError) {
    throw new Error(`No se pudo limpiar la rutina activa: ${clearError.message}`);
  }

  const { data, error } = await supabase
    .from("saved_routines")
    .update({ is_active: true })
    .eq("id", args.savedRoutineId)
    .eq("user_id", args.userId)
    .select(SAVED_ROUTINE_LIST_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo marcar la rutina como activa: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapSavedRoutineListItem(data as unknown as SavedRoutineListRow);
}

export async function toggleSavedRoutineActiveForUser(args: {
  savedRoutineId: string;
  userId: string;
}): Promise<
  | { status: "activated"; routine: SavedRoutineListItem }
  | { status: "deactivated"; routine: null }
  | null
> {
  const supabase = await createSupabaseServerClient();
  const { data: existing, error: existingError } = await supabase
    .from("saved_routines")
    .select("id, is_active")
    .eq("id", args.savedRoutineId)
    .eq("user_id", args.userId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`No se pudo consultar la rutina activa: ${existingError.message}`);
  }

  if (!existing) {
    return null;
  }

  if (existing.is_active) {
    const { error } = await supabase
      .from("saved_routines")
      .update({ is_active: false })
      .eq("id", args.savedRoutineId)
      .eq("user_id", args.userId);

    if (error) {
      throw new Error(`No se pudo desactivar la rutina: ${error.message}`);
    }

    return { status: "deactivated", routine: null };
  }

  const routine = await setSavedRoutineActiveForUser(args);

  return routine ? { status: "activated", routine } : null;
}

export async function deleteSavedRoutineForUser(args: {
  savedRoutineId: string;
  userId: string;
}): Promise<{ deleted: boolean; wasActive: boolean }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("saved_routines")
    .delete()
    .eq("id", args.savedRoutineId)
    .eq("user_id", args.userId)
    .select("id, is_active")
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo borrar la rutina guardada: ${error.message}`);
  }

  if (!data) {
    return { deleted: false, wasActive: false };
  }

  if (data.is_active) {
    await activateFirstSavedRoutineForUser(args.userId);
  }

  return { deleted: true, wasActive: data.is_active };
}

async function hasActiveSavedRoutineForUser(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("saved_routines")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo consultar la rutina activa: ${error.message}`);
  }

  return Boolean(data);
}

async function activateFirstSavedRoutineForUser(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("saved_routines")
    .select("id")
    .eq("user_id", userId)
    .order("saved_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo buscar la siguiente rutina activa: ${error.message}`);
  }

  if (!data) {
    return;
  }

  const { error: updateError } = await supabase
    .from("saved_routines")
    .update({ is_active: true })
    .eq("id", data.id)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(`No se pudo activar la siguiente rutina: ${updateError.message}`);
  }
}

function mapSavedRoutineListItem(row: SavedRoutineListRow): SavedRoutineListItem {
  const template = unwrapTemplate(row.routine_template, row.id);
  const dayCount = template.routine_days?.length ?? 0;
  const itemCount = (template.routine_days ?? []).reduce(
    (total, day) => total + (day.routine_items?.length ?? 0),
    0,
  );

  return {
    id: row.id,
    routineTemplateId: row.routine_template_id,
    templateName: template.name,
    templateDescription: template.description ?? "",
    difficulty: template.difficulty,
    objective: template.objective,
    coverImageUrl: resolveCoverImageUrl(template),
    customName: normalizeCustomName(row.custom_name),
    displayName: resolveDisplayName(row.custom_name, template.name),
    isActive: row.is_active,
    savedAt: row.saved_at,
    savedAtLabel: formatDateLabel(row.saved_at),
    updatedAt: row.updated_at,
    updatedAtLabel: formatDateLabel(row.updated_at),
    dayCount,
    itemCount,
  };
}

function resolveCoverImageUrl(template: RoutineTemplateSummaryRow) {
  const sortedDays = [...(template.routine_days ?? [])].sort(
    (left, right) => left.day_order - right.day_order,
  );

  for (const day of sortedDays) {
    const sortedItems = [...(day.routine_items ?? [])].sort(
      (left, right) => left.row_order - right.row_order,
    );

    for (const item of sortedItems) {
      const exercise = Array.isArray(item.exercise) ? item.exercise[0] : item.exercise;

      if (exercise?.image_url) {
        return exercise.image_url;
      }
    }
  }

  return "";
}

function mapSavedRoutineDetail(row: SavedRoutineDetailRow): SavedRoutineDetail {
  const template = unwrapTemplate(row.routine_template, row.id);
  const days = [...(template.routine_days ?? [])]
    .sort((left, right) => left.day_order - right.day_order)
    .map((day) => ({
      id: day.id,
      dayOrder: day.day_order,
      dayName: day.day_name?.trim() || `Dia ${day.day_order}`,
      items: [...(day.routine_items ?? [])]
        .sort((left, right) => left.row_order - right.row_order)
        .map((item) => ({
          id: item.id,
          exerciseId: item.exercise_id,
          series: item.series,
          repetitions: item.repetitions,
          rir: item.rir,
          rest: item.rest,
          rowOrder: item.row_order,
          exercise: mapExercise(item),
        })),
    }));

  return {
    id: row.id,
    routineTemplateId: row.routine_template_id,
    templateName: template.name,
    templateDescription: template.description ?? "",
    difficulty: template.difficulty,
    objective: template.objective,
    customName: normalizeCustomName(row.custom_name),
    displayName: resolveDisplayName(row.custom_name, template.name),
    savedAt: row.saved_at,
    savedAtLabel: formatDateLabel(row.saved_at),
    updatedAt: row.updated_at,
    updatedAtLabel: formatDateLabel(row.updated_at),
    days,
  };
}

function unwrapTemplate<T extends { id: string; name: string }>(
  template: T | T[] | null,
  savedRoutineId: string,
) {
  const resolved = Array.isArray(template) ? (template[0] ?? null) : template;

  if (!resolved) {
    throw new Error(
      `La rutina guardada ${savedRoutineId} referencia una plantilla inexistente o inaccesible.`,
    );
  }

  return resolved;
}

function mapExercise(item: RoutineItemRow): RoutineExerciseRef {
  const exercise = Array.isArray(item.exercise) ? (item.exercise[0] ?? null) : item.exercise;

  if (!exercise) {
    throw new Error(`La fila ${item.id} referencia un ejercicio inexistente o inaccesible.`);
  }

  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    imageUrl: exercise.image_url,
    muscleGroup: exercise.muscle_group,
    equipment: exercise.equipment,
    videoUrl: exercise.video_url,
    minReps: exercise.min_reps,
    maxReps: exercise.max_reps,
    steps: exercise.steps,
    tips: exercise.tips,
  };
}

function resolveDisplayName(customName: string | null, templateName: string) {
  return normalizeCustomName(customName) ?? templateName;
}

function normalizeCustomName(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
