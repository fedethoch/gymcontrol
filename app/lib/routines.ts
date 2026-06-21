import "server-only";

import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

import type { ExerciseCatalogItem } from "@/app/lib/exercises";
import type { RoutineDayWriteInput, RoutineWriteInput } from "@/app/lib/routine-form";
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
  days: RoutineDay[];
};

export type AdminRoutineListItem = RoutineTemplate & {
  createdAt: string;
  createdAtLabel: string;
  dayCount: number;
  itemCount: number;
  usersCount: number;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

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
  muscle_group: string | null;
  equipment: string | null;
  video_url: string | null;
  exercisedb_id: string | null;
  min_reps: number | null;
  max_reps: number | null;
  steps: string[];
  tips: string[];
};

type CreateRoutineInput = RoutineWriteInput & {
  createdBy: string;
};

type UpdateRoutineInput = RoutineWriteInput & {
  id: string;
};

const ROUTINE_SELECT = `
  id,
  name,
  description,
  image_url,
  difficulty,
  objective,
  created_at,
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

  const { data: savedRoutines, error: savedError } = await supabase
    .from("saved_routines")
    .select("routine_template_id");

  if (savedError) {
    throw new Error(`No se pudo contar usuarios por rutina: ${savedError.message}`);
  }

  const usersCountByRoutineId = new Map<string, number>();

  for (const row of (savedRoutines ?? []) as { routine_template_id: string }[]) {
    usersCountByRoutineId.set(
      row.routine_template_id,
      (usersCountByRoutineId.get(row.routine_template_id) ?? 0) + 1,
    );
  }

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

export async function createRoutine(input: CreateRoutineInput) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("routine_templates")
    .insert({
      name: input.name,
      description: input.description || null,
      image_url: null,
      difficulty: input.difficulty,
      objective: input.objective,
      created_by: input.createdBy,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`No se pudo crear la rutina: ${error?.message ?? "sin id"}`);
  }

  try {
    await insertRoutineChildren(supabase, data.id, input.days);
  } catch (error) {
    await supabase.from("routine_templates").delete().eq("id", data.id);
    throw error;
  }
}

export async function updateRoutine(input: UpdateRoutineInput) {
  const supabase = await createSupabaseServerClient();
  const previousRoutine = await getRoutineById(input.id);

  if (!previousRoutine) {
    throw new Error("La rutina que intentas editar ya no existe.");
  }

  try {
    const { error } = await supabase
      .from("routine_templates")
      .update({
        name: input.name,
        description: input.description || null,
        image_url: previousRoutine.imageUrl || null,
        difficulty: input.difficulty,
        objective: input.objective,
      })
      .eq("id", input.id);

    if (error) {
      throw new Error(`No se pudo actualizar la rutina: ${error.message}`);
    }

    await replaceRoutineChildren(supabase, input.id, input.days);
  } catch (error) {
    try {
      await restoreRoutineSnapshot(supabase, previousRoutine);
    } catch (restoreError) {
      const originalMessage =
        error instanceof Error ? error.message : "No se pudo actualizar la rutina.";
      const restoreMessage =
        restoreError instanceof Error
          ? restoreError.message
          : "No se pudo restaurar la rutina.";

      throw new Error(`${originalMessage} Ademas, fallo la restauracion: ${restoreMessage}`);
    }

    throw error;
  }
}

export async function deleteRoutine(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("routine_templates").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "No se puede eliminar: la rutina esta en uso por usuarios que la guardaron o activaron.",
      );
    }

    throw new Error(`No se pudo eliminar la rutina: ${error.message}`);
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

async function replaceRoutineChildren(
  supabase: SupabaseServerClient,
  routineId: string,
  days: RoutineDayWriteInput[],
) {
  const { error: deleteError } = await supabase
    .from("routine_days")
    .delete()
    .eq("routine_id", routineId);

  if (deleteError) {
    throw new Error(`No se pudo reemplazar la estructura de dias: ${deleteError.message}`);
  }

  await insertRoutineChildren(supabase, routineId, days);
}

async function insertRoutineChildren(
  supabase: SupabaseServerClient,
  routineId: string,
  days: RoutineDayWriteInput[],
) {
  const dayIdByOrder = new Map<number, string>();
  const dayRows = days.map((day) => {
    const dayId = crypto.randomUUID();
    dayIdByOrder.set(day.dayOrder, dayId);

    return {
      id: dayId,
      routine_id: routineId,
      day_order: day.dayOrder,
      day_name: day.dayName,
    };
  });

  if (dayRows.length > 0) {
    const { error: dayError } = await supabase.from("routine_days").insert(dayRows);

    if (dayError) {
      throw new Error(`No se pudieron guardar los dias: ${dayError.message}`);
    }
  }

  const itemRows = days.flatMap((day) =>
    day.items.map((item) => ({
      id: crypto.randomUUID(),
      routine_day_id: dayIdByOrder.get(day.dayOrder)!,
      exercise_id: item.exerciseId,
      series: item.series,
      repetitions: item.repetitions,
      rir: item.rir,
      rest: item.rest,
      row_order: item.rowOrder,
    })),
  );

  if (itemRows.length > 0) {
    const { error: itemError } = await supabase.from("routine_items").insert(itemRows);

    if (itemError) {
      throw new Error(`No se pudieron guardar las filas: ${itemError.message}`);
    }
  }
}

async function restoreRoutineSnapshot(
  supabase: SupabaseServerClient,
  routine: RoutineTemplate,
) {
  const { error: updateError } = await supabase
    .from("routine_templates")
    .update({
      name: routine.name,
      description: routine.description || null,
      image_url: routine.imageUrl || null,
      difficulty: routine.difficulty,
      objective: routine.objective,
    })
    .eq("id", routine.id);

  if (updateError) {
    throw new Error(
      `No se pudo restaurar la rutina tras un error de guardado: ${updateError.message}`,
    );
  }

  const { error: deleteError } = await supabase
    .from("routine_days")
    .delete()
    .eq("routine_id", routine.id);

  if (deleteError) {
    throw new Error(
      `No se pudo restaurar la estructura de la rutina: ${deleteError.message}`,
    );
  }

  await insertRoutineChildren(
    supabase,
    routine.id,
    routine.days.map((day) => ({
      dayOrder: day.dayOrder,
      dayName: day.dayName,
      items: day.items.map((item) => ({
        exerciseId: item.exerciseId,
        series: item.series,
        repetitions: item.repetitions,
        rir: item.rir,
        rest: item.rest,
        rowOrder: item.rowOrder,
      })),
    })),
  );
}

function formatRoutineDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
