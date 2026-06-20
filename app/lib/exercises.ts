import "server-only";

import { createSupabaseServerClient } from "@/app/lib/supabase/server";

export type ExerciseCatalogItem = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  muscleGroup: string | null;
  equipment: string | null;
  videoUrl: string | null;
  exerciseDbId: string | null;
  minReps: number | null;
  maxReps: number | null;
  steps: string[];
  tips: string[];
};

export type AdminExerciseListItem = ExerciseCatalogItem & {
  createdAt: string;
  createdAtLabel: string;
};

type ExerciseRow = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  created_at: string;
  muscle_group: string | null;
  equipment: string | null;
  video_url: string | null;
  exercisedb_id: string | null;
  min_reps: number | null;
  max_reps: number | null;
  steps: string[];
  tips: string[];
};

export async function listAdminExercises(): Promise<AdminExerciseListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("exercises")
    .select(
      "id, name, description, image_url, created_at, muscle_group, equipment, video_url, exercisedb_id, min_reps, max_reps, steps, tips",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudo listar ejercicios: ${error.message}`);
  }

  return ((data ?? []) as ExerciseRow[]).map((exercise) => ({
    ...mapExerciseCatalogItem(exercise),
    createdAt: exercise.created_at,
    createdAtLabel: formatExerciseDate(exercise.created_at),
  }));
}

export async function listExerciseCatalogItems(): Promise<ExerciseCatalogItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name, description, image_url, muscle_group, equipment, video_url, exercisedb_id, min_reps, max_reps, steps, tips")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudo leer el catalogo de ejercicios: ${error.message}`);
  }

  return (data ?? []).map((exercise) => mapExerciseCatalogItem(exercise as ExerciseRow));
}

export async function getExerciseById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("exercises")
    .select(
      "id, name, description, image_url, created_at, muscle_group, equipment, video_url, exercisedb_id, min_reps, max_reps, steps, tips",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer el ejercicio: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const exercise = data as ExerciseRow;

  return {
    ...mapExerciseCatalogItem(exercise),
    createdAt: exercise.created_at,
    createdAtLabel: formatExerciseDate(exercise.created_at),
  };
}

type CreateExerciseInput = {
  name: string;
  description: string;
  imageUrl: string;
  muscleGroup: string | null;
  equipment: string | null;
  videoUrl: string | null;
  minReps: number | null;
  maxReps: number | null;
  steps: string[];
  tips: string[];
  createdBy: string;
};

export async function createExercise(input: CreateExerciseInput) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("exercises").insert({
    name: input.name,
    description: input.description,
    image_url: input.imageUrl,
    muscle_group: input.muscleGroup,
    equipment: input.equipment,
    video_url: input.videoUrl,
    min_reps: input.minReps,
    max_reps: input.maxReps,
    steps: input.steps,
    tips: input.tips,
    created_by: input.createdBy,
  });

  if (error) {
    throw new Error(`No se pudo crear el ejercicio: ${error.message}`);
  }
}

type UpdateExerciseInput = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  muscleGroup: string | null;
  equipment: string | null;
  videoUrl: string | null;
  minReps: number | null;
  maxReps: number | null;
  steps: string[];
  tips: string[];
};

export async function updateExercise(input: UpdateExerciseInput) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("exercises")
    .update({
      name: input.name,
      description: input.description,
      image_url: input.imageUrl,
      muscle_group: input.muscleGroup,
      equipment: input.equipment,
      video_url: input.videoUrl,
      min_reps: input.minReps,
      max_reps: input.maxReps,
      steps: input.steps,
      tips: input.tips,
    })
    .eq("id", input.id);

  if (error) {
    throw new Error(`No se pudo actualizar el ejercicio: ${error.message}`);
  }
}

export async function deleteExercise(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("exercises").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "No se puede eliminar: el ejercicio esta en uso en una o mas rutinas. Quitalo de esas rutinas antes de borrarlo.",
      );
    }

    throw new Error(`No se pudo eliminar el ejercicio: ${error.message}`);
  }
}

function mapExerciseCatalogItem(
  exercise: Pick<
    ExerciseRow,
    | "id"
    | "name"
    | "description"
    | "image_url"
    | "muscle_group"
    | "equipment"
    | "video_url"
    | "exercisedb_id"
    | "min_reps"
    | "max_reps"
    | "steps"
    | "tips"
  >,
): ExerciseCatalogItem {
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    imageUrl: exercise.image_url,
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

function formatExerciseDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
