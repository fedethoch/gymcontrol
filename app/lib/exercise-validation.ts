import { z } from "zod";

import {
  EXERCISE_IMAGE_BUCKET,
  EXERCISE_IMAGE_ALLOWED_EXTENSIONS,
  EXERCISE_IMAGE_ALLOWED_MIME_TYPES,
  EXERCISE_IMAGE_MAX_SIZE_BYTES,
} from "@/app/lib/exercise-config";
import {
  EXERCISE_EQUIPMENT_OPTIONS,
  EXERCISE_MUSCLE_GROUPS,
} from "@/app/lib/exercise-form";
import type { ExerciseFormPayload, ExerciseFormState } from "@/app/lib/exercise-form";

const exerciseTextSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingresa un nombre.")
    .max(80, "El nombre no puede superar 80 caracteres."),
  description: z
    .string()
    .trim()
    .min(1, "Ingresa una descripcion.")
    .max(600, "La descripcion no puede superar 600 caracteres."),
});

type ParseExercisePayloadOptions = {
  payload: ExerciseFormPayload;
  requiresImage: boolean;
  supabaseUrl: string;
};

type ParsedExercisePayload = {
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

type ExerciseImageValidationResult = {
  ok: true;
} | {
  ok: false;
  message: string;
};

export function validateExerciseImageFile(file: File): ExerciseImageValidationResult {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (
    !file.type ||
    !EXERCISE_IMAGE_ALLOWED_MIME_TYPES.includes(
      file.type as (typeof EXERCISE_IMAGE_ALLOWED_MIME_TYPES)[number],
    ) ||
    !extension ||
    !EXERCISE_IMAGE_ALLOWED_EXTENSIONS.includes(
      extension as (typeof EXERCISE_IMAGE_ALLOWED_EXTENSIONS)[number],
    )
  ) {
    return {
      ok: false,
      message: "Usa un archivo JPG, PNG o WEBP.",
    };
  }

  if (file.size > EXERCISE_IMAGE_MAX_SIZE_BYTES) {
    return {
      ok: false,
      message: "La imagen no puede superar 5 MB.",
    };
  }

  return { ok: true };
}

export function parseExercisePayload({
  payload,
  requiresImage,
  supabaseUrl,
}: ParseExercisePayloadOptions):
  | { ok: true; data: ParsedExercisePayload }
  | { ok: false; state: ExerciseFormState } {
  const textResult = exerciseTextSchema.safeParse({
    name: payload.name,
    description: payload.description,
  });
  const fieldErrors: ExerciseFormState["fieldErrors"] = {};
  let parsedText: z.infer<typeof exerciseTextSchema> | null = null;

  if (!textResult.success) {
    const flattened = textResult.error.flatten().fieldErrors;

    if (flattened.name?.[0]) {
      fieldErrors.name = flattened.name[0];
    }

    if (flattened.description?.[0]) {
      fieldErrors.description = flattened.description[0];
    }
  } else {
    parsedText = textResult.data;
  }

  const normalizedImageUrl = payload.imageUrl.trim();

  if (!normalizedImageUrl) {
    if (requiresImage) {
      fieldErrors.imageUrl = "Sube una imagen.";
    }
  } else if (!isExerciseStorageUrl(normalizedImageUrl, supabaseUrl)) {
    fieldErrors.imageUrl = "La imagen debe provenir del bucket de ejercicios.";
  }

  const normalizedMuscleGroup = payload.muscleGroup.trim();
  let muscleGroup: string | null = null;

  if (normalizedMuscleGroup) {
    if (!EXERCISE_MUSCLE_GROUPS.includes(normalizedMuscleGroup as never)) {
      fieldErrors.muscleGroup = "Selecciona un grupo muscular valido.";
    } else {
      muscleGroup = normalizedMuscleGroup;
    }
  }

  const normalizedEquipment = payload.equipment.trim();
  let equipment: string | null = null;

  if (normalizedEquipment) {
    if (!EXERCISE_EQUIPMENT_OPTIONS.includes(normalizedEquipment as never)) {
      fieldErrors.equipment = "Selecciona un equipamiento valido.";
    } else {
      equipment = normalizedEquipment;
    }
  }

  const normalizedVideoUrl = payload.videoUrl.trim();
  let videoUrl: string | null = null;

  if (normalizedVideoUrl) {
    try {
      new URL(normalizedVideoUrl);
      videoUrl = normalizedVideoUrl;
    } catch {
      fieldErrors.videoUrl = "Ingresa una URL valida.";
    }
  }

  const { minReps, maxReps, error: repRangeError } = parseRepRange(payload.minReps, payload.maxReps);

  if (repRangeError) {
    fieldErrors.maxReps = repRangeError;
  }

  const steps = sanitizeTextList(payload.steps);
  const tips = sanitizeTextList(payload.tips);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      state: {
        status: "error",
        message: "Revisa los campos marcados.",
        fieldErrors,
      },
    };
  }

  return {
    ok: true,
    data: {
      name: parsedText!.name,
      description: parsedText!.description,
      imageUrl: normalizedImageUrl,
      muscleGroup,
      equipment,
      videoUrl,
      minReps,
      maxReps,
      steps,
      tips,
    },
  };
}

function sanitizeTextList(items: string[]): string[] {
  return items
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 20)
    .map((item) => item.slice(0, 300));
}

function parseRepRange(
  rawMinReps: string,
  rawMaxReps: string,
): { minReps: number | null; maxReps: number | null; error: string | null } {
  const normalizedMin = rawMinReps.trim();
  const normalizedMax = rawMaxReps.trim();

  if (!normalizedMin && !normalizedMax) {
    return { minReps: null, maxReps: null, error: null };
  }

  const minReps = Number(normalizedMin);
  const maxReps = Number(normalizedMax);

  if (
    !normalizedMin ||
    !normalizedMax ||
    !Number.isInteger(minReps) ||
    !Number.isInteger(maxReps) ||
    minReps < 1 ||
    maxReps < 1
  ) {
    return { minReps: null, maxReps: null, error: "Ingresa un rango de reps valido." };
  }

  if (minReps > maxReps) {
    return { minReps: null, maxReps: null, error: "El minimo no puede ser mayor que el maximo." };
  }

  return { minReps, maxReps, error: null };
}

function isExerciseStorageUrl(imageUrl: string, supabaseUrl: string) {
  try {
    const targetUrl = new URL(imageUrl);
    const projectUrl = new URL(supabaseUrl);

    return (
      targetUrl.origin === projectUrl.origin &&
      targetUrl.pathname.startsWith(
        `/storage/v1/object/public/${EXERCISE_IMAGE_BUCKET}/`,
      )
    );
  } catch {
    return false;
  }
}
