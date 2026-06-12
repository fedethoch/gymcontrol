import { z } from "zod";

import {
  EXERCISE_IMAGE_BUCKET,
  EXERCISE_IMAGE_ALLOWED_EXTENSIONS,
  EXERCISE_IMAGE_ALLOWED_MIME_TYPES,
  EXERCISE_IMAGE_MAX_SIZE_BYTES,
} from "@/app/lib/exercise-config";
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
    },
  };
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
