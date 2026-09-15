import { z } from "zod";

/**
 * Contrato de sincronización del registro de entrenamiento (cliente ⇄ POST /api/workouts/sync).
 * La cola offline vive en los teléfonos y sobrevive a los deploys: un cambio incompatible
 * exige una versión nueva, y el servidor tiene que seguir aceptando la anterior.
 */
export const WORKOUT_SYNC_VERSION = 1;

export const MAX_SETS_PER_EXERCISE = 20;

export const exerciseKindSchema = z.enum(["reps", "bodyweight", "time"]);

/** Serie por posición. `kg` en `bodyweight` es el lastre. `secs` solo en `time`. */
export const workoutSetSchema = z.object({
  kg: z.number().min(0).max(1000).nullable(),
  reps: z.number().int().min(0).max(1000).nullable(),
  secs: z.number().int().min(0).max(36_000).nullable(),
  done: z.boolean(),
});

export const syncItemSchema = z.object({
  id: z.uuid(),
  routineItemId: z.uuid(),
  kind: exerciseKindSchema,
  target: z.string().max(40),
  sets: z.array(workoutSetSchema).max(MAX_SETS_PER_EXERCISE),
  rev: z.number().int().nonnegative(),
});

export const syncSessionSchema = z.object({
  id: z.uuid(),
  savedRoutineId: z.uuid(),
  routineDayId: z.uuid(),
  /** El usuario tocó "Terminar entrenamiento". No es requisito para que la sesión cuente. */
  finished: z.boolean(),
  items: z.array(syncItemSchema).max(40),
});

export const syncRequestSchema = z.object({
  v: z.literal(WORKOUT_SYNC_VERSION),
  userId: z.uuid(),
  sessions: z.array(syncSessionSchema).min(1).max(10),
});

export type ExerciseKind = z.infer<typeof exerciseKindSchema>;
export type WorkoutSet = z.infer<typeof workoutSetSchema>;
export type SyncItem = z.infer<typeof syncItemSchema>;
export type SyncSession = z.infer<typeof syncSessionSchema>;
export type SyncRequest = z.infer<typeof syncRequestSchema>;

export type SyncItemResult =
  | { clientId: string; id: string; status: "ok"; rev: number }
  /** El servidor ya tiene una versión más nueva: el cliente adopta `sets`. */
  | { clientId: string; id: string; status: "stale"; rev: number; sets: WorkoutSet[] }
  | { clientId: string; status: "error"; message: string };

export type SyncSessionResult = {
  id: string;
  status: "ok" | "error";
  message?: string;
  items: SyncItemResult[];
};

export type SyncResponse = {
  v: typeof WORKOUT_SYNC_VERSION;
  sessions: SyncSessionResult[];
};

export type SyncErrorCode = "unauthenticated" | "invalid_payload" | "wrong_user" | "forbidden_origin";
