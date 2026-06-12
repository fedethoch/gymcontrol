import { z } from "zod";

import type {
  RoutineDayWriteInput,
  RoutineFormDayPayload,
  RoutineFormPayload,
  RoutineFormState,
  RoutineFormItemPayload,
  RoutineItemFormField,
  RoutineItemWriteInput,
  RoutineWriteInput,
} from "@/app/lib/routine-form";
import {
  ROUTINE_DIFFICULTIES,
  ROUTINE_OBJECTIVES,
} from "@/app/lib/routine-metadata";

const routineTextSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingresa un nombre.")
    .max(80, "El nombre no puede superar 80 caracteres."),
  description: z
    .string()
    .trim()
    .max(600, "La descripcion no puede superar 600 caracteres."),
  difficulty: z.enum(ROUTINE_DIFFICULTIES, {
    message: "Selecciona una dificultad.",
  }),
  objective: z.enum(ROUTINE_OBJECTIVES, {
    message: "Selecciona un objetivo.",
  }),
});

const dayNameSchema = z
  .string()
  .trim()
  .min(1, "Ingresa un nombre para el dia.")
  .max(40, "El nombre del dia no puede superar 40 caracteres.");

const repetitionsSchema = z
  .string()
  .trim()
  .min(1, "Ingresa las repeticiones.")
  .max(40, "Las repeticiones no pueden superar 40 caracteres.");

const restSchema = z
  .string()
  .trim()
  .min(1, "Ingresa el descanso.")
  .max(40, "El descanso no puede superar 40 caracteres.");

type ParseRoutinePayloadOptions = {
  payload: RoutineFormPayload;
  validExerciseIds: Set<string>;
};

type ParseRoutinePayloadResult =
  | { ok: true; data: RoutineWriteInput }
  | { ok: false; state: RoutineFormState };

export function parseRoutinePayload({
  payload,
  validExerciseIds,
}: ParseRoutinePayloadOptions): ParseRoutinePayloadResult {
  const textResult = routineTextSchema.safeParse({
    name: payload.name,
    description: payload.description,
    difficulty: payload.difficulty,
    objective: payload.objective,
  });
  const fieldErrors: RoutineFormState["fieldErrors"] = {};
  const structureErrors: RoutineFormState["structureErrors"] = {
    dayErrors: {},
  };
  let parsedText: z.infer<typeof routineTextSchema> | null = null;

  if (!textResult.success) {
    const flattened = textResult.error.flatten().fieldErrors;

    if (flattened.name?.[0]) {
      fieldErrors.name = flattened.name[0];
    }

    if (flattened.description?.[0]) {
      fieldErrors.description = flattened.description[0];
    }

    if (flattened.difficulty?.[0]) {
      fieldErrors.difficulty = flattened.difficulty[0];
    }

    if (flattened.objective?.[0]) {
      fieldErrors.objective = flattened.objective[0];
    }
  } else {
    parsedText = textResult.data;
  }

  const parsedDays: RoutineDayWriteInput[] = [];
  const days = payload.days ?? [];

  if (days.length === 0) {
    structureErrors.days = "Agrega al menos un dia.";
  }

  days.forEach((day, dayIndex) => {
    const dayErrors = parseRoutineDay({
      day,
      dayIndex,
      validExerciseIds,
    });

    if (!dayErrors.ok) {
      structureErrors.dayErrors[day.clientId] = dayErrors.errors;
      return;
    }

    parsedDays.push(dayErrors.data);
  });

  if (Object.keys(fieldErrors).length > 0 || hasStructureErrors(structureErrors)) {
    return {
      ok: false,
      state: {
        status: "error",
        message: "Revisa la estructura de la rutina.",
        fieldErrors,
        structureErrors,
      },
    };
  }

  return {
    ok: true,
    data: {
      name: parsedText!.name,
      description: parsedText!.description,
      difficulty: parsedText!.difficulty,
      objective: parsedText!.objective,
      days: parsedDays,
    },
  };
}

function parseRoutineDay({
  day,
  dayIndex,
  validExerciseIds,
}: {
  day: RoutineFormDayPayload;
  dayIndex: number;
  validExerciseIds: Set<string>;
}) {
  const dayErrors: RoutineFormState["structureErrors"]["dayErrors"][string] = {
    itemErrors: {},
  };
  const dayNameResult = dayNameSchema.safeParse(day.dayName);
  const parsedDayName = dayNameResult.success ? dayNameResult.data : null;
  const parsedItems: RoutineItemWriteInput[] = [];

  if (!dayNameResult.success) {
    dayErrors.dayName = dayNameResult.error.issues[0]?.message;
  }

  if (day.items.length === 0) {
    dayErrors.items = "Agrega al menos una fila.";
  }

  day.items.forEach((item, itemIndex) => {
    const itemResult = parseRoutineItem({
      item,
      itemIndex,
      validExerciseIds,
    });

    if (!itemResult.ok) {
      dayErrors.itemErrors[item.clientId] = itemResult.errors;
      return;
    }

    parsedItems.push(itemResult.data);
  });

  if (dayErrors.dayName || dayErrors.items || Object.keys(dayErrors.itemErrors).length > 0) {
    return {
      ok: false as const,
      errors: dayErrors,
    };
  }

  return {
    ok: true as const,
    data: {
      dayOrder: dayIndex + 1,
      dayName: parsedDayName!,
      items: parsedItems,
    },
  };
}

function parseRoutineItem({
  item,
  itemIndex,
  validExerciseIds,
}: {
  item: RoutineFormItemPayload;
  itemIndex: number;
  validExerciseIds: Set<string>;
}) {
  const errors: Partial<Record<RoutineItemFormField, string>> = {};
  const exerciseId = item.exerciseId.trim();

  if (!exerciseId) {
    errors.exerciseId = "Selecciona un ejercicio.";
  } else if (!validExerciseIds.has(exerciseId)) {
    errors.exerciseId = "El ejercicio seleccionado ya no existe.";
  }

  const seriesResult = parsePositiveInteger(item.series, "Ingresa series.");
  const repetitionsResult = repetitionsSchema.safeParse(item.repetitions);
  const rirResult = parseNonNegativeInteger(item.rir, "Ingresa el RIR.");
  const restResult = restSchema.safeParse(item.rest);
  const parsedSeries = seriesResult.success ? seriesResult.value : null;
  const parsedRepetitions = repetitionsResult.success ? repetitionsResult.data : null;
  const parsedRir = rirResult.success ? rirResult.value : null;
  const parsedRest = restResult.success ? restResult.data : null;

  if (!seriesResult.success) {
    errors.series = seriesResult.message;
  }

  if (!repetitionsResult.success) {
    errors.repetitions = repetitionsResult.error.issues[0]?.message;
  }

  if (!rirResult.success) {
    errors.rir = rirResult.message;
  }

  if (!restResult.success) {
    errors.rest = restResult.error.issues[0]?.message;
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false as const,
      errors,
    };
  }

  return {
    ok: true as const,
    data: {
      exerciseId,
      series: parsedSeries!,
      repetitions: parsedRepetitions!,
      rir: parsedRir!,
      rest: parsedRest!,
      rowOrder: itemIndex + 1,
    },
  };
}

function parsePositiveInteger(value: string, requiredMessage: string) {
  const normalized = value.trim();

  if (!normalized) {
    return {
      success: false as const,
      message: requiredMessage,
    };
  }

  const parsed = Number(normalized);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return {
      success: false as const,
      message: "Debe ser un entero mayor a 0.",
    };
  }

  return {
    success: true as const,
    value: parsed,
  };
}

function parseNonNegativeInteger(value: string, requiredMessage: string) {
  const normalized = value.trim();

  if (!normalized) {
    return {
      success: false as const,
      message: requiredMessage,
    };
  }

  const parsed = Number(normalized);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return {
      success: false as const,
      message: "Debe ser un entero mayor o igual a 0.",
    };
  }

  return {
    success: true as const,
    value: parsed,
  };
}

function hasStructureErrors(structureErrors: RoutineFormState["structureErrors"]) {
  if (structureErrors.days) {
    return true;
  }

  return Object.values(structureErrors.dayErrors).some(
    (dayError) =>
      Boolean(dayError.dayName) ||
      Boolean(dayError.items) ||
      Object.keys(dayError.itemErrors).length > 0,
  );
}
