import "server-only";

import { createSupabaseServerClient } from "@/app/lib/supabase/server";

export type ExerciseCatalogItem = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
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
};

export async function listAdminExercises(): Promise<AdminExerciseListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name, description, image_url, created_at")
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
    .select("id, name, description, image_url")
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
    .select("id, name, description, image_url, created_at")
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
  createdBy: string;
};

export async function createExercise(input: CreateExerciseInput) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("exercises").insert({
    name: input.name,
    description: input.description,
    image_url: input.imageUrl,
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
};

export async function updateExercise(input: UpdateExerciseInput) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("exercises")
    .update({
      name: input.name,
      description: input.description,
      image_url: input.imageUrl,
    })
    .eq("id", input.id);

  if (error) {
    throw new Error(`No se pudo actualizar el ejercicio: ${error.message}`);
  }
}

function mapExerciseCatalogItem(exercise: Pick<ExerciseRow, "id" | "name" | "description" | "image_url">): ExerciseCatalogItem {
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    imageUrl: exercise.image_url,
  };
}

function formatExerciseDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
