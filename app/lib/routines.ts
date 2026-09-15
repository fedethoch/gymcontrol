import "server-only";

import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

import type { ExerciseCatalogItem } from "@/app/lib/exercises";
import type { RoutineWriteInput } from "@/app/lib/routine-form";
import type { RoutineDifficulty, RoutineObjective } from "@/app/lib/routine-metadata";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";

export type RoutineExerciseRef = ExerciseCatalogItem;

export type RoutineItem = {
  id: string;
  exerciseId: string;
  series: number;
  repetitions: string;
  rir: number;
  rest: string;
  rowOrder: number;
  exercise: RoutineExerciseRef;
};

export type RoutineDay = {
  id: string;
  dayOrder: number;
  dayName: string;
  items: RoutineItem[];
};

export type RoutineTemplate = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  difficulty: RoutineDifficulty;
  objective: RoutineObjective;
  archivedAt: string | null;
  days: RoutineDay[];
};

export type AdminRoutineListItem = RoutineTemplate & {
  createdAt: string;
  createdAtLabel: string;
  dayCount: number;
  itemCount: number;
  usersCount: number;
};

function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

type RoutineRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  difficulty: RoutineDifficulty;
  objective: RoutineObjective;
  created_at: string;
  archived_at: string | null;
  routine_days: RoutineDayRow[] | null;
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
  gif_url: string | null;
  muscle_group: string | null;
  equipment: string | null;
  video_url: string | null;
  exercisedb_id: string | null;
  min_reps: number | null;
  max_reps: number | null;
  steps: string[];
  tips: string[];
};

type SaveRoutineInput = RoutineWriteInput & {
  id?: string;
};

type RoutineUsageRow = {
  routine_template_id: string;
  saved_count: number;
};

/** Errores con mensaje propio lanzados por `admin_save_routine`. */
const SAVE_ROUTINE_USER_ERROR_CODES = new Set(["P0002", "22023", "42501"]);

const ROUTINE_SELECT = `
  id,
  name,
  description,
  image_url,
  difficulty,
  objective,
  created_at,
  archived_at,
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
        gif_url,
        muscle_group,
        equipment,
        video_url,
        exercisedb_id,
        min_reps,
        max_reps,
        steps,
        tips
      )
    )
  )
`;

export async function listAdminRoutines(): Promise<AdminRoutineListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("routine_templates")
    .select(ROUTINE_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudo listar rutinas: ${error.message}`);
  }

  // saved_routines es owner-only: el conteo real sale de una función que solo devuelve agregados.
  const { data: usage, error: usageError } = await supabase.rpc("routine_template_usage");

  if (usageError) {
    throw new Error(`No se pudo contar usuarios por rutina: ${usageError.message}`);
  }

  const usersCountByRoutineId = new Map(
    ((usage ?? []) as RoutineUsageRow[]).map((row) => [row.routine_template_id, row.saved_count]),
  );

  return ((data ?? []) as unknown as RoutineRow[]).map((routine) => {
    const mapped = mapRoutineTemplate(routine);

    return {
      ...mapped,
      createdAt: routine.created_at,
      createdAtLabel: formatRoutineDate(routine.created_at),
      dayCount: mapped.days.length,
      itemCount: mapped.days.reduce((total, day) => total + day.items.length, 0),
      usersCount: usersCountByRoutineId.get(routine.id) ?? 0,
    };
  });
}

export const listRoutineTemplates = unstable_cache(
  async (): Promise<RoutineTemplate[]> => {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("routine_templates")
      .select(ROUTINE_SELECT)
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`No se pudo listar las rutinas reutilizables: ${error.message}`);
    }

    return ((data ?? []) as unknown as RoutineRow[]).map(mapRoutineTemplate);
  },
  ["routine-templates"],
  { revalidate: 3600, tags: ["routines"] },
);

export async function getRoutineById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("routine_templates")
    .select(ROUTINE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer la rutina: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapRoutineTemplate(data as unknown as RoutineRow);
}

/**
 * Crea o actualiza plantilla, días y filas en una transacción (`admin_save_routine`).
 * Los días y filas con `id` existente se actualizan en lugar de recrearse: el historial de los usuarios no se pierde.
 */
export async function saveRoutine(input: SaveRoutineInput) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_save_routine", {
    p_routine_id: input.id ?? null,
    p_name: input.name,
    p_description: input.description,
    p_difficulty: input.difficulty,
    p_objective: input.objective,
    p_days: input.days.map((day) => ({
      id: day.id ?? null,
      day_name: day.dayName,
      items: day.items.map((item) => ({
        id: item.id ?? null,
        exercise_id: item.exerciseId,
        series: item.series,
        repetitions: item.repetitions,
        rir: item.rir,
        rest: item.rest,
      })),
    })),
  });

  if (error) {
    throw new Error(
      SAVE_ROUTINE_USER_ERROR_CODES.has(error.code)
        ? error.message
        : `No se pudo guardar la rutina: ${error.message}`,
    );
  }
}

/**
 * Borra la plantilla si nadie la guardó. Si hay usuarios (FK restrict), la archiva:
 * sale del catálogo y quienes la usan la conservan con su historial.
 */
export async function deleteRoutine(id: string): Promise<{ archived: boolean }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("routine_templates").delete().eq("id", id);

  if (!error) {
    return { archived: false };
  }

  if (error.code !== "23503") {
    throw new Error(`No se pudo eliminar la rutina: ${error.message}`);
  }

  const { error: archiveError } = await supabase
    .from("routine_templates")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);

  if (archiveError) {
    throw new Error(`No se pudo archivar la rutina: ${archiveError.message}`);
  }

  return { archived: true };
}

export async function restoreRoutine(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("routine_templates")
    .update({ archived_at: null })
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo restaurar la rutina: ${error.message}`);
  }
}

function mapRoutineTemplate(routine: RoutineRow): RoutineTemplate {
  const days = [...(routine.routine_days ?? [])]
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
          exercise: mapRoutineExercise(item),
        })),
    }));

  return {
    id: routine.id,
    name: routine.name,
    description: routine.description ?? "",
    imageUrl: routine.image_url ?? "",
    difficulty: routine.difficulty,
    objective: routine.objective,
    archivedAt: routine.archived_at,
    days,
  };
}

function mapRoutineExercise(item: RoutineItemRow): RoutineExerciseRef {
  const exercise = Array.isArray(item.exercise)
    ? item.exercise[0] ?? null
    : item.exercise;

  if (!exercise) {
    throw new Error(
      `La fila ${item.id} referencia un ejercicio inexistente o inaccesible.`,
    );
  }

  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    imageUrl: exercise.image_url || "",
    gifUrl: exercise.gif_url ?? null,
    muscleGroup: exercise.muscle_group,
    equipment: exercise.equipment,
    videoUrl: exercise.video_url,
    exerciseDbId: exercise.exercisedb_id,
    minReps: exercise.min_reps,
    maxReps: exercise.max_reps,
    steps: exercise.steps,
    tips: exercise.tips,
  };
}

function formatRoutineDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
